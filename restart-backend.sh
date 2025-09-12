#!/bin/bash

echo "🔄 Restarting Backend Server..."

# Kill any existing backend processes
pkill -f "ts-node.*server" 2>/dev/null
pkill -f "nodemon.*backend" 2>/dev/null

# Change to backend directory
cd /Users/erolakarsu/projects/document_management/backend

# Start the backend
echo "🚀 Starting backend on port 4000..."
npm run dev > backend.log 2>&1 &

# Wait for backend to start
sleep 5

# Check if backend is running
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ Backend is running successfully!"
    echo ""
    echo "📊 Backend Status:"
    curl -s http://localhost:4000/health | jq '.'
    echo ""
    echo "🔗 Access your application at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:4000"
    echo ""
    echo "👥 Login Credentials:"
    echo "   Email: admin@richmond-dms.com"
    echo "   Password: admin123"
else
    echo "❌ Backend failed to start. Check backend.log for errors"
    tail -20 backend.log
fi