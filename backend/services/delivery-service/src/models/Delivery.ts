import mongoose, { Schema, Document } from 'mongoose';

export enum DeliveryStatus {
  SCHEDULED = 'scheduled',
  PICKUP_PENDING = 'pickup_pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export interface IDelivery extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  distributorId: mongoose.Types.ObjectId;
  driverName: string;
  driverPhone?: string;
  vehicleInfo: {
    type: string;
    plateNumber: string;
  };
  route: {
    pickup: {
      farmId: mongoose.Types.ObjectId;
      farmName: string;
      location: { lat: number; lng: number };
      address: string;
      scheduledTime: Date;
      actualTime?: Date;
    };
    delivery: {
      restaurantId: mongoose.Types.ObjectId;
      restaurantName: string;
      location: { lat: number; lng: number };
      address: string;
      scheduledTime: Date;
      actualTime?: Date;
    };
  };
  status: DeliveryStatus;
  currentLocation?: { lat: number; lng: number };
  estimatedArrivalTime?: Date;
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
    timestamp: Date;
    notes?: string;
  };
  timeline: {
    status: DeliveryStatus;
    timestamp: Date;
    location?: { lat: number; lng: number };
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    distributorId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhone: String,
    vehicleInfo: {
      type: {
        type: String,
        required: true,
      },
      plateNumber: {
        type: String,
        required: true,
      },
    },
    route: {
      pickup: {
        farmId: { type: Schema.Types.ObjectId, required: true },
        farmName: { type: String, required: true },
        location: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
        address: { type: String, required: true },
        scheduledTime: { type: Date, required: true },
        actualTime: Date,
      },
      delivery: {
        restaurantId: { type: Schema.Types.ObjectId, required: true },
        restaurantName: { type: String, required: true },
        location: {
          lat: { type: Number, required: true },
          lng: { type: Number, required: true },
        },
        address: { type: String, required: true },
        scheduledTime: { type: Date, required: true },
        actualTime: Date,
      },
    },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.SCHEDULED,
    },
    currentLocation: {
      lat: Number,
      lng: Number,
    },
    estimatedArrivalTime: Date,
    proofOfDelivery: {
      signature: String,
      photo: String,
      timestamp: Date,
      notes: String,
    },
    timeline: [
      {
        status: {
          type: String,
          enum: Object.values(DeliveryStatus),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: {
          lat: Number,
          lng: Number,
        },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add initial timeline entry
DeliverySchema.pre('save', function (next) {
  if (this.timeline.length === 0) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Delivery scheduled',
    });
  }
  next();
});

// Indexes
DeliverySchema.index({ orderId: 1 });
DeliverySchema.index({ distributorId: 1, status: 1 });
DeliverySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IDelivery>('Delivery', DeliverySchema);
