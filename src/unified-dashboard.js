/**
 * unified-dashboard.js - Quantum Unified Dashboard v2.0.0
 *
 * Integrates ALL systems into single dashboard at :4000
 * - Performance metrics (SIMD, Spawn, Promise, Response.json)
 * - Financial ticker & Market monitor
 * - System profiling & Health endpoints
 * - Network info (IPv4/IPv6, DNS cache)
 * - Bun.serve metrics (pendingRequests, pendingWebSockets, subscriberCount)
 * - Tension & Hurst exponent monitoring
 * - Real-time graphs & visualizations
 */

import { Buffer } from 'buffer';
import { networkInterfaces, cpus, freemem, totalmem, uptime, hostname, platform, arch } from 'os';
import { lookup } from 'dns/promises';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  httpPort: parseInt(process.env.DASHBOARD_PORT || '4000'),
  wsPort: parseInt(process.env.DASHBOARD_WS_PORT || '4001'),
  refreshInterval: parseInt(process.env.REFRESH_INTERVAL || '1000'),
  financialSymbols: (process.env.FINANCIAL_SYMBOLS || 'AAPL,GOOGL,TSLA,MSFT,AMZN,NVDA,META,NFLX').split(','),
  enableProfiling: process.env.ENABLE_PROFILING !== 'false',
  dnsHosts: ['google.com', 'github.com', 'bun.sh', 'cloudflare.com']
};

// ============================================================================
// METRICS STORE
// ============================================================================

class MetricsStore {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      // Performance
      buffer: { indexOf: 0, includes: 0, history: [] },
      spawn: { avg: 0, min: 0, max: 0, p95: 0, p99: 0, history: [] },
      promise: { opsPerSec: 0, history: [] },
      response: { opsPerSec: 0, history: [] },

      // System
      memory: { heapUsed: 0, heapTotal: 0, rss: 0, external: 0, history: [] },
      cpu: { cores: [], loadAvg: [], history: [] },

      // Network
      network: { interfaces: {}, dns: {}, connections: { active: 0, total: 0 } },

      // Server
      server: { pendingRequests: 0, pendingWebSockets: 0, topics: new Map() },

      // Financial
      financial: { tickers: new Map(), history: [] },

      // Tension/Hurst
      tension: { current: 0, status: 'normal', history: [] },
      hurst: { exponent: 0.5, interpretation: 'random_walk', history: [] },

      // Health
      health: { status: 'healthy', checks: {}, lastCheck: null }
    };

    this.maxHistory = 100;
  }

  addToHistory(category, value) {
    if (!this.metrics[category].history) return;
    this.metrics[category].history.push({ timestamp: Date.now(), value });
    if (this.metrics[category].history.length > this.maxHistory) {
      this.metrics[category].history.shift();
    }
  }

  getUptime() {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

// ============================================================================
// PERFORMANCE ENGINE
// ============================================================================

class PerformanceEngine {
  constructor(store) {
    this.store = store;
    this.simdEnabled = true;
  }

  async benchmarkBuffer() {
    const testData = Buffer.alloc(1024 * 1024);
    const pattern = Buffer.from('QUANTUM');

    // indexOf benchmark
    const indexOfStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      testData.indexOf(pattern);
    }
    const indexOfTime = performance.now() - indexOfStart;
    const indexOfOps = Math.round(1000 / (indexOfTime / 1000));

    // includes benchmark
    const includesStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      testData.includes(pattern);
    }
    const includesTime = performance.now() - includesStart;
    const includesOps = Math.round(1000 / (includesTime / 1000));

    this.store.metrics.buffer.indexOf = indexOfOps;
    this.store.metrics.buffer.includes = includesOps;
    this.store.addToHistory('buffer', { indexOf: indexOfOps, includes: includesOps });

    return { indexOf: indexOfOps, includes: includesOps, time: indexOfTime + includesTime };
  }

  async benchmarkSpawn() {
    const times = [];
    const iterations = 20;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      Bun.spawnSync(['echo', 'test'], { stdio: ['ignore', 'pipe', 'pipe'] });
      times.push(performance.now() - start);
    }

    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = times[0];
    const max = times[times.length - 1];
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];

    this.store.metrics.spawn = { avg, min, max, p95, p99, history: this.store.metrics.spawn.history };
    this.store.addToHistory('spawn', { avg, min, max });

    return { avg, min, max, p95, p99 };
  }

  async benchmarkPromise() {
    const iterations = 10000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await Promise.race([Promise.resolve(i), new Promise(r => setTimeout(r, 1000))]);
    }

    const duration = performance.now() - start;
    const opsPerSec = Math.round(iterations / (duration / 1000));

    this.store.metrics.promise.opsPerSec = opsPerSec;
    this.store.addToHistory('promise', opsPerSec);

    return { opsPerSec, duration };
  }

  async benchmarkResponseJson() {
    const testObj = { items: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })) };
    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      Response.json(testObj);
    }

    const duration = performance.now() - start;
    const opsPerSec = Math.round(iterations / (duration / 1000));

    this.store.metrics.response.opsPerSec = opsPerSec;
    this.store.addToHistory('response', opsPerSec);

    return { opsPerSec, duration };
  }

  async runAllBenchmarks() {
    const [buffer, spawn, promise, response] = await Promise.all([
      this.benchmarkBuffer(),
      this.benchmarkSpawn(),
      this.benchmarkPromise(),
      this.benchmarkResponseJson()
    ]);
    return { buffer, spawn, promise, response };
  }
}

