# 🌾 Farm-to-Table Smart Supply Chain - Complete Project Roadmap

**Project Timeline**: 12 Weeks
**Team Size**: Recommend 3-4 developers
**Difficulty**: Advanced (Microservices Architecture)

---

## 📊 Executive Summary

This roadmap guides you through building a production-ready **Smart Farm-to-Table Supply Chain** platform using modern microservices architecture. The project demonstrates advanced concepts including:

- **Microservices**: 9 independent services
- **Message Queuing**: RabbitMQ for async communication
- **Real-time Updates**: Socket.io for live tracking
- **Service Discovery**: Dynamic service registration
- **API Gateway**: Centralized request routing
- **Containerization**: Docker + Docker Compose
- **Beautiful UI**: Next.js + Tailwind + Shadcn/UI

---

## 🗺️ Four-Phase Development Strategy

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Phase 1
    Frontend Foundation           :2025-01-01, 21d
    section Phase 2
    Core Backend Services         :2025-01-22, 21d
    section Phase 3
    Advanced Features             :2025-02-12, 21d
    section Phase 4
    Testing & Deployment          :2025-03-05, 21d
```

### Phase Distribution by Complexity

| Phase | Focus Area | Complexity | Time | Priority |
|-------|------------|------------|------|----------|
| **Phase 1** | Frontend UI/UX | Medium | 3 weeks | HIGH |
| **Phase 2** | Core Backend | High | 3 weeks | HIGH |
| **Phase 3** | Advanced Features | High | 3 weeks | MEDIUM |
| **Phase 4** | Testing & Deploy | Medium | 3 weeks | HIGH |

---

## 🎨 PHASE 1: Frontend Foundation & UI Design
**Duration**: Weeks 1-3
**Goal**: Beautiful, responsive frontend with all pages and components

### Key Deliverables
✅ Next.js 14 project with TypeScript
✅ Design system (colors, typography, components)
✅ Authentication pages (login, register)
✅ 4 role-based dashboards (Farmer, Distributor, Restaurant, Inspector)
✅ 20+ feature pages (inventory, orders, tracking, etc.)
✅ Reusable component library (50+ components)
✅ Chatbot widget UI
✅ Notification center
✅ Mobile-responsive (320px - 4K)

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI
- React Query
- Zustand
- Socket.io Client
- Recharts

### Detailed Breakdown
See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for week-by-week frontend implementation guide.

---

## 🔧 PHASE 2: Core Backend Services
**Duration**: Weeks 4-6
**Goal**: Build essential microservices with database integration

### Week 4: Infrastructure Setup

#### 4.1 Project Structure
```bash
mkdir -p smart-supply-chain/{api-gateway,services,shared,docker}
cd smart-supply-chain

# Initialize services
mkdir -p services/{user-service,product-service,order-service,delivery-service}
mkdir -p services/{health-service,notification-service,chatbot-service}
```

#### 4.2 Docker Compose Infrastructure

**📁 File**: `docker-compose.yml`
```yaml
version: '3.8'

