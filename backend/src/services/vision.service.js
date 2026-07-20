import { io } from '../server.js';
import Rule from '../models/Rule.model.js';
import Camera from '../models/Camera.model.js';
import Event from '../models/Event.model.js';
import { generateSecurityAlert, evaluateCustomPrompt } from './ai.service.js';
import { sendAlertEmail } from './email.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPolling = false;
let pollingInterval = null;
const lastAlertTime = new Map();

export const initVisionService = async () => {
  console.log('Vision polling service initialized.');
  
  let synced = false;
  let attempts = 0;
  while (!synced && attempts < 15) {
    try {
      const res = await fetch('http://127.0.0.1:8000/sync_cameras', { method: 'POST', body: '{}' });
      // If we get a response, Python is up!
      await syncCamerasToPython();
      synced = true;
    } catch (e) {
      console.log('Waiting for Python Vision Service to start (this takes a few seconds)...');
      attempts++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!synced) {
     console.error('CRITICAL: Could not reach Python Vision Service after 30 seconds.');
  }

  startPolling();
};

export const syncCamerasToPython = async () => {
  try {
    const cameras = await Camera.find();
    const payload = cameras.map(c => ({ id: c._id.toString(), source: c.streamUrl || '0' }));
    const res = await fetch('http://127.0.0.1:8000/sync_cameras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cameras: payload })
    });
    if (res.ok) {
      console.log('Successfully synced cameras to Vision Service');
    }
  } catch (error) {
    console.error('Failed to sync cameras to Vision Service:', error.message);
  }
};

let isProcessingTick = false;

export const startPolling = () => {
  if (isPolling) return;
  isPolling = true;
  console.log('Started polling Python Vision Service...');

  pollingInterval = setInterval(async () => {
    if (isProcessingTick) return;
    isProcessingTick = true;
    try {
      const response = await fetch('http://127.0.0.1:8000/detect');
      const data = await response.json();

      if (data && data.status === 'success') {
        const activeRules = await Rule.find({ isActive: true }).populate('camera').populate('user', 'email name');

        // data.data is a dict of { [camera_id]: [objects] }
        for (const [cameraId, detections] of Object.entries(data.data)) {
          if (detections.length > 0) {
            io.emit('new_detection', {
              cameraId: cameraId,
              timestamp: new Date().toISOString(),
              objects: detections
            });
          }

          // Logic Engine: Filter rules for this specific camera
          const cameraRules = activeRules.filter(r => r.camera && r.camera._id.toString() === cameraId);

          for (const rule of cameraRules) {
            try {
              if (rule.camera.aiEnabled === false) continue;

              // 2. Check time-based logic
              const now = new Date();
              const currentHour = now.getHours().toString().padStart(2, '0');
              const currentMinute = now.getMinutes().toString().padStart(2, '0');
              const currentTimeStr = `${currentHour}:${currentMinute}`;
              const startStr = rule.timeRange?.start || '00:00';
              const endStr = rule.timeRange?.end || '23:59';

              let isWithinTime = false;
              if (startStr <= endStr) {
                isWithinTime = (currentTimeStr >= startStr && currentTimeStr <= endStr);
              } else {
                isWithinTime = (currentTimeStr >= startStr || currentTimeStr <= endStr);
              }
              if (!isWithinTime) continue;

              // 3. Filter detections by Virtual Trigger Zone
              let validDetections = detections;
              if (rule.triggerZone && rule.triggerZone.width > 0) {
                const zx1 = rule.triggerZone.x;
                const zy1 = rule.triggerZone.y;
                const zx2 = zx1 + rule.triggerZone.width;
                const zy2 = zy1 + rule.triggerZone.height;

                validDetections = detections.filter(d => {
                  if (!d.nbox) return true; // fallback if no nbox
                  const [ox1, oy1, ox2, oy2] = d.nbox;
                  return ox1 < zx2 && ox2 > zx1 && oy1 < zy2 && oy2 > zy1;
                });
              }

              // 4. Evaluate Rule Type
              const ruleType = rule.ruleType || 'Include';
              let ruleViolatingDetection = null;

              if (ruleType === 'Include' || ruleType === 'AI Custom') {
                ruleViolatingDetection = validDetections.find(d => d.type === rule.objectType);
              } else if (ruleType === 'Exclude') {
                if (validDetections.length > 0) {
                  ruleViolatingDetection = validDetections.find(d => d.type !== rule.objectType);
                }
              }

              if (ruleViolatingDetection) {
                const lastAlert = lastAlertTime.get(rule._id.toString()) || 0;
                
                if (Date.now() - lastAlert > 60000) { 
                  let localSnapshotPath = null;
                  let snapshotUrl = 'unavailable_in_this_version';

                  // Always fetch snapshot if AI Custom or if includeSnapshot is true
                  if (rule.includeSnapshot !== false || ruleType === 'AI Custom') {
                    try {
                      const snapRes = await fetch(`http://127.0.0.1:8000/snapshot?camera_id=${cameraId}&boxes=1`);
                      if (snapRes.ok) {
                         const buffer = await snapRes.arrayBuffer();
                         const filename = `snap_${Date.now()}.jpg`;
                         const publicDir = path.join(__dirname, '..', '..', 'public', 'snapshots');
                         await fs.promises.mkdir(publicDir, { recursive: true });
                         localSnapshotPath = path.join(publicDir, filename);
                         await fs.promises.writeFile(localSnapshotPath, Buffer.from(buffer));
                         snapshotUrl = `/snapshots/${filename}`;
                      }
                    } catch (e) {
                      console.error('Failed to get snapshot:', e);
                    }
                  }

                  let aiSummary = '';
                  
                  if (ruleType === 'AI Custom') {
                    if (!localSnapshotPath) {
                      console.warn('Cannot run AI Custom rule without a snapshot. Skipping.');
                      continue;
                    }
                    const base64Image = fs.readFileSync(localSnapshotPath, { encoding: 'base64' });
                    const groqRes = await evaluateCustomPrompt(base64Image, rule.customPrompt);
                    
                    if (!groqRes.alert) {
                       continue; // Groq says no issue, don't alert
                    }
                    aiSummary = `SD-Hawk Vision AI: ${groqRes.reason}`;
                  } else {
                    aiSummary = await generateSecurityAlert(rule, ruleViolatingDetection);
                  }

                  // 🚨 Only trigger the 60-second cooldown if an alert is ACTUALLY being sent!
                  lastAlertTime.set(rule._id.toString(), Date.now());

                  console.log(`🚨 Rule Broken: ${rule.name}. Triggering Alert...`);

                  await Event.create({
                    camera: rule.camera._id,
                    ruleTriggered: rule._id,
                    confidence: ruleViolatingDetection.confidence,
                    snapshotUrl: snapshotUrl,
                    aiSummary: aiSummary
                  });

                  if (rule.user && rule.user.email) {
                    await sendAlertEmail(
                      rule.user.email,
                      `Security Alert: ${rule.name}`,
                      aiSummary,
                      localSnapshotPath
                    );
                  }
                }
              }
            } catch (err) {
              console.error(`Error processing rule ${rule._id}:`, err);
            }
          }
        }
      }
    } catch (error) {
      if (error.cause && error.cause.code === 'ECONNREFUSED') {
         io.emit('vision_status', { status: 'offline', message: 'Vision Service Offline' });
      } else {
         console.error('Vision Polling Error:', error);
      }
    } finally {
      isProcessingTick = false;
    }
  }, 1000); // Poll every 1 second
};

export const stopPolling = () => {
  isPolling = false;
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
  console.log('Stopped polling Python Vision Service.');
};
