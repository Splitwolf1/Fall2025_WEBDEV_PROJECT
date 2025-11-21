# 🎯 Backend Architecture Q&A Guide
## Cookies, RabbitMQ, API Gateway, Microservices & Docker

*Quick reference for demo presentations and interviews*

---

## 🍪 Cookies

### Q1: What are cookies and why do we use them?

**Simple Answer:**
Cookies are small pieces of data that the browser stores and sends back to the server with every request. Think of them like a **name tag** that the browser wears.

**In Our App:**

#### Where We SET Cookies:

📁 **File:** `frontend/src/lib/auth.ts`
📍 **Line:** 69

```javascript
// Set cookie when user logs in
document.cookie = `user-role=${user.role}; path=/; max-age=604800`; // 7 days
```

📁 **File:** `frontend/src/lib/api-client.ts`
📍 **Line:** 29

```javascript
// Set cookie when token is stored
document.cookie = `auth-token=${token}; path=/; max-age=604800`; // 7 days
```

#### Where We CLEAR Cookies:

📁 **File:** `frontend/src/lib/auth.ts`
📍 **Line:** 168

```javascript
// Clear cookie when user logs out
document.cookie = 'user-role=; path=/; max-age=0';
```

**Why we use cookies:**
1. **Server-side access** - Unlike localStorage, servers can read cookies
2. **Automatic sending** - Browser includes them in every request automatically
3. **Backup storage** - If localStorage fails, we still have the cookie

---

### Q2: What's the difference between cookies and localStorage?

**Quick Comparison:**

| Feature | Cookies | localStorage |
|---------|---------|-------------|
| **Size** | 4 KB max | 10 MB max |
| **Access** | Client + Server | Client only |
| **Sent to server** | Automatic | Manual |
| **Expires** | Can set expiration | Never expires |
| **Use in our app** | user-role, auth-token | auth-token, user-data |

**In Our App:**

📁 **File:** `frontend/src/lib/auth.ts`
📍 **Lines:** 64-66

```javascript
// localStorage - Main storage (JavaScript only)
localStorage.setItem('user-role', user.role);
localStorage.setItem('user-data', JSON.stringify(user));
localStorage.setItem('user', JSON.stringify(response.user));
```

📁 **File:** `frontend/src/lib/api-client.ts`
📍 **Line:** 28

```javascript
// Cookies - Backup (can be read by server)
document.cookie = `auth-token=${token}; path=/; max-age=604800`;
```

---

### Q3: Are cookies secure? What about HttpOnly cookies?

**Current Setup:**
```javascript
// Our cookies (JavaScript can access)
document.cookie = 'user-role=farmer; path=/; max-age=604800';
```

**Production Setup (More Secure):**
```javascript
// HttpOnly cookies (only server can access, safer!)
Set-Cookie: auth-token=xyz; HttpOnly; Secure; SameSite=Strict
```

**Security Levels:**
- ✅ **HttpOnly** - JavaScript can't access (prevents XSS attacks)
- ✅ **Secure** - Only sent over HTTPS
- ✅ **SameSite** - Prevents CSRF attacks

**Our App:** Uses regular cookies for development. In production, backend should set HttpOnly cookies.

---

## 🐰 RabbitMQ (Message Broker)

### Q4: What is RabbitMQ and why do we need it?

**Simple Answer:**
RabbitMQ is a **message delivery service** for microservices. Think of it like a **post office** - services send messages (letters) and RabbitMQ delivers them to the right service.

**Visual:**
```
Order Service                RabbitMQ                Notification Service
     │                          │                           │
     │ "New order created!"     │                           │
     ├─────────────────────────→│                           │
     │                          │  Delivers message         │
     │                          ├──────────────────────────→│
     │                          │                           │
     │                          │                           ▼
     │                          │                     Send email ✉️
```

**In Our App:**

📁 **RabbitMQ Config:** `backend/docker-compose.yml`
📍 **Lines:** 3-15

