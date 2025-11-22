#!/bin/bash

# Sync shared modules to all services
# Run this script whenever you update files in backend/shared/

echo "🔄 Syncing shared modules to all services..."

SERVICES=(
  "order-service"
  "user-service"
  "product-service"
  "health-service"
  "delivery-service"
  "notification-service"
  "chatbot-service"
)

for service in "${SERVICES[@]}"; do
  echo "  📦 Copying to $service..."
  mkdir -p "services/$service/shared"
  cp -f shared/*.ts "services/$service/shared/"
done

echo "✅ Shared modules synced to all services!"
echo ""
echo "📝 Files synced:"
ls -1 shared/*.ts
