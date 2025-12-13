# 📂 Farm-to-Table Project Structure

## Complete Folder Hierarchy

```
Fall2025_WEBDEV_PROJECT/
│
├── 📄 README.md
├── 📄 COMPLETE_PROJECT_ROADMAP.md
├── 📄 DEVELOPMENT_ROADMAP.md (Phase 1 Details)
├── 📄 PROJECT_STRUCTURE.md (this file)
├── 📄 QUICK_START_GUIDE.md
│
├── 🎨 frontend/                         # Next.js Frontend Application
│   ├── public/
│   │   ├── images/
│   │   │   ├── categories/              # Vegetable, fruit icons
│   │   │   ├── placeholders/            # Default product images
│   │   │   └── backgrounds/             # Hero section images
│   │   └── fonts/
│   │
│   ├── src/
│   │   ├── app/                         # Next.js 14 App Router
│   │   │   ├── (auth)/                  # Auth routes group
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── (dashboard)/             # Protected routes
│   │   │   │   │
│   │   │   │   ├── farmer/              # 👨‍🌾 Farmer Dashboard
│   │   │   │   │   ├── layout.tsx       # Farmer-specific layout
│   │   │   │   │   ├── page.tsx         # Farmer home/overview
│   │   │   │   │   ├── inventory/
│   │   │   │   │   │   ├── page.tsx     # Product listings
│   │   │   │   │   │   └── [id]/        # Edit product
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── page.tsx     # Order list
│   │   │   │   │   │   └── [id]/        # Order details
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── deliveries/
│   │   │   │   │   │   └── page.tsx     # Pickup schedule
│   │   │   │   │   └── analytics/
│   │   │   │   │       └── page.tsx     # Sales dashboard
│   │   │   │   │
│   │   │   │   ├── distributor/         # 🚚 Distributor Dashboard
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── deliveries/
│   │   │   │   │   │   ├── page.tsx     # Active deliveries
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx # Delivery details
│   │   │   │   │   ├── routes/
│   │   │   │   │   │   └── page.tsx     # Route planning
│   │   │   │   │   ├── fleet/
│   │   │   │   │   │   └── page.tsx     # Vehicle management
│   │   │   │   │   └── earnings/
│   │   │   │   │       └── page.tsx     # Financial overview
│   │   │   │   │
│   │   │   │   ├── restaurant/          # 🍽️ Restaurant Dashboard
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── browse/
│   │   │   │   │   │   ├── page.tsx     # Product catalog
│   │   │   │   │   │   └── [id]/        # Product details
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── page.tsx     # Order history
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx # Track order
│   │   │   │   │   ├── cart/
│   │   │   │   │   │   └── page.tsx     # Shopping cart
│   │   │   │   │   ├── suppliers/
│   │   │   │   │   │   └── page.tsx     # Favorite farms
│   │   │   │   │   └── tracking/
│   │   │   │   │       └── page.tsx     # Live delivery map
│   │   │   │   │
│   │   │   │   └── inspector/           # 🔍 Health Inspector
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       ├── inspections/
│   │   │   │       │   ├── page.tsx     # Inspection list
│   │   │   │       │   ├── new/
│   │   │   │       │   │   └── page.tsx # Create inspection
│   │   │   │       │   └── [id]/
│   │   │   │       │       └── page.tsx # View/edit
│   │   │   │       ├── schedule/
│   │   │   │       │   └── page.tsx     # Calendar
│   │   │   │       └── reports/
│   │   │   │           └── page.tsx     # Compliance reports
│   │   │   │
│   │   │   ├── api/                     # Next.js API Routes (Proxy)
│   │   │   │   ├── auth/
│   │   │   │   ├── products/
│   │   │   │   └── orders/
│   │   │   │
│   │   │   ├── layout.tsx               # Root layout
│   │   │   ├── page.tsx                 # Landing page
│   │   │   ├── globals.css              # Global styles
│   │   │   └── providers.tsx            # React Query, Auth context
│   │   │
│   │   ├── components/                  # React Components
│   │   │   │
│   │   │   ├── ui/                      # Shadcn/UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   └── ... (30+ components)
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   │
│   │   │   ├── farmer/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   ├── OrderList.tsx
│   │   │   │   └── SalesChart.tsx
│   │   │   │
│   │   │   ├── distributor/
│   │   │   │   ├── DeliveryCard.tsx
│   │   │   │   ├── RouteMap.tsx
│   │   │   │   ├── CheckInForm.tsx
│   │   │   │   └── FleetStatus.tsx
│   │   │   │
│   │   │   ├── restaurant/
│   │   │   │   ├── ProductGrid.tsx
│   │   │   │   ├── CartSidebar.tsx
│   │   │   │   ├── OrderTimeline.tsx
│   │   │   │   └── LiveTrackingMap.tsx
│   │   │   │
│   │   │   ├── inspector/
│   │   │   │   ├── InspectionForm.tsx
│   │   │   │   ├── ChecklistItem.tsx
│   │   │   │   └── ComplianceReport.tsx
│   │   │   │
│   │   │   ├── shared/                  # Shared components
│   │   │   │   ├── Navbar.tsx           # Top navigation
│   │   │   │   ├── Sidebar.tsx          # Dashboard sidebar
│   │   │   │   ├── NotificationBell.tsx # Real-time alerts
│   │   │   │   ├── ChatWidget.tsx       # Chatbot interface
│   │   │   │   ├── StatusBadge.tsx      # Order status pills
│   │   │   │   ├── OrderTimeline.tsx    # Progress tracker
│   │   │   │   ├── EmptyState.tsx       # No data placeholder
│   │   │   │   ├── LoadingSkeleton.tsx  # Loading UI
│   │   │   │   └── ErrorBoundary.tsx    # Error handling
│   │   │   │
│   │   │   └── charts/                  # Analytics components
│   │   │       ├── LineChart.tsx
│   │   │       ├── BarChart.tsx
│   │   │       ├── PieChart.tsx
│   │   │       └── StatsCard.tsx
│   │   │
│   │   ├── lib/                         # Utilities
│   │   │   ├── api/                     # API client
│   │   │   │   ├── client.ts            # Axios instance
│   │   │   │   ├── auth.ts              # Auth endpoints
│   │   │   │   ├── products.ts          # Product endpoints
│   │   │   │   ├── orders.ts            # Order endpoints
│   │   │   │   └── deliveries.ts        # Delivery endpoints
│   │   │   │
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useProducts.ts
│   │   │   │   ├── useOrders.ts
│   │   │   │   ├── useNotifications.ts
│   │   │   │   ├── useSocket.ts
│   │   │   │   └── useCart.ts
│   │   │   │
│   │   │   ├── validations/             # Zod schemas
│   │   │   │   ├── auth.ts
│   │   │   │   ├── product.ts
│   │   │   │   └── order.ts
│   │   │   │
│   │   │   ├── utils/                   # Helper functions
│   │   │   │   ├── formatters.ts        # Date, currency formatters
│   │   │   │   ├── validators.ts        # Input validation
│   │   │   │   └── helpers.ts           # Misc utilities
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   ├── routes.ts            # Route paths
│   │   │   │   ├── statuses.ts          # Status enums
│   │   │   │   └── config.ts            # App config
│   │   │   │
│   │   │   └── design-tokens.ts         # Design system
│   │   │
│   │   ├── stores/                      # Zustand state stores
│   │   │   ├── authStore.ts             # Auth state
│   │   │   ├── cartStore.ts             # Shopping cart
│   │   │   ├── notificationStore.ts     # Notifications
│   │   │   └── uiStore.ts               # UI state (modals, etc.)
│   │   │
│   │   ├── types/                       # TypeScript types
│   │   │   ├── user.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── delivery.ts
│   │   │   └── inspection.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── .env.local                       # Local env variables
│   ├── .env.production                  # Production env
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── README.md
│
│
├── 🔧 backend/                          # Microservices Backend
│   │
│   ├── shared/                          # Shared utilities
│   │   ├── database.ts                  # MongoDB connection
│   │   ├── rabbitmq.ts                  # RabbitMQ client
│   │   ├── consul.ts                    # Service discovery
│   │   ├── auth.ts                      # JWT middleware
│   │   ├── logger.ts                    # Winston logger
│   │   └── types.ts                     # Shared types
│   │
│   ├── api-gateway/                     # 🚪 API Gateway
│   │   ├── src/
│   │   │   ├── index.ts                 # Entry point
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts              # Proxy to user service
│   │   │   │   ├── products.ts          # Proxy to product service
│   │   │   │   ├── orders.ts            # Proxy to order service
│   │   │   │   └── deliveries.ts        # Proxy to delivery service
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts              # JWT validation
│   │   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   │   └── cors.ts              # CORS config
│   │   │   └── discovery.ts             # Service discovery
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── services/
│   │   │
│   │   ├── user-service/                # 👤 User & Auth Service
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── User.ts
│   │   │   │   ├── routes/
│   │   │   │   │   ├── auth.ts          # Login, register
│   │   │   │   │   ├── users.ts         # Profile CRUD
│   │   │   │   │   └── roles.ts         # Role management
│   │   │   │   ├── controllers/
│   │   │   │   │   └── authController.ts
│   │   │   │   ├── middleware/
│   │   │   │   │   └── authMiddleware.ts
│   │   │   │   └── services/
│   │   │   │       └── emailService.ts  # Email verification
│   │   │   ├── tests/
│   │   │   │   └── auth.test.ts
│   │   │   ├── Dockerfile
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   ├── product-service/             # 🌽 Product Catalog
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── Product.ts
│   │   │   │   │   └── Category.ts
│   │   │   │   ├── routes/
│   │   │   │   │   ├── products.ts
│   │   │   │   │   └── categories.ts
│   │   │   │   ├── controllers/
│   │   │   │   │   └── productController.ts
│   │   │   │   └── services/
│   │   │   │       ├── searchService.ts # Full-text search
│   │   │   │       └── imageService.ts  # Image upload
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   ├── order-service/               # 📦 Order Management
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── Order.ts
│   │   │   │   ├── routes/
│   │   │   │   │   └── orders.ts
│   │   │   │   ├── controllers/
│   │   │   │   │   └── orderController.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── orderService.ts
│   │   │   │   └── events/              # RabbitMQ events
│   │   │   │       ├── publishers.ts    # Publish events
│   │   │   │       └── subscribers.ts   # Listen to events
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   ├── delivery-service/            # 🚚 Delivery Tracking
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models/
│   │   │   │   │   └── Delivery.ts
│   │   │   │   ├── routes/
│   │   │   │   │   └── deliveries.ts
│   │   │   │   ├── controllers/
│   │   │   │   │   └── deliveryController.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── routeService.ts  # Route optimization
│   │   │   │   │   └── gpsService.ts    # Location tracking
│   │   │   │   └── events/
│   │   │   │       ├── publishers.ts
│   │   │   │       └── subscribers.ts
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   ├── health-service/              # 🔍 Health Compliance
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── Inspection.ts
│   │   │   │   │   └── CheckIn.ts
│   │   │   │   ├── routes/
│   │   │   │   │   ├── inspections.ts
│   │   │   │   │   └── checkins.ts
│   │   │   │   ├── controllers/
│   │   │   │   │   └── inspectionController.ts
│   │   │   │   └── services/
│   │   │   │       └── reportService.ts # Generate reports
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   ├── notification-service/        # 🔔 Notifications
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── socket.ts            # Socket.io server
│   │   │   │   ├── models/
│   │   │   │   │   └── Notification.ts
│   │   │   │   ├── routes/
│   │   │   │   │   └── notifications.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── emailService.ts  # SendGrid
│   │   │   │   │   ├── smsService.ts    # Twilio
│   │   │   │   │   └── pushService.ts   # Push notifications
│   │   │   │   └── events/
│   │   │   │       └── subscribers.ts   # Listen to all events
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   ├── chatbot-service/             # 🤖 AI Chatbot
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── models/
│   │   │   │   │   ├── Conversation.ts
│   │   │   │   │   └── Message.ts
│   │   │   │   ├── routes/
│   │   │   │   │   └── chat.ts
│   │   │   │   ├── nlp/
│   │   │   │   │   ├── intentDetection.ts
│   │   │   │   │   └── responseGenerator.ts
│   │   │   │   └── services/
│   │   │   │       ├── orderLookup.ts   # Query order service
│   │   │   │       └── faqService.ts    # FAQ database
│   │   │   ├── tests/
│   │   │   ├── Dockerfile
│   │   │   └── package.json
│   │   │
│   │   └── analytics-service/           # 📊 Analytics (Optional)
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── routes/
│   │       │   │   └── analytics.ts
│   │       │   └── aggregations/
│   │       │       ├── sales.ts
│   │       │       ├── performance.ts
│   │       │       └── trends.ts
│   │       ├── Dockerfile
│   │       └── package.json
│   │
│   ├── docker-compose.yml               # Local development
│   ├── docker-compose.prod.yml          # Production
│   └── README.md
│
│
├── 📚 docs/                             # Documentation
│   ├── architecture/
│   │   ├── system-design.md
│   │   ├── database-schema.md
│   │   ├── api-documentation.md
│   │   └── event-flow.md
│   ├── deployment/
│   │   ├── aws-deployment.md
│   │   ├── digitalocean-deployment.md
│   │   └── kubernetes-guide.md
│   ├── user-guides/
│   │   ├── farmer-guide.md
│   │   ├── restaurant-guide.md
│   │   ├── distributor-guide.md
│   │   └── inspector-guide.md
│   └── development/
│       ├── getting-started.md
│       ├── contributing.md
│       └── code-style.md
│
│
├── 🧪 tests/                            # E2E & Integration tests
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── ordering.spec.ts
│   │   └── delivery.spec.ts
│   ├── integration/
│   │   ├── order-flow.test.ts
│   │   └── rabbitmq.test.ts
│   └── playwright.config.ts
│
│
├── 🚀 deployment/                       # Deployment configs
│   ├── kubernetes/
│   │   ├── deployments/
│   │   ├── services/
│   │   └── ingress.yaml
│   ├── terraform/                       # Infrastructure as Code
│   │   ├── aws/
│   │   └── digitalocean/
│   └── scripts/
│       ├── deploy.sh
│       └── rollback.sh
│
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       ├── backend-ci.yml
│       └── deploy.yml
│
├── .gitignore
├── .prettierrc
├── .eslintrc.json
└── README.md                            # Main project README
```