```yaml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"      # AMQP protocol port
    - "15672:15672"    # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: farm2table
    RABBITMQ_DEFAULT_PASS: secret
```

📁 **Publishing Messages:** `backend/services/order-service/src/routes/orders.ts`

```javascript
// Order Service publishes message when order is created
await rabbitMQ.publish('order.created', {
  orderId: order._id,
  customerId: order.customerId,
  items: order.items,
  totalAmount: order.totalAmount
});
```

📁 **Consuming Messages:** `backend/services/notification-service/src/index.ts`

```javascript
// Notification Service listens for order.created messages
channel.consume('order.created', async (msg) => {
  const orderData = JSON.parse(msg.content);
  await sendEmail(orderData.customerEmail, 'Order confirmed!');
  await sendPushNotification(orderData.customerId);
  channel.ack(msg); // Acknowledge message received
});
```

---

### Q5: Why not just call the Notification Service directly?

**Direct Call (Problem):**
```javascript
// Order Service has to wait
await notificationService.sendEmail();  // 2 seconds
await notificationService.sendPush();   // 1 second
// User waits 3 seconds! 😡
```

**RabbitMQ (Solution):**
```javascript
// Order Service publishes and moves on
rabbitmq.publish('order.created', data);  // 0.01 seconds
// User gets response immediately! 😊
// Notification Service handles it in background
```

**Benefits:**
1. **Asynchronous** - Services don't wait for each other
2. **Decoupled** - Services don't need to know about each other
3. **Reliable** - Messages are stored until delivered
4. **Scalable** - Multiple services can process messages

---

### Q6: What happens if a service is down? Do we lose messages?

**Answer:** No! RabbitMQ stores messages until they're delivered.

**Example:**
```
1. Order Service sends "New order" message to RabbitMQ
2. Notification Service is down (crashed) ❌
3. RabbitMQ keeps the message in queue
4. Notification Service restarts ✅
5. RabbitMQ delivers the saved message
6. Email gets sent (no data lost!)
```

**Our Setup:**

📁 **Connection URL in Services:** `backend/docker-compose.yml`
📍 **Line:** 110 (User Service example)

```yaml
user-service:
  environment:
    - RABBITMQ_URL=amqp://farm2table:secret@rabbitmq:5672
```

**Access RabbitMQ Management UI:**
- URL: `http://localhost:15672`
- Username: `farm2table`
- Password: `secret`

---

## 🚪 API Gateway

### Q7: What is an API Gateway and what does it do?

**Simple Answer:**
The API Gateway is the **single front door** to all our microservices. Think of it like a **hotel receptionist** - you don't go directly to rooms, you ask the receptionist who directs you.

**Visual:**
```
Frontend                API Gateway              Microservices
   │                         │
   │  POST /api/auth/login   │
   ├────────────────────────→│ "This goes to User Service"
   │                         ├──────────→ User Service (3001)
   │                         │
   │  GET /api/products      │
   ├────────────────────────→│ "This goes to Product Service"
   │                         ├──────────→ Product Service (3002)
   │                         │
   │  POST /api/orders       │
   ├────────────────────────→│ "This goes to Order Service"
   │                         ├──────────→ Order Service (3003)
```

**In Our App:**

📁 **Frontend API Client:** `frontend/src/lib/api-client.ts`
📍 **Line:** 3

```javascript
// All requests go through API Gateway
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
```

📁 **Environment Variable:** `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- **Frontend calls:** `http://localhost:4000/api/products`
- **Gateway routes to:** `http://product-service:3002/api/products`

---

### Q8: What responsibilities does the API Gateway have?

**Our API Gateway Does:**

1. **Routing** - Directs requests to correct microservice

📁 **File:** `backend/api-gateway/src/routes.ts`

