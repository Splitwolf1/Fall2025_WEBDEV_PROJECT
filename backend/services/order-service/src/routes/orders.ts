import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order, { OrderStatus } from '../models/Order';
import axios from 'axios';
import { getRabbitMQClient } from '../../shared/rabbitmq';
import { updateOrderRatingEligibility } from './ratings';

const router = express.Router();

// Helper to fetch user details from user-service
const fetchUserDetails = async (userId: string): Promise<{ name: string; email: string } | null> => {
  try {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3002';
    // Note: The path /api/auth/users suggests auth-service, but usually profile names are in user-service.
    // If this route exists in User Service, port 3002 is correct. If it's Auth Service, path is likely different.
    // Assuming the intent was User Service for details.

    const response = await axios.get(`${userServiceUrl}/api/users/${userId}`, { // Changed path to standard user-service path if applicable, or keep original if sure.
      timeout: 3000,
    }).catch(async (err) => {
      // Fallback to Auth service if User service fails or route differs
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
      return axios.get(`${authServiceUrl}/api/auth/users/${userId}`, { timeout: 3000 });
    }).catch((err) => {
      console.warn(`Failed to fetch user ${userId}:`, err.message);
      return null;
    });

    if (response?.data?.success && response.data.user) {
      const user = response.data.user;
      const name = user.restaurantDetails?.businessName
        || user.farmDetails?.farmName
        || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim()
        || 'Customer';
      return { name, email: user.email || '' };
    }
  } catch (error: any) {
    console.warn(`Failed to fetch user ${userId}:`, error.message);
  }
  return null;
};

