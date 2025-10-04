#!/bin/bash

# Richmond DMS - AWS Deployment Script
# This script deploys the application on an AWS EC2 instance

set -e

echo "🚀 Richmond DMS - AWS Deployment"
echo "================================"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Installing..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Check if .env.aws exists
if [ ! -f .env.aws ]; then
    echo "❌ .env.aws file not found!"
    echo "📝 Please create .env.aws from .env.aws.example and configure your settings"
    exit 1
fi

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.aws.yml --env-file .env.aws down || true

# Pull latest image
echo "📥 Pulling latest image..."
docker pull eakarsun4/richmond-dms:latest

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking health..."
docker-compose -f docker-compose.aws.yml --env-file .env.aws ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs:"
echo "  Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "  Backend:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4000"
echo ""
echo "📝 View logs: docker-compose -f docker-compose.aws.yml --env-file .env.aws logs -f"
echo "🛑 Stop services: docker-compose -f docker-compose.aws.yml --env-file .env.aws down"
