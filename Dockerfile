# Unified Multi-Service Dockerfile for Document Management System
# This Dockerfile builds both backend and frontend services

# ============================================
# Backend Dependencies Stage
# ============================================
FROM node:18-alpine AS backend-deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production || npm install --only=production

# ============================================
# Backend Builder Stage
# ============================================
FROM node:18-alpine AS backend-builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci || npm install
COPY backend/ .
# Generate Prisma Client
RUN npx prisma generate
# Build TypeScript
RUN npm run build

# ============================================
# Frontend Dependencies Stage
# ============================================
FROM node:18-alpine AS frontend-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --only=production --legacy-peer-deps

# ============================================
# Frontend Builder Stage
# ============================================
FROM node:18-alpine AS frontend-builder
RUN apk add --no-cache python3 make g++ linux-headers
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps --ignore-scripts && \
    npm rebuild @swc/core --build-from-source
COPY frontend/ .
# Set production environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Build the application
RUN npm run build

# ============================================
# Final Production Stage
# ============================================
FROM node:18-alpine AS production
RUN apk add --no-cache libc6-compat supervisor

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# ============================================
# Backend Setup
# ============================================
# Copy backend production dependencies
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
# Copy backend built application
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/package*.json ./backend/
# Generate Prisma Client in production
WORKDIR /app/backend
RUN npx prisma generate
# Create necessary backend directories
RUN mkdir -p uploads logs && chown -R appuser:nodejs uploads logs

# ============================================
# Frontend Setup
# ============================================
WORKDIR /app/frontend
# Copy frontend built application
COPY --from=frontend-builder /app/frontend/public ./public
COPY --from=frontend-builder --chown=appuser:nodejs /app/frontend/.next/standalone ./
COPY --from=frontend-builder --chown=appuser:nodejs /app/frontend/.next/static ./.next/static

# ============================================
# Supervisor Configuration
# ============================================
WORKDIR /app
RUN mkdir -p /var/log/supervisor

# Create supervisor configuration
RUN cat > /etc/supervisor/supervisord.conf << EOF
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:backend]
command=sh -c "cd /app/backend && npx prisma migrate deploy && node dist/server.js"
directory=/app/backend
user=appuser
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/backend.log
stderr_logfile=/var/log/supervisor/backend-error.log
environment=NODE_ENV="production"

[program:frontend]
command=node server.js
directory=/app/frontend
user=appuser
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/frontend.log
stderr_logfile=/var/log/supervisor/frontend-error.log
environment=NODE_ENV="production",PORT="3000"
EOF

# Expose ports
EXPOSE 3000 4000 5000

# Change ownership
RUN chown -R appuser:nodejs /app
RUN chown -R appuser:nodejs /var/log/supervisor

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]