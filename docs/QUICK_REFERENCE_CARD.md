# 🚀 Farm2Table - Quick Reference Card

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DUAL GATEWAY ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────────┘

Frontend (localhost:3000)
    │
    │ HTTP/WebSocket
    ↓
External API Gateway (localhost:4000) ←── Client Requests
    │                                      JWT Auth, Rate Limiting
    ├─→ Auth Service (3001)               
    ├─→ User Service (3002)               
    ├─→ Product Service (3003)            
    ├─→ Order Service (3004)              
    ├─→ Delivery Service (3005)           
    ├─→ Health Service (3006)             
    ├─→ Notification Service (3007) ─┬─→ Socket.io (Real-time)
    └─→ Chatbot Service (3008)       └─→ Resend (Email)
         │                  ↑
         │                  │
         ↓                  │
    RabbitMQ (5672) ────────┴─ Event Bus
         ↑                  │
         │                  ↓
Internal API Gateway (localhost:4001) ←── Service-to-Service
    Service Authentication & Routing
```

---

## 🚀 Quick Start Commands

### **Start Everything:**
```bash
# Backend (in backend/)
docker-compose up

# Frontend (in frontend/)
npm run dev
```

### **Access Points:**
- **Frontend:** http://localhost:3000
- **External API:** http://localhost:4000
- **Internal API:** http://localhost:4001
- **RabbitMQ UI:** http://localhost:15672 (farm2table / secret)

---

## 🎯 Services & Ports

| Service | Port | Purpose |
|---------|------|---------|
| **External Gateway** | 4000 | Client requests |
| **Internal Gateway** | 4001 | Service-to-service |
| **Auth Service** | 3001 | Login/Register |
| **User Service** | 3002 | Profile management |
| **Product Service** | 3003 | Product catalog |
| **Order Service** | 3004 | Order management |
| **Delivery Service** | 3005 | Delivery tracking |
| **Health Service** | 3006 | Inspections |
| **Notification Service** | 3007 | Real-time + Email |
| **Chatbot Service** | 3008 | AI Assistant |

---

## 🔑 Key Technologies

### **1. Dual Gateway Pattern**
- **External (4000):** Public API for clients
- **Internal (4001):** Private API for services
- **Why:** Security, scalability, monitoring

### **2. RabbitMQ (Message Broker)**
- **Port:** 5672 (AMQP), 15672 (Management UI)
- **Credentials:** farm2table / secret
- **Purpose:** Async event communication
- **Events:** order.created, delivery.updated, etc.

### **3. Socket.io (Real-time)**
- **Port:** 3007 (Notification Service)
- **Purpose:** Live notifications to users
- **Features:** Room-based messaging, auto-reconnect

### **4. Resend (Email Service)**
- **API:** Integrated in Notification Service
- **Templates:** Orders, Deliveries, Inspections
- **Domain:** noreply@resend.dev (test mode)

### **5. Docker Compose**
- **Containers:** 19 total (10 services + 9 databases)
- **Networks:** farm2table-network
- **Volumes:** Named volumes for persistence

---

## 📁 Project Structure

```
Farm2Table/
├── frontend/               # Next.js 16 + React 19
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # UI components
│   │   ├── hooks/         # useNotifications, etc.
│   │   └── lib/           # API client, utils
│   └── package.json
│
├── backend/
│   ├── gateways/          # API Gateways
│   │   ├── external-api-gateway/  (4000)
│   │   └── internal-api-gateway/  (4001)
│   │
│   ├── services/          # Microservices
│   │   ├── auth-service/         (3001)
│   │   ├── user-service/         (3002)
│   │   ├── product-service/      (3003)
│   │   ├── order-service/        (3004)
│   │   ├── delivery-service/     (3005)
│   │   ├── health-service/       (3006)
│   │   ├── notification-service/ (3007)
│   │   └── chatbot-service/      (3008)
│   │
│   ├── shared/            # Shared modules
│   │   ├── database.ts
│   │   ├── rabbitmq.ts
│   │   └── consul.ts
│   │
│   ├── docker-compose.yml
│   └── sync-shared.js     # Sync shared modules
│
└── Documentation files
```

---

## 🔐 Authentication Flow

```
1. User → POST /api/auth/login → Auth Service (3001)
2. Auth Service → Returns JWT token
3. Frontend → Stores token in localStorage + cookie
4. Future requests → Include JWT in Authorization header
5. External Gateway → Validates JWT → Routes to service
```

---

## 📬 Notification System

### **Dual Channel Delivery:**
1. **Browser (Socket.io):** Instant real-time updates
2. **Email (Resend):** Persistent notifications

### **Notification Types:**
- 📦 Order confirmations & updates
- 🚚 Delivery tracking
- 🔍 Inspection scheduling
- 💬 Messages & alerts

### **Frontend Usage:**
```tsx
import { useNotifications } from '@/hooks/useNotifications';

const { notifications, unreadCount, isConnected } = useNotifications();
```

---

## 🧪 Testing Endpoints

### **Health Checks:**
```bash
# Test all services
for port in 3001 3002 3003 3004 3005 3006 3007 3008 4000 4001; do
  curl http://localhost:$port/health
done
```

### **Send Test Notification:**
```bash
curl -X POST http://localhost:3007/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "type": "order",
    "title": "Test Order",
    "message": "This is a test"
  }'
```

---

## 🛠️ Common Commands

### **Backend:**
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up auth-service

# Rebuild after code changes
docker-compose up --build

# View logs
docker-compose logs -f notification-service

# Stop everything
docker-compose down

# Clean up
docker-compose down --remove-orphans
docker system prune -f
```

### **Frontend:**
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

---

## 🔍 Debugging Tips

### **Service Not Starting?**
1. Check logs: `docker-compose logs service-name`
2. Check port conflicts: `lsof -i :PORT`
3. Rebuild: `docker-compose up --build service-name`

### **Database Issues?**
1. Check MongoDB logs: `docker-compose logs mongo-users`
2. Reset data: `docker-compose down -v`

### **RabbitMQ Issues?**
1. Check UI: http://localhost:15672
2. Check exchanges and queues
3. Look for connection errors in service logs

### **Email Not Sending?**
1. Check RESEND_API_KEY is set
2. Verify event has `customerEmail` field
3. Check notification-service logs

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service orchestration |
| `sync-shared.js` | Sync shared modules |
| `api-client.ts` | Frontend API wrapper |
| `email-service.ts` | Email templates |
| `RESEND_SETUP_GUIDE.md` | Email setup instructions |

---

## 🎓 Architecture Decisions

1. **Why Dual Gateways?**
   - External: Public API, JWT auth, rate limiting
   - Internal: Service-to-service, API key auth
   - Better security & monitoring

2. **Why Separate Auth Service?**
   - Isolated authentication logic
   - Easier to scale
   - Better security

3. **Why RabbitMQ?**
   - Async communication
   - Event-driven architecture
   - Decoupled services

4. **Why Socket.io + Email?**
   - Socket.io: Real-time updates
   - Email: Persistent notifications
   - Users don't miss important updates

---

## 📊 Performance Metrics

- **Services:** 10 (8 microservices + 2 gateways)
- **Databases:** 9 MongoDB instances
- **Containers:** 19 total
- **Network:** Single Docker network
- **Startup Time:** ~30 seconds

---

**Last Updated:** December 2025  
**Version:** 2.0 (Dual Gateway Architecture)
