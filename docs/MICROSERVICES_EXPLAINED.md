# 🎓 Microservices Explained - Beginner's Guide

## 📚 Table of Contents
1. [What are Microservices?](#what-are-microservices)
2. [Our 7 Services Explained](#our-7-services-explained)
3. [How Services Communicate](#how-services-communicate)
4. [RabbitMQ Deep Dive](#rabbitmq-deep-dive)
5. [Real-World Examples](#real-world-examples)

---

## 🏗️ What are Microservices?

### Simple Analogy: Restaurant vs Food Court

**Traditional Monolith (One Big App):**
```
🍽️ ONE RESTAURANT
├── Chef does everything
├── One kitchen
├── One menu
└── If kitchen breaks, everything stops! 😱
```

**Microservices (Our App):**
```
🏬 FOOD COURT
├── 🍕 Pizza Stand (User Service)
├── 🍔 Burger Stand (Product Service)
├── 🌮 Taco Stand (Order Service)
├── 🚚 Delivery Stand (Delivery Service)
├── 🏥 Health Inspector (Health Service)
├── 📢 Announcement System (Notification Service)
└── 🤖 Info Kiosk (Chatbot Service)

Each stand:
✅ Works independently
✅ Has its own staff (database)
✅ Can break without affecting others
✅ Can scale up if busy
```

### Why Use Microservices?

1. **Fault Isolation** - If one service crashes, others keep working
2. **Independent Scaling** - Scale only the busy service
3. **Team Independence** - Different teams work on different services
4. **Technology Freedom** - Each service can use different tech (we use Node.js for all)
5. **Easier Updates** - Update one service without touching others

---

## 🎯 Our 7 Services Explained

### 1. 👤 User Service (Port 3001)
**What it does:** Handles all user-related stuff

**Responsibilities:**
- User registration and login
- JWT token generation
- User profiles (Farmer, Restaurant, Distributor, Inspector)
- Password management

**Database:** `users` (MongoDB)

**Example:**
```
User registers → User Service saves to database → Returns JWT token
```

**Key Endpoints:**
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

---

### 2. 🌽 Product Service (Port 3002)
**What it does:** Manages product catalog and inventory

**Responsibilities:**
- Product listings (fruits, vegetables, etc.)
- Stock management
- Product search and filtering
- Price management

**Database:** `products` (MongoDB)

**Example:**
```
Farmer adds tomatoes → Product Service saves → Available for restaurants to order
```

**Key Endpoints:**
- `GET /api/products` - List all products
- `POST /api/products` - Create product (farmer only)
- `PATCH /api/products/:id/stock` - Update stock quantity

---

### 3. 📦 Order Service (Port 3003)
**What it does:** Manages orders from restaurants

**Responsibilities:**
- Creating orders
- Order status tracking
- Order history
- Order calculations

**Database:** `orders` (MongoDB)

**Example:**
```
Restaurant orders 50kg tomatoes → Order Service creates order → 
Publishes "order.created" event to RabbitMQ
```

**Key Endpoints:**
- `POST /api/orders` - Create new order
- `GET /api/orders` - List orders
- `PATCH /api/orders/:id/status` - Update order status

---

### 4. 🚚 Delivery Service (Port 3004)
**What it does:** Tracks deliveries from farm to restaurant

**Responsibilities:**
- Delivery creation
- Real-time tracking
- Delivery status updates
- Fleet management (vehicles, drivers)

**Database:** `deliveries` (MongoDB)

**Example:**
```
Order confirmed → Delivery Service creates delivery record → 
Distributor picks up → Status: "in_transit" → Delivered
```

**Key Endpoints:**
- `GET /api/deliveries` - List deliveries
- `POST /api/deliveries` - Create delivery
- `PATCH /api/deliveries/:id/status` - Update delivery status
- `GET /api/fleet` - List vehicles and drivers

---

### 5. 🏥 Health Service (Port 3005)
**What it does:** Manages health inspections and compliance

**Responsibilities:**
- Schedule inspections
- Record inspection results
- Track violations
- Compliance reporting

**Database:** `health` (MongoDB)

**Example:**
```
Inspector visits farm → Records inspection → 
Pass/Fail result → Updates compliance records
```

**Key Endpoints:**
- `GET /api/inspections` - List inspections
- `POST /api/inspections` - Schedule inspection
- `PATCH /api/inspections/:id/complete` - Complete inspection

---

### 6. 📢 Notification Service (Port 3006)
**What it does:** Sends real-time notifications

**Responsibilities:**
- Real-time notifications via Socket.io
- Email notifications (future)
- Push notifications (future)
- Notification history

**Database:** None (stateless service)

**Example:**
```
Order created → Notification Service sends Socket.io event → 
Frontend receives notification → Shows "New order!" popup
```

**Key Endpoints:**
- `POST /api/notify` - Send notification
- `POST /notify/role/:role` - Notify all users with role
- WebSocket connection for real-time updates

---

### 7. 🤖 Chatbot Service (Port 3007)
**What it does:** AI-powered chatbot assistant

**Responsibilities:**
- Intent detection
- Response generation
- User queries handling
- Context management

**Database:** None (stateless service)

**Example:**
```
User: "What's my order status?" → 
Chatbot Service detects intent → 
Fetches order from Order Service → 
Returns friendly response
```

**Key Endpoints:**
- `POST /api/chat` - Chat with bot

---

## 🔄 How Services Communicate

Services communicate in **TWO ways**:

### 1. 📡 Synchronous Communication (HTTP/REST)
**When:** Immediate response needed

**How it works:**
```
Frontend → API Gateway → Service → Response
```

**Example:**
```javascript
// Frontend wants to get products
GET http://localhost:4000/api/products
  ↓
API Gateway routes to Product Service
  ↓
Product Service queries database
  ↓
Returns products immediately
```

**Used for:**
- Getting data (GET requests)
- Creating resources (POST requests)
- Updating resources (PUT/PATCH requests)
- When you need immediate response

---

### 2. 📬 Asynchronous Communication (RabbitMQ)
**When:** Background processing, no immediate response needed

**How it works:**
```
Service A → RabbitMQ (Message Queue) → Service B (later)
```

**Example:**
```javascript
// Order Service creates order
Order Service saves order to database
  ↓
Publishes "order.created" message to RabbitMQ
  ↓
Returns success to user immediately ✅
  ↓
[Background] Notification Service picks up message
  ↓
Sends notification to farmer
```

**Used for:**
- Notifications
- Background processing
- Event-driven actions
- When you don't need immediate response

---

## 🐰 RabbitMQ Deep Dive

### What is RabbitMQ?

**Simple Analogy:**
```
RabbitMQ = Post Office 📮

Service A writes a letter (message)
  ↓
Drops it in mailbox (publishes to RabbitMQ)
  ↓
Post office stores it (RabbitMQ stores message)
  ↓
Post office delivers to Service B (RabbitMQ delivers message)
  ↓
Service B receives and processes letter
```

### Key Concepts

#### 1. **Exchange** (Post Office)
- Where messages are sent
- Routes messages to correct queues
- Type: `topic` (allows pattern matching)

#### 2. **Queue** (Mailbox)
- Where messages wait
- Services subscribe to queues
- Messages stored until processed

#### 3. **Routing Key** (Address)
- Pattern that determines which queue gets message
- Examples: `order.created`, `delivery.status_updated`

#### 4. **Publisher** (Sender)
- Service that sends messages
- Example: Order Service publishes "order.created"

#### 5. **Subscriber** (Receiver)
- Service that listens for messages
- Example: Notification Service subscribes to "order.created"

---

### How We Use RabbitMQ in Our App

#### Configuration (from `backend/shared/rabbitmq.ts`):

```typescript
// Connection
RABBITMQ_URL = 'amqp://farm2table:secret@localhost:5672'

// Exchange Type: 'topic'
// This allows pattern matching like:
// - order.* (all order events)
// - delivery.* (all delivery events)
```

#### Publishing Messages (Sending):

```typescript
// Example: Order Service publishes when order is created
await rabbitMQ.publish(
  'events',                    // Exchange name
  'order.created',             // Routing key
  {                            // Message data
    orderId: '123',
    customerId: '456',
    totalAmount: 250
  }
);
```

#### Subscribing to Messages (Receiving):

```typescript
// Example: Notification Service listens for order events
await rabbitMQ.subscribe(
  'notification-queue',        // Queue name
  'events',                    // Exchange name
  'order.*',                   // Pattern (all order events)
  async (message) => {        // Callback function
    // Process the message
    await sendNotification(message.customerId);
  }
);
```

---

### RabbitMQ Conditions & Rules in Our App

#### 1. **Durable Messages**
```typescript
{ durable: true }  // Messages survive RabbitMQ restart
```
**Why:** Don't lose messages if RabbitMQ crashes

#### 2. **Persistent Messages**
```typescript
{ persistent: true }  // Messages saved to disk
```
**Why:** Don't lose messages if server crashes

#### 3. **Message Acknowledgment (ACK)**
```typescript
channel.ack(msg);  // Confirm message processed
```
**Why:** RabbitMQ knows message was handled successfully

#### 4. **Message Rejection (NACK)**
```typescript
channel.nack(msg, false, true);  // Reject and requeue
```
**Why:** If processing fails, put message back in queue to retry

#### 5. **Topic Exchange Pattern**
```typescript
Exchange: 'events'
Routing Keys:
  - order.created
  - order.confirmed
  - order.cancelled
  - delivery.created
  - delivery.status_updated
  - product.out_of_stock
```

**Pattern Matching:**
- `order.*` - Matches all order events
- `*.created` - Matches all "created" events
- `delivery.status_*` - Matches all delivery status events

---

### Event Flow Examples

#### Example 1: Order Created Flow

```
1. Restaurant creates order
   ↓
2. Order Service:
   - Saves order to MongoDB ✅
   - Publishes to RabbitMQ:
     Exchange: 'events'
     Routing Key: 'order.created'
     Data: { orderId, customerId, items, total }
   - Returns success to user ✅
   ↓
3. RabbitMQ stores message
   ↓
4. Multiple services receive message:
   
   a) Notification Service:
      - Sends notification to farmer
      - Sends notification to restaurant
   
   b) Delivery Service:
      - Creates delivery record
      - Assigns to distributor
   
   c) Product Service:
      - Updates stock quantity
      - Marks items as "reserved"
```

#### Example 2: Delivery Status Updated Flow

```
1. Distributor updates delivery status to "in_transit"
   ↓
2. Delivery Service:
   - Updates delivery in MongoDB ✅
   - Publishes to RabbitMQ:
     Exchange: 'events'
     Routing Key: 'delivery.status_updated'
     Data: { deliveryId, status, location }
   ↓
3. RabbitMQ delivers message
   ↓
4. Notification Service:
   - Sends real-time update via Socket.io
   - Notifies farmer: "Your order is on the way!"
   - Notifies restaurant: "Order is in transit"
```

---

## 🎬 Real-World Examples

### Scenario 1: Restaurant Places Order

```
Step 1: Frontend
  POST /api/orders
  Body: { items: [...], totalAmount: 250 }
  ↓
Step 2: API Gateway (Port 4000)
  - Validates JWT token ✅
  - Routes to Order Service
  ↓
Step 3: Order Service (Port 3003)
  - Validates order data ✅
  - Saves to MongoDB ✅
  - Publishes "order.created" to RabbitMQ 📤
  - Returns order ID to user ✅
  ↓
Step 4: RabbitMQ
  - Stores message
  - Delivers to subscribers
  ↓
Step 5: Multiple Services Process (in parallel):
  
  a) Notification Service:
     - Sends Socket.io notification
     - "New order received!"
  
  b) Delivery Service:
     - Creates delivery record
     - Status: "pending"
  
  c) Product Service:
     - Updates stock: -50kg tomatoes
```

**Timeline:**
- User gets response: **0.5 seconds** ✅
- Notifications sent: **1-2 seconds** (background)
- Delivery created: **1-2 seconds** (background)

---

### Scenario 2: Delivery Status Update

```
Step 1: Distributor App
  PATCH /api/deliveries/123/status
  Body: { status: "in_transit", location: {...} }
  ↓
Step 2: API Gateway
  - Routes to Delivery Service
  ↓
Step 3: Delivery Service (Port 3004)
  - Updates delivery in MongoDB ✅
  - Publishes "delivery.status_updated" to RabbitMQ 📤
  - Returns success ✅
  ↓
Step 4: RabbitMQ delivers message
  ↓
Step 5: Notification Service
  - Receives message
  - Sends Socket.io event to:
    - Farmer: "Your order is being delivered!"
    - Restaurant: "Order is on the way!"
  ↓
Step 6: Frontend
  - Receives Socket.io event
  - Updates delivery map in real-time 🗺️
  - Shows "In Transit" badge
```

---

### Scenario 3: Service Failure Recovery

```
Scenario: Notification Service crashes ❌

What happens:
1. Order Service creates order ✅
2. Publishes "order.created" to RabbitMQ ✅
3. RabbitMQ stores message (doesn't lose it!) ✅
4. Notification Service is down, so message waits ⏳
5. Order Service returns success to user ✅
   (User doesn't wait!)
6. Notification Service restarts 🔄
7. RabbitMQ delivers queued messages ✅
8. Notification Service processes all missed messages ✅
9. Users receive notifications (delayed but not lost!) ✅
```

**Key Point:** Messages are **never lost**! They wait in queue until service is back online.

---

## 📊 Service Communication Summary

### Synchronous (HTTP) - When to Use:
- ✅ Need immediate response
- ✅ User is waiting
- ✅ Data retrieval
- ✅ CRUD operations

**Example:** Getting list of products, creating order

### Asynchronous (RabbitMQ) - When to Use:
- ✅ Background processing
- ✅ Notifications
- ✅ Event-driven actions
- ✅ Don't need immediate response

**Example:** Sending email, updating analytics, triggering workflows

---

## 🎯 Key Takeaways

1. **7 Independent Services** - Each does one thing well
2. **API Gateway** - Single entry point, routes requests
3. **HTTP/REST** - For immediate responses
4. **RabbitMQ** - For background processing
5. **Fault Isolation** - One service down ≠ entire app down
6. **Scalability** - Scale only what's needed
7. **Message Persistence** - Messages never lost, even if service crashes

---

## 🔍 Quick Reference

### Service Ports:
- API Gateway: `4000`
- User Service: `3001`
- Product Service: `3002`
- Order Service: `3003`
- Delivery Service: `3004`
- Health Service: `3005`
- Notification Service: `3006`
- Chatbot Service: `3007`

### RabbitMQ:
- Port: `5672` (AMQP)
- Management UI: `15672`
- Username: `farm2table`
- Password: `secret`
- Exchange Type: `topic`
- Exchange Name: `events`

### Common Routing Keys:
- `order.created`
- `order.confirmed`
- `order.cancelled`
- `delivery.created`
- `delivery.status_updated`
- `product.out_of_stock`
- `product.updated`

---

## 💡 Questions?

**Q: Why not just call services directly?**
A: Direct calls make services wait for each other. RabbitMQ allows async processing.

**Q: What if RabbitMQ crashes?**
A: Messages are stored on disk (persistent), so they're safe. RabbitMQ can be restarted.

**Q: Can multiple services listen to same message?**
A: Yes! That's the power of pub/sub. Multiple services can react to same event.

**Q: How do services find each other?**
A: Through API Gateway (for HTTP) or RabbitMQ (for async). Service discovery via Consul (future).

---

**Happy Learning! 🚀**