services:
  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: farm2table
      RABBITMQ_DEFAULT_PASS: secret
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # Service Discovery
  consul:
    image: consul:latest
    ports:
      - "8500:8500"
      - "8600:8600"
    command: agent -server -ui -bootstrap-expect=1 -client=0.0.0.0

  # Databases (one per service)
  mongo-users:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_users_data:/data/db

  mongo-products:
    image: mongo:7
    ports:
      - "27018:27017"
    volumes:
      - mongo_products_data:/data/db

  mongo-orders:
    image: mongo:7
    ports:
      - "27019:27017"
    volumes:
      - mongo_orders_data:/data/db

  mongo-deliveries:
    image: mongo:7
    ports:
      - "27020:27017"
    volumes:
      - mongo_deliveries_data:/data/db

  mongo-health:
    image: mongo:7
    ports:
      - "27021:27017"
    volumes:
      - mongo_health_data:/data/db

  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CONSUL_HOST=consul
      - CONSUL_PORT=8500
    depends_on:
      - consul
      - rabbitmq

  # Microservices
  user-service:
    build: ./services/user-service
    ports:
      - "3001:3001"
    environment:
      - SERVICE_NAME=user-service
      - PORT=3001
      - MONGO_URI=mongodb://mongo-users:27017/users
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
      - JWT_SECRET=your-secret-key-change-in-production
    depends_on:
      - mongo-users
      - rabbitmq
      - consul

  product-service:
    build: ./services/product-service
    ports:
      - "3002:3002"
    environment:
      - SERVICE_NAME=product-service
      - PORT=3002
      - MONGO_URI=mongodb://mongo-products:27017/products
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
    depends_on:
      - mongo-products
      - rabbitmq
      - consul

  order-service:
    build: ./services/order-service
    ports:
      - "3003:3003"
    environment:
      - SERVICE_NAME=order-service
      - PORT=3003
      - MONGO_URI=mongodb://mongo-orders:27017/orders
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
    depends_on:
      - mongo-orders
      - rabbitmq
      - consul

  delivery-service:
    build: ./services/delivery-service
    ports:
      - "3004:3004"
    environment:
      - SERVICE_NAME=delivery-service
      - PORT=3004
      - MONGO_URI=mongodb://mongo-deliveries:27017/deliveries
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
    depends_on:
      - mongo-deliveries
      - rabbitmq
      - consul

  health-service:
    build: ./services/health-service
    ports:
      - "3005:3005"
    environment:
      - SERVICE_NAME=health-service
      - PORT=3005
      - MONGO_URI=mongodb://mongo-health:27017/health
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
    depends_on:
      - mongo-health
      - rabbitmq
      - consul

  notification-service:
    build: ./services/notification-service
    ports:
      - "3006:3006"
    environment:
      - SERVICE_NAME=notification-service
      - PORT=3006
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
      - SOCKETIO_PORT=3006
    depends_on:
      - rabbitmq
      - consul

  chatbot-service:
    build: ./services/chatbot-service
    ports:
      - "3007:3007"
    environment:
      - SERVICE_NAME=chatbot-service
      - PORT=3007
      - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
      - CONSUL_HOST=consul
    depends_on:
      - rabbitmq
      - consul

volumes:
  rabbitmq_data:
  mongo_users_data:
  mongo_products_data:
  mongo_orders_data:
  mongo_deliveries_data:
  mongo_health_data:
```

#### 4.3 Shared Libraries

**📁 File**: `shared/database.ts`
```typescript
import mongoose from 'mongoose';

export const connectDB = async (uri: string) => {
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
```

**📁 File**: `shared/rabbitmq.ts`
```typescript
import amqp from 'amqplib';

export class RabbitMQClient {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(url: string) {
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
  }

  async publish(exchange: string, routingKey: string, message: any) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async subscribe(queue: string, exchange: string, pattern: string, callback: Function) {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, pattern);

    this.channel.consume(queue, (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        callback(content);
        this.channel.ack(msg);
      }
    });
  }
}
```

**📁 File**: `shared/consul.ts`
```typescript
import Consul from 'consul';

export const registerService = async (
  serviceName: string,
  port: number,
  consulHost: string = 'localhost'
) => {
  const consul = new Consul({ host: consulHost, port: 8500 });

  const registration = {
    name: serviceName,
    id: `${serviceName}-${port}`,
    address: 'localhost',
    port,
    check: {
      http: `http://localhost:${port}/health`,
      interval: '10s',
      timeout: '5s',
    },
  };

  await consul.agent.service.register(registration);
  console.log(`✅ ${serviceName} registered with Consul`);
};
```

### Week 5: Core Services Implementation

#### 5.1 User Service (Authentication & Authorization)

**📁 File**: `services/user-service/src/models/User.ts`
```typescript
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
    certifications: string[];
  };
  restaurantDetails?: {
    businessName: string;
    location: { lat: number; lng: number };
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
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), required: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: String,
      avatar: String,
    },
    farmDetails: {
      farmName: String,
      location: { lat: Number, lng: Number },
      certifications: [String],
    },
    restaurantDetails: {
      businessName: String,
      location: { lat: Number, lng: Number },
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
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
```

**📁 File**: `services/user-service/src/routes/auth.ts`
```typescript
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, profile, ...roleDetails } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      role,
      profile,
      [`${role}Details`]: roleDetails,
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Middleware: Authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

