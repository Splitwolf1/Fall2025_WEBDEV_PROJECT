#!/bin/bash
# Test script to verify JWT token structure

echo "🔍 Testing Authentication Flow..."
echo ""

# Test registration
echo "1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@test.com",
    "password": "Test123!",
    "role": "farmer",
    "profile": {
      "firstName": "Test",
      "lastName": "User"
    },
    "farmDetails": {
      "farmName": "Test Farm",
      "location": "Test Location"
    }
  }')

echo "$REGISTER_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r .token)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Registration failed - no token received"
  exit 1
fi

echo ""
echo "✅ Token received: ${TOKEN:0:20}..."
echo ""

# Decode token (just the payload, no verification)
echo "2️⃣ Decoded Token Payload:"
echo "$TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null | jq .

echo ""
echo "3️⃣ Testing /api/users/me with token..."
ME_RESPONSE=$(curl -s -X GET http://localhost:4000/api/users/me \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | jq .

if echo "$ME_RESPONSE" | jq -e '.success == true' > /dev/null; then
  echo ""
  echo "✅ All tests passed!"
else
  echo ""
  echo "❌ /api/users/me failed"
fi
