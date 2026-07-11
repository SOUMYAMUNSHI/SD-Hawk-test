import { io } from '../server.js';

let isPolling = false;
let pollingInterval = null;

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
        }
      }
    } catch (error) {
      // If Python service is off, silently fail or emit a status error
      io.emit('vision_status', { status: 'offline', message: error.message });
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