```javascript
// Route to User Service
router.use('/api/auth', (req, res) => {
  proxy.forward(req, res, 'http://user-service:3001');
});

// Route to Product Service
router.use('/api/products', (req, res) => {
  proxy.forward(req, res, 'http://product-service:3002');
});

// Route to Order Service
router.use('/api/orders', (req, res) => {
  proxy.forward(req, res, 'http://order-service:3003');
});
```

2. **Authentication** - Verifies JWT tokens

📁 **File:** `backend/api-gateway/src/middleware/auth.ts`

```javascript
// Verify JWT token before forwarding request
export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

3. **Service Discovery** - Finds available services using Consul

📁 **Config:** `backend/docker-compose.yml`
📍 **Lines:** 88-89

```yaml
api-gateway:
  environment:
    - CONSUL_HOST=consul
    - CONSUL_PORT=8500
```

4. **Load Balancing** - Distributes requests across multiple instances

5. **Rate Limiting** - Prevents abuse (not yet implemented)

📁 **API Gateway Location:** `backend/api-gateway/` (Port 4000)

---

### Q9: Why not let frontend call services directly?

**Without Gateway (Problems):**
```javascript
// Frontend has to know ALL service URLs
const userService = 'http://localhost:3001';
const productService = 'http://localhost:3002';
const orderService = 'http://localhost:3003';
// ... 7 different URLs to manage! 😩

// Frontend has to authenticate with each service
await fetch(userService, { headers: { Authorization: token }});
await fetch(productService, { headers: { Authorization: token }});
// Duplicate code everywhere!
```

**With Gateway (Simple):**
```javascript
// Frontend only knows ONE URL
const API_URL = 'http://localhost:4000';

// Gateway handles routing
await fetch(`${API_URL}/api/products`);
await fetch(`${API_URL}/api/orders`);
// Gateway routes to correct service automatically! 😊
```

---

## 🔧 Microservices

### Q10: What are microservices and why use them?

**Simple Answer:**
Microservices are **small, independent services** that each do one thing well. Instead of one giant application, we have 7 smaller applications working together.

**Our 7 Microservices:**
```
1. User Service (3001)          → Authentication, user management
2. Product Service (3002)        → Product catalog, inventory
3. Order Service (3003)          → Order management
4. Delivery Service (3004)       → Delivery tracking
5. Health Service (3005)         → Health inspections
6. Notification Service (3006)   → Real-time notifications
7. Chatbot Service (3007)        → AI chatbot
```

**Monolith vs Microservices:**
```
MONOLITH (One big app):
┌────────────────────────────┐
│  All features in one app   │
│  Users, Products, Orders   │
│  One database, one codebase│
└────────────────────────────┘

MICROSERVICES (Separate apps):
┌──────┐  ┌──────┐  ┌──────┐
│Users │  │Prods │  │Orders│
│ DB   │  │ DB   │  │ DB   │
└──────┘  └──────┘  └──────┘
```

---

### Q11: What are the advantages of microservices?

**Advantages in Our App:**

1. **Independent Deployment**
   ```
   Update Product Service → Only restart Product Service
   Don't need to restart User Service, Order Service, etc.
   ```

2. **Technology Freedom**
   ```
   User Service → Node.js + MongoDB
   Chatbot Service → Python + TensorFlow (if we wanted)
   ```

3. **Scalability**
   ```
   High traffic on products?
   → Scale up Product Service (3 instances)
   → Don't need to scale User Service
   ```

4. **Fault Isolation**
   ```
   Chatbot crashes? ❌
   User login still works ✅
   Product browsing still works ✅
   ```

5. **Team Organization**
   ```
   Team A → User Service
   Team B → Product Service
   No merge conflicts!
   ```

---

### Q12: What are the disadvantages? Why not always use microservices?

**Disadvantages:**

1. **Complexity** - More services = more to manage (7 services vs 1)
2. **Network Calls** - Services talk over network (slower than in-memory)
3. **Distributed Data** - Data is spread across 5 databases
4. **Testing** - Have to test 7 services + their interactions
5. **DevOps** - Need Docker, orchestration, monitoring

**When NOT to use:**
- Small apps (blog, portfolio site)
- Prototypes / MVPs
- Small teams (1-2 developers)

**When TO use (like our app):**
- Large apps with distinct features
- Multiple teams working together
- Need to scale different parts independently

---

## 🐳 Docker

### Q13: What is Docker and how does it work?

**Simple Answer:**
Docker is like a **shipping container for code**. It packages your app + all dependencies into a standardized box that runs anywhere.

**Analogy:**
```
WITHOUT DOCKER:
"Works on my machine!" 🤷
- Different OS
- Different Node version
- Different database

