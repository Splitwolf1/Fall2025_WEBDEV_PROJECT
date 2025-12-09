# 🚀 Backend Architecture Migration - Progress Tracker

**Started:** December 9, 2025  
**Status:** Planning Phase  
**Strategy:** Incremental migration - One service at a time, delete old after verification

---

## 📋 Migration Overview

### **Current Architecture:**
- Single API Gateway (Port 4000)
- 7 Microservices (Ports 3001-3007)
- Shared modules via copy-sync
- Single-level service access

### **Target Architecture:**
- **External API Gateway** (Port 4000) - For client apps
- **Internal API Gateway** (Port 4001) - For inter-service communication
- Role-based service architecture (Farmer, Restaurant, Distributor, Inspector)
- Service Discovery (Consul)
- Message Broker (RabbitMQ)
- Proper Docker volume paths for TypeScript compatibility

---

## 🎯 Phase 1: Infrastructure Setup

### **1.1 Create Dual Gateway Structure**
- [x] Create `backend/gateways/` directory
- [x] Create `backend/gateways/external-api-gateway/`
- [x] Create `backend/gateways/internal-api-gateway/`
- [x] Set up External Gateway (Port 4000) for client requests
- [x] Set up Internal Gateway (Port 4001) for service-to-service
- [x] Configure routing logic for both gateways

**Testing Checkpoint:** Both gateways start successfully with `docker-compose up`

---

### **1.2 Update Docker Configuration**
- [x] Update `docker-compose.yml` with new gateway services
- [x] Fix RabbitMQ volume paths to match actual file structure
- [x] Fix Consul volume paths to match actual file structure
- [x] Ensure TypeScript can resolve shared modules
- [x] Configure network bridges between gateways and services

**RabbitMQ Path Mapping:**
```yaml
# Already using named volumes (correct approach):
volumes:
  - rabbitmq_data:/var/lib/rabbitmq
```

**Consul Path Mapping:**
```yaml
# Already using named volumes (correct approach):
volumes:
  - consul_data:/consul/data
```

**Testing Checkpoint:** Run `docker-compose config` to validate syntax

---

### **1.3 Shared Modules Path Fix**
- [x] Verify `backend/shared/` module locations
- [x] Update TypeScript path mappings in each service's `tsconfig.json`
- [x] Update sync script to copy to correct locations
- [ ] Test shared module imports compile without errors (requires npm install)

**Path Structure:**
```
backend/
├── shared/
│   ├── rabbitmq.ts
│   ├── consul.ts
│   └── database.ts
├── gateways/
│   ├── external-api-gateway/
│   │   └── shared/  ← Synced from backend/shared/
│   └── internal-api-gateway/
│       └── shared/  ← Synced from backend/shared/
```

**Testing Checkpoint:** Run `npm run build` in one service to verify imports (after npm install)

---

## 🔧 Phase 2: Service Migration (Incremental)

> **IMPORTANT:** Complete ONE service fully before moving to next. Delete old after verification.

### **2.1 Service #1: User Service → Auth + User Split**
- [ ] Create `services/auth-service/` (authentication only)
- [ ] Create `services/user-service/` (profile management only)
- [ ] Move login/register logic to `auth-service`
- [ ] Move profile CRUD to `user-service`
- [ ] Update imports to use dual gateways
- [ ] Update RabbitMQ connection paths
- [ ] Update Consul registration
- [ ] Add to docker-compose.yml
- [ ] **Test:** User login, registration, profile update
- [ ] **Delete:** Old `services/user-service/` folder

**Testing Commands:**
```bash
docker-compose up auth-service user-service
curl http://localhost:4000/api/auth/login
curl http://localhost:4000/api/users/profile
```

**Status:** ⏳ Not Started | ✅ Complete

---

