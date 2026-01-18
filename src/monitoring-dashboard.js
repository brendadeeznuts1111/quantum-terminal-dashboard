/**
 * monitoring-dashboard.js - Real-time Monitoring Dashboard
 * Quantum Dashboard v2.0.0-rc.1
 *
 * Features:
 * - Real-time metrics collection and visualization
 * - Anomaly detection with configurable thresholds
 * - Health scoring and alerts
 * - Terminal-based dashboard using Bun.stringWidth()
 */

/**
 * Pad string to width using Bun.stringWidth() for accurate Unicode handling
 */
function padEnd(str, width, char = " ") {
  const s = String(str);
  const currentWidth = Bun.stringWidth(s);
  if (currentWidth >= width) return s;
  return s + char.repeat(width - currentWidth);
}

function padStart(str, width, char = " ") {
  const s = String(str);
  const currentWidth = Bun.stringWidth(s);
  if (currentWidth >= width) return s;
  return char.repeat(width - currentWidth) + s;
}

// ANSI codes
const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  underline: "\x1b[4m",

  // Foreground colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",

  // Cursor
  clearScreen: "\x1b[2J",
  cursorHome: "\x1b[H",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
};

class MonitoringDashboard {
  constructor(config = {}) {
    this.config = {
      refreshInterval: config.refreshInterval || 2000,
      historyLength: config.historyLength || 60,
      alertThresholds: {
        cpuPercent: config.cpuThreshold || 80,
        memoryPercent: config.memoryThreshold || 85,
        heapPercent: config.heapThreshold || 90,
        latencyMs: config.latencyThreshold || 100,
        errorRate: config.errorRateThreshold || 5,
        ...config.alertThresholds,
      },
      anomalyDetection: config.anomalyDetection !== false,
      ...config,
    };

    this.metrics = {
      cpu: [],
      memory: [],
      heap: [],
      latency: [],
      requests: [],
      errors: [],
      custom: new Map(),
    };

    this.alerts = [];
    this.anomalies = [];
    this.intervalId = null;
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
  }