---

## 🎯 Key Directories Explained

### Frontend (`/frontend`)
- **`/app`**: Next.js 14 App Router pages
- **`/components`**: Reusable React components
- **`/lib`**: Utilities, API clients, hooks
- **`/stores`**: Zustand state management
- **`/types`**: TypeScript type definitions

### Backend (`/backend`)
- **`/shared`**: Code shared across all microservices
- **`/api-gateway`**: Single entry point for all requests
- **`/services`**: 9 independent microservices
  - Each service has its own database
  - Each service can scale independently

### Documentation (`/docs`)
- Architecture diagrams
- API documentation
- Deployment guides
- User manuals

### Tests (`/tests`)
- E2E tests (Playwright/Cypress)
- Integration tests (cross-service)
- Unit tests (within each service)

---

## 🔄 Data Flow Example

```
Restaurant places order
  ↓
Frontend (Next.js)
  ↓
API Gateway (port 3000)
  ↓
Order Service (port 3003)
  ↓
[Saves to MongoDB + Publishes to RabbitMQ]
  ↓
RabbitMQ Event: "order.created"
  ↓
├─→ Notification Service → Sends email/push to farmer
├─→ Delivery Service → Creates delivery record
└─→ Product Service → Updates stock quantity
  ↓
Notification Service → Socket.io
  ↓
Frontend receives real-time update
```

