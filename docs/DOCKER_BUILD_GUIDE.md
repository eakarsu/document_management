# Docker Build Guide for Document Management System

## Quick Start Commands

### For Mac (Apple Silicon M1/M2/M3)
```bash
# Simple build
docker build --platform linux/arm64 -t dms-app:latest .

# Build and run
docker build --platform linux/arm64 -t dms-app:latest . && \
docker run -d --name dms-app -p 3000:3000 -p 4000:4000 --env-file .env dms-app:latest

# Build with Docker Compose
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose build
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose up -d
```

### For Mac (Intel)
```bash
# Simple build
docker build --platform linux/amd64 -t dms-app:latest .

# Build and run
docker build --platform linux/amd64 -t dms-app:latest . && \
docker run -d --name dms-app -p 3000:3000 -p 4000:4000 --env-file .env dms-app:latest

# Build with Docker Compose
docker-compose build
docker-compose up -d
```

### For Linux (x86_64/AMD64)
```bash
# Simple build
docker build -t dms-app:latest .

# Build and run
docker build -t dms-app:latest . && \
docker run -d --name dms-app -p 3000:3000 -p 4000:4000 --env-file .env dms-app:latest

# Build with Docker Compose
docker-compose build
docker-compose up -d
```

### For Linux (ARM64/aarch64)
```bash
# Simple build
docker build --platform linux/arm64 -t dms-app:latest .

# Build and run
docker build --platform linux/arm64 -t dms-app:latest . && \
docker run -d --name dms-app -p 3000:3000 -p 4000:4000 --env-file .env dms-app:latest

# Build with Docker Compose
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose build
DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose up -d
```

## Using the Build Script

Make the script executable:
```bash
chmod +x docker-build.sh
```

### Basic Usage
```bash
# Production build (default)
./docker-build.sh

# Development build
./docker-build.sh development

# Build and run
./docker-build.sh production latest --run

# Clean old images and build
./docker-build.sh production latest --clean

# Build with Docker Compose
./docker-build.sh production latest --compose
```

### Platform-Specific Examples

#### Mac Apple Silicon (M1/M2/M3)
```bash
# Build for ARM64 (native)
./docker-build.sh production latest

# Build for both ARM64 and AMD64 (multi-architecture)
./docker-build.sh production latest --multi-arch

# Build and run natively
./docker-build.sh production latest --run
```

#### Mac Intel
```bash
# Build and run
./docker-build.sh production latest --run
```

#### Linux
```bash
# Build and run
./docker-build.sh production latest --run

# Build with Docker Compose
./docker-build.sh production latest --compose
```

## Manual Docker Commands

### Build Commands

#### Development Build
```bash
# Mac Apple Silicon
docker build \
  --platform linux/arm64 \
  --build-arg NODE_ENV=development \
  -t dms-app:dev \
  .

# Mac Intel / Linux x86_64
docker build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=development \
  -t dms-app:dev \
  .

# Linux ARM64
docker build \
  --platform linux/arm64 \
  --build-arg NODE_ENV=development \
  -t dms-app:dev \
  .
```

#### Production Build
```bash
# Mac Apple Silicon
docker build \
  --platform linux/arm64 \
  --build-arg NODE_ENV=production \
  -t dms-app:latest \
  .

# Mac Intel / Linux x86_64
docker build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=production \
  -t dms-app:latest \
  .

# Linux ARM64
docker build \
  --platform linux/arm64 \
  --build-arg NODE_ENV=production \
  -t dms-app:latest \
  .
```

### Run Commands

#### Basic Run
```bash
docker run -d \
  --name dms-app \
  -p 3000:3000 \
  -p 4000:4000 \
  --env-file .env \
  dms-app:latest
```

#### Run with Volume Mounts
```bash
docker run -d \
  --name dms-app \
  -p 3000:3000 \
  -p 4000:4000 \
  -v $(pwd)/uploads:/app/backend/uploads \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  --restart unless-stopped \
  dms-app:latest
```

#### Run with Custom Environment
```bash
docker run -d \
  --name dms-app \
  -p 3000:3000 \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e APP_MODE=production \
  -e NEXT_PUBLIC_APP_MODE=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e MONGODB_URL=mongodb://user:pass@host:27017/db \
  --env-file .env \
  dms-app:latest
```

## Docker Compose Commands

