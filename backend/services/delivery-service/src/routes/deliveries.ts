import express, { Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import Delivery, { DeliveryStatus } from '../models/Delivery';
import Driver from '../models/Driver';
import Vehicle from '../models/Vehicle';
import { getRabbitMQClient } from '../../shared/rabbitmq';

const router = express.Router();

// Get all deliveries with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      distributorId,
      orderId,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    console.log(`[Delivery-Service] GET /api/deliveries - Filters:`, { distributorId, orderId, status, page, limit });

    let query: any = {};

    if (distributorId) {
      // Convert string to ObjectId if needed
      const distributorIdStr = typeof distributorId === 'string' ? distributorId : String(distributorId);
      query.distributorId = mongoose.Types.ObjectId.isValid(distributorIdStr) 
        ? new mongoose.Types.ObjectId(distributorIdStr) 
        : distributorIdStr;
    }
    if (orderId) {
      // Convert string to ObjectId if needed
      const orderIdStr = typeof orderId === 'string' ? orderId : String(orderId);
      query.orderId = mongoose.Types.ObjectId.isValid(orderIdStr) 
        ? new mongoose.Types.ObjectId(orderIdStr) 
        : orderIdStr;
    }
    if (status) query.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const deliveries = await Delivery.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Delivery.countDocuments(query);

    console.log(`[Delivery-Service] Found ${deliveries.length} deliveries (total: ${total}) with query:`, query);

    res.json({
      success: true,
      deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('[Delivery-Service] Get deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single delivery
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      delivery,
    });
  } catch (error: any) {
    console.error('Get delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create delivery
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('[Delivery-Service] POST /api/deliveries - Creating delivery');
    console.log('[Delivery-Service] Request body:', JSON.stringify(req.body, null, 2));
    
    // Convert string IDs to ObjectIds
    const deliveryData: any = {
      ...req.body,
      orderId: mongoose.Types.ObjectId.isValid(req.body.orderId) 
        ? new mongoose.Types.ObjectId(req.body.orderId) 
        : req.body.orderId,
      distributorId: mongoose.Types.ObjectId.isValid(req.body.distributorId) 
        ? new mongoose.Types.ObjectId(req.body.distributorId) 
        : req.body.distributorId,
    };
    
    // Convert route IDs to ObjectIds
    if (deliveryData.route?.pickup?.farmId) {
      deliveryData.route.pickup.farmId = mongoose.Types.ObjectId.isValid(deliveryData.route.pickup.farmId)
        ? new mongoose.Types.ObjectId(deliveryData.route.pickup.farmId)
        : deliveryData.route.pickup.farmId;
    }
    
    if (deliveryData.route?.delivery?.restaurantId) {
      deliveryData.route.delivery.restaurantId = mongoose.Types.ObjectId.isValid(deliveryData.route.delivery.restaurantId)
        ? new mongoose.Types.ObjectId(deliveryData.route.delivery.restaurantId)
        : deliveryData.route.delivery.restaurantId;
    }
    
    // Ensure location objects have lat and lng as numbers (create if missing)
    if (!deliveryData.route?.pickup?.location) {
      deliveryData.route.pickup.location = { lat: 0, lng: 0 };
    } else {
      deliveryData.route.pickup.location = {
        lat: Number(deliveryData.route.pickup.location.lat) || 0,
        lng: Number(deliveryData.route.pickup.location.lng) || 0,
      };
    }
    
    if (!deliveryData.route?.delivery?.location) {
      deliveryData.route.delivery.location = { lat: 0, lng: 0 };
    } else {
      deliveryData.route.delivery.location = {
        lat: Number(deliveryData.route.delivery.location.lat) || 0,
        lng: Number(deliveryData.route.delivery.location.lng) || 0,
      };
    }
    
    // Ensure scheduledTime is a Date
    if (deliveryData.route?.pickup?.scheduledTime) {
      deliveryData.route.pickup.scheduledTime = new Date(deliveryData.route.pickup.scheduledTime);
    }
    
    if (deliveryData.route?.delivery?.scheduledTime) {
      deliveryData.route.delivery.scheduledTime = new Date(deliveryData.route.delivery.scheduledTime);
    }
    
    const delivery = new Delivery(deliveryData);
    await delivery.save();

    console.log(`[Delivery-Service] ✅ Delivery created: ${delivery._id} for order ${delivery.orderNumber}`);

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      delivery,
    });

    // Publish delivery.created event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'delivery.created', {
        deliveryId: delivery._id,
        deliveryNumber: delivery.orderNumber,
        orderId: delivery.orderId,
        distributorId: delivery.distributorId,
        status: delivery.status,
        pickupLocation: delivery.route.pickup.location,
        deliveryLocation: delivery.route.delivery.location,
        estimatedPickupTime: delivery.route.pickup.scheduledTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish delivery.created event:', error);
    }
  } catch (error: any) {
    console.error('[Delivery-Service] ❌ Create delivery error:', error);
    console.error('[Delivery-Service] Error details:', {
      message: error.message,
      name: error.name,
      errors: error.errors,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.errors : undefined,
    });
  }
});

