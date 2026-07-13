import { io } from '../server.js';
import Rule from '../models/Rule.model.js';
import Event from '../models/Event.model.js';
import { generateSecurityAlert } from './ai.service.js';
import { sendAlertEmail } from './email.service.js';

let isPolling = false;
let pollingInterval = null;
const lastAlertTime = new Map();

export const initVisionService = () => {
  console.log('Vision polling service initialized.');

  // Start polling automatically for now, but in production this should be toggled by the UI
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
          for (const detection of detections) {
            // Find active rules targeting this object type (e.g., 'person', 'cell phone')
            const brokenRules = await Rule.find({
              objectType: detection.type,
              isActive: true
            }).populate('user', 'email name');

            for (const rule of brokenRules) {
              try {
                // Basic cooldown to prevent email spam (1 alert per rule per 60 seconds)
                const now = Date.now();
                const lastAlert = lastAlertTime.get(rule._id.toString()) || 0;

                if (now - lastAlert > 60000) { // 60 seconds cooldown
                  lastAlertTime.set(rule._id.toString(), now);

                  console.log(`🚨 Rule Broken: ${rule.name}. Triggering AI Alert...`);

                  // 1. Generate AI Summary
                  const aiSummary = await generateSecurityAlert(rule, detection);

                  // 2. Log Event to DB
                  await Event.create({
                    camera: rule.camera,
                    ruleTriggered: rule._id,
                    confidence: detection.confidence,
                    snapshotUrl: 'unavailable_in_this_version',
                    aiSummary: aiSummary
                  });

                  // 3. Send Email
                  if (rule.user && rule.user.email) {
                    await sendAlertEmail(
                      rule.user.email,
                      `Security Alert: ${rule.name}`,
                      aiSummary
                    );
                  }
                }
              } catch (err) {
                console.error(`Error processing rule ${rule._id}:`, err);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error.cause && error.cause.code === 'ECONNREFUSED') {
         // Silently ignore if python is off
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
