import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/database';
import productRoutes from './routes/products';
import { getRabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/products';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'product-service',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Product Service',
    version: '1.0.0',
    description: 'Product catalog and inventory management',
    endpoints: {
      health: '/health',
      products: '/api/products',
    },
  });
});

// Connect to MongoDB
connectDB(MONGO_URI).then(() => {
  console.log('✅ Product Service - MongoDB connected');

  // Start server
  app.listen(PORT, async () => {
    console.log(`📦 Product Service running on port ${PORT}`);

    // Register with Consul
    try {
      const { registerService } = await import('../shared/consul');
      await registerService('product-service', Number(PORT), process.env.CONSUL_HOST || 'consul', 8500);
    } catch (error) {
      console.error('❌ Consul registration failed (non-critical):', error);
    }
  });
});

// Connect to RabbitMQ
getRabbitMQClient()
  .then(() => {
    console.log('✅ Product Service - RabbitMQ connected');
  })
  .catch((error) => {
    console.error('❌ Product Service - RabbitMQ connection failed:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});

