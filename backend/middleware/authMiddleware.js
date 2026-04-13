const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dems-secret-key');
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          role_id: true,
          full_name: true,
          email: true
        }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check if user's role_id matches any of the allowed roles
    // role_id: 1=admin, 2=organizer, 3=attendee, 4=staff, 5=security
    const allowedRoleIds = {
      'admin': [1],
      'organizer': [1, 2],
      'attendee': [1, 2, 3],
      'staff': [1, 2, 4],
      'security': [1, 2, 5]
    };
    
    const allowed = roles.some(role => allowedRoleIds[role]?.includes(req.user.role_id));
    
    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    
    next();
  };
};

module.exports = { protect, authorize };
