# 🔒 Security & Service Discovery Architecture

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Network Security & Isolation](#network-security--isolation)
3. [Consul Service Discovery](#consul-service-discovery)
4. [Rate Limiting](#rate-limiting)
5. [Security Best Practices](#security-best-practices)

---

## Authentication & Authorization

### Overview
Our system implements a **multi-layer authentication architecture** where all external requests must pass through the API Gateway, which validates JWT tokens before forwarding requests to internal microservices.

### Architecture Flow

```
External Request → API Gateway (Port 4000) → Internal Service (3001-3007)
                      ↓
                  JWT Validation
                      ↓
              Rate Limiting Check
                      ↓
              Route to Service
```

### 1. API Gateway Authentication Layer

**Location:** `backend/api-gateway/src/middleware/auth.ts`

#### Components:

**A. `authenticateToken` Middleware**
- Extracts Bearer token from `Authorization` header
- Verifies JWT signature using `JWT_SECRET`
- Decodes and attaches user info (`userId`, `role`) to request object
- **Note:** Currently allows requests without tokens to pass through (for public endpoints)
- Invalid tokens are logged but don't block requests (services handle their own auth)

```typescript
// Example flow:
Authorization: Bearer <jwt-token>
  ↓
Extract token
  ↓
Verify with JWT_SECRET
  ↓
Attach { userId, role } to req.user
```

**B. `requireAuth` Middleware**
- Enforces authentication requirement
- Returns `401 Unauthorized` if no user found in request
- Used for protected endpoints (orders, deliveries, etc.)

**C. `requireRole` Middleware**
- Role-based access control (RBAC)
- Validates user has required role (e.g., `'farmer'`, `'customer'`, `'admin'`)
- Returns `403 Forbidden` if insufficient permissions

### 2. Service-Level Authentication

**Location:** `backend/services/user-service/src/middleware/auth.ts`

Services can implement their own authentication middleware for defense in depth:

- **`authenticateToken`**: Validates JWT tokens independently
- **`authorizeRoles`**: Enforces role-based permissions
- Returns `401` or `403` if authentication fails

### 3. Route Protection Examples

**Public Endpoints:**
```typescript
// /api/auth - Only rate-limited, no auth required
router.use('/api/auth', authLimiter, proxy(...))
```

**Optional Auth:**
```typescript
// /api/products - Auth optional, but validated if provided
router.use('/api/products', authenticateToken, proxy(...))
```

**Required Auth:**
```typescript
// /api/orders - Must be authenticated
router.use('/api/orders', authenticateToken, requireAuth, proxy(...))
```

**Role-Based:**
```typescript
// /api/fleet - Admin only
router.use('/api/fleet', authenticateToken, requireAuth, requireRole('admin'), proxy(...))
```

### 4. JWT Token Structure

```json
{
  "userId": "user123",
  "role": "farmer",
  "iat": 1234567890,
  "exp": 1234571490
}
```

- **Signed with:** `JWT_SECRET` environment variable
- **Stored in:** Frontend (localStorage/cookies)
- **Sent as:** `Authorization: Bearer <token>` header

---

## Network Security & Isolation

### Docker Network Isolation

**Network:** `farm2table-network` (bridge network)

#### External Exposure
- **Only API Gateway** exposes port `4000` to the host machine
- All other services (3001-3007) are **NOT exposed externally**
- Services communicate via internal Docker DNS names

#### Internal Communication
Services use Docker service names for communication:
- `http://user-service:3001`
- `http://order-service:3003`
- `http://delivery-service:3004`
- etc.

**Benefits:**
- Services cannot be accessed directly from outside
- Internal network traffic is isolated
- Prevents unauthorized direct access to services
- Single entry point (API Gateway) for all external traffic

### Service Ports

| Service | Internal Port | External Port | Accessible From Outside |
|---------|--------------|---------------|-------------------------|
| API Gateway | 4000 | 4000 | ✅ Yes |
| User Service | 3001 | - | ❌ No |
| Product Service | 3002 | - | ❌ No |
| Order Service | 3003 | - | ❌ No |
| Delivery Service | 3004 | - | ❌ No |
| Health Service | 3005 | - | ❌ No |
| Notification Service | 3006 | - | ❌ No |
| Chatbot Service | 3007 | - | ❌ No |

### CORS Configuration

- API Gateway uses `cors()` middleware (currently permissive)
- Services also have CORS enabled
- **Recommendation:** Configure specific origins in production

---

## Consul Service Discovery

### What is Consul?

**Consul** is HashiCorp's service discovery and configuration tool. It acts as a **service registry** where microservices register themselves and discover other services dynamically.

### How Consul Works

#### 1. Service Registration

When a service starts, it registers itself with Consul:

```typescript
// Location: backend/shared/consul.ts

const registration = {
  name: 'order-service',           // Service name
  id: 'order-service-3003-123456', // Unique instance ID
  address: 'order-service',        // Host address
  port: 3003,                      // Port number
  check: {                          // Health check configuration
    http: 'http://order-service:3003/health',
    interval: '10s',                // Check every 10 seconds
    timeout: '5s',                  // 5 second timeout
    deregistercriticalserviceafter: '1m' // Remove if unhealthy for 1 minute
  }
};

await consul.agent.service.register(registration);
```

**Key Features:**
- **Health Checks:** Consul periodically checks `/health` endpoint
- **Automatic Deregistration:** Unhealthy services are removed after 1 minute
- **Unique IDs:** Each service instance gets a unique ID (includes timestamp)

#### 2. Service Discovery

Other services can discover registered services:

```typescript
// Find healthy instances of a service
const services = await consul.health.service({ 
  service: 'order-service', 
  passing: true  // Only return healthy instances
});

// Returns array of healthy service instances
// Example: [{ Service: { Address: 'order-service', Port: 3003 } }]
```

#### 3. Health Monitoring

Consul continuously monitors service health:
- **HTTP Health Checks:** Calls `/health` endpoint every 10 seconds
- **Status Types:**
  - `passing` - Service is healthy
  - `warning` - Service has issues but still operational
  - `critical` - Service is down

### How We Use Consul

#### Current Implementation

**Location:** `backend/shared/consul.ts`

**Functions:**

1. **`registerService(serviceName, port)`**
   - Registers a service with Consul
   - Sets up health check monitoring
   - Automatically deregisters on shutdown (SIGINT)
   - Gracefully handles Consul unavailability (doesn't crash service)

2. **`discoverService(serviceName)`**
   - Discovers healthy instances of a service
   - Returns first healthy instance (simple round-robin)
   - Returns `null` if no healthy instances found

#### Consul Configuration

**Docker Setup:** `backend/docker-compose.yml`

```yaml
consul:
  image: hashicorp/consul:latest
  container_name: farm2table-consul
  ports:
    - "8500:8500"  # HTTP API
    - "8600:8600"  # DNS
  command: agent -server -ui -bootstrap-expect=1 -client=0.0.0.0
  networks:
    - farm2table-network
```

**Access Points:**
- **HTTP API:** `http://localhost:8500`
- **Web UI:** `http://localhost:8500/ui` (if enabled)
- **DNS:** Port 8600 (for DNS-based service discovery)

#### Service Registration Flow

```
1. Service starts
   ↓
2. Service calls registerService('order-service', 3003)
   ↓
3. Consul stores registration:
   - Service name: order-service
   - Address: order-service:3003
   - Health check URL: http://order-service:3003/health
   ↓
4. Consul starts health checking every 10s
   ↓
5. If health check fails → Mark as unhealthy
   ↓
6. If unhealthy for 1 minute → Deregister automatically
```

#### Service Discovery Flow

```
1. API Gateway needs to find order-service
   ↓
2. Calls discoverService('order-service')
   ↓
3. Consul returns healthy instances:
   [{ Address: 'order-service', Port: 3003 }]
   ↓
4. API Gateway uses returned address/port
   ↓
5. If no healthy instances → Returns null, use fallback
```

### Benefits of Service Discovery

1. **Dynamic Service Location**
   - Services don't need hardcoded URLs
   - Can scale services horizontally (multiple instances)
   - Services can move/restart without breaking connections

2. **Health Monitoring**
   - Automatic detection of unhealthy services
   - Prevents routing to dead services
   - Enables self-healing architectures

3. **Load Balancing**
   - Can discover multiple instances
   - Implement round-robin or other strategies
   - Distribute load across instances

4. **Service Mesh Ready**
   - Foundation for advanced features (mTLS, traffic splitting)
   - Enables canary deployments
   - Supports service-to-service communication patterns

### Current Status

**Infrastructure:** ✅ Consul is running and configured

**Implementation:** ⚠️ Partially implemented
- Consul utilities exist in `backend/shared/consul.ts`
- Services have health check endpoints
- **Not yet:** Services don't automatically register on startup
- **Not yet:** API Gateway doesn't use discovery (uses hardcoded URLs)

**Future Enhancement:**
```typescript
// In service startup (e.g., order-service/src/index.ts)
import { registerService } from '../shared/consul';

const startServer = async () => {
  // Register with Consul
  await registerService('order-service', PORT);
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Order service running on port ${PORT}`);
  });
};
```

---

## Rate Limiting

**Location:** `backend/api-gateway/src/middleware/rateLimiter.ts`

### Rate Limiters

#### 1. `apiLimiter` - General API Protection
```typescript
windowMs: 15 minutes
max: 200 requests (production) / 500 (development)
keyGenerator: Uses user ID for authenticated users, IP for anonymous
```

**Purpose:** Prevents API abuse and DDoS attacks

#### 2. `authLimiter` - Authentication Endpoints
```typescript
windowMs: 15 minutes
max: 50 requests (production) / 200 (development)
```

**Purpose:** Prevents brute force attacks on login/registration

#### 3. `chatLimiter` - Chatbot Protection
```typescript
windowMs: 1 minute
max: 20 messages
```

**Purpose:** Prevents chatbot spam and abuse

### Rate Limiting Strategy

- **Authenticated Users:** Rate limits based on `userId` (more lenient)
- **Anonymous Users:** Rate limits based on IP address (stricter)
- **Health Checks:** Excluded from rate limiting

### Response
When rate limit exceeded:
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```
HTTP Status: `429 Too Many Requests`

---

## Security Best Practices

### ✅ Implemented

1. **Single Entry Point** - All traffic through API Gateway
2. **JWT Authentication** - Token-based auth with expiration
3. **Network Isolation** - Services not directly accessible
4. **Rate Limiting** - Protection against abuse
5. **Health Checks** - Service health monitoring
6. **Graceful Degradation** - Services continue if Consul unavailable

### ⚠️ Recommendations for Production

1. **Remove Token Fallback**
   - Currently `authenticateToken` allows requests without tokens
   - Should enforce authentication for protected routes

2. **CORS Configuration**
   - Replace `cors()` with specific origin whitelist
   - Example: `cors({ origin: ['https://yourdomain.com'] })`

3. **Environment Variables (CRITICAL Fix)**
   - **`JWT_SECRET`**: MUST be consistent across **ALL** services (Gateways + Microservices).
   - If missing in a microservice, it defaults to `'secret'`, causing `403 Invalid Signature` errors when the Gateway (using the correct secret) tries to talk to it.
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault) in production.

