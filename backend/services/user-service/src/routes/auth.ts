import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('[User-Service] Register request received');
    console.log('[User-Service] Request body keys:', Object.keys(req.body || {}));
    
    const { email, password, role, profile, ...roleDetails } = req.body;

    // Validate required fields
    if (!email || !password || !role || !profile) {
      console.log('[User-Service] Missing required fields:', { email: !!email, password: !!password, role: !!role, profile: !!profile });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create user with role-specific details
    const userData: any = {
      email,
      password,
      role,
      profile,
    };

    // Add role-specific details
    if (role === UserRole.FARMER && roleDetails.farmDetails) {
      userData.farmDetails = roleDetails.farmDetails;
    } else if (role === UserRole.RESTAURANT && roleDetails.restaurantDetails) {
      userData.restaurantDetails = roleDetails.restaurantDetails;
    } else if (role === UserRole.DISTRIBUTOR && roleDetails.distributorDetails) {
      userData.distributorDetails = roleDetails.distributorDetails;
    } else if (role === UserRole.INSPECTOR && roleDetails.inspectorDetails) {
      userData.inspectorDetails = roleDetails.inspectorDetails;
    }

    const user = new User(userData);
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('[User-Service] Registration successful, sending response');
    const response = {
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    };
    
    res.status(201).json(response);
    console.log('[User-Service] Response sent successfully');

    // TODO: Publish user.created event to RabbitMQ
  } catch (error: any) {
    console.error('[User-Service] Registration error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('[User-Service] Login request received');
    console.log('[User-Service] Request body:', { email: req.body?.email, hasPassword: !!req.body?.password, role: req.body?.role });
    
    const { email, password, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('[User-Service] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Validate role matches - if role is provided, check it matches user's actual role
    if (role && user.role !== role) {
      const roleLabels: { [key: string]: string } = {
        farmer: 'Farmer',
        restaurant: 'Restaurant',
        distributor: 'Distributor',
        inspector: 'Inspector',
      };
      const userRoleLabel = roleLabels[user.role] || user.role;
      return res.status(403).json({
        success: false,
        message: `No account found as ${roleLabels[role] || role}. Please select ${userRoleLabel} or create a new account.`,
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('[User-Service] Login successful, sending response');
    const response = {
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        farmDetails: user.farmDetails,
        restaurantDetails: user.restaurantDetails,
        distributorDetails: user.distributorDetails,
        inspectorDetails: user.inspectorDetails,
      },
    };
    
    res.json(response);
    console.log('[User-Service] Response sent successfully');

    // TODO: Publish user.logged_in event to RabbitMQ
  } catch (error: any) {
    console.error('[User-Service] Login error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
});

// Get user by ID (for service-to-service calls)
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        farmDetails: user.farmDetails,
        restaurantDetails: user.restaurantDetails,
        distributorDetails: user.distributorDetails,
        inspectorDetails: user.inspectorDetails,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        farmDetails: user.farmDetails,
        restaurantDetails: user.restaurantDetails,
        distributorDetails: user.distributorDetails,
        inspectorDetails: user.inspectorDetails,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get all users by role (for restaurants to find farmers/suppliers)
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role parameter is required',
      });
    }

    // Only allow fetching farmers for now (suppliers for restaurants)
    if (role !== UserRole.FARMER) {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can be fetched as suppliers',
      });
    }

    const users = await User.find({ 
      role: role as UserRole,
      isActive: true 
    }).select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        farmDetails: user.farmDetails,
        createdAt: user.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const updates = req.body;

    // Don't allow changing email, password, or role through this endpoint
    delete updates.email;
    delete updates.password;
    delete updates.role;

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        farmDetails: user.farmDetails,
        restaurantDetails: user.restaurantDetails,
        distributorDetails: user.distributorDetails,
        inspectorDetails: user.inspectorDetails,
      },
    });

    // TODO: Publish user.updated event to RabbitMQ
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
