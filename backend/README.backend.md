# 🌾 Farm-to-Table Backend - Microservices Architecture

Backend infrastructure for the Smart Farm-to-Table Supply Chain platform built with microservices architecture.

## 🏗️ Architecture Overview

This backend consists of **7 microservices** + **1 API Gateway**, communicating through RabbitMQ message broker with service discovery via Consul.

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                          │
│                     (Port 4000)                             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼──────┐    ┌───────▼──────┐    ┌───────▼──────┐
│ User Service │    │Product Service│    │Order Service │
│  Port 3001   │    │  Port 3002    │    │  Port 3003   │
│   MongoDB    │    │   MongoDB     │    │   MongoDB    │
└──────────────┘    └───────────────┘    └──────────────┘

┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│Delivery Svc  │    │  Health Svc   │    │Notification  │
│  Port 3004   │    │  Port 3005    │    │Svc Port 3006 │
│   MongoDB    │    │   MongoDB     │    │  Socket.io   │
└──────────────┘    └───────────────┘    └──────────────┘

                    ┌───────────────┐
                    │ Chatbot Svc   │
                    │  Port 3007    │
                    └───────────────┘

┌────────────────────────────────────────────────────────────┐
│           RabbitMQ Message Broker (Port 5672)              │
│           Management UI (Port 15672)                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│           Consul Service Discovery (Port 8500)             │
└────────────────────────────────────────────────────────────┘
```

## 📦 Microservices

### 1. **User Service** (Port 3001)
- Authentication (JWT)
- User management
- Role-based access (Farmer, Restaurant, Distributor, Inspector)
- Profile management

**Endpoints:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update profile

### 2. **Product Service** (Port 3002)
- Product catalog
- Inventory management
- Search and filtering
- Stock tracking

**Endpoints:**
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `PATCH /api/products/:id/stock` - Update stock
- `DELETE /api/products/:id` - Delete product

### 3. **Order Service** (Port 3003)
- Order creation and management
- Order status tracking
- Timeline tracking
- Order cancellation

**Endpoints:**
- `GET /api/orders` - Get all orders (with filters)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/cancel` - Cancel order

### 4. **Delivery Service** (Port 3004)
- Delivery scheduling
- Route management
- Real-time location tracking
- Driver assignment

### 5. **Health Service** (Port 3005)
- Inspection scheduling
- Compliance tracking
- Violation management
- Reporting

### 6. **Notification Service** (Port 3006)
- Real-time notifications (Socket.io)
- Email notifications
- Push notifications
- Event-driven alerts

### 7. **Chatbot Service** (Port 3007)
- AI-powered chatbot
- Natural language processing
- Intent recognition
- Order tracking assistance

### 8. **API Gateway** (Port 4000)
- Request routing
- Load balancing
- Authentication middleware
- Rate limiting

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS)
- **Docker Desktop** (must be installed and running)
- **Docker Compose** (included with Docker Desktop)
- **MongoDB** (via Docker)
- **RabbitMQ** (via Docker)

### ⚠️ IMPORTANT: Start Docker Desktop First!

**Before running any Docker commands, make sure Docker Desktop is running!**

1. **Open Docker Desktop** application on your computer
2. Wait for Docker Desktop to fully start (you'll see "Docker Desktop is running" in the system tray)
3. Verify Docker is running by checking the Docker icon in your system tray/menu bar
4. Then proceed with the commands below

### Option 1: Docker Compose (Recommended)

1. **Start all services:**
```bash
cd backend
docker-compose up --build
```

2. **Access services:**
- API Gateway: http://localhost:4000
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- RabbitMQ Management: http://localhost:15672 (user: farm2table, pass: secret)
- Consul UI: http://localhost:8500

3. **Stop all services:**
```bash
docker-compose down
```

### Option 2: Local Development (Individual Services)

Each service can run independently for development:

**User Service:**
```bash
cd services/user-service
npm install
cp .env.example .env
npm run dev
```

**Product Service:**
```bash
cd services/product-service
npm install
cp .env.example .env
npm run dev
```

**Order Service:**
```bash
cd services/order-service
npm install
cp .env.example .env
npm run dev
```

> **Note:** Make sure MongoDB and RabbitMQ are running locally or update the connection strings in `.env`

## 🔧 Environment Variables

Each service has its own `.env` file. Example:

```bash
# Service Configuration
SERVICE_NAME=user-service
PORT=3001
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/users

# RabbitMQ
RABBITMQ_URL=amqp://farm2table:secret@localhost:5672

# Consul
CONSUL_HOST=localhost
CONSUL_PORT=8500

# JWT (User Service only)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

## 📡 Message Queuing (RabbitMQ)

Services communicate asynchronously via RabbitMQ events:

### Event Examples:

**Order Flow:**
```
order.created → Notify farmer
order.confirmed → Create delivery task
order.ready_for_pickup → Notify distributor
order.in_transit → Send real-time updates
order.delivered → Update analytics
```

**Product Flow:**
```
product.created → Index in search
product.out_of_stock → Notify customers
product.updated → Invalidate cache
```

## 🗄️ Database Schema

Each service has its own MongoDB database:

- **users** - User accounts and profiles
- **products** - Product catalog
- **orders** - Order records
- **deliveries** - Delivery tracking
- **health** - Inspections and compliance

## 🧪 Testing

Run tests for individual services:

```bash
cd services/user-service
npm test
```

## 📊 Monitoring

### Health Checks

Each service exposes a `/health` endpoint:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "user-service",
  "timestamp": "2025-11-05T20:00:00.000Z"
}
```

### RabbitMQ Management UI

Access at http://localhost:15672
- Username: `farm2table`
- Password: `secret`

Monitor:
- Queue depth
- Message rates
- Consumer activity
- Connection status

### Consul UI

Access at http://localhost:8500

View:
- Service health
- Service discovery
- Configuration

## 🔒 Security

- JWT authentication on protected routes
- Password hashing with bcrypt (10 rounds)
- CORS enabled
- Input validation
- Environment-based secrets

## 📝 Development Workflow

1. **Create new feature:**
```bash
git checkout -b feature/new-feature
```

2. **Make changes to service**
```bash
cd services/user-service
npm run dev
```

3. **Test changes:**
```bash
npm test
```

4. **Rebuild Docker image:**
```bash
docker-compose up --build user-service
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs farm2table-mongo-users
```

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
docker logs farm2table-rabbitmq

# Access RabbitMQ management
open http://localhost:15672
```

### Port Conflicts

If ports are already in use, update `docker-compose.yml`:

```yaml
ports:
  - "4001:4000"  # Change 4000 to 4001
```

## 📚 API Documentation

API documentation is available via Swagger (TODO):
- http://localhost:4000/api-docs

## 🔄 Current Status

### ✅ Completed
- [x] Docker Compose infrastructure
- [x] Shared libraries (database, rabbitmq, consul)
- [x] User Service (authentication)
- [x] Product Service (inventory)
- [x] Order Service (order management)

### 🚧 In Progress
- [ ] Delivery Service
- [ ] Health Service
- [ ] Notification Service (Socket.io)
- [ ] Chatbot Service
- [ ] API Gateway

### 📋 TODO
- [ ] RabbitMQ integration (all services)
- [ ] Consul service discovery
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Production deployment configuration

## 👥 Team

- **Backend Lead:** [Your Name]
- **Database:** [Team Member]
- **DevOps:** [Team Member]

## 📄 License

MIT License - See LICENSE file for details

---

**Built with** ❤️ **for Fall 2025 Web Development Final Project**
