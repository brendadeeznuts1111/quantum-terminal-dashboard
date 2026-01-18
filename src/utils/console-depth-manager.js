// [DOMAIN][CONSOLE][DEPTH][HSL:220,70%,85%][META:{DEBUGGING}][CLASS:ConsoleDepthManager]{BUN-API}

/**
 * Console Depth Manager for Quantum System
 * Manages console output depth for better debugging and monitoring
 */

class ConsoleDepthManager {
  constructor() {
    this.defaultDepth = 2;
    this.maxDepth = 10;
    this.depthPresets = {
      minimal: 1,
      default: 2,
      detailed: 4,
      verbose: 6,
      full: 10,
    };
  }

  /**
   * Get current console depth from process arguments
   */
  getCurrentDepth() {
    const args = process.argv;
    const depthIndex = args.findIndex((arg) =>
      arg.startsWith("--console-depth"),
    );

    if (depthIndex !== -1) {
      const depthValue = args[depthIndex].split("=")[1] || args[depthIndex + 1];
      const depth = parseInt(depthValue);
      return isNaN(depth)
        ? this.defaultDepth
        : Math.min(Math.max(depth, 1), this.maxDepth);
    }

    return this.defaultDepth;
  }

  /**
   * Set console depth programmatically
   */
  setConsoleDepth(depth) {
    const validDepth = Math.min(Math.max(depth, 1), this.maxDepth);
    console.log(`🔧 Console depth set to: ${validDepth}`);
    return validDepth;
  }

  /**
   * Log with depth awareness
   */
  logWithDepth(data, label = "Data", customDepth = null) {
    const depth = customDepth || this.getCurrentDepth();

    console.log(`\n📊 ${label} (depth: ${depth})`);
    console.log("=".repeat(50));

    if (depth === 1) {
      console.log(this.summarizeData(data));
    } else {
      console.log(data);
    }
  }

  /**
   * Summarize data for minimal depth
   */
  summarizeData(data) {
    if (typeof data !== "object" || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return `Array(${data.length}) [${data
        .slice(0, 3)
        .map((item) => (typeof item === "object" ? "{...}" : String(item)))
        .join(", ")}${data.length > 3 ? "..." : ""}]`;
    }

    const keys = Object.keys(data);
    const summary = {};

    keys.slice(0, 5).forEach((key) => {
      const value = data[key];
      if (typeof value === "object" && value !== null) {
        summary[key] = Array.isArray(value)
          ? `Array(${value.length})`
          : "{...}";
      } else {
        summary[key] = value;
      }
    });

    if (keys.length > 5) {
      summary["..."] = `${keys.length - 5} more properties`;
    }

    return summary;
  }

  /**
   * Create depth-aware logging functions
   */
  createDepthLogger() {
    const depth = this.getCurrentDepth();

    return {
      log: (data, label) => this.logWithDepth(data, label, depth),
      minimal: (data, label) => this.logWithDepth(data, label, 1),
      detailed: (data, label) => this.logWithDepth(data, label, 4),
      verbose: (data, label) => this.logWithDepth(data, label, 6),
      full: (data, label) => this.logWithDepth(data, label, 10),

      // Quantum-specific logging
      quantumMetrics: (metrics) => this.logQuantumMetrics(metrics, depth),
      systemHealth: (health) => this.logSystemHealth(health, depth),
      performanceData: (perf) => this.logPerformanceData(perf, depth),
    };
  }

  /**
   * Quantum system specific logging
   */
  logQuantumMetrics(metrics, depth) {
    console.log("\n⚛️ QUANTUM SYSTEM METRICS");
    console.log("=".repeat(50));

    if (depth <= 2) {
      console.log({
        systemTension: metrics.system?.tension?.current || "N/A",
        systemHealth: metrics.system?.tension?.status || "N/A",
        cpuUsage: metrics.system?.performance?.cpu?.usage || "N/A",
        memoryUsage: metrics.system?.performance?.memory?.percent || "N/A",
        networkConnections:
          metrics.system?.network?.connections?.active || "N/A",
      });
    } else {
      console.log(metrics);
    }
  }

  /**
   * System health logging
   */
  logSystemHealth(health, depth) {
    console.log("\n🏥 SYSTEM HEALTH STATUS");
    console.log("=".repeat(50));

    if (depth <= 2) {
      console.log({
        overall: health.overall || "unknown",
        score: health.score || 0,
        issues: health.issues?.length || 0,
        lastCheck: health.timestamp || new Date().toISOString(),
      });
    } else {
      console.log(health);
    }
  }

  /**
   * Performance data logging
   */
  logPerformanceData(performance, depth) {
    console.log("\n🚀 PERFORMANCE DATA");
    console.log("=".repeat(50));

    if (depth <= 2) {
      console.log({
        responseTime: performance.responseTime || "N/A",
        throughput: performance.throughput || "N/A",
        errorRate: performance.errorRate || "N/A",
        uptime: performance.uptime || "N/A",
      });
    } else {
      console.log(performance);
    }
  }

  /**
   * Show depth comparison
   */
  showDepthComparison(data) {
    console.log("\n🔍 CONSOLE DEPTH COMPARISON");
    console.log("=".repeat(80));

    const depths = [1, 2, 4, 6];

    depths.forEach((depth) => {
      console.log(`\n--- Depth ${depth} ---`);
      if (depth === 1) {
        console.log(this.summarizeData(data));
      } else {
        // Simulate console depth by truncating
        console.log(this.truncateObject(data, depth));
      }
    });
  }

