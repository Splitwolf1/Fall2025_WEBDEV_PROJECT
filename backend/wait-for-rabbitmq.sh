#!/bin/bash
# Wait for RabbitMQ to be ready before starting services

echo "⏳ Waiting for RabbitMQ to be ready..."

# Wait up to 60 seconds for RabbitMQ
for i in {1..60}; do
  if rabbitmq-diagnostics ping > /dev/null 2>&1; then
    echo "✅ RabbitMQ is ready!"
    exit 0
  fi
  echo "   Attempt $i/60..."
  sleep 1
done

echo "❌ RabbitMQ failed to start within 60 seconds"
exit 1
