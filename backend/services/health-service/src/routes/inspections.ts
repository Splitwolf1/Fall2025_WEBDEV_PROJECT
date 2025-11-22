import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Inspection, { InspectionResult } from '../models/Inspection';
import { getRabbitMQClient } from '../../../shared/rabbitmq';

const router = express.Router();

// Get all inspections with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      inspectorId,
      targetType,
      targetId,
      result,
      page = '1',
      limit = '20',
    } = req.query;

    let query: any = {};

    if (inspectorId) query.inspectorId = inspectorId;
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (result) query.result = result;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const inspections = await Inspection.find(query)
      .skip(skip)
      .limit(limitNum)
      .sort({ scheduledDate: -1 });

    const total = await Inspection.countDocuments(query);

    res.json({
      success: true,
      inspections,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get inspections error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get single inspection
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    res.json({
      success: true,
      inspection,
    });
  } catch (error: any) {
    console.error('Get inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create inspection (schedule)
router.post('/', async (req: Request, res: Response) => {
  try {
    const inspection = new Inspection(req.body);
    await inspection.save();

    res.status(201).json({
      success: true,
      message: 'Inspection scheduled successfully',
      inspection,
    });

    // Publish inspection.scheduled event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'inspection.scheduled', {
        inspectionId: inspection._id,
        inspectorId: inspection.inspectorId,
        targetType: inspection.targetType,
        targetId: inspection.targetId,
        type: inspection.type,
        scheduledDate: inspection.scheduledDate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to publish inspection.scheduled event:', error);
    }
  } catch (error: any) {
    console.error('Create inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Complete inspection
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const {
      checklist,
      violations,
      recommendations,
      photos,
      inspectorSignature,
      inspectorNotes,
      followUpRequired,
      followUpDate,
    } = req.body;

    const inspection = await Inspection.findById(req.params.id);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found',
      });
    }

    // Update inspection data
    if (checklist) inspection.checklist = checklist;
    if (violations) inspection.violations = violations;
    if (recommendations) inspection.recommendations = recommendations;
    if (photos) inspection.photos = photos;
    if (inspectorSignature) inspection.inspectorSignature = inspectorSignature;
    if (inspectorNotes) inspection.inspectorNotes = inspectorNotes;

    inspection.completedDate = new Date();
    inspection.followUpRequired = followUpRequired || false;
    if (followUpDate) inspection.followUpDate = followUpDate;

    // Determine result based on violations
    if (violations && violations.length > 0) {
      const hasCritical = violations.some((v: any) => v.severity === 'critical');
      inspection.result = hasCritical
        ? InspectionResult.FAIL
        : InspectionResult.PASS_WITH_WARNINGS;
    } else {
      inspection.result = InspectionResult.PASS;
    }

    await inspection.save();

    res.json({
      success: true,
      message: 'Inspection completed',
      inspection,
    });

    // Publish inspection.completed event to RabbitMQ
    try {
      const rabbitmq = await getRabbitMQClient();
      await rabbitmq.publish('farm2table.events', 'inspection.completed', {
        inspectionId: inspection._id,
        inspectorId: inspection.inspectorId,
        targetType: inspection.targetType,
        targetId: inspection.targetId,
        type: inspection.type,
        result: inspection.result,
        score: inspection.score,
        violationsCount: inspection.violations?.length || 0,
        completedAt: inspection.completedAt,
        timestamp: new Date().toISOString()
      });
      
      if (inspection.result === InspectionResult.FAIL) {
        // Publish compliance.violation event for failed inspections
        await rabbitmq.publish('farm2table.events', 'compliance.violation', {
          inspectionId: inspection._id,
          targetType: inspection.targetType,
          targetId: inspection.targetId,
          violations: inspection.violations,
          score: inspection.score,
          severity: 'critical', // Failed inspection is critical
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to publish inspection events:', error);
    }
  } catch (error: any) {
    console.error('Complete inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get compliance stats for a target
router.get('/stats/:targetType/:targetId', async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.params;

    const totalInspections = await Inspection.countDocuments({
      targetType,
      targetId,
    });

    const passedInspections = await Inspection.countDocuments({
      targetType,
      targetId,
      result: InspectionResult.PASS,
    });

    const failedInspections = await Inspection.countDocuments({
      targetType,
      targetId,
      result: InspectionResult.FAIL,
    });

    const recentInspection = await Inspection.findOne({
      targetType,
      targetId,
    }).sort({ completedDate: -1 });

    const averageScore = await Inspection.aggregate([
      {
        $match: {
          targetType,
          targetId: new mongoose.Types.ObjectId(targetId),
          overallScore: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$overallScore' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalInspections,
        passed: passedInspections,
        failed: failedInspections,
        averageScore: averageScore.length > 0 ? Math.round(averageScore[0].avgScore) : 0,
        recentInspection,
      },
    });
  } catch (error: any) {
    console.error('Get compliance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
