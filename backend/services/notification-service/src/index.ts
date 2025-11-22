import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { getRabbitMQClient } from '../shared/rabbitmq';

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
  const notificationData = {
    _id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    ...notification,
    isRead: false,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  };
  
  console.log(`🔔 Sending notification to user-${userId}:`, notificationData);
  io.to(`user-${userId}`).emit('notification', notificationData);
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
  const notificationData = {
    _id: `role_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    isRead: false,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
  };
  
  console.log(`🔔 Sending role notification to role-${role}:`, notificationData);
  io.to(`role-${role}`).emit('notification', notificationData);
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

// REST API endpoint to send notifications to all users with a specific role
app.post('/notify/role/:role', (req, res) => {
  const { role } = req.params;
  const { type, title, message, data } = req.body;

  if (!type || !title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: type, title, message',
    });
  }

  sendRoleNotification(role, { type, title, message, data });

  res.json({
    success: true,
    message: `Notification sent to all ${role}s`,
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

    // Connect to RabbitMQ and listen for events
    try {
      const rabbitmq = await getRabbitMQClient();
      console.log('✅ RabbitMQ connected');
      
      // Subscribe to all farm2table events
      await rabbitmq.subscribe(
        'notification-service-events',
        'farm2table.events',
        '*', // Listen to all events
        async (eventData) => {
          console.log('📨 Received event:', eventData);
          
          // Route events to appropriate notification handlers
          switch (eventData.type || Object.keys(eventData)[0]) {
            case 'user.created':
              sendNotification(eventData.userId, {
                type: 'welcome',
                title: 'Welcome to Farm2Table!',
                message: 'Your account has been created successfully.',
                data: eventData
              });
              break;
              
            case 'order.created':
              // Notify customer and farmer
              sendNotification(eventData.customerId, {
                type: 'order',
                title: 'Order Confirmed',
                message: `Order ${eventData.orderNumber} has been placed successfully.`,
                data: eventData
              });
              sendNotification(eventData.farmerId, {
                type: 'order',
                title: 'New Order Received',
                message: `You have a new order ${eventData.orderNumber}.`,
                data: eventData
              });
              break;
              
            case 'order.status_updated':
              // Notify customer of status updates
              sendNotification(eventData.customerId, {
                type: 'order_update',
                title: 'Order Status Update',
                message: `Order ${eventData.orderNumber} is now ${eventData.newStatus.replace('_', ' ')}.`,
                data: eventData
              });
              break;
              
            case 'delivery.status_updated':
              // Notify about delivery updates
              broadcastNotification({
                type: 'delivery_update',
                title: 'Delivery Update',
                message: `Delivery ${eventData.deliveryNumber} status: ${eventData.newStatus.replace('_', ' ')}.`,
                data: eventData
              });
              break;
              
            case 'inspection.scheduled':
              // Notify inspector and target of scheduled inspection
              sendNotification(eventData.inspectorId, {
                type: 'inspection',
                title: 'Inspection Scheduled',
                message: `You have a new ${eventData.type} inspection scheduled.`,
                data: eventData
              });
              sendNotification(eventData.targetId, {
                type: 'inspection',
                title: 'Inspection Scheduled',
                message: `A ${eventData.type} inspection has been scheduled for your facility.`,
                data: eventData
              });
              break;
              
            case 'compliance.violation':
              // Notify about compliance violations (critical)
              sendRoleNotification('inspector', {
                type: 'violation',
                title: 'Compliance Violation Detected',
                message: `Critical violations found during inspection.`,
                data: eventData
              });
              sendNotification(eventData.targetId, {
                type: 'violation',
                title: 'Compliance Issue',
                message: 'Your facility has failed inspection. Please review the violations.',
                data: eventData
              });
              break;
              
            default:
              console.log('⚠️ Unknown event type:', eventData);
          }
        }
      );
      
      console.log('📢 Notification service subscribed to all events');
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
  io.close(() => {
    console.log('✅ Socket.io server closed');
    process.exit(0);
  });
});

// Export io for use in event handlers
export { io };
