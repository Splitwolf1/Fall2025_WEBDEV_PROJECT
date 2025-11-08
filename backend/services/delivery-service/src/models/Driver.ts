import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  distributorId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  email: string;
  status: 'on_route' | 'scheduled' | 'off_duty';
  vehicleAssigned?: string;
  licensedSince: string;
  deliveriesCompleted: number;
  deliveriesToday: number;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    distributorId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['on_route', 'scheduled', 'off_duty'],
      default: 'off_duty',
    },
    vehicleAssigned: String,
    licensedSince: {
      type: String,
      required: true,
    },
    deliveriesCompleted: {
      type: Number,
      default: 0,
    },
    deliveriesToday: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

DriverSchema.index({ distributorId: 1, status: 1 });
DriverSchema.index({ email: 1 });

export default mongoose.model<IDriver>('Driver', DriverSchema);

