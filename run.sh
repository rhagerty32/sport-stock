#!/bin/bash

# Script to run SportStock app with Expo Go

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting SportStock with Expo Go...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Parse command line arguments
CLEAR_CACHE=false
TUNNEL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clear)
            CLEAR_CACHE=true
            shift
            ;;
        --tunnel)
            TUNNEL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./run.sh [--clear] [--tunnel]"
            exit 1
            ;;
    esac
done

# Build the expo start command using npx (local Expo CLI)
EXPO_CMD="npx expo start"

if [ "$CLEAR_CACHE" = true ]; then
    EXPO_CMD="$EXPO_CMD --clear"
fi

if [ "$TUNNEL" = true ]; then
    EXPO_CMD="$EXPO_CMD --tunnel"
fi

echo -e "${GREEN}Starting Expo development server...${NC}"
echo -e "${YELLOW}Scan the QR code with Expo Go app on your device${NC}"
echo ""

# Run expo start
exec $EXPO_CMD