  // Start monitoring
  startMonitoring() {
    console.log(`${ANSI.cyan}Starting Monitoring Dashboard...${ANSI.reset}`);
    console.log(
      `${ANSI.dim}Refresh interval: ${this.config.refreshInterval}ms${ANSI.reset}`,
    );

    this.startTime = Date.now();
    process.stdout.write(ANSI.hideCursor);

    // Initial collection
    this.collectMetrics();
    this.render();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.collectMetrics();

      if (this.config.anomalyDetection) {
        this.detectAnomalies(this.getLatestMetrics());
      }

      this.render();
    }, this.config.refreshInterval);

    // Handle exit
    process.on("SIGINT", () => this.stop());

    return this;
  }

  // Stop monitoring
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    process.stdout.write(ANSI.showCursor);
    process.stdout.write(ANSI.clearScreen + ANSI.cursorHome);
    console.log(`${ANSI.cyan}Monitoring Dashboard stopped.${ANSI.reset}`);
    console.log(this.generateReport());
  }

  // Collect current metrics
  collectMetrics() {
    const mem = process.memoryUsage();
    const now = Date.now();

    // Memory metrics
    const heapPercent = (mem.heapUsed / mem.heapTotal) * 100;
    const rssPercent = Math.min((mem.rss / (1024 * 1024 * 1024)) * 100, 100); // Assume 1GB max

    // Simulated metrics (in real use, these would come from actual sources)
    const cpuPercent = 20 + Math.random() * 30 + (heapPercent > 70 ? 20 : 0);
    const latency = 10 + Math.random() * 50 + (cpuPercent > 50 ? 30 : 0);

    // Store metrics with timestamp
    this.addMetric("cpu", cpuPercent);
    this.addMetric("memory", rssPercent);
    this.addMetric("heap", heapPercent);
    this.addMetric("latency", latency);

    // Simulate request/error rates
    const newRequests = Math.floor(Math.random() * 100) + 50;
    const newErrors = Math.random() < 0.1 ? Math.floor(Math.random() * 5) : 0;

    this.requestCount += newRequests;
    this.errorCount += newErrors;

    this.addMetric("requests", newRequests);
    this.addMetric("errors", newErrors);

    // Check thresholds
    this.checkThresholds({
      cpuPercent,
      memoryPercent: rssPercent,
      heapPercent,
      latencyMs: latency,
      errorRate: (this.errorCount / Math.max(this.requestCount, 1)) * 100,
    });
  }

  // Add metric to history
  addMetric(name, value) {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }

    this.metrics[name].push({
      value,
      timestamp: Date.now(),
    });

    // Trim history
    if (this.metrics[name].length > this.config.historyLength) {
      this.metrics[name].shift();
    }
  }

  // Get latest metrics
  getLatestMetrics() {
    const result = {};

    for (const [key, values] of Object.entries(this.metrics)) {
      if (Array.isArray(values) && values.length > 0) {
        result[key] = values[values.length - 1].value;
      }
    }

    return result;
  }

  // Check thresholds and generate alerts
  checkThresholds(metrics) {
    const thresholds = this.config.alertThresholds;

    for (const [key, threshold] of Object.entries(thresholds)) {
      if (metrics[key] !== undefined && metrics[key] > threshold) {
        this.addAlert({
          type: "threshold",
          metric: key,
          value: metrics[key],
          threshold,
          severity: metrics[key] > threshold * 1.2 ? "critical" : "warning",
          timestamp: Date.now(),
        });
      }
    }
  }

  // Add alert
  addAlert(alert) {
    // Avoid duplicate alerts within 30 seconds
    const recentAlert = this.alerts.find(
      (a) => a.metric === alert.metric && Date.now() - a.timestamp < 30000,
    );

    if (!recentAlert) {
      this.alerts.push(alert);

      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts.shift();
      }
    }
  }

  // Detect anomalies using statistical methods
  detectAnomalies(metrics) {
    for (const [key, values] of Object.entries(this.metrics)) {
      if (!Array.isArray(values) || values.length < 10) continue;

      const recentValues = values.slice(-30).map((v) => v.value);
      const mean =
        recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
      const stdDev = Math.sqrt(
        recentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          recentValues.length,
      );

      const latestValue = values[values.length - 1].value;
      const zScore = stdDev > 0 ? Math.abs(latestValue - mean) / stdDev : 0;

      // Detect anomaly if z-score > 2.5
      if (zScore > 2.5) {
        const anomaly = {
          metric: key,
          value: latestValue,
          mean: mean.toFixed(2),
          stdDev: stdDev.toFixed(2),
          zScore: zScore.toFixed(2),
          timestamp: Date.now(),
        };

        // Avoid duplicate anomalies
        const recentAnomaly = this.anomalies.find(
          (a) => a.metric === key && Date.now() - a.timestamp < 60000,
        );

        if (!recentAnomaly) {
          this.anomalies.push(anomaly);

          if (this.anomalies.length > 30) {
            this.anomalies.shift();
          }
        }
      }
    }

    return this.anomalies.slice(-5);
  }

  // Get statistics
  getStats() {
    const stats = {};

    for (const [key, values] of Object.entries(this.metrics)) {
      if (!Array.isArray(values) || values.length === 0) continue;

      const nums = values.map((v) => v.value);
      stats[key] = {
        current: nums[nums.length - 1],
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
        samples: nums.length,
      };
    }

    return stats;
  }

  // Calculate health score (0-100)
  calculateHealthScore() {
    const metrics = this.getLatestMetrics();
    const thresholds = this.config.alertThresholds;

    let score = 100;
    let factors = [];

    // CPU impact
    if (metrics.cpu) {
      const cpuImpact = Math.min(
        (metrics.cpu / thresholds.cpuPercent) * 20,
        30,
      );
      score -= cpuImpact;
      factors.push({ name: "CPU", impact: cpuImpact.toFixed(1) });
    }

    // Memory impact
    if (metrics.heap) {
      const memImpact = Math.min(
        (metrics.heap / thresholds.heapPercent) * 25,
        35,
      );
      score -= memImpact;
      factors.push({ name: "Memory", impact: memImpact.toFixed(1) });
    }

    // Latency impact
    if (metrics.latency) {
      const latImpact = Math.min(
        (metrics.latency / thresholds.latencyMs) * 15,
        20,
      );
      score -= latImpact;
      factors.push({ name: "Latency", impact: latImpact.toFixed(1) });
    }

    // Error rate impact
    const errorRate = (this.errorCount / Math.max(this.requestCount, 1)) * 100;
    if (errorRate > 0) {
      const errImpact = Math.min(errorRate * 3, 15);
      score -= errImpact;
      factors.push({ name: "Errors", impact: errImpact.toFixed(1) });
    }

    // Active alerts impact
    const recentAlerts = this.alerts.filter(
      (a) => Date.now() - a.timestamp < 60000,
    );
    score -= recentAlerts.length * 2;

    score = Math.max(0, Math.min(100, score));

    let status;
    if (score >= 90) status = "excellent";
    else if (score >= 75) status = "healthy";
    else if (score >= 50) status = "degraded";
    else if (score >= 25) status = "warning";
    else status = "critical";

    return { score: Math.round(score), status, factors };
  }

  // Generate report
  generateReport() {
    const stats = this.getStats();
    const health = this.calculateHealthScore();
    const uptime = Date.now() - this.startTime;

    return {
      timestamp: new Date().toISOString(),
      uptime: {
        ms: uptime,
        formatted: this.formatDuration(uptime),
      },
      health,
      stats,
      totals: {
        requests: this.requestCount,
        errors: this.errorCount,
        errorRate:
          ((this.errorCount / Math.max(this.requestCount, 1)) * 100).toFixed(
            2,
          ) + "%",
      },
      alerts: {
        total: this.alerts.length,
        recent: this.alerts.filter((a) => Date.now() - a.timestamp < 300000)
          .length,
        critical: this.alerts.filter((a) => a.severity === "critical").length,
      },
      anomalies: {
        total: this.anomalies.length,
        recent: this.anomalies.slice(-5),
      },
    };
  }

  // Format duration
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Draw progress bar
  progressBar(value, max = 100, width = 20, filled = "█", empty = "░") {
    const percent = Math.min(value / max, 1);
    const filledCount = Math.floor(percent * width);
    const emptyCount = width - filledCount;

    let color = ANSI.green;
    if (percent > 0.6) color = ANSI.yellow;
    if (percent > 0.8) color = ANSI.red;

    return `${color}${filled.repeat(filledCount)}${ANSI.dim}${empty.repeat(emptyCount)}${ANSI.reset}`;
  }

  // Draw sparkline
  sparkline(values, width = 20) {
    if (values.length === 0) return " ".repeat(width);

    const chars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
    const nums = values.slice(-width).map((v) => v.value);
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;

    return nums
      .map((val) => {
        const normalized = (val - min) / range;
        const index = Math.floor(normalized * (chars.length - 1));
        return chars[index];
      })
      .join("");
  }

  // Render dashboard
  render() {
    const { cols, rows } = this.getTerminalSize();
    const metrics = this.getLatestMetrics();
    const health = this.calculateHealthScore();
    const uptime = this.formatDuration(Date.now() - this.startTime);

    process.stdout.write(ANSI.clearScreen + ANSI.cursorHome);

    // Header
    console.log(
      `${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${"═".repeat(cols)}${ANSI.reset}`,
    );
    const title = "  QUANTUM MONITORING DASHBOARD";
    const time = new Date().toLocaleTimeString();
    const padding = cols - Bun.stringWidth(title) - Bun.stringWidth(time) - 4;
    console.log(
      `${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${title}${" ".repeat(padding)}${time}  ${ANSI.reset}`,
    );
    console.log(
      `${ANSI.bgBlue}${ANSI.white}${ANSI.bold}${"═".repeat(cols)}${ANSI.reset}`,
    );
    console.log();

    // Health status
    const healthColor =
      health.status === "excellent" || health.status === "healthy"
        ? ANSI.green
        : health.status === "degraded"
          ? ANSI.yellow
          : ANSI.red;
    console.log(
      `${ANSI.bold}Health:${ANSI.reset} ${healthColor}${health.status.toUpperCase()} (${health.score}/100)${ANSI.reset}  |  ${ANSI.bold}Uptime:${ANSI.reset} ${ANSI.cyan}${uptime}${ANSI.reset}`,
    );
    console.log();

    // System metrics
    console.log(`${ANSI.bold}${ANSI.underline}System Metrics${ANSI.reset}`);
    console.log();

    // CPU
    const cpu = metrics.cpu || 0;
    console.log(
      `  ${padEnd("CPU", 10)} ${this.progressBar(cpu)} ${padStart(cpu.toFixed(1) + "%", 8)}  ${ANSI.dim}${this.sparkline(this.metrics.cpu || [])}${ANSI.reset}`,
    );

    // Memory
    const heap = metrics.heap || 0;
    console.log(
      `  ${padEnd("Heap", 10)} ${this.progressBar(heap)} ${padStart(heap.toFixed(1) + "%", 8)}  ${ANSI.dim}${this.sparkline(this.metrics.heap || [])}${ANSI.reset}`,
    );

    // Latency
    const latency = metrics.latency || 0;
    const latColor = latency > 50 ? ANSI.yellow : ANSI.green;
    console.log(
      `  ${padEnd("Latency", 10)} ${latColor}${padStart(latency.toFixed(0) + "ms", 6)}${ANSI.reset}                          ${ANSI.dim}${this.sparkline(this.metrics.latency || [])}${ANSI.reset}`,
    );

    console.log();

    // Traffic metrics
    console.log(`${ANSI.bold}${ANSI.underline}Traffic${ANSI.reset}`);
    console.log();

    const errorRate = (this.errorCount / Math.max(this.requestCount, 1)) * 100;
    const errorColor = errorRate > 1 ? ANSI.red : ANSI.green;

    console.log(
      `  ${padEnd("Requests", 12)} ${ANSI.cyan}${this.requestCount.toLocaleString()}${ANSI.reset}`,
    );
    console.log(
      `  ${padEnd("Errors", 12)} ${errorColor}${this.errorCount}${ANSI.reset} (${errorRate.toFixed(2)}%)`,
    );
    console.log();

    // Recent alerts
    const recentAlerts = this.alerts
      .filter((a) => Date.now() - a.timestamp < 300000)
      .slice(-3);
    console.log(
      `${ANSI.bold}${ANSI.underline}Alerts${ANSI.reset} (${recentAlerts.length} recent)`,
    );
    console.log();

    if (recentAlerts.length === 0) {
      console.log(`  ${ANSI.dim}No recent alerts${ANSI.reset}`);
    } else {
      for (const alert of recentAlerts) {
        const alertColor =
          alert.severity === "critical" ? ANSI.red : ANSI.yellow;
        const age = Math.floor((Date.now() - alert.timestamp) / 1000);
        console.log(
          `  ${alertColor}● ${alert.metric}${ANSI.reset}: ${alert.value.toFixed(1)} > ${alert.threshold} ${ANSI.dim}(${age}s ago)${ANSI.reset}`,
        );
      }
    }

    console.log();

    // Recent anomalies
    const recentAnomalies = this.anomalies.slice(-2);
    if (recentAnomalies.length > 0) {
      console.log(
        `${ANSI.bold}${ANSI.underline}Anomalies Detected${ANSI.reset}`,
      );
      console.log();
      for (const anomaly of recentAnomalies) {
        console.log(
          `  ${ANSI.magenta}◆ ${anomaly.metric}${ANSI.reset}: z-score ${anomaly.zScore} ${ANSI.dim}(value: ${typeof anomaly.value === "number" ? anomaly.value.toFixed(1) : anomaly.value}, mean: ${anomaly.mean})${ANSI.reset}`,
        );
      }
      console.log();
    }

    // Footer
    console.log(`${ANSI.dim}${"─".repeat(cols)}${ANSI.reset}`);
    console.log(
      `${ANSI.dim}Refresh: ${this.config.refreshInterval}ms  |  History: ${this.config.historyLength} samples  |  Press Ctrl+C to exit${ANSI.reset}`,
    );
  }

  // Get terminal size
  getTerminalSize() {
    return {
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
    };
  }

  // Add custom metric
  addCustomMetric(name, value) {
    this.addMetric(name, value);
    this.metrics.custom.set(name, {
      values: this.metrics[name],
      lastUpdated: Date.now(),
    });
  }

  // Get custom metric
  getCustomMetric(name) {
    return this.metrics.custom.get(name);
  }
}