4. **HTTPS/TLS**
   - Enable HTTPS in production
   - Use Let's Encrypt or similar for certificates

5. **Service-to-Service Auth**
   - Implement mTLS for internal communication
   - Use service mesh (Istio, Linkerd) for advanced security

6. **Input Validation**
   - Validate all inputs at API Gateway
   - Sanitize user inputs
   - Use libraries like `express-validator`

7. **Logging & Monitoring**
   - Log all authentication attempts
   - Monitor for suspicious patterns
   - Set up alerts for failed auth attempts

8. **Token Refresh**
   - Implement refresh token mechanism
   - Shorter access token expiration (15 min)
   - Longer refresh token expiration (7 days)

9. **Complete Consul Integration**
   - Enable automatic service registration
   - Use Consul for dynamic service discovery in API Gateway
   - Implement health check aggregation

10. **Database Security**
    - Use connection pooling
    - Implement database user permissions
    - Enable MongoDB authentication
    - Use encrypted connections

---

## Security Flow Example

### Complete Request Flow

```
1. Frontend Request
   POST /api/orders
   Headers: { Authorization: "Bearer <jwt-token>" }
   ↓

2. API Gateway Receives
   ├─ authenticateToken: Validates JWT → extracts { userId, role }
   ├─ requireAuth: Checks user exists → ✅
   ├─ apiLimiter: Checks rate limit → ✅
   └─ Proxy forwards to: http://order-service:3003/api/orders
   ↓

3. Order Service Receives
   ├─ Can validate token again (defense in depth)
   ├─ Processes order with userId from token
   └─ Returns response
   ↓

4. Response Flows Back
   API Gateway → Frontend
```

