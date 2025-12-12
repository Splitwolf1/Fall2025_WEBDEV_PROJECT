import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 * 500 requests per 15 minutes per IP (increased for development)
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Max 500 requests per windowMs (was 100)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stricter rate limiter for authentication endpoints
 * 20 login attempts per 15 minutes per IP (increased for development)
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 requests per windowMs (was 5)
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for chatbot
 * 20 requests per minute
 */
export const chatLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    message: 'Too many chat requests, please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});
