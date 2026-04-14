// Simple rate limiting middleware (fallback if express-rate-limit not available)
const rateLimit = {};

// Simple in-memory rate limiter
const simpleLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const timestamps = requests.get(ip).filter(time => now - time < windowMs);
    
    if (timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.'
      });
    }
    
    timestamps.push(now);
    requests.set(ip, timestamps);
    next();
  };
};

// Try to use express-rate-limit if available, otherwise use simple limiter
let limiter, authLimiter;

try {
  const rateLimit = require('express-rate-limit');
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  });
  
  authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    skipSuccessfulRequests: true,
    message: {
      success: false,
      message: 'Too many login attempts, please try again after 1 hour'
    }
  });
} catch (error) {
  console.log('⚠️ Using simple rate limiter (express-rate-limit not available)');
  limiter = simpleLimiter(15 * 60 * 1000, 100);
  authLimiter = simpleLimiter(60 * 60 * 1000, 5);
}

module.exports = { limiter, authLimiter };