// ============================================================================
// SYSTEM ENGINE
// ============================================================================

class SystemEngine {
  constructor(store) {
    this.store = store;
  }

  collectMemory() {
    const mem = process.memoryUsage();
    this.store.metrics.memory = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
      history: this.store.metrics.memory.history
    };
    this.store.addToHistory('memory', {
      heapUsed: mem.heapUsed,
      rss: mem.rss
    });
    return this.store.metrics.memory;
  }

  collectCPU() {
    const cpuInfo = cpus();
    const loadAvg = [0, 0, 0]; // process.loadavg() not available in Bun yet

    this.store.metrics.cpu = {
      cores: cpuInfo.map((cpu, i) => ({
        model: cpu.model,
        speed: cpu.speed,
        times: cpu.times,
        usage: Math.round((cpu.times.user + cpu.times.sys) / (cpu.times.user + cpu.times.sys + cpu.times.idle) * 100)
      })),
      count: cpuInfo.length,
      loadAvg,
      history: this.store.metrics.cpu.history
    };

    return this.store.metrics.cpu;
  }

  collectSystem() {
    return {
      hostname: hostname(),
      platform: platform(),
      arch: arch(),
      uptime: uptime(),
      freemem: freemem(),
      totalmem: totalmem(),
      bun: {
        version: Bun.version,
        revision: Bun.revision
      }
    };
  }
}

// ============================================================================
// NETWORK ENGINE
// ============================================================================

class NetworkEngine {
  constructor(store) {
    this.store = store;
    this.dnsCache = new Map();
  }

  collectInterfaces() {
    const interfaces = networkInterfaces();
    const result = {};

    for (const [name, addrs] of Object.entries(interfaces)) {
      result[name] = addrs.map(addr => ({
        address: addr.address,
        netmask: addr.netmask,
        family: addr.family,
        mac: addr.mac,
        internal: addr.internal,
        cidr: addr.cidr
      }));
    }

    this.store.metrics.network.interfaces = result;
    return result;
  }

  getIPv4Addresses() {
    const interfaces = this.collectInterfaces();
    const ipv4 = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv4' && !addr.internal) {
          ipv4.push({ interface: name, address: addr.address, netmask: addr.netmask });
        }
      }
    }
    return ipv4;
  }

  getIPv6Addresses() {
    const interfaces = this.collectInterfaces();
    const ipv6 = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
      for (const addr of addrs) {
        if (addr.family === 'IPv6' && !addr.internal) {
          ipv6.push({ interface: name, address: addr.address, netmask: addr.netmask });
        }
      }
    }
    return ipv6;
  }

  async resolveDNS(hosts = CONFIG.dnsHosts) {
    const results = {};

    for (const host of hosts) {
      try {
        const start = performance.now();
        const address = await lookup(host);
        const duration = performance.now() - start;

        results[host] = {
          address: address.address,
          family: address.family,
          duration: duration.toFixed(2) + 'ms',
          cached: this.dnsCache.has(host),
          timestamp: Date.now()
        };

        this.dnsCache.set(host, results[host]);
      } catch (e) {
        results[host] = { error: e.message };
      }
    }

    this.store.metrics.network.dns = results;
    return results;
  }

  getDNSCache() {
    return Object.fromEntries(this.dnsCache);
  }
}

