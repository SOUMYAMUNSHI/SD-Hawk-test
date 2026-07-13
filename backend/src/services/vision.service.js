import { io } from '../server.js';
import Rule from '../models/Rule.model.js';
import Camera from '../models/Camera.model.js';
import Event from '../models/Event.model.js';
import { generateSecurityAlert } from './ai.service.js';
import { sendAlertEmail } from './email.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPolling = false;
let pollingInterval = null;
const lastAlertTime = new Map();

export const initVisionService = () => {
  console.log('Vision polling service initialized.');
  startPolling();
};

export const startPolling = () => {
  if (isPolling) return;
  isPolling = true;
  console.log('Started polling Python Vision Service...');

  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/detect');
      const data = await response.json();

      if (data && data.status === 'success') {
        const detections = data.data.objects; // Array of {type, confidence, box}

        if (detections.length > 0) {
          // Emit the detections to all connected frontend clients
          io.emit('new_detection', {
            timestamp: new Date().toISOString(),
            objects: detections
          });

          // Logic Engine: Check if detections violate any active rules
          const activeRules = await Rule.find({ isActive: true }).populate('camera').populate('user', 'email name');

          for (const rule of activeRules) {
            try {
              // 1. Check if the camera exists and has AI enabled
              if (!rule.camera || rule.camera.aiEnabled === false) {
                continue;
              }

              // 2. Check time-based logic
              const now = new Date();
              const currentHour = now.getHours().toString().padStart(2, '0');
              const currentMinute = now.getMinutes().toString().padStart(2, '0');
              const currentTimeStr = `${currentHour}:${currentMinute}`;

              const startStr = rule.timeRange?.start || '00:00';
              const endStr = rule.timeRange?.end || '23:59';

              let isWithinTime = false;
              if (startStr <= endStr) {
                // Normal range (e.g. 08:00 to 18:00)
                isWithinTime = (currentTimeStr >= startStr && currentTimeStr <= endStr);
              } else {
                // Overnight range (e.g. 22:00 to 06:00)
                isWithinTime = (currentTimeStr >= startStr || currentTimeStr <= endStr);
              }

              if (!isWithinTime) {
                continue; // Skip this rule because it's outside the active time window
              }

              // 3. Evaluate Rule Type (Include vs Exclude)
              const ruleType = rule.ruleType || 'Include';
              let ruleViolatingDetection = null;

              if (ruleType === 'Include') {
                // Alert if the specific object IS detected
                ruleViolatingDetection = detections.find(d => d.type === rule.objectType);
              } else if (ruleType === 'Exclude') {
                // Alert if ANY object that is NOT the specific object is detected
                ruleViolatingDetection = detections.find(d => d.type !== rule.objectType);
              }

              if (ruleViolatingDetection) {
                // Basic cooldown to prevent email spam (1 alert per rule per 60 seconds)
                const lastAlert = lastAlertTime.get(rule._id.toString()) || 0;

                if (Date.now() - lastAlert > 60000) { // 60 seconds cooldown
                  lastAlertTime.set(rule._id.toString(), Date.now());

                  console.log(`🚨 Rule Broken: ${rule.name}. Triggering AI Alert...`);

                  // 1. Generate AI Summary
                  const aiSummary = await generateSecurityAlert(rule, ruleViolatingDetection);

                  // 1.5 Fetch Snapshot if rule requires it
                  let snapshotUrl = 'unavailable_in_this_version';
                  let localSnapshotPath = null;
                  
                  if (rule.includeSnapshot !== false) {
                    try {
                      // We fetch the snapshot with boxes=1 for email attachments as requested
                      const snapRes = await fetch('http://127.0.0.1:8000/snapshot?boxes=1');
                      if (snapRes.ok) {
                         const buffer = await snapRes.arrayBuffer();
                         const filename = `snap_${Date.now()}.jpg`;
                         const publicDir = path.join(__dirname, '..', '..', 'public', 'snapshots');
                         localSnapshotPath = path.join(publicDir, filename);
                         await fs.promises.writeFile(localSnapshotPath, Buffer.from(buffer));
                         snapshotUrl = `/snapshots/${filename}`;
                      }
                    } catch (e) {
                      console.error('Failed to get snapshot:', e);
                    }
                  }

                  // 2. Log Event to DB
                  await Event.create({
                    camera: rule.camera._id,
                    ruleTriggered: rule._id,
                    confidence: ruleViolatingDetection.confidence,
                    snapshotUrl: snapshotUrl,
                    aiSummary: aiSummary
                  });

                  // 3. Send Email
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
