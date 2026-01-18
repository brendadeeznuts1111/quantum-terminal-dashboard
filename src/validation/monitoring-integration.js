/**
 * monitoring-integration.js - Integration with Existing Monitoring System
 * Connects quantum validation system with the current monitoring infrastructure
 */

import { BunVersionValidator } from "./version-validation.js";
import { TensionDecayEngine } from "./tension-decay-engine.js";
import { BundleValidator } from "./bundle-validator.js";

export class MonitoringIntegration {
  constructor(monitoringSystem) {
    this.monitoring = monitoringSystem;
    this.validators = {
      version: new BunVersionValidator(),
      bundle: new BundleValidator(),
    };
    this.metrics = new Map();
    this.alerts = [];
    this.integrationActive = false;
  }

  async initialize() {
    console.log("🔗 Initializing Quantum Monitoring Integration...");

    // Validate Bun version first
    const versionValidation = this.validators.version.validate();
    if (!versionValidation.supported) {
      throw new Error(`Bun version ${versionValidation.version} not supported`);
    }

    // Initialize metrics collection
    this.setupMetricsCollection();

    // Setup alert handlers
    this.setupAlertHandlers();

    // Connect to existing monitoring endpoints
    await this.connectToMonitoringEndpoints();

    this.integrationActive = true;
    console.log("✅ Quantum Monitoring Integration initialized");

    return {
      version: versionValidation.version,
      features: versionValidation.features,
      metrics: this.metrics.size,
      endpoints: this.monitoring.endpoints?.length || 0,
    };
  }

  setupMetricsCollection() {
    // System metrics
    this.metrics.set("system.bun_version", {
      type: "gauge",
      description: "Bun runtime version",
      collect: () => Bun.version,
    });

    this.metrics.set("system.string_width_performance", {
      type: "gauge",
      description: "String width performance (ops/sec)",
      collect: () => {
        const benchmark = this.validators.version.benchmarkStringWidth();
        return benchmark.opsPerSecond;
      },
    });

    this.metrics.set("system.buffer_search_performance", {
      type: "gauge",
      description: "Buffer search performance (ops/sec)",
      collect: () => {
        const benchmark = this.validators.version.benchmarkBufferOps();
        return benchmark.opsPerSecond;
      },
    });

    // Feature availability metrics
    this.metrics.set("features.terminal_available", {
      type: "boolean",
      description: "PTY Terminal feature availability",
      collect: () => this.validators.version.checkFeature("terminal"),
    });

    this.metrics.set("features.simd_available", {
      type: "boolean",
      description: "SIMD optimization availability",
      collect: () => this.validators.version.checkFeature("spawnSync"),
    });

    // Validation metrics
    this.metrics.set("validation.bundle_score", {
      type: "gauge",
      description: "Bundle validation score (0-100)",
      collect: async () => {
        try {
          const result = await this.validators.bundle.validateBundle(
            "./dist/",
            {
              features: ["TERMINAL", "SIMD_BUFFER"],
            },
          );
          return result.score;
        } catch {
          return 0;
        }
      },
    });

    this.metrics.set("validation.last_check", {
      type: "timestamp",
      description: "Last validation check timestamp",
      collect: () => Date.now(),
    });
  }

  setupAlertHandlers() {
    // Version compatibility alerts
    this.alerts.push({
      name: "bun_version_compatibility",
      threshold: { operator: "<", value: "1.3.5" },
      severity: "critical",
      message: "Bun version below minimum requirement",
      check: () => {
        const version = Bun.version;
        return this.compareVersions(version, "1.3.5") < 0;
      },
    });

    // Performance degradation alerts
    this.alerts.push({
      name: "string_width_performance_degradation",
      threshold: { operator: "<", value: 1000000 },
      severity: "warning",
      message: "String width performance degraded below 1M ops/sec",
      check: async () => {
        const benchmark = this.validators.version.benchmarkStringWidth();
        return benchmark.opsPerSecond < 1000000;
      },
    });

    // Bundle validation alerts
    this.alerts.push({
      name: "bundle_validation_failure",
      threshold: { operator: "<", value: 70 },
      severity: "critical",
      message: "Bundle validation score below 70",
      check: async () => {
        try {
          const result = await this.validators.bundle.validateBundle(
            "./dist/",
            {
              features: ["TERMINAL", "SIMD_BUFFER"],
            },
          );
          return result.score < 70;
        } catch {
          return true; // Assume failure if validation throws
        }
      },
    });

    // Feature availability alerts
    this.alerts.push({
      name: "missing_critical_features",
      threshold: { operator: ">", value: 0 },
      severity: "warning",
      message: "Critical features missing",
      check: () => {
        const validation = this.validators.version.validate();
        const criticalFeatures = ["terminal", "spawnSync", "stringWidth"];
        const missing = criticalFeatures.filter((f) => !validation.features[f]);
        return missing.length > 0;
      },
    });
  }