// ============================================================================
// FINANCIAL ENGINE
// ============================================================================

class FinancialEngine {
  constructor(store) {
    this.store = store;
    this.prices = new Map();
  }

  generateMockPrice(symbol) {
    const basePrice = {
      'AAPL': 185, 'GOOGL': 140, 'TSLA': 250, 'MSFT': 380,
      'AMZN': 175, 'NVDA': 480, 'META': 350, 'NFLX': 450
    }[symbol] || 100;

    const existing = this.prices.get(symbol) || basePrice;
    const change = (Math.random() - 0.5) * 2;
    const newPrice = Math.max(1, existing + change);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    this.prices.set(symbol, newPrice);

    return {
      symbol,
      price: newPrice.toFixed(2),
      change: change.toFixed(2),
      changePercent: ((change / existing) * 100).toFixed(2),
      volume,
      high: (newPrice + Math.random() * 5).toFixed(2),
      low: (newPrice - Math.random() * 5).toFixed(2),
      timestamp: Date.now()
    };
  }

  collectTickers() {
    const tickers = {};
    for (const symbol of CONFIG.financialSymbols) {
      tickers[symbol] = this.generateMockPrice(symbol);
    }
    this.store.metrics.financial.tickers = new Map(Object.entries(tickers));
    this.store.addToHistory('financial', tickers);
    return tickers;
  }
}

// ============================================================================
// TENSION/HURST ENGINE
// ============================================================================

class TensionEngine {
  constructor(store) {
    this.store = store;
    this.samples = [];
  }

  calculateHurst(data) {
    if (data.length < 20) return 0.5;

    const n = data.length;
    const mean = data.reduce((a, b) => a + b, 0) / n;

    let cumDev = 0;
    const Y = data.map(x => {
      cumDev += (x - mean);
      return cumDev;
    });

    const R = Math.max(...Y) - Math.min(...Y);
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
    const S = Math.sqrt(variance);

    if (S === 0) return 0.5;

    const H = Math.log(R / S) / Math.log(n);
    return Math.max(0, Math.min(1, H));
  }

  interpretHurst(h) {
    if (h < 0.4) return 'anti_persistent';
    if (h < 0.45) return 'mean_reverting';
    if (h < 0.55) return 'random_walk';
    if (h < 0.65) return 'trending';
    return 'strong_trend';
  }

  update(tensionValue) {
    this.samples.push(tensionValue);
    if (this.samples.length > 100) this.samples.shift();

    const hurst = this.calculateHurst(this.samples);
    const interpretation = this.interpretHurst(hurst);

    this.store.metrics.tension = {
      current: tensionValue,
      status: tensionValue < 0.3 ? 'low' : tensionValue < 0.6 ? 'normal' : tensionValue < 0.8 ? 'elevated' : 'critical',
      history: this.store.metrics.tension.history
    };

    this.store.metrics.hurst = {
      exponent: hurst,
      interpretation,
      history: this.store.metrics.hurst.history
    };

    this.store.addToHistory('tension', tensionValue);
    this.store.addToHistory('hurst', hurst);

    return { tension: this.store.metrics.tension, hurst: this.store.metrics.hurst };
  }
}

// ============================================================================
// HEALTH ENGINE
// ============================================================================

class HealthEngine {
  constructor(store) {
    this.store = store;
  }

  async runChecks() {
    const checks = {
      memory: this.checkMemory(),
      cpu: this.checkCPU(),
      disk: await this.checkDisk(),
      network: await this.checkNetwork(),
      bun: this.checkBun()
    };

    const allHealthy = Object.values(checks).every(c => c.status === 'healthy');

    this.store.metrics.health = {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      lastCheck: Date.now()
    };

    return this.store.metrics.health;
  }

