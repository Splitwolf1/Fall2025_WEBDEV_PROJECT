import express, { Request, Response } from 'express';
import Order, { OrderStatus } from '../models/Order';

const router = express.Router();

// Get all orders with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      farmerId,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    let query: any = {};

    if (customerId) query.customerId = customerId;
    if (farmerId) query.farmerId = farmerId;
    if (status) query.status = status;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const orders = await Order.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create order
router.post('/', async (req: Request, res: Response) => {
  try {
    const order = new Order(req.body);
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order,
    });

    // TODO: Publish order.created event to RabbitMQ
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update status
    order.status = status;

    // Add to timeline
    order.timeline.push({
      status,
      timestamp: new Date(),
      note,
    });

    // Update delivery time if delivered
    if (status === OrderStatus.DELIVERED) {
      order.actualDeliveryTime = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      order,
    });

    // TODO: Publish order.status_updated event to RabbitMQ
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Cancel order
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Only allow cancelling pending or confirmed orders
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order in current status',
      });
    }

    order.status = OrderStatus.CANCELLED;
    order.timeline.push({
      status: OrderStatus.CANCELLED,
      timestamp: new Date(),
      note: req.body.reason || 'Order cancelled',
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });

    // TODO: Publish order.cancelled event to RabbitMQ
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
