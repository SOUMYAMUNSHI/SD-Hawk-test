import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
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
    ruleType: {
      type: String,
      enum: ['Include', 'Exclude', 'AI Custom'],
      default: 'Include',
      description: 'Include: Alert ON objectType. Exclude: Alert on anything EXCEPT objectType. AI Custom: Use Groq Vision.',
    },
    customPrompt: {
      type: String,
      default: '',
      description: 'The prompt to send to Groq Vision API when using AI Custom rule type.',
    },
    triggerZone: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    timeRange: {
      start: { type: String, default: '00:00' }, // HH:mm format
      end: { type: String, default: '23:59' },
    },
    includeSnapshot: {
      type: Boolean,
      default: true,
      description: 'Whether to attach a camera snapshot to the alert',
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
