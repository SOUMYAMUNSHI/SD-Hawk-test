import express from 'express';
import { getCameras, createCamera, updateCamera, deleteCamera } from '../controllers/camera.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCameras)
  .post(protect, createCamera);

router.route('/:id')
  .put(protect, updateCamera)
  .delete(protect, deleteCamera);

export default router;
