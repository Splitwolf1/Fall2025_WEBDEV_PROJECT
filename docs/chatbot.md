# 🤖 How the Chatbot Works (Simple Explanation)

Hey! Let me explain how our chatbot works like I'm talking to a friend who's new to coding.

---

## What Does the Chatbot Do?

Think of it as a **smart assistant** that can:
- ✅ Answer questions about orders ("Track my order ORD-1234")
- ✅ Connect you with farmers/restaurants ("Talk to farmer")
- ✅ Help inspectors check violations ("Show recent violations")
- ✅ Find products ("Do you have tomatoes?")

---

## The 4 Files That Make It Work

```
/backend/services/chatbot-service/src/
├── index.ts      → The "front door" - receives your message
├── intents.ts    → The "brain" - understands what you're asking
├── handlers.ts   → The "mouth" - creates the response
└── services.ts   → The "hands" - grabs data from other services
```

Let's walk through each one...

---

## 📁 File 1: `index.ts` - The Front Door

**What it does:** Receives chat messages and sends back responses.

**Think of it like:** A receptionist at a help desk. You tell them your problem, they figure out who can help, and get you an answer.

**The important part:**

```typescript
// When someone sends a message to /api/chat
app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  
  // Step 1: Figure out what they're asking
  const intent = detectIntent(message);
  
  // Step 2: Generate the answer
  const response = await generateResponse(intent, message, userId);
  
  // Step 3: Send it back
  res.json({ success: true, intent, response });
});
```

**Where to find it:** [index.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/index.ts) (lines 39-84)

---

## 📁 File 2: `intents.ts` - The Brain

**What it does:** Figures out WHAT the user is asking.

**Think of it like:** When someone says "I need to track my package", your brain understands they want shipping information - not a weather report.

**How it works:**

```typescript
// These are all the things the chatbot can understand
enum ChatIntent {
  TRACK_ORDER,        // "Where's my order?"
  TRACK_INSPECTION,   // "Show inspection INS-702"
  GET_VIOLATIONS,     // "Show recent violations"
  GREETING,           // "Hi" or "Hello"
  CHAT_WITH_PARTY,    // "Talk to farmer"
  HELP,               // "Help me"
  UNKNOWN,            // "aslkdjfalskjdf" (gibberish)
}
```

**The magic - Pattern Matching:**

```typescript
// For TRACK_ORDER, we look for these patterns:
keywords: ['track', 'order', 'status', 'where']
patterns: [
  /track.*order/i,      // "track my order" ✅
  /order.*status/i,     // "order status please" ✅
  /ORD-\d+-\d+/i,       // "ORD-1234-5678" ✅
]
```

So if you type "Where is my order ORD-1234?", it matches:
- ✅ Contains "order" keyword
- ✅ Contains "ORD-1234" pattern
- → Intent = **TRACK_ORDER**

**Where to find it:** [intents.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/intents.ts)

---

## 📁 File 3: `handlers.ts` - The Mouth

**What it does:** Creates the actual response to send back.

**Think of it like:** Once your brain knows someone wants to track an order, your mouth speaks the answer.

**How it works:**

```typescript
// Based on what intent was detected, generate a response
switch (intent) {
  case ChatIntent.GREETING:
    return {
      text: "Hi there! 👋 How can I help you?",
      quickReplies: ['Track my order', 'Browse products'],
    };

  case ChatIntent.TRACK_ORDER:
    // Get the order number from the message
    const orderNumber = extractOrderNumber(message);
    
    // Call order-service to get real data!
    const order = await getOrderByNumber(orderNumber);
    
    return {
      text: `Order ${orderNumber} is ${order.status}`,
      quickReplies: ['Talk to farmer', 'Track another order'],
    };
    
  // ... more cases for each intent
}
```

**Quick Replies:** Notice those `quickReplies`? They appear as buttons in the chat UI so users can tap instead of typing!

**Where to find it:** [handlers.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/handlers.ts)

---

## 📁 File 4: `services.ts` - The Hands

**What it does:** Talks to other services to get real data.

**Think of it like:** When someone asks "where's my order?", the chatbot needs to actually look it up somewhere. The "hands" reach out to the order-service to grab that info.

**How it works:**

```typescript
// URLs of other services
const ORDER_SERVICE_URL = 'http://order-service:3004';
const DELIVERY_SERVICE_URL = 'http://delivery-service:3005';

// Get order details
export const getOrderByNumber = async (orderNumber: string) => {
  const response = await axios.get(
    `${ORDER_SERVICE_URL}/api/orders/number/${orderNumber}`
  );
  return response.data.data;  // Returns the actual order!
};

// Get delivery info
export const getDeliveryInfo = async (orderNumber: string) => {
  const response = await axios.get(
    `${DELIVERY_SERVICE_URL}/api/deliveries/order/${orderNumber}`
  );
  return response.data.data;  // Returns delivery status!
};
```

**Where to find it:** [services.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/services/chatbot-service/src/services.ts)

---

## 🔄 The Complete Journey

Let's trace what happens when you type "Track my order ORD-1234":

```
YOU: "Track my order ORD-1234"
     ↓
📁 index.ts receives the message
     ↓
📁 intents.ts checks: "ORD-1234" matches TRACK_ORDER pattern!
     Intent = TRACK_ORDER
     ↓
📁 handlers.ts sees TRACK_ORDER intent
     - Extracts "ORD-1234" from message
     - Calls services.ts to get order data
     ↓
📁 services.ts calls order-service API
     - GET http://order-service:3004/api/orders/number/ORD-1234
     - Returns: { status: 'shipped', total: 125.50, ... }
     ↓
📁 handlers.ts creates response:
     "Order ORD-1234 is Shipped! 📦"
     ↓
📁 index.ts sends response back to you
     ↓
YOU SEE: "Order ORD-1234 is Shipped! 📦"
         [Talk to farmer] [Track another order]
```

