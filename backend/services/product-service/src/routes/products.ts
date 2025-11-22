import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product, { ProductCategory } from '../models/Product';
import { getRabbitMQClient } from '../../shared/rabbitmq';

const router = express.Router();

// Get all products with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      farmerId,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    let query: any = { isAvailable: true };

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (farmerId) {
      query.farmerId = farmerId;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const products = await Product.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort(sort);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create product (farmer only)
router.post('/', async (req: Request, res: Response) => {
  try {
    // Convert farmerId to ObjectId if it's a string
    const productData = { ...req.body };
    if (productData.farmerId && typeof productData.farmerId === 'string') {
      if (mongoose.Types.ObjectId.isValid(productData.farmerId)) {
        productData.farmerId = new mongoose.Types.ObjectId(productData.farmerId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid farmerId format',
        });
      }
    }

    // Ensure required fields are present
    if (!productData.name || !productData.category || productData.price === undefined || productData.stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, category, price, and stockQuantity are required',
      });
    }

    // Set default values
    if (!productData.description) {
      productData.description = '';
    }
    if (!productData.images) {
      productData.images = [];
    }
    if (!productData.certifications) {
      productData.certifications = [];
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });

    // Publish product.created event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'product.created', {
        productId: product._id,
        farmerId: product.farmerId,
        name: product.name,
        category: product.category,
        price: product.price,
        stockQuantity: product.stockQuantity,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish product.created event:', error);
    }
  } catch (error: any) {
    console.error('Create product error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });

    // Publish product.updated event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'product.updated', {
        productId: product._id,
        farmerId: product.farmerId,
        updates: Object.keys(req.body),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish product.updated event:', error);
    }
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update stock quantity
router.patch('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity',
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stockQuantity: quantity },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      product,
    });

    // Publish product.stock_updated event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'product.stock_updated', {
        productId: product._id,
        farmerId: product.farmerId,
        previousQuantity: product.stockQuantity,
        newQuantity: quantity,
        timestamp: new Date().toISOString()
      });
      
      if (quantity === 0) {
        await rabbitmq.publish('farm2table.events', 'product.out_of_stock', {
          productId: product._id,
          farmerId: product.farmerId,
          name: product.name,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to publish product stock events:', error);
    }
  } catch (error: any) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });

    // Publish product.deleted event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'product.deleted', {
        productId: product._id,
        farmerId: product.farmerId,
        name: product.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish product.deleted event:', error);
    }
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