export default router;
```

#### 5.2 Product Service (Inventory Management)

**📁 File**: `services/product-service/src/models/Product.ts`
```typescript
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
  unit: string; // 'lb', 'kg', 'unit', 'dozen'
  stockQuantity: number;
  qualityGrade: QualityGrade;
  images: string[];
  certifications: string[]; // 'Organic', 'Non-GMO', 'Fair Trade'
  harvestDate: Date;
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
    farmerId: { type: Schema.Types.ObjectId, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, enum: Object.values(ProductCategory), required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    stockQuantity: { type: Number, required: true, min: 0 },
    qualityGrade: { type: String, enum: Object.values(QualityGrade), default: 'A' },
    images: [String],
    certifications: [String],
    harvestDate: { type: Date },
    isAvailable: { type: Boolean, default: true },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Indexes for search
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, isAvailable: 1 });
ProductSchema.index({ farmerId: 1, isAvailable: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
```

**📁 File**: `services/product-service/src/routes/products.ts`
```typescript
import express from 'express';
import Product from '../models/Product';

const router = express.Router();

// Get all products (with filters)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      farmerId,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    let query: any = { isAvailable: true };

    if (category) query.category = category;
    if (farmerId) query.farmerId = farmerId;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create product (farmer only)
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Publish event to RabbitMQ
    await rabbitMQ.publish('farm2table', 'product.created', {
      productId: product._id,
      farmerId: product.farmerId,
      name: product.name,
    });

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stockQuantity: quantity },
      { new: true }
    );

    if (quantity === 0) {
      await rabbitMQ.publish('farm2table', 'product.out_of_stock', {
        productId: product._id,
        farmerId: product.farmerId,
      });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
```

#### 5.3 Order Service (Order Management)

**📁 File**: `services/order-service/src/models/Order.ts`
```typescript
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
  customerId: mongoose.Types.ObjectId; // Restaurant ID
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
  scheduledPickupTime: Date;
  scheduledDeliveryTime: Date;
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
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, required: true, index: true },
    customerName: { type: String, required: true },
    farmerId: { type: Schema.Types.ObjectId, required: true, index: true },
    farmerName: { type: String, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
        pricePerUnit: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
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
      coordinates: { lat: Number, lng: Number },
    },
    scheduledPickupTime: Date,
    scheduledDeliveryTime: Date,
    actualDeliveryTime: Date,
    specialInstructions: String,
    distributorId: Schema.Types.ObjectId,
    timeline: [
      {
        status: { type: String, enum: Object.values(OrderStatus) },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate order number
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);
```

**Event-Driven Order Flow**:
```typescript
// When order is created
await rabbitMQ.publish('farm2table', 'order.created', {
  orderId: order._id,
  farmerId: order.farmerId,
  customerId: order.customerId,
  totalAmount: order.totalAmount,
});

// When order is confirmed by farmer
await rabbitMQ.publish('farm2table', 'order.confirmed', {
  orderId: order._id,
  farmerId: order.farmerId,
  customerId: order.customerId,
});

// When order is ready for pickup
await rabbitMQ.publish('farm2table', 'order.ready_for_pickup', {
  orderId: order._id,
  farmerId: order.farmerId,
  pickupLocation: order.farmLocation,
});
```

### Week 6: Delivery, Health & Notification Services

#### 6.1 Delivery Service

**📁 File**: `services/delivery-service/src/models/Delivery.ts`
```typescript
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
  vehicleInfo: {
    type: string; // 'van', 'truck', 'refrigerated'
    plateNumber: string;
  };
  route: {
    pickup: {
      farmId: mongoose.Types.ObjectId;
      farmName: string;
      location: { lat: number; lng: number };
      scheduledTime: Date;
      actualTime?: Date;
    };
    delivery: {
      restaurantId: mongoose.Types.ObjectId;
      restaurantName: string;
      location: { lat: number; lng: number };
      scheduledTime: Date;
      actualTime?: Date;
    };
  };
  status: DeliveryStatus;
  currentLocation?: { lat: number; lng: number };
  estimatedArrivalTime?: Date;
  proofOfDelivery?: {
    signature: string;
    photo: string;
    timestamp: Date;
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
```

**Real-time Location Updates** (Socket.io):
```typescript
// Distributor updates location
socket.on('update_location', async (data) => {
  const { deliveryId, location } = data;

  await Delivery.findByIdAndUpdate(deliveryId, {
    currentLocation: location,
    estimatedArrivalTime: calculateETA(location, destination),
  });

  // Broadcast to customer
  io.to(`order-${orderId}`).emit('delivery_location_update', {
    location,
    eta: calculateETA(location, destination),
  });
});
```

#### 6.2 Health Compliance Service

**📁 File**: `services/health-service/src/models/Inspection.ts`
```typescript
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
    item: string;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
  }[];
  result: InspectionResult;
  violations: string[];
  recommendations: string[];
  photos: string[];
  inspectorSignature: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Compliance Workflow**:
1. Inspector schedules inspection → RabbitMQ event
2. Farmer/Distributor receives notification
3. Inspection completed → Results stored
4. If fail → Publish `compliance.violation` event
5. Notification sent to all stakeholders

#### 6.3 Notification Service

**📁 File**: `services/notification-service/src/index.ts`
```typescript
import { Server } from 'socket.io';
import { RabbitMQClient } from '../../../shared/rabbitmq';

const io = new Server(3006, {
  cors: { origin: '*' },
});

const rabbitMQ = new RabbitMQClient();

// Listen to all events
rabbitMQ.subscribe('notifications', 'farm2table', '#', async (message) => {
  const { event, data } = message;

  switch (event) {
    case 'order.created':
      // Notify farmer
      io.to(`user-${data.farmerId}`).emit('notification', {
        type: 'new_order',
        title: 'New Order Received',
        message: `Order #${data.orderNumber} for $${data.totalAmount}`,
        data,
      });
      break;

    case 'order.confirmed':
      // Notify customer
      io.to(`user-${data.customerId}`).emit('notification', {
        type: 'order_confirmed',
        title: 'Order Confirmed',
        message: `Your order #${data.orderNumber} has been confirmed`,
        data,
      });
      break;

    case 'delivery.in_transit':
      // Notify customer with live tracking
      io.to(`user-${data.customerId}`).emit('notification', {
        type: 'delivery_update',
        title: 'Delivery In Transit',
        message: `Your order is on the way! ETA: ${data.eta}`,
        data,
      });
      break;

    // ... more event handlers
  }
});