  async connectToMonitoringEndpoints() {
    if (!this.monitoring.endpoints) {
      console.log("⚠️ No monitoring endpoints configured");
      return;
    }

    for (const endpoint of this.monitoring.endpoints) {
      try {
        await this.registerMetricsEndpoint(endpoint);
        console.log(`📡 Connected to monitoring endpoint: ${endpoint.url}`);
      } catch (error) {
        console.warn(
          `⚠️ Failed to connect to ${endpoint.url}: ${error.message}`,
        );
      }
    }
  }

  async registerMetricsEndpoint(endpoint) {
    // Register quantum-specific metrics with the monitoring system
    const metricsData = {
      source: "quantum-validation",
      timestamp: Date.now(),
      metrics: {},
    };

    // Collect all metrics
    for (const [name, metric] of this.metrics) {
      try {
        const value = await metric.collect();
        metricsData.metrics[name] = {
          type: metric.type,
          value,
          description: metric.description,
        };
      } catch (error) {
        console.warn(`⚠️ Failed to collect metric ${name}: ${error.message}`);
      }
    }

    // Send to endpoint
    if (endpoint.url && endpoint.method === "POST") {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...endpoint.headers,
        },
        body: JSON.stringify(metricsData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }
  }

  async collectMetrics() {
    if (!this.integrationActive) {
      throw new Error("Monitoring integration not initialized");
    }

    const metrics = {};
    const collectionTime = Date.now();

    for (const [name, metric] of this.metrics) {
      try {
        const value = await metric.collect();
        metrics[name] = {
          type: metric.type,
          value,
          description: metric.description,
          collected_at: collectionTime,
        };
      } catch (error) {
        metrics[name] = {
          type: metric.type,
          value: null,
          error: error.message,
          collected_at: collectionTime,
        };
      }
    }

    return {
      timestamp: collectionTime,
      source: "quantum-validation",
      metrics,
      summary: this.generateMetricsSummary(metrics),
    };
  }

  async checkAlerts() {
    if (!this.integrationActive) {
      throw new Error("Monitoring integration not initialized");
    }

    const activeAlerts = [];

    for (const alert of this.alerts) {
      try {
        const triggered = await alert.check();
        if (triggered) {
          activeAlerts.push({
            ...alert,
            triggered_at: Date.now(),
            status: "active",
          });
        }
      } catch (error) {
        activeAlerts.push({
          ...alert,
          triggered_at: Date.now(),
          status: "error",
          error: error.message,
        });
      }
    }

    // Send alerts to monitoring system
    if (activeAlerts.length > 0 && this.monitoring.alerts) {
      await this.sendAlerts(activeAlerts);
    }

    return activeAlerts;
  }

  async sendAlerts(alerts) {
    if (!this.monitoring.alerts?.endpoint) {
      console.warn("⚠️ No alerts endpoint configured");
      return;
    }

    const alertData = {
      source: "quantum-validation",
      timestamp: Date.now(),
      alerts: alerts.map((alert) => ({
        name: alert.name,
        severity: alert.severity,
        message: alert.message,
        triggered_at: alert.triggered_at,
        status: alert.status,
      })),
    };

    try {
      const response = await fetch(this.monitoring.alerts.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`🚨 Sent ${alerts.length} alerts to monitoring system`);
    } catch (error) {
      console.error(`❌ Failed to send alerts: ${error.message}`);
    }
  }

