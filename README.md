# Uptime Monitor

A fullstack application that monitors website availability in real-time. Users can add URLs to track, and the system automatically checks their status every 5 minutes, recording uptime percentage and response times.

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, Vite  
**Backend:** Node.js, Express, TypeScript  
**Database:** PostgreSQL  
**Auth:** JWT (JSON Web Tokens), bcrypt

## Features

- User registration and authentication with JWT
- Add and remove websites to monitor
- Automated background monitoring every 5 minutes
- Real-time dashboard with auto-refresh (30s)
- Uptime percentage and average response time per site
- Status indicators (green/yellow/red) based on uptime
- Detailed check history with timestamps via modal view
- URL validation on both client and server side
- Responsive dark-themed UI

## Project Structure

```
├── client/                # React frontend
│   └── src/
│       ├── components/
│       │   ├── LoginPage.tsx
│       │   └── Dashboard.tsx
│       └── App.tsx
│
└── server/                # Express backend
    └── src/
        ├── routes/
        │   ├── auth.ts        # Registration & login
        │   └── sites.ts       # Sites CRUD, stats & history
        ├── services/
        │   └── monitor.ts     # Background monitoring job
        ├── middleware/
        │   └── authMiddleware.ts
        ├── db.ts              # PostgreSQL connection
        └── index.ts           # Server entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### Database Setup

```bash
createdb uptime_monitor
psql -d uptime_monitor -f server/schema.sql
```

### Backend

```bash
cd server
npm install
```

Create `server/.env`:

```
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=uptime_monitor
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your-secret-key
```

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint                 | Auth | Description                          |
| ------ | ------------------------ | ---- | ------------------------------------ |
| POST   | `/api/auth/register`     | No   | Create account                       |
| POST   | `/api/auth/login`        | No   | Login, returns JWT                   |
| GET    | `/api/sites`             | Yes  | List user's sites                    |
| POST   | `/api/sites`             | Yes  | Add site to monitor                  |
| DELETE | `/api/sites/:id`         | Yes  | Remove site                          |
| GET    | `/api/sites/:id/stats`   | Yes  | Uptime % and avg response time (24h) |
| GET    | `/api/sites/:id/history` | Yes  | Check history (24h)                  |
| GET    | `/health`                | No   | Server and database health check     |

## Architecture Decisions

- **React + Express (separate)** instead of Next.js — the monitoring service requires a long-running background process (`setInterval`), which serverless/edge functions cannot support.
- **Raw SQL (`pg`)** instead of an ORM — for direct control over queries and better understanding of what happens at the database level.
- **JWT** instead of sessions — stateless authentication, no need to query the database on every request to verify the user.
- **PostgreSQL ENUM types** for status fields — enforces data integrity at the database level.
