# Shared Modules

This directory contains shared TypeScript modules used across all microservices.

## 🚀 Quick Start (New Laptop Setup)

After cloning the repo on a new laptop:
```bash
cd backend
npm install   # This automatically syncs shared files to all services
```

That's it! The shared files will be automatically copied to each service.

## Files

- **`rabbitmq.ts`** - RabbitMQ client for message queue communication
- **`database.ts`** - Database connection utilities
- **`consul.ts`** - Service discovery with Consul

## How It Works

These shared files are **automatically copied** to each service's `shared/` folder:
- `backend/services/order-service/shared/`
- `backend/services/user-service/shared/`
- `backend/services/product-service/shared/`
- etc.

This approach ensures:
- ✅ **No TypeScript lint errors** - Each service has its own copy
- ✅ **Works in Docker** - Services are self-contained
- ✅ **Microservices independence** - Each service can be deployed separately
- ✅ **Version control** - The `shared/` folders in services are gitignored

## Updating Shared Modules

When you modify any file in `backend/shared/`, the changes are **automatically synced** to all services.

### Automatic Sync (Recommended)

The shared files are automatically synced when you:
```bash
cd backend
npm install
```

### Manual Sync

You can also manually trigger a sync:

**Using npm:**
```bash
cd backend
npm run sync
```

**Windows (batch script):**
```bash
cd backend
sync-shared.bat
```

**Linux/Mac (shell script):**
```bash
cd backend
chmod +x sync-shared.sh
./sync-shared.sh
```

**Manual copy:**
```bash
cp backend/shared/*.ts backend/services/[SERVICE-NAME]/shared/
```

## Why Not Symlinks?

We tried symlinks but they caused Docker to resolve files from the host filesystem instead of the container, breaking the services. Direct copies are the most reliable solution.

## Docker Volume Mounting

In `docker-compose.yml`, each service has the shared folder mounted:
```yaml
volumes:
  - ./shared:/app/shared
```

This ensures the copied files are available at runtime in the container.
