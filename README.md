# Quantum Terminal Dashboard

PTY-enabled financial terminal dashboard with Bun 1.3.5+ SIMD optimizations.

## Performance

| Optimization | Improvement | Status |
|-------------|-------------|--------|
| Buffer.indexOf/includes | 2x faster | SIMD Enabled |
| Bun.spawnSync | 30x faster | close_range() |
| Response.json() | 3.5x faster | FastStringifier |
| Promise.race() | 30% faster | Optimized |
| IPC Communication | 283K msg/sec | Fast |

**Performance Score: 175/175**

## Quick Start

```bash
# Install dependencies
bun install

# Start performance monitor dashboard
bun run perf:monitor

# Run all benchmarks
bun run src/quantum-simd-engine.js --benchmark

# Start dev server
bun run dev
```

## Scripts

```bash
# Performance
bun run perf:monitor          # Launch performance dashboard (http://localhost:4000)
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
