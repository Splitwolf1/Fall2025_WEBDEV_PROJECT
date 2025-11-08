# 🚀 Farm-to-Table Smart Supply Chain - Development Roadmap

> **Project Goal**: Build a microservices-based supply chain platform connecting Farmers, Distributors, Restaurants, and Health Inspectors with a beautiful, intuitive UI.

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack Summary](#tech-stack-summary)
3. [Development Phases](#development-phases)
4. [Phase 1: Frontend Foundation & UI Design](#phase-1-frontend-foundation--ui-design)
5. [Phase 2: Core Backend Services](#phase-2-core-backend-services)
6. [Phase 3: Advanced Features](#phase-3-advanced-features)
7. [Phase 4: Testing & Deployment](#phase-4-testing--deployment)

---

## 🎯 Project Overview

### Core Entities
- **Farmers** - Produce suppliers managing inventory
- **Distributors** - Logistics & warehousing partners
- **Restaurants/Markets** - End customers placing orders
- **Health Inspectors** - Compliance & quality checks

### Key Features
- Real-time order tracking
- Inventory management
- Delivery logistics
- Health compliance monitoring
- AI Chatbot assistance
- Real-time notifications (Socket.io)
- Comment threads for custom orders

---

## 🛠️ Tech Stack Summary

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: React Query + Zustand
- **Real-time**: Socket.io Client
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js + Express/Fastify
- **Database**: MongoDB (per service)
- **Message Queue**: RabbitMQ
- **API Gateway**: NGINX
- **Service Discovery**: Consul
- **Real-time**: Socket.io Server
- **Containerization**: Docker + Docker Compose

---

## 📅 Development Phases

```
Phase 1: Frontend Foundation (Weeks 1-3)
Phase 2: Core Backend Services (Weeks 4-6)
Phase 3: Advanced Features (Weeks 7-9)
Phase 4: Testing & Deployment (Weeks 10-12)
```

---

# 🎨 PHASE 1: Frontend Foundation & UI Design
**Duration**: 3 Weeks
**Goal**: Create a stunning, user-friendly interface with complete page structure

## Week 1: Project Setup & Design System

### 1.1 Initialize Next.js Project
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install
```

### 1.2 Install Core Dependencies
```bash
# UI Components
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npx shadcn-ui@latest init

# State & API
npm install @tanstack/react-query axios zustand
npm install socket.io-client

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Charts & Visualization
npm install recharts

# Icons & Utils
npm install lucide-react date-fns
```

### 1.3 Setup Design System
Create a consistent design language:

**📁 File**: `frontend/src/lib/design-tokens.ts`
```typescript
export const colors = {
  primary: {
    50: '#f0fdf4',
    500: '#22c55e',  // Fresh green (farm theme)
    600: '#16a34a',
    700: '#15803d',
  },
  secondary: {
    500: '#f59e0b',  // Harvest orange
  },
  // ... more colors
}

export const spacing = {
  // Consistent spacing scale
}

export const typography = {
  // Font sizes, weights, line heights
}
```

**📁 File**: `frontend/tailwind.config.ts`
```typescript
// Custom Tailwind configuration with farm-to-table theme
// - Green primary colors (freshness, farm)
// - Orange accents (harvest, warmth)
// - Clean, modern typography
// - Smooth animations
```

### 1.4 Create Reusable Components
Install Shadcn components:
```bash
npx shadcn-ui@latest add button card input label
npx shadcn-ui@latest add dropdown-menu avatar badge
npx shadcn-ui@latest add dialog sheet tabs
npx shadcn-ui@latest add table select toast
npx shadcn-ui@latest add form checkbox radio-group
```

**Custom Components to Build**:
- `StatusBadge` - Order/delivery status indicators
- `ProductCard` - Display produce items
- `OrderTimeline` - Visual order progress
- `NotificationBell` - Real-time alerts
- `ChatWidget` - Chatbot interface
- `MapView` - Delivery tracking map
- `StatsCard` - Dashboard metrics

---

## Week 2: Authentication & Core Pages

### 2.1 Authentication UI

**📁 Pages to Create**:

#### `/app/(auth)/login/page.tsx`
```typescript
// Beautiful login page with:
// - Email/password fields
// - Role selection (Farmer, Distributor, Restaurant, Inspector)
// - "Remember me" option
// - Forgot password link
// - Sign up link
// Design: Split screen with farm imagery on left, form on right
```

**UI Features**:
- Animated gradient background
- Smooth form validation feedback
- Loading states with skeleton
- Success/error toast notifications

#### `/app/(auth)/register/page.tsx`
```typescript
// Multi-step registration:
// Step 1: Choose role (with icons & descriptions)
// Step 2: Basic info (name, email, password)
// Step 3: Role-specific info (farm location, business license, etc.)
// Step 4: Payment/subscription (if applicable)
```

**UI Design Principles**:
- Progressive disclosure (one step at a time)
- Clear progress indicator
- Easy navigation (back/next buttons)
- Inline validation with helpful messages

### 2.2 Role-Based Dashboard Layouts

Create 4 distinct dashboard layouts:

#### `/app/(dashboard)/farmer/layout.tsx`
```typescript
// Farmer-specific navigation:
// - Inventory Management
// - Incoming Orders
// - Delivery Schedule
// - Compliance Reports
// - Analytics
```

#### `/app/(dashboard)/distributor/layout.tsx`
```typescript
// Distributor navigation:
// - Active Deliveries
// - Route Planning
// - Pickup Schedule
// - Fleet Management
// - Performance Metrics
```

#### `/app/(dashboard)/restaurant/layout.tsx`
```typescript
// Restaurant navigation:
// - Browse Produce
// - My Orders
// - Delivery Tracking
// - Suppliers
// - Chat Support
```

#### `/app/(dashboard)/inspector/layout.tsx`
```typescript
// Inspector navigation:
// - Scheduled Inspections
// - Inspection History
// - Compliance Dashboard
// - Reports
// - Alerts
```

**Common Layout Features**:
- Responsive sidebar (collapsible on mobile)
- Top navigation with user profile
- Real-time notification bell
- Search functionality
- Quick actions menu

---

## Week 3: Feature Pages & Components

### 3.1 Farmer Dashboard Pages

#### `/app/(dashboard)/farmer/inventory/page.tsx`
**Purpose**: Manage produce listings

**UI Components**:
- **Product Grid/List Toggle**: Switch between card and table view
- **Add Product Button**: Opens modal/sheet form
- **Filter & Sort**: By category, price, stock status
- **Bulk Actions**: Update multiple items, export CSV

**Product Card Design**:
```
┌──────────────────────────────────┐
│  [Image]           [Edit] [•••]  │
│                                  │
│  Organic Tomatoes                │
│  $4.50/lb                        │
│  ⭐⭐⭐⭐⭐ (4.8)                  │
│  Stock: 150 lbs [●●●●●○] 75%    │
│  Fresh | Grade A                 │
└──────────────────────────────────┘
```

**Add/Edit Product Form**:
- Product name & category (dropdown)
- Price & unit ($/lb, $/kg, $/unit)
- Stock quantity
- Quality grade (A, B, C)
- Upload images (drag & drop)
- Description (rich text)
- Harvest date
- Certifications (Organic, Non-GMO, etc.)

#### `/app/(dashboard)/farmer/orders/page.tsx`
**Purpose**: View and manage incoming orders

**UI Features**:
- **Order Table** with columns:
  - Order ID
  - Restaurant name
  - Items & quantity
  - Total amount
  - Status badge
  - Pickup date/time
  - Actions (Accept/Reject/View)

- **Status Filter Tabs**:
  - All Orders
  - Pending (needs action)
  - Confirmed
  - Ready for Pickup
  - Completed

- **Order Detail Modal**:
  - Full order information
  - Customer contact
  - Special instructions
  - Timeline view
  - Accept/reject with reason

### 3.2 Restaurant Dashboard Pages

#### `/app/(dashboard)/restaurant/browse/page.tsx`
**Purpose**: Discover and order fresh produce

**UI Design**:
- **Hero Section**: Search bar + filter chips
- **Categories**: Visual cards (Vegetables, Fruits, Herbs, Dairy, etc.)
- **Product Grid**:
  - High-quality images
  - Farmer badge (name, location, rating)
  - Price comparison
  - Quick add to cart button
  - Favorite heart icon

**Advanced Filters**:
- Distance from restaurant
- Organic/conventional
- Price range slider
- Delivery availability
- Rating threshold
- Certification filters

**Shopping Cart (Slide-over)**:
- Line items with quantity adjusters
- Subtotal/tax/delivery fee
- Delivery date/time picker
- Special instructions textarea
- Checkout button

#### `/app/(dashboard)/restaurant/orders/page.tsx`
**Purpose**: Track current and past orders

**Order Tracking Card**:
```
┌────────────────────────────────────────┐
│ Order #12345                    [Chat] │
│ Green Valley Farm                      │
│                                        │
│ ○━━━━●━━━━○━━━━○━━━━○                 │
│ Placed  Confirmed  Pickup  Transit  Delivered │
│                                        │
│ 15 lbs Tomatoes, 10 lbs Lettuce       │
│ ETA: Today, 3:00 PM                   │
│ [Track on Map]         [Cancel Order]  │
└────────────────────────────────────────┘
```

**Live Map Integration**:
- Show delivery vehicle location (Socket.io)
- Estimated time of arrival
- Delivery route

### 3.3 Distributor Dashboard Pages

#### `/app/(dashboard)/distributor/deliveries/page.tsx`
**Purpose**: Manage active deliveries and routes

**Daily Route Planner**:
- **Map View**: Visual route with pins
  - Pickup locations (green pins)
  - Delivery locations (blue pins)
  - Current vehicle location (moving pin)

- **Route List View**:
  - Stop sequence with drag-to-reorder
  - Pickup time windows
  - Delivery time windows
  - Estimated drive time
  - Special handling notes

**Delivery Card**:
```
┌────────────────────────────────────────┐
│ 🚚 Route #789            [Start Route] │
│                                        │
│ 1. 📍 Green Valley Farm (Pickup)       │
│    Items: Tomatoes (50 lbs)            │
│    Time: 8:00 AM - 9:00 AM            │
│    ✓ Checked In                        │
│                                        │
│ 2. 📍 Fresh Bistro (Delivery)          │
│    Items: Tomatoes (15 lbs)            │
│    Time: 10:00 AM - 11:00 AM          │
│    ○ In Transit                        │
│                                        │
│ Status: On Time | 2/5 stops complete   │
└────────────────────────────────────────┘
```

**Check-in System**:
- QR code scanner (for contactless check-in)
- Photo upload (proof of delivery)
- Signature capture
- Condition notes

### 3.4 Health Inspector Pages

#### `/app/(dashboard)/inspector/inspections/page.tsx`
**Purpose**: Conduct and record compliance checks

**Inspection Form**:
- Farm/Distributor selection
- Produce batch ID
- Inspection type (Routine, Random, Complaint-based)
- Checklist items:
  - [ ] Temperature compliance
  - [ ] Cleanliness standards
  - [ ] Proper labeling
  - [ ] Documentation complete
  - [ ] Storage conditions
- Photo evidence upload
- Pass/Fail toggle
- Notes & recommendations
- Inspector signature

**Inspection History Table**:
- Searchable and filterable
- Export to PDF
- Violation tracking
- Follow-up scheduling

### 3.5 Shared Components

#### Chatbot Widget (`/components/chatbot.tsx`)
**Position**: Fixed bottom-right corner

**Features**:
- Greeting message with suggested questions
- Natural language input
- Quick reply buttons
- Order status lookup
- FAQ answers
- Live agent escalation
- Chat history

**Sample Interactions**:
```
User: "Where is my order #12345?"
Bot: "Your order is currently in transit!
     ETA: 2:30 PM. [View on Map]"

User: "What's the return policy?"
Bot: "We accept returns within 24 hours if
     produce doesn't meet quality standards..."
```

#### Notification Center (`/components/notifications.tsx`)
**Real-time updates via Socket.io**:

**Notification Types**:
- 🔔 New order received
- ✅ Order confirmed
- 🚚 Delivery dispatched
- 📦 Delivery completed
- ⚠️ Inspection scheduled
- ❌ Order cancelled
- 💬 New message

**UI Design**:
- Bell icon with badge count
- Dropdown panel with grouped notifications
- Mark as read/unread
- Clear all option
- Deep links to relevant pages

---

## 🎨 Design Guidelines & Best Practices

### Visual Design Principles

1. **Color Psychology**:
   - **Green**: Fresh, organic, growth (primary)
   - **Orange**: Energy, harvest, warmth (accent)
   - **Blue**: Trust, professionalism (distributor/logistics)
   - **Red**: Alerts, urgent actions
   - **Yellow**: Warnings, attention needed

2. **Typography**:
   - **Headings**: Inter/Poppins (bold, clear)
   - **Body**: Inter (readable, modern)
   - **Numbers**: Tabular numbers for alignment
   - **Hierarchy**: Clear size differentiation

3. **Spacing & Layout**:
   - Consistent 8px grid system
   - Generous whitespace
   - Card-based layouts
   - Clear visual grouping

4. **Imagery**:
   - High-quality produce photos
   - Farm landscape backgrounds
   - Authentic, not stock-photo feel
   - Consistent aspect ratios

### UX Patterns

1. **Loading States**:
   - Skeleton screens (not spinners)
   - Progressive loading
   - Optimistic UI updates

2. **Empty States**:
   - Helpful illustrations
   - Clear call-to-action
   - Sample data option

3. **Error Handling**:
   - Friendly error messages
   - Actionable recovery steps
   - Never blame the user

4. **Mobile-First**:
   - Touch-friendly tap targets (44px min)
   - Bottom navigation on mobile
   - Swipe gestures
   - Responsive tables (horizontal scroll or cards)

5. **Accessibility**:
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader support
   - High contrast mode
   - Focus indicators

---

## 📁 Frontend Folder Structure

```
frontend/
├── public/
│   ├── images/
│   │   ├── categories/      # Produce category icons
│   │   ├── placeholders/    # Default product images
│   │   └── backgrounds/     # Hero/auth page backgrounds
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── farmer/
│   │   │   │   ├── inventory/
│   │   │   │   ├── orders/
│   │   │   │   ├── deliveries/
│   │   │   │   └── analytics/
│   │   │   ├── distributor/
│   │   │   │   ├── deliveries/
│   │   │   │   ├── routes/
│   │   │   │   └── fleet/
│   │   │   ├── restaurant/
│   │   │   │   ├── browse/
│   │   │   │   ├── orders/
│   │   │   │   ├── tracking/
│   │   │   │   └── suppliers/
│   │   │   └── inspector/
│   │   │       ├── inspections/
│   │   │       ├── schedule/
│   │   │       └── reports/
│   │   ├── api/              # Next.js API routes (proxy)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # Shadcn components
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── farmer/
│   │   ├── distributor/
│   │   ├── restaurant/
│   │   ├── inspector/
│   │   ├── shared/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── OrderTimeline.tsx
│   │   └── charts/
│   ├── lib/
│   │   ├── api/              # API client functions
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helper functions
│   │   ├── validations/      # Zod schemas
│   │   ├── constants/        # App constants
│   │   └── design-tokens.ts
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   └── notificationStore.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── delivery.ts
│   └── styles/
│       └── globals.css
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## ✅ Phase 1 Deliverables Checklist

### Week 1
- [ ] Next.js project initialized with TypeScript
- [ ] Tailwind CSS + Shadcn/UI configured
- [ ] Design tokens defined (colors, spacing, typography)
- [ ] Core dependencies installed
- [ ] Custom theme applied
- [ ] Reusable component library started (10+ components)

### Week 2
- [ ] Login page completed (responsive, validated)
- [ ] Registration flow completed (multi-step)
- [ ] 4 dashboard layouts created (one per role)
- [ ] Navigation menus implemented
- [ ] Authentication context/store setup
- [ ] Protected route middleware

### Week 3
- [ ] Farmer pages: Inventory, Orders (UI complete)
- [ ] Restaurant pages: Browse, Orders, Tracking
- [ ] Distributor pages: Deliveries, Routes
- [ ] Inspector pages: Inspections, Reports
- [ ] Chatbot widget implemented
- [ ] Notification center completed
- [ ] All pages responsive (mobile, tablet, desktop)
- [ ] Loading/empty/error states for all pages

---

## 🎯 Success Metrics for Phase 1

- **Visual Quality**: UI looks professional and polished
- **Responsiveness**: Works on all screen sizes (320px - 4K)
- **Performance**: Lighthouse score >90
- **Accessibility**: No critical a11y violations
- **Code Quality**: TypeScript strict mode, ESLint clean
- **Component Reusability**: <10% duplicate code

---

## 🔄 What's Next?

After Phase 1 completion, we'll have a **fully functional frontend** with mock data. This allows:
1. **Early user testing** and feedback
2. **Parallel backend development**
3. **Design refinement** before backend integration
4. **Demo-ready prototype** for stakeholders

**Phase 2** will focus on building the backend microservices to power these beautiful UIs!

---

## 📚 Additional Resources

### Design Inspiration
- [Dribbble - Farm & Agriculture](https://dribbble.com/search/farm-app)
- [Behance - Supply Chain Dashboards](https://www.behance.net/search/projects?search=supply%20chain)
- [Mobbin - E-commerce Flows](https://mobbin.com/)

### Component Libraries
- [Shadcn/UI Documentation](https://ui.shadcn.com/)
- [Tailwind UI Components](https://tailwindui.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)

### Learning Resources
- [Next.js 14 App Router](https://nextjs.org/docs)
- [React Query Best Practices](https://tanstack.com/query/latest)
- [TypeScript Patterns](https://www.typescriptlang.org/docs/)

---

**Next Document**: [PHASE_2_BACKEND_ROADMAP.md](./PHASE_2_BACKEND_ROADMAP.md)
