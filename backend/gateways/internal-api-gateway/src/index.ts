import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`[INTERNAL] [${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'internal-api-gateway',
        timestamp: new Date().toISOString(),
        port: PORT,
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        service: 'Farm-to-Table Internal API Gateway',
        version: '1.0.0',
        description: 'Gateway for service-to-service communication',
        endpoints: {
            health: '/health',
            users: '/internal/users',
            products: '/internal/products',
            orders: '/internal/orders',
            deliveries: '/internal/deliveries',
        },
    });
});

// API routes
app.use(routes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Internal Gateway Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🔒 Internal API Gateway running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Service-to-service communication only`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️ Shutting down gracefully...');
    process.exit(0);
});
