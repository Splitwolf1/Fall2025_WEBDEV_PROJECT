#!/bin/bash
# Script to restart delivery service and API gateway to load fleet routes

echo "🔄 Restarting delivery service and API gateway..."

cd "$(dirname "$0")"

# Restart services
docker-compose restart delivery-service api-gateway

echo "✅ Services restarted!"
echo ""
echo "📋 To verify fleet routes are working:"
echo "   curl http://localhost:4000/api/fleet"
echo ""
echo "📋 Check service logs:"
echo "   docker-compose logs -f delivery-service"

