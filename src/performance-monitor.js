/**
 * performance-monitor.js - Real-time Performance Monitoring Dashboard
 * Monitors SIMD, spawn, and IPC performance metrics
 */

import { Buffer } from 'buffer';

// ANSI codes for terminal output
const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bgBlue: '\x1b[44m',
  white: '\x1b[37m',
  clearScreen: '\x1b[2J',
  cursorHome: '\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h'
};

/**
 * Pad string using Bun.stringWidth for accurate terminal alignment
 */
function padEnd(str, width, char = ' ') {
  const s = String(str);
  const currentWidth = Bun.stringWidth(s);
  if (currentWidth >= width) return s;
  return s + char.repeat(width - currentWidth);
}

function padStart(str, width, char = ' ') {
  const s = String(str);
  const currentWidth = Bun.stringWidth(s);
  if (currentWidth >= width) return s;
  return char.repeat(width - currentWidth) + s;
}

/**
 * Performance Monitor Class
 */
// Bun 1.3.5+ Performance Baselines
const PERFORMANCE_BASELINES = {
  buffer: {
    indexOf: { before: 3250, after: 1420, improvement: '2.3x', impact: 'High' },
    includes: { before: 25.52, after: 21.90, improvement: '1.16x', impact: 'Medium' }
  },
  spawn: {
    sync: { before: 13, after: 0.4, improvement: '32.5x', impact: 'Critical' }
  },
  ipc: {
    messaging: { improvement: '1.3x', impact: 'High' }
  },
  promise: {
    race: { improvement: '1.3x', impact: 'Medium' }
  },
  response: {
    json: { before: 2415, after: 700, improvement: '3.5x', impact: 'High' }
  }
};

