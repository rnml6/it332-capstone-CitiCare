import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const authorizeAdmin = (req, res, next) => {
  // Check for both 'Administrator' (from DB) and 'admin' (lowercase)
  if (req.user?.role !== 'Barangay Administrator' && req.user?.role !== 'admin' && req.user?.role !== 'BHW Admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

export const authorizeBHW = (req, res, next) => {
  if (req.user?.role !== 'BHW Worker' && req.user?.role !== 'BHW Admin' && req.user?.role !== 'Administrator' && req.user?.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'BHW access required' 
    });
  }
  next();
};