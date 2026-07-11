import Event from '../models/Event.model.js';

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('cameraId', 'name')
      .populate('ruleId', 'targetObject')
      .sort('-timestamp')
      .limit(50); // Get latest 50 events for dashboard
      
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
