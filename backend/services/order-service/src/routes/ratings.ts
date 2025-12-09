import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Rating, { RatingType } from '../models/Rating';
import Order from '../models/Order';
import { getRabbitMQClient } from '../../shared/rabbitmq';

const router = express.Router();

// Helper to fetch user details from user-service
const fetchUserDetails = async (userId: string): Promise<{ name: string; email: string } | null> => {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${userServiceUrl}/api/auth/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const userData = await response.json() as {
        success?: boolean;
        user?: {
          restaurantDetails?: { businessName?: string };
          farmDetails?: { farmName?: string };
          distributorDetails?: { companyName?: string };
          profile?: { firstName?: string; lastName?: string };
          email?: string;
        };
      };
      if (userData.success && userData.user) {
        const user = userData.user;
        const name = user.restaurantDetails?.businessName 
          || user.farmDetails?.farmName 
          || user.distributorDetails?.companyName
          || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
          || 'User';
        return { name, email: user.email || '' };
      }
    }
  } catch (error: any) {
    console.warn(`Failed to fetch user ${userId}:`, error.message);
  }
  return null;
};

// Create a new rating
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      raterId,
      ratedUserId,
      type,
      rating,
      comment,
      deliveryId,
      productId,
      isAnonymous = false,
    } = req.body;

    // Validate required fields
    if (!orderId || !raterId || !ratedUserId || !type || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: orderId, raterId, ratedUserId, type, and rating are required',
      });
    }

    // Validate rating value
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5',
      });
    }

    // Validate rating type
    if (!Object.values(RatingType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rating type',
      });
    }

    // Verify order exists and belongs to the rater
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.customerId.toString() !== raterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only rate your own orders',
      });
    }

    // Check if order is completed
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only rate completed orders',
      });
    }

    // Validate that the rated user is associated with the order
    if (type === RatingType.FARMER && order.farmerId.toString() !== ratedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farmer ID for this order',
      });
    }

    if (type === RatingType.DELIVERY && order.distributorId?.toString() !== ratedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid distributor ID for this order',
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      orderId,
      raterId,
      type,
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this order for this type',
      });
    }

    // Get user names
    const raterDetails = await fetchUserDetails(raterId);
    const ratedUserDetails = await fetchUserDetails(ratedUserId);

    const raterName = raterDetails?.name || 'Restaurant';
    const ratedUserName = ratedUserDetails?.name || 'User';

    // Create rating
    const newRating = new Rating({
      orderId,
      orderNumber: order.orderNumber,
      raterId,
      raterName,
      ratedUserId,
      ratedUserName,
      type,
      rating,
      comment: comment || '',
      deliveryId: deliveryId || null,
      productId: productId || null,
      isAnonymous,
    });

    await newRating.save();

    // Update order rating status
    const updateData: any = {};
    if (type === RatingType.FARMER) {
      updateData['ratings.farmerRated'] = true;
    } else if (type === RatingType.DELIVERY) {
      updateData['ratings.deliveryRated'] = true;
    } else if (type === RatingType.DRIVER) {
      updateData['ratings.driverRated'] = true;
    }

    await Order.findByIdAndUpdate(orderId, updateData);

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      rating: newRating,
    });

    // Publish rating.created event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'rating.created', {
        ratingId: newRating._id,
        orderId: newRating.orderId,
        orderNumber: newRating.orderNumber,
        raterId: newRating.raterId,
        raterName: newRating.raterName,
        ratedUserId: newRating.ratedUserId,
        ratedUserName: newRating.ratedUserName,
        type: newRating.type,
        rating: newRating.rating,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish rating.created event:', error);
    }

  } catch (error: any) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get ratings for a specific user (farmer or distributor)
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, page = '1', limit = '10' } = req.query;

    let query: any = { ratedUserId: userId };
    if (type) {
      query.type = type;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const ratings = await Rating.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Rating.countDocuments(query);

    // Calculate average rating
    const avgResult = await Rating.aggregate([
      { $match: query },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const stats = avgResult[0] || { averageRating: 0, count: 0 };

    res.json({
      success: true,
      ratings,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalRatings: stats.count,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get ratings for a specific order
router.get('/order/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    const ratings = await Rating.find({ orderId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      ratings,
    });
  } catch (error: any) {
    console.error('Get order ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update rating status when order status changes
export const updateOrderRatingEligibility = async (orderId: string, status: string) => {
  try {
    const canRate = status === 'delivered';
    await Order.findByIdAndUpdate(orderId, {
      'ratings.canRate': canRate,
    });
  } catch (error) {
    console.error('Error updating rating eligibility:', error);
  }
};

export default router;