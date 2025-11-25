#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_JSON="app.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Team configuration - Sport Stock, LLC
DEVELOPMENT_TEAM="J22RD5YVQW"

echo -e "${GREEN}🚀 Starting build process...${NC}"
echo -e "${GREEN}   Using team: Sport Stock, LLC (${DEVELOPMENT_TEAM})${NC}"

# Step 1: Increment build number
echo -e "${YELLOW}📝 Incrementing build number...${NC}"

# Use node to safely read and update JSON
CURRENT_BUILD=$(node -e "
  const fs = require('fs');
  const appJson = JSON.parse(fs.readFileSync('${APP_JSON}', 'utf8'));
  const currentBuild = appJson.expo?.ios?.buildNumber || '1';
  // Ensure it's treated as a number
  console.log(parseInt(currentBuild, 10) || 1);
")

# Increment build number
NEW_BUILD=$((CURRENT_BUILD + 1))

echo -e "${GREEN}   Current build: ${CURRENT_BUILD} → New build: ${NEW_BUILD}${NC}"

# Update app.json with new build number
node -e "
  const fs = require('fs');
  const appJson = JSON.parse(fs.readFileSync('${APP_JSON}', 'utf8'));
  if (!appJson.expo.ios) appJson.expo.ios = {};
  appJson.expo.ios.buildNumber = '${NEW_BUILD}';
  fs.writeFileSync('${APP_JSON}', JSON.stringify(appJson, null, 2) + '\n');
  console.log('✓ Build number updated in app.json');
"

# Step 2: Run prebuild
echo -e "${YELLOW}🔨 Running prebuild...${NC}"
npx expo prebuild --clean --platform ios

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Prebuild failed!${NC}"
  exit 1
fi

# Verify team is set correctly in Xcode project
echo -e "${YELLOW}🔍 Verifying team configuration...${NC}"
PROJECT_TEAM=$(grep -m 1 "DEVELOPMENT_TEAM = " ios/SportStock.xcodeproj/project.pbxproj | sed 's/.*DEVELOPMENT_TEAM = \([^;]*\);.*/\1/' | xargs)

if [ "$PROJECT_TEAM" != "$DEVELOPMENT_TEAM" ]; then
  echo -e "${YELLOW}   ⚠️  Team in project (${PROJECT_TEAM}) doesn't match expected (${DEVELOPMENT_TEAM})${NC}"
  echo -e "${YELLOW}   Updating project to use Sport Stock, LLC team...${NC}"
  # Update the project file to use the correct team (handles semicolon)
  sed -i '' "s/DEVELOPMENT_TEAM = [^;]*;/DEVELOPMENT_TEAM = ${DEVELOPMENT_TEAM};/g" ios/SportStock.xcodeproj/project.pbxproj
  echo -e "${GREEN}   ✓ Team updated in Xcode project${NC}"
else
  echo -e "${GREEN}   ✓ Team configuration verified (Sport Stock, LLC)${NC}"
fi

# Step 3: Build for App Store
echo -e "${YELLOW}📦 Building for App Store...${NC}"

# Set paths
WORKSPACE_PATH="ios/SportStock.xcworkspace"
SCHEME="SportStock"
ARCHIVE_PATH="build/SportStock.xcarchive"
EXPORT_PATH="build/export"
EXPORT_OPTIONS_PLIST="ios/ExportOptions.plist"

# Create build directory
mkdir -p build

# Create ExportOptions.plist if it doesn't exist
if [ ! -f "$EXPORT_OPTIONS_PLIST" ]; then
  echo -e "${YELLOW}   Creating ExportOptions.plist...${NC}"
  cat > "$EXPORT_OPTIONS_PLIST" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>uploadBitcode</key>
  <false/>
  <key>uploadSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
</dict>
</plist>
EOF
fi

# Archive the app
echo -e "${YELLOW}   Archiving with Sport Stock, LLC team...${NC}"
xcodebuild archive \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$DEVELOPMENT_TEAM" \
  -allowProvisioningUpdates

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Archive failed!${NC}"
  exit 1
fi

# Export the IPA
echo -e "${YELLOW}   Exporting IPA with Sport Stock, LLC team...${NC}"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -allowProvisioningUpdates

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Export failed!${NC}"
  exit 1
fi

# Find the IPA file
IPA_FILE=$(find "$EXPORT_PATH" -name "*.ipa" | head -n 1)

if [ -z "$IPA_FILE" ]; then
  echo -e "${RED}❌ IPA file not found!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo -e "${GREEN}   IPA location: ${IPA_FILE}${NC}"

# Step 4: Open Transporter
echo -e "${YELLOW}📤 Opening Transporter...${NC}"
open -a "Transporter" "$IPA_FILE"

echo -e "${GREEN}🎉 Done! Build number ${NEW_BUILD} is ready for upload.${NC}"