### **2.2 Service #2: Product Service**
- [ ] Copy to new structure with updated imports
- [ ] Update TypeScript paths for shared modules
- [ ] Update RabbitMQ integration
- [ ] Update Consul registration
- [ ] Register with Internal API Gateway
- [ ] Add to docker-compose.yml
- [ ] **Test:** Product CRUD, stock updates
- [ ] **Delete:** Old `services/product-service/` folder

**Testing Commands:**
```bash
docker-compose up product-service
curl http://localhost:4000/api/products
curl http://localhost:4001/api/internal/products  # Internal gateway
```

**Status:** ⏳ Not Started | ✅ Complete

---

### **2.3 Service #3: Order Service**
- [ ] Copy to new structure with updated imports
- [ ] Update TypeScript paths for shared modules
- [ ] Update RabbitMQ event publishing
- [ ] Update Consul registration
- [ ] Register with both gateways (internal + external)
- [ ] Add to docker-compose.yml
- [ ] **Test:** Order creation, status updates, ratings
- [ ] **Delete:** Old `services/order-service/` folder

**Testing Commands:**
```bash
docker-compose up order-service
curl http://localhost:4000/api/orders
```

**Status:** ⏳ Not Started | ✅ Complete

---

### **2.4 Service #4: Delivery Service**
- [ ] Copy to new structure with updated imports
- [ ] Update TypeScript paths for shared modules
- [ ] Update RabbitMQ subscriptions
- [ ] Update Consul registration
- [ ] Update fleet management routes
- [ ] Add to docker-compose.yml
- [ ] **Test:** Delivery tracking, fleet management
- [ ] **Delete:** Old `services/delivery-service/` folder

**Testing Commands:**
```bash
docker-compose up delivery-service
curl http://localhost:4000/api/deliveries
curl http://localhost:4000/api/fleet
```

**Status:** ⏳ Not Started | ✅ Complete

---

### **2.5 Service #5: Health Service**
- [ ] Copy to new structure with updated imports
- [ ] Update TypeScript paths for shared modules
- [ ] Update Consul registration
- [ ] Add to docker-compose.yml
- [ ] **Test:** Inspection management
- [ ] **Delete:** Old `services/health-service/` folder

**Testing Commands:**
```bash
docker-compose up health-service
curl http://localhost:4000/api/inspections
```

**Status:** ⏳ Not Started | ✅ Complete

---

### **2.6 Service #6: Notification Service**
- [ ] Copy to new structure with updated imports
- [ ] Update TypeScript paths for shared modules
- [ ] Update RabbitMQ subscriptions (listens to all events)
- [ ] Update Socket.io server setup
- [ ] Update Consul registration
- [ ] Add to docker-compose.yml
- [ ] **Test:** Real-time notifications via WebSocket
- [ ] **Delete:** Old `services/notification-service/` folder

**Testing Commands:**
```bash
docker-compose up notification-service
# Test WebSocket connection on port 3006
```

**Status:** ⏳ Not Started | ✅ Complete

---

### **2.7 Service #7: Chatbot Service**
- [ ] Copy to new structure with updated imports
- [ ] Update TypeScript paths for shared modules
- [ ] Update internal service URLs to use Internal Gateway
- [ ] Update Consul registration
- [ ] Add to docker-compose.yml
- [ ] **Test:** Chatbot queries, intent detection
- [ ] **Delete:** Old `services/chatbot-service/` folder

**Testing Commands:**
```bash
docker-compose up chatbot-service
curl http://localhost:4000/api/chat
```

**Status:** ⏳ Not Started | ✅ Complete

---

## 🔗 Phase 3: Integration & Communication