---

## 🎨 Different Looks for Different Users

The chatbot looks different depending on who's logged in!

**If you're a RESTAURANT:**
```
Welcome message: "I can help you track orders and find products"
Suggestions: [Track my order] [Talk to farmer]
```

**If you're a FARMER:**
```
Welcome message: "I can help you manage incoming orders"
Suggestions: [Show pending orders] [Talk to restaurant]
```

**If you're an INSPECTOR:**
```
Welcome message: "I can help you view violations and inspections"
Suggestions: [Show recent violations] [Upcoming inspections]
```

This is set up in the frontend file: [ChatWidget.tsx](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/frontend/src/components/shared/ChatWidget.tsx) (lines 52-95)

---

## 🌐 Two API Gateways - External vs Internal

We have TWO "doors" into our backend:

### 🚪 External Gateway (Port 4000) - For USERS

This is what the frontend talks to. It requires a JWT token (login).

```
Your Browser → External Gateway (4000) → Services
```

**Example:**
```
GET http://localhost:4000/api/orders   ← Needs your JWT token!
```

**Where:** [external-api-gateway/src/routes.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/external-api-gateway/src/routes.ts)

---

### 🔒 Internal Gateway (Port 4001) - For SERVICES

This is for services to talk to each other. It uses a service API key, not JWT.

```
Chatbot Service → Internal Gateway (4001) → Order Service
```

**Example:**
```
GET http://internal-gateway:4001/internal/orders   ← Needs service key!
```

**Where:** [internal-api-gateway/src/routes.ts](file:///Users/wolves/Desktop/Fall2025_WEBDEV_PROJECT/backend/gateways/internal-api-gateway/src/routes.ts)

---

### But Wait... The Chatbot Calls Services Directly!

In our current code, the chatbot actually calls services directly (no internal gateway):

```typescript
// In services.ts - direct call!
const response = await axios.get('http://order-service:3004/api/orders/...');
```

This works because all services are on the same Docker network. The internal gateway is there if we wanted **extra security** between services.

---

## 📡 Three Ways Services Talk to Each Other

### 1. Direct HTTP (What chatbot uses)
```
Chatbot → HTTP GET → Order Service → Response
```
**When to use:** You need data RIGHT NOW

### 2. Internal Gateway
```
Chatbot → Internal Gateway → Order Service → Response
```
**When to use:** You want centralized authentication

### 3. RabbitMQ Messages
```
Order Service → publishes "order.created" → RabbitMQ
                                                ↓
Notification Service ← subscribes ← "order.created"
Delivery Service ← subscribes ← "order.created"
```
**When to use:** You want to notify multiple services, don't need a response

---

## 📂 Quick File Lookup

| What You Need | File Location |
|---------------|---------------|
| Chatbot entry point | `backend/services/chatbot-service/src/index.ts` |
| Intent detection | `backend/services/chatbot-service/src/intents.ts` |
| Response generation | `backend/services/chatbot-service/src/handlers.ts` |
| Service calls | `backend/services/chatbot-service/src/services.ts` |
| Chat UI component | `frontend/src/components/shared/ChatWidget.tsx` |
| External Gateway | `backend/gateways/external-api-gateway/src/routes.ts` |
| Internal Gateway | `backend/gateways/internal-api-gateway/src/routes.ts` |

---

## 🎯 Key Takeaways

1. **Intent Detection** = Pattern matching with regex and keywords
2. **Handlers** = Switch statement that creates responses based on intent
3. **Services** = HTTP calls to other microservices for real data
4. **External Gateway** = For users (needs JWT token)
5. **Internal Gateway** = For services (needs service API key)
6. **Direct calls** = Services can also call each other directly on Docker network

---

*That's it! Now you understand how the chatbot works from start to finish. 🚀*



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
│                                                                          │
│  HOW IT WORKS:                                                           │
│  1. Check message against PATTERNS (regex)                               │
│  2. If no match, check for KEYWORDS                                      │
│  3. Returns the detected intent                                          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Generate Response                                               │
│  📁 chatbot-service/src/handlers.ts                                     │
│                                                                          │
│  switch (intent) {                                                       │
│    case TRACK_ORDER:                                                     │
│      // Extract order number "ORD-1234-5678"                            │
│      // Call order-service to get order details                         │
│      // Call delivery-service to get delivery status                    │
│      return formatted response                                           │
│  }                                                                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 7: Service-to-Service Calls (Internal Communication)              │
│  📁 chatbot-service/src/services.ts                                     │
│                                                                          │
│  // Chatbot calls order-service directly:                               │
│  const order = await axios.get('http://order-service:3004/api/orders'); │
│                                                                          │
│  // And delivery-service:                                                │
│  const delivery = await axios.get('http://delivery-service:3005/...');  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 8: Response sent back to frontend                                  │
│  📁 ChatWidget.tsx receives and displays the message                    │
│                                                                          │
│  "I found your order ORD-1234-5678!                                     │
│   Status: Being Prepared 📦                                              │
│   Delivery Status: In Transit 🚚                                         │
│   Expected Delivery: Monday, Dec 16, 2:00 PM"                           │
└─────────────────────────────────────────────────────────────────────────┘