// Update delivery status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note, location, distributorId, vehicleId, driverId, vehicleInfo, driverInfo } = req.body;

    console.log(`[Delivery-Service] PATCH /api/deliveries/${req.params.id}/status - Status: ${status}`);
    console.log(`[Delivery-Service] Request body:`, { status, note, location, distributorId, vehicleId, driverId });

    if (!Object.values(DeliveryStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      console.log(`[Delivery-Service] Delivery ${req.params.id} not found`);
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    console.log(`[Delivery-Service] Updating delivery ${delivery._id} (order ${delivery.orderNumber}) from ${delivery.status} to ${status}`);
    
    // Update distributorId if provided (when distributor accepts)
    if (distributorId) {
      const distributorIdStr = typeof distributorId === 'string' ? distributorId : String(distributorId);
      if (mongoose.Types.ObjectId.isValid(distributorIdStr)) {
        delivery.distributorId = new mongoose.Types.ObjectId(distributorIdStr);
      }
      console.log(`[Delivery-Service] Assigned distributor: ${distributorId}`);
    }
    
    // Update vehicle info if provided
    if (vehicleInfo && vehicleInfo.type && vehicleInfo.plateNumber) {
      delivery.vehicleInfo = {
        type: vehicleInfo.type,
        plateNumber: vehicleInfo.plateNumber,
      };
      console.log(`[Delivery-Service] Assigned vehicle: ${vehicleInfo.type} (${vehicleInfo.plateNumber})`);
    }
    
    // Update driver info if provided
    if (driverInfo && driverInfo.name) {
      delivery.driverName = driverInfo.name;
      if (driverInfo.phone) {
        delivery.driverPhone = driverInfo.phone;
      }
      console.log(`[Delivery-Service] Assigned driver: ${driverInfo.name}`);
    }
    
    delivery.status = status;

    // Update location if provided
    if (location) {
      delivery.currentLocation = location;
    }

    // Add to timeline
    delivery.timeline.push({
      status,
      timestamp: new Date(),
      location,
      note,
    });

    // Update actual times
    // When status changes to in_transit, pickup is confirmed (picked up from farm)
    if (status === DeliveryStatus.IN_TRANSIT && !delivery.route.pickup.actualTime) {
      delivery.route.pickup.actualTime = new Date();
    }
    // When status changes to delivered, delivery is completed
    if (status === DeliveryStatus.DELIVERED && !delivery.route.delivery.actualTime) {
      delivery.route.delivery.actualTime = new Date();
    }

    await delivery.save();

    // Fetch order details to get farmerId and customerId for notifications
    let farmerId: string | null = null;
    let customerId: string | null = null;
    try {
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
      const orderResponse = await axios.get(`${orderServiceUrl}/api/orders/${delivery.orderId}`, {
        timeout: 3000,
      }).catch(() => null);
      
      if (orderResponse?.data?.success && orderResponse.data.order) {
        farmerId = orderResponse.data.order.farmerId?.toString() || null;
        customerId = orderResponse.data.order.customerId?.toString() || null;
        console.log(`[Delivery-Service] Found order: farmerId=${farmerId}, customerId=${customerId}`);
      }
    } catch (err) {
      console.warn('[Delivery-Service] Failed to fetch order details:', err);
    }

    // Update order status based on delivery status
    try {
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
      let orderStatus: string | null = null;
      
      if (status === 'picked_up') {
        orderStatus = 'in_transit';
      } else if (status === 'in_transit') {
        orderStatus = 'in_transit';
      } else if (status === 'delivered') {
        orderStatus = 'delivered';
      }
      
      if (orderStatus) {
        await axios.patch(`${orderServiceUrl}/api/orders/${delivery.orderId}/status`, {
          status: orderStatus,
          note: `Delivery status: ${status}`,
        }, {
          timeout: 3000,
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[Delivery-Service] Failed to update order status:', err.message);
        });
      }
    } catch (error: any) {
      console.warn('[Delivery-Service] Order service unavailable (non-critical):', error.message);
    }

    // Emit WebSocket notifications for delivery status update
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
    const notificationPromises = [];

    // Notify distributor
    notificationPromises.push(
      axios.post(`${notificationServiceUrl}/notify/role/distributor`, {
        type: 'delivery',
        title: 'Delivery Status Updated',
        message: `Delivery ${delivery.orderNumber} status changed to ${status}`,
        data: {
          deliveryId: String(delivery._id),
          orderId: delivery.orderId.toString(),
          orderNumber: delivery.orderNumber,
          status: status,
        },
      }, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('[Delivery-Service] Failed to notify distributor:', err.message);
      })
    );

    // Notify farmer (if farmerId is available)
    if (farmerId) {
      const farmerMessage = status === 'picked_up' 
        ? `Your order ${delivery.orderNumber} has been picked up from your farm`
        : status === 'in_transit'
        ? `Order ${delivery.orderNumber} is in transit to the restaurant`
        : status === 'delivered'
        ? `Order ${delivery.orderNumber} has been delivered to the restaurant`
        : `Delivery ${delivery.orderNumber} status changed to ${status}`;
        
      notificationPromises.push(
        axios.post(`${notificationServiceUrl}/notify/user/${farmerId}`, {
          type: 'delivery',
          title: 'Delivery Update',
          message: farmerMessage,
          data: {
            deliveryId: String(delivery._id),
            orderId: delivery.orderId.toString(),
            orderNumber: delivery.orderNumber,
            status: status,
          },
        }, {
          timeout: 2000,
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[Delivery-Service] Failed to notify farmer:', err.message);
        })
      );
    }

    // Notify restaurant (if customerId is available)
    if (customerId) {
      const restaurantMessage = status === 'picked_up'
        ? `Order ${delivery.orderNumber} has been picked up from the farm`
        : status === 'in_transit'
        ? `Order ${delivery.orderNumber} is on the way to your restaurant`
        : status === 'delivered'
        ? `Order ${delivery.orderNumber} has been delivered to your restaurant`
        : `Delivery ${delivery.orderNumber} status changed to ${status}`;
        
      notificationPromises.push(
        axios.post(`${notificationServiceUrl}/notify/user/${customerId}`, {
          type: 'delivery',
          title: 'Delivery Update',
          message: restaurantMessage,
          data: {
            deliveryId: String(delivery._id),
            orderId: delivery.orderId.toString(),
            orderNumber: delivery.orderNumber,
            status: status,
          },
        }, {
          timeout: 2000,
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.warn('[Delivery-Service] Failed to notify restaurant:', err.message);
        })
      );
    }

    // Send all notifications in parallel
    await Promise.all(notificationPromises);

    // Auto-unassign driver and vehicle when delivery is completed
    if (status === DeliveryStatus.DELIVERED && delivery.distributorId) {
      try {
        // Find and update driver status to available
        if (delivery.driverName) {
          await Driver.updateOne(
            { 
              distributorId: delivery.distributorId,
              name: delivery.driverName,
              status: { $ne: 'off_duty' } // Only update if not off duty
            },
            { 
              status: 'available',
              vehicleAssigned: null,
              $inc: { deliveriesCompleted: 1, deliveriesToday: 1 }
            }
          );
          console.log(`[Delivery-Service] Driver ${delivery.driverName} set to available`);
        }

        // Find and update vehicle status to available
        if (delivery.vehicleInfo?.plateNumber) {
          await Vehicle.updateOne(
            { 
              distributorId: delivery.distributorId,
              licensePlate: delivery.vehicleInfo.plateNumber,
              status: 'active'
            },
            { 
              status: 'available',
              currentDriver: null
            }
          );
          console.log(`[Delivery-Service] Vehicle ${delivery.vehicleInfo.plateNumber} set to available`);
        }
      } catch (error: any) {
        console.warn('[Delivery-Service] Failed to auto-unassign driver/vehicle:', error.message);
        // Non-critical error - don't fail the request
      }
    }

    res.json({
      success: true,
      message: 'Delivery status updated',
      delivery,
    });

    // Publish delivery.status_updated event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'delivery.status_updated', {
        deliveryId: delivery._id,
        deliveryNumber: delivery.orderNumber,
        orderId: delivery.orderId,
        distributorId: delivery.distributorId,
        previousStatus: delivery.timeline.length > 1 ? delivery.timeline[delivery.timeline.length - 2]?.status : undefined,
        newStatus: delivery.status,
        location: req.body.location,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish delivery.status_updated event:', error);
    }
  } catch (error: any) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update location (for real-time tracking)
