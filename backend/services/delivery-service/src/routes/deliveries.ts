import express, { Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import Delivery, { DeliveryStatus } from '../models/Delivery';

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
      query.distributorId = mongoose.Types.ObjectId.isValid(distributorId) 
        ? new mongoose.Types.ObjectId(distributorId) 
        : distributorId;
    }
    if (orderId) {
      // Convert string to ObjectId if needed
      query.orderId = mongoose.Types.ObjectId.isValid(orderId) 
        ? new mongoose.Types.ObjectId(orderId) 
        : orderId;
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
    
    // Ensure location objects have lat and lng as numbers
    if (deliveryData.route?.pickup?.location) {
      deliveryData.route.pickup.location = {
        lat: Number(deliveryData.route.pickup.location.lat) || 0,
        lng: Number(deliveryData.route.pickup.location.lng) || 0,
      };
    }
    
    if (deliveryData.route?.delivery?.location) {
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

    // TODO: Publish delivery.created event to RabbitMQ
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
    const { status, note, location } = req.body;

    console.log(`[Delivery-Service] PATCH /api/deliveries/${req.params.id}/status - Status: ${status}`);

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
    if (status === DeliveryStatus.PICKED_UP && !delivery.route.pickup.actualTime) {
      delivery.route.pickup.actualTime = new Date();
    }
    if (status === DeliveryStatus.DELIVERED && !delivery.route.delivery.actualTime) {
      delivery.route.delivery.actualTime = new Date();
    }

    await delivery.save();

    // Emit WebSocket notification for delivery status update
    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006';
      await axios.post(`${notificationServiceUrl}/notify/role/distributor`, {
        type: 'delivery',
        title: 'Delivery Status Updated',
        message: `Delivery ${delivery.orderNumber} status changed to ${status}`,
        data: {
          deliveryId: delivery._id.toString(),
          orderId: delivery.orderId.toString(),
          orderNumber: delivery.orderNumber,
          status: status,
        },
      }, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('Failed to send notification (non-critical):', err.message);
      });
    } catch (error: any) {
      console.warn('Notification service unavailable (non-critical):', error.message);
    }

    res.json({
      success: true,
      message: 'Delivery status updated',
      delivery,
    });

    // TODO: Publish delivery.status_updated event to RabbitMQ
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

    // TODO: Publish delivery.completed event to RabbitMQ
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
