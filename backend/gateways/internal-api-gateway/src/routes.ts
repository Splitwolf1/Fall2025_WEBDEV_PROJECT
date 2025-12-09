import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { serviceAuth } from './middleware/serviceAuth';

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
// INTERNAL ROUTES (Service-to-Service only)
// ============================================

// User Service (for service-to-service user lookups)
router.use(
    '/internal/users',
    serviceAuth,
    createProxyMiddleware({
        target: USER_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            '^/internal/users': '/api/users',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res: any) => {
            console.error('Internal proxy error (user):', err);
            res.status(502).json({
                error: 'Service Unavailable',
                message: 'User service is unavailable',
            });
        },
    })
);

// Product Service (for internal product queries)
router.use(
    '/internal/products',
    serviceAuth,
    createProxyMiddleware({
        target: PRODUCT_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            '^/internal/products': '/api/products',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res: any) => {
            console.error('Internal proxy error (product):', err);
            res.status(502).json({
                error: 'Service Unavailable',
                message: 'Product service is unavailable',
            });
        },
    })
);

// Order Service (for internal order queries)
router.use(
    '/internal/orders',
    serviceAuth,
    createProxyMiddleware({
        target: ORDER_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            '^/internal/orders': '/api/orders',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res: any) => {
            console.error('Internal proxy error (order):', err);
            res.status(502).json({
                error: 'Service Unavailable',
                message: 'Order service is unavailable',
            });
        },
    })
);

// Delivery Service (for internal delivery queries)
router.use(
    '/internal/deliveries',
    serviceAuth,
    createProxyMiddleware({
        target: DELIVERY_SERVICE,
        changeOrigin: true,
        pathRewrite: {
            '^/internal/deliveries': '/api/deliveries',
        },
        timeout: 10000,
        proxyTimeout: 10000,
        onError: (err, req, res: any) => {
            console.error('Internal proxy error (delivery):', err);
            res.status(502).json({
                error: 'Service Unavailable',
                message: 'Delivery service is unavailable',
            });
        },
    })
);

export default router;