// User connections
io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  socket.join(`user-${userId}`);

  console.log(`User ${userId} connected to notifications`);

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});
```

---

## 🚀 PHASE 3: Advanced Features
**Duration**: Weeks 7-9
**Goal**: Implement chatbot, analytics, search, and optimization

### Week 7: AI Chatbot Service

#### 7.1 NLP-Powered Chatbot

**Intent Recognition**:
```typescript
enum ChatIntent {
  TRACK_ORDER = 'track_order',
  PRODUCT_INQUIRY = 'product_inquiry',
  PRICING = 'pricing',
  DELIVERY_TIME = 'delivery_time',
  COMPLAINT = 'complaint',
  GENERAL_FAQ = 'general_faq',
}

async function detectIntent(message: string): Promise<ChatIntent> {
  // Simple keyword matching (can upgrade to ML model)
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('order') && lowerMessage.includes('status')) {
    return ChatIntent.TRACK_ORDER;
  }
  if (lowerMessage.includes('delivery') || lowerMessage.includes('eta')) {
    return ChatIntent.DELIVERY_TIME;
  }
  // ... more intent detection
}

async function handleChatMessage(userId: string, message: string) {
  const intent = await detectIntent(message);

  switch (intent) {
    case ChatIntent.TRACK_ORDER:
      // Extract order number from message
      const orderNumber = extractOrderNumber(message);
      const order = await getOrderStatus(orderNumber);
      return {
        text: `Your order ${orderNumber} is currently **${order.status}**.
               Expected delivery: ${order.scheduledDeliveryTime}`,
        quickReplies: ['Track on map', 'Contact driver', 'Cancel order'],
      };

    case ChatIntent.DELIVERY_TIME:
      // Get user's active orders
      const activeOrders = await getActiveOrders(userId);
      return {
        text: `You have ${activeOrders.length} active deliveries:`,
        orders: activeOrders.map(o => ({
          orderNumber: o.orderNumber,
          eta: o.estimatedDeliveryTime,
        })),
      };

    default:
      return {
        text: "I'm here to help! You can ask me about:\n" +
              "• Order status\n" +
              "• Delivery times\n" +
              "• Product availability\n" +
              "• Pricing information",
        quickReplies: ['Track my order', 'Browse products', 'Talk to support'],
      };
  }
}
```

### Week 8: Analytics & Reporting

#### 8.1 Dashboard Analytics

**Farmer Analytics**:
- Total sales (daily, weekly, monthly)
- Top-selling products
- Average order value
- Customer retention rate
- Revenue trends (chart)

**Restaurant Analytics**:
- Order frequency
- Spending analysis
- Favorite suppliers
- Delivery reliability scores

**Distributor Analytics**:
- Deliveries completed
- On-time percentage
- Route efficiency
- Earnings breakdown

**📁 File**: `services/analytics-service/src/aggregations.ts`
```typescript
// Farmer sales aggregation
export async function getFarmerSalesStats(farmerId: string, period: 'day' | 'week' | 'month') {
  const startDate = getStartDate(period);

  const stats = await Order.aggregate([
    {
      $match: {
        farmerId: new mongoose.Types.ObjectId(farmerId),
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'in_transit'] },
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' },
        averageOrderValue: { $avg: '$totalAmount' },
      },
    },
  ]);

  return stats[0];
}

