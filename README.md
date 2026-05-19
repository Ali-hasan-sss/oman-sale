# Oman Sale

Oman Sale is a production-oriented modular monolith for a universal listing platform. Products, services, jobs, logistics, construction, and future ad types are represented as listings.

## Stack

- Web: Next.js App Router, TypeScript, TailwindCSS, Zustand, TanStack Query, Axios
- API: Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO, BullMQ
- Architecture: Turborepo monorepo with modular monolith backend modules

## Start

```bash
cp .env.example .env
npm install
docker compose up -d postgres redis
npm run prisma:generate
npm run prisma:migrate
npm --workspace @oman-sale/api run dev
```

## API Routes

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/ads`
- `POST /api/v1/ads`
- `GET /api/v1/categories`
- `POST /api/v1/chat/conversations`
- `POST /api/v1/chat/messages`
- `GET /api/v1/notifications`
- `GET /api/v1/search/ads`
- `GET /api/v1/admin/statistics`
