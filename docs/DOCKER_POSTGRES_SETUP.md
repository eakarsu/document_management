# PostgreSQL Container Setup for AWS Deployment

## ✅ Setup Complete

### Files Created:

1. **docker-compose.yml** (Updated)
   - PostgreSQL container on **port 5433** (external)
   - Database: `dms_prod`
   - Avoids conflict with local PostgreSQL on port 5432

2. **docker-compose.local.yml** (NEW)
   - For local development
   - Uses host PostgreSQL on port 5432
   - No PostgreSQL container

3. **docker-compose.aws.yml** (NEW)
   - For AWS/Production deployment
   - PostgreSQL container on port 5433
   - Includes Redis
   - Production-ready settings

4. **migrate-data.sh** (NEW)
   - Migrates data from local PostgreSQL → Docker PostgreSQL
   - Automatic backup and restore
   - Verification included

---

## 🚀 How to Use

### **Local Development** (Uses your local PostgreSQL on 5432):

```bash
docker-compose -f docker-compose.local.yml up -d
```

**App connects to:** `postgresql://postgres@host.docker.internal:5432/dms_dev`

---

### **AWS/Production** (Uses containerized PostgreSQL on 5433):

```bash
# Step 1: Start PostgreSQL container first
docker-compose -f docker-compose.aws.yml up -d postgres redis

# Step 2: Wait for PostgreSQL to be ready (30 seconds)
sleep 30

# Step 3: Migrate data from local to container
./migrate-data.sh

# Step 4: Start the app
docker-compose -f docker-compose.aws.yml up -d app
```

**App connects to:** `postgresql://dms_user:dms_password@postgres:5432/dms_prod`

---

## 📊 Port Mappings

| Service | Local Port | Container Port | Used For |
|---------|-----------|---------------|----------|
| PostgreSQL (Local) | 5432 | - | Local development |
| PostgreSQL (Docker) | 5433 | 5432 | AWS/Production |
| Redis | 6379 | 6379 | Both |
| Backend API | 4000 | 4000 | Both |
| Frontend | 3000 | 3000 | Both |

---

## 🔄 Migration Process

### Automated Migration:

```bash
# Start PostgreSQL container
docker-compose -f docker-compose.aws.yml up -d postgres

# Wait for it to be ready
sleep 30

# Run migration script
./migrate-data.sh
```

### Manual Migration:

```bash
# 1. Export from local PostgreSQL
pg_dump -h localhost -p 5432 -U postgres -d dms_dev > backup.sql

# 2. Import to Docker PostgreSQL
PGPASSWORD=dms_password psql -h localhost -p 5433 -U dms_user -d dms_prod < backup.sql
```

---

## 🔐 Database Credentials

### Local PostgreSQL (Port 5432):
```
Host: localhost
Port: 5432
Database: dms_dev
User: postgres
Password: (your local password)
```

### Docker PostgreSQL (Port 5433):
```
Host: localhost (external) OR postgres (internal container network)
Port: 5433 (external) OR 5432 (internal)
Database: dms_prod
User: dms_user
Password: dms_password (change in production!)
```

---

## 🧪 Testing

### Test Docker PostgreSQL:

```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Test connection from host
PGPASSWORD=dms_password psql -h localhost -p 5433 -U dms_user -d dms_prod -c "SELECT version();"

# Check from inside container
docker exec -it dms_postgres_aws psql -U dms_user -d dms_prod -c "\dt"
```

### Test App Connection:

```bash
# Start app with AWS config
docker-compose -f docker-compose.aws.yml up -d

# Check logs
docker logs dms_app_aws

# Test backend health
curl http://localhost:4000/health

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ao1@airforce.mil","password":"password123"}'
```

---

## 📝 Environment Variables

### For docker-compose.aws.yml:

Create `.env` file:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# API URLs (for AWS deployment)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# App Mode
NEXT_PUBLIC_APP_MODE=production

# Company Info
NEXT_PUBLIC_COMPANY_NAME=Richmond DMS
NEXT_PUBLIC_COMPANY_LOCATION=Richmond, VA
```

---

## 🔄 Common Commands

```bash
# LOCAL DEVELOPMENT
docker-compose -f docker-compose.local.yml up -d    # Start
docker-compose -f docker-compose.local.yml down     # Stop
docker-compose -f docker-compose.local.yml logs -f  # View logs

# AWS/PRODUCTION
docker-compose -f docker-compose.aws.yml up -d      # Start all
docker-compose -f docker-compose.aws.yml up -d postgres  # Start only PostgreSQL
docker-compose -f docker-compose.aws.yml down       # Stop all
docker-compose -f docker-compose.aws.yml logs -f app     # View app logs

# DATA MIGRATION
./migrate-data.sh                                    # Migrate data

# DATABASE ACCESS
PGPASSWORD=dms_password psql -h localhost -p 5433 -U dms_user -d dms_prod

# BACKUP
docker exec dms_postgres_aws pg_dump -U dms_user dms_prod > backup.sql

# RESTORE
docker exec -i dms_postgres_aws psql -U dms_user dms_prod < backup.sql
```

---

## 🎯 Deployment Workflow

### 1. **Local Development:**
```bash
docker-compose -f docker-compose.local.yml up -d
# Uses local PostgreSQL on 5432
```

### 2. **Test with Containerized PostgreSQL:**
```bash
docker-compose -f docker-compose.aws.yml up -d postgres redis
./migrate-data.sh
docker-compose -f docker-compose.aws.yml up -d app
# Uses Docker PostgreSQL on 5433
```

### 3. **Deploy to AWS:**
```bash
# Push to AWS ECR/Docker Hub
docker-compose -f docker-compose.aws.yml build
docker tag richmond-dms:latest your-registry/richmond-dms:latest
docker push your-registry/richmond-dms:latest

# On AWS instance
docker-compose -f docker-compose.aws.yml up -d
```

---

## ⚠️ Important Notes

1. **Port 5433 vs 5432:**
   - External (host): Use 5433 to avoid conflict
   - Internal (container network): PostgreSQL listens on 5432
   - App connects to `postgres:5432` (container name)

2. **Data Persistence:**
   - Docker PostgreSQL data stored in volume `postgres_data`
   - Survives container restarts
   - Backup regularly!

3. **Security:**
   - Change default passwords in production
   - Use environment variables for secrets
   - Don't commit `.env` files

4. **Network:**
   - Containers communicate via `dms_network`
   - Use container names as hostnames (e.g., `postgres`, `redis`)

---

## ✅ Verification Checklist

- [ ] PostgreSQL container starts on port 5433
- [ ] Can connect from host: `psql -h localhost -p 5433`
- [ ] Data migrated successfully
- [ ] App connects to containerized PostgreSQL
- [ ] Backend health check passes
- [ ] Login works with test users
- [ ] Frontend loads correctly

---

**Your PostgreSQL container is ready for AWS deployment!** 🎉
