#!/bin/bash
# deploy-quantum-hyper.sh - Quantum Hyper System Deployment
# Version: 1.5.0

set -e

echo "========================================"
echo "  Quantum Hyper System v1.5.0"
echo "  Deployment Pipeline"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROFILE="${1:-hyper-production}"
VERSION="1.5.0"
DIST_DIR="./dist/${PROFILE}"
DEPLOY_ARCHIVE="quantum-hyper-deploy-${VERSION}.tar.gz"

echo -e "${CYAN}[1/6]${NC} Building with all features..."
bun run src/quantum-hyper-engine.js --build "${PROFILE}"

echo ""
echo -e "${CYAN}[2/6]${NC} Running performance benchmarks..."
bun run src/quantum-hyper-engine.js --benchmark

echo ""
echo -e "${CYAN}[3/6]${NC} Generating token graph..."
bun run src/quantum-hyper-engine.js --token-graph

echo ""
echo -e "${CYAN}[4/6]${NC} Running SIMD buffer test..."
bun run src/quantum-hyper-engine.js --test-buffer

echo ""
echo -e "${CYAN}[5/6]${NC} Creating deployment package..."

# Create deployment manifest
cat > "${DIST_DIR}/deploy.manifest.json" << EOF
{
  "name": "quantum-hyper-system",
  "version": "${VERSION}",
  "profile": "${PROFILE}",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "bun": {
    "version": "$(bun --version)"
  },
  "platform": {
    "os": "$(uname -s)",
    "arch": "$(uname -m)"
  },
  "features": [
    "TERMINAL", "SIMD_BUFFER", "REACT_FAST_REFRESH", "COMPILE_FLAGS",
    "WEBGL", "NETWORK_VISUALIZATION", "GLASS_MORPHISM", "PTY_SUPPORT",
    "FAST_IPC", "FAST_SPAWN", "FAST_NODE", "IN_MEMORY_BUNDLE",
    "PROXY_SUPPORT", "HTTP_AGENT_POOL", "CONFIG_AUTOLOAD", "JSON_FAST"
  ],
  "components": 8,
  "optimizations": {
    "buffer_simd": "2x faster",
    "spawn_sync": "30x faster (Linux)",
    "response_json": "3.5x faster",
    "promise_race": "30% faster"
  }
}
EOF

# Create the archive
tar -czf "${DEPLOY_ARCHIVE}" \
  "${DIST_DIR}/" \
  token-graph.json \
  token-graph.mmd \
  package.json \
  README.md \
  benchmarks.csv 2>/dev/null || true

echo -e "  Archive created: ${GREEN}${DEPLOY_ARCHIVE}${NC}"
echo -e "  Size: $(du -h "${DEPLOY_ARCHIVE}" | cut -f1)"

echo ""
echo -e "${CYAN}[6/6]${NC} Deployment summary..."

echo ""
echo "========================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "  Profile:    ${PROFILE}"
echo "  Version:    ${VERSION}"
echo "  Archive:    ${DEPLOY_ARCHIVE}"
echo "  Output:     ${DIST_DIR}/"
echo ""
echo "  Components: 8 (qsimd-*@1.5.0)"
echo "  Features:   16"
echo ""
echo "To deploy to production:"
echo "  tar -xzf ${DEPLOY_ARCHIVE}"
echo "  bun run dist/${PROFILE}/quantum-hyper.generated.js"
echo ""
echo "To start with hot reload:"
echo "  bun --hot run src/quantum-hyper-engine.js --matrix"
echo ""