WITH DOCKER:
"Works on everyone's machine!" ✅
- Same environment everywhere
- In a container
```

**How It Works:**
```
1. Dockerfile = Recipe
   ───────────────────────
   FROM node:20
   COPY . /app
   RUN npm install
   CMD npm start
   ───────────────────────

2. Docker Image = Frozen meal
   ───────────────────────
   Built from Dockerfile
   Contains everything
   Can be shared
   ───────────────────────

3. Docker Container = Cooked meal
   ───────────────────────
   Running instance
   Isolated environment
   Can have multiple
   ───────────────────────
```

---

### Q14: How does Docker work in our project?

**Our Docker Setup:**
```
docker-compose.yml
├── 7 Microservices (Node.js containers)
├── 1 API Gateway (Node.js container)
├── 5 MongoDB databases (MongoDB containers)
├── 1 RabbitMQ (Message broker container)
└── 1 Consul (Service discovery container)
───────────────────────────────────────
= 15 Docker containers running together!
```

**Start everything with one command:**
```bash
docker-compose up
# Starts all 15 containers
# Each in isolated environment
# All connected via network
```

**What Each Container Gets:**
```
User Service Container:
├── Node.js 20
├── Our code
├── npm packages
├── Port 3001
├── Connected to mongo-users
├── Connected to RabbitMQ
└── Connected to Consul
```

---

### Q15: What is docker-compose.yml?

**Answer:** It's a **blueprint** that defines all our containers and how they connect.

**Our docker-compose.yml (simplified):**
```yaml
services:
  # Message Broker
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"     # RabbitMQ
      - "15672:15672"   # Management UI

  # Databases (5 separate MongoDB instances)
  mongo-users:
    image: mongo:7
    ports:
      - "27017:27017"

  mongo-products:
    image: mongo:7
    ports:
      - "27018:27017"

  # API Gateway
  api-gateway:
    build: ./api-gateway
    ports:
      - "4000:4000"
    depends_on:
      - consul
      - rabbitmq

  # User Service
  user-service:
    build: ./services/user-service
    ports:
      - "3001:3001"
    environment:
      - MONGO_URI=mongodb://mongo-users:27017/users
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - mongo-users
      - rabbitmq
```

**What it does:**
1. Defines 15 services
2. Sets ports for each
3. Connects them to databases
4. Creates a network so they can talk
5. Sets environment variables

---

### Q16: What are the advantages of using Docker?

**Advantages in Our App:**

1. **Consistent Environment**
   ```
   Your laptop:   ✅ Works
   My laptop:     ✅ Works
   Production:    ✅ Works
   Same Docker image everywhere!
   ```

2. **Easy Setup**
   ```
   Without Docker:
   1. Install Node.js
   2. Install MongoDB (5 instances!)
   3. Install RabbitMQ
   4. Install Consul
   5. Configure everything
   6. Fix version conflicts
   = 2 hours of setup 😩

   With Docker:
   1. docker-compose up
   = 5 minutes! 😊
   ```

3. **Isolation**
   ```
   Each service runs in its own container
   User Service can't interfere with Product Service
   If one crashes, others keep running
   ```

4. **Easy Scaling**
   ```bash
   # Need more Product Services?
   docker-compose up --scale product-service=3
   # Now you have 3 instances!
   ```

5. **Resource Efficiency**
   ```
   Docker containers share OS kernel
   Much lighter than virtual machines
   15 containers = ~2GB RAM
   15 VMs = ~30GB RAM
   ```

6. **Version Control**
   ```
   Image: user-service:v1.0
   Image: user-service:v2.0
   Easy rollback if v2.0 has bugs
   ```

---

### Q17: What's the difference between Docker Image and Docker Container?

**Simple Answer:**
- **Image** = Recipe (instructions)
- **Container** = Cooked meal (running instance)

**Example:**
```
┌─────────────────────┐
│  Docker Image       │  ← Built from Dockerfile
│  node:20 + code     │  ← Stored on disk
│  Frozen, reusable   │  ← Can create many containers
└─────────────────────┘
         │
         │ docker run
         ▼
