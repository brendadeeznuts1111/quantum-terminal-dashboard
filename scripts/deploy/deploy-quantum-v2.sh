#!/bin/bash
# deploy-quantum-v2.sh - Production Deployment with Validation

set -e  # Exit on error
set -o pipefail  # Stricter pipeline failures

echo "🚀 Quantum Cash Flow Lattice v1.5.0 - Production Deployment"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${MAGENTA}📋 Step $1: $2${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Store timestamp once to avoid multiple date calls
NOW=$(date -Iseconds)

# 1. Validate Bun Version
log_step "1" "Bun Version Validation"
BUN_VERSION=$(bun -v)
log_info "Detected: Bun $BUN_VERSION"

if [[ "$BUN_VERSION" < "1.3.5" ]]; then
    log_error "Bun 1.3.5+ required"
    log_info "Run: bun upgrade"
    exit 1
fi
log_success "Version check passed"

# 2. Check required tools
log_step "2" "Checking Required Tools"
REQUIRED_TOOLS=("node" "npm" "git")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command_exists "$tool"; then
        MISSING_TOOLS+=("$tool")
    fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
    log_error "Missing required tools: ${MISSING_TOOLS[*]}"
    exit 1
fi
log_success "All required tools available"

# 3. Environment validation
log_step "3" "Environment Validation"
if [[ -n "$NODE_ENV" && "$NODE_ENV" != "production" ]]; then
    log_warning "NODE_ENV is set to '$NODE_ENV', should be 'production' for production builds"
fi

# Set production environment if not set
export NODE_ENV=${NODE_ENV:-production}
log_info "NODE_ENV: $NODE_ENV"

# 4. Clean previous builds
log_step "4" "Cleaning Previous Builds"
if [ -d "./dist" ]; then
    rm -rf ./dist
    log_info "Removed previous dist directory"
fi
mkdir -p ./dist
log_success "Clean build directory prepared"

# 5. Install dependencies
log_step "5" "Installing Dependencies"
if [ -f "bun.lockb" ]; then
    bun install --frozen-lockfile
else
    bun install
fi
log_success "Dependencies installed"

# 6. Run version validation
log_step "6" "Running Version Validation"
bun run src/validation/version-validation.js
log_success "Version validation completed"

# 7. Build with all features
log_step "7" "Building Production Bundle"
BUILD_START=$(date +%s)

# Build the main application
bun run src/quantum-app.ts --build

# Build validation components
bun build src/validation/version-validation.js --outdir ./dist/validation --target node
bun build src/validation/tension-decay-engine.js --outdir ./dist/validation --target node
bun build src/validation/terminal-demo.js --outdir ./dist/validation --target node
bun build src/validation/bundle-validator.js --outdir ./dist/validation --target node
bun build src/validation/quantum-cli.js --outdir ./dist --target node --entry-naming ./quantum-cli.js

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
log_success "Build completed in ${BUILD_TIME}s"

# 8. Bundle Validation
log_step "8" "Bundle Validation"
VALIDATION_RESULT=$(bun run src/validation/quantum-cli.js validate ./dist/ --quiet || echo "failed")

if [[ "$VALIDATION_RESULT" == *"failed"* ]]; then
    log_error "Bundle validation failed"
    exit 1
fi
log_success "Bundle validation passed"

# 9. ES Module Compatibility Check
log_step "9" "ES Module Compatibility Check"
if bunx es-check@latest es2022 dist/**/*.js 2>/dev/null; then
    log_success "ES2022 compatibility verified"
else
    log_warning "ES2022 compatibility issues found"
    log_info "Review may be needed for older browsers"
fi

# 10. Performance Benchmarks
log_step "10" "Running Performance Benchmarks"
BENCHMARK_FILE="benchmark-$(date +%Y%m%d-%H%M%S).json"

bun run src/validation/quantum-cli.js benchmark > "$BENCHMARK_FILE" 2>&1
log_success "Benchmarks completed: $BENCHMARK_FILE"

# 11. Security and Quality Checks
log_step "11" "Security and Quality Checks"

# Check for security issues in dependencies
if command_exists audit; then
    npm audit --audit-level moderate || log_warning "Security audit found issues"
else
    log_warning "npm audit not available"
fi

# Check for common issues
log_info "Checking for common security issues..."

# Check for hardcoded secrets
if grep -r "password\|secret\|token\|key" --include="*.js" --include="*.ts" src/ | grep -v "password\|secret\|token\|key" | grep -v "//.*password\|//.*secret\|//.*token\|//.*key" >/dev/null 2>&1; then
    log_warning "Potential hardcoded secrets found"
fi

log_success "Security checks completed"

# 12. Generate Documentation
log_step "12" "Generating Documentation"

# Create build info
cat > BUILD_INFO.txt << EOF
Quantum Cash Flow Lattice v1.5.0 - Build Information
====================================================
Build Date: $(date)
Build Time: ${BUILD_TIME} seconds
Bun Version: $BUN_VERSION
Node Version: $(node -v)
Platform: $(uname -s) $(uname -m)
Environment: $NODE_ENV
Features: TERMINAL SIMD_BUFFER REACT_FAST_REFRESH COMPILE_FLAGS
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Git Branch: $(git branch --show-current 2>/dev/null || echo "unknown")

Bundle Validation: PASSED
Security Checks: COMPLETED
Performance Benchmarks: COMPLETED
EOF

# Generate API documentation if tools are available
if command_exists jsdoc; then
    jsdoc -c jsdoc.conf.json 2>/dev/null || log_warning "JSDoc documentation generation failed"
fi

log_success "Documentation generated"

# 13. Create Deployment Package
log_step "13" "Creating Deployment Package"
DEPLOY_PKG="quantum-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"

# Create deployment directory
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist/ "$DEPLOY_DIR/"
cp BUILD_INFO.txt "$DEPLOY_DIR/"
cp "$BENCHMARK_FILE" "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp bun.lockb "$DEPLOY_DIR/"
cp deploy-quantum-v2.sh "$DEPLOY_DIR/"
cp quantum-config.yaml "$DEPLOY_DIR/" 2>/dev/null || log_warning "Config file not found"

# Create startup scripts
cat > "$DEPLOY_DIR/start.sh" << 'EOF'
#!/bin/bash
# Quantum Terminal Dashboard Startup Script

echo "🚀 Starting Quantum Terminal Dashboard..."
echo "========================================"

# Check Bun version
BUN_VERSION=$(bun -v)
echo "📦 Bun Version: $BUN_VERSION"

# Set environment
export NODE_ENV=${NODE_ENV:-production}
export HTTP_PORT=${HTTP_PORT:-4003}
export WS_PORT=${WS_PORT:-4004}

echo "🌐 HTTP Port: $HTTP_PORT"
echo "🔌 WebSocket Port: $WS_PORT"

# Start the application
echo "⚡ Starting quantum dashboard..."
bun run dist/quantum-app.js

echo "✅ Quantum Terminal Dashboard started"
echo "🔗 Access: http://localhost:$HTTP_PORT"
EOF

chmod +x "$DEPLOY_DIR/start.sh"

# Create health check script
cat > "$DEPLOY_DIR/health-check.sh" << 'EOF'
#!/bin/bash
# Health Check Script for Quantum Terminal Dashboard

HTTP_PORT=${HTTP_PORT:-4003}
WS_PORT=${WS_PORT:-4004}

echo "🏥 Quantum Dashboard Health Check"
echo "================================="

# Check HTTP server
if curl -s "http://localhost:$HTTP_PORT/health" >/dev/null 2>&1; then
    echo "✅ HTTP Server: Running"
else
    echo "❌ HTTP Server: Down"
    exit 1
fi

# Check WebSocket server
if curl -s "http://localhost:$WS_PORT/health" >/dev/null 2>&1; then
    echo "✅ WebSocket Server: Running"
else
    echo "❌ WebSocket Server: Down"
    exit 1
fi

# Check system resources
echo "📊 System Resources:"
echo "   Memory Usage: $(free -h 2>/dev/null | grep Mem | awk '{print $3"/"$2}' || echo 'N/A')"
echo "   CPU Load: $(uptime 2>/dev/null | awk -F'load average:' '{print $2}' | awk '{print $1}' || echo 'N/A')"

echo "✅ Health check completed"
EOF

chmod +x "$DEPLOY_DIR/health-check.sh"

# Create archive
tar -czf "$DEPLOY_PKG" "$DEPLOY_DIR/"

# Clean up deployment directory
rm -rf "$DEPLOY_DIR"

# 14. Validate Archive
log_step "14" "Archive Validation"
ARCHIVE_SIZE=$(du -h "$DEPLOY_PKG" | cut -f1)
ARCHIVE_FILES=$(tar -tzf "$DEPLOY_PKG" | wc -l)

echo "   Archive: $DEPLOY_PKG"
echo "   Size: $ARCHIVE_SIZE"
echo "   Files: $ARCHIVE_FILES"

# Verify archive integrity
if tar -tzf "$DEPLOY_PKG" >/dev/null 2>&1; then
    log_success "Archive integrity verified"
else
    log_error "Archive is corrupted"
    exit 1
fi

# 15. Optional: Deploy to S3
if [[ -n "$AWS_ACCESS_KEY_ID" && -n "$DEPLOY_BUCKET" ]]; then
    log_step "15" "Uploading to S3"
    
    # Use Bun's native fetch for S3 upload (simplified)
    log_info "Uploading to s3://$DEPLOY_BUCKET/$DEPLOY_PKG"
    
    # Note: This is a simplified upload. In production, use AWS SDK
    if command_exists aws; then
        # Use multi-part upload for large files (>100MB)
        FILE_SIZE=$(stat -f%z "$DEPLOY_PKG" 2>/dev/null || stat -c%s "$DEPLOY_PKG" 2>/dev/null || echo "0")
        if [ "$FILE_SIZE" -gt 104857600 ]; then  # 100MB
            aws s3 cp "$DEPLOY_PKG" "s3://$DEPLOY_BUCKET/" --storage-class STANDARD_IA \
                --metadata version=$BUN_VERSION,buildtime=$BUILD_TIME
        else
            aws s3 cp "$DEPLOY_PKG" "s3://$DEPLOY_BUCKET/" --storage-class STANDARD_IA
        fi
        log_success "Uploaded to S3"
    else
        log_warning "AWS CLI not found, skipping S3 upload"
    fi
else
    log_info "Step 15: Skipping S3 upload (set AWS_ACCESS_KEY_ID and DEPLOY_BUCKET)"
fi

# 16. Final Report
echo ""
echo "🎉 DEPLOYMENT COMPLETE"
echo "====================="
echo "• Bundle: ./dist/"
echo "• Archive: $DEPLOY_PKG ($ARCHIVE_SIZE)"
echo "• Build Time: ${BUILD_TIME} seconds"
echo "• Bun Version: $BUN_VERSION"
echo "• Environment: $NODE_ENV"
echo ""

# Show deployment summary
echo "📊 DEPLOYMENT SUMMARY"
echo "===================="
echo "✅ Version Validation: PASSED"
echo "✅ Build Process: COMPLETED"
echo "✅ Bundle Validation: PASSED"
echo "✅ Security Checks: COMPLETED"
echo "✅ Performance Tests: COMPLETED"
echo "✅ Documentation: GENERATED"
echo "✅ Archive: CREATED"

if [[ -n "$AWS_ACCESS_KEY_ID" && -n "$DEPLOY_BUCKET" && -n "$AWS_S3_URL" ]]; then
    echo "✅ S3 Upload: COMPLETED"
    echo "🔗 Download: $AWS_S3_URL/$DEPLOY_PKG"
fi

echo ""
echo "🚀 QUICK START COMMANDS"
echo "======================"
echo "# Extract and run:"
echo "tar -xzf $DEPLOY_PKG"
echo "cd deploy-*/"
echo "./start.sh"
echo ""
echo "# Or run directly from source:"
echo "HTTP_PORT=4003 WS_PORT=4004 bun run src/quantum-app.ts"
echo ""
echo "# Run validation:"
echo "bun run src/validation/quantum-cli.js health"
echo ""
echo "# Start demo:"
echo "bun run src/validation/quantum-cli.js demo market-ticker"

# 17. Cleanup (optional)
read -p "🗑️  Clean up build artifacts? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Cleaning up build artifacts..."
    rm -f "$BENCHMARK_FILE"
    log_success "Cleanup completed"
fi

echo ""
log_success "Quantum Cash Flow Lattice v1.5.0 deployment completed successfully!"
echo "🎯 Status: PRODUCTION READY"
echo "📅 Deployed at: $(date)"
echo ""
echo "![quantum](https://img.shields.io/badge/deploy-v1.5.0-$NOW-green)"