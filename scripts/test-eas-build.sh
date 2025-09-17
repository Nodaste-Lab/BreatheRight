#!/bin/bash

# Script to test EAS build compatibility locally
# This mimics what EAS does during the build process

echo "🔍 Testing EAS Build Compatibility..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if package-lock.json exists
echo -e "\n${YELLOW}Test 1: Checking package-lock.json${NC}"
if [ ! -f "package-lock.json" ]; then
    echo -e "${RED}❌ package-lock.json not found!${NC}"
    echo "Run: npm install"
    exit 1
else
    echo -e "${GREEN}✓ package-lock.json exists${NC}"
fi

# Test 2: Test npm ci (what EAS runs)
echo -e "\n${YELLOW}Test 2: Testing npm ci --include=dev${NC}"
if npm ci --include=dev --dry-run > /dev/null 2>&1; then
    echo -e "${GREEN}✓ npm ci would succeed${NC}"
else
    echo -e "${RED}❌ npm ci would fail!${NC}"
    echo "Your package-lock.json is out of sync with package.json"
    echo "Fix: rm -rf node_modules package-lock.json && npm install"
    exit 1
fi

# Test 3: Check for common EAS build issues
echo -e "\n${YELLOW}Test 3: Checking for common issues${NC}"

# Check Node version compatibility
NODE_VERSION=$(node --version)
echo "Current Node version: $NODE_VERSION"

# Check if eas.json exists
if [ ! -f "eas.json" ]; then
    echo -e "${YELLOW}⚠ eas.json not found (optional)${NC}"
else
    echo -e "${GREEN}✓ eas.json exists${NC}"
fi

# Test 4: Validate package.json
echo -e "\n${YELLOW}Test 4: Validating package.json${NC}"
if npm ls --depth=0 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ All dependencies resolved${NC}"
else
    echo -e "${YELLOW}⚠ Some peer dependencies may be missing${NC}"
    npm ls --depth=0 2>&1 | grep "UNMET" || true
fi

# Test 5: Check Expo compatibility
echo -e "\n${YELLOW}Test 5: Checking Expo compatibility${NC}"
if npx expo-doctor@latest > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Expo dependencies look good${NC}"
else
    echo -e "${YELLOW}⚠ Run 'npx expo-doctor@latest' to see Expo issues${NC}"
fi

echo -e "\n======================================"
echo -e "${GREEN}✅ Local EAS build tests complete!${NC}"
echo -e "\nIf all tests passed, your build should work on EAS."
echo -e "To actually test the build locally, run:"
echo -e "  ${YELLOW}eas build --local --platform ios${NC}"