### Service Discovery Flow (Future)

```
1. API Gateway needs order-service
   ↓
2. Calls discoverService('order-service')
   ↓
3. Consul returns: { host: 'order-service', port: 3003 }
   ↓
4. API Gateway routes to discovered address
   ↓
5. If service unhealthy → Consul removes from registry
   ↓
6. Next discovery call → Returns different healthy instance
```

---

## Summary

**Security Architecture:**
- ✅ Multi-layer authentication (Gateway + Services)
- ✅ Network isolation (Docker bridge network)
- ✅ Rate limiting (per-user and per-IP)
- ✅ JWT token validation
- ✅ Health monitoring (Consul)

**Service Discovery:**
- ✅ Consul infrastructure running
- ✅ Registration/discovery utilities available
- ⚠️ Partial implementation (not fully integrated yet)

**Key Principle:** 
**Defense in Depth** - Multiple layers of security ensure that if one layer fails, others provide protection.

---

## Communication Patterns

### Frontend ↔ Backend Communication

#### Architecture Flow

```
Frontend (Next.js) → API Gateway (Port 4000) → Microservice → Response
```

#### Frontend API Client

**Location:** `frontend/src/lib/api-client.ts`

The frontend uses a centralized `ApiClient` class that handles all backend communication:

**Key Features:**

