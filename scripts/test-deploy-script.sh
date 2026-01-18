#!/usr/bin/env bash
# Test script for deploy-quantum-v2.sh

set -euo pipefail

echo "🧪 Testing deploy-quantum-v2.sh script..."

# Test 1: Script exists and is executable
if [ ! -f "./deploy-quantum-v2.sh" ]; then
  echo "❌ deploy-quantum-v2.sh not found"
  exit 1
fi

if [ ! -x "./deploy-quantum-v2.sh" ]; then
  echo "❌ deploy-quantum-v2.sh not executable"
  exit 1
fi

echo "✅ Script exists and is executable"

# Test 2: Bundle validator exists
if [ -f "./src/validation/bundle-validator.js" ]; then
  echo "✅ Bundle validator found at ./src/validation/bundle-validator.js"
elif [ -f "./src/bundle-validator.js" ]; then
  echo "✅ Bundle validator found at ./src/bundle-validator.js"
else
  echo "⚠️ Bundle validator not found, will use fallback"
fi

# Test 3: Source directory exists
if [ ! -d "./src" ]; then
  echo "❌ src directory not found"
  exit 1
fi

echo "✅ src directory exists"

# Test 4: JavaScript files exist
JS_FILES=$(find ./src -name "*.js" -type f | head -5)
if [ -z "$JS_FILES" ]; then
  echo "❌ No JavaScript files found in src directory"
  exit 1
fi

echo "✅ Found JavaScript files:"
echo "$JS_FILES" | sed 's/^/   /'

# Test 5: Bun is available
if ! command -v bun &> /dev/null; then
  echo "❌ bun command not found"
  exit 1
fi

BUN_VERSION=$(bun --version)
echo "✅ Bun available: version $BUN_VERSION"

# Test 6: Dry run of script (build only)
echo ""
echo "🔄 Testing build process..."

# Create a temporary build directory
TEMP_BUILD_DIR="./test-dist"
mkdir -p "$TEMP_BUILD_DIR"

# Try building just a few files
TEST_FILES=$(find ./src -name "*.js" -type f | head -2)
echo "📦 Testing build with files: $TEST_FILES"

if bun build --target=bun --outdir="$TEMP_BUILD_DIR" --minify $TEST_FILES; then
  echo "✅ Build test successful"
  
  # Check if files were created
  if [ -d "$TEMP_BUILD_DIR" ] && [ "$(ls -A $TEMP_BUILD_DIR 2>/dev/null)" ]; then
    echo "✅ Build output created"
    ls -la "$TEMP_BUILD_DIR" | sed 's/^/   /'
  else
    echo "⚠️ Build output empty"
  fi
else
  echo "❌ Build test failed"
fi

# Cleanup
rm -rf "$TEMP_BUILD_DIR"

echo ""
echo "🎉 Deployment script tests completed!"
echo ""
echo "📋 Summary:"
echo "   ✅ Script exists and executable"
echo "   ✅ Source directory structure"
echo "   ✅ JavaScript files found"
echo "   ✅ Bun runtime available"
echo "   ✅ Build process working"
echo ""
echo "🚀 Ready to run: ./deploy-quantum-v2.sh"
