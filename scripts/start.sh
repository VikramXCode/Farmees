#!/bin/bash

# FarmEase Startup Script
# This script starts both backend and frontend servers

echo "🌾 Starting FarmEase Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}⚠️  Backend server is already running on port 3001${NC}"
    echo "To stop it, run: lsof -ti :3001 | xargs kill -9"
    echo ""
else
    # Start backend
    echo -e "${BLUE}📡 Starting Backend Server...${NC}"
    cd backend
    node server.js > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
    echo "  Logs: logs/backend.log"
    echo ""
fi

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        echo ""
        break
    fi
    attempt=$((attempt + 1))
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ Backend failed to start within 30 seconds${NC}"
    echo "Check logs/backend.log for errors"
    exit 1
fi

# Check if frontend is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}⚠️  Frontend server is already running on port 5173${NC}"
    echo "To stop it, run: lsof -ti :5173 | xargs kill -9"
    echo ""
else
    # Start frontend
    echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
    npm run dev > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
    echo "  Logs: logs/frontend.log"
    echo ""
fi

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 FarmEase is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📱 Frontend:  http://localhost:5173"
echo "🔌 Backend:   http://localhost:3001"
echo "🏥 Health:    http://localhost:3001/api/health"
echo ""
echo "Demo Credentials:"
echo "  Farmer:      Phone: 9999000001, Password: demo123"
echo "  Coordinator: Phone: 9999000002, Password: demo123"
echo "  Worker:      Phone: 9999000003, Password: demo123"
echo ""
echo "To stop all servers, run: ./scripts/stop.sh"
echo ""
