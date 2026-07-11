import { checkHealth } from '../services/health.service.js';

export const getHealthStatus = (req, res, next) => {
  try {
    const status = checkHealth();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};
