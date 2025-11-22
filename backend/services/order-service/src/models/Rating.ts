import mongoose, { Schema, Document } from 'mongoose';

export enum RatingType {
  FARMER = 'farmer',
  DELIVERY = 'delivery',
  PRODUCT = 'product',
  DRIVER = 'driver',
}

export interface IRating extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  raterId: mongoose.Types.ObjectId; // The user giving the rating (restaurant)
  raterName: string;
  ratedUserId: mongoose.Types.ObjectId; // Farmer or distributor being rated
  ratedUserName: string;
  type: RatingType;
  rating: number; // 1-5 stars
  comment?: string;
  deliveryId?: mongoose.Types.ObjectId; // For delivery ratings
  productId?: mongoose.Types.ObjectId; // For product ratings
  driverId?: mongoose.Types.ObjectId; // For driver ratings
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    raterId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    raterName: {
      type: String,
      required: true,
    },
    ratedUserId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    ratedUserName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(RatingType),
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    deliveryId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
RatingSchema.index({ orderId: 1, type: 1 });
RatingSchema.index({ ratedUserId: 1, type: 1 });
RatingSchema.index({ raterId: 1, orderId: 1 });
RatingSchema.index({ rating: 1, type: 1 });

// Ensure one rating per order per type
RatingSchema.index({ orderId: 1, raterId: 1, type: 1 }, { unique: true });

export default mongoose.model<IRating>('Rating', RatingSchema);