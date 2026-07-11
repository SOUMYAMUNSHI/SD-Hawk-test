import express from 'express';
import { getEvents } from '../controllers/event.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Events feed is fetch-only for the dashboard
router.route('/').get(protect, getEvents);

export default router;
