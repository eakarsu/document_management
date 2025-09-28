# Simple Dockerfile that uses the working start.sh script
FROM node:18-alpine

# Install required dependencies
RUN apk add --no-cache python3 make g++ openssl openssl-dev postgresql-client bash

WORKDIR /app

# Copy everything
COPY . .

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --force

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN npm run build

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install --force --legacy-peer-deps
RUN npm install date-fns@2.30.0 --save --force

# Build frontend in development mode to avoid authentication issues
RUN echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local && \
    echo "BACKEND_URL=http://localhost:4000" >> .env.local && \
    echo "NEXT_PUBLIC_APP_MODE=development" >> .env.local && \
    echo "NEXT_PUBLIC_ENABLE_LOGIN=true" >> .env.local

WORKDIR /app

# Create a Docker-specific startup script
RUN cat > /app/docker-start.sh << 'EOF'
#!/bin/bash
cd /app

# Skip PostgreSQL check in Docker - use host.docker.internal
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@host.docker.internal:5432/dms_dev}"

# Start backend
echo "🚀 Starting backend server..."
cd /app/backend
npm start &

# Wait for backend to start
sleep 10

# Start frontend in dev mode for proper cookie handling
echo "🚀 Starting frontend server (this will take 1-2 minutes first time)..."
cd /app/frontend
# Set higher timeout for dev server
export NODE_OPTIONS="--max-old-space-size=2048"
timeout 600 npm run dev &

# Keep container running
echo "✅ Services started. Access at http://localhost:3000"
wait
EOF

RUN chmod +x /app/docker-start.sh

EXPOSE 3000 4000

CMD ["/app/docker-start.sh"]