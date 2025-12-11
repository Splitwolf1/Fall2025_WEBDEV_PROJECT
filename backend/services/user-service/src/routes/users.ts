import express, { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { getRabbitMQClient } from '../../shared/rabbitmq';

const router = express.Router();

// IMPORTANT: Specific routes MUST come before dynamic routes with parameters
// Get current user/me - MUST be before /:id route  
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

// Get user by ID (for service-to-service calls)
router.get('/:id', async (req: Request, res: Response) => {
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

// Get all users by role (for restaurants to find farmers/suppliers)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
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

        // Publish user.updated event to RabbitMQ
        try {
            const rabbitmq = await getRabbitMQClient();
            await rabbitmq.publish('farm2table.events', 'user.updated', {
                userId: user._id,
                email: user.email,
                role: user.role,
                updates: Object.keys(updates),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to publish user.updated event:', error);
        }
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
