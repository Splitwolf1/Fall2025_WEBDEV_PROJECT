import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { detectIntent } from './intents';
import { generateResponse } from './handlers';
import { getRabbitMQClient, RabbitMQClient } from '../shared/rabbitmq';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chatbot-service',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'chatbot-service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
    },
  });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    // Input validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a string',
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (max 1000 characters)',
      });
    }

    if (userId && typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'UserId must be a string',
      });
    }

    // Detect intent
    const intent = detectIntent(message);
    console.log(`Intent detected: ${intent} for message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"${userId ? ` (User: ${userId})` : ''}`);

    // Generate response
    const response = await generateResponse(intent, message, userId);

    res.json({
      success: true,
      intent,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Return user-friendly error messages
    const errorMessage = error.message && error.message.includes('Failed to fetch') 
      ? "I'm having trouble connecting to our services right now. Please try again in a moment."
      : "I'm sorry, I'm having trouble processing your request right now. Please try again.";

    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

// Setup RabbitMQ event handlers
const setupEventHandlers = async (rabbitMQ: RabbitMQClient) => {
  // Subscribe to order events for proactive notifications
  await rabbitMQ.subscribe(
    'chatbot.order_events',
    'farm_to_table_events',
    'order.*',
    async (eventData: any) => {
      console.log('📦 Received order event:', eventData);
      // Store recent order updates for chatbot responses
      // This could be used for proactive notifications to users
    }
  );

  // Subscribe to delivery events for real-time tracking info
  await rabbitMQ.subscribe(
    'chatbot.delivery_events',
    'farm_to_table_events',
    'delivery.*',
    async (eventData: any) => {
      console.log('🚚 Received delivery event:', eventData);
      // Store delivery updates for chatbot responses
    }
  );

  // Subscribe to user events
  await rabbitMQ.subscribe(
    'chatbot.user_events',
    'farm_to_table_events',
    'user.*',
    async (eventData: any) => {
      console.log('👤 Received user event:', eventData);
      // Track user activities for personalized responses
    }
  );
};

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Chatbot Service running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });

    // Connect to RabbitMQ
    try {
      const rabbitMQ = await getRabbitMQClient();
      await setupEventHandlers(rabbitMQ);
      console.log('✅ RabbitMQ connected and event handlers setup');
    } catch (error) {
      console.error('❌ RabbitMQ connection error:', error);
    }

    // TODO: Register with Consul
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});
