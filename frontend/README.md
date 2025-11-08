This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (LTS)
- **Docker Desktop** (for backend services)
- **npm** or **yarn** or **pnpm**

---

## 📦 Backend Setup

The backend uses Docker Compose to run all microservices and infrastructure.

### Start Backend Services

**Location:** Run commands from the `backend` directory

```bash
# Navigate to backend directory
cd backend

# Start all services (minimal setup - 3 services)
docker-compose -f docker-compose.minimal.yml up --build

# OR start all services (full setup - all services)
docker-compose up --build
```

**Backend Services:**
- User Service: http://localhost:3001
- Product Service: http://localhost:3002
- Order Service: http://localhost:3003
- RabbitMQ Management: http://localhost:15672 (username: `farm2table`, password: `secret`)
- Consul UI: http://localhost:8500

**Stop Backend Services:**
```bash
# From backend directory
cd backend
docker-compose -f docker-compose.minimal.yml down
```

**Note:** No `.env` files needed for backend - all environment variables are configured in `docker-compose.yml`

---

## 🎨 Frontend Setup

### Start Frontend Development Server

**Location:** Run commands from the `frontend` directory

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The page auto-updates as you edit files.

---

## 🔄 Running the Full Stack

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
docker-compose -f docker-compose.minimal.yml up --build
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd frontend
npm install  # First time only
npm run dev
```

### Step 3: Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001 (User Service), http://localhost:3002 (Product Service), etc.

---

## 📁 Project Structure

```
Fall2025_WEBDEV_PROJECT/
├── backend/          # Backend microservices (run commands here)
│   ├── services/
│   ├── api-gateway/
│   └── docker-compose.yml
└── frontend/         # Next.js frontend (run commands here)
    ├── src/
    └── package.json
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
