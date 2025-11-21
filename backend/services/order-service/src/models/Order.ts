import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  subtotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  farmerId: mongoose.Types.ObjectId;
  farmerName: string;
  items: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: { lat: number; lng: number };
  };
  scheduledPickupTime?: Date;
  scheduledDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  specialInstructions?: string;
  distributorId?: mongoose.Types.ObjectId;
  timeline: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: false, // Will be auto-generated in pre-save hook
      unique: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    farmerName: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, required: true },
        pricePerUnit: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    scheduledPickupTime: Date,
    scheduledDeliveryTime: Date,
    actualDeliveryTime: Date,
    specialInstructions: String,
    distributorId: Schema.Types.ObjectId,
    timeline: [
      {
        status: {
          type: String,
          enum: Object.values(OrderStatus),
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number
OrderSchema.pre('save', async function (this: IOrder & Document, next: () => void) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }

  // Add initial timeline entry
  if (this.timeline.length === 0) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created',
    });
  }

  next();
});

// Indexes
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ farmerId: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
