# Docker Build & Test Instructions

## Commands to Build Docker Image

### 1. **Build the Image** (First time: 5-10 minutes)

```bash
cd /Users/erolakarsu/projects/document_management

# Build with progress output
docker build -t richmond-dms:latest .

# Or build with detailed logs
docker build -t richmond-dms:latest . 2>&1 | tee docker-build.log
```

### 2. **Check if Build Succeeded**

```bash
# List Docker images
docker images | grep richmond-dms

# Expected output:
# richmond-dms  latest  <IMAGE_ID>  X minutes ago  ~450MB
```

### 3. **Test the Image (Without Docker Compose)**

```bash
# Start just PostgreSQL first
docker run -d \
  --name test-postgres \
  -e POSTGRES_DB=dms_metadata \
  -e POSTGRES_USER=dms_user \
  -e POSTGRES_PASSWORD=dms_password \
  -p 5432:5432 \
  postgres:15-alpine

# Wait a few seconds for PostgreSQL to start
sleep 5

# Run the app container
docker run -d \
  --name test-richmond-dms \
  -p 3000:3000 \
  -p 4000:4000 \
  -e DATABASE_URL=postgresql://dms_user:dms_password@host.docker.internal:5432/dms_metadata \
  -e JWT_SECRET=test_jwt_secret_key_12345 \
  -e JWT_REFRESH_SECRET=test_jwt_refresh_secret_12345 \
  richmond-dms:latest

# Watch the logs
docker logs -f test-richmond-dms
```

### 4. **Verify It's Working**

```bash
# Wait about 60 seconds for startup, then test:

# Check backend health
curl http://localhost:4000/health

# Test login API
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ao1@airforce.mil","password":"password123"}'

# Open browser
open http://localhost:3000
```

### 5. **Stop Test Containers**

```bash
docker stop test-richmond-dms test-postgres
docker rm test-richmond-dms test-postgres
```

---

## Using Docker Compose (Recommended)

### 1. **Start Full Stack**

```bash
cd /Users/erolakarsu/projects/document_management

# Build and start all services
docker-compose up --build -d

# Or start without rebuilding
docker-compose up -d
```

### 2. **View Logs**

```bash
# All services
docker-compose logs -f

# Just the app
docker-compose logs -f app

# Just PostgreSQL
docker-compose logs -f postgres
```

### 3. **Check Service Status**

```bash
docker-compose ps
```

Expected output:
```
NAME                  STATUS          PORTS
dms_app               Up X minutes    0.0.0.0:3000->3000/tcp, 0.0.0.0:4000->4000/tcp
dms_postgres          Up X minutes    0.0.0.0:5432->5432/tcp
dms_mongodb           Up X minutes    0.0.0.0:27017->27017/tcp
dms_redis             Up X minutes    0.0.0.0:6379->6379/tcp
dms_elasticsearch     Up X minutes    0.0.0.0:9200->9200/tcp
dms_rabbitmq          Up X minutes    0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
dms_minio             Up X minutes    0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
```

### 4. **Access Services**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health
- **GraphQL**: http://localhost:4000/graphql
- **MinIO Console**: http://localhost:9001 (user: dms_user, pass: dms_password)
- **RabbitMQ Management**: http://localhost:15672 (user: dms_user, pass: dms_password)

### 5. **Stop All Services**

```bash
# Stop but keep data
docker-compose stop

# Stop and remove containers (keeps volumes/data)
docker-compose down

# Stop and remove everything including data
docker-compose down -v
```

---

## Troubleshooting

### Build is Taking Too Long (>10 minutes)

```bash
# Check build progress
docker ps -a

# Check build logs from another terminal
docker logs <container_id>

# Cancel and rebuild with no cache
docker build --no-cache -t richmond-dms:latest .
```

### Build Failed

```bash
# Check error logs
tail -100 docker-build.log

# Common issues:
# 1. date-fns version - Already fixed in Dockerfile
# 2. Out of disk space - Run: docker system prune
# 3. Out of memory - Increase Docker Desktop memory (8GB recommended)
```

### Container Won't Start

```bash
# Check logs
docker logs <container_name>

# Common issues:
# 1. Port already in use - Stop local dev servers first
# 2. Database not ready - Wait 60 seconds after docker-compose up
# 3. Missing env vars - Check docker-compose.yml
```

### Login Not Working

```bash
# Exec into container and check database
docker exec -it dms_app sh
cd /app/backend
npx prisma db execute --stdin <<'SQL'
SELECT email FROM users LIMIT 5;
SQL

# Should show test users like ao1@airforce.mil
```

---

## Quick Commands Reference

```bash
# Build image
docker build -t richmond-dms:latest .

# Start with compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Clean everything
docker-compose down -v
docker system prune -a
```

---

## Build Time Estimates

**First build:**
- With cache: 5-7 minutes
- No cache: 10-15 minutes

**Subsequent builds:**
- With changes: 1-3 minutes
- No changes: 10-30 seconds

**Image sizes:**
- Development (node_modules): ~1.2 GB
- Production (multi-stage): ~450 MB
