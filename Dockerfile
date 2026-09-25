# Multi-stage Dockerfile for UNION.AI Production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/server/package*.json ./packages/server/
COPY packages/client/package*.json ./packages/client/

# Install dependencies
RUN npm ci

# Copy full source
COPY . .

# Build all packages
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV DB_PATH=/app/data/union.db

# Install SQLite runtime dependencies
RUN apk add --no-cache python3 make g++

# Copy built artifacts and modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/server ./packages/server
COPY --from=builder /app/packages/client/dist ./packages/client/dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "packages/server/dist/index.js"]
