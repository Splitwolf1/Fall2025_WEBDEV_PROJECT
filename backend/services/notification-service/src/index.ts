import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3006;

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'notification-service',
    version: '1.0.0',
    connections: io.engine.clientsCount,
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join user-specific room
  socket.on('join', (data: { userId: string; role: string }) => {
    const { userId, role } = data;
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    console.log(`User ${userId} (${role}) joined rooms`);

    socket.emit('joined', {
      message: 'Successfully connected to notifications',
      userId,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Helper function to send notifications
export const sendNotification = (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) => {
  io.to(`user-${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
};

// Send to all users with specific role
export const sendRoleNotification = (
  role: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) => {
  io.to(`role-${role}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
};

// Broadcast to all connected clients
export const broadcastNotification = (notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}) => {
  io.emit('notification', {
    ...notification,
    timestamp: new Date().toISOString(),
  });
};

// REST API endpoint to send notifications (for testing)
app.post('/api/notify', (req, res) => {
  const { userId, type, title, message, data } = req.body;

  if (!userId || !type || !title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
    });
  }

  sendNotification(userId, { type, title, message, data });

  res.json({
    success: true,
    message: 'Notification sent',
  });
});

// Start server
const startServer = async () => {
  try {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.io ready for connections`);
    });

    // TODO: Connect to RabbitMQ and listen for events
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
  io.close(() => {
    console.log('✅ Socket.io server closed');
    process.exit(0);
  });
});

// Export io for use in event handlers
export { io };
