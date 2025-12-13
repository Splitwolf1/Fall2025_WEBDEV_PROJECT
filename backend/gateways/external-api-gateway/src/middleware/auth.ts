import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

/**
 * Middleware to authenticate JWT tokens from Authorization header
 * Extracts token and verifies it, attaching user info to request
 */
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // Allow request to pass through - some routes are public
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    } catch (error: any) {
        // Return 401 for expired/invalid tokens (not 403)
        return res.status(401).json({
            success: false,
            message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        });
    }
};

/**
 * Middleware to require authentication
 * Use after authenticateToken to enforce authentication
 */
export const requireAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }
    next();
};

/**
 * Middleware to require specific role(s)
 */
export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required roles: ${roles.join(', ')}`,
            });
        }

        next();
    };
};
