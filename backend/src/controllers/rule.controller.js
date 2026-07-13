import Rule from '../models/Rule.model.js';

export const getRules = async (req, res) => {
  try {
    const rules = await Rule.find({ user: req.user._id }).populate('camera', 'name status');
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRule = async (req, res) => {
  const { name, camera, objectType, ruleType, timeRange, includeSnapshot, severity, isActive } = req.body;

  try {
    const rule = await Rule.create({
      user: req.user._id,
      name,
      camera,
      objectType,
      ruleType,
      timeRange,
      includeSnapshot,
      severity,
      isActive
    });
    
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findById(req.params.id);

    if (rule) {
      if (rule.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
      }
      await rule.deleteOne();
      res.json({ message: 'Rule removed' });
    } else {
      res.status(404).json({ message: 'Rule not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