router.patch('/:id/location', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude required',
      });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      {
        currentLocation: { lat, lng },
        // TODO: Calculate ETA based on location
      },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    res.json({
      success: true,
      delivery,
    });

    // TODO: Emit Socket.io event for real-time tracking
  } catch (error: any) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Complete delivery with proof
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { signature, photo, notes } = req.body;

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
    }

    delivery.status = DeliveryStatus.DELIVERED;
    delivery.proofOfDelivery = {
      signature,
      photo,
      timestamp: new Date(),
      notes,
    };
    delivery.route.delivery.actualTime = new Date();
    delivery.timeline.push({
      status: DeliveryStatus.DELIVERED,
      timestamp: new Date(),
      note: 'Delivery completed',
    });

    await delivery.save();

    res.json({
      success: true,
      message: 'Delivery completed',
      delivery,
    });

    // Publish delivery.completed event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'delivery.completed', {
        deliveryId: delivery._id,
        deliveryNumber: delivery.orderNumber,
        orderId: delivery.orderId,
        distributorId: delivery.distributorId,
        completedAt: delivery.route.delivery.actualTime || new Date(),
        proofOfDelivery: delivery.proofOfDelivery,
        actualDeliveryTime: req.body.actualDeliveryTime,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish delivery.completed event:', error);
    }
  } catch (error: any) {
    console.error('Complete delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
