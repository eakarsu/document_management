# Complete AWS Deployment Guide for Richmond DMS

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Step 1: Launch EC2 Instance](#step-1-launch-ec2-instance)
3. [Step 2: Configure Security Groups](#step-2-configure-security-groups)
4. [Step 3: Connect to EC2](#step-3-connect-to-ec2)
5. [Step 4: Install Docker](#step-4-install-docker)
6. [Step 5: Deploy Application](#step-5-deploy-application)
7. [Step 6: Access Your Application](#step-6-access-your-application)
8. [Optional: Production Enhancements](#optional-production-enhancements)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:
- ✅ AWS Account with billing enabled
- ✅ Basic understanding of SSH and terminal commands
- ✅ Your Docker image pushed to Docker Hub (`eakarsun4/richmond-dms:latest`)

**Estimated Cost:** ~$30-50/month for a t3.medium instance

---

## Step 1: Launch EC2 Instance

### 1.1 Login to AWS Console
1. Go to https://console.aws.amazon.com
2. Navigate to **EC2 Dashboard**
3. Click **Launch Instance**

### 1.2 Configure Instance

**Name and Tags:**
```
Name: richmond-dms-production
```

**Application and OS Images:**
```
- Amazon Machine Image (AMI): Ubuntu Server 22.04 LTS
- Architecture: 64-bit (x86)
```

**Instance Type:**
```
Recommended: t3.medium (2 vCPU, 4 GB RAM)
Minimum: t3.small (2 vCPU, 2 GB RAM) - for testing only
```

**Key Pair (login):**
```
1. Click "Create new key pair"
2. Key pair name: richmond-dms-key
3. Key pair type: RSA
4. Private key file format: .pem (for Mac/Linux) or .ppk (for Windows)
5. Click "Create key pair"
6. SAVE THE FILE - you'll need it to connect!
```

**Network Settings:**
```
- VPC: Default VPC
- Subnet: No preference
- Auto-assign public IP: Enable
```

**Configure Storage:**
```
- Size: 30 GB
- Volume Type: gp3 (General Purpose SSD)
- Delete on Termination: Yes
```

**Advanced Details:**
```
Leave as default
```

### 1.3 Launch Instance
1. Click **Launch Instance**
2. Wait for instance state to be **Running** (takes ~2 minutes)
3. **Note down your Public IPv4 address** - you'll need this!

---

## Step 2: Configure Security Groups

### 2.1 Edit Security Group Rules

1. In EC2 Dashboard, click on your instance
2. Click on the **Security** tab
3. Click on the Security Group link (e.g., `sg-xxxxx`)
4. Click **Edit inbound rules**

### 2.2 Add These Rules:

| Type            | Protocol | Port Range | Source Type | Source           | Description        |
|-----------------|----------|------------|-------------|------------------|--------------------|
| SSH             | TCP      | 22         | My IP       | Your IP/32       | SSH access         |
| Custom TCP      | TCP      | 3000       | Anywhere    | 0.0.0.0/0        | Frontend           |
| Custom TCP      | TCP      | 4000       | Anywhere    | 0.0.0.0/0        | Backend API        |
| Custom TCP      | TCP      | 5432       | My IP       | Your IP/32       | PostgreSQL (optional) |

**IMPORTANT:** For production, replace "Anywhere" (0.0.0.0/0) with your specific IP ranges or use a Load Balancer.

### 2.3 Save Rules
Click **Save rules**

---

## Step 3: Connect to EC2

### 3.1 Set Permissions on Your Key File

**On Mac/Linux:**
```bash
chmod 400 ~/Downloads/richmond-dms-key.pem
```

**On Windows (PowerShell):**
```powershell
icacls richmond-dms-key.pem /inheritance:r
icacls richmond-dms-key.pem /grant:r "%username%:R"
```

### 3.2 SSH Into Your Instance

Replace `YOUR_EC2_IP` with your actual public IP from Step 1.3:

**Mac/Linux:**
```bash
ssh -i ~/Downloads/richmond-dms-key.pem ubuntu@YOUR_EC2_IP
```

**Windows (PowerShell with OpenSSH):**
```powershell
ssh -i richmond-dms-key.pem ubuntu@YOUR_EC2_IP
```

**Windows (PuTTY):**
1. Convert .pem to .ppk using PuTTYgen
2. Use PuTTY to connect with the .ppk file

You should see:
```
Welcome to Ubuntu 22.04 LTS
ubuntu@ip-xxx-xx-xx-xx:~$
```

---

## Step 4: Install Docker

### 4.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 4.2 Install Docker
```bash
# Download and run Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker ubuntu

# Verify installation
docker --version
```

### 4.3 Install Docker Compose
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 4.4 Logout and Login Again
```bash
exit
```

Then reconnect via SSH (this makes the docker group membership take effect):
```bash
ssh -i ~/Downloads/richmond-dms-key.pem ubuntu@YOUR_EC2_IP
```

### 4.5 Test Docker
```bash
docker run hello-world
```

You should see "Hello from Docker!"

---

## Step 5: Deploy Application

### 5.1 Create Project Directory
```bash
mkdir -p ~/richmond-dms
cd ~/richmond-dms
```

### 5.2 Create `.env.aws` File

Replace `YOUR_EC2_IP` with your actual EC2 public IP:

```bash
cat > .env.aws << 'EOF'
NODE_ENV=production

# Database (using Docker PostgreSQL)
DATABASE_URL=postgresql://postgres:SecurePassword123!@postgres:5432/dms_dev
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SecurePassword123!
POSTGRES_DB=dms_dev

# Redis
REDIS_URL=redis://redis:6379

# JWT Secrets - CHANGE THESE!
JWT_SECRET=change_this_to_a_very_long_random_string_min_32_chars_abc123
JWT_REFRESH_SECRET=change_this_to_another_long_random_string_min_32_chars_xyz789

# Application URLs - REPLACE YOUR_EC2_IP with actual IP
BACKEND_URL=http://YOUR_EC2_IP:4000
FRONTEND_URL=http://YOUR_EC2_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP:4000
ALLOWED_ORIGINS=http://YOUR_EC2_IP:3000,http://YOUR_EC2_IP:4000

# Company Info
NEXT_PUBLIC_COMPANY_NAME=Richmond DMS
NEXT_PUBLIC_COMPANY_LOCATION=Richmond, VA

# AI Configuration (Optional)
OPENROUTER_API_KEY=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
OCR_MODEL=anthropic/claude-3-haiku
CLASSIFICATION_MODEL=anthropic/claude-3-haiku
EXTRACTION_MODEL=anthropic/claude-3-sonnet
ANALYSIS_MODEL=anthropic/claude-sonnet-4
SUMMARY_MODEL=openai/gpt-3.5-turbo

# Workflow AI Models
WORKFLOW_AI_MODEL=anthropic/claude-sonnet-4
DECISION_SUPPORT_MODEL=anthropic/claude-sonnet-4
PREDICTION_MODEL=anthropic/claude-sonnet-4
NLP_WORKFLOW_MODEL=anthropic/claude-sonnet-4
COLLABORATION_MODEL=anthropic/claude-sonnet-4
CONFLICT_RESOLUTION_MODEL=anthropic/claude-sonnet-4
ANALYTICS_MODEL=anthropic/claude-sonnet-4

# AI Cache Configuration (in milliseconds)
AI_CACHE_TIMEOUT=30000

# Storage Configuration
STORAGE_TYPE=filesystem
# For S3: uncomment and fill these
# STORAGE_TYPE=s3
# S3_BUCKET_NAME=richmond-dms-uploads
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Application Mode
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
NEXT_PUBLIC_ENABLE_LOGIN=true

# File Upload Limits
MAX_FILE_SIZE=104857600
MAX_BATCH_SIZE=10

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Logging
LOG_LEVEL=info
DEBUG=false

# Integration URLs
LEGAL_AI_FORMS_URL=https://legalaiforms.com
NORSHIN_VISION_URL=https://norshin.com
CASHFLOW_APP_URL=https://cashflowapp.app
CONTRACTS_URL=https://contracts.orderlybite.com
SECURITY_URL=https://security.orderlybite.com

# Domain and Organization
DEFAULT_ORGANIZATION_DOMAIN=yourdomain.com
COMPANY_NAME=Richmond DMS
COMPANY_LOCATION=Richmond, VA
EOF
```

**IMPORTANT:** Edit the file to replace placeholders:
```bash
nano .env.aws
```

Find and replace:
- `YOUR_EC2_IP` → Your actual EC2 IP (e.g., `54.123.45.67`)
- `SecurePassword123!` → A strong password
- The JWT secrets → Random 32+ character strings

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 5.3 Create `docker-compose.aws.yml`

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
    networks:
      - richmond-network

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
    networks:
      - richmond-network

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
    networks:
      - richmond-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  app_uploads:
    driver: local
  app_logs:
    driver: local

networks:
  richmond-network:
    driver: bridge
EOF
```

### 5.4 Pull Docker Image
```bash
docker pull eakarsun4/richmond-dms:latest
```

### 5.5 Start Services
```bash
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d
```

### 5.6 Check Status
```bash
# Check if all containers are running
docker-compose -f docker-compose.aws.yml ps

# View logs
docker-compose -f docker-compose.aws.yml logs -f app
```

Wait for this message:
```
✅ Richmond DMS Ready!
Frontend: http://localhost:3000
Backend: http://localhost:4000
```

Press `Ctrl+C` to exit logs.

---

## Step 6: Access Your Application

### 6.1 Open in Browser

Go to: **`http://YOUR_EC2_IP:3000`**

(Replace YOUR_EC2_IP with your actual IP)

### 6.2 Login

Use the default credentials:
- **Username:** `ao1`
- **Password:** (check your seed data)

Or create a new account if registration is enabled.

### 6.3 Verify Backend API

Test the backend directly:
```
http://YOUR_EC2_IP:4000/health
```

You should see: `{"status":"ok"}`

---

## 🎉 Congratulations!

Your Richmond DMS is now running on AWS!

---

## Optional: Production Enhancements

### 1. Set Up Custom Domain

#### Using Route 53:
1. Register or transfer domain to Route 53
2. Create A record pointing to EC2 IP
3. Update `.env.aws` with your domain:
   ```
   FRONTEND_URL=http://yourdomain.com
   BACKEND_URL=http://api.yourdomain.com
   ```

### 2. Enable HTTPS with SSL

#### Using Let's Encrypt (Free):

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/richmond-dms
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and get SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/richmond-dms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. Use AWS RDS for PostgreSQL

1. **Create RDS Instance:**
   - Go to AWS RDS Console
   - Create PostgreSQL 15 database
   - Choose db.t3.micro (free tier) or db.t3.medium (production)
   - Note the endpoint URL

2. **Update `.env.aws`:**
   ```bash
   DATABASE_URL=postgresql://admin:yourpass@your-rds-endpoint.rds.amazonaws.com:5432/dms_dev
   POSTGRES_HOST=your-rds-endpoint.rds.amazonaws.com
   ```

3. **Update `docker-compose.aws.yml`:**
   - Comment out the postgres service
   - Remove postgres dependency from app service

4. **Restart:**
   ```bash
   docker-compose -f docker-compose.aws.yml down
   docker-compose -f docker-compose.aws.yml up -d
   ```

### 4. Use AWS S3 for File Storage

1. **Create S3 Bucket:**
   ```bash
   aws s3 mb s3://richmond-dms-uploads
   ```

2. **Create IAM User with S3 access**
   - Go to IAM → Users → Create User
   - Attach AmazonS3FullAccess policy
   - Generate access keys

3. **Update `.env.aws`:**
   ```bash
   STORAGE_TYPE=s3
   S3_BUCKET_NAME=richmond-dms-uploads
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

4. **Restart application:**
   ```bash
   docker-compose -f docker-compose.aws.yml restart app
   ```

### 5. Set Up Automatic Backups

Create a backup script:
```bash
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec richmond-dms-postgres pg_dump -U postgres dms_dev | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://richmond-dms-backups/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x ~/backup.sh
```

Add to crontab (runs daily at 2 AM):
```bash
crontab -e
```

Add this line:
```
0 2 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

### 6. Monitor with CloudWatch

Install CloudWatch agent:
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

---

## Troubleshooting

### Application won't start

**Check logs:**
```bash
docker-compose -f docker-compose.aws.yml logs app
docker-compose -f docker-compose.aws.yml logs postgres
docker-compose -f docker-compose.aws.yml logs redis
```

**Check if ports are in use:**
```bash
sudo netstat -tulpn | grep -E '3000|4000|5432|6379'
```

**Restart services:**
```bash
docker-compose -f docker-compose.aws.yml restart
```

### Can't connect to application

**Check Security Group:**
- Ports 3000 and 4000 must be open
- Source should be 0.0.0.0/0 (or your IP)

**Check if services are running:**
```bash
docker ps
```

All 3 containers should be "Up":
- richmond-dms-app
- richmond-dms-postgres
- richmond-dms-redis

**Test from EC2:**
```bash
curl http://localhost:3000
curl http://localhost:4000/health
```

### Database connection errors

**Test database connection:**
```bash
docker exec richmond-dms-postgres psql -U postgres -d dms_dev -c "SELECT 1;"
```

**Check database logs:**
```bash
docker logs richmond-dms-postgres
```

**Recreate database:**
```bash
docker-compose -f docker-compose.aws.yml down -v
docker-compose -f docker-compose.aws.yml up -d
```

### Out of memory

**Check memory usage:**
```bash
free -h
docker stats
```

**Solution:** Upgrade to larger instance type (t3.medium or t3.large)

### SSL Certificate Issues

**Renew Let's Encrypt certificate:**
```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

## Maintenance Commands

### Update Application
```bash
cd ~/richmond-dms
docker-compose -f docker-compose.aws.yml pull
docker-compose -f docker-compose.aws.yml up -d
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.aws.yml logs -f

# Specific service
docker-compose -f docker-compose.aws.yml logs -f app
docker-compose -f docker-compose.aws.yml logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.aws.yml restart

# Specific service
docker-compose -f docker-compose.aws.yml restart app
```

### Stop Services
```bash
docker-compose -f docker-compose.aws.yml down
```

### Remove Everything (including data)
```bash
docker-compose -f docker-compose.aws.yml down -v
```

### Check Disk Space
```bash
df -h
docker system df
```

### Clean Up Docker
```bash
docker system prune -a
```

---

## Cost Optimization

### Estimated Monthly Costs:
- **EC2 t3.medium:** ~$30/month
- **30 GB EBS Storage:** ~$3/month
- **Data Transfer:** ~$1-5/month
- **Total:** ~$35-40/month

### To Reduce Costs:
1. Use t3.small for development ($15/month)
2. Stop instance when not in use
3. Use Reserved Instances for 1-year commitment (40% savings)
4. Use Spot Instances for development (70% savings)

---

## Security Best Practices

1. ✅ Change all default passwords
2. ✅ Use strong JWT secrets (32+ characters)
3. ✅ Restrict Security Group to specific IPs
4. ✅ Enable HTTPS with SSL certificate
5. ✅ Regular backups to S3
6. ✅ Keep system and Docker updated
7. ✅ Use AWS Secrets Manager for sensitive data
8. ✅ Enable CloudWatch monitoring
9. ✅ Use AWS WAF for additional protection
10. ✅ Implement regular security audits

---

## Need Help?

- **AWS Support:** https://console.aws.amazon.com/support
- **Docker Documentation:** https://docs.docker.com
- **Check Logs:** `docker-compose logs -f`
- **GitHub Issues:** Create an issue in your repository

---

## Next Steps

After deployment:
1. Configure your organization settings
2. Import users and roles
3. Set up workflows
4. Configure AI models
5. Test document creation and workflows
6. Set up backups
7. Monitor performance

Enjoy your Richmond DMS on AWS! 🚀
