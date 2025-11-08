import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle';
import Driver from '../models/Driver';

const router = express.Router();

// Fleet health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Fleet management API is available',
    endpoints: {
      vehicles: '/api/fleet/vehicles',
      drivers: '/api/fleet/drivers',
    },
  });
});

// ========== VEHICLES ==========

// Get all vehicles
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const { distributorId, status } = req.query;

    let query: any = {};
    if (distributorId) {
      // Convert string ID to ObjectId if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(distributorId as string)) {
        query.distributorId = new mongoose.Types.ObjectId(distributorId as string);
      } else {
        query.distributorId = distributorId;
      }
    }
    if (status) query.status = status;

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      vehicles,
    });
  } catch (error: any) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single vehicle
router.get('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      vehicle,
    });
  } catch (error: any) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create vehicle
router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error: any) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update vehicle
router.patch('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error: any) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete vehicle
router.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// ========== DRIVERS ==========

// Get all drivers
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const { distributorId, status } = req.query;

    console.log(`[Fleet-Service] GET /api/fleet/drivers - Filters:`, { distributorId, status });

    let query: any = {};
    if (distributorId) {
      // Convert string ID to ObjectId if it's a valid MongoDB ObjectId
      if (mongoose.Types.ObjectId.isValid(distributorId as string)) {
        query.distributorId = new mongoose.Types.ObjectId(distributorId as string);
      } else {
        query.distributorId = distributorId;
      }
    }
    if (status) query.status = status;

    const drivers = await Driver.find(query).sort({ createdAt: -1 });

    console.log(`[Fleet-Service] Found ${drivers.length} drivers with query:`, query);

    res.json({
      success: true,
      drivers,
    });
  } catch (error: any) {
    console.error('[Fleet-Service] Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single driver
router.get('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    res.json({
      success: true,
      driver,
    });
  } catch (error: any) {
    console.error('Get driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create driver
router.post('/drivers', async (req: Request, res: Response) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();

    res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      driver,
    });
  } catch (error: any) {
    console.error('Create driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update driver
router.patch('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    res.json({
      success: true,
      message: 'Driver updated successfully',
      driver,
    });
  } catch (error: any) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete driver
router.delete('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found',
      });
    }

    res.json({
      success: true,
      message: 'Driver deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

