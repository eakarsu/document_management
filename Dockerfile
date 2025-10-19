# Simplified Dockerfile for workspace-based monorepo
FROM node:24-alpine3.21

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_APP_MODE=production
ARG NEXT_PUBLIC_ENABLE_LOGIN=true
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_COMPANY_NAME="Richmond DMS"
ARG NEXT_PUBLIC_COMPANY_LOCATION="Richmond, VA"

# Set as environment variables so Next.js can access them during build
ENV NEXT_PUBLIC_APP_MODE=$NEXT_PUBLIC_APP_MODE
ENV NEXT_PUBLIC_ENABLE_LOGIN=$NEXT_PUBLIC_ENABLE_LOGIN
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME
ENV NEXT_PUBLIC_COMPANY_LOCATION=$NEXT_PUBLIC_COMPANY_LOCATION

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    postgresql-client \
    bash \
    curl

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install ALL dependencies (workspaces)
RUN npm install --legacy-peer-deps

# Copy backend source
COPY backend ./backend

# Copy frontend source
COPY frontend ./frontend

# Generate Prisma client
WORKDIR /app/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# Build frontend
WORKDIR /app/frontend
RUN npm run build

# Create startup script
WORKDIR /app
RUN cat > /app/start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Richmond DMS..."

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-postgres}; do
  echo "Waiting..."
  sleep 2
done
echo "✅ PostgreSQL ready!"

# Run migrations with db push (bypasses corrupted migration files)
echo "🔄 Pushing database schema..."
cd /app/backend
npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss
echo "✅ Schema pushed successfully!"

# Check if database needs seeding
echo "🌱 Checking if database needs seeding..."
USER_COUNT=$(npx prisma db execute --stdin --schema=./prisma/schema.prisma <<< "SELECT COUNT(*) as count FROM users;" 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "📦 Database is empty, running seed script..."
  npx ts-node ./prisma/seed-all.ts
  echo "✅ Database seeded successfully!"
else
  echo "ℹ️  Database already contains $USER_COUNT users, skipping seed"
fi

# Start backend
echo "🚀 Starting backend..."
cd /app/backend
node dist/server.js &
BACKEND_PID=$!

# Wait for backend
sleep 10

# Start frontend
echo "🚀 Starting frontend..."
cd /app/frontend
npx next start &
FRONTEND_PID=$!

echo "=========================================="
echo "✅ Richmond DMS Ready!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:4000"
echo "=========================================="

# Keep running
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGTERM SIGINT
wait
EOF

RUN chmod +x /app/start.sh

EXPOSE 3000 4000

CMD ["/app/start.sh"]
