import mongoose, { Schema, Document } from 'mongoose';

export enum InspectionType {
  ROUTINE = 'routine',
  RANDOM = 'random',
  COMPLAINT_BASED = 'complaint_based',
  FOLLOW_UP = 'follow_up',
}

export enum InspectionResult {
  PASS = 'pass',
  PASS_WITH_WARNINGS = 'pass_with_warnings',
  FAIL = 'fail',
  PENDING = 'pending',
}

export enum ViolationSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
}

export interface IInspection extends Document {
  inspectorId: mongoose.Types.ObjectId;
  inspectorName: string;
  targetType: 'farm' | 'distributor' | 'batch';
  targetId: mongoose.Types.ObjectId;
  targetName: string;
  inspectionType: InspectionType;
  scheduledDate: Date;
  completedDate?: Date;
  checklist: {
    category: string;
    item: string;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
  }[];
  result: InspectionResult;
  overallScore?: number;
  violations: {
    severity: ViolationSeverity;
    category: string;
    description: string;
    correctiveAction: string;
    deadline?: Date;
  }[];
  recommendations: string[];
  photos: string[];
  inspectorSignature?: string;
  inspectorNotes?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionSchema = new Schema<IInspection>(
  {
    inspectorId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    inspectorName: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['farm', 'distributor', 'batch'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      required: true,
    },
    inspectionType: {
      type: String,
      enum: Object.values(InspectionType),
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completedDate: Date,
    checklist: [
      {
        category: { type: String, required: true },
        item: { type: String, required: true },
        status: {
          type: String,
          enum: ['pass', 'fail', 'na'],
          required: true,
        },
        notes: String,
      },
    ],
    result: {
      type: String,
      enum: Object.values(InspectionResult),
      default: InspectionResult.PENDING,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    violations: [
      {
        severity: {
          type: String,
          enum: Object.values(ViolationSeverity),
          required: true,
        },
        category: { type: String, required: true },
        description: { type: String, required: true },
        correctiveAction: { type: String, required: true },
        deadline: Date,
      },
    ],
    recommendations: [String],
    photos: [String],
    inspectorSignature: String,
    inspectorNotes: String,
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
  },
  {
    timestamps: true,
  }
);

// Calculate overall score based on checklist
InspectionSchema.pre('save', function (next) {
  if (this.checklist.length > 0) {
    const passCount = this.checklist.filter((item) => item.status === 'pass').length;
    const totalCount = this.checklist.filter((item) => item.status !== 'na').length;
    this.overallScore = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  }
  next();
});

// Indexes
InspectionSchema.index({ inspectorId: 1, scheduledDate: -1 });
InspectionSchema.index({ targetType: 1, targetId: 1 });
InspectionSchema.index({ result: 1, completedDate: -1 });

export default mongoose.model<IInspection>('Inspection', InspectionSchema);
