"use strict";

/**
 * tension-decay-engine.js - Advanced Tension Decay with Analytics
 * Prevents tension saturation and provides performance insights
 */

export class TensionDecayEngine {
  constructor(engine, decayRate = 0.02) {
    this.engine = engine;
    this.decayRate = decayRate;
    this._decayMul = 1 - this.decayRate; // Pre-compute decay multiplier
    this.decayInterval = 100; // ms
    this.decayTimer = null;
    this.history = new Map();
    this._historyBuffers = new Map(); // Circular buffers for history
    this._historyHeads = new Map(); // Head pointers for circular buffers

    // Freeze enum-like objects for JSC optimization
    this.DECAY_LEVELS = Object.freeze({
      LOW: 0.01,
      MEDIUM: 0.05,
      HIGH: 0.1,
      CRITICAL: 0.2,
    });

    this.HEALTH_STATUS = Object.freeze({
      HEALTHY: "healthy",
      WARNING: "warning",
      CRITICAL: "critical",
    });

    this.analytics = {
      totalDecays: 0,
      averageDecayTime: 0,
      peakTension: 0,
      decayEvents: [],
    };

    // Performance-optimized decay using Bun's fast timers
    this.startDecay();
  }

  startDecay() {
    if (this.decayTimer) clearInterval(this.decayTimer);

    this.decayTimer = setInterval(() => {
      const start = performance.now();

      for (const [id, component] of this.engine.componentMatrix) {
        // Fast-path: skip components below noise floor (hoisted above loop)
        if (component.tension <= 0.01) continue;

        const before = component.tension;

        // Inline getDampingFactor: call overhead is 3× the math itself
        const history = this.history.get(id) || [];
        const recentEvents = history.filter(
          (h) => Date.now() - h.timestamp < 5000,
        );
        const eventCount = recentEvents.length;
        const damping = Math.max(0.5, Math.min(2.0, 1 - eventCount * 0.1));

        // Apply decay with pre-computed multiplier
        const decayed = before * (1 - this.decayRate * damping);

        // Single branch Math.max replacement: no function call
        component.tension = decayed < 0 ? 0 : decayed;
        component.hslColor = this.engine.tensionToHSL(component.tension);

        // Store history for analysis
        this.recordDecay(id, before, component.tension);

        // Track peak tension
        if (before > this.analytics.peakTension) {
          this.analytics.peakTension = before;
        }
      }

      const duration = performance.now() - start;
      this.analytics.totalDecays++;
      this.analytics.averageDecayTime =
        (this.analytics.averageDecayTime * (this.analytics.totalDecays - 1) +
          duration) /
        this.analytics.totalDecays;

      if (duration > 5) {
        Bun.stderr.write(
          `⚠️ Decay took ${duration.toFixed(1)}ms (threshold: 5ms)\n`,
        );
      }
    }, this.decayInterval);
  }

  getDampingFactor(componentId) {
    const history = this.history.get(componentId) || [];
    const recentEvents = history.filter((h) => Date.now() - h.timestamp < 5000);

    // More events = slower decay
    const eventCount = recentEvents.length;
    return Math.max(0.5, Math.min(2.0, 1 - eventCount * 0.1));
  }

  recordDecay(id, before, after) {
    // Initialize circular buffer for component if needed
    if (!this._historyBuffers.has(id)) {
      this._historyBuffers.set(id, new Array(1024)); // 1024 mask = cheap modulo
      this._historyHeads.set(id, 0);
      this.history.set(id, []); // Keep legacy array for compatibility
    }

    const buffer = this._historyBuffers.get(id);
    const head = this._historyHeads.get(id);

    const decayEvent = {
      timestamp: Date.now(),
      before,
      after,
      delta: after - before,
      decayRate: this.decayRate,
    };

    // Store in circular buffer: cheap modulo with power-of-2 size
    buffer[head] = decayEvent;
    this._historyHeads.set(id, (head + 1) & 1023); // 1024 mask = cheap modulo

    // Keep legacy array for backward compatibility (limited to 1000 entries)
    const history = this.history.get(id);
    history.push(decayEvent);
    if (history.length > 1000) history.shift();

    // Global events: use circular buffer for analytics
    this.analytics.decayEvents.push(decayEvent);
    if (this.analytics.decayEvents.length > 10000) {
      this.analytics.decayEvents.shift();
    }
  }

  getDecayAnalytics() {
    const analytics = {};

    for (const [id, history] of this.history) {
      if (history.length < 2) continue;

      const recent = history.slice(-100);
      const avgDecay =
        recent.reduce((sum, h) => sum + h.delta, 0) / recent.length;
      const volatility = Math.sqrt(
        recent.reduce((sum, h) => sum + Math.pow(h.delta - avgDecay, 2), 0) /
          recent.length,
      );

      // Calculate trend
      const firstHalf = recent.slice(0, 50);
      const secondHalf = recent.slice(-50);
      const firstAvg =
        firstHalf.reduce((sum, h) => sum + h.after, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, h) => sum + h.after, 0) / secondHalf.length;
      const trend = secondAvg - firstAvg;

      analytics[id] = {
        averageDecay: avgDecay,
        volatility,
        historyLength: history.length,
        currentTension: this.engine.componentMatrix.get(id)?.tension || 0,
        trend:
          trend > 0.01 ? "increasing" : trend < -0.01 ? "decreasing" : "stable",
        lastActivity: history[history.length - 1]?.timestamp || 0,
      };
    }

