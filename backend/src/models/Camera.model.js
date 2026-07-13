import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a camera name'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Webcam', 'IP', 'CCTV'],
      required: [true, 'Please specify the camera type'],
    },
    streamUrl: {
      type: String,
      required: [true, 'Please add a stream URL or device ID'],
    },
    status: {
      type: String,
      enum: ['Online', 'Offline'],
      default: 'Offline',
    },
    aiEnabled: {
      type: Boolean,
      default: true,
      description: 'Toggle to enable/disable AI rules processing for this camera',
    },
    showBoundingBoxes: {
      type: Boolean,
      default: true,
      description: 'Toggle to show/hide purple bounding boxes on live feed',
    },
    location: {
      type: String,
      description: 'Physical location of the camera',
    },
    zones: [
      {
        name: String,
        coordinates: [[Number]], // Array of [x, y] coordinates for polygons
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Camera', cameraSchema);
