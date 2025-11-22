# Farm2Table - Setup Guide

## 🚀 Quick Setup (New Laptop / Fresh Clone)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Fall2025_WEBDEV_PROJECT
```

### 2. Backend Setup
```bash
cd backend
npm install   # Automatically syncs shared modules to all services
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Start Docker Services
```bash
cd ../backend
docker-compose up -d
```

### 5. Start Frontend Dev Server
```bash
cd ../frontend
npm run dev
```

## ✅ Verification

Check that all services are running:
```bash
docker ps --filter "name=farm2table"
```

You should see 15 containers:
- 7 microservices (user, product, order, delivery, health, notification, chatbot)
- 5 MongoDB databases
- 1 RabbitMQ
- 1 Consul
- 1 API Gateway

Test the API:
```bash
curl http://localhost:4000/api/products
```

Access the frontend:
```
http://localhost:3008
```

## 🔧 Important Notes

### Shared Modules
The backend uses shared TypeScript modules that are automatically synced to all services during `npm install`. If you modify files in `backend/shared/`, run:
```bash
cd backend
npm run sync
```

### Environment Variables
Make sure you have `.env.local` files:
- `frontend/.env.local` - Contains API URLs and Google OAuth credentials
- Each service has its own environment configuration in `docker-compose.yml`

### No TypeScript Errors
After running `npm install` in the backend, all TypeScript lint errors should disappear. The shared files are physically copied to each service's `shared/` folder (these are gitignored).

## 📝 Common Commands

**Restart all services:**
```bash
docker-compose restart
```

**View logs:**
```bash
docker logs farm2table-<service-name>
```

**Stop all services:**
```bash
docker-compose down
```

**Rebuild a service:**
```bash
docker-compose up -d --build <service-name>
```

## 🎯 Architecture

```
Frontend (Next.js 14)
     ↓ HTTP
API Gateway (Port 4000)
     ↓ HTTP Proxy
Microservices (7 services)
     ↓ RabbitMQ (async) + HTTP (sync)
MongoDB (5 databases)
```

For detailed backend architecture, see: [backend/README_SHARED.md](backend/README_SHARED.md)
