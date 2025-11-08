import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { detectIntent } from './intents';
import { generateResponse } from './handlers';

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

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Detect intent
    const intent = detectIntent(message);
    console.log(`Intent detected: ${intent} for message: "${message}"`);

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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Start server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Chatbot Service running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });

    // TODO: Connect to RabbitMQ
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
