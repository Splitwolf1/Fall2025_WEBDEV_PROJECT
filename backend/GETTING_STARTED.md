# 🚀 Getting Started - Backend Setup

## Prerequisites

### 1. Install Docker Desktop

**Windows:**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. After installation, **start Docker Desktop** from the Start menu
4. Wait for Docker to fully start (whale icon in system tray will be steady)

**Verify Docker is running:**
```powershell
docker --version
docker-compose --version
```

### 2. Install Node.js (Optional - for local development)

Download from: https://nodejs.org/
- Recommended: v20.x LTS

---

## Quick Start Options

### Option A: Docker Compose - Minimal (Recommended for Now)

This starts only the infrastructure + 3 services we've built so far.

```powershell
# Make sure you're in the backend directory
cd c:\Users\Wolf\Desktop\Fall2025_WEBDEV_PROJECT\backend

# Start services
docker-compose -f docker-compose.minimal.yml up --build
```

**What this starts:**
- RabbitMQ (message broker)
- Consul (service discovery)
- 3 MongoDB databases
- User Service (port 3001)
- Product Service (port 3002)
- Order Service (port 3003)

**Access URLs:**
- User Service: http://localhost:3001/health
- Product Service: http://localhost:3002/health
- Order Service: http://localhost:3003/health
- RabbitMQ Management: http://localhost:15672
  - Username: `farm2table`
  - Password: `secret`
- Consul UI: http://localhost:8500

**To stop:**
```powershell
# Press Ctrl+C in the terminal
# OR in a new terminal:
docker-compose -f docker-compose.minimal.yml down
```

---

### Option B: Docker Compose - Full (After all services are built)

```powershell
docker-compose up --build
```

This will start all 7 microservices + infrastructure (use after all services are implemented).

---

### Option C: Local Development (Individual Service)

For developing a single service without Docker:

**1. Start infrastructure only:**
```powershell
# Start MongoDB, RabbitMQ, Consul
docker-compose -f docker-compose.minimal.yml up rabbitmq consul mongo-users mongo-products mongo-orders
```

**2. Run a service locally:**
```powershell
# Example: User Service
cd services/user-service
npm install
cp .env.example .env
npm run dev
```

---

## 🧪 Testing the Services

### 1. Health Checks

```powershell
# User Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health
```

### 2. Register a User

```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "farmer@test.com",
    "password": "password123",
    "role": "farmer",
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "farmDetails": {
      "farmName": "Green Valley Farm",
      "location": { "lat": 40.7128, "lng": -74.0060 },
      "address": "123 Farm Road",
      "certifications": ["Organic"]
    }
  }'
```

### 3. Login

```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "farmer@test.com",
    "password": "password123"
  }'
```

**Save the token from the response!**

### 4. Create a Product

```powershell
# Replace YOUR_JWT_TOKEN with the token from login
curl -X POST http://localhost:3002/api/products `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -d '{
    "farmerId": "YOUR_USER_ID",
    "name": "Organic Tomatoes",
    "category": "vegetables",
    "description": "Fresh organic tomatoes",
    "price": 4.99,
    "unit": "lb",
    "stockQuantity": 100,
    "qualityGrade": "A",
    "certifications": ["Organic"]
  }'
```

### 5. Get All Products

```powershell
curl http://localhost:3002/api/products
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to Docker daemon"

**Solution:** Start Docker Desktop
1. Open Docker Desktop from Start menu
2. Wait for it to fully start (whale icon stops animating)
3. Try again

### Error: "Port already in use"

**Solution:** Stop other services using the same ports
```powershell
# Check what's using the port
netstat -ano | findstr :3001

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Error: "Cannot find module"

**Solution:** Rebuild containers
```powershell
docker-compose -f docker-compose.minimal.yml down
docker-compose -f docker-compose.minimal.yml up --build
```

### Containers keep restarting

**Solution:** Check logs
```powershell
# View logs for a specific service
docker logs farm2table-user-service

# Follow logs in real-time
docker logs -f farm2table-user-service
```

### MongoDB connection issues

**Solution:** Ensure MongoDB containers are running
```powershell
# Check running containers
docker ps | findstr mongo

# Restart MongoDB
docker restart farm2table-mongo-users
```

---

## 📊 Monitoring

### View All Running Containers

```powershell
docker ps
```

### View Logs

```powershell
# All services
docker-compose -f docker-compose.minimal.yml logs

# Specific service
docker logs farm2table-user-service

# Follow logs
docker logs -f farm2table-user-service
```

### RabbitMQ Management UI

1. Open: http://localhost:15672
2. Login:
   - Username: `farm2table`
   - Password: `secret`
3. View:
   - Queues
   - Exchanges
   - Connections
   - Message rates

### Consul UI

1. Open: http://localhost:8500
2. View:
   - Registered services
   - Health checks
   - Service discovery

---

## 🧹 Cleanup

### Stop all containers

```powershell
docker-compose -f docker-compose.minimal.yml down
```

### Remove all data volumes

```powershell
docker-compose -f docker-compose.minimal.yml down -v
```

### Remove all images

```powershell
docker-compose -f docker-compose.minimal.yml down --rmi all
```

---

## 🎯 Next Steps

Once services are running:

1. Test all endpoints with Postman or curl
2. Check RabbitMQ Management UI
3. Verify services in Consul UI
4. Start building remaining services
5. Integrate RabbitMQ events

---

## 💡 Pro Tips

1. **Use Docker Desktop Dashboard** - Visual interface to manage containers
2. **Keep Docker Desktop running** - Required for all Docker commands
3. **Use minimal compose file** - Faster startup during development
4. **Check logs frequently** - Helps catch errors early
5. **Restart containers** - If you change environment variables

---

## 📚 Useful Commands

```powershell
# Start in detached mode (background)
docker-compose -f docker-compose.minimal.yml up -d

# Stop services
docker-compose -f docker-compose.minimal.yml stop

# Start stopped services
docker-compose -f docker-compose.minimal.yml start

# Rebuild specific service
docker-compose -f docker-compose.minimal.yml up --build user-service

# View container shell
docker exec -it farm2table-user-service sh

# View MongoDB shell
docker exec -it farm2table-mongo-users mongosh
```

---

**Need help?** Check the [README.md](README.md) for architecture details and API documentation.
