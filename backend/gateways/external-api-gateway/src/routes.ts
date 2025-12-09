import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken, requireAuth } from './middleware/auth';
import { apiLimiter, authLimiter, chatLimiter } from './middleware/rateLimiter';

const router = Router();

// Service URLs - use container names for Docker network
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3002';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3003';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://order-service:3004';
const DELIVERY_SERVICE = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3005';
const HEALTH_SERVICE = process.env.HEALTH_SERVICE_URL || 'http://health-service:3006';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
const CHATBOT_SERVICE = process.env.CHATBOT_SERVICE_URL || 'http://chatbot-service:3008';

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Auth Service routes (login, register)
router.use(
    '/api/auth',
    authLimiter,
    createProxyMiddleware({
        target: AUTH_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (auth):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Auth service is unavailable',
            });
        },
    })
);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// User Service routes (profile management)
router.use(
    '/api/users',
    authenticateToken,
    requireAuth,
    apiLimiter,
    createProxyMiddleware({
        target: USER_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            // Forward user info from JWT
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Email', req.user.email);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (user):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'User service is unavailable',
            });
        },
    })
);

// Product Service routes
router.use(
    '/api/products',
    authenticateToken,
    apiLimiter,
    createProxyMiddleware({
        target: PRODUCT_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (product):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Product service is unavailable',
            });
        },
    })
);

// Order Service routes
router.use(
    '/api/orders',
    authenticateToken,
    requireAuth,
    apiLimiter,
    createProxyMiddleware({
        target: ORDER_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (order):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Order service is unavailable',
            });
        },
    })
);

// Ratings routes (handled by order service)
router.use(
    '/api/ratings',
    authenticateToken,
    requireAuth,
    apiLimiter,
    createProxyMiddleware({
        target: ORDER_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (ratings):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Rating service is unavailable',
            });
        },
    })
);

// Delivery Service routes
router.use(
    '/api/deliveries',
    authenticateToken,
    requireAuth,
    apiLimiter,
    createProxyMiddleware({
        target: DELIVERY_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (delivery):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Delivery service is unavailable',
            });
        },
    })
);

// Fleet Management routes
router.use(
    '/api/fleet',
    authenticateToken,
    requireAuth,
    apiLimiter,
    createProxyMiddleware({
        target: DELIVERY_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (fleet):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Fleet service is unavailable',
            });
        },
    })
);

// Health/Inspection Service routes
router.use(
    '/api/inspections',
    authenticateToken,
    requireAuth,
    apiLimiter,
    createProxyMiddleware({
        target: HEALTH_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (health):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Health service is unavailable',
            });
        },
    })
);

// Chatbot Service routes
router.use(
    '/api/chat',
    chatLimiter,
    createProxyMiddleware({
        target: CHATBOT_SERVICE,
        changeOrigin: true,
        timeout: 30000,
        proxyTimeout: 30000,
        onProxyReq: (proxyReq, req: any) => {
            if (req.user) {
                proxyReq.setHeader('X-User-Id', req.user.userId);
                proxyReq.setHeader('X-User-Role', req.user.role);
            }
            if (req.body) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onError: (err, req, res: any) => {
            console.error('Proxy error (chatbot):', err);
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Chatbot service is unavailable',
            });
        },
    })
);

export default router;