// Top products
export async function getTopProducts(farmerId: string, limit = 10) {
  return Order.aggregate([
    { $match: { farmerId: new mongoose.Types.ObjectId(farmerId) } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
  ]);
}
```

### Week 9: Search, Filtering & Optimization

#### 9.1 Advanced Search (Elasticsearch - Optional)

**Product Search**:
- Full-text search
- Faceted filtering (category, price, certifications)
- Geolocation-based search
- Auto-suggestions

#### 9.2 Performance Optimization

**Caching Strategy** (Redis):
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
});

// Cache product listings
export async function getProducts(filters: any) {
  const cacheKey = `products:${JSON.stringify(filters)}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from DB
  const products = await Product.find(filters);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(products));

  return products;
}
```

**Database Indexing**:
```typescript
// Compound indexes for common queries
ProductSchema.index({ category: 1, isAvailable: 1, price: 1 });
OrderSchema.index({ customerId: 1, status: 1, createdAt: -1 });
DeliverySchema.index({ distributorId: 1, status: 1 });
```

**API Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
});

app.use('/api/', limiter);
```

---

## 🧪 PHASE 4: Testing & Deployment
**Duration**: Weeks 10-12
**Goal**: Comprehensive testing and production deployment

### Week 10: Testing

#### 10.1 Unit Tests (Jest)

```typescript
// services/order-service/tests/order.test.ts
describe('Order Service', () => {
  it('should create a new order', async () => {
    const orderData = {
      customerId: 'customer123',
      farmerId: 'farmer456',
      items: [
        { productId: 'prod789', quantity: 10, pricePerUnit: 5 },
      ],
    };

    const order = await createOrder(orderData);

    expect(order.orderNumber).toBeDefined();
    expect(order.totalAmount).toBe(50);
    expect(order.status).toBe('pending');
  });

  it('should update order status', async () => {
    const order = await updateOrderStatus(orderId, 'confirmed');
    expect(order.status).toBe('confirmed');
  });
});
```

#### 10.2 Integration Tests

```typescript
// Test RabbitMQ event flow
describe('Order Flow Integration', () => {
  it('should trigger delivery service when order is confirmed', async () => {
    // Create order
    const order = await createOrder(orderData);

    // Confirm order (publishes event)
    await confirmOrder(order._id);

    // Wait for event to be processed
    await delay(1000);

    // Check if delivery was created
    const delivery = await Delivery.findOne({ orderId: order._id });
    expect(delivery).toBeDefined();
    expect(delivery.status).toBe('scheduled');
  });
});
```

#### 10.3 E2E Tests (Playwright/Cypress)

```typescript
// Test complete user flow
test('Restaurant can place order and track delivery', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'restaurant@test.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Browse products
  await page.goto('/restaurant/browse');
  await page.click('text=Organic Tomatoes');
  await page.click('button:has-text("Add to Cart")');

  // Checkout
  await page.click('text=Checkout');
  await page.fill('[name="deliveryDate"]', '2025-12-01');
  await page.click('button:has-text("Place Order")');

  // Verify order confirmation
  await expect(page.locator('text=Order confirmed')).toBeVisible();

  // Track order
  await page.goto('/restaurant/orders');
  await expect(page.locator('.order-status')).toContainText('confirmed');
});
```

### Week 11: Deployment Setup

#### 11.1 Production Environment Variables

**📁 File**: `.env.production`
```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/farm2table

# RabbitMQ (CloudAMQP)
RABBITMQ_URL=amqps://user:pass@instance.cloudamqp.com/vhost

# JWT
JWT_SECRET=super-secret-change-in-production-use-env-vars

# Redis (Upstash)
REDIS_URL=redis://username:password@host:port

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx

# File Upload (AWS S3)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=farm2table-uploads

# Google Maps
GOOGLE_MAPS_API_KEY=xxx

# Sentry (Error tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx
```

#### 11.2 Docker Production Build

**📁 File**: `services/user-service/Dockerfile.prod`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

#### 11.3 Kubernetes Deployment (Optional)

