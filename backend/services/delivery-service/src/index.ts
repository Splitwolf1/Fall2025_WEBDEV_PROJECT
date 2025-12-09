import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/database';
import deliveryRoutes from './routes/deliveries';
import fleetRoutes from './routes/fleet';
import { getRabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/deliveries';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/fleet', fleetRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'delivery-service',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Delivery Service',
    version: '1.0.0',
    description: 'Delivery tracking and fleet management',
    endpoints: {
      health: '/health',
      deliveries: '/api/deliveries',
      fleet: '/api/fleet',
    },
  });
});

// Connect to MongoDB
connectDB(MONGO_URI).then(() => {
  console.log('✅ Delivery Service - MongoDB connected');

  app.listen(PORT, () => {
    console.log(`🚚 Delivery Service running on port ${PORT}`);
  });
});

// Connect to RabbitMQ
getRabbitMQClient()
  .then(() => {
    console.log('✅ Delivery Service - RabbitMQ connected');
  })
  .catch((error) => {
    console.error('❌ Delivery Service - RabbitMQ connection failed:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});