  checkMemory() {
    const mem = process.memoryUsage();
    const heapPercent = (mem.heapUsed / mem.heapTotal) * 100;
    return {
      status: heapPercent < 80 ? 'healthy' : heapPercent < 90 ? 'warning' : 'critical',
      heapPercent: heapPercent.toFixed(1),
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1) + 'MB'
    };
  }

  checkCPU() {
    const cpuInfo = cpus();
    return {
      status: 'healthy',
      cores: cpuInfo.length,
      model: cpuInfo[0]?.model || 'unknown'
    };
  }

  async checkDisk() {
    try {
      const result = Bun.spawnSync(['df', '-h', '.'], { stdio: ['ignore', 'pipe', 'pipe'] });
      const output = result.stdout.toString();
      const lines = output.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        const usePercent = parseInt(parts[4]) || 0;
        return {
          status: usePercent < 80 ? 'healthy' : usePercent < 90 ? 'warning' : 'critical',
          used: parts[2],
          available: parts[3],
          usePercent: usePercent + '%'
        };
      }
    } catch (e) {}
    return { status: 'unknown' };
  }

  async checkNetwork() {
    try {
      const start = performance.now();
      await lookup('google.com');
      const latency = performance.now() - start;
      return {
        status: latency < 100 ? 'healthy' : latency < 500 ? 'warning' : 'critical',
        dnsLatency: latency.toFixed(1) + 'ms'
      };
    } catch (e) {
      return { status: 'critical', error: e.message };
    }
  }

  checkBun() {
    return {
      status: 'healthy',
      version: Bun.version,
      revision: Bun.revision.slice(0, 8)
    };
  }
}

// ============================================================================
// UNIFIED DASHBOARD
// ============================================================================

class UnifiedDashboard {
  constructor() {
    this.store = new MetricsStore();
    this.performance = new PerformanceEngine(this.store);
    this.system = new SystemEngine(this.store);
    this.network = new NetworkEngine(this.store);
    this.financial = new FinancialEngine(this.store);
    this.tension = new TensionEngine(this.store);
    this.health = new HealthEngine(this.store);

    this.wsClients = new Set();
    this.topics = new Map();
  }

  generateHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quantum Unified Dashboard v2.0.0</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
      color: #00f0ff;
      min-height: 100vh;
      padding: 20px;
    }
    .dashboard { max-width: 1800px; margin: 0 auto; }
    .header {
      text-align: center;
      padding: 20px;
      border-bottom: 2px solid #00f0ff33;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 2em; text-shadow: 0 0 20px #00f0ff66; }
    .header .version { color: #9d00ff; font-size: 0.9em; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
    .card {
      background: rgba(0, 240, 255, 0.05);
      border: 1px solid #00f0ff33;
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    .card h2 {
      font-size: 1.1em;
      margin-bottom: 15px;
      color: #00ff88;
      border-bottom: 1px solid #00ff8833;
      padding-bottom: 10px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ffffff11;
    }
    .metric-label { color: #888; }
    .metric-value { color: #00f0ff; font-weight: bold; }
    .metric-value.good { color: #00ff88; }
    .metric-value.warning { color: #ffaa00; }
    .metric-value.critical { color: #ff4444; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85em; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ffffff11; }
    th { color: #9d00ff; font-weight: normal; }
    .ticker-up { color: #00ff88; }
    .ticker-down { color: #ff4444; }
    .graph {
      height: 60px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      margin-top: 10px;
      position: relative;
      overflow: hidden;
    }
    .graph-bar {
      position: absolute;
      bottom: 0;
      background: linear-gradient(to top, #00f0ff, #9d00ff);
      width: 3px;
      transition: height 0.3s;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
    }
    .status-healthy { background: #00ff8833; color: #00ff88; }
    .status-warning { background: #ffaa0033; color: #ffaa00; }
    .status-critical { background: #ff444433; color: #ff4444; }
    .endpoints { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .endpoint {
      background: rgba(0, 0, 0, 0.3);
      padding: 10px;
      border-radius: 6px;
      font-size: 0.85em;
    }
    .endpoint code { color: #9d00ff; }
    .profile-bar {
      height: 20px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 4px;
      overflow: hidden;
      margin: 5px 0;
    }
    .profile-fill {
      height: 100%;
      background: linear-gradient(90deg, #00f0ff, #9d00ff);
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>QUANTUM UNIFIED DASHBOARD</h1>
      <div class="version">v2.0.0 | Bun ${Bun.version} | SIMD ENABLED</div>
    </div>
    <div class="grid" id="metrics"></div>
  </div>
  <script>
    const ws = new WebSocket('ws://localhost:${CONFIG.wsPort}');
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      document.getElementById('metrics').innerHTML = renderMetrics(data);
    };
    ws.onclose = () => setTimeout(() => location.reload(), 2000);

    function renderMetrics(m) {
      return \`
        <div class="card">
          <h2>PERFORMANCE METRICS</h2>
          <div class="metric-row"><span class="metric-label">Buffer.indexOf</span><span class="metric-value">\${m.buffer?.indexOf?.toLocaleString() || 0} ops/s</span></div>
          <div class="metric-row"><span class="metric-label">Buffer.includes</span><span class="metric-value">\${m.buffer?.includes?.toLocaleString() || 0} ops/s</span></div>
          <div class="metric-row"><span class="metric-label">Bun.spawnSync</span><span class="metric-value">\${m.spawn?.avg?.toFixed(2) || 0}ms</span></div>
          <div class="metric-row"><span class="metric-label">Promise.race</span><span class="metric-value">\${m.promise?.opsPerSec?.toLocaleString() || 0} ops/s</span></div>
          <div class="metric-row"><span class="metric-label">Response.json</span><span class="metric-value">\${m.response?.opsPerSec?.toLocaleString() || 0} ops/s</span></div>
          <div class="graph" id="perf-graph"></div>
        </div>

        <div class="card">
          <h2>SYSTEM METRICS</h2>
          <div class="metric-row"><span class="metric-label">Heap Used</span><span class="metric-value">\${(m.memory?.heapUsed / 1024 / 1024).toFixed(1) || 0} MB</span></div>
          <div class="metric-row"><span class="metric-label">Heap Total</span><span class="metric-value">\${(m.memory?.heapTotal / 1024 / 1024).toFixed(1) || 0} MB</span></div>
          <div class="metric-row"><span class="metric-label">RSS</span><span class="metric-value">\${(m.memory?.rss / 1024 / 1024).toFixed(1) || 0} MB</span></div>
          <div class="metric-row"><span class="metric-label">CPU Cores</span><span class="metric-value">\${m.cpu?.count || 0}</span></div>
          <div class="metric-row"><span class="metric-label">Uptime</span><span class="metric-value">\${m.uptime || 0}s</span></div>
          <div class="profile-bar"><div class="profile-fill" style="width: \${m.memory?.heapUsed / m.memory?.heapTotal * 100 || 0}%"></div></div>
        </div>

        <div class="card">
          <h2>SERVER METRICS</h2>
          <div class="metric-row"><span class="metric-label">Pending Requests</span><span class="metric-value">\${m.server?.pendingRequests || 0}</span></div>
          <div class="metric-row"><span class="metric-label">Pending WebSockets</span><span class="metric-value">\${m.server?.pendingWebSockets || 0}</span></div>
          <div class="metric-row"><span class="metric-label">Active Topics</span><span class="metric-value">\${m.server?.topicCount || 0}</span></div>
          <div class="metric-row"><span class="metric-label">Total Subscribers</span><span class="metric-value">\${m.server?.totalSubscribers || 0}</span></div>
        </div>

        <div class="card">
          <h2>NETWORK - IPv4/IPv6</h2>
          <table>
            <tr><th>Interface</th><th>IPv4</th><th>IPv6</th><th>Status</th></tr>
            \${Object.entries(m.network?.interfaces || {}).map(([name, addrs]) => {
              const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
              const ipv6 = addrs.find(a => a.family === 'IPv6' && !a.internal);
              return \`<tr>
                <td>\${name}</td>
                <td>\${ipv4?.address || '-'}</td>
                <td>\${ipv6?.address?.slice(0, 20) || '-'}</td>
                <td><span class="status-badge status-healthy">UP</span></td>
              </tr>\`;
            }).join('')}
          </table>
        </div>

        <div class="card">
          <h2>DNS CACHE</h2>
          <table>
            <tr><th>Host</th><th>Address</th><th>Family</th><th>Latency</th><th>Cached</th></tr>
            \${Object.entries(m.network?.dns || {}).map(([host, info]) => \`
              <tr>
                <td>\${host}</td>
                <td>\${info.address || info.error || '-'}</td>
                <td>IPv\${info.family || '?'}</td>
                <td>\${info.duration || '-'}</td>
                <td>\${info.cached ? 'YES' : 'NO'}</td>
              </tr>
            \`).join('')}
          </table>
        </div>

        <div class="card">
          <h2>FINANCIAL TICKERS</h2>
          <table>
            <tr><th>Symbol</th><th>Price</th><th>Change</th><th>%</th><th>Volume</th><th>High</th><th>Low</th></tr>
            \${Object.entries(m.financial || {}).map(([sym, t]) => \`
              <tr>
                <td>\${sym}</td>
                <td>$\${t.price}</td>
                <td class="\${parseFloat(t.change) >= 0 ? 'ticker-up' : 'ticker-down'}">\${t.change}</td>
                <td class="\${parseFloat(t.changePercent) >= 0 ? 'ticker-up' : 'ticker-down'}">\${t.changePercent}%</td>
                <td>\${parseInt(t.volume).toLocaleString()}</td>
                <td>$\${t.high}</td>
                <td>$\${t.low}</td>
              </tr>
            \`).join('')}
          </table>
        </div>

        <div class="card">
          <h2>TENSION & HURST ANALYSIS</h2>
          <div class="metric-row"><span class="metric-label">System Tension</span><span class="metric-value \${m.tension?.status === 'critical' ? 'critical' : m.tension?.status === 'elevated' ? 'warning' : 'good'}">\${m.tension?.current?.toFixed(3) || 0}</span></div>
          <div class="metric-row"><span class="metric-label">Tension Status</span><span class="metric-value">\${m.tension?.status || 'unknown'}</span></div>
          <div class="metric-row"><span class="metric-label">Hurst Exponent</span><span class="metric-value">\${m.hurst?.exponent?.toFixed(3) || 0.5}</span></div>
          <div class="metric-row"><span class="metric-label">Interpretation</span><span class="metric-value">\${m.hurst?.interpretation || 'random_walk'}</span></div>
          <div class="profile-bar"><div class="profile-fill" style="width: \${(m.tension?.current || 0) * 100}%; background: linear-gradient(90deg, #00ff88, #ffaa00, #ff4444);"></div></div>
        </div>

        <div class="card">
          <h2>HEALTH STATUS</h2>
          <div class="metric-row">
            <span class="metric-label">Overall</span>
            <span class="status-badge status-\${m.health?.status || 'healthy'}">\${(m.health?.status || 'healthy').toUpperCase()}</span>
          </div>
          \${Object.entries(m.health?.checks || {}).map(([name, check]) => \`
            <div class="metric-row">
              <span class="metric-label">\${name}</span>
              <span class="status-badge status-\${check.status}">\${check.status.toUpperCase()}</span>
            </div>
          \`).join('')}
        </div>

        <div class="card">
          <h2>API ENDPOINTS</h2>
          <div class="endpoints">
            <div class="endpoint"><code>GET /api/metrics</code> All metrics</div>
            <div class="endpoint"><code>GET /api/health</code> Health check</div>
            <div class="endpoint"><code>GET /api/performance</code> Perf data</div>
            <div class="endpoint"><code>GET /api/network</code> Network info</div>
            <div class="endpoint"><code>GET /api/financial</code> Tickers</div>
            <div class="endpoint"><code>GET /api/tension</code> Tension/Hurst</div>
            <div class="endpoint"><code>GET /api/profile</code> Profiling</div>
            <div class="endpoint"><code>WS :${CONFIG.wsPort}</code> Real-time</div>
          </div>
        </div>
      \`;
    }
  </script>
</body>
</html>`;
  }

  async collectAllMetrics() {
    // Collect all metrics in parallel
    const [memory, cpu, system, interfaces, dns, tickers, health] = await Promise.all([
      Promise.resolve(this.system.collectMemory()),
      Promise.resolve(this.system.collectCPU()),
      Promise.resolve(this.system.collectSystem()),
      Promise.resolve(this.network.collectInterfaces()),
      this.network.resolveDNS(),
      Promise.resolve(this.financial.collectTickers()),
      this.health.runChecks()
    ]);

    // Update tension with random activity
    this.tension.update(Math.random() * 0.5 + this.store.metrics.tension.current * 0.5);

    return {
      buffer: this.store.metrics.buffer,
      spawn: this.store.metrics.spawn,
      promise: this.store.metrics.promise,
      response: this.store.metrics.response,
      memory: this.store.metrics.memory,
      cpu: this.store.metrics.cpu,
      system,
      uptime: this.store.getUptime(),
      server: {
        pendingRequests: this.httpServer?.pendingRequests || 0,
        pendingWebSockets: this.httpServer?.pendingWebSockets || 0,
        topicCount: this.topics.size,
        totalSubscribers: Array.from(this.topics.values()).reduce((a, b) => a + b, 0)
      },
      network: {
        interfaces,
        dns
      },
      financial: tickers,
      tension: this.store.metrics.tension,
      hurst: this.store.metrics.hurst,
      health
    };
  }

  async start() {
    console.log('\nStarting Quantum Unified Dashboard...');
    console.log('═'.repeat(60));

    // Run initial benchmarks
    console.log('Running initial benchmarks...');
    await this.performance.runAllBenchmarks();
    console.log('  Buffer.indexOf:', this.store.metrics.buffer.indexOf, 'ops/s');
    console.log('  Bun.spawnSync:', this.store.metrics.spawn.avg.toFixed(2), 'ms');
    console.log('  Promise.race:', this.store.metrics.promise.opsPerSec, 'ops/s');

    // Start HTTP server
    this.httpServer = Bun.serve({
      port: CONFIG.httpPort,
      fetch: async (req, server) => {
        const url = new URL(req.url);

        // API endpoints
        if (url.pathname === '/api/metrics') {
          return Response.json(await this.collectAllMetrics());
        }
        if (url.pathname === '/api/health') {
          return Response.json(await this.health.runChecks());
        }
        if (url.pathname === '/api/performance') {
          return Response.json({
            buffer: this.store.metrics.buffer,
            spawn: this.store.metrics.spawn,
            promise: this.store.metrics.promise,
            response: this.store.metrics.response
          });
        }
        if (url.pathname === '/api/network') {
          return Response.json({
            interfaces: this.network.collectInterfaces(),
            ipv4: this.network.getIPv4Addresses(),
            ipv6: this.network.getIPv6Addresses(),
            dns: await this.network.resolveDNS(),
            dnsCache: this.network.getDNSCache()
          });
        }
        if (url.pathname === '/api/financial') {
          return Response.json(this.financial.collectTickers());
        }
        if (url.pathname === '/api/tension') {
          return Response.json({
            tension: this.store.metrics.tension,
            hurst: this.store.metrics.hurst
          });
        }
        if (url.pathname === '/api/profile') {
          return Response.json({
            uptime: this.store.getUptime(),
            memory: this.system.collectMemory(),
            cpu: this.system.collectCPU(),
            system: this.system.collectSystem()
          });
        }

        // Dashboard HTML
        return new Response(this.generateHTML(), {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    });

    console.log(`  HTTP Server: http://localhost:${CONFIG.httpPort}`);

    // Start WebSocket server
    this.wsServer = Bun.serve({
      port: CONFIG.wsPort,
      fetch(req, server) {
        if (server.upgrade(req)) return;
        return new Response('WebSocket upgrade required', { status: 426 });
      },
      websocket: {
        open: (ws) => {
          this.wsClients.add(ws);
          ws.subscribe('metrics');
        },
        close: (ws) => {
          this.wsClients.delete(ws);
        },
        message: (ws, message) => {
          // Handle subscriptions
          const data = JSON.parse(message);
          if (data.subscribe) {
            ws.subscribe(data.subscribe);
            this.topics.set(data.subscribe, (this.topics.get(data.subscribe) || 0) + 1);
          }
        }
      }
    });

    console.log(`  WebSocket Server: ws://localhost:${CONFIG.wsPort}`);

    // Start metrics broadcast loop
    setInterval(async () => {
      const metrics = await this.collectAllMetrics();
      this.wsServer.publish('metrics', JSON.stringify(metrics));
    }, CONFIG.refreshInterval);

    // Run periodic benchmarks
    setInterval(async () => {
      await this.performance.runAllBenchmarks();
    }, 10000);

    console.log('═'.repeat(60));
    console.log(`\nDashboard ready at http://localhost:${CONFIG.httpPort}`);
    console.log('Press Ctrl+C to stop\n');

    return this;
  }
}

// ============================================================================
// CLI
// ============================================================================

if (import.meta.main) {
  const dashboard = new UnifiedDashboard();
  await dashboard.start();
}

export { UnifiedDashboard, MetricsStore, PerformanceEngine, SystemEngine, NetworkEngine, FinancialEngine, TensionEngine, HealthEngine };
