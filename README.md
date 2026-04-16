# FreightFlow — Transport Marketplace

A full-stack, production-ready transportation marketplace where shippers post loads, drivers bid, and freight moves.

## Tech Stack

| Layer       | Technology                             |
|-------------|----------------------------------------|
| Frontend    | Next.js 15 + TypeScript + Tailwind CSS |
| Backend     | NestJS + TypeScript                    |
| Database    | PostgreSQL + Prisma ORM                |
| Auth        | NextAuth.js + JWT (access + refresh)   |
| Monorepo    | pnpm workspaces + Turborepo            |
| Dev infra   | Docker (PostgreSQL + Redis)            |
| API Docs    | Swagger / OpenAPI                      |

---

## Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker Desktop

### 1. Clone and install

```bash
cd freightflow
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

> If you already have PostgreSQL running on port 5432, just create a new database:
> ```bash
> docker exec <postgres_container> psql -U postgres -c "CREATE DATABASE freightflow;"
> ```

### 3. Configure environment

Copy and edit the env files:

```bash
cp .env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local   # or edit directly
```

Edit `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/freightflow"
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### 4. Run migrations + seed

```bash
pnpm db:migrate
# Seed is run automatically. To re-seed manually:
pnpm db:seed
```

### 5. Start the apps

**Terminal 1 — API:**
```bash
cd apps/api
pnpm dev
# OR build & run:
pnpm build && node dist/src/main.js
```

**Terminal 2 — Web:**
```bash
cd apps/web
pnpm dev
```

Or run everything from root:
```bash
pnpm dev
```

### 6. Open in browser

| Service       | URL                              |
|---------------|----------------------------------|
| Website       | http://localhost:3000            |
| API           | http://localhost:3002/api        |
| Swagger Docs  | http://localhost:3002/docs       |
| Prisma Studio | `pnpm db:studio` → port 5555     |

---

## Demo Accounts

| Role    | Email                       | Password    |
|---------|-----------------------------|-------------|
| Admin   | admin@freightflow.com       | admin1234   |
| Shipper | shipper@demo.com            | demo1234    |
| Shipper | shipper2@demo.com           | demo1234    |
| Driver  | driver@demo.com             | demo1234    |
| Driver  | driver2@demo.com            | demo1234    |

---

## Features

### Public Marketing Pages
- `/home` — Hero, stats, how it works, testimonials, CTA
- `/how-it-works` — Step-by-step for shippers and drivers
- `/services` — Service types (general, refrigerated, oversized, etc.)
- `/contact` — Contact form

### Auth
- `/login` — Sign in with demo account shortcuts
- `/register` — Role selector (Shipper or Driver) + registration form
- JWT access tokens (15 min) + refresh tokens (7 days)

### Shipper Dashboard (`/shipper`)
- Overview with stats
- Create shipment (`/shipper/shipments/new`)
- View shipments list with status filters
- Shipment detail with bid list + accept bid
- Active bookings view

### Driver Dashboard (`/driver`)
- Overview with stats
- Browse available loads with search/filter
- Place a bid with modal form
- My bids with withdraw option
- My jobs with status progression buttons (En Route → In Transit → Delivered)
- Document upload for verification

### Admin Dashboard (`/admin`)
- Platform-wide stats
- User management (suspend/activate)
- All shipments overview
- All bookings overview
- Document review (approve/reject)
- Driver verification queue

---

## API Modules

| Module        | Endpoints                                     |
|---------------|-----------------------------------------------|
| `auth`        | POST login, register, refresh; GET me         |
| `users`       | GET/PATCH profile and driver profile          |
| `shipments`   | CRUD + browse, stats, cancel                  |
| `bids`        | Place, withdraw, accept, list                 |
| `bookings`    | List (driver/shipper), status updates         |
| `documents`   | Upload, list, delete                          |
| `admin`       | Stats, users, shipments, bookings, docs       |
| `notifications` | List, mark read, unread count               |

Full interactive docs at `/docs`.

---

## Project Structure

```
freightflow/
├── apps/
│   ├── api/              # NestJS API (port 3002)
│   │   ├── prisma/       # Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/
│   │       ├── users/
│   │       ├── shipments/
│   │       ├── bids/
│   │       ├── bookings/
│   │       ├── documents/
│   │       ├── admin/
│   │       └── notifications/
│   └── web/              # Next.js app (port 3000)
│       └── src/
│           ├── app/
│           │   ├── (marketing)/  # Public pages
│           │   ├── (auth)/       # Login/register
│           │   └── (dashboard)/  # Protected dashboards
│           ├── components/
│           │   ├── ui/           # shadcn-style components
│           │   ├── layout/       # Navbar, footer
│           │   └── dashboard/    # Shared dashboard components
│           └── lib/              # API client, utils, auth config
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Deployment

### Environment Variables for Production

**API (`apps/api/.env`):**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=<long random string>
JWT_REFRESH_SECRET=<long random string>
PORT=3002
NODE_ENV=production
UPLOAD_DIR=/var/uploads
FRONTEND_URL=https://your-domain.com
```

**Web (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXTAUTH_SECRET=<long random string>
NEXTAUTH_URL=https://your-domain.com
```

### Build for Production

```bash
# API
cd apps/api
pnpm build
node dist/src/main.js

# Web
cd apps/web
pnpm build
pnpm start
```

### Recommended Hosts
- **API**: Railway, Render, Fly.io, or a VPS
- **Web**: Vercel (recommended for Next.js)
- **Database**: Supabase, Railway, Neon, or managed PostgreSQL

### File Storage
Currently uses local disk storage (`./uploads`). To switch to S3/Supabase:
1. Install `@aws-sdk/client-s3` or `@supabase/supabase-js`
2. Update `DocumentsModule` multer config to use a cloud storage engine
3. Update `documents.service.ts` to generate cloud URLs

---

## Mobile App (Future)

The API is designed for mobile reuse:
- Pure REST + JWT — compatible with React Native / Expo
- All business logic lives in the API, not the web UI
- Role-based endpoints work identically for web and mobile
- Refresh token flow is standard and mobile-friendly
