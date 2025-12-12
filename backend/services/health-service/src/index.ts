import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/database';
import inspectionRoutes from './routes/inspections';
import { getRabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/health';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/inspections', inspectionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'health-service',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Health Service',
    version: '1.0.0',
    description: 'Health inspection and compliance management',
    endpoints: {
      health: '/health',
      inspections: '/api/inspections',
    },
  });
});

// Connect to MongoDB
connectDB(MONGO_URI).then(() => {
  console.log('✅ Health Service - MongoDB connected');

  app.listen(PORT, async () => {
    console.log(`🏥 Health Service running on port ${PORT}`);
    try {
      const { registerService } = await import('../shared/consul');
      await registerService('health-service', Number(PORT), process.env.CONSUL_HOST || 'consul', 8500);
    } catch (error) {
      console.error('❌ Consul registration failed (non-critical):', error);
    }
  });
});

// Connect to RabbitMQ
getRabbitMQClient()
  .then(() => {
    console.log('✅ Health Service - RabbitMQ connected');
  })
  .catch((error) => {
    console.error('❌ Health Service - RabbitMQ connection failed:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});

