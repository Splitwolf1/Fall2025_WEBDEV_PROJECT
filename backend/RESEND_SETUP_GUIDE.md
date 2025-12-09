# Resend Email Integration Setup Guide

## 🎉 Backend Implementation Complete!

The dual notification system (browser + email) has been implemented in the backend.

---

## ✅ What's Been Done

### **Backend:**
1. ✅ Installed `resend` package in notification-service
2. ✅ Created `email-service.ts` with email templates for:
   - Order confirmations
   - Order status updates
   - Delivery updates
   - Inspection notifications
3. ✅ Integrated email sending into all notification handlers
4. ✅ Updated `docker-compose.yml` with `RESEND_API_KEY` environment variable

### **Frontend:**
- ✅ Notification hook already exists (`useNotifications.ts`)
- ✅ Socket.io client already implemented

---

## 🔑 Next Steps: Get Your Resend API Key

### **1. Sign up for Resend:**
- Go to https://resend.com
- Sign up for free account (100 emails/day)

### **2. Get API Key:**
- Go to dashboard → API Keys
- Create new API key
- Copy the key (starts with `re_...`)

### **3. Add to Environment:**

**Option A: Docker (Production)**
```bash
# Create .env file in backend directory
cd backend
echo "" > .env
```

**Option B: Direct Export (Testing)**
```bash
export RESEND_API_KEY=re_your_api_key_here
```

### **4. Restart Service:**
```bash
cd backend
docker-compose restart notification-service

# Or rebuild if needed
docker-compose up --build notification-service
```

---

## 🧪 Testing

### **Test Email Sending:**
```bash
curl -X POST http://localhost:3007/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "type": "order",
    "title": "Test Order",
    "message": "This is a test notification"
  }'
```

This will:
- ✅ Send browser notification (if Socket.io connected)
- ✅ NOT send email (no customerEmail in test data)

### **Test with Email:**
To trigger actual email, you need:
- Real order creation with `customerEmail` field
- Or modify the test endpoint to accept email parameter

---

## 📧 Email Templates

All emails use Resend's test domain: `noreply@resend.dev`

**Available templates:**
1. `sendOrderConfirmation()` - New order placed
2. `sendOrderStatusUpdate()` - Order status changed  
3. `sendDeliveryUpdate()` - Delivery status changed
4. `sendInspectionNotification()` - Inspection scheduled
5. `sendGenericNotification()` - Generic notification

---

## 🎨 Frontend Integration

Your frontend already has:
- ✅ `useNotifications()` hook
- ✅ Socket.io client
- ✅ Toast notifications (sonner)

**To use notifications in any component:**
```tsx
import { useNotifications } from '@/hooks/useNotifications';

export function MyComponent() {
  const { notifications, unreadCount, isConnected } = useNotifications();
  
  return (
    <div>
      <p>Connected: {isConnected ? '✅' : '❌'}</p>
      <p>Unread: {unreadCount}</p>
    </div>
  );
}
```

---

## 🔄 Upgrade to Custom Domain (Later)

When ready for production:
1. Add DNS records in your domain provider
2. Verify domain in Resend dashboard
3. Update `fromEmail` in `email-service.ts`:
   ```typescript
   private fromEmail = 'Farm2Table <noreply@yourdomain.com>';
   ```

---

## 📝 Event Data Requirements

For emails to send, events must include email field:
- `customerEmail` - for order/delivery notifications
- `targetEmail` - for inspection notifications
- `inspectorEmail` - for inspector notifications

**Example event:**
```json
{
  "type": "order.created",
  "orderNumber": "ORD-001",
  "customerId": "user123",
  "customerEmail": "customer@example.com",
  "total": 25.99,
  "farmerId": "farmer456"
}
```

---

## ⚡ Quick Summary

**Backend:** ✅ Complete and ready  
**Frontend:** ✅ Already has notification UI  
**Next Step:** Get Resend API key to enable emails!

Once you add the API key, the system will automatically send emails for all order, delivery, and inspection events! 🚀
