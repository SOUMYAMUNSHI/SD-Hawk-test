import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a rule name (e.g., Nighttime Person Detection)'],
    },
    camera: {
      type: mongoose.Schema.ObjectId,
      ref: 'Camera',
      required: true,
    },
    objectType: {
      type: String,
      required: [true, 'Please specify the object type to detect (e.g., person, car)'],
    },
    timeRange: {
      start: { type: String, default: '00:00' }, // HH:mm format
      end: { type: String, default: '23:59' },
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'Critical'],
      default: 'Medium',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Rule', ruleSchema);
