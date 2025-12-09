import { Request, Response, NextFunction } from 'express';

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-production';

/**
 * Middleware to authenticate service-to-service calls
 * Uses a simple API key for now (can be enhanced with mutual TLS later)
 */
export const serviceAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const apiKey = req.headers['x-internal-api-key'];

    if (!apiKey || apiKey !== INTERNAL_API_KEY) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid or missing internal API key',
        });
    }

    next();
};
