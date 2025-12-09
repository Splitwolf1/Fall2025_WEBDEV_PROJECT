import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  FARMER = 'farmer',
  DISTRIBUTOR = 'distributor',
  RESTAURANT = 'restaurant',
  INSPECTOR = 'inspector',
  ADMIN = 'admin',
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  farmDetails?: {
    farmName: string;
    location: { lat: number; lng: number };
    address: string;
    certifications: string[];
  };
  restaurantDetails?: {
    businessName: string;
    location: { lat: number; lng: number };
    address: string;
    cuisine: string[];
  };
  distributorDetails?: {
    companyName: string;
    fleetSize: number;
    serviceAreas: string[];
  };
  inspectorDetails?: {
    licenseNumber: string;
    jurisdiction: string;
  };
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: String,
      avatar: String,
    },
    farmDetails: {
      farmName: String,
      location: {
        lat: Number,
        lng: Number,
      },
      address: String,
      certifications: [String],
    },
    restaurantDetails: {
      businessName: String,
      location: {
        lat: Number,
        lng: Number,
      },
      address: String,
      cuisine: [String],
    },
    distributorDetails: {
      companyName: String,
      fleetSize: Number,
      serviceAreas: [String],
    },
    inspectorDetails: {
      licenseNumber: String,
      jurisdiction: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', UserSchema);
