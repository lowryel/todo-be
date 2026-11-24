# syntax=docker/dockerfile:1.7

# ---- Build stage -----------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

# Prisma's engines need OpenSSL on Alpine.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma7.config.ts tsconfig.json ./
COPY src ./src

RUN npx prisma generate && npm run build && npm prune --omit=dev

# ---- Runtime stage ---------------------------------------------------------
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache openssl \
  && addgroup -S nodejs \
  && adduser -S nodejs -G nodejs

COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nodejs:nodejs /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=build --chown=nodejs:nodejs /app/package.json ./package.json

USER nodejs

EXPOSE 58000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:58000/health >/dev/null || exit 1

# Apply committed migrations, then start the compiled API.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]
