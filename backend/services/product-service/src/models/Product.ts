import mongoose, { Schema, Document } from 'mongoose';

export enum ProductCategory {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  HERBS = 'herbs',
  DAIRY = 'dairy',
  GRAINS = 'grains',
  EGGS = 'eggs',
  MEAT = 'meat',
}

export enum QualityGrade {
  A = 'A',
  B = 'B',
  C = 'C',
}

export interface IProduct extends Document {
  farmerId: mongoose.Types.ObjectId;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  unit: string;
  stockQuantity: number;
  qualityGrade: QualityGrade;
  images: string[];
  certifications: string[];
  harvestDate?: Date;
  isAvailable: boolean;
  rating: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    farmerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    qualityGrade: {
      type: String,
      enum: Object.values(QualityGrade),
      default: QualityGrade.A,
    },
    images: [String],
    certifications: [String],
    harvestDate: Date,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Text search indexes
ProductSchema.index({ name: 'text', description: 'text' });

// Compound indexes for common queries
ProductSchema.index({ category: 1, isAvailable: 1 });
ProductSchema.index({ farmerId: 1, isAvailable: 1 });
ProductSchema.index({ price: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