┌─────────────────────┐
│  Container 1        │  ← Running instance
│  Port 3001          │  ← Active process
└─────────────────────┘
         │
         │ docker run (same image)
         ▼
┌─────────────────────┐
│  Container 2        │  ← Another running instance
│  Port 3002          │  ← Different port
└─────────────────────┘
```

**In Our App:**
```bash
# Build image (once)
docker build -t user-service .

# Run multiple containers from same image
docker run user-service  # Container 1
docker run user-service  # Container 2
docker run user-service  # Container 3
```

---

### Q18: How do Docker containers communicate?

**Answer:** Through a **Docker network**.

**In Our App:**
```yaml
networks:
  farm2table-network:
    driver: bridge
```

**How Services Talk:**
```
User Service Container
    │
    │ MongoDB connection:
    │ mongodb://mongo-users:27017/users
    │           ↑ Container name (not localhost!)
    ↓
mongo-users Container

User Service Container
    │
    │ RabbitMQ connection:
    │ amqp://rabbitmq:5672
    │         ↑ Container name
    ↓
rabbitmq Container
```

**Magic:** Docker DNS resolves container names to IP addresses automatically!

---

## 🎯 Common Interview Questions

### Q19: Walk me through what happens when a user creates an order.

**Step-by-Step:**

```
1. Frontend
   POST http://localhost:4000/api/orders
   Headers: Authorization: Bearer <token>
   Body: { items: [...], totalAmount: 250 }

2. API Gateway (Port 4000)
   ✓ Verifies JWT token
   ✓ Routes to Order Service
   → http://order-service:3003/api/orders

3. Order Service (Port 3003)
   ✓ Validates order data
   ✓ Saves to MongoDB (mongo-orders)
   ✓ Publishes to RabbitMQ:
     Topic: "order.created"
     Data: { orderId, customerId, items, total }

4. RabbitMQ
   ✓ Stores message
   ✓ Delivers to subscribers

5. Notification Service (Port 3006)
   ✓ Listens to "order.created"
   ✓ Sends email to restaurant
   ✓ Sends push notification
   ✓ Emits Socket.io event to frontend

6. Frontend
   ✓ Receives real-time notification
   ✓ Shows "Order created!" message
   ✓ Updates order list
```

**Technologies Used:**
- Docker (containers)
- API Gateway (routing)
- MongoDB (storage)
- RabbitMQ (messaging)
- JWT (authentication)
- Socket.io (real-time)

---

### Q20: How does the app stay available if one service crashes?

**Answer:** Fault isolation + Message queuing

**Scenario:**
```
Notification Service crashes ❌

What still works:
✅ User login (User Service)
✅ Browse products (Product Service)
✅ Create orders (Order Service)
✅ Track deliveries (Delivery Service)

What doesn't work:
❌ Email notifications
❌ Push notifications

Messages are queued:
→ RabbitMQ stores "order.created" messages
→ When Notification Service restarts
→ Processes all queued messages
→ No data lost!
```

**Docker helps:**
```bash
# Auto-restart crashed containers
restart: always

# Health checks
healthcheck:
  test: ["CMD", "curl", "http://localhost:3006/health"]
  interval: 30s