---

## 📊 Service Port Mapping

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js app |
| API Gateway | 3000 | Request routing |
| User Service | 3001 | Auth & users |
| Product Service | 3002 | Inventory |
| Order Service | 3003 | Orders |
| Delivery Service | 3004 | Logistics |
| Health Service | 3005 | Inspections |
| Notification Service | 3006 | Alerts + Socket.io |
| Chatbot Service | 3007 | AI Assistant |
| Analytics Service | 3008 | Reports |
| RabbitMQ | 5672 | Message queue |
| RabbitMQ UI | 15672 | Admin interface |
| Consul | 8500 | Service discovery |
| MongoDB (users) | 27017 | User database |
| MongoDB (products) | 27018 | Product database |
| MongoDB (orders) | 27019 | Order database |

---

## 🗃️ Database Collections

### User Service DB
- `users` - User accounts & profiles
- `sessions` - Active sessions (optional)

### Product Service DB
- `products` - Product catalog
- `categories` - Product categories
- `reviews` - Product ratings

### Order Service DB
- `orders` - All orders
- `order_items` - Order line items

### Delivery Service DB
- `deliveries` - Delivery records
- `routes` - Delivery routes
- `drivers` - Driver information

### Health Service DB
- `inspections` - Inspection records
- `checkins` - Check-in logs
- `violations` - Compliance violations

