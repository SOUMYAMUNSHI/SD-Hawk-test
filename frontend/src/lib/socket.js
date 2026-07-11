import { io } from 'socket.io-client';

// Connect to the Node.js backend running on port 5000
// In production, this would use process.env.NEXT_PUBLIC_API_URL
const URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const socket = io(URL, {
  autoConnect: false, // We will manually connect in the components that need it
});