1. **Base URL Configuration**
   ```typescript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
   ```
   - All requests go through API Gateway (single entry point)
   - Configurable via environment variable

2. **Authentication Token Management**
   ```typescript
   // Stores token in localStorage and cookies
   setToken(token: string) {
     localStorage.setItem('auth-token', token);
     document.cookie = `auth-token=${token}; path=/; max-age=604800`;
   }
   
   // Automatically includes token in requests
   private getHeaders(): HeadersInit {
     if (this.token) {
       headers['Authorization'] = `Bearer ${this.token}`;
     }
   }
   ```

3. **Request Method**
   ```typescript
   async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
     // Builds URL: http://localhost:4000/api/products
     const url = `${this.baseUrl}${endpoint}`;
     
     // Adds Authorization header if token exists
     // Sets Content-Type: application/json
     // Includes 30-second timeout
     
     const response = await fetch(url, config);
     return response.json();
   }
   ```

4. **API Methods**
   The client provides typed methods for each service:
   - `apiClient.getProducts()` → `GET /api/products`
   - `apiClient.createOrder()` → `POST /api/orders`
   - `apiClient.getDeliveries()` → `GET /api/deliveries`
   - etc.

#### Example: Frontend Request Flow

```typescript
// Frontend component
const handleGetProducts = async () => {
  try {
    // Calls: GET http://localhost:4000/api/products
    // Headers: { Authorization: "Bearer <token>" }
    const response = await apiClient.getProducts({ category: 'vegetables' });
    setProducts(response.data);
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
};
```

