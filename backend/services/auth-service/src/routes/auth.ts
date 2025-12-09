import express, { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import { getRabbitMQClient } from '../../shared/rabbitmq';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
    try {
        console.log('[Auth-Service] Register request received');
        console.log('[Auth-Service] Request body keys:', Object.keys(req.body || {}));

        const { email, password, role, profile, ...roleDetails } = req.body;

        // Validate required fields
        if (!email || !password || !role || !profile) {
            console.log('[Auth-Service] Missing required fields:', { email: !!email, password: !!password, role: !!role, profile: !!profile });
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
        const jwtSecret: string = process.env.JWT_SECRET || 'secret';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            jwtSecret,
            { expiresIn } as SignOptions
        );

        console.log('[Auth-Service] Registration successful, sending response');
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
        console.log('[Auth-Service] Response sent successfully');

        // Publish user.created event to RabbitMQ
        try {
            const rabbitmq = await getRabbitMQClient();
            await rabbitmq.publish('farm2table.events', 'user.created', {
                userId: user._id,
                email: user.email,
                role: user.role,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to publish user.created event:', error);
        }
    } catch (error: any) {
        console.error('[Auth-Service] Registration error:', error);
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
        console.log('[Auth-Service] Login request received');
        console.log('[Auth-Service] Request body:', { email: req.body?.email, hasPassword: !!req.body?.password, role: req.body?.role });

        const { email, password, role } = req.body;

        // Validate required fields
        if (!email || !password) {
            console.log('[Auth-Service] Missing required fields');
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
        const jwtSecret: string = process.env.JWT_SECRET || 'secret';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            jwtSecret,
            { expiresIn } as SignOptions
        );

        console.log('[Auth-Service] Login successful, sending response');
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
        console.log('[Auth-Service] Response sent successfully');

        // Publish user.logged_in event to RabbitMQ
        try {
            const rabbitmq = await getRabbitMQClient();
            await rabbitmq.publish('farm2table.events', 'user.logged_in', {
                userId: user._id,
                email: user.email,
                role: user.role,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to publish user.logged_in event:', error);
        }
    } catch (error: any) {
        console.error('[Auth-Service] Login error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: error.message,
            });
        }
    }
});

export default router;