class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      httpPort: config.httpPort || parseInt(process.env.PERF_HTTP_PORT || '4000'),
      wsPort: config.wsPort || parseInt(process.env.PERF_WS_PORT || '4001'),
      refreshInterval: config.refreshInterval || 1000,
      ...config
    };

    this.baselines = PERFORMANCE_BASELINES;

    this.metrics = {
      buffer: { history: [], current: null },
      spawn: { history: [], current: null },
      promise: { history: [], current: null },
      response: { history: [], current: null },
      memory: { history: [], current: null }
    };

    this.simdEnabled = this.detectSIMD();
    this.fdOptimization = this.detectFDOptimization();
    this.startTime = Date.now();
    this.wsClients = new Set();
  }

  /**
   * Detect SIMD support
   */
  detectSIMD() {
    try {
      const testBuffer = Buffer.from('x'.repeat(100000) + 'TEST');
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        testBuffer.indexOf('TEST');
      }

      const time = performance.now() - start;
      return time < 50;
    } catch {
      return false;
    }
  }

  /**
   * Detect FD optimization
   */
  detectFDOptimization() {
    // Platform-specific spawn optimization info
    if (process.platform === 'darwin') {
      return 'posix_spawn (macOS)';
    }

    if (process.platform === 'win32') {
      return 'CreateProcess (Windows)';
    }

    if (process.platform !== 'linux') {
      return `native (${process.platform})`;
    }

    // Linux: test for close_range() syscall optimization
    try {
      const times = [];
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        Bun.spawnSync(['true']);
        times.push(performance.now() - start);
      }

      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      return avg < 1 ? 'close_range (30x)' : 'iterative';
    } catch {
      return 'linux (unknown)';
    }
  }

  /**
   * Sample buffer performance
   */
  sampleBufferPerformance() {
    const testBuffer = Buffer.from('x'.repeat(100000) + 'PERF_TEST');
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      testBuffer.indexOf('PERF_TEST');
    }
    const time = performance.now() - start;

    const result = {
      opsPerSec: Math.round(iterations / time * 1000),
      time: time.toFixed(2),
      rating: time < 20 ? 'excellent' : time < 50 ? 'good' : 'needs_optimization',
      timestamp: Date.now()
    };

    this.metrics.buffer.history.push(result);
    if (this.metrics.buffer.history.length > 60) {
      this.metrics.buffer.history.shift();
    }
    this.metrics.buffer.current = result;

    return result;
  }

  /**
   * Sample spawn performance
   */
  sampleSpawnPerformance() {
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      Bun.spawnSync(['echo', 'test']);
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;

    const result = {
      avgTime: avg.toFixed(3),
      minTime: Math.min(...times).toFixed(3),
      maxTime: Math.max(...times).toFixed(3),
      rating: avg < 1 ? 'excellent' : avg < 5 ? 'good' : 'needs_optimization',
      timestamp: Date.now()
    };

    this.metrics.spawn.history.push(result);
    if (this.metrics.spawn.history.length > 60) {
      this.metrics.spawn.history.shift();
    }
    this.metrics.spawn.current = result;

    return result;
  }

  /**
   * Sample Promise.race performance
   */
  async samplePromisePerformance() {
    const iterations = 1000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      await Promise.race([
        Promise.resolve(1),
        Promise.resolve(2)
      ]);
    }
    const time = performance.now() - start;

    const result = {
      opsPerSec: Math.round(iterations / time * 1000),
      time: time.toFixed(2),
      rating: time < 10 ? 'excellent' : time < 50 ? 'good' : 'needs_optimization',
      timestamp: Date.now()
    };

    this.metrics.promise.history.push(result);
    if (this.metrics.promise.history.length > 60) {
      this.metrics.promise.history.shift();
    }
    this.metrics.promise.current = result;

    return result;
  }

  /**
   * Sample Response.json() performance (3.5x faster in Bun 1.3.5+)
   */
  sampleResponseJsonPerformance() {
    const testObj = {
      items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` }))
    };
    const iterations = 1000;

    // Test Response.json() - now uses SIMD FastStringifier
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      Response.json(testObj);
    }
    const time = performance.now() - start;

    // Calculate improvement vs baseline (2415ms for 1000 iterations before optimization)
    const baselineTime = 2415;
    const improvement = (baselineTime / (time * 1000 / iterations)).toFixed(1);

    const result = {
      opsPerSec: Math.round(iterations / time * 1000),
      time: time.toFixed(2),
      improvement: improvement + 'x',
      rating: time < 100 ? 'excellent' : time < 500 ? 'good' : 'needs_optimization',
      timestamp: Date.now()
    };

    this.metrics.response.history.push(result);
    if (this.metrics.response.history.length > 60) {
      this.metrics.response.history.shift();
    }
    this.metrics.response.current = result;

    return result;
  }

  /**
   * Collect memory metrics
   */
  collectMemoryMetrics() {
    const mem = process.memoryUsage();

    const result = {
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1),
      rss: (mem.rss / 1024 / 1024).toFixed(1),
      external: (mem.external / 1024 / 1024).toFixed(1),
      heapPercent: ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1),
      timestamp: Date.now()
    };

    this.metrics.memory.history.push(result);
    if (this.metrics.memory.history.length > 60) {
      this.metrics.memory.history.shift();
    }
    this.metrics.memory.current = result;

    return result;
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore() {
    let score = 100;

    // Buffer performance
    const bufferTime = parseFloat(this.metrics.buffer.current?.time || 100);
    if (bufferTime > 50) score -= 20;
    else if (bufferTime > 20) score -= 10;

    // Spawn performance
    const spawnTime = parseFloat(this.metrics.spawn.current?.avgTime || 10);
    if (spawnTime > 5) score -= 30;
    else if (spawnTime > 1) score -= 15;

    // SIMD bonus
    if (this.simdEnabled) score += 15;

    // FD optimization bonus
    if (this.fdOptimization === 'close_range') score += 10;

    return Math.max(0, Math.min(125, score));
  }

  /**
   * Collect all real-time metrics
   */
  async collectRealTimeMetrics() {
    this.sampleBufferPerformance();
    this.sampleSpawnPerformance();
    await this.samplePromisePerformance();
    this.sampleResponseJsonPerformance();
    this.collectMemoryMetrics();

    // Calculate gains vs baselines
    const spawnTime = parseFloat(this.metrics.spawn.current?.avgTime || 13);
    const spawnGain = (13 / spawnTime).toFixed(1) + 'x';

    return {
      buffer: this.metrics.buffer.current,
      spawn: this.metrics.spawn.current,
      promise: this.metrics.promise.current,
      response: this.metrics.response.current,
      memory: this.metrics.memory.current,
      score: this.calculatePerformanceScore(),
      simdEnabled: this.simdEnabled,
      fdOptimization: this.fdOptimization,
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      bunVersion: Bun.version,
      platform: process.platform,
      baselines: this.baselines,
      gains: {
        spawn: spawnGain,
        buffer: this.simdEnabled ? '2x (SIMD)' : '1x',
        promise: '1.3x',
        responseJson: this.metrics.response.current?.improvement || '3.5x'
      }
    };
  }

  /**
   * Start monitoring servers
   */
  async startMonitoring() {
    console.log(`${ANSI.cyan}Starting Performance Monitor...${ANSI.reset}`);

    // Start WebSocket server for real-time metrics
    const wsServer = Bun.serve({
      port: this.config.wsPort,
      fetch(req, server) {
        if (new URL(req.url).pathname === '/ws') {
          const success = server.upgrade(req);
          if (success) return undefined;
        }
        return new Response('WebSocket endpoint: /ws');
      },
      websocket: {
        open: (ws) => {
          this.wsClients.add(ws);
          console.log(`${ANSI.dim}WebSocket client connected${ANSI.reset}`);

          // Send initial data
          ws.send(JSON.stringify({
            type: 'init',
            bunVersion: Bun.version,
            platform: process.platform,
            simdEnabled: this.simdEnabled,
            fdOptimization: this.fdOptimization
          }));
        },
        message: (ws, message) => {
          // Handle client requests
          const data = JSON.parse(message);
          if (data.type === 'request_metrics') {
            this.collectRealTimeMetrics().then(metrics => {
              ws.send(JSON.stringify({ type: 'metrics', ...metrics }));
            });
          }
        },
        close: (ws) => {
          this.wsClients.delete(ws);
          console.log(`${ANSI.dim}WebSocket client disconnected${ANSI.reset}`);
        }
      }
    });

    console.log(`${ANSI.green}WebSocket server: ws://localhost:${wsServer.port}/ws${ANSI.reset}`);

    // Start HTTP server for web dashboard
    const httpServer = Bun.serve({
      port: this.config.httpPort,
      fetch: async (req) => {
        const url = new URL(req.url);

        if (url.pathname === '/') {
          return new Response(this.generateDashboardHTML(), {
            headers: { 'Content-Type': 'text/html' }
          });
        }

        if (url.pathname === '/api/metrics') {
          const metrics = await this.collectRealTimeMetrics();
          return Response.json(metrics);
        }

        if (url.pathname === '/health') {
          return Response.json({
            status: 'ok',
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            score: this.calculatePerformanceScore()
          });
        }

        return new Response('Not found', { status: 404 });
      }
    });

    console.log(`${ANSI.green}HTTP dashboard: http://localhost:${httpServer.port}${ANSI.reset}`);

    // Start metrics broadcast interval
    setInterval(async () => {
      if (this.wsClients.size > 0) {
        const metrics = await this.collectRealTimeMetrics();
        const message = JSON.stringify({ type: 'metrics', ...metrics });

        for (const client of this.wsClients) {
          try {
            client.send(message);
          } catch (e) {
            this.wsClients.delete(client);
          }
        }
      }
    }, this.config.refreshInterval);

    console.log(`${ANSI.cyan}Performance monitoring active${ANSI.reset}`);

    return { wsServer, httpServer };
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantum Performance Monitor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Monaco', 'Menlo', monospace;
      background: linear-gradient(135deg, #000010 0%, #001020 100%);
      color: #00f0ff;
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      text-align: center;
      margin-bottom: 30px;
      text-shadow: 0 0 20px #00f0ff;
      font-size: 2em;
    }
    .score-display {
      text-align: center;
      font-size: 4em;
      margin: 20px 0;
      text-shadow: 0 0 30px currentColor;
    }
    .score-excellent { color: #00ff41; }
    .score-good { color: #f0ff00; }
    .score-poor { color: #ff4141; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .card {
      background: rgba(0, 15, 30, 0.8);
      border: 1px solid #00f0ff33;
      border-radius: 12px;
      padding: 20px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 40px rgba(0, 240, 255, 0.2);
    }
    .card h3 {
      color: #00ff41;
      margin-bottom: 15px;
      font-size: 1.1em;
      border-bottom: 1px solid #00f0ff22;
      padding-bottom: 10px;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      padding: 5px 0;
    }
    .metric-label { color: #888; }
    .metric-value { color: #fff; font-weight: bold; }
    .rating-excellent { color: #00ff41; }
    .rating-good { color: #f0ff00; }
    .rating-poor { color: #ff4141; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8em;
      font-weight: bold;
    }
    .status-enabled { background: #00ff4133; color: #00ff41; }
    .status-disabled { background: #ff414133; color: #ff4141; }
    .impact-critical { background: #ff414133; color: #ff4141; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
    .impact-high { background: #f0ff0033; color: #f0ff00; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
    .impact-medium { background: #00f0ff33; color: #00f0ff; padding: 2px 8px; border-radius: 10px; font-size: 0.8em; }
    .sparkline {
      height: 40px;
      display: flex;
      align-items: flex-end;
      gap: 2px;
      margin-top: 15px;
    }
    .sparkline-bar {
      flex: 1;
      background: linear-gradient(to top, #00f0ff, #00ff41);
      border-radius: 2px 2px 0 0;
      min-height: 2px;
      transition: height 0.3s;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      color: #666;
      font-size: 0.9em;
    }
    #connection-status {
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.8em;
    }
    .connected { background: #00ff4133; color: #00ff41; }
    .disconnected { background: #ff414133; color: #ff4141; }
  </style>
</head>
<body>
  <div id="connection-status" class="disconnected">Connecting...</div>

  <div class="container">
    <h1>QUANTUM PERFORMANCE MONITOR</h1>

    <div class="score-display" id="score">--</div>

    <div class="grid">
      <div class="card">
        <h3>Buffer SIMD</h3>
        <div class="metric">
          <span class="metric-label">Ops/sec</span>
          <span class="metric-value" id="buffer-ops">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Time</span>
          <span class="metric-value" id="buffer-time">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">SIMD</span>
          <span id="simd-status" class="status-badge status-disabled">--</span>
        </div>
        <div class="sparkline" id="buffer-sparkline"></div>
      </div>

      <div class="card">
        <h3>Spawn Performance</h3>
        <div class="metric">
          <span class="metric-label">Avg Time</span>
          <span class="metric-value" id="spawn-avg">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Min/Max</span>
          <span class="metric-value" id="spawn-range">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">FD Opt</span>
          <span id="fd-status" class="status-badge">--</span>
        </div>
        <div class="sparkline" id="spawn-sparkline"></div>
      </div>

      <div class="card">
        <h3>Promise.race</h3>
        <div class="metric">
          <span class="metric-label">Ops/sec</span>
          <span class="metric-value" id="promise-ops">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Time</span>
          <span class="metric-value" id="promise-time">--</span>
        </div>
        <div class="sparkline" id="promise-sparkline"></div>
      </div>

      <div class="card">
        <h3>Response.json()</h3>
        <div class="metric">
          <span class="metric-label">Ops/sec</span>
          <span class="metric-value" id="response-ops">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Time</span>
          <span class="metric-value" id="response-time">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Gain</span>
          <span class="metric-value rating-excellent" id="response-gain">--</span>
        </div>
        <div class="sparkline" id="response-sparkline"></div>
      </div>

      <div class="card">
        <h3>Memory</h3>
        <div class="metric">
          <span class="metric-label">Heap Used</span>
          <span class="metric-value" id="heap-used">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Heap Total</span>
          <span class="metric-value" id="heap-total">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">RSS</span>
          <span class="metric-value" id="rss">--</span>
        </div>
      </div>

      <div class="card">
        <h3>System Info</h3>
        <div class="metric">
          <span class="metric-label">Bun Version</span>
          <span class="metric-value" id="bun-version">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Platform</span>
          <span class="metric-value" id="platform">--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Uptime</span>
          <span class="metric-value" id="uptime">--</span>
        </div>
      </div>

      <div class="card" style="grid-column: span 2;">
        <h3>Performance Gains (vs pre-1.3.5)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85em;">
          <thead>
            <tr style="border-bottom: 1px solid #00f0ff33;">
              <th style="text-align: left; padding: 8px; color: #888;">Operation</th>
              <th style="text-align: right; padding: 8px; color: #888;">Before</th>
              <th style="text-align: right; padding: 8px; color: #888;">Current</th>
              <th style="text-align: right; padding: 8px; color: #888;">Gain</th>
              <th style="text-align: center; padding: 8px; color: #888;">Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px;">Buffer.indexOf()</td>
              <td style="padding: 8px; text-align: right; color: #666;">3.25s</td>
              <td style="padding: 8px; text-align: right;" id="gain-buffer">--</td>
              <td style="padding: 8px; text-align: right; color: #00ff41;" id="gain-buffer-x">--</td>
              <td style="padding: 8px; text-align: center;"><span class="impact-high">High</span></td>
            </tr>
            <tr>
              <td style="padding: 8px;">Bun.spawnSync()</td>
              <td style="padding: 8px; text-align: right; color: #666;">13ms</td>
              <td style="padding: 8px; text-align: right;" id="gain-spawn">--</td>
              <td style="padding: 8px; text-align: right; color: #00ff41;" id="gain-spawn-x">--</td>
              <td style="padding: 8px; text-align: center;"><span class="impact-critical">Critical</span></td>
            </tr>
            <tr>
              <td style="padding: 8px;">Promise.race()</td>
              <td style="padding: 8px; text-align: right; color: #666;">baseline</td>
              <td style="padding: 8px; text-align: right;" id="gain-promise">--</td>
              <td style="padding: 8px; text-align: right; color: #00ff41;">1.3x</td>
              <td style="padding: 8px; text-align: center;"><span class="impact-medium">Medium</span></td>
            </tr>
            <tr>
              <td style="padding: 8px;">Response.json()</td>
              <td style="padding: 8px; text-align: right; color: #666;">2415ms</td>
              <td style="padding: 8px; text-align: right;" id="gain-response">--</td>
              <td style="padding: 8px; text-align: right; color: #00ff41;" id="gain-response-x">--</td>
              <td style="padding: 8px; text-align: center;"><span class="impact-high">High</span></td>
            </tr>
            <tr>
              <td style="padding: 8px;">IPC Communication</td>
              <td style="padding: 8px; text-align: right; color: #666;">baseline</td>
              <td style="padding: 8px; text-align: right; color: #0ff;">optimized</td>
              <td style="padding: 8px; text-align: right; color: #00ff41;">1.3x</td>
              <td style="padding: 8px; text-align: center;"><span class="impact-high">High</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      Quantum Terminal Dashboard v2.0.0-rc.1 | SIMD-Optimized Performance Monitor
    </div>
  </div>

  <script>
    const bufferHistory = [];
    const spawnHistory = [];
    const promiseHistory = [];
    const responseHistory = [];

    function updateSparkline(containerId, history, getValue, maxVal = null) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const max = maxVal || Math.max(...history.map(getValue), 1);
      container.innerHTML = history.slice(-20).map(item => {
        const height = Math.max(5, (getValue(item) / max) * 100);
        return \`<div class="sparkline-bar" style="height: \${height}%"></div>\`;
      }).join('');
    }

    function updateUI(data) {
      // Score
      const scoreEl = document.getElementById('score');
      scoreEl.textContent = data.score + '/125';
      scoreEl.className = 'score-display ' +
        (data.score >= 100 ? 'score-excellent' : data.score >= 70 ? 'score-good' : 'score-poor');

      // Buffer
      document.getElementById('buffer-ops').textContent = data.buffer?.opsPerSec?.toLocaleString() || '--';
      document.getElementById('buffer-time').textContent = (data.buffer?.time || '--') + 'ms';

      const simdStatus = document.getElementById('simd-status');
      simdStatus.textContent = data.simdEnabled ? 'ENABLED' : 'DISABLED';
      simdStatus.className = 'status-badge ' + (data.simdEnabled ? 'status-enabled' : 'status-disabled');

      // Spawn
      document.getElementById('spawn-avg').textContent = (data.spawn?.avgTime || '--') + 'ms';
      document.getElementById('spawn-range').textContent =
        (data.spawn?.minTime || '--') + ' / ' + (data.spawn?.maxTime || '--') + 'ms';

      const fdStatus = document.getElementById('fd-status');
      fdStatus.textContent = data.fdOptimization || '--';
      fdStatus.className = 'status-badge ' +
        (data.fdOptimization === 'close_range' ? 'status-enabled' : 'status-disabled');

      // Promise
      document.getElementById('promise-ops').textContent = data.promise?.opsPerSec?.toLocaleString() || '--';
      document.getElementById('promise-time').textContent = (data.promise?.time || '--') + 'ms';

      // Memory
      document.getElementById('heap-used').textContent = (data.memory?.heapUsed || '--') + ' MB';
      document.getElementById('heap-total').textContent = (data.memory?.heapTotal || '--') + ' MB';
      document.getElementById('rss').textContent = (data.memory?.rss || '--') + ' MB';

      // System
      document.getElementById('bun-version').textContent = data.bunVersion || '--';
      document.getElementById('platform').textContent = data.platform || '--';
      document.getElementById('uptime').textContent = (data.uptime || 0) + 's';

      // Response.json
      document.getElementById('response-ops').textContent = data.response?.opsPerSec?.toLocaleString() || '--';
      document.getElementById('response-time').textContent = (data.response?.time || '--') + 'ms';
      document.getElementById('response-gain').textContent = data.response?.improvement || '--';

      // Update gains table
      if (data.buffer) {
        document.getElementById('gain-buffer').textContent = data.buffer.time + 'ms';
        document.getElementById('gain-buffer-x').textContent = data.gains?.buffer || '2x';
      }
      if (data.spawn) {
        document.getElementById('gain-spawn').textContent = data.spawn.avgTime + 'ms';
        document.getElementById('gain-spawn-x').textContent = data.gains?.spawn || '--';
      }
      if (data.promise) {
        document.getElementById('gain-promise').textContent = (data.promise.opsPerSec / 1000000).toFixed(1) + 'M ops/s';
      }
      if (data.response) {
        document.getElementById('gain-response').textContent = data.response.time + 'ms';
        document.getElementById('gain-response-x').textContent = data.response.improvement || '3.5x';
      }

      // Update histories
      if (data.buffer) {
        bufferHistory.push(data.buffer);
        if (bufferHistory.length > 60) bufferHistory.shift();
        updateSparkline('buffer-sparkline', bufferHistory, b => b.opsPerSec);
      }

      if (data.spawn) {
        spawnHistory.push(data.spawn);
        if (spawnHistory.length > 60) spawnHistory.shift();
        updateSparkline('spawn-sparkline', spawnHistory, s => 10 - parseFloat(s.avgTime), 10);
      }

      if (data.promise) {
        promiseHistory.push(data.promise);
        if (promiseHistory.length > 60) promiseHistory.shift();
        updateSparkline('promise-sparkline', promiseHistory, p => p.opsPerSec);
      }

      if (data.response) {
        responseHistory.push(data.response);
        if (responseHistory.length > 60) responseHistory.shift();
        updateSparkline('response-sparkline', responseHistory, r => r.opsPerSec);
      }
    }

    // WebSocket connection
    let ws;
    function connect() {
      ws = new WebSocket('ws://localhost:${this.config.wsPort}/ws');

      ws.onopen = () => {
        document.getElementById('connection-status').textContent = 'Connected';
        document.getElementById('connection-status').className = 'connected';
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'metrics' || data.type === 'init') {
          updateUI(data);
        }
      };

      ws.onclose = () => {
        document.getElementById('connection-status').textContent = 'Disconnected';
        document.getElementById('connection-status').className = 'disconnected';
        setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();
  </script>
</body>
</html>`;
  }

  /**
   * Run terminal dashboard (no browser needed)
   */
  async runTerminalDashboard() {
    process.stdout.write(ANSI.hideCursor);

    const render = async () => {
      const metrics = await this.collectRealTimeMetrics();
      const cols = process.stdout.columns || 80;

      process.stdout.write(ANSI.clearScreen + ANSI.cursorHome);

      // Header
      console.log(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${'═'.repeat(cols)}${ANSI.reset}`);
      const title = '  QUANTUM PERFORMANCE MONITOR';
      const time = new Date().toLocaleTimeString();
      const padding = cols - Bun.stringWidth(title) - Bun.stringWidth(time) - 4;
      console.log(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${title}${' '.repeat(Math.max(0, padding))}${time}  ${ANSI.reset}`);
      console.log(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${'═'.repeat(cols)}${ANSI.reset}`);
      console.log();

      // Score
      const scoreColor = metrics.score >= 100 ? ANSI.green : metrics.score >= 70 ? ANSI.yellow : ANSI.red;
      console.log(`  ${ANSI.bold}Performance Score:${ANSI.reset} ${scoreColor}${metrics.score}/125${ANSI.reset}`);
      console.log();

      // Buffer SIMD
      console.log(`  ${ANSI.bold}${ANSI.cyan}Buffer SIMD${ANSI.reset}`);
      console.log(`    Ops/sec: ${ANSI.green}${metrics.buffer?.opsPerSec?.toLocaleString() || '--'}${ANSI.reset}`);
      console.log(`    Time: ${metrics.buffer?.time || '--'}ms`);
      console.log(`    SIMD: ${metrics.simdEnabled ? `${ANSI.green}ENABLED${ANSI.reset}` : `${ANSI.red}DISABLED${ANSI.reset}`}`);
      console.log();

      // Spawn Performance
      console.log(`  ${ANSI.bold}${ANSI.cyan}Spawn Performance${ANSI.reset}`);
      console.log(`    Avg Time: ${ANSI.green}${metrics.spawn?.avgTime || '--'}ms${ANSI.reset}`);
      console.log(`    FD Opt: ${metrics.fdOptimization === 'close_range' ? `${ANSI.green}close_range${ANSI.reset}` : metrics.fdOptimization}`);
      console.log();

      // Promise.race
      console.log(`  ${ANSI.bold}${ANSI.cyan}Promise.race${ANSI.reset}`);
      console.log(`    Ops/sec: ${ANSI.green}${metrics.promise?.opsPerSec?.toLocaleString() || '--'}${ANSI.reset}`);
      console.log();

      // Response.json
      console.log(`  ${ANSI.bold}${ANSI.cyan}Response.json() (3.5x faster)${ANSI.reset}`);
      console.log(`    Ops/sec: ${ANSI.green}${metrics.response?.opsPerSec?.toLocaleString() || '--'}${ANSI.reset}`);
      console.log(`    Time: ${metrics.response?.time || '--'}ms`);
      console.log(`    Gain: ${ANSI.green}${metrics.response?.improvement || '--'}${ANSI.reset}`);
      console.log();

      // Memory
      console.log(`  ${ANSI.bold}${ANSI.cyan}Memory${ANSI.reset}`);
      console.log(`    Heap: ${metrics.memory?.heapUsed || '--'}MB / ${metrics.memory?.heapTotal || '--'}MB`);
      console.log(`    RSS: ${metrics.memory?.rss || '--'}MB`);
      console.log();

      // System
      console.log(`  ${ANSI.bold}${ANSI.cyan}System${ANSI.reset}`);
      console.log(`    Bun: ${Bun.version}`);
      console.log(`    Platform: ${process.platform}`);
      console.log(`    Uptime: ${metrics.uptime}s`);
      console.log();

      console.log(`${ANSI.dim}${'─'.repeat(cols)}${ANSI.reset}`);
      console.log(`${ANSI.dim}Press Ctrl+C to exit${ANSI.reset}`);
    };

    // Initial render
    await render();

    // Update loop
    const interval = setInterval(render, this.config.refreshInterval);

    // Handle exit
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.stdout.write(ANSI.showCursor);
      process.stdout.write(ANSI.clearScreen + ANSI.cursorHome);
      console.log(`${ANSI.cyan}Performance Monitor stopped.${ANSI.reset}`);
      process.exit(0);
    });
  }
}

// CLI
if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const monitor = new PerformanceMonitor({
    httpPort: parseInt(process.env.PERF_HTTP_PORT || '4000'),
    wsPort: parseInt(process.env.PERF_WS_PORT || '4001'),
    refreshInterval: parseInt(process.env.REFRESH_INTERVAL || '1000')
  });

  if (args.includes('--terminal') || args.includes('-t')) {
    // Terminal-only mode
    await monitor.runTerminalDashboard();
  } else {
    // Start web servers
    await monitor.startMonitoring();
    console.log(`\n${ANSI.dim}Use --terminal for terminal-only mode${ANSI.reset}`);
  }
}

export { PerformanceMonitor };