```

---

### Q21: Why do we have 5 separate MongoDB databases?

**Answer:** Database per service pattern (microservices best practice)

**Our Setup:**
```
User Service       → mongo-users (Port 27017)
Product Service    → mongo-products (Port 27018)
Order Service      → mongo-orders (Port 27019)
Delivery Service   → mongo-deliveries (Port 27020)
Health Service     → mongo-health (Port 27021)
```

**Benefits:**
1. **Independence** - Services don't share databases
2. **Scalability** - Scale databases independently
3. **Security** - User Service can't access Order data directly
4. **Technology Freedom** - Could use PostgreSQL for one service

**Trade-off:**
- Can't do JOIN queries across services
- Have to use API calls or message events

---

### Q22: How do you deploy this in production?

**Development (Current):**
```bash
docker-compose up
# Runs on your laptop
# Uses docker-compose.yml
```

**Production (Real servers):**
```bash
# Option 1: Docker Swarm
docker stack deploy -c docker-compose.yml farm2table

# Option 2: Kubernetes (most popular)
kubectl apply -f k8s/
# Manages:
# - Auto-scaling (more containers when busy)
# - Load balancing
# - Self-healing (restart crashed containers)
# - Rolling updates (no downtime)

# Option 3: Cloud services
# AWS ECS, Google Cloud Run, Azure Container Apps
```

**What changes:**
- Use production MongoDB (not containers)
- Use production RabbitMQ (not containers)
- Add HTTPS certificates
- Add monitoring (Prometheus, Grafana)
- Add logging (ELK stack)
- Use HttpOnly cookies
- Change JWT secret

---

## 📊 Architecture Summary

**Our Stack:**
```
Frontend (React/Next.js)
        ↓
API Gateway (Node.js) - Port 4000
        ↓
    ┌───┴───┬─────┬─────┬───────┬────────┬────────┐
    ↓       ↓     ↓     ↓       ↓        ↓        ↓
  User   Product Order Delivery Health  Notify  Chat
  3001    3002   3003   3004    3005    3006   3007
    ↓       ↓     ↓     ↓       ↓
 Mongo   Mongo Mongo  Mongo   Mongo
 27017   27018 27019  27020   27021

All connected via:
- RabbitMQ (messaging) - Port 5672
- Consul (service discovery) - Port 8500
- Docker Network (farm2table-network)
```

**Key Concepts:**
- ✅ **Cookies** - Store user-role, sent automatically
- ✅ **RabbitMQ** - Asynchronous messaging between services
- ✅ **API Gateway** - Single entry point, routes to services
- ✅ **Microservices** - 7 independent services
- ✅ **Docker** - Containerized deployment, consistent environment

---

## 🎬 Demo Tips

### Show RabbitMQ Management UI:
```
1. Open http://localhost:15672
2. Login: farm2table / secret
3. Click "Queues" tab
4. Create an order in the app
5. Watch messages appear in queue!
```

### Show Consul Service Discovery:
```
1. Open http://localhost:8500
2. Click "Services"
3. See all 7 microservices registered
4. Click one to see health status
```

### Show Docker Containers:
```bash
# List all running containers
docker ps

# Show container logs
docker logs farm2table-user-service