  /**
   * Truncate object to specified depth
   */
  truncateObject(obj, maxDepth, currentDepth = 1) {
    if (currentDepth > maxDepth || typeof obj !== "object" || obj === null) {
      return typeof obj === "object" ? "[Object]" : obj;
    }

    if (Array.isArray(obj)) {
      if (currentDepth === maxDepth) {
        return `Array(${obj.length})`;
      }
      return obj.map((item) =>
        this.truncateObject(item, maxDepth, currentDepth + 1),
      );
    }

    const result = {};
    const keys = Object.keys(obj);

    keys.forEach((key) => {
      if (currentDepth === maxDepth) {
        result[key] = typeof obj[key] === "object" ? "[Object]" : obj[key];
      } else {
        result[key] = this.truncateObject(obj[key], maxDepth, currentDepth + 1);
      }
    });

    return result;
  }

  /**
   * Get depth recommendations
   */
  getDepthRecommendations(data) {
    const complexity = this.analyzeComplexity(data);

    console.log("\n💡 DEPTH RECOMMENDATIONS");
    console.log("=".repeat(50));

    switch (complexity) {
      case "simple":
        console.log("🟢 Simple data structure - use depth 1-2");
        break;
      case "moderate":
        console.log("🟡 Moderate complexity - use depth 2-4");
        break;
      case "complex":
        console.log("🟠 Complex data structure - use depth 4-6");
        break;
      case "very_complex":
        console.log("🔴 Very complex - use depth 6-10");
        break;
    }

    console.log("\n📊 Current depth:", this.getCurrentDepth());
    console.log("🎯 Recommended depth:", this.getRecommendedDepth(complexity));
  }

  /**
   * Analyze data complexity
   */
  analyzeComplexity(data, currentDepth = 0) {
    if (currentDepth > 3) return "very_complex";
    if (typeof data !== "object" || data === null) return "simple";

    if (Array.isArray(data)) {
      if (data.length > 10) return "complex";
      if (data.some((item) => typeof item === "object" && item !== null)) {
        return this.analyzeComplexity(data[0], currentDepth + 1);
      }
      return "simple";
    }

    const keys = Object.keys(data);
    if (keys.length > 10) return "complex";

    const hasNestedObjects = keys.some(
      (key) => typeof data[key] === "object" && data[key] !== null,
    );

    if (!hasNestedObjects) return "simple";

    const nestedComplexities = keys
      .filter((key) => typeof data[key] === "object" && data[key] !== null)
      .map((key) => this.analyzeComplexity(data[key], currentDepth + 1));

    if (nestedComplexities.some((c) => c === "very_complex"))
      return "very_complex";
    if (nestedComplexities.some((c) => c === "complex")) return "complex";
    if (nestedComplexities.some((c) => c === "moderate")) return "moderate";
    return "moderate";
  }

  /**
   * Get recommended depth based on complexity
   */
  getRecommendedDepth(complexity) {
    switch (complexity) {
      case "simple":
        return 1;
      case "moderate":
        return 2;
      case "complex":
        return 4;
      case "very_complex":
        return 6;
      default:
        return 2;
    }
  }
}

// CLI interface
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0] || "help";

  const manager = new ConsoleDepthManager();

  switch (command) {
    case "current":
      console.log(`Current console depth: ${manager.getCurrentDepth()}`);
      break;

    case "demo":
      const demoData = {
        system: {
          tension: { current: 0.379, status: "normal" },
          performance: { cpu: 45.2, memory: 48.6 },
          network: { connections: 23, latency: 12.3 },
        },
      };
      manager.showDepthComparison(demoData);
      manager.getDepthRecommendations(demoData);
      break;

    case "quantum":
      const quantumMetrics = {
        system: {
          tension: {
            current: 0.379,
            threshold: 0.5,
            status: "normal",
            history: {
              lastHour: [0.3, 0.35, 0.37, 0.38, 0.379],
              trend: "increasing",
              volatility: 0.082,
            },
          },
          performance: {
            cpu: {
              usage: 45.2,
              cores: 8,
              frequency: "3.2GHz",
              temperature: {
                current: 65,
                max: 85,
                zones: { core1: 64, core2: 66, core3: 65, core4: 67 },
              },
            },
            memory: {
              used: 248.6,
              total: 512,
              percent: 48.6,
              heap: {
                used: 120.3,
                limit: 256,
                gc: { collections: 142, time: 23.5, efficiency: 0.87 },
              },
            },
          },
        },
      };

      const logger = manager.createDepthLogger();
      logger.quantumMetrics(quantumMetrics);
      break;

    case "help":
      console.log(`🛠️ Console Depth Manager CLI`);
      console.log(`Usage:`);
      console.log(
        `  bun run console-depth-manager.js current     Show current console depth`,
      );
      console.log(
        `  bun run console-depth-manager.js demo         Show depth comparison demo`,
      );
      console.log(
        `  bun run console-depth-manager.js quantum      Show quantum metrics example`,
      );
      console.log(`\nRuntime Usage:`);
      console.log(`  bun --console-depth=1 run script.js    Minimal output`);
      console.log(`  bun --console-depth=2 run script.js    Default output`);
      console.log(`  bun --console-depth=4 run script.js    Detailed output`);
      console.log(`  bun --console-depth=6 run script.js    Verbose output`);
      console.log(`  bun --console-depth=10 run script.js   Full output`);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
export { ConsoleDepthManager };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
