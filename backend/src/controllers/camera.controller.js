import Camera from '../models/Camera.model.js';
import { io } from '../server.js';

// @desc    Get all cameras
// @route   GET /api/cameras
// @access  Private
export const getCameras = async (req, res) => {
  try {
    const cameras = await Camera.find({ user: req.user._id });
    res.json(cameras);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a camera
// @route   POST /api/cameras
// @access  Private
export const createCamera = async (req, res) => {
  const { name, source, type } = req.body;

  try {
    const camera = await Camera.create({
      user: req.user._id,
      name,
      source,
      type
    });
    
    io.emit('camera_added', camera);
    res.status(201).json(camera);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a camera
// @route   PUT /api/cameras/:id
// @access  Private
export const updateCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);

    if (camera) {
      // Make sure user owns camera
      if (camera.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
      }

      camera.name = req.body.name || camera.name;
      camera.source = req.body.source || camera.source;
      camera.type = req.body.type || camera.type;
      camera.status = req.body.status || camera.status;
      
      if (req.body.aiEnabled !== undefined) {
        camera.aiEnabled = req.body.aiEnabled;
      }
      if (req.body.showBoundingBoxes !== undefined) {
        camera.showBoundingBoxes = req.body.showBoundingBoxes;
      }

      const updatedCamera = await camera.save();
      io.emit('camera_updated', updatedCamera);
      res.json(updatedCamera);
    } else {
      res.status(404).json({ message: 'Camera not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a camera
// @route   DELETE /api/cameras/:id
// @access  Private
export const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);

    if (camera) {
      if (camera.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
      }

      await camera.deleteOne();
      io.emit('camera_deleted', req.params.id);
      res.json({ message: 'Camera removed' });
    } else {
      res.status(404).json({ message: 'Camera not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
