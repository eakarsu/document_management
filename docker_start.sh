docker run -d \
    -p 3000:3000 \
    -p 4000:4000 \
    -e DATABASE_HOST=host.docker.internal \
    -e DATABASE_PORT=5432 \
    -e DATABASE_USER=postgres \
    -e DATABASE_PASSWORD=postgres \
    -e DATABASE_NAME=dms_dev \
    -e DATABASE_URL="postgresql://postgres@host.docker.internal:5432/dms_dev" \
    -e JWT_SECRET="dms_super_secret_jwt_key_change_in_production_12345" \
    -e NEXT_PUBLIC_API_URL="http://localhost:4000" \
    -e BACKEND_URL="http://localhost:4000" \
    -e FRONTEND_URL="http://localhost:3000" \
    -e NODE_ENV=production \
    -v $(pwd)/.env:/app/.env:ro \
    dms-app:latest
