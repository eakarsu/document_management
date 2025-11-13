# Quick Start Guide - AWS Deployment

## 🚀 Deploy Richmond DMS on AWS in 5 Minutes

### Prerequisites
- AWS EC2 instance (t3.medium or larger recommended)
- Ubuntu 22.04 LTS
- Open ports: 22 (SSH), 3000 (Frontend), 4000 (Backend)

---

## Step 1: Get Your EC2 Public IP

After launching your EC2 instance, note your public IP address. You'll need this!

```bash
# Example: 54.123.45.67
```

---

## Step 2: SSH into EC2 and Install Docker

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
```

---

## Step 3: Create `.env.aws` File

SSH back in and create the environment file:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Create the .env.aws file
cat > .env.aws << 'EOF'
NODE_ENV=production

# Database (using Docker PostgreSQL)
DATABASE_URL=postgresql://postgres:YourStrongPassword123!@postgres:5432/dms_dev
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YourStrongPassword123!
POSTGRES_DB=dms_dev

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets - CHANGE THESE!
JWT_SECRET=your_random_secret_key_min_32_characters_long_abc123xyz
JWT_REFRESH_SECRET=your_random_refresh_key_min_32_characters_long_def456uvw

# Application URLs - REPLACE WITH YOUR EC2 IP!
BACKEND_URL=http://YOUR_EC2_IP:4000
FRONTEND_URL=http://YOUR_EC2_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:4000
ALLOWED_ORIGINS=http://YOUR_EC2_IP:3000,http://YOUR_EC2_IP:4000

# Company Info
NEXT_PUBLIC_COMPANY_NAME=Richmond DMS
NEXT_PUBLIC_COMPANY_LOCATION=Richmond, VA

# AI Configuration (Optional - keep your OpenRouter key)
OPENROUTER_API_KEY=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
OCR_MODEL=anthropic/claude-3-haiku
CLASSIFICATION_MODEL=anthropic/claude-3-haiku
EXTRACTION_MODEL=anthropic/claude-3-sonnet
ANALYSIS_MODEL=anthropic/claude-sonnet-4

# Storage (Filesystem by default, or use S3)
STORAGE_TYPE=filesystem
# For S3: uncomment and fill these
# STORAGE_TYPE=s3
# S3_BUCKET_NAME=richmond-dms-uploads
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret

# Application Mode
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
NEXT_PUBLIC_ENABLE_LOGIN=true

# File Upload Limits
MAX_FILE_SIZE=104857600
MAX_BATCH_SIZE=10

# Logging
LOG_LEVEL=info
DEBUG=false
EOF

# IMPORTANT: Edit the file and replace YOUR_EC2_IP with your actual IP
nano .env.aws
# Use Ctrl+X, then Y, then Enter to save
```

---

## Step 4: Create `docker-compose.aws.yml`

```bash
cat > docker-compose.aws.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: richmond-dms-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: richmond-dms-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  app:
    image: eakarsun4/richmond-dms:latest
    container_name: richmond-dms-app
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    env_file:
      - .env.aws
    ports:
      - "3000:3000"
      - "4000:4000"
    volumes:
      - app_uploads:/app/uploads
      - app_logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
  redis_data:
  app_uploads:
  app_logs:
EOF
```

---

## Step 5: Deploy!

```bash
# Pull the latest image
docker pull eakarsun4/richmond-dms:latest

# Start all services
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d

# Check status
docker-compose -f docker-compose.aws.yml ps

# View logs
docker-compose -f docker-compose.aws.yml logs -f app
```

---

## Step 6: Access Your Application

Open your browser and go to:

```
http://YOUR_EC2_IP:3000
```

**Default login:** `ao1` / `password` (or your configured users)

---

## 🎉 You're Done!

Your Richmond DMS is now running on AWS!

---

## Common Commands

```bash
# Stop all services
docker-compose -f docker-compose.aws.yml down

# Restart services
docker-compose -f docker-compose.aws.yml restart

# View logs
docker-compose -f docker-compose.aws.yml logs -f

# Update to latest version
docker-compose -f docker-compose.aws.yml pull
docker-compose -f docker-compose.aws.yml up -d

# Backup database
docker exec richmond-dms-postgres pg_dump -U postgres dms_dev > backup.sql

# Restore database
cat backup.sql | docker exec -i richmond-dms-postgres psql -U postgres dms_dev
```

---

## Troubleshooting

### Can't access the application?
1. Check EC2 Security Group allows ports 3000 and 4000
2. Verify services are running: `docker-compose -f docker-compose.aws.yml ps`
3. Check logs: `docker-compose -f docker-compose.aws.yml logs`

### Database connection errors?
```bash
# Check database is running
docker exec richmond-dms-postgres psql -U postgres -c "SELECT 1;"

# Check connection from app
docker exec richmond-dms-app env | grep DATABASE_URL
```

### Application errors?
```bash
# Check app logs
docker logs richmond-dms-app

# Restart app
docker-compose -f docker-compose.aws.yml restart app
```

---

## Production Recommendations

For production use, consider:

1. **Use AWS RDS** instead of containerized PostgreSQL
2. **Use AWS ElastiCache** for Redis
3. **Use AWS S3** for file storage (set `STORAGE_TYPE=s3`)
4. **Set up SSL/TLS** with a domain name
5. **Use Application Load Balancer** for high availability
6. **Enable CloudWatch** for monitoring
7. **Regular backups** to S3

See `AWS_DEPLOYMENT.md` for detailed production setup instructions.

---

## Need Help?

- Check logs: `docker-compose -f docker-compose.aws.yml logs -f`
- Review AWS_DEPLOYMENT.md for detailed instructions
- Ensure all environment variables in `.env.aws` are set correctly
