# 🔐 Session Management Guide - Farm-to-Table App
## Explained for Complete Beginners

This guide explains how your app manages user sessions (keeping users logged in) in the simplest way possible.

---

## 🤔 What is Session Management?

**Think of it like a library card:**
- When you visit a library (login), you get a library card (token)
- You show this card every time you want to borrow a book (make a request)
- The library remembers you're a member (you stay logged in)
- When you leave permanently, you return the card (logout)

In your app, session management does the same - it remembers who you are after you log in!

---

## 📋 How It Works in Your App

### The Simple Flow:

```
1. User logs in → App gets a "token" (like a password)
2. Token saved in browser → User stays logged in
3. User visits any page → App checks token
4. Token valid? → Show user's data
5. User logs out → Delete token
```

---

## 🗂️ File Locations & What They Do

### 1. **Main Auth File**
**Location:** `frontend/src/lib/auth.ts`

**What it does:** The "brain" of authentication - handles login, logout, registration

**Key Functions:**

#### 🔑 Login Function (Lines 28-90)
```typescript
auth.login(email, password, role)
```

**What happens:**
1. Sends email + password to backend server
2. Backend checks if user exists and password is correct
3. Backend sends back a **JWT token** (magic password)
4. Saves token in:
   - **localStorage** (browser storage)
   - **cookies** (another browser storage)
5. Connects to real-time notifications
6. Returns user info (name, email, role)

**Real code example:**
```typescript
// User clicks "Login" button
const user = await auth.login('farmer@example.com', 'password123', 'farmer');
// Now user is logged in!
```

#### 📝 Register Function (Lines 93-155)
```typescript
auth.register(userData)
```

**What happens:**
1. Sends user details to backend (name, email, password, role)
2. Backend creates new account
3. Backend sends back a JWT token
4. Automatically logs the user in (saves token)
5. User goes straight to their dashboard

#### 🚪 Logout Function (Lines 158-170)
```typescript
auth.logout()
```

**What happens:**
1. Deletes the token from localStorage
2. Deletes the token from cookies
3. Disconnects from notifications
4. User is now logged out!

#### 👤 Get Current User (Lines 173-184)
```typescript
auth.getCurrentUser()
```

**What happens:**
1. Reads user data from localStorage
2. Returns user info (or null if not logged in)
3. Used to check "Is anyone logged in right now?"

---

### 2. **API Client File**
**Location:** `frontend/src/lib/api-client.ts`

**What it does:** Handles all communication with the backend server

**Key Parts:**

#### Token Storage (Lines 14-40)
```typescript
class ApiClient {
  private token: string | null = null;  // The magic password

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth-token', token);  // Save in browser
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth-token');  // Delete from browser
  }
}
```

#### Automatic Token Sending (Lines 42-52)
```typescript
private getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;  // Send token with every request
  }

  return headers;
}
```

**Translation:** Every time you ask the backend for data, it automatically includes your token to prove "this is really me!"

---

### 3. **Login Page**
**Location:** `frontend/src/app/(auth)/login/page.tsx`

**What happens when you submit the form:**

```typescript
// User enters email and password, clicks "Login"
const handleLogin = async (e) => {
  // 1. Prevent page reload
  e.preventDefault();

  // 2. Show loading spinner
  setIsLoading(true);

  try {
    // 3. Call auth.login (this does the magic)
    await auth.login(email, password, role);

    // 4. Redirect to dashboard
    router.push(`/${role}`);  // Goes to /farmer or /restaurant etc.
  } catch (err) {
    // 5. Show error message if login fails
    setError('Login failed. Please try again.');
  }
};
```

---

### 4. **Protected Dashboard Pages**
**Location:** `frontend/src/app/(dashboard)/farmer/page.tsx` (example)

**How they stay protected:**

```typescript
useEffect(() => {
  // When page loads, check if user is logged in
  const currentUser = auth.getCurrentUser();

  if (!currentUser) {
    // No user logged in? Go back to login page!
    router.push('/login');
    return;
  }

  // User is logged in, fetch their data
  fetchUserData(currentUser.id);
}, []);
```

**Translation:** Every protected page checks "Is someone logged in?" before showing content.

---

## 🗄️ Where Session Data is Stored

### 1. **localStorage** (Main Storage)
**Location:** Browser's localStorage (not a file, it's in your browser)

**What's stored:**
```javascript
localStorage:
  - 'auth-token'     → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (JWT token)
  - 'user-role'      → "farmer" or "restaurant" or "distributor" or "inspector"
  - 'user-data'      → { id: "123", email: "user@example.com", name: "John Doe", role: "farmer" }
  - 'user'           → Full user object from backend
```

**How to view it:**
1. Open your app in browser
2. Press F12 (Developer Tools)
3. Go to "Application" tab
4. Click "Local Storage" → "http://localhost:3000"
5. You'll see all stored data!

