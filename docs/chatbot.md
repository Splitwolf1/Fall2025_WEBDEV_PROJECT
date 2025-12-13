# 🤖 Chatbot Architecture & API Communication Guide

This document explains how the chatbot works and how services communicate in the Farm-to-Table application.

---

## Table of Contents

1. [Chatbot Overview](#chatbot-overview)
2. [Chatbot Files](#chatbot-files)
3. [Complete Chat Flow](#complete-chat-flow)
4. [Intent Detection](#intent-detection)
5. [Response Generation](#response-generation)
6. [Service Calls](#service-calls)
7. [Role-Based UI](#role-based-ui)
8. [External vs Internal APIs](#external-vs-internal-apis)
9. [Service Communication Methods](#service-communication-methods)
10. [File Reference](#file-reference)

---

## Chatbot Overview

The chatbot is an AI assistant that helps users with common tasks:
- Track orders
- View inspections and violations
- Find products
- Connect with farmers/restaurants/distributors

---

## Chatbot Files

```
/backend/services/chatbot-service/src/
├── index.ts      → Entry point, API endpoint
├── intents.ts    → Understands WHAT user is asking
├── handlers.ts   → Generates the response
└── services.ts   → Talks to other services for data
```

```
/frontend/src/components/shared/
└── ChatWidget.tsx → The chat UI component
```

---

## Complete Chat Flow

Here's the journey of a chat message from typing to response:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: User Types "Track my order ORD-1234-5678"                      │
│  📁 ChatWidget.tsx (lines 200-250)                                      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Frontend sends POST to /api/chat                               │
│  📁 ChatWidget.tsx → axios.post('/api/chat', { message, userId })       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Gateway routes to chatbot-service (port 3008)                  │
│  📁 external-api-gateway/src/routes.ts (lines 286-314)                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Chatbot receives message                                        │
│  📁 chatbot-service/src/index.ts (lines 39-84)                          │
│                                                                          │
│  app.post('/api/chat', async (req, res) => {                            │
│    const { message, userId } = req.body;                                │
│    const intent = detectIntent(message);        ← STEP 5                │
│    const response = await generateResponse(...); ← STEP 6              │
│    res.json({ success: true, intent, response });                       │
│  });                                                                     │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Intent Detection                                                │
│  📁 chatbot-service/src/intents.ts (lines 129-169)                      │
│                                                                          │
│  "Track my order ORD-1234" → TRACK_ORDER intent                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Generate Response                                               │
│  📁 chatbot-service/src/handlers.ts                                     │
│                                                                          │
│  switch (intent) {                                                       │
│    case TRACK_ORDER:                                                     │
│      // Extract order number, call services, format response            │
│  }                                                                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 7: Service-to-Service Calls                                        │
│  📁 chatbot-service/src/services.ts                                     │
│                                                                          │
│  const order = await axios.get('http://order-service:3004/api/orders'); │
│  const delivery = await axios.get('http://delivery-service:3005/...');  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 8: Response sent back to frontend                                  │
│  📁 ChatWidget.tsx receives and displays the message                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Intent Detection

📁 **File:** [intents.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/intents.ts)

This is how the chatbot **understands** what you're asking.

### Available Intents

```typescript
export enum ChatIntent {
  TRACK_ORDER = 'track_order',           // "Track my order"
  TRACK_INSPECTION = 'track_inspection', // "View inspection INS-702"
  GET_VIOLATIONS = 'get_violations',     // "Show recent violations"
  GET_INSPECTIONS = 'get_inspections',   // "Upcoming inspections"
  PRODUCT_INQUIRY = 'product_inquiry',   // "Do you have tomatoes?"
  PRICING = 'pricing',                   // "How much is it?"
  DELIVERY_TIME = 'delivery_time',       // "When will it arrive?"
  COMPLAINT = 'complaint',               // "I have a problem"
  HELP = 'help',                         // "Help me"
  GREETING = 'greeting',                 // "Hi" or "Hello"
  CHAT_WITH_PARTY = 'chat_with_party',   // "Talk to farmer"
  UNKNOWN = 'unknown',                   // Fallback
}
```

### Pattern Matching

Each intent has **keywords** and **regex patterns**:

```typescript
const intentPatterns = {
  [ChatIntent.TRACK_ORDER]: {
    keywords: ['track', 'order', 'status', 'where'],
    patterns: [
      /track.*order/i,        // "track my order"
      /order.*status/i,       // "what's my order status"
      /ORD-\d+-\d+/i,         // Order number like ORD-1234-5678
    ],
  },
  [ChatIntent.GET_VIOLATIONS]: {
    keywords: ['violation', 'violations', 'non-compliance'],
    patterns: [
      /show.*violation/i,
      /recent.*violation/i,
    ],
  },
  // ... more intents
};
```

### The Detection Logic

```typescript
export const detectIntent = (message: string): ChatIntent => {
  // 1. Check priority patterns first
  if (/talk to.*farmer.*ORD-\d+/.test(message)) {
    return ChatIntent.CHAT_WITH_PARTY;
  }

  // 2. Check regex patterns
  for (const [intent, { patterns }] of Object.entries(intentPatterns)) {
    if (patterns.some(pattern => pattern.test(message))) {
      return intent;
    }
  }

  // 3. Check keywords
  for (const [intent, { keywords }] of Object.entries(intentPatterns)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return intent;
    }
  }

  return ChatIntent.UNKNOWN; // Fallback
};
```

---

## Response Generation

📁 **File:** [handlers.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/handlers.ts)

Once the intent is detected, the handler creates the appropriate response:

```typescript
export const generateResponse = async (intent, message, userId) => {
  switch (intent) {
    case ChatIntent.GREETING:
      return {
        text: "Hi there! 👋 I'm your Farm-to-Table assistant.",
        quickReplies: ['Track my order', 'Browse products'],
      };

    case ChatIntent.TRACK_ORDER:
      const orderNumber = extractOrderNumber(message);
      const order = await getOrderByNumber(orderNumber); // Calls order-service
      const delivery = await getDeliveryInfo(orderNumber); // Calls delivery-service
      
      return {
        text: `Order ${orderNumber} - Status: ${order.status}`,
        quickReplies: ['Talk to farmer', 'Track another order'],
      };

    case ChatIntent.GET_VIOLATIONS:
      // Returns mock violation data for inspectors
      return {
        text: "📋 **Recent Violations**\n\n...",
        quickReplies: ['View open violations', 'Upcoming inspections'],
      };

    // ... more cases
  }
};
```

---

## Service Calls

📁 **File:** [services.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/services.ts)

The chatbot talks to other services to get real data:

```typescript
// Service URLs
const ORDER_SERVICE_URL = 'http://order-service:3004';
const DELIVERY_SERVICE_URL = 'http://delivery-service:3005';
const PRODUCT_SERVICE_URL = 'http://product-service:3003';

// Get order details
export const getOrderByNumber = async (orderNumber: string) => {
  const response = await axios.get(
    `${ORDER_SERVICE_URL}/api/orders/number/${orderNumber}`
  );
  return response.data.data;
};

// Get delivery info
export const getDeliveryInfo = async (orderNumber: string) => {
  const response = await axios.get(
    `${DELIVERY_SERVICE_URL}/api/deliveries/order/${orderNumber}`
  );
  return response.data.data;
};

// Search products
export const searchProducts = async (query: string) => {
  const response = await axios.get(
    `${PRODUCT_SERVICE_URL}/api/products`,
    { params: { search: query, limit: 5 } }
  );
  return response.data.data;
};
```

---

## Role-Based UI

📁 **File:** [ChatWidget.tsx](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/frontend/src/components/shared/ChatWidget.tsx)

The chat UI changes based on who's logged in:

```typescript
const roleConfigs = {
  restaurant: {
    welcomeMessage: "I can help you track orders and find products.",
    suggestions: ['Track my order', 'Talk to farmer'],
    botName: 'Ordering Assistant',
  },
  farmer: {
    welcomeMessage: "I can help you manage incoming orders.",
    suggestions: ['Show pending orders', 'Talk to restaurant'],
    botName: 'Sales Assistant',
  },
  distributor: {
    welcomeMessage: "I can help with delivery routes and schedules.",
    suggestions: ['Show my deliveries', 'View route details'],
    botName: 'Delivery Assistant',
  },
  inspector: {
    welcomeMessage: "I can help you view violations and inspections.",
    suggestions: ['Show recent violations', 'Upcoming inspections'],
    botName: 'Inspection Assistant',
  },
};
```

---

## External vs Internal APIs

You have **TWO API Gateways**:

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                           INTERNET / USERS                              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              EXTERNAL API GATEWAY (Port 4000)                          │
│     📁 /backend/gateways/external-api-gateway                          │
│                                                                         │
│  PURPOSE: Frontend ↔ Backend communication                              │
│  SECURITY: JWT tokens required                                          │
│  ROUTES: /api/auth, /api/users, /api/orders, /api/products...          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          MICROSERVICES                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Auth     │ │ User     │ │ Product  │ │ Order    │ │ Delivery │     │
│  │ :3001    │ │ :3002    │ │ :3003    │ │ :3004    │ │ :3005    │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       │            │            │            │            │            │
│       └────────────┴────────────┴─────┬──────┴────────────┘            │
│                                       │                                 │
│                                       ▼                                 │
│         ┌────────────────────────────────────────────────────┐         │
│         │       INTERNAL API GATEWAY (Port 4001)             │         │
│         │  📁 /backend/gateways/internal-api-gateway         │         │
│         │                                                     │         │
│         │  PURPOSE: Service ↔ Service communication          │         │
│         │  SECURITY: Service API keys (no user JWT)          │         │
│         │  ROUTES: /internal/users, /internal/orders...      │         │
│         └────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────────┘
```

### External API Gateway (For Users)

📁 **Location:** `/backend/gateways/external-api-gateway/`

| Purpose | File |
|---------|------|
| Main server | `src/index.ts` |
| Route definitions | `src/routes.ts` |
| JWT verification | `src/middleware/auth.ts` |

**How it works:**

```typescript
// Public routes (no JWT required)
router.use('/api/auth', createProxyMiddleware({ target: AUTH_SERVICE }));

// Protected routes (JWT required)
router.use(
  '/api/users',
  authenticateToken,  // ← Verify JWT first!
  requireAuth,        // ← Must be logged in
  createProxyMiddleware({ target: USER_SERVICE })
);
```

### Internal API Gateway (For Services)

📁 **Location:** `/backend/gateways/internal-api-gateway/`

| Purpose | File |
|---------|------|
| Main server | `src/index.ts` |
| Route definitions | `src/routes.ts` |
| Service key auth | `src/middleware/serviceAuth.ts` |

**How it works:**

```typescript
// Internal routes (service API key required, not user JWT)
router.use(
  '/internal/users',
  serviceAuth,  // ← Service API key, not JWT!
  createProxyMiddleware({
    target: USER_SERVICE,
    pathRewrite: { '^/internal/users': '/api/users' },
  })
);
```

---

## Service Communication Methods

### 1️⃣ Direct HTTP Calls (Synchronous)

Used when one service **needs data immediately** from another.

```typescript
// Chatbot directly calls order-service
const response = await axios.get('http://order-service:3004/api/orders/123');
```

```
Chatbot Service ──HTTP GET──> Order Service
                <──Response───
```

### 2️⃣ Through Internal Gateway (More Secure)

Used for centralized service-to-service authentication.

```typescript
const response = await axios.get(
  'http://internal-gateway:4001/internal/orders',
  { headers: { 'X-Service-Key': SERVICE_API_KEY } }
);
```

```
Chatbot ──> Internal Gateway ──> Order Service
        <──                  <──
```

### 3️⃣ RabbitMQ Messages (Asynchronous)

Used when services need to **notify** others without waiting.

```typescript
// Order Service publishes event
rabbitmq.publish('farm2table.events', 'order.created', {
  orderId: order._id,
  buyerId: order.buyerId,
});

// Notification Service listens
rabbitmq.subscribe('order.created', async (message) => {
  await sendNotification(message.buyerId, 'Order placed!');
});

// Delivery Service also listens
rabbitmq.subscribe('order.created', async (message) => {
  await createDeliveryTask(message.orderId);
});
```

```
Order Service ──publishes──> [RabbitMQ] ──delivers──> Notification Service
                                       ──delivers──> Delivery Service
                                       ──delivers──> Chatbot Service
```

### Communication Matrix

| From | To | Method | When Used |
|------|-----|--------|-----------|
| **Frontend** | External Gateway | HTTP + JWT | All user actions |
| **External Gateway** | Services | HTTP Proxy | Every request |
| **Chatbot** | Order/Delivery | Direct HTTP | Getting data for responses |
| **Service** | Service | Internal Gateway | Secure internal lookups |
| **Any Service** | RabbitMQ | Publish | Events (order created, etc.) |
| **RabbitMQ** | Any Service | Subscribe | Reacting to events |

---

## File Reference

### Chatbot Service

| Purpose | File |
|---------|------|
| Main entry point | [index.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/index.ts) |
| Intent detection | [intents.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/intents.ts) |
| Response handlers | [handlers.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/handlers.ts) |
| Service calls | [services.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/services.ts) |

### Frontend

| Purpose | File |
|---------|------|
| Chat UI component | [ChatWidget.tsx](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/frontend/src/components/shared/ChatWidget.tsx) |
| Message context | [MessageContext.tsx](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/frontend/src/contexts/MessageContext.tsx) |

### Gateways

| Purpose | File |
|---------|------|
| External Gateway main | [index.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/external-api-gateway/src/index.ts) |
| External Gateway routes | [routes.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/external-api-gateway/src/routes.ts) |
| External Gateway auth | [auth.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/external-api-gateway/src/middleware/auth.ts) |
| Internal Gateway main | [index.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/internal-api-gateway/src/index.ts) |
| Internal Gateway routes | [routes.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/internal-api-gateway/src/routes.ts) |

### Shared Utilities

| Purpose | File |
|---------|------|
| RabbitMQ helper | [rabbitmq.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/api-gateway/shared/rabbitmq.ts) |
| Consul helper | [consul.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/api-gateway/shared/consul.ts) |
| Database helper | [database.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/api-gateway/shared/database.ts) |

---

## RabbitMQ Event Subscriptions in Chatbot

📁 **File:** [index.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/index.ts) (lines 102-136)

The chatbot subscribes to events for proactive notifications:

```typescript
const setupEventHandlers = async (rabbitMQ: RabbitMQClient) => {
  // Listen for order events
  await rabbitMQ.subscribe(
    'chatbot.order_events',
    'farm_to_table_events',
    'order.*',
    async (eventData) => {
      console.log('📦 Received order event:', eventData);
      // Could trigger proactive chat notifications
    }
  );

  // Listen for delivery events
  await rabbitMQ.subscribe(
    'chatbot.delivery_events',
    'farm_to_table_events',
    'delivery.*',
    async (eventData) => {
      console.log('🚚 Received delivery event:', eventData);
      // Could update delivery status in real-time
    }
  );

  // Listen for user events
  await rabbitMQ.subscribe(
    'chatbot.user_events',
    'farm_to_table_events',
    'user.*',
    async (eventData) => {
      console.log('👤 Received user event:', eventData);
      // Could personalize responses based on user activity
    }
  );
};
```

---

*Last updated: December 13, 2025*
