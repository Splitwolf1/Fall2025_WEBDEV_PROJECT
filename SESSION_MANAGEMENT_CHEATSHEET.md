# 🎯 Session Management - Quick Cheatsheet

## 1-Minute Overview

```
┌─────────────────────────────────────────────────────────┐
│  HOW YOUR APP KEEPS USERS LOGGED IN                     │
└─────────────────────────────────────────────────────────┘

LOGIN                  SAVE TOKEN              USE TOKEN              LOGOUT
  ↓                         ↓                       ↓                    ↓
┌─────┐               ┌──────────┐            ┌─────────┐          ┌────────┐
│User │ Password OK?  │localStorage│ Token in │ Backend │  Delete  │ No     │
│Sends│──────────────→│  Saves     │─────────→│ Verifies│─────────→│ Token  │
│Creds│      ✓        │  JWT Token │  Every   │  Token  │          │        │
└─────┘               └──────────┘  Request   └─────────┘          └────────┘
                           ↓
                      Stays logged in
                      for 7 days!
```

---

## 📁 File Locations (Copy This for Your Demo)

### Main Authentication Logic
```
📂 frontend/src/lib/
  └── auth.ts           ← LOGIN, LOGOUT, SESSION FUNCTIONS
  └── api-client.ts     ← SENDS TOKEN WITH EVERY REQUEST
```

### Where Users Login
```
📂 frontend/src/app/(auth)/
  └── login/page.tsx    ← LOGIN PAGE
  └── register/page.tsx ← REGISTER PAGE
```

### Protected Pages
```
📂 frontend/src/app/(dashboard)/
  └── farmer/           ← NEEDS LOGIN
  └── restaurant/       ← NEEDS LOGIN
  └── distributor/      ← NEEDS LOGIN
  └── inspector/        ← NEEDS LOGIN
```

---

## 🔑 Key Functions (Show These in Demo)

### 1. Login
**File:** `frontend/src/lib/auth.ts` (line 28)
```typescript
// User clicks login button
await auth.login('farmer@email.com', 'password123', 'farmer');

// What happens:
// 1. Sends to backend
// 2. Gets JWT token back
// 3. Saves in localStorage: 'auth-token'
// 4. Saves in localStorage: 'user-data'
// 5. Saves in cookies: 'user-role'
// 6. Redirects to /farmer dashboard
```

### 2. Check if Logged In
**File:** `frontend/src/lib/auth.ts` (line 173)
```typescript
const user = auth.getCurrentUser();

if (!user) {
  router.push('/login');  // Not logged in? Go back!
}
```

### 3. Logout
**File:** `frontend/src/lib/auth.ts` (line 158)
```typescript
auth.logout();

// What happens:
// 1. Deletes token from localStorage
// 2. Deletes user data
// 3. Clears cookies
// 4. User must login again
```

---

## 💾 Where Session Data Lives

### Browser localStorage (F12 → Application → Local Storage)
```
Key: 'auth-token'
Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOi..."
       ↑ This is your JWT token (magic password)

Key: 'user-role'
Value: "farmer"
       ↑ Remembers which dashboard to show

Key: 'user-data'
Value: {"id":"123","email":"farmer@email.com","name":"John Doe","role":"farmer"}
       ↑ All your user information
```

### Browser Cookies (F12 → Application → Cookies)
```
user-role=farmer; max-age=604800
               ↑ Expires in 7 days (604800 seconds)
```

---

## 🔐 JWT Token Explained (2 Sentences)

**JWT = JSON Web Token**

It's a **secure, encoded string** that contains your user info (ID, email, role) and can't be faked because the backend has a secret key.

**Example JWT:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Decode it at:** https://jwt.io (paste the token to see what's inside)

---

## 🎬 Demo Script (Copy This!)

### Script 1: Show Login Flow (3 minutes)

**Step 1:** Open login page
```
"Here's our login page. When a user enters their email and password..."
```

**Step 2:** Open DevTools (F12) → Network tab
```
"Watch what happens when I click Login..."
```

**Step 3:** Click Login
```
"You'll see a POST request to /api/auth/login. Let me click on it..."
```

**Step 4:** Show Request/Response
```
Request shows:   { email: "...", password: "...", role: "farmer" }
Response shows:  { success: true, token: "eyJ...", user: {...} }

"The backend validates the credentials and sends back a JWT token."
```

**Step 5:** Open Application → localStorage
```
"Now look at localStorage - the token is saved here!"

Show:
- auth-token: eyJhbGci...
- user-role: farmer
- user-data: {"id":"123"...}

"This is how we keep the user logged in!"
```

**Step 6:** Navigate to dashboard
```
"Now I'm on the farmer dashboard. The app knows who I am by reading localStorage."
```

---

### Script 2: Show Token in Every Request (2 minutes)

**Step 1:** Open Network tab (F12)
```
"Let me click 'Add Product' and watch what happens..."
```

**Step 2:** Click Add Product
```
"See this POST request to /api/products? Click on it..."
```

**Step 3:** Show Headers
```
"Look at the Request Headers:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

The token is automatically sent with EVERY request!
This proves to the backend 'this is really me'."
```

---

### Script 3: Show Logout (1 minute)

**Step 1:** Open localStorage (F12 → Application)
```
"Before logout, we have all this data stored..."
[Show auth-token, user-role, user-data]
```

