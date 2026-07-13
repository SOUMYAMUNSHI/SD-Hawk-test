import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import cameraRoutes from './routes/camera.routes.js';
import ruleRoutes from './routes/rule.routes.js';
import eventRoutes from './routes/event.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static snapshots

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/events', eventRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
