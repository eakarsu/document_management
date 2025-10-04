# AWS Deployment Guide for Richmond DMS

## Prerequisites

1. **AWS EC2 Instance** (recommended: t3.medium or larger)
   - Ubuntu 22.04 LTS or Amazon Linux 2023
   - At least 4GB RAM
   - 20GB+ storage

2. **Security Group Configuration**
   - Port 22 (SSH)
   - Port 3000 (Frontend)
   - Port 4000 (Backend)
   - Port 5432 (PostgreSQL) - optional, only if external access needed
   - Port 6379 (Redis) - optional, only if external access needed

## Quick Start - Using Docker Compose (Recommended)

### Step 1: SSH into your EC2 instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Install Docker and Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Logout and login again for group changes to take effect
exit
# SSH back in
ssh -i your-key.pem ubuntu@your-ec2-ip

# Verify Docker installation
docker --version
```

### Step 3: Clone or upload your project files

```bash
# Option 1: Clone from git (if you have a repo)
git clone your-repo-url
cd richmond-dms

# Option 2: Upload files using scp
# On your local machine:
# scp -i your-key.pem docker-compose.aws.yml ubuntu@your-ec2-ip:~/
# scp -i your-key.pem .env.aws.example ubuntu@your-ec2-ip:~/
```

### Step 4: Configure environment

```bash
# Copy and edit the environment file
cp .env.aws.example .env.aws
nano .env.aws

# Update these values:
# - POSTGRES_PASSWORD (use a strong password)
# - JWT_SECRET (generate a random string)
# - JWT_REFRESH_SECRET (generate a random string)
# - FRONTEND_URL (http://YOUR_EC2_PUBLIC_IP:3000)
# - BACKEND_URL (http://YOUR_EC2_PUBLIC_IP:4000)
```

### Step 5: Deploy

```bash
# Make deployment script executable
chmod +x deploy-aws.sh

# Run deployment
./deploy-aws.sh
```

## Alternative - Manual Docker Run (Without Database)

If you already have a PostgreSQL database elsewhere:

```bash
docker run -d \
  --name richmond-dms \
  -p 3000:3000 \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:password@your-db-host:5432/dms_dev" \
  -e POSTGRES_HOST=your-db-host \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER=your-user \
  -e POSTGRES_PASSWORD=your-password \
  -e JWT_SECRET=your_secret_key \
  -e JWT_REFRESH_SECRET=your_refresh_secret \
  -e REDIS_URL=redis://your-redis-host:6379 \
  -e FRONTEND_URL=http://your-ec2-ip:3000 \
  -e BACKEND_URL=http://your-ec2-ip:4000 \
  eakarsun4/richmond-dms:latest
```

## Using AWS RDS for PostgreSQL (Production Recommended)

### Step 1: Create RDS PostgreSQL Instance

1. Go to AWS RDS Console
2. Create PostgreSQL 15 database
3. Choose appropriate instance size (db.t3.micro for testing, db.t3.medium+ for production)
4. Enable public accessibility if connecting from EC2 in different VPC
5. Note the endpoint URL

### Step 2: Update .env.aws

```bash
DATABASE_URL=postgresql://admin:yourpassword@your-rds-endpoint.rds.amazonaws.com:5432/dms_dev
POSTGRES_HOST=your-rds-endpoint.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=yourpassword
```

### Step 3: Update docker-compose.aws.yml

Comment out the postgres service and update the app service:

```yaml
services:
  # postgres:  # Comment out if using RDS
  #   ...

  app:
    # Remove depends_on postgres if using external database
    depends_on:
      redis:
        condition: service_healthy
```

## Using AWS ElastiCache for Redis (Production Recommended)

### Step 1: Create ElastiCache Redis Cluster

1. Go to AWS ElastiCache Console
2. Create Redis cluster
3. Note the endpoint URL

### Step 2: Update .env.aws

```bash
REDIS_URL=redis://your-elasticache-endpoint:6379
```

## Using AWS S3 for File Storage (Recommended for Production)

### Step 1: Create S3 Bucket

```bash
aws s3 mb s3://richmond-dms-uploads
```

### Step 2: Create IAM User with S3 Access

Create IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::richmond-dms-uploads/*",
        "arn:aws:s3:::richmond-dms-uploads"
      ]
    }
  ]
}
```

### Step 3: Update .env.aws

```bash
STORAGE_TYPE=s3
S3_BUCKET_NAME=richmond-dms-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.aws.yml --env-file .env.aws logs -f

# Specific service
docker-compose -f docker-compose.aws.yml --env-file .env.aws logs -f app
```

### Check Service Status

```bash
docker-compose -f docker-compose.aws.yml --env-file .env.aws ps
```

### Restart Services

```bash
docker-compose -f docker-compose.aws.yml --env-file .env.aws restart
```

### Update to Latest Version

```bash
docker-compose -f docker-compose.aws.yml --env-file .env.aws pull
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d
```

### Backup Database

```bash
# If using local PostgreSQL container
docker exec richmond-dms-postgres pg_dump -U postgres dms_dev > backup.sql

# If using RDS
pg_dump -h your-rds-endpoint.rds.amazonaws.com -U admin dms_dev > backup.sql
```

## Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Use AWS RDS for PostgreSQL
- [ ] Use AWS ElastiCache for Redis
- [ ] Use AWS S3 for file storage
- [ ] Configure SSL/TLS certificates
- [ ] Set up Application Load Balancer
- [ ] Configure CloudWatch for monitoring
- [ ] Set up automated backups
- [ ] Configure auto-scaling
- [ ] Use environment-specific domains
- [ ] Enable AWS WAF for security
- [ ] Configure VPC and security groups properly

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs richmond-dms-app

# Check if ports are in use
sudo netstat -tulpn | grep -E '3000|4000'
```

### Can't connect to database

```bash
# Test database connection
docker exec richmond-dms-postgres psql -U postgres -d dms_dev -c "SELECT 1;"

# Check database logs
docker logs richmond-dms-postgres
```

### Performance issues

- Upgrade EC2 instance type
- Use RDS instead of containerized PostgreSQL
- Enable CloudFront CDN
- Configure Redis caching
- Use S3 for static assets

## Support

For issues, please check:
- Application logs
- AWS CloudWatch metrics
- Security group configuration
- Database connectivity
