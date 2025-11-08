import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Key generator that uses user ID for authenticated users, IP for others
const keyGenerator = (req: Request) => {
  // If user is authenticated, use their ID instead of IP
  const user = (req as any).user;
  if (user && (user.userId || user.id)) {
    return `user-${user.userId || user.id}`;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// General API rate limiter - more lenient for authenticated users
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 500 : 200, // Much higher limit in dev, higher for prod
  keyGenerator: keyGenerator,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Strict limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 200 : 50, // More lenient in development
  keyGenerator: keyGenerator,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chatbot rate limiter
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 messages per minute
  message: {
    success: false,
    message: 'Too many messages, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
