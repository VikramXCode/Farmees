#!/bin/bash

# FarmEase Stop Script
# This script stops both backend and frontend servers

echo "🛑 Stopping FarmEase Application..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop backend (port 3001)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}Stopping backend server...${NC}"
    lsof -ti :3001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo "Backend not running"
fi

# Stop frontend (port 5173)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}Stopping frontend server...${NC}"
    lsof -ti :5173 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Frontend stopped${NC}"
else
    echo "Frontend not running"
fi

echo ""
echo -e "${GREEN}All servers stopped.${NC}"
