# 🚀 Getting Started with Farm2Table

Welcome to Farm2Table - a microservices-based platform connecting farms to tables!

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Docker Desktop** installed and running
- ✅ **Node.js** 18+ and npm
- ✅ **Git** for version control
- ✅ **8GB+ RAM** for running all containers

---

## 🎯 Quick Start (5 Minutes)

### **1. Clone & Navigate:**
```bash
git clone <repository-url>
cd Fall2025_WEBDEV_PROJECT
```

### **2. Start Backend:**
```bash
cd backend
docker-compose up
```

Wait for all services to start (~30 seconds). You should see:
```
✅ Auth Service running on port 3001
✅ User Service running on port 3002
✅ Product Service running on port 3003
... (8 services total)
```

### **3. Start Frontend (New Terminal):**
```bash
cd frontend
npm install
npm run dev
```

### **4. Access the App:**
- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:4000
- **RabbitMQ UI:** http://localhost:15672 (farm2table / secret)

---

## 🏗️ Architecture Overview

### **Frontend:**
- **Framework:** Next.js 16 + React 19
- **Port:** 3000
- **UI Library:** Radix UI + Tailwind CSS 4
- **State:** Zustand + TanStack Query

### **Backend:**
- **Pattern:** Dual Gateway Microservices
- **Services:** 10 total (8 microservices + 2 gateways)
- **Database:** MongoDB (9 instances)
- **Message Broker:** RabbitMQ
- **Email:** Resend

---

## 🔧 Configuration

### **Optional: Email Notifications**

To enable email notifications:

1. **Get Resend API Key:**
   - Sign up at https://resend.com
   - Copy your API key

2. **Set Environment Variable:**
```bash
# In backend directory
echo "RESEND_API_KEY=re_your_key_here" > .env

# Or export directly
export RESEND_API_KEY=re_your_key_here
```

3. **Restart Notification Service:**
```bash
docker-compose restart notification-service
```

---

## 📱 Using the Application

### **1. Register an Account:**
- Navigate to http://localhost:3000
- Click "Sign Up"
- Choose your role (Farmer, Restaurant, Distributor, or Inspector)
- Fill in your information

### **2. Explore Features:**

**As a Farmer:**
- Add products to your catalog
- Manage inventory
- View and fulfill orders
- Track inspections

**As a Restaurant:**
- Browse farm products
- Place orders
- Track deliveries
- View order history

**As a Distributor:**
- Manage delivery fleet
- Accept delivery assignments
- Update delivery status
- Track routes

**As an Inspector:**
- Schedule inspections
- Submit inspection reports
- Track compliance

---

## 🧪 Testing the System

### **Test API Gateway:**
```bash
curl http://localhost:4000/health
```

### **Test All Services:**
```bash
for port in 3001 3002 3003 3004 3005 3006 3007 3008 4000 4001; do
  echo "Testing port $port..."
  curl -s http://localhost:$port/health | jq .
done
```

### **Test Notifications:**
```bash
curl -X POST http://localhost:3007/api/notify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "type": "order",
    "title": "Test Notification",
    "message": "This is a test"
  }'
```

---

## 🐛 Troubleshooting

### **Backend won't start?**

**Check Docker:**
```bash
docker --version
docker-compose --version
```

**Check ports:**
```bash
# Make sure ports 3001-3008, 4000-4001 are free
lsof -i :4000
```

**View logs:**
```bash
docker-compose logs -f
```

**Reset everything:**
```bash
docker-compose down -v
docker-compose up --build
```

### **Frontend won't start?**

**Clear and reinstall:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Check Node version:**
```bash
node --version  # Should be 18+
```

### **Services keep restarting?**

Check individual service logs:
```bash
docker-compose logs -f auth-service
docker-compose logs -f notification-service
```

Common issues:
- MongoDB connection failed → Wait longer for MongoDB to start
- RabbitMQ connection failed → Check RabbitMQ is running
- Port conflict → Another app using the port

---

## 📁 Project Structure

```
Farm2Table/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # API client, utilities
│   └── package.json
│
├── backend/
│   ├── gateways/         # API Gateways
│   │   ├── external-api-gateway/  # Port 4000
│   │   └── internal-api-gateway/  # Port 4001
│   │
│   ├── services/         # Microservices
│   │   ├── auth-service/         # Port 3001
│   │   ├── user-service/         # Port 3002
│   │   ├── product-service/      # Port 3003
│   │   ├── order-service/        # Port 3004
│   │   ├── delivery-service/     # Port 3005
│   │   ├── health-service/       # Port 3006
│   │   ├── notification-service/ # Port 3007
│   │   └── chatbot-service/      # Port 3008
│   │
│   ├── shared/           # Shared modules
│   │   ├── database.ts   # MongoDB connection
│   │   ├── rabbitmq.ts   # Message broker
│   │   └── consul.ts     # Service discovery
│   │
│   ├── docker-compose.yml
│   ├── sync-shared.js    # Sync shared modules
│   └── RESEND_SETUP_GUIDE.md
│
└── Documentation/
    ├── QUICK_REFERENCE_CARD.md
    ├── BACKEND_ARCHITECTURE_QA.md
    ├── MICROSERVICES_EXPLAINED.md
    ├── PROJECT_STRUCTURE.md
    └── GETTING_STARTED.md (this file)
```

---

## 🔑 Default Credentials

### **RabbitMQ Management UI:**
- URL: http://localhost:15672
- Username: `farm2table`
- Password: `secret`

### **MongoDB:**
- No authentication in development
- Each service has its own database

---

## 🚀 Next Steps

1. ✅ **Explore the codebase**
   - Read `QUICK_REFERENCE_CARD.md` for quick overview
   - Read `BACKEND_ARCHITECTURE_QA.md` for architecture details

2. ✅ **Try making changes**
   - Add a new product
   - Place an order
   - Track delivery

3. ✅ **Set up email notifications** (optional)
   - Follow `backend/RESEND_SETUP_GUIDE.md`

4. ✅ **Learn the architecture**
   - Read `MICROSERVICES_EXPLAINED.md`
   - Read `PROJECT_STRUCTURE.md`

---

## 📚 Additional Resources

- **Quick Reference:** `QUICK_REFERENCE_CARD.md`
- **Backend Details:** `BACKEND_ARCHITECTURE_QA.md`
- **Microservices Guide:** `MICROSERVICES_EXPLAINED.md`
- **Project Structure:** `PROJECT_STRUCTURE.md`
- **Email Setup:** `backend/RESEND_SETUP_GUIDE.md`

---

## 💡 Tips

1. **Keep Docker Desktop running** - All backend services run in containers
2. **Check logs frequently** - Use `docker-compose logs -f` to debug
3. **Test incrementally** - Start one service at a time if needed
4. **Use health checks** - All services have `/health` endpoints
5. **Browser DevTools** - Check Network tab for API calls

---

## 🎯 Development Workflow

### **Making Backend Changes:**
```bash
# 1. Edit code in services/
# 2. Rebuild specific service
docker-compose up --build auth-service

# 3. Or rebuild all
docker-compose up --build
```

### **Making Frontend Changes:**
- Changes hot-reload automatically
- No restart needed

### **Adding Dependencies:**
```bash
# Backend (in service directory)
cd backend/services/auth-service
npm install new-package

# Frontend
cd frontend
npm install new-package
```

---

**Need Help?** Check the troubleshooting section or review the documentation files!

**Ready to code!** 🎉
