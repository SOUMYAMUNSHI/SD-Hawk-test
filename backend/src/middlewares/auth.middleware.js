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
    let firstUser = await User.findOne();
    if (!firstUser) {
      console.log('No users found in DB. Auto-creating default Admin user for local testing.');
      firstUser = await User.create({ name: 'Admin', email: 'admin@sdhawk.com', password: 'password123' });
    }
    req.user = firstUser;
    return next();
  }
};
