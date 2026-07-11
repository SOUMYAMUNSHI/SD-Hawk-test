import express from 'express';
import { getRules, createRule, deleteRule } from '../controllers/rule.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getRules)
  .post(protect, createRule);

router.route('/:id')
  .delete(protect, deleteRule);

export default router;