**Complete Flow:**
```
1. Frontend: apiClient.getProducts()
   ↓
2. ApiClient: fetch('http://localhost:4000/api/products', {
     headers: { Authorization: 'Bearer <token>' }
   })
   ↓
3. API Gateway: Receives request
   ├─ authenticateToken: Validates JWT
   ├─ Routes to: http://product-service:3002/api/products
   └─ Proxy forwards request
   ↓
4. Product Service: Processes request
   ├─ Queries MongoDB
   └─ Returns products
   ↓
5. Response flows back: Product Service → API Gateway → Frontend
```

#### Real-Time Communication (Socket.io)

**Location:** `frontend/src/lib/socket-client.ts`

For real-time notifications, the frontend uses Socket.io:

```typescript
// Connect to Notification Service
socketClient.connect(userId, role);

// Listen for notifications
socketClient.onNotification((notification) => {
  // Show notification popup
  showNotification(notification);
});
```

**Flow:**
```
Frontend → Socket.io Client → Notification Service (Port 3006)
                              ↓
                         WebSocket Connection
                              ↓
                    Real-time event delivery
```

**Note:** Chatbot service uses direct HTTP (bypasses API Gateway):
```typescript
// Direct connection to chatbot service
fetch(`${CHATBOT_SERVICE_URL}/api/chat`, { ... })
```

---

### Service-to-Service Communication

Services communicate in **TWO ways**: Synchronous (HTTP) and Asynchronous (RabbitMQ).

#### 1. Synchronous Communication (HTTP/REST)

**When:** Immediate response needed

**How:** Services make HTTP requests to other services using `axios`

**Example: Order Service → User Service**

**Location:** `backend/services/order-service/src/routes/orders.ts`

```typescript
// Fetch user details from User Service
const fetchUserDetails = async (userId: string) => {
  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
  
  const response = await axios.get(
    `${userServiceUrl}/api/auth/users/${userId}`,
    { timeout: 3000 }
  );
  
  return response.data.user;
};
```

**Example: Chatbot Service → Multiple Services**

**Location:** `backend/services/chatbot-service/src/services.ts`

```typescript
// Chatbot needs to fetch data from multiple services

// 1. Get order from Order Service
const order = await axios.get(`${ORDER_SERVICE_URL}/api/orders/number/${orderNumber}`);

// 2. Get delivery info from Delivery Service
const delivery = await axios.get(`${DELIVERY_SERVICE_URL}/api/deliveries/order/${orderNumber}`);

// 3. Search products from Product Service
const products = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, { 
  params: { search: query } 
});
```

**Service URLs:**
- Services use Docker service names: `http://order-service:3003`
- Environment variables allow override: `process.env.ORDER_SERVICE_URL`
- Internal network only (not accessible from outside)

**Features:**
- **Retry Logic:** Chatbot service implements retry with exponential backoff
- **Timeout:** 5 seconds default timeout
- **Error Handling:** Graceful degradation if service unavailable

#### 2. Asynchronous Communication (RabbitMQ)

**When:** Background processing, no immediate response needed

**How:** Services publish messages to RabbitMQ, other services consume them

**Location:** `backend/shared/rabbitmq.ts`

##### Publishing Messages (Sending)

```typescript
// Order Service publishes when order is created
await rabbitMQ.publish(
  'events',              // Exchange name
  'order.created',      // Routing key
  {                     // Message payload
    orderId: '123',
    customerId: '456',
    totalAmount: 250
  }
);
```

##### Subscribing to Messages (Receiving)

```typescript
// Notification Service listens for order events
await rabbitMQ.subscribe(
  'notification-queue',  // Queue name
  'events',             // Exchange name
  'order.*',            // Pattern (matches all order events)
  async (message) => {  // Callback function
    // Process the message
    await sendNotification(message.customerId);
  }
);
```