### 2. **Cookies** (Backup Storage)
**Location:** Browser's cookies

**What's stored:**
```
user-role=farmer; path=/; max-age=604800
auth-token=eyJhbGciOiJI...; path=/; max-age=604800
```

**Why cookies too?**
- Cookies can be read on the server side
- localStorage only works in browser
- Double storage = more reliable

**How to view:**
1. F12 → Application → Cookies → http://localhost:3000

---

## 🔄 Step-by-Step: What Happens When You Login

### Step 1: User Enters Credentials
```
┌─────────────────┐
│  Login Page     │
│                 │
│  Email: ___     │
│  Password: ___  │
│  [Login Button] │
└─────────────────┘
         ↓
```

### Step 2: Frontend Sends to Backend
```typescript
// auth.ts line 31
const response = await apiClient.login(email, password, role);

// api-client.ts sends:
POST http://localhost:4000/api/auth/login
Headers: { Content-Type: 'application/json' }
Body: {
  email: 'farmer@example.com',
  password: 'password123',
  role: 'farmer'
}
```

### Step 3: Backend Validates & Responds
```
Backend checks:
1. Does user exist? ✓
2. Is password correct? ✓
3. Generate JWT token
4. Send response:
{
  success: true,
  user: { id: '123', email: '...', role: 'farmer' },
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### Step 4: Frontend Saves Token
```typescript
// auth.ts lines 63-70
if (typeof window !== 'undefined') {
  localStorage.setItem('user-role', user.role);           // Save role
  localStorage.setItem('user-data', JSON.stringify(user)); // Save user info
  localStorage.setItem('user', JSON.stringify(response.user)); // Save full data
  document.cookie = `user-role=${user.role}; path=/; max-age=604800`; // Save in cookies
}
```

### Step 5: User Redirected to Dashboard
```typescript
router.push(`/${role}`);  // Goes to /farmer
```

### Step 6: Dashboard Loads User Data
```typescript
// Every page checks if user is logged in
const user = auth.getCurrentUser();  // Gets from localStorage
if (!user) {
  router.push('/login');  // Not logged in? Go back!
}
```

---

## 🔐 JWT Token Explained (Like You're 5)

### What is JWT?
**JWT = JSON Web Token**

Think of it as a **movie ticket** with your information encoded:

```
Regular ticket: "John Doe, Seat A5"
JWT ticket:     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkw..."
```

### What's Inside?
```json
{
  "userId": "123",
  "email": "farmer@example.com",
  "role": "farmer",
  "exp": 1699999999  // Expiration time
}
```

### Why JWT?
- **Secure**: Can't be faked (backend has secret key)
- **Self-contained**: Has all user info inside
- **Stateless**: Backend doesn't need to remember you

### Token Lifespan
```
Created: Nov 7, 2025 10:00 AM
Expires: Nov 14, 2025 10:00 AM (7 days later)

After 7 days → Token invalid → User must login again
```

---

## 🚪 Logout Process

### What happens when you click "Logout"?

```typescript
// navbar.tsx calls:
auth.logout();

// Which does (auth.ts lines 158-170):
1. apiClient.clearToken()           → Delete token
2. socketClient.disconnect()        → Close notifications
3. localStorage.removeItem('user-role')   → Delete role
4. localStorage.removeItem('user-data')   → Delete user data
5. localStorage.removeItem('user')        → Delete full data
6. document.cookie = 'user-role=; max-age=0'  → Delete cookies

// Then navbar redirects:
router.push('/login');
```

**Result:** All traces of your session are gone! You're logged out.

---

## 🛡️ Security Features

### 1. Token in Every Request
```typescript
// api-client.ts automatically adds:
headers['Authorization'] = `Bearer ${token}`;

