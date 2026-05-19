# Oman Sale Jobs

Standalone background workers, separated from the main API.

## Tasks

- **promotion-expiry** — sets `AdPromotion.isActive = false` when `endsAt` has passed. Listings remain published.

## Run

```bash
# from repo root
npm --workspace @oman-sale/jobs run dev
```

Requires `DATABASE_URL` in the root `.env`. Optional: `PROMOTION_EXPIRY_INTERVAL_MS` (default 5 minutes).

Generate Prisma client from the API schema before first run:

```bash
npm run prisma:generate
```
