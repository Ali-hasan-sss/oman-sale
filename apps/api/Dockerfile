FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages packages
RUN npm install

FROM deps AS builder
WORKDIR /app
COPY apps/api apps/api
RUN npm --workspace @oman-sale/api run prisma:generate
RUN npm --workspace @oman-sale/api run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
EXPOSE 4000
CMD ["npm", "--workspace", "@oman-sale/api", "run", "start"]
