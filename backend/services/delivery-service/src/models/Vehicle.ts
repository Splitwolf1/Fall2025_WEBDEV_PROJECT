import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Omit<Document, 'model'> {
  distributorId: mongoose.Types.ObjectId;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: 'active' | 'available' | 'maintenance';
  currentDriver?: string;
  currentLocation?: string;
  mileage: number;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  capacity: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
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
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'available', 'maintenance'],
      default: 'available',
    },
    currentDriver: String,
    currentLocation: String,
    mileage: {
      type: Number,
      default: 0,
    },
    lastMaintenance: Date,
    nextMaintenance: Date,
    capacity: {
      type: String,
      default: 'N/A',
    },
  },
  {
    timestamps: true,
  }
);

VehicleSchema.index({ distributorId: 1, status: 1 });
VehicleSchema.index({ licensePlate: 1 });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);