### **3.1 RabbitMQ Event Flow**
- [ ] Verify all publishers use correct exchange patterns
- [ ] Verify all subscribers are registered
- [ ] Test event flow: `order.created` → Notification + Delivery
- [ ] Test event flow: `delivery.status_updated` → notifications
- [ ] Monitor RabbitMQ Management UI (http://localhost:15672)

**Events to Test:**
- `order.created`
- `order.confirmed`
- `order.cancelled`
- `delivery.created`
- `delivery.status_updated`
- `product.out_of_stock`

**Status:** ⏳ Not Started | ✅ Complete

---

### **3.2 Consul Service Discovery**
- [ ] Verify all services register on startup
- [ ] Test External Gateway discovers services
- [ ] Test Internal Gateway discovers services
- [ ] Monitor Consul UI (http://localhost:8500)
- [ ] Test automatic service health checks

**Status:** ⏳ Not Started | ✅ Complete

---

### **3.3 Gateway Routing**
- [ ] Test External Gateway routes all client requests
- [ ] Test Internal Gateway handles service-to-service calls
- [ ] Verify JWT authentication on External Gateway
- [ ] Verify rate limiting works
- [ ] Test error handling and timeouts

**Status:** ⏳ Not Started | ✅ Complete

---

## ✅ Phase 4: Final Testing & Verification

### **4.1 End-to-End Testing**
- [ ] **Farmer Flow:** Login → Create product → View orders
- [ ] **Restaurant Flow:** Login → Browse products → Place order → Track delivery
- [ ] **Distributor Flow:** Login → View deliveries → Update status
- [ ] **Inspector Flow:** Login → Schedule inspection → Submit report

**Status:** ⏳ Not Started | ✅ Complete

---

### **4.2 Performance Testing**
- [ ] Load test External Gateway (100 concurrent requests)
- [ ] Test RabbitMQ under load
- [ ] Monitor database connection pools
- [ ] Check for memory leaks

**Status:** ⏳ Not Started | ✅ Complete

---

### **4.3 Documentation Updates**
- [ ] Update `BACKEND_ARCHITECTURE_QA.md`
- [ ] Update `PROJECT_STRUCTURE.md`
- [ ] Update `QUICK_REFERENCE_CARD.md`
- [ ] Update `README.backend.md`
- [ ] Create new architecture diagrams
- [ ] Update API documentation

**Status:** ⏳ Not Started | ✅ Complete

---

## 🎉 Phase 5: Cleanup & Deployment

### **5.1 Cleanup**
- [ ] Remove all old service folders (already done incrementally)
- [ ] Remove old API Gateway
- [ ] Update .gitignore
- [ ] Clean up unused dependencies

**Status:** ⏳ Not Started | ✅ Complete

---

### **5.2 Production Readiness**
- [ ] Update production docker-compose.yml
- [ ] Set up environment variables for production
- [ ] Configure HTTPS for External Gateway
- [ ] Set up database backups
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Set up logging (ELK stack)

**Status:** ⏳ Not Started | ✅ Complete

---

## 📊 Overall Progress

**Total Tasks:** 0/100+  
**Current Phase:** Planning  
**Estimated Timeline:** 3-4 weeks  

### **Phase Completion:**
- [ ] Phase 1: Infrastructure Setup (0%)
- [ ] Phase 2: Service Migration (0%)
- [ ] Phase 3: Integration (0%)
- [ ] Phase 4: Testing (0%)
- [ ] Phase 5: Cleanup (0%)

---

## 🐛 Known Issues & Blockers

### **Active Issues:**
_None yet - starting fresh_

### **Resolved Issues:**
_Will be updated as we progress_

---

## 📝 Notes & Decisions

### **Architecture Decisions:**
1. **Dual Gateway Pattern:** Separate external (client) and internal (service-to-service) gateways for better security and performance
2. **Delete Old After Each Service:** Lower risk, easier to rollback if needed
3. **TypeScript Path Alignment:** Docker volumes must match actual file locations to avoid import errors

### **Technical Notes:**
- RabbitMQ credentials: `farm2table` / `secret`
- External Gateway: Port 4000
- Internal Gateway: Port 4001
- All services use dedicated MongoDB databases (database-per-service pattern)

---

**Last Updated:** December 9, 2025  
**Next Milestone:** Complete Infrastructure Setup & Test Gateway Startup
