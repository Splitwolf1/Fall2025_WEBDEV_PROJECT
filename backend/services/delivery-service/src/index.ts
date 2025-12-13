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

  app.listen(PORT, async () => {
    console.log(`🚚 Delivery Service running on port ${PORT}`);
    try {
      const { registerService } = await import('../shared/consul');
      await registerService('delivery-service', Number(PORT), process.env.CONSUL_HOST || 'consul', 8500);
    } catch (error) {
      console.error('❌ Consul registration failed (non-critical):', error);
    }
  });
});



// Connect to RabbitMQ and listen for events
getRabbitMQClient()
  .then(async (rabbitmq) => {
    console.log('✅ Delivery Service - RabbitMQ connected');

    // Subscribe to events
    await rabbitmq.subscribe(
      'delivery-service-events',
      'farm2table.events',
      '*', // Listen to all events
      async (eventData) => {
        console.log('📨 Delivery Service received event:', eventData.type || 'unknown');

        try {
          // Dynamic import to avoid circular dependencies or initialization issues
          const { default: Delivery, DeliveryStatus } = await import('./models/Delivery');

          switch (eventData.type || Object.keys(eventData)[0]) {
            case 'order.status_updated':
              // If order is ready for pickup, ensure delivery status is updated
              if (eventData.newStatus === 'ready_for_pickup') {
                console.log(`📦 Order ${eventData.orderNumber} is ready for pickup. Updating delivery...`);

                const delivery = await Delivery.findOne({ orderId: eventData.orderId });

                if (delivery) {
                  if (delivery.status === DeliveryStatus.SCHEDULED) {
                    delivery.status = DeliveryStatus.PICKUP_PENDING;
                    delivery.timeline.push({
                      status: DeliveryStatus.PICKUP_PENDING,
                      timestamp: new Date(),
                      note: 'Order is ready for pickup (Event Triggered)',
                    });
                    await delivery.save();
                    console.log(`✅ Delivery ${delivery.orderNumber} updated to PICKUP_PENDING via event`);

                    // Publish update event back
                    await rabbitmq.publish('farm2table.events', 'delivery.status_updated', {
                      deliveryId: delivery._id,
                      deliveryNumber: delivery.orderNumber,
                      orderId: delivery.orderId,
                      distributorId: delivery.distributorId,
                      newStatus: DeliveryStatus.PICKUP_PENDING,
                      timestamp: new Date().toISOString()
                    });
                  } else {
                    console.log(`ℹ️ Delivery ${delivery.orderNumber} already in status: ${delivery.status}`);
                  }
                } else {
                  console.warn(`⚠️ No delivery found for ready order ${eventData.orderNumber}`);
                  // Optionally create delivery here if missing
                }
              }
              break;

            default:
              // Ignore other events
              break;
          }
        } catch (error) {
          console.error('❌ Error processing event:', error);
        }
      }
    );
    console.log('🎧 Delivery Service listening for events');
  })
  .catch((error) => {
    console.error('❌ Delivery Service - RabbitMQ connection failed:', error);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️ Shutting down gracefully...');
  process.exit(0);
});

