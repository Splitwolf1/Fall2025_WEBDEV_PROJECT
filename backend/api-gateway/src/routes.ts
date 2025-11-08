import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authenticateToken, requireAuth } from './middleware/auth';
import { apiLimiter, authLimiter, chatLimiter } from './middleware/rateLimiter';

const router = Router();

// Service URLs (from environment or defaults)
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
const DELIVERY_SERVICE = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004';
const HEALTH_SERVICE = process.env.HEALTH_SERVICE_URL || 'http://health-service:3005';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
const CHATBOT_SERVICE = process.env.CHATBOT_SERVICE_URL || 'http://chatbot-service:3007';

// User Service routes (auth endpoints)
router.use(
  '/api/auth',
  authLimiter,
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/api/auth',
    },
    timeout: 30000, // 30 second timeout
    proxyTimeout: 30000,
    // Forward parsed body correctly
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.path} -> ${USER_SERVICE}${req.path}`);
      
      // If body was parsed by express.json(), re-stringify it for forwarding
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyString = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyString));
        proxyReq.write(bodyString);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy] Proxy error:', {
        message: err.message,
        code: err.code,
        path: req.path,
      });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Service unavailable. Please try again.',
          error: err.message,
        });
      }
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
    pathRewrite: {
      '^/api/products': '/api/products',
    },
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.path} -> ${PRODUCT_SERVICE}${req.path}`);
      
      // If body was parsed by express.json(), re-stringify it for forwarding
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyString = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyString));
        proxyReq.write(bodyString);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy] Product proxy error:', {
        message: err.message,
        code: err.code,
        path: req.path,
      });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Product service unavailable. Please try again.',
          error: err.message,
        });
      }
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
    pathRewrite: {
      '^/api/orders': '/api/orders',
    },
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.path} -> ${ORDER_SERVICE}${req.path}`);
      
      // If body was parsed by express.json(), re-stringify it for forwarding
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyString = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyString));
        proxyReq.write(bodyString);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy] Order proxy error:', {
        message: err.message,
        code: err.code,
        path: req.path,
      });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Order service unavailable. Please try again.',
          error: err.message,
        });
      }
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
    pathRewrite: {
      '^/api/deliveries': '/api/deliveries',
    },
  })
);

// Fleet Management routes (vehicles and drivers)
router.use(
  '/api/fleet',
  authenticateToken,
  requireAuth,
  apiLimiter,
  createProxyMiddleware({
    target: DELIVERY_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      '^/api/fleet': '/api/fleet',
    },
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] ${req.method} ${req.path} -> ${DELIVERY_SERVICE}${req.path}`);
      
      // If body was parsed by express.json(), re-stringify it for forwarding
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyString = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyString));
        proxyReq.write(bodyString);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy] Fleet proxy error:', {
        message: err.message,
        code: err.code,
        path: req.path,
      });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Fleet service unavailable. Please try again.',
          error: err.message,
        });
      }
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
    pathRewrite: {
      '^/api/inspections': '/api/inspections',
    },
  })
);

// Notification Service routes
router.use(
  '/api/notify',
  authenticateToken,
  requireAuth,
  apiLimiter,
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      '^/api/notify': '/api/notify',
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
    pathRewrite: {
      '^/api/chat': '/api/chat',
    },
  })
);

export default router;
