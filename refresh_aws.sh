docker pull eakarsun4/richmond-dms:latest
docker-compose -f docker-compose.aws.yml down
docker-compose -f docker-compose.aws.yml up -d
docker exec richmond-dms-app npx ts-node /app/backend/prisma/seed-production.ts
rm PRODUCTION_CREDENTIALS.txt
docker cp richmond-dms-app:/app/PRODUCTION_CREDENTIALS.txt ./