**RabbitMQ Configuration:**
- **Exchange Type:** `topic` (allows pattern matching)
- **Exchange Name:** `events`
- **Durable:** Messages survive RabbitMQ restart
- **Persistent:** Messages saved to disk

**Common Routing Keys:**
- `order.created` - Order was created
- `order.confirmed` - Order was confirmed
- `order.cancelled` - Order was cancelled
- `delivery.created` - Delivery was created
- `delivery.status_updated` - Delivery status changed
- `product.out_of_stock` - Product ran out of stock

**Pattern Matching:**
- `order.*` - Matches all order events
- `*.created` - Matches all "created" events
- `delivery.status_*` - Matches all delivery status events

#### Example: Complete Service Interaction Flow

**Scenario:** Restaurant creates an order

```
1. Frontend → API Gateway
   POST /api/orders
   ↓

2. API Gateway → Order Service
   Routes to: http://order-service:3003/api/orders
   ↓

3. Order Service:
   ├─ Validates order data
   ├─ Saves to MongoDB
   ├─ Fetches user details from User Service (HTTP)
   │  GET http://user-service:3001/api/auth/users/{userId}
   ├─ Publishes message to RabbitMQ
   │  rabbitMQ.publish('events', 'order.created', { orderId, ... })
   └─ Returns success to API Gateway
   ↓

4. API Gateway → Frontend
   Returns order confirmation
   ↓

5. [Background] RabbitMQ → Notification Service
   Notification Service consumes 'order.created' message
   ├─ Sends Socket.io notification to farmer
   └─ Sends email notification (future)
   ↓

6. [Background] RabbitMQ → Delivery Service
   Delivery Service consumes 'order.created' message
   ├─ Creates delivery record
   └─ Publishes 'delivery.created' event
```

#### Service Discovery (Future)

Currently, services use hardcoded URLs:
```typescript
const ORDER_SERVICE_URL = 'http://order-service:3003';
```

**Future Enhancement:** Use Consul for dynamic discovery:
```typescript
// Discover healthy order-service instance
const service = await discoverService('order-service');
const ORDER_SERVICE_URL = `http://${service.host}:${service.port}`;
```

---

### Communication Summary

| Communication Type | Protocol | When Used | Example |
|-------------------|----------|-----------|---------|
| **Frontend → Backend** | HTTP/REST | All user requests | `apiClient.getProducts()` |
| **Service → Service (Sync)** | HTTP/REST | Immediate response needed | Order Service → User Service |
| **Service → Service (Async)** | RabbitMQ | Background processing | Order Service → Notification Service |
| **Frontend → Notifications** | WebSocket (Socket.io) | Real-time updates | Notification popups |
| **Frontend → Chatbot** | HTTP/REST | Direct connection | Chat widget |

### Key Principles

1. **Single Entry Point:** All frontend requests go through API Gateway
2. **Internal Network:** Services communicate via Docker DNS names
3. **Decoupling:** Services don't directly depend on each other (use RabbitMQ)
4. **Resilience:** Services handle failures gracefully (retry, fallback)
5. **Scalability:** Can scale services independently

---

## Summary

**Security Architecture:**
- ✅ Multi-layer authentication (Gateway + Services)
- ✅ Network isolation (Docker bridge network)
- ✅ Rate limiting (per-user and per-IP)
- ✅ JWT token validation
- ✅ Health monitoring (Consul)

**Service Discovery:**
- ✅ Consul infrastructure running
- ✅ Registration/discovery utilities available
- ⚠️ Partial implementation (not fully integrated yet)

**Communication:**
- ✅ Frontend → API Gateway → Services (HTTP/REST)
- ✅ Service → Service (HTTP/REST for sync, RabbitMQ for async)
- ✅ Real-time notifications (Socket.io)
- ✅ Direct chatbot connection (HTTP)

**Key Principle:** 
**Defense in Depth** - Multiple layers of security ensure that if one layer fails, others provide protection.

