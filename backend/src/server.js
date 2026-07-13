import 'dotenv/config';
import http from 'http';

import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initVisionService } from './services/vision.service.js';


const PORT = process.env.PORT || 5000;

// Create HTTP server manually to bind Socket.IO
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    // Connect to database
    await connectDB(); 

    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      // Start the background vision poller
      initVisionService();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