  generateMetricsSummary(metrics) {
    const summary = {
      total_metrics: Object.keys(metrics).length,
      successful_metrics: 0,
      failed_metrics: 0,
      critical_issues: 0,
      warnings: 0,
    };

    for (const [name, data] of Object.entries(metrics)) {
      if (data.error) {
        summary.failed_metrics++;
      } else {
        summary.successful_metrics++;

        // Check for critical values
        if (name.includes("score") && data.value < 70) {
          summary.critical_issues++;
        } else if (name.includes("performance") && data.value < 1000000) {
          summary.warnings++;
        }
      }
    }

    summary.health_score =
      summary.failed_metrics === 0 && summary.critical_issues === 0
        ? "healthy"
        : summary.critical_issues > 0
          ? "critical"
          : "warning";

    return summary;
  }

  compareVersions(version1, version2) {
    const v1Parts = version1.split(".").map(Number);
    const v2Parts = version2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }

  async startPeriodicMonitoring(intervalMs = 30000) {
    if (!this.integrationActive) {
      throw new Error("Monitoring integration not initialized");
    }

    console.log(`🔄 Starting periodic monitoring (interval: ${intervalMs}ms)`);

    this.monitoringTimer = setInterval(async () => {
      try {
        // Collect metrics
        const metrics = await this.collectMetrics();

        // Check alerts
        const alerts = await this.checkAlerts();

        // Log summary
        console.log(
          `📊 Monitoring Update: ${metrics.summary.successful_metrics}/${metrics.summary.total_metrics} metrics, ${alerts.length} alerts`,
        );

        // Send to monitoring endpoints
        if (this.monitoring.endpoints) {
          for (const endpoint of this.monitoring.endpoints) {
            try {
              await this.registerMetricsEndpoint(endpoint);
            } catch (error) {
              console.warn(
                `⚠️ Failed to send metrics to ${endpoint.url}: ${error.message}`,
              );
            }
          }
        }
      } catch (error) {
        console.error(`❌ Monitoring error: ${error.message}`);
      }
    }, intervalMs);
  }

  stopPeriodicMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log("⏹️ Periodic monitoring stopped");
    }
  }

  async generateHealthReport() {
    if (!this.integrationActive) {
      throw new Error("Monitoring integration not initialized");
    }

    const metrics = await this.collectMetrics();
    const alerts = await this.checkAlerts();
    const versionValidation = this.validators.version.validate();

    const report = {
      timestamp: Date.now(),
      system: {
        bun_version: versionValidation.version,
        platform: process.platform,
        arch: process.arch,
        node_version: process.version,
      },
      features: versionValidation.features,
      metrics: metrics.summary,
      alerts: {
        total: alerts.length,
        critical: alerts.filter((a) => a.severity === "critical").length,
        warning: alerts.filter((a) => a.severity === "warning").length,
        active: alerts,
      },
      health: {
        status: metrics.summary.health_score,
        score: this.calculateHealthScore(metrics, alerts),
        recommendations: this.generateRecommendations(metrics, alerts),
      },
    };

    return report;
  }

  calculateHealthScore(metrics, alerts) {
    let score = 100;

    // Deduct for failed metrics
    score -= metrics.summary.failed_metrics * 10;

    // Deduct for critical issues
    score -= metrics.summary.critical_issues * 20;

    // Deduct for warnings
    score -= metrics.summary.warnings * 5;

    // Deduct for active alerts
    score -= alerts.filter((a) => a.severity === "critical").length * 15;
    score -= alerts.filter((a) => a.severity === "warning").length * 5;

    return Math.max(0, Math.min(100, score));
  }

  generateRecommendations(metrics, alerts) {
    const recommendations = [];

    if (metrics.summary.failed_metrics > 0) {
      recommendations.push("🔧 Fix failed metric collections");
    }

    if (metrics.summary.critical_issues > 0) {
      recommendations.push("🚨 Address critical validation issues");
    }

    if (alerts.some((a) => a.name === "bun_version_compatibility")) {
      recommendations.push("📦 Upgrade Bun to minimum version 1.3.5");
    }

    if (alerts.some((a) => a.name === "bundle_validation_failure")) {
      recommendations.push("🔍 Fix bundle validation issues");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ System operating normally");
    }

    return recommendations;
  }

  async shutdown() {
    console.log("🛑 Shutting down Quantum Monitoring Integration...");

    this.stopPeriodicMonitoring();
    this.integrationActive = false;

    console.log("✅ Quantum Monitoring Integration shut down");
  }
}

export default MonitoringIntegration;