// Helper to create delivery record
const createDelivery = async (order: any) => {
  try {
    const deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3005';
    console.log(`[Order-Service] 🚚 Creating delivery using URL: ${deliveryServiceUrl}`);

    // Get farmer and customer details for delivery route (with fallbacks)
    const farmerDetails = await Promise.race([
      fetchUserDetails(order.farmerId.toString()),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
    ]) as { name: string; email: string } | null;

    const customerDetails = await Promise.race([
      fetchUserDetails(order.customerId.toString()),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
    ]) as { name: string; email: string } | null;

    // Create delivery with placeholder distributor (will be assigned later)
    // Use a valid ObjectId format for distributorId (can be updated later)
    const placeholderDistributorId = new mongoose.Types.ObjectId('000000000000000000000000');

    const deliveryData = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      distributorId: placeholderDistributorId.toString(), // Placeholder - will be assigned by distributor
      driverName: 'TBD', // Will be assigned when distributor picks up
      vehicleInfo: {
        type: 'TBD',
        plateNumber: 'TBD',
      },
      route: {
        pickup: {
          farmId: order.farmerId.toString(),
          farmName: order.farmerName || 'Farm',
          location: {
            lat: Number(order.deliveryAddress?.coordinates?.lat) || 0,
            lng: Number(order.deliveryAddress?.coordinates?.lng) || 0,
          },
          address: 'Farm Address TBD',
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
        delivery: {
          restaurantId: order.customerId.toString(),
          restaurantName: order.customerName || 'Restaurant',
          location: {
            lat: Number(order.deliveryAddress?.coordinates?.lat) || 0,
            lng: Number(order.deliveryAddress?.coordinates?.lng) || 0,
          },
          address: order.deliveryAddress
            ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.zipCode || ''}`.trim() || 'Delivery Address TBD'
            : 'Delivery Address TBD',
          scheduledTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        },
      },
      status: 'scheduled',
    };

    console.log(`[Order-Service] Creating delivery for order ${order.orderNumber}...`);
    console.log(`[Order-Service] Delivery data:`, JSON.stringify(deliveryData, null, 2));

    const response = await axios.post(`${deliveryServiceUrl}/api/deliveries`, deliveryData, {
      timeout: 10000, // Increased timeout
      headers: { 'Content-Type': 'application/json' },
    }).catch((err) => {
      console.error(`[Order-Service] ❌ Failed to create delivery for order ${order.orderNumber}:`, err.message);
      if (err.response) {
        console.error(`[Order-Service] Response status:`, err.response.status);
        console.error(`[Order-Service] Response data:`, err.response.data);
      }
      return null;
    });

    if (response?.data?.success) {
      console.log(`✅ [Order-Service] Delivery created for order ${order.orderNumber}: ${response.data.delivery?._id}`);
    } else if (response?.data) {
      console.error(`[Order-Service] Delivery creation failed:`, response.data);
    }
  } catch (error: any) {
    console.warn('Error creating delivery (non-critical):', error.message);
    // Don't fail order creation if delivery creation fails
  }
};

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

// Get order by order number (e.g., ORD-1765582623683-0004)
router.get('/number/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    console.log(`[Order-Service] Looking up order by number: ${orderNumber}`);

    const order = await Order.findOne({ orderNumber: orderNumber });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      order,
      data: order, // For backward compatibility with chatbot
    });
  } catch (error: any) {
    console.error('Get order by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log(`[Order-Service] Looking up orders for user: ${userId}`);

    // Search in both customerId and farmerId fields
    const orders = await Order.find({
      $or: [
        { customerId: userId },
        { farmerId: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      orders,
      data: orders, // For backward compatibility with chatbot
    });
  } catch (error: any) {
    console.error('Get user orders error:', error);
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

// Create order(s) - handles multiple farmers by creating separate orders
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('[Order-Service] POST /api/orders - Order creation request received');
    console.log('[Order-Service] Request body keys:', Object.keys(req.body || {}));
    console.log('[Order-Service] Items count:', req.body?.items?.length || 0);

    const { customerId, items, totalAmount, deliveryAddress, notes, customerType } = req.body;

    // Validate required fields
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      console.log('[Order-Service] Validation failed:', { customerId: !!customerId, itemsCount: items?.length || 0 });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId and items are required',
      });
    }

    console.log('[Order-Service] Starting order creation for customer:', customerId);

    // Get customer details (with fallback)
    const customerDetails = await fetchUserDetails(customerId);
    const customerName = customerDetails?.name || 'Restaurant Customer';

    // Group items by farmer
    const itemsByFarmer: {
      [farmerId: string]: {
        farmerId: string;
        farmerName: string;
        items: any[];
        totalAmount: number;
      }
    } = {};

    for (const item of items) {
      const farmerId = item.farmerId || item.farmerId?._id || item.farmerId?.id;
      if (!farmerId) {
        continue; // Skip items without farmer
      }

      if (!itemsByFarmer[farmerId]) {
        // Get farmer details (with fallback - don't block on this)
        const farmerDetails = await Promise.race([
          fetchUserDetails(farmerId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000))
        ]) as { name: string; email: string } | null;

        itemsByFarmer[farmerId] = {
          farmerId,
          farmerName: farmerDetails?.name || `Farmer ${farmerId.slice(-4)}`,
          items: [],
          totalAmount: 0,
        };
      }

      // Transform item to match Order model structure
      const orderItem = {
        productId: item.productId || item.productId?._id || item.productId?.id,
        name: item.productName || item.name,
        quantity: item.quantity,
        unit: item.unit || 'unit',
        pricePerUnit: item.pricePerUnit || item.price || 0,
        subtotal: item.totalPrice || (item.pricePerUnit || item.price || 0) * item.quantity,
      };

      itemsByFarmer[farmerId].items.push(orderItem);
      itemsByFarmer[farmerId].totalAmount += orderItem.subtotal;
    }

    // Create orders for each farmer
    const createdOrders = [];
    for (const [farmerId, farmerData] of Object.entries(itemsByFarmer)) {
      const orderData = {
        customerId,
        customerName: customerName,
        farmerId: farmerData.farmerId,
        farmerName: farmerData.farmerName,
        items: farmerData.items,
        totalAmount: farmerData.totalAmount,
        status: OrderStatus.PENDING, // Orders start as pending, farmer must confirm
        deliveryAddress: {
          street: deliveryAddress?.street || '',
          city: deliveryAddress?.city || '',
          state: deliveryAddress?.state || '',
          zipCode: deliveryAddress?.zipCode || '',
          coordinates: {
            lat: Number(deliveryAddress?.coordinates?.lat) || 0,
            lng: Number(deliveryAddress?.coordinates?.lng) || 0,
          },
        },
        specialInstructions: notes || '',
      };

      const order = new Order(orderData);
      await order.save();

      // Create delivery record asynchronously (don't block order creation)
      createDelivery(order).catch(err => {
        console.error(`Failed to create delivery for order ${order.orderNumber}:`, err.message);
      });

      createdOrders.push(order);
    }

    console.log(`[Order-Service] ✅ Created ${createdOrders.length} order(s) successfully`);

    res.status(201).json({
      success: true,
      message: `Order${createdOrders.length > 1 ? 's' : ''} created successfully`,
      orders: createdOrders,
      order: createdOrders[0], // Return first order for backward compatibility
    });

    // Send HTTP notifications (real-time via WebSocket)
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';

    for (const order of createdOrders) {
      // Notify farmer of new order
      axios.post(`${notificationServiceUrl}/notify/user/${order.farmerId}`, {
        type: 'order',
        title: 'New Order Received! 🛒',
        message: `You have a new order ${order.orderNumber} for $${order.totalAmount.toFixed(2)}`,
        data: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
        },
      }, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('[Order-Service] Failed to notify farmer of new order:', err.message);
      });

      // Notify customer of order confirmation
      axios.post(`${notificationServiceUrl}/notify/user/${order.customerId}`, {
        type: 'order',
        title: 'Order Placed! ✅',
        message: `Your order ${order.orderNumber} has been placed successfully`,
        data: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
        },
      }, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('[Order-Service] Failed to notify customer of new order:', err.message);
      });
    }

    // Publish order.created event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      for (const order of createdOrders) {
        await rabbitmq.publish('farm2table.events', 'order.created', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          farmerId: order.farmerId,
          totalAmount: order.totalAmount,
          items: order.items,
          status: order.status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to publish order.created events:', error);
    }
  } catch (error: any) {
    console.error('[Order-Service] ❌ Create order error:', error);
    console.error('[Order-Service] Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
});

// Helper to notify delivery service when order is ready for pickup
const notifyDeliveryService = async (order: any) => {
  try {
    const deliveryServiceUrl = process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004';

    console.log(`[Order-Service] Looking for delivery for order ${order._id} (${order.orderNumber})...`);

    // Find delivery for this order - try both string and ObjectId formats
    const orderIdString = order._id.toString();
    console.log(`[Order-Service] Searching for delivery with orderId: ${orderIdString}`);

    const deliveryResponse = await axios.get(`${deliveryServiceUrl}/api/deliveries?orderId=${orderIdString}`, {
      timeout: 5000,
    }).catch((err) => {
      console.error(`[Order-Service] Failed to fetch delivery:`, err.message);
      return null;
    });

    if (deliveryResponse?.data?.success && deliveryResponse.data.deliveries?.length > 0) {
      const delivery = deliveryResponse.data.deliveries[0];
      console.log(`[Order-Service] Found delivery ${delivery._id} for order ${order.orderNumber}`);

      // Update delivery status to pickup_pending when order is ready_for_pickup
      if (order.status === OrderStatus.READY_FOR_PICKUP) {
        console.log(`[Order-Service] Updating delivery ${delivery._id} status to pickup_pending...`);
        const updateResponse = await axios.patch(`${deliveryServiceUrl}/api/deliveries/${delivery._id}/status`, {
          status: 'pickup_pending',
          note: 'Order is ready for pickup',
        }, {
          timeout: 5000,
          headers: { 'Content-Type': 'application/json' },
        }).catch((err) => {
          console.error(`[Order-Service] Failed to update delivery status:`, err.message);
          return null;
        });

        if (updateResponse?.data?.success) {
          console.log(`✅ [Order-Service] Successfully updated delivery ${delivery._id} to pickup_pending`);
        } else {
          console.error(`[Order-Service] Failed to update delivery status:`, updateResponse?.data);
        }
      }
    } else {
      console.warn(`[Order-Service] No delivery found for order ${order.orderNumber} (${order._id})`);
      console.log(`[Order-Service] Delivery response:`, deliveryResponse?.data);

      // If no delivery exists, create one now
      if (order.status === OrderStatus.READY_FOR_PICKUP) {
        console.log(`[Order-Service] Creating delivery for order ${order.orderNumber}...`);
        await createDelivery(order).catch(err => {
          console.error(`[Order-Service] Failed to create delivery:`, err.message);
        });

        // Wait a moment, then try to update it to pickup_pending
        setTimeout(async () => {
          const retryResponse = await axios.get(`${deliveryServiceUrl}/api/deliveries?orderId=${order._id}`, {
            timeout: 5000,
          }).catch(() => null);

          if (retryResponse?.data?.success && retryResponse.data.deliveries?.length > 0) {
            const newDelivery = retryResponse.data.deliveries[0];
            await axios.patch(`${deliveryServiceUrl}/api/deliveries/${newDelivery._id}/status`, {
              status: 'pickup_pending',
              note: 'Order is ready for pickup',
            }, {
              timeout: 5000,
              headers: { 'Content-Type': 'application/json' },
            }).catch(() => null);
          }
        }, 1000);
      }
    }
  } catch (error: any) {
    console.error('[Order-Service] Error notifying delivery service:', error.message);
  }
};

// Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    console.log('[Order-Service] PATCH /api/orders/:id/status - Status update request');
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

    const oldStatus = order.status;

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

    // Update rating eligibility
    await updateOrderRatingEligibility(order._id.toString(), status);

    console.log(`[Order-Service] ✅ Order ${order.orderNumber} status updated: ${oldStatus} -> ${status}`);

    // Notify delivery service if order is ready for pickup
    if (status === OrderStatus.READY_FOR_PICKUP) {
      console.log(`[Order-Service] Order ${order.orderNumber} is ready for pickup, notifying delivery service...`);
      notifyDeliveryService(order).catch(err => {
        console.error('[Order-Service] Failed to notify delivery service:', err.message);
      });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      order,
    });

    // Send HTTP notifications (real-time via WebSocket)
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
    const notificationPromises = [];

    // Notify customer (restaurant)
    const customerMessage = status === 'confirmed'
      ? `Order ${order.orderNumber} has been confirmed by the farmer`
      : status === 'preparing'
        ? `Order ${order.orderNumber} is being prepared`
        : status === 'ready_for_pickup'
          ? `Order ${order.orderNumber} is ready for pickup`
          : `Order ${order.orderNumber} status changed to ${status}`;

    notificationPromises.push(
      axios.post(`${notificationServiceUrl}/notify/user/${order.customerId}`, {
        type: 'order',
        title: 'Order Update',
        message: customerMessage,
        data: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          status: status,
        },
      }, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('[Order-Service] Failed to notify customer:', err.message);
      })
    );

    // Notify farmer
    const farmerMessage = status === 'pending'
      ? `New order ${order.orderNumber} received`
      : status === 'cancelled'
        ? `Order ${order.orderNumber} has been cancelled`
        : `Order ${order.orderNumber} status changed to ${status}`;

    notificationPromises.push(
      axios.post(`${notificationServiceUrl}/notify/user/${order.farmerId}`, {
        type: 'order',
        title: 'Order Update',
        message: farmerMessage,
        data: {
          orderId: String(order._id),
          orderNumber: order.orderNumber,
          status: status,
        },
      }, {
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('[Order-Service] Failed to notify farmer:', err.message);
      })
    );

    // Send all notifications in parallel
    await Promise.all(notificationPromises);

    // Publish order.status_updated event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'order.status_updated', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        farmerId: order.farmerId,
        previousStatus: order.timeline[order.timeline.length - 2]?.status,
        newStatus: order.status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish order.status_updated event:', error);
    }
  } catch (error: any) {
    console.error('[Order-Service] ❌ Update order status error:', error);
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

    // Publish order.cancelled event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'order.cancelled', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        farmerId: order.farmerId,
        totalAmount: order.totalAmount,
        cancellationReason: req.body.reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish order.cancelled event:', error);
    }
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
