#!/bin/bash
set -e

echo "🚀 Rebuilding and redeploying Richmond DMS to AWS..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t eakarsun4/richmond-dms:latest .

# Push to Docker Hub
echo "⬆️  Pushing to Docker Hub..."
docker push eakarsun4/richmond-dms:latest

echo ""
echo "✅ Image pushed successfully!"
echo ""
echo "Now run these commands on your AWS machine:"
echo ""
echo "  docker pull eakarsun4/richmond-dms:latest"
echo "  docker-compose down"
echo "  docker-compose up -d"
echo ""
echo "Or if using docker run:"
echo ""
echo "  docker stop richmond-dms-app"
echo "  docker rm richmond-dms-app"
echo "  docker pull eakarsun4/richmond-dms:latest"
echo "  docker run -d --name richmond-dms-app \\"
echo "    --network richmond-dms-network \\"
echo "    -p 3000:3000 -p 4000:4000 \\"
echo "    -e DATABASE_URL=postgresql://postgres:postgres@richmond-dms-postgres:5432/dms_dev \\"
echo "    -e REDIS_URL=redis://richmond-dms-redis:6379 \\"
echo "    eakarsun4/richmond-dms:latest"
echo ""