    return analytics;
  }

  getSystemHealth() {
    const analytics = this.getDecayAnalytics();

    // If no decay history, use current component tensions
    let componentIds = Object.keys(analytics);
    let tensions = [];

    if (componentIds.length === 0) {
      // Use current component matrix tensions
      if (this.engine.componentMatrix && this.engine.componentMatrix.size > 0) {
        for (const [id, component] of this.engine.componentMatrix) {
          tensions.push(component.tension || 0);
        }
        componentIds = Array.from(this.engine.componentMatrix.keys());
      }
    } else {
      // Use analytics tensions
      tensions = componentIds.map((id) => analytics[id].currentTension || 0);
    }

    if (componentIds.length === 0) {
      return { status: "unknown", score: 0, issues: ["No components found"] };
    }

    // Calculate health metrics
    const avgTension =
      tensions.reduce((sum, tension) => sum + tension, 0) / tensions.length;
    const avgVolatility =
      componentIds.length > 0
        ? componentIds.reduce(
            (sum, id) => sum + (analytics[id]?.volatility || 0),
            0,
          ) / componentIds.length
        : 0;
    const increasingComponents = componentIds.filter(
      (id) => analytics[id]?.trend === "increasing",
    ).length;

    // Determine health status
    let status = "healthy";
    let score = 100;
    const issues = [];

    if (avgTension > 0.7) {
      status = "critical";
      score -= 40;
      issues.push("High average tension");
    } else if (avgTension > 0.5) {
      status = "warning";
      score -= 20;
      issues.push("Elevated tension levels");
    }

    if (avgVolatility > 0.1) {
      status = status === "healthy" ? "warning" : "critical";
      score -= 15;
      issues.push("High volatility detected");
    }

    if (increasingComponents > componentIds.length * 0.5) {
      status = "critical";
      score -= 25;
      issues.push("Multiple components increasing");
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      metrics: {
        avgTension,
        avgVolatility,
        totalComponents: componentIds.length,
        increasingComponents,
        decayRate: this.decayRate,
      },
    };
  }

  setDecayRate(newRate) {
    if (newRate < 0 || newRate > 1) {
      throw new Error("Decay rate must be between 0 and 1");
    }

    this.decayRate = newRate;
    this._decayMul = 1 - this.decayRate; // Update pre-computed multiplier
    Bun.stdout.write(
      `📊 Decay rate updated to ${(newRate * 100).toFixed(1)}%\n`,
    );
  }

  forceDecay(componentId, factor = 1.0) {
    const component = this.engine.componentMatrix.get(componentId);
    if (!component) {
      throw new Error(`Component ${componentId} not found`);
    }

    const before = component.tension;
    component.tension = Math.max(
      0,
      component.tension * (1 - this.decayRate * factor),
    );
    component.hslColor = this.engine.tensionToHSL(component.tension);

    this.recordDecay(componentId, before, component.tension);

    return {
      componentId,
      before,
      after: component.tension,
      reduction: before - component.tension,
    };
  }

  stop() {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
      Bun.stdout.write("⏹️ Tension decay engine stopped\n");
    }
  }

  start() {
    if (!this.decayTimer) {
      this.startDecay();
      Bun.stdout.write("▶️ Tension decay engine started\n");
    }
  }

  generateReport() {
    const analytics = this.getDecayAnalytics();
    const health = this.getSystemHealth();

    Bun.stdout.write("📊 TENSION DECAY ENGINE REPORT\n");
    Bun.stdout.write("=".repeat(50) + "\n");
    Bun.stdout.write(`⚙️  Decay Rate: ${(this.decayRate * 100).toFixed(1)}%\n`);
    Bun.stdout.write(
      `🔄 Total Decays: ${this.analytics.totalDecays.toLocaleString()}\n`,
    );
    Bun.stdout.write(
      `⏱️  Avg Decay Time: ${this.analytics.averageDecayTime.toFixed(3)}ms\n`,
    );
    Bun.stdout.write(
      `📈 Peak Tension: ${(this.analytics.peakTension * 100).toFixed(1)}%\n`,
    );
    Bun.stdout.write("\n");

    Bun.stdout.write(
      `🏥 System Health: ${health.status.toUpperCase()} (${health.score}/100)\n`,
    );
    if (health.issues.length > 0) {
      Bun.stdout.write("⚠️  Issues:\n");
      health.issues.forEach((issue) => Bun.stdout.write(`   - ${issue}\n`));
    }
    Bun.stdout.write("\n");

    Bun.stdout.write("📋 COMPONENT ANALYTICS:\n");
    Object.entries(analytics).forEach(([id, data]) => {
      const tensionBar =
        "█".repeat(Math.floor(data.currentTension * 20)) +
        "░".repeat(20 - Math.floor(data.currentTension * 20));
      const trendIcon =
        data.trend === "increasing"
          ? "📈"
          : data.trend === "decreasing"
            ? "📉"
            : "➡️";

      Bun.stdout.write(`\n${id}:\n`);
      Bun.stdout.write(
        `  Tension: [${tensionBar}] ${(data.currentTension * 100).toFixed(1)}% ${trendIcon}\n`,
      );
      Bun.stdout.write(
        `  Volatility: ${(data.volatility * 100).toFixed(2)}%\n`,
      );
      Bun.stdout.write(`  Events: ${data.historyLength.toLocaleString()}\n`);
    });

    return { analytics, health, systemInfo: this.analytics };
  }
}

export default TensionDecayEngine;
