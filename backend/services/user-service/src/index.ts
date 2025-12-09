import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/database';
import userRoutes from './routes/users';
import { getRabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/users';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'user-service',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'User Service',
    version: '1.0.0',
    description: 'User profile management',
    endpoints: {
      health: '/health',
      getUser: '/api/users/:id',
      getCurrentUser: '/api/users/me',
      listUsers: '/api/users?role=farmer',
      updateProfile: '/api/users/profile',
    },
  });
});

// Connect to MongoDB
connectDB(MONGO_URI).then(() => {
  console.log('✅ User Service - MongoDB connected');

  // Start server
  app.listen(PORT, () => {
    console.log(`👤 User Service running on port ${PORT}`);
  });
});

// Connect to RabbitMQ (optional for this service)
getRabbitMQClient()
  .then(() => {
    console.log('✅ User Service - RabbitMQ connected');
  })
  .catch((error) => {
    console.error('❌ User Service - RabbitMQ connection failed:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});