**Step 2:** Click Logout
```
"Watch what happens when I click logout..."
```

**Step 3:** Show localStorage again
```
"All gone! The token and user data are deleted."
```

**Step 4:** Try to visit dashboard
```
"If I try to visit /farmer/inventory now... redirected to login!
The app checks 'is there a token?' and says NO, so kicks me out."
```

---

### Script 4: Show Session Persistence (1 minute)

**Step 1:** Login
```
"I'm logged in as a farmer..."
```

**Step 2:** Close browser completely
```
"Now I'm closing the entire browser... gone!"
```

**Step 3:** Reopen browser, go to app
```
"Open browser again, go to localhost:3000..."
```

**Step 4:** Show still logged in
```
"Still logged in! No need to login again!
Why? Because the token is saved in localStorage,
which persists even after closing the browser."
```

---

## 🛡️ Security Features (Mention These)

### 1. Token Expiration
```
Token expires after 7 days
User must login again after expiration
Prevents old tokens from working forever
```

### 2. Automatic Token Sending
```
Every API request includes the token
Backend verifies token before returning data
If token is invalid → Backend returns 401 Unauthorized
```

### 3. Protected Routes
```
Every dashboard page checks if user is logged in
No token? → Redirect to /login
Prevents unauthorized access
```

### 4. Secure Storage
```
✓ Tokens stored in browser (not server) = Stateless
✓ Tokens sent in Authorization header (not URL)
✓ HTTPS in production (encrypts tokens in transit)
```

---

## 🐛 Common Issues & How to Debug (For Q&A)

### Issue 1: "User gets logged out randomly"
**Debug:**
```
1. F12 → Application → localStorage
2. Check if 'auth-token' exists
3. If missing → Token was cleared somehow
4. Check token expiration (tokens expire after 7 days)
```

### Issue 2: "API returns 401 Unauthorized"
**Debug:**
```
1. F12 → Network → Click failing request
2. Check Request Headers
3. Is Authorization: Bearer <token> present?
4. If missing → Token not being sent
5. If present → Token might be expired or invalid
```

### Issue 3: "Can't access protected pages"
**Debug:**
```
1. F12 → Console
2. Look for "Redirecting to login" message
3. Check localStorage for 'auth-token'
4. If missing → User is not logged in
```

---

## 📊 Quick Stats for Presentation

```
Session Duration:       7 days (604,800 seconds)
Storage Locations:      2 (localStorage + cookies)
Items Stored:           4 (auth-token, user-role, user-data, user)
Protected Routes:       ~20 dashboard pages
Security:               JWT tokens, Token expiration, Route guards
```

---

## 🎓 Explain to Non-Technical Person

```
Session management is like a library card system:

1. LOGIN = Get library card
   You show ID, they give you a card with your member number

2. SAVE CARD = Put in wallet (localStorage)
   You keep the card so you don't need to show ID again

3. USE CARD = Show at checkout (every request)
   Every time you borrow a book, you show your card

4. LOGOUT = Return card
   When you leave for good, you give back the card

Your app does the same thing, but the "card" is a JWT token!
```

---

## 🎯 Key Takeaways (Memorize These 5 Points)

1. **JWT tokens keep users logged in**
   - Token = secure encoded string
   - Contains user ID, email, role
   - Can't be faked (backend has secret key)

2. **Tokens stored in browser's localStorage**
   - Persists across browser sessions
   - Lasts for 7 days
   - Automatically loaded when page loads

3. **Every API request includes the token**
   - Authorization: Bearer <token>
   - Backend verifies token
   - If invalid → 401 Unauthorized

4. **Protected routes check for token**
   - No token? → Redirect to /login
   - Prevents unauthorized access
   - Runs on every page load

5. **Logout deletes all session data**
   - Clears token from localStorage
   - Clears cookies
   - User must login again

---

## 📱 Quick Code Examples for Live Coding

### Example 1: Check if Logged In (Type in Console)
```javascript
// Open F12 → Console → Type this:
localStorage.getItem('auth-token')
// Should show: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

localStorage.getItem('user-role')
// Should show: "farmer"

// Parse user data:
JSON.parse(localStorage.getItem('user-data'))
// Should show: {id: "123", email: "...", role: "farmer"}
```

### Example 2: Manually Logout (Type in Console)
```javascript
// Clear all session data:
localStorage.removeItem('auth-token');
localStorage.removeItem('user-role');
localStorage.removeItem('user-data');
localStorage.removeItem('user');

// Now reload page → Redirected to /login!
location.reload();
```

### Example 3: Decode JWT Token
```javascript
// Copy your token:
const token = localStorage.getItem('auth-token');

// Decode it (JWT is base64 encoded):
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);

// Shows: {userId: "123", email: "...", role: "farmer", exp: 1699999999}
```

---

## ⏰ 30-Second Elevator Pitch

```
"Our app uses JWT token-based authentication for session management.

When users login, the backend generates a secure JWT token containing
their user ID and role. This token is stored in the browser's
localStorage and automatically sent with every API request in the
Authorization header.

The backend verifies the token on each request, ensuring only
authenticated users can access protected resources. Tokens expire
after 7 days for security. On logout, all session data is cleared
from the browser.

This stateless approach means the backend doesn't store sessions,
making it scalable and perfect for microservices architecture."
```

---

*Print this for your demo! Good luck! 🚀*
