# GymOS — Smart Admin Panel

A full-stack gym management and smart administration system for single gym owners, built with React + Express + MongoDB.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, React Router v6 |
| State | Zustand, TanStack Query v5 |
| Charts | Recharts |
| Backend | Express.js, Node.js 20 LTS |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT + bcryptjs |
| Scheduler | node-cron |
| WhatsApp | OpenWA (optional) |

## Features

- 📊 **Dashboard** — Real-time stats, charts, expiring membership alerts
- 👥 **Members Management** — Full CRUD, search, filter, pagination
- ✅ **Attendance Tracking** — Bulk marking, 7-day streak, daily stats
- 💳 **Payments & Revenue** — Record payments, monthly charts, method breakdown
- 🔔 **System Alerts** — Expiry, inactivity, pending payments
- 🤖 **Smart Assistant** — Rule-based NLP query engine (zero AI cost)
- 📈 **Advanced Analytics** — Daily/weekly/monthly/yearly reports
- ⚙️ **Settings** — Gym info, plans CRUD, reminders, WhatsApp, account
- 📱 **PWA** — Installable, works offline

## Local Development Setup

### Prerequisites
- Node.js 20 LTS
- MongoDB Atlas account (free M0 cluster)

### 1. Clone & install

```bash
git clone <repo-url>
cd gym

# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

### 2. Configure environment

```bash
# Copy and edit server .env
cp .env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secret
```

### 3. Seed database

```bash
cd server
node scripts/seed.js
```

This creates:
- Admin: `admin@gymos.com` / `Admin@123`
- 4 membership plans
- 10 sample members
- Attendance & payment records

### 4. Run

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | — | JWT signing secret (min 16 chars) |
| `PORT` | ❌ | 5000 | Backend port |
| `JWT_EXPIRES_IN` | ❌ | 7d | JWT expiry duration |
| `WHATSAPP_ENABLED` | ❌ | false | Enable WhatsApp integration |
| `OPENWA_URL` | ❌ | http://localhost:3001 | OpenWA service URL |
| `FRONTEND_URL` | ❌ | http://localhost:5173 | Frontend URL for CORS |
| `VITE_API_URL` | ❌ | http://localhost:5000/api/v1 | API URL for frontend |

## API Documentation

**Base URL:** `/api/v1`

| Route Group | Endpoints |
|---|---|
| Auth | `POST /auth/login`, `GET /auth/me`, `PUT /auth/change-password` |
| Members | `GET/POST /members`, `GET/PUT/DELETE /members/:id`, `GET /members/stats/summary` |
| Plans | `GET/POST /plans`, `PUT/DELETE /plans/:id` |
| Attendance | `POST /attendance/bulk`, `GET /attendance/today`, `GET /attendance/stats` |
| Payments | `GET/POST /payments`, `GET /payments/revenue/monthly`, `GET /payments/revenue/summary` |
| Reports | `GET /reports/daily|weekly|monthly|yearly` |
| Notifications | `GET /notifications`, `PUT /notifications/read-all`, `GET /notifications/count` |
| Assistant | `POST /assistant/query`, `GET /assistant/suggestions` |
| WhatsApp | `GET /whatsapp/status`, `POST /whatsapp/send` |

## Deployment

### Backend — Render
1. Create Web Service on Render
2. Connect GitHub repo, set root to `server/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables

### Frontend — Vercel
1. Import project on Vercel
2. Set root to `client/`
3. Add `VITE_API_URL` pointing to Render backend URL

### MongoDB Atlas
1. Whitelist Render's IPs in Network Access
2. Ensure cluster is M0 (free tier)

## WhatsApp Setup

1. Clone and run [OpenWA](https://github.com/rmyndharis/OpenWA)
2. Set `WHATSAPP_ENABLED=true` and `OPENWA_URL` in server .env
3. Scan QR from OpenWA dashboard
4. Use a dedicated gym phone number (never personal)

## License

MIT