// Backend checks this token on every request
```

### 2. Client-Side Route Protection
```typescript
// Every protected page checks:
const user = auth.getCurrentUser();
if (!user) {
  router.push('/login');  // Kick them out!
}
```

### 3. Token Expiration
```
Token expires after 7 days (max-age=604800 seconds)
User must login again after expiration
```

### 4. Secure Token Storage
```
✓ HttpOnly cookies (can't be accessed by JavaScript)
✓ localStorage (for client-side checks)
✓ Token sent only in Authorization header
```

---

## 📊 Visual Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     USER JOURNEY                          │
└──────────────────────────────────────────────────────────┘

1. LOGIN
   ┌───────┐      ┌──────────┐      ┌──────────┐      ┌─────────┐
   │ User  │─────→│ Frontend │─────→│ Backend  │─────→│ Database│
   │ Clicks│      │ Sends    │      │ Validates│      │ Check   │
   │ Login │      │ Creds    │      │ Password │      │ User    │
   └───────┘      └──────────┘      └──────────┘      └─────────┘
                                           │
                                           ↓
                                    ┌──────────┐
                                    │ Generate │
                                    │   JWT    │
                                    │  Token   │
                                    └──────────┘
                                           │
                                           ↓
   ┌───────────────────────────────────────────────┐
   │  Frontend Receives Token                       │
   │  → Save to localStorage                        │
   │  → Save to cookies                             │
   │  → Redirect to dashboard                       │
   └───────────────────────────────────────────────┘

2. BROWSING (User is logged in)
   ┌─────────┐      ┌──────────────────┐      ┌──────────┐
   │ User    │─────→│ Every API Request│─────→│ Backend  │
   │ Clicks  │      │ Includes Token   │      │ Verifies │
   │ Button  │      │ Authorization:   │      │ Token    │
   │         │      │ Bearer xyz...    │      │          │
   └─────────┘      └──────────────────┘      └──────────┘
                                                     │
                                                     ↓
                                              ┌──────────┐
                                              │ Token OK?│
                                              │ Return   │
                                              │ Data     │
                                              └──────────┘

3. LOGOUT
   ┌───────┐      ┌─────────────────────────┐
   │ User  │─────→│ Frontend:                │
   │ Clicks│      │ • Delete token           │
   │ Logout│      │ • Clear localStorage     │
   │       │      │ • Clear cookies          │
   │       │      │ • Redirect to /login     │
   └───────┘      └─────────────────────────┘
```

---

## 🧪 How to Test Session Management

### Test 1: Login & Stay Logged In
```
1. Go to http://localhost:3000/login
2. Enter credentials and login
3. Close the browser tab
4. Open http://localhost:3000 again
5. ✓ Should still be logged in (no need to login again)
```

### Test 2: Logout
```
1. Click logout button
2. Try to visit http://localhost:3000/farmer
3. ✓ Should redirect to /login
```

### Test 3: Token Expiration
```
1. Login
2. Open DevTools (F12) → Application → localStorage
3. Delete 'auth-token'
4. Try to fetch data (add a product)
5. ✓ Should get "Unauthorized" error
```

### Test 4: View Stored Data
```
1. Login
2. F12 → Console → Type:
   console.log(localStorage.getItem('auth-token'))
   console.log(localStorage.getItem('user-data'))
3. ✓ See your token and user data
```

---

## 🎯 Demo Presentation Tips

### Key Points to Mention:

1. **"We use JWT tokens for security"**
   - Show token in localStorage
   - Explain it's like a movie ticket

2. **"Sessions persist across browser sessions"**
   - Login, close browser, reopen - still logged in
   - Token saved in localStorage

3. **"Every API request is authenticated"**
   - Show Network tab (F12 → Network)
   - Click on any request
   - Show Authorization header with token

4. **"Logout clears all session data"**
   - Show localStorage before logout (has data)
   - Click logout
   - Show localStorage after (empty)

5. **"Protected routes kick you out if not logged in"**
   - Try to visit /farmer/inventory without logging in
   - Gets redirected to /login

---

## 📁 Quick Reference

### Main Files:
```
frontend/src/lib/auth.ts           → Login, Logout, Session Management
frontend/src/lib/api-client.ts     → Token Storage, API Requests
frontend/src/app/(auth)/login      → Login UI
frontend/src/app/(auth)/register   → Register UI
frontend/src/app/(dashboard)/*     → Protected Pages
```

### Storage Locations:
```
localStorage['auth-token']    → JWT Token
localStorage['user-role']     → User's role
localStorage['user-data']     → User info
document.cookie               → Backup storage
```

### Key Functions:
```typescript
auth.login()           → Log user in
auth.logout()          → Log user out
auth.getCurrentUser()  → Get logged-in user
auth.isAuthenticated() → Check if logged in
apiClient.setToken()   → Save token
apiClient.clearToken() → Delete token
```

---

## ❓ FAQ for Demo

**Q: How long does a session last?**
A: 7 days (604800 seconds). After that, user must login again.

**Q: What happens if someone steals the token?**
A: They can impersonate the user until token expires. That's why we use HTTPS in production and have short expiration times.

**Q: Where is the token stored?**
A: In the browser's localStorage and cookies. Not on the server (stateless).

**Q: Can users stay logged in forever?**
A: No, tokens expire after 7 days for security. They need to re-login.

**Q: What if the backend is down?**
A: Frontend still has user data from localStorage, but can't fetch new data. Shows error messages.

---

## 🎓 Summary for Complete Beginners

**Session Management = Keeping you logged in**

1. **Login** → Backend gives you a token (magic password)
2. **Save Token** → Browser remembers it (localStorage + cookies)
3. **Every Request** → Token goes with every request (proves it's you)
4. **Stay Logged In** → Token works for 7 days
5. **Logout** → Delete token (you're logged out)

**That's it! Your app now remembers who you are!** 🎉

---

*Created for demo presentation on November 7, 2025*