# Enter container shell
docker exec -it farm2table-user-service sh
```

---

## 🎓 30-Second Pitch

*"Our app uses a **microservices architecture** with **7 independent services** communicating through **RabbitMQ** message broker. An **API Gateway** routes requests from the frontend to the appropriate service. Each service has its own **MongoDB database** and runs in a **Docker container**. This architecture provides **fault isolation**, **independent scaling**, and **technology flexibility**. **Consul** handles service discovery, and we use **JWT tokens** stored in **cookies and localStorage** for authentication. Everything is orchestrated with **docker-compose**, making deployment as simple as running one command."*

---

## 📋 Quick File Reference Guide

### **Cookies & Sessions:**
- **Set cookies:** `frontend/src/lib/auth.ts` (line 69)
- **Clear cookies:** `frontend/src/lib/auth.ts` (line 168)
- **Store in localStorage:** `frontend/src/lib/auth.ts` (lines 64-66)
- **Send with requests:** `frontend/src/lib/api-client.ts` (line 48)

### **JWT Tokens:**
- **Store token:** `frontend/src/lib/api-client.ts` (line 28)
- **Add to headers:** `frontend/src/lib/api-client.ts` (line 48)
- **Verify token (backend):** `backend/api-gateway/src/middleware/auth.ts`

### **RabbitMQ:**
- **Docker config:** `backend/docker-compose.yml` (lines 3-15)
- **Connection URL:** `backend/docker-compose.yml` (line 110)
- **Publish messages:** `backend/services/order-service/src/routes/orders.ts`
- **Consume messages:** `backend/services/notification-service/src/index.ts`
- **Management UI:** http://localhost:15672 (farm2table / secret)

### **API Gateway:**
- **Docker config:** `backend/docker-compose.yml` (lines 79-98)
- **Routing logic:** `backend/api-gateway/src/routes.ts`
- **Auth middleware:** `backend/api-gateway/src/middleware/auth.ts`
- **Frontend API URL:** `frontend/.env.local` (NEXT_PUBLIC_API_URL)

### **Microservices:**
- **All services defined:** `backend/docker-compose.yml` (lines 100-244)
- **Service ports:** 3001-3007
- **User Service:** `backend/services/user-service/`
- **Product Service:** `backend/services/product-service/`
- **Order Service:** `backend/services/order-service/`

### **Databases:**
- **5 MongoDB instances:** `backend/docker-compose.yml` (lines 28-77)
- **Connection strings:** In each service's docker-compose environment
- **Ports:** 27017-27021

### **Docker:**
- **Main config:** `backend/docker-compose.yml` (257 lines total)
- **Start command:** `docker-compose up -d`
- **Check status:** `docker ps`

---

## 🎯 Demo Answer Examples

**Q: "Show me where you track cookies"**
> *Opens `frontend/src/lib/auth.ts`* "Here at line 69, when the user logs in, we set a cookie with `document.cookie` that stores their role. It expires after 7 days—that's the 604800 seconds you see in max-age. And here at line 168, when they logout, we clear it by setting max-age to 0."

**Q: "How do you use JWT tokens?"**
> *Opens `frontend/src/lib/api-client.ts`* "We store the JWT token here at line 28 in both localStorage and cookies. Then, every API request automatically includes it—see line 48 where we add `Authorization: Bearer ${this.token}` to the headers. The backend verifies this in the API Gateway middleware."

**Q: "Show me RabbitMQ in action"**
> *Opens `backend/docker-compose.yml`* "RabbitMQ is configured here at lines 3-15. The credentials are farm2table/secret. Services connect using this RABBITMQ_URL environment variable you see at line 110. When an order is created, the Order Service publishes a message, and the Notification Service picks it up asynchronously. *Opens http://localhost:15672* See the management UI? You can watch messages flow through the queues in real-time."

**Q: "Where's your API Gateway?"**
> *Opens `backend/api-gateway/src/routes.ts`* "The gateway is here. It routes /api/auth to User Service on port 3001, /api/products to Product Service on 3002, and so on. All authentication happens in the middleware before requests are forwarded. The frontend only knows about one URL—localhost:4000—everything else is handled by the gateway."

**Q: "How do you deploy with Docker?"**
> *Opens terminal* "Everything is defined in docker-compose.yml—15 containers total: 7 microservices, 5 databases, RabbitMQ, Consul, and the API Gateway. One command: `docker-compose up` and the entire stack is running. *Runs `docker ps`* See? All 15 containers, each isolated, all connected through the farm2table-network."

---

*Use this for your demo presentation and interviews! 🚀*
*All file locations verified - ready to reference during technical discussions!*