### Notification Service DB
- `notifications` - Notification history
- `preferences` - User notification settings

### Chatbot Service DB
- `conversations` - Chat histories
- `messages` - Individual messages
- `intents` - Training data

---

## 🎨 Design System Structure

```
frontend/src/lib/design-tokens.ts
├── colors
│   ├── primary (green - farm theme)
│   ├── secondary (orange - harvest)
│   ├── accent
│   ├── neutral
│   └── semantic (success, error, warning)
├── typography
│   ├── fontFamily
│   ├── fontSize
│   ├── fontWeight
│   └── lineHeight
├── spacing (8px grid)
├── borderRadius
├── shadows
└── animations
```

---

## 🔐 Environment Variables

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3006
NEXT_PUBLIC_GOOGLE_MAPS_KEY=xxx
```

### Backend Services
```bash
NODE_ENV=development
PORT=3001
MONGO_URI=mongodb://localhost:27017/dbname
RABBITMQ_URL=amqp://localhost:5672
CONSUL_HOST=localhost
CONSUL_PORT=8500
JWT_SECRET=your-secret-key
```

---

## 📦 NPM Scripts

### Frontend
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "type-check": "tsc --noEmit"
}
```

### Backend Services
```json
{
  "dev": "nodemon src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "jest",
  "test:watch": "jest --watch"
}
```

---

This structure ensures:
✅ **Separation of Concerns**: Each service has clear responsibilities
✅ **Scalability**: Services can scale independently
✅ **Maintainability**: Organized codebase easy to navigate
✅ **Testability**: Tests organized by type
✅ **Documentation**: Comprehensive docs for all stakeholders
