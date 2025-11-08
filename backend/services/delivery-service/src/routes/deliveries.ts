import express, { Request, Response } from 'express';
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

    let query: any = {};

    if (distributorId) query.distributorId = distributorId;
    if (orderId) query.orderId = orderId;
    if (status) query.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const deliveries = await Delivery.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Delivery.countDocuments(query);

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
    console.error('Get deliveries error:', error);
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
    const delivery = new Delivery(req.body);
    await delivery.save();

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      delivery,
    });

    // TODO: Publish delivery.created event to RabbitMQ
  } catch (error: any) {
    console.error('Create delivery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update delivery status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note, location } = req.body;

    if (!Object.values(DeliveryStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found',
      });
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
    if (status === DeliveryStatus.PICKED_UP && !delivery.route.pickup.actualTime) {
      delivery.route.pickup.actualTime = new Date();
    }
    if (status === DeliveryStatus.DELIVERED && !delivery.route.delivery.actualTime) {
      delivery.route.delivery.actualTime = new Date();
    }

    await delivery.save();

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