// CLI interface
if (import.meta.main) {
  const args = Bun.argv.slice(2);

  const config = {
    refreshInterval: parseInt(process.env.REFRESH_INTERVAL || "2000"),
    historyLength: parseInt(process.env.HISTORY_LENGTH || "60"),
    anomalyDetection: process.env.ANOMALY_DETECTION !== "false",
  };

  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--interval" || args[i] === "-i") {
      config.refreshInterval = parseInt(args[++i]) || 2000;
    }
    if (args[i] === "--history" || args[i] === "-h") {
      config.historyLength = parseInt(args[++i]) || 60;
    }
    if (args[i] === "--no-anomaly") {
      config.anomalyDetection = false;
    }
    if (args[i] === "--help") {
      console.log(`
Quantum Monitoring Dashboard

Usage: bun run monitoring-dashboard.js [options]

Options:
  -i, --interval <ms>   Refresh interval (default: 2000)
  -h, --history <n>     History length (default: 60)
  --no-anomaly          Disable anomaly detection
  --help                Show this help

Environment variables:
  REFRESH_INTERVAL      Refresh interval in ms
  HISTORY_LENGTH        Number of samples to keep
  ANOMALY_DETECTION     Enable/disable anomaly detection (true/false)
`);
      process.exit(0);
    }
  }

  const dashboard = new MonitoringDashboard(config);
  dashboard.startMonitoring();
}

export { MonitoringDashboard };