### Build All Services
```bash
# Standard build
docker-compose build

# Parallel build (faster)
docker-compose build --parallel

# Force rebuild
docker-compose build --no-cache

# Build specific service
docker-compose build app
```

### Run Services
```bash
# Start all services (detached)
docker-compose up -d

# Start with build
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Platform-Specific Docker Compose

#### Mac Apple Silicon
```bash
# Set default platform for all services
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker-compose up -d --build
```

#### Linux ARM64
```bash
# Set default platform for all services
export DOCKER_DEFAULT_PLATFORM=linux/arm64
docker-compose up -d --build
```

## Multi-Architecture Builds

### Build for Multiple Platforms
```bash
# Create builder
docker buildx create --name mybuilder --use

# Build for multiple platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t dms-app:latest \
  --push \
  .

# Build and load locally (single platform only)
docker buildx build \
  --platform linux/arm64 \
  -t dms-app:latest \
  --load \
  .
```

## Troubleshooting

### Mac Apple Silicon Issues
```bash
# If you encounter platform issues
export DOCKER_DEFAULT_PLATFORM=linux/arm64

# Check current platform
docker version --format '{{.Server.Arch}}'

# Force platform in docker-compose.yml
# Add under service definition:
# platform: linux/arm64
```

### Linux Permission Issues
```bash
# Fix permission issues
sudo chown -R $USER:$USER ./uploads ./logs

# Run with user namespace
docker run --userns-remap=default ...
```

### Build Cache Issues
```bash
# Clear build cache
docker builder prune -a

# Build without cache
docker build --no-cache -t dms-app:latest .

# Remove all unused images
docker image prune -a
```

### Memory Issues
```bash
# Increase memory for Docker Desktop (Mac)
# Docker Desktop > Preferences > Resources > Memory

# For Linux, check available memory
free -h

# Build with memory limits
docker build --memory=4g -t dms-app:latest .
```

## Container Management

### View Running Containers
```bash
docker ps

# View all containers (including stopped)
docker ps -a

# View container logs
docker logs dms-app

# Follow logs
docker logs -f dms-app

# View last 100 lines
docker logs --tail 100 dms-app
```

### Stop and Remove
```bash
# Stop container
docker stop dms-app

# Remove container
docker rm dms-app

# Stop and remove
docker rm -f dms-app

# Remove image
docker rmi dms-app:latest
```

### Execute Commands in Container
```bash
# Open shell in running container
docker exec -it dms-app sh

# Run specific command
docker exec dms-app npm list

# Check Node.js version
docker exec dms-app node --version
```

## Health Checks

### Check Container Health
```bash
# View health status
docker inspect --format='{{.State.Health.Status}}' dms-app

# View health check logs
docker inspect --format='{{json .State.Health}}' dms-app | jq

# Manual health check
curl http://localhost:3000/health
curl http://localhost:4000/health
```

## Environment Variables

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/db
MONGODB_URL=mongodb://user:pass@mongodb:27017/db
REDIS_URL=redis://redis:6379

# Authentication
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret

# API Keys
OPENROUTER_API_KEY=your_api_key

# Application Mode
APP_MODE=production
NEXT_PUBLIC_APP_MODE=production
NEXT_PUBLIC_ENABLE_LOGIN=false
```

### Pass Environment Variables
```bash
# Using env file
docker run --env-file .env dms-app:latest

# Individual variables
docker run \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=secret \
  dms-app:latest

# Mix both
docker run \
  --env-file .env \
  -e APP_MODE=development \
  dms-app:latest
```

## Production Deployment

### Security Best Practices
```bash
# Don't run as root
# Already handled in Dockerfile with non-root user

# Use secrets for sensitive data
docker secret create jwt_secret ./jwt_secret.txt
docker service create --secret jwt_secret ...

# Limit resources
docker run \
  --memory=2g \
  --cpus=2 \
  --restart=on-failure:3 \
  dms-app:latest
```

### Monitoring
```bash
# View resource usage
docker stats dms-app

# Export metrics
docker run \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -p 9090:9090 \
  prom/prometheus
```

## Support

For issues specific to:
- **Mac Apple Silicon**: Ensure you're using `--platform linux/arm64`
- **Linux**: Check Docker daemon permissions and available resources
- **Windows**: Use WSL2 for best compatibility

Run `./docker-build.sh --help` for more options.