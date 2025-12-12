import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/database';
import orderRoutes from './routes/orders';
import ratingRoutes from './routes/ratings';
import { getRabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/orders';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/ratings', ratingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Order Service',
    version: '1.0.0',
    description: 'Order management and ratings',
    endpoints: {
      health: '/health',
      orders: '/api/orders',
      ratings: '/api/ratings',
    },
  });
});

// Connect to MongoDB
connectDB(MONGO_URI).then(() => {
  console.log('✅ Order Service - MongoDB connected');

  // Start server
  app.listen(PORT, async () => {
    console.log(`📋 Order Service running on port ${PORT}`);
    try {
      const { registerService } = await import('../shared/consul');
      await registerService('order-service', Number(PORT), process.env.CONSUL_HOST || 'consul', 8500);
    } catch (error) {
      console.error('❌ Consul registration failed (non-critical):', error);
    }
  });
});

// Connect to RabbitMQ
getRabbitMQClient()
  .then(() => {
    console.log('✅ Order Service - RabbitMQ connected');
  })
  .catch((error) => {
    console.error('❌ Order Service - RabbitMQ connection failed:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});

