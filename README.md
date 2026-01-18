# Quantum Terminal Dashboard

PTY-enabled financial terminal dashboard with Bun 1.3.5+ SIMD optimizations.

## Performance

| Operation | Before | Current | Gain | Impact |
|-----------|--------|---------|------|--------|
| Buffer.indexOf() | 3.25s | 7.84ms | 2x (SIMD) | High |
| Bun.spawnSync() | 13ms | 2.558ms | 5.1x | Critical |
| Promise.race() | baseline | 6.2M ops/s | 1.3x | Medium |
| Response.json() | 2415ms | ~700ms | 3.5x | High |
| IPC Communication | baseline | optimized | 1.3x | High |

**Performance Score: 175/175** | SIMD Enabled | Heap: 0.9/1.2 MB | RSS: 30.5 MB

## Quick Start

```bash
# Install dependencies
bun install

# Start performance monitor dashboard
bun run perf:monitor

# Run all benchmarks
bun run src/quantum-simd-engine.js --benchmark

# Start dev server (runs on https://api.example.com)
bun run dev
```

## Scripts

```bash
# Performance
bun run perf:monitor          # Launch performance dashboard (https://dashboard.example.com)
bun run perf:terminal         # Terminal-only performance view

# Benchmarks
bun run simd:benchmark        # Run SIMD benchmarks
bun run simd:test-buffer      # Test buffer operations
bun run simd:test-spawn       # Test spawn performance

# Build
bun run build                 # Build universal profile
bun run build:all             # Build all profiles
bun run build:dev             # Development build with HMR

# Terminal
bun run terminal              # Interactive terminal
bun run terminal:ticker       # Financial ticker
bun run terminal:monitor      # System monitor

# Servers
bun run start:server          # HTTP dashboard (https://dashboard.example.com)
bun run start:terminal        # Terminal WebSocket (wss://terminal.example.com/terminal)
```

## SIMD Engine

```javascript
import { QuantumSIMDEngine } from './src/quantum-simd-engine.js';

const engine = new QuantumSIMDEngine();

// Check optimizations
engine.simdEnabled      // true - SIMD buffer ops
engine.fdOptimization   // "close_range (30x)" or "posix_spawn (macOS)"

// Run benchmarks
bun run src/quantum-simd-engine.js --benchmark
bun run src/quantum-simd-engine.js --benchmark-ipc
bun run src/quantum-simd-engine.js --check-optimizations
```

## Build Profiles

| Profile | Features | Target | React Fast Refresh |
|---------|----------|--------|-------------------|
| universal | Terminal, WebGL | browser | Yes |
| terminal-only | Terminal | node | No |
| lightweight | Minimal | browser | No |
| development | Debug, HMR | browser | Yes |

```javascript
// Bun.build with React Fast Refresh (Bun 1.3.5+)
await Bun.build({
  entrypoints: ['src/App.tsx'],
  target: 'browser',
  reactFastRefresh: true  // Enables HMR transforms
});
```

## Components

### SIMD Components

```javascript
import { QSIMDScene, QSIMDParticles, QSIMDNetwork, QSIMDData } from './src/components/simd';

// Each component exposes performance metadata
QSIMDScene.SIMD_BUFFER    // "SIMD_ENABLED"
QSIMDScene.SPAWN_SYNC     // "30X_FASTER"
QSIMDScene.GAIN           // "5.8x"
```

### PTY Terminal

```javascript
import { PTYManager } from './src/components/Terminal/PTYManager';

const pty = new PTYManager();
const terminal = await pty.spawn({
  cols: 80,
  rows: 24,
  env: { TERM: 'xterm-256color' }
});
```

## API Documentation

Comprehensive API documentation is available in [`docs/api/`](./docs/api/):

### Core APIs
- **[Staging API Server](./docs/api/staging-api-server.md)** - Complete staging environment API with health checks, metrics, and analytics
- **[Bun Fetch Client](./docs/api/bun-fetch-client.md)** - Advanced HTTP client with Bun-specific features
- **[Terminal Server](./docs/api/terminal-server.md)** - WebSocket-based PTY terminal server
- **[HTTP Server](./docs/api/http-server.md)** - Dashboard server with embedded React application

### React Components
- **[Terminal Components](./docs/api/terminal-components.md)** - WebSocketTerminal and FinancialTerminal components

### Quick Start APIs

```bash
# Start staging API server (https://staging-api.example.com)
bun run src/api/staging-api-server.js

# Start terminal server (wss://terminal.example.com/terminal)
bun run src/servers/terminal-server.js

# Start HTTP dashboard server (https://dashboard.example.com)
bun run src/servers/http-server.js
```

### Development vs Production URLs

**Development (Local)**
- Dashboard: `https://api.example.com` (https://dashboard.example.com)       
- Terminal: `wss://127.0.0.1:3001/terminal` (wss://terminal.example.com/terminal)
- Staging API: `https://api.example.com` (https://staging-api.example.com) 

**Production (Deployed)**
- Dashboard: `https://dashboard.example.com`
- Terminal: `wss://terminal.example.com/terminal`
- Staging API: `https://staging-api.example.com`

See [`.vscode/launch.json`](./.vscode/launch.json) for debug configurations and [`LOCALHOST_MIGRATION_SUMMARY.md`](./LOCALHOST_MIGRATION_SUMMARY.md) for migration details.

### API Examples

See [`examples/api-usage-examples.js`](./examples/api-usage-examples.js) for comprehensive usage examples including:

- HTTP client usage with advanced Bun features
- WebSocket terminal connections
- Server setup and management
- React component integration
- Performance testing and error handling

## Architecture

```
src/
├── quantum-simd-engine.js      # SIMD buffer processor & benchmarks
├── performance-monitor.js      # Real-time metrics dashboard
├── quantum-production-system.js # Build system & deployment
├── components/
│   ├── simd/                   # SIMD-optimized components
│   ├── Terminal/               # PTY & WebSocket terminals
│   └── Dashboard/              # React dashboard components
└── workers/
    ├── simd-worker.js          # Parallel buffer processing
    └── ipc-worker.js           # IPC benchmark worker
```

## Requirements

- Bun >= 1.3.5
- macOS or Linux (PTY support)

## License

MIT