# 🌾 Farm-to-Table Full Stack Setup Guide

**Last Updated**: November 5, 2025
**Status**: Backend ✅ Complete | Frontend ✅ Complete | Integration ✅ Ready

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running Full Stack](#running-full-stack)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js 20+** (LTS recommended)
   - Download: https://nodejs.org/
   - Verify: `node --version` && `npm --version`

2. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop/
   - **Must be running** before starting backend
   - Verify: `docker --version` && `docker-compose --version`

3. **Git** (for version control)
   - Download: https://git-scm.com/

---

## Project Structure

```
Fall2025_WEBDEV_PROJECT/
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable components
│   │   └── lib/              # Utilities & API clients
│   ├── .env.local           # Environment variables
│   └── package.json
│
├── backend/                   # Microservices backend
│   ├── api-gateway/          # API Gateway (Port 4000)
│   ├── services/
│   │   ├── user-service/     # Port 3001
│   │   ├── product-service/  # Port 3002
│   │   ├── order-service/    # Port 3003
│   │   ├── delivery-service/ # Port 3004
│   │   ├── health-service/   # Port 3005
│   │   ├── notification-service/ # Port 3006
│   │   └── chatbot-service/  # Port 3007
│   ├── shared/               # Shared utilities
│   ├── docker-compose.yml    # Full orchestration
│   └── docker-compose.minimal.yml  # Minimal setup
│
└── Documentation files...
```

---

## Backend Setup

### Step 1: Start Docker Desktop

**Windows:**
1. Open Docker Desktop from Start menu
2. Wait for Docker to start (whale icon stops animating)
3. Verify: `docker ps` should work without errors

### Step 2: Navigate to Backend

```powershell
cd c:\Users\Wolf\Desktop\Fall2025_WEBDEV_PROJECT\backend
```

### Step 3: Start Backend Services

**Option A: Minimal Setup (Recommended for Development)**

Starts only infrastructure + 3 core services:

```powershell
docker-compose -f docker-compose.minimal.yml up --build
```

This starts:
- RabbitMQ
- Consul
- 3 MongoDB instances
- User Service (Port 3001)
- Product Service (Port 3002)
- Order Service (Port 3003)

**Option B: Full Setup (All Services)**

```powershell
docker-compose up --build
```

This starts all 7 microservices + infrastructure.

### Step 4: Verify Backend is Running

Open in browser:
- API Gateway: http://localhost:4000
- User Service: http://localhost:3001/health
- Product Service: http://localhost:3002/health
- Order Service: http://localhost:3003/health
- RabbitMQ Management: http://localhost:15672 (user: `farm2table`, pass: `secret`)
- Consul UI: http://localhost:8500

All should show green status!

---

## Frontend Setup

### Step 1: Navigate to Frontend

```powershell
cd c:\Users\Wolf\Desktop\Fall2025_WEBDEV_PROJECT\frontend
```

### Step 2: Install Dependencies

```powershell
npm install
```

This may take a few minutes.

### Step 3: Configure Environment

The `.env.local` file is already created with default settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3006
```

If needed, you can edit this file to change API URLs.

### Step 4: Start Frontend Development Server

```powershell
npm run dev
```

Frontend will start at: **http://localhost:3000**

---

## Running Full Stack

### Complete Startup Sequence

**Terminal 1 (Backend):**
```powershell
cd backend
docker-compose -f docker-compose.minimal.yml up --build
```

Wait for all services to show "✅ MongoDB connected" and "🚀 Service running on port..."

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

Wait for "Ready on http://localhost:3000"

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Main application |
| **API Gateway** | http://localhost:4000 | Backend API endpoint |
| **RabbitMQ** | http://localhost:15672 | Message broker UI |
| **Consul** | http://localhost:8500 | Service discovery |

---

## Testing the Integration

### 1. Test User Registration

**Via Frontend:**
1. Go to http://localhost:3000/register
2. Fill in the form:
   - Email: `farmer@test.com`
   - Password: `password123`
   - Role: `Farmer`
   - First Name: `John`
   - Last Name: `Doe`
3. Click Register
4. Should redirect to `/farmer` dashboard

**Via API (PowerShell):**
```powershell
$body = @{
  email = "farmer@test.com"
  password = "password123"
  role = "farmer"
  profile = @{
    firstName = "John"
    lastName = "Doe"
  }
  farmDetails = @{
    farmName = "Green Valley Farm"
    location = @{ lat = 40.7128; lng = -74.0060 }
    address = "123 Farm Road"
    certifications = @("Organic")
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### 2. Test User Login

**Via Frontend:**
1. Go to http://localhost:3000/login
2. Enter:
   - Email: `farmer@test.com`
   - Password: `password123`
   - Select Role: Farmer
3. Click Login
4. Should redirect to farmer dashboard

**Via API:**
```powershell
$body = @{
  email = "farmer@test.com"
  password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

Save the `token` from response!

### 3. Test Product Creation

**Via API:**
```powershell
$token = "YOUR_JWT_TOKEN_FROM_LOGIN"

$body = @{
  farmerId = "YOUR_USER_ID"
  name = "Organic Tomatoes"
  category = "vegetables"
  description = "Fresh organic tomatoes"
  price = 4.99
  unit = "lb"
  stockQuantity = 100
  qualityGrade = "A"
  certifications = @("Organic")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/products" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $body `
  -ContentType "application/json"
```

### 4. Test Chatbot

**Via Frontend:**
1. Click the chat icon (bottom right of any dashboard page)
2. Type: "Track my order"
3. Bot should respond with order tracking options

**Via API:**
```powershell
$body = @{
  message = "Track my order"
  userId = "YOUR_USER_ID"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/chat" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### 5. Test Real-Time Notifications

**Requirements:**
- Frontend running
- Backend notification service running
- User logged in

**Steps:**
1. Open browser console (F12)
2. Look for: "✅ Connected to notification service"
3. Send a test notification via API:

```powershell
$token = "YOUR_JWT_TOKEN"

$body = @{
  userId = "YOUR_USER_ID"
  type = "test"
  title = "Test Notification"
  message = "This is a test notification from the backend!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/notify" `
  -Method POST `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $body `
  -ContentType "application/json"
```

4. Should see notification in browser console

---

## Troubleshooting

### Backend Issues

#### "Cannot connect to Docker daemon"

**Solution:** Start Docker Desktop

```powershell
# Check Docker status
docker ps

# If not working, open Docker Desktop from Start menu
```

#### "Port already in use"

**Solution:** Kill process using the port

```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### "MongoDB connection error"

**Solution:** Ensure MongoDB containers are running

```powershell
# Check MongoDB containers
docker ps | findstr mongo

# Restart MongoDB container
docker restart farm2table-mongo-users
```

#### Services keep restarting

**Solution:** Check logs

```powershell
# View logs for specific service
docker logs farm2table-user-service

# Follow logs in real-time
docker logs -f farm2table-user-service
```

### Frontend Issues

#### "Module not found" errors

**Solution:** Reinstall dependencies

```powershell
cd frontend
rm -r node_modules
rm package-lock.json
npm install
```

#### "API connection failed"

**Solution:** Check backend is running

```powershell
# Test API Gateway
curl http://localhost:4000/health

# Should return JSON with "status": "healthy"
```

#### "Socket.io connection failed"

**Solution:** Check notification service

```powershell
# Test notification service
curl http://localhost:3006/health

# Check if port 3006 is accessible
```

### Integration Issues

#### Login works but dashboard shows errors

**Possible causes:**
1. Token not being saved properly
2. Backend service down
3. CORS issues

**Debug steps:**
```javascript
// In browser console
console.log(localStorage.getItem('auth-token'));
console.log(localStorage.getItem('user-data'));
```

#### Real-time notifications not working

**Check:**
1. Notification service running: http://localhost:3006/health
2. Browser console shows socket connection
3. No CORS errors in console

---

## Development Workflow

### Making Changes to Backend

```powershell
# 1. Edit code in services/your-service/

# 2. Rebuild specific service
cd backend
docker-compose -f docker-compose.minimal.yml up --build user-service

# 3. View logs
docker logs -f farm2table-user-service
```

### Making Changes to Frontend

```powershell
# Frontend auto-reloads on save
# Just edit files in frontend/src/

# If you add new dependencies:
npm install package-name
```

### Stopping Services

**Backend:**
```powershell
# Stop all containers
docker-compose -f docker-compose.minimal.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.minimal.yml down -v
```

**Frontend:**
```powershell
# Press Ctrl+C in terminal
```

---

## Performance Tips

1. **Use Minimal Docker Compose** during development (faster startup)
2. **Keep Docker Desktop running** to avoid startup delays
3. **Use browser dev tools** to monitor API calls
4. **Check RabbitMQ UI** to verify message flow (when implemented)
5. **Monitor container resources** in Docker Desktop dashboard

---

## Next Steps

Once full stack is running:

1. ✅ Test all authentication flows
2. ✅ Create test data (users, products, orders)
3. 🚧 Implement RabbitMQ event publishing
4. 🚧 Connect all frontend pages to backend APIs
5. 🚧 Add real-time features
6. 🚧 Write tests
7. 🚧 Deploy to production

---

## Quick Reference

### Ports

| Port | Service |
|------|---------|
| 3000 | Frontend (Next.js) |
| 4000 | API Gateway |
| 3001 | User Service |
| 3002 | Product Service |
| 3003 | Order Service |
| 3004 | Delivery Service |
| 3005 | Health Service |
| 3006 | Notification Service |
| 3007 | Chatbot Service |
| 5672 | RabbitMQ (AMQP) |
| 15672 | RabbitMQ Management UI |
| 8500 | Consul UI |
| 27017-27021 | MongoDB instances |

### Default Credentials

**RabbitMQ:**
- Username: `farm2table`
- Password: `secret`
- URL: http://localhost:15672

**Test User:**
- Email: `farmer@test.com`
- Password: `password123`
- Role: Farmer

---

## Support

- **Backend README**: [backend/README.md](backend/README.md)
- **Frontend Docs**: [frontend/README.md](frontend/README.md)
- **Getting Started**: [backend/GETTING_STARTED.md](backend/GETTING_STARTED.md)
- **Phase 2 Summary**: [PHASE_2_COMPLETE_SUMMARY.md](PHASE_2_COMPLETE_SUMMARY.md)

---

**Status**: ✅ **Full Stack Ready for Development & Testing**

*Last Updated: November 5, 2025*
