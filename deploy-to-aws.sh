#!/bin/bash

echo "Richmond DMS AWS Deployment"
echo "============================"
echo ""

# Step 1: Pull the latest Docker image
echo "Step 1: Pulling latest Docker image..."
docker pull eakarsun4/richmond-dms:latest

# Step 2: Stop any running containers
echo ""
echo "Step 2: Stopping any existing containers..."
docker-compose -f docker-compose.aws.yml down 2>/dev/null || true

# Step 3: Start all services
echo ""
echo "Step 3: Starting all services..."
docker-compose -f docker-compose.aws.yml up -d

# Step 4: Wait for services to start
echo ""
echo "Step 4: Waiting for services to initialize (30 seconds)..."
sleep 30

# Step 5: Check status
echo ""
echo "Step 5: Checking service status..."
docker-compose -f docker-compose.aws.yml ps

# Step 6: Show logs
echo ""
echo "Step 6: Recent logs from app..."
docker-compose -f docker-compose.aws.yml logs --tail=50 app

echo ""
echo "============================"
echo "Deployment complete!"
echo ""
echo "Access your application at:"
echo "http://35.92.161.166:3000"
echo ""
echo "To view logs in real-time, run:"
echo "docker-compose -f docker-compose.aws.yml logs -f"
