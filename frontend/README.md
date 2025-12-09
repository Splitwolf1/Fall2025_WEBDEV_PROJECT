# Farm2Table - Frontend Documentation

## 🎯 Overview

Modern Next.js 16 + React 19 frontend for the Farm2Table platform.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

**Access:** http://localhost:3000

---

## 📦 Tech Stack

- **Framework:** Next.js 16.0.8 (App Router)
- **React:** 19.2.0
- **UI Library:** Radix UI primitives
- **Styling:** Tailwind CSS 4
- **Forms:** React Hook Form + Zod validation
- **State:** Zustand
- **Data Fetching:** TanStack Query
- **Real-time:** Socket.io-client
- **Charts:** Recharts
- **Notifications:** Sonner (toast)

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/              # App Router pages
│   │   ├── (auth)/       # Auth layouts
│   │   ├── (dashboard)/  # Protected routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   │
│   ├── components/       # UI Components
│   │   ├── ui/          # Radix UI components
│   │   ├── layout/      # Layout components
│   │   └── features/    # Feature-specific components
│   │
│   ├── hooks/           # Custom Hooks
│   │   ├── useNotifications.ts
│   │   ├── useAuth.ts
│   │   └── useSocket.ts
│   │
│   ├── lib/             # Utilities
│   │   ├── api-client.ts    # API wrapper
│   │   ├── socket-client.ts # Socket.io wrapper
│   │   ├── auth.ts          # Auth helpers
│   │   └── utils.ts         # Common utilities
│   │
│   └── types/           # TypeScript types
│
├── public/              # Static assets
├── .env.local           # Environment variables
└── package.json
```

---

## 🔧 Configuration

### **Environment Variables:**

Create `.env.local`:
```env
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_NOTIFICATION_URL=http://localhost:3007

# Optional: Analytics, etc.
```

---

## 🎨 Components

### **UI Components (Radix UI):**
- Avatar
- Button
- Checkbox
- Dialog
- Dropdown Menu
- Input
- Label
- Select
- Toast (Sonner)
- Tabs
- Switch
- And more...

All styled with Tailwind CSS.

### **Custom Hooks:**

#### **useNotifications:**
```tsx
import { useNotifications } from '@/hooks/useNotifications';

const { notifications, unreadCount, isConnected, markAsRead } = useNotifications();
```

#### ** useAuth:**
```tsx
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated, login, logout } = useAuth();
```

---

## 🔗 API Integration

### **API Client:**

Located at `src/lib/api-client.ts`:

```tsx
import { apiClient } from '@/lib/api-client';

// Authentication
await apiClient.login(email, password);
await apiClient.register(userData);

// Products
const products = await apiClient.getProducts();
const product = await apiClient.getProduct(id);

// Orders
const orders = await apiClient.getOrders();
await apiClient.createOrder(orderData);

// Notifications
await apiClient.sendNotification(userId, notification);
```

### **API Endpoints:**

All requests go through External Gateway (port 4000):
- `/api/auth/*` → Auth Service
- `/api/users/*` → User Service
- `/api/products/*` → Product Service
- `/api/orders/*` → Order Service
- `/api/deliveries/*` → Delivery Service
- `/api/inspections/*` → Health Service
- `/api/chat/*` → Chatbot Service

---

## 📬 Real-time Notifications

### **Socket.io Integration:**

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notifications, unreadCount, isConnected } = useNotifications();
  
  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notif => (
        <div key={notif._id}>{notif.message}</div>
      ))}
    </div>
  );
}
```

Notifications appear as:
1. **Toast notifications** (Sonner)
2. **In-app notification list**
3. **Browser notifications** (if permitted)

---

## 🎯 Features

### **Authentication:**
- Register with role selection
- Email/password login
- JWT token management
- Protected routes
- Role-based access

### **Dashboard:**
- Role-specific views
- Real-time data
- Charts and analytics
- Notification center

### **Products:**
- Browse catalog
- Search and filter
- Product details
- Add to cart

### **Orders:**
- Order creation
- Order tracking
- Status updates
- Rating system

### **Deliveries:**
- Real-time tracking
- Status updates
- Fleet management (Distributors)

### **Notifications:**
- Real-time Socket.io
- Email notifications
- Toast notifications
- Notification history

---

## 🧪 Development

### **Running Dev Server:**
```bash
npm run dev
```

Hot reload enabled - changes appear instantly!

### **Linting:**
```bash
npm run lint
```

### **Building:**
```bash
npm run build
npm start
```

---

## 📝 Adding New Features

### **1. Create New Page:**
```tsx
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

### **2. Create Component:**
```tsx
// src/components/features/MyComponent.tsx
export function MyComponent() {
  return <div>My Component</div>;
}
```

### **3. Add API Endpoint:**
```tsx
// In src/lib/api-client.ts
async getMyData() {
  return this.request('/api/my-endpoint');
}
```

---

## 🐛 Troubleshooting

### **API Not Connecting:**
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify backend is running on port 4000
- Check browser console for errors

### **Notifications Not Working:**
- Check Socket.io connection status
- Verify notification service is running (port 3007)
- Check browser console for Socket.io errors

### **Build Errors:**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

---

## 🚀 Deployment

### **Production Build:**
```bash
npm run build
npm start
```

### **Environment Variables:**
Set production API URL:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_NOTIFICATION_URL=https://notifications.yourdomain.com
```

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix U](https://www.radix-ui.com)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)

---

**Last Updated:** December 2025  
**Version:** 2.0
