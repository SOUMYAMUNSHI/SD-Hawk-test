import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Auto-login for local MVP testing
  if (!token) {
    const firstUser = await User.findOne();
    if (firstUser) {
      req.user = firstUser;
      return next();
    } else {
      return res.status(401).json({ message: 'Not authorized, no token and no users in DB' });
    }
  }
};
