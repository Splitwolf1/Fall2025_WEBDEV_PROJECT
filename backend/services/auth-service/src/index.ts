import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/database';
import authRoutes from './routes/auth';
import { getRabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/users';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        service: 'Auth Service',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            register: '/api/auth/register',
            login: '/api/auth/login',
        },
    });
});

// Connect to MongoDB
connectDB(MONGO_URI).then(() => {
    console.log('✅ Auth Service - MongoDB connected');

    // Start server
    app.listen(PORT, async () => {
        console.log(`🔐 Auth Service running on port ${PORT}`);

        // Register with Consul
        try {
            const { registerService } = await import('../shared/consul');
            await registerService(
                'auth-service',
                Number(PORT),
                process.env.CONSUL_HOST || 'consul',
                8500
            );
        } catch (error) {
            console.error('❌ Consul registration failed (non-critical):', error);
        }
    });
});

// Connect to RabbitMQ
getRabbitMQClient()
    .then(() => {
        console.log('✅ Auth Service - RabbitMQ connected');
    })
    .catch((error) => {
        console.error('❌ Auth Service - RabbitMQ connection failed:', error);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⚠️ Shutting down gracefully...');
    process.exit(0);
});