**📁 File**: `k8s/user-service-deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: your-registry/user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: mongo-secret
              key: uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: jwt-secret
              key: secret
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Week 12: Deployment & Monitoring

#### 12.1 Deployment Options

**Option 1: AWS (Recommended)**
- **Frontend**: Vercel or AWS Amplify
- **Backend**: AWS ECS (Fargate) or EKS
- **Database**: MongoDB Atlas
- **Message Queue**: AWS MQ (RabbitMQ)
- **File Storage**: S3
- **CDN**: CloudFront

**Option 2: DigitalOcean**
- **Frontend**: Vercel
- **Backend**: DigitalOcean App Platform
- **Database**: MongoDB Atlas
- **Message Queue**: CloudAMQP

**Option 3: Self-Hosted (VPS)**
- **Server**: DigitalOcean Droplet / Linode
- **Reverse Proxy**: NGINX
- **SSL**: Let's Encrypt
- **Container Orchestration**: Docker Compose or K3s

#### 12.2 CI/CD Pipeline (GitHub Actions)

**📁 File**: `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Lint
        run: npm run lint

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, product-service, order-service]
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          cd services/${{ matrix.service }}
          docker build -t farm2table/${{ matrix.service }}:${{ github.sha }} .
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push farm2table/${{ matrix.service }}:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # SSH to server and pull new images
          # Restart services with docker-compose
```

#### 12.3 Monitoring & Logging

**Application Monitoring (Sentry)**:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Error tracking
app.use(Sentry.Handlers.errorHandler());
```

**Logging (Winston)**:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

logger.info('Order created', { orderId: order._id });
```

**Metrics (Prometheus + Grafana)**:
- Request count & latency
- Database query performance
- RabbitMQ queue depth
- Error rates
- Active users

---

## 📊 Final Deliverables

### By End of Week 12

✅ **Frontend**:
- Fully responsive web application
- 4 role-based interfaces
- Real-time notifications
- Chatbot integration
- Mobile-optimized

✅ **Backend**:
- 9 microservices (containerized)
- RabbitMQ message queuing
- MongoDB databases (per service)
- API Gateway
- Service discovery
- Authentication & authorization

✅ **Features**:
- User registration & login
- Product catalog & search
- Order placement & tracking
- Delivery management
- Health inspections
- Real-time chat
- Push notifications
- Analytics dashboards

✅ **DevOps**:
- Docker Compose setup
- CI/CD pipeline
- Production deployment
- Monitoring & logging
- Error tracking

✅ **Documentation**:
- API documentation (Swagger)
- Architecture diagrams
- Database schemas
- Deployment guide
- User manual

---

## 🎓 Learning Outcomes

By completing this project, you will master:

1. **Microservices Architecture**: Service decomposition, communication patterns
2. **Message Queuing**: Asynchronous event-driven systems with RabbitMQ
3. **Real-time Systems**: WebSockets (Socket.io) for live updates
4. **Database Design**: MongoDB schema design, indexing, aggregations
5. **API Design**: RESTful APIs, authentication, authorization
6. **Frontend Development**: Next.js, TypeScript, Tailwind CSS, state management
7. **DevOps**: Docker, CI/CD, deployment strategies
8. **System Design**: Scalability, reliability, monitoring

---

## 🚨 Common Pitfalls to Avoid

1. **Over-engineering**: Start simple, add complexity as needed
2. **Tight Coupling**: Services should be independent
3. **No Error Handling**: Always handle edge cases
4. **Poor Database Design**: Plan schema before coding
5. **Skipping Tests**: Write tests as you build
6. **Ignoring Security**: Validate inputs, use HTTPS, secure secrets
7. **No Monitoring**: Add logging from day 1

---

## 📚 Additional Resources

### Documentation
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Schema Design](https://www.mongodb.com/developer/products/mongodb/mongodb-schema-design-best-practices/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Next.js Documentation](https://nextjs.org/docs)

### Tools
- **Design**: Figma, Excalidraw (architecture diagrams)
- **API Testing**: Postman, Insomnia
- **Database**: MongoDB Compass, Studio 3T
- **Monitoring**: Sentry, LogRocket, DataDog

---

## 🎯 Success Criteria

Your project is successful when:

- [ ] All 4 user roles can complete their workflows
- [ ] Orders flow from restaurant → farmer → distributor → delivery
- [ ] Real-time updates work (order status, delivery tracking)
- [ ] Chatbot responds accurately to queries
- [ ] System handles 100+ concurrent users
- [ ] Mobile experience is smooth
- [ ] No critical security vulnerabilities
- [ ] Deployment is automated (CI/CD)
- [ ] Documentation is complete

---

**Good luck with your final semester project! 🚀**

*For questions or clarifications, refer to the detailed phase documents.*
