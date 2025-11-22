# 🚀 Farm-to-Table Services Startup Guide

## Issue Resolved: Chatbot RabbitMQ Integration ✅

The chatbot service has been fully implemented with:
- ✅ RabbitMQ event handling for real-time updates
- ✅ Service communication to Order, Delivery, Product, and User services
- ✅ Error handling and input validation
- ✅ Frontend integration with real API calls
- ✅ Docker configuration with proper environment variables

## Prerequisites

1. **Start Docker Desktop:**
   - Open Docker Desktop application
   - Wait for Docker to fully start (whale icon should be stable in menu bar)
   - Verify with: `docker --version`

## Start All Services

```bash
# 1. Navigate to backend directory
cd backend

# 2. Start all services with Docker Compose
docker-compose up --build

# This starts:
# - 🐰 RabbitMQ (Port 5672, Management UI: 15672)
# - 🗄️ 5 MongoDB databases (Ports 27017-27021)
# - 🔍 Consul service discovery (Port 8500)
# - 🚪 API Gateway (Port 4000)
# - 👤 User Service (Port 3001)
# - 🛒 Product Service (Port 3002)
# - 📦 Order Service (Port 3003)
# - 🚚 Delivery Service (Port 3004)
# - 🏥 Health Service (Port 3005)
# - 🔔 Notification Service (Port 3006)
# - 🤖 Chatbot Service (Port 3007) ← NEW!
```

## Start Frontend (Separate Terminal)

```bash
# Navigate to frontend directory
cd frontend

# Start Next.js development server
npm run dev

# Frontend will be available at: http://localhost:3000
```

## Verify Everything is Working

### 1. Check Docker Containers
```bash
docker ps
# Should show 15 running containers
```

### 2. Test Service Health Endpoints
```bash
curl http://localhost:3007/health  # Chatbot Service
curl http://localhost:3003/health  # Order Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:4000/health  # API Gateway
```

### 3. Test RabbitMQ Management UI
- Open: http://localhost:15672
- Login: `farm2table` / `secret`
- Check if queues are created

### 4. Test Chatbot Integration
```bash
# Test chatbot API directly
curl -X POST http://localhost:3007/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello chatbot!"}'
```

### 5. Test Frontend Integration
- Open: http://localhost:3000
- Click the chat widget (green circle in bottom right)
- Send a message and verify it gets responses from the real backend

## Troubleshooting

### If Docker fails to start:
```bash
# Check Docker status
docker info

# Restart Docker Desktop if needed
```

### If services won't start:
```bash
# Clean rebuild
docker-compose down
docker-compose up --build --force-recreate
```

### If chatbot can't reach other services:
```bash
# Check if services are in same network
docker network ls
docker network inspect backend_farm2table-network
```

## Service URLs Reference

| Service | Port | Health Check | Purpose |
|---------|------|-------------|---------|
| Frontend | 3000 | http://localhost:3000 | Next.js UI |
| User Service | 3001 | http://localhost:3001/health | Authentication |
| Product Service | 3002 | http://localhost:3002/health | Product catalog |
| Order Service | 3003 | http://localhost:3003/health | Order management |
| Delivery Service | 3004 | http://localhost:3004/health | Delivery tracking |
| Health Service | 3005 | http://localhost:3005/health | Health inspections |
| Notification Service | 3006 | http://localhost:3006/health | Real-time notifications |
| **Chatbot Service** | 3007 | http://localhost:3007/health | **AI Assistant** |
| API Gateway | 4000 | http://localhost:4000/health | Request routing |
| RabbitMQ | 5672 | http://localhost:15672 | Message broker |
| Consul | 8500 | http://localhost:8500 | Service discovery |

## Environment Variables Set

### Chatbot Service Environment:
- `ORDER_SERVICE_URL=http://order-service:3003`
- `DELIVERY_SERVICE_URL=http://delivery-service:3004`
- `PRODUCT_SERVICE_URL=http://product-service:3002`
- `USER_SERVICE_URL=http://user-service:3001`
- `RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672`

### Frontend Environment (.env.local):
- `NEXT_PUBLIC_CHATBOT_SERVICE_URL=http://localhost:3007`
- `NEXT_PUBLIC_API_URL=http://localhost:4000`

## What's New in the Chatbot Service

1. **Real Service Integration:**
   - Fetches actual order status from Order Service
   - Gets real delivery info from Delivery Service
   - Searches actual products from Product Service
   - Retrieves user orders from User Service

2. **RabbitMQ Event Handling:**
   - Subscribes to order.* events
   - Subscribes to delivery.* events
   - Subscribes to user.* events
   - Can provide proactive notifications

3. **Enhanced Error Handling:**
   - Input validation (message length, type checking)
   - Service timeout handling (5 seconds)
   - Retry mechanism for failed requests
   - User-friendly error messages

4. **Frontend Integration:**
   - Real-time API calls instead of hardcoded responses
   - Loading states with spinner
   - Error handling and retry options
   - Support for quick reply buttons

## Testing the Complete Flow

1. **Start all services** (Docker + Frontend)
2. **Open frontend** (http://localhost:3000)
3. **Click chat widget**
4. **Test these interactions:**
   - "Hello" → Should get greeting with quick replies
   - "Track order ORD-123" → Should try to fetch from Order Service
   - "Show me vegetables" → Should search Product Service
   - "What's my delivery time?" → Should get info from Delivery Service

The chatbot will now provide real data instead of hardcoded responses!

---

**Status: ✅ Chatbot RabbitMQ Integration Complete**
**Next: Start Docker Desktop and run `docker-compose up --build`**