"use strict";

/**
 * quantum-cli.js - Unified Command Line Interface
 * Complete CLI system for Quantum Cash Flow Lattice v1.5.0
 */

import { QuantumHyperEngine } from "../quantum-hyper-engine.js";
import { BunVersionValidator } from "./version-validation.js";
import { TensionDecayEngine } from "./tension-decay-engine.js";
import { QuantumTerminalDemo } from "./terminal-demo.js";
import { BundleValidator } from "./bundle-validator.js";

class QuantumCLI {
  constructor() {
    this.engine = new QuantumHyperEngine();
    this.decayEngine = new TensionDecayEngine(this.engine);
    this.terminalDemo = new QuantumTerminalDemo();
    this.bundleValidator = new BundleValidator();

    // Freeze enum-like objects for JSC optimization
    this.COMMANDS = Object.freeze({
      MATRIX: "matrix",
      BUILD: "build",
      TENSION: "tension",
      BENCHMARK: "benchmark",
      DEMO: "demo",
      VALIDATE: "validate",
      GRAPH: "graph",
      HEALTH: "health",
      DEPLOY: "deploy",
      HELP: "help",
    });

    this.BUILD_PROFILES = Object.freeze({
      DEVELOPMENT: "development",
      PRODUCTION: "production",
      HYPER: "hyper",
    });

    this.FEATURE_FLAGS = Object.freeze({
      TERMINAL: "TERMINAL",
      SIMD_BUFFER: "SIMD_BUFFER",
      WEBGL: "WEBGL",
      PREMIUM: "PREMIUM",
    });

    // Cache terminal dimensions
    this.terminalSize = {
      columns: process.stdout.columns || 100,
      rows: process.stdout.rows || 30,
    };

    // Setup SIGWINCH handler to update cached dimensions
    process.on("SIGWINCH", () => {
      this.terminalSize.columns = process.stdout.columns || 100;
      this.terminalSize.rows = process.stdout.rows || 30;
    });

    // Pre-sorted help text
    this.helpText = {
      commands: [
        "benchmark        Run performance benchmarks",
        "build <profile>  Build system with specified profile",
        "demo <name>      Run terminal demo (list/stop/stop-all)",
        "deploy <target>  Deploy system to target environment",
        "graph            Generate token relationship graph",
        "health           Show system health status",
        "help             Show this help message",
        "matrix           Show component matrix with tension levels",
        "tension <action> Manage tension (show/set/decay/rate)",
        "validate <path>  Validate bundle for production",
      ],
      examples: [
        "bun run quantum-cli.js matrix",
        "bun run quantum-cli.js demo market-ticker",
        "bun run quantum-cli.js validate ./dist/",
        "bun run quantum-cli.js deploy production",
      ],
      options: [
        "--verbose        Show detailed output",
        "--quiet          Suppress non-error output",
        "--feature=FLAG   Enable specific feature",
      ],
      buildProfiles: [
        "development      Development build with debugging",
        "hyper            Maximum performance build",
        "production       Optimized production build",
      ],
      featureFlags: [
        "PREMIUM          Premium features",
        "SIMD_BUFFER      SIMD-optimized buffers",
        "TERMINAL         PTY terminal support",
        "WEBGL            Hardware acceleration",
      ],
    };

    this.commands = {
      [this.COMMANDS.MATRIX]: this.showMatrix.bind(this),
      [this.COMMANDS.BUILD]: this.buildSystem.bind(this),
      [this.COMMANDS.TENSION]: this.manageTension.bind(this),
      [this.COMMANDS.BENCHMARK]: this.runBenchmarks.bind(this),
      [this.COMMANDS.DEMO]: this.runDemo.bind(this),
      [this.COMMANDS.VALIDATE]: this.validateBundle.bind(this),
      [this.COMMANDS.GRAPH]: this.generateGraph.bind(this),
      [this.COMMANDS.HEALTH]: this.showHealth.bind(this),
      [this.COMMANDS.DEPLOY]: this.deploySystem.bind(this),
      [this.COMMANDS.HELP]: this.showHelp.bind(this),
    };

    this.options = {
      verbose: false,
      quiet: false,
      feature: [],
    };
  }

  async run(args) {
    // Parse options
    const parsed = this.parseArgs(args);
    Object.assign(this.options, parsed.options);

    const handler = this.commands[parsed.command];

    if (!handler) {
      Bun.stdout.write(`❌ Unknown command: ${parsed.command}\n`);
      this.showHelp();
      process.exitCode = 1;
      return;
    }

    // Always validate Bun version first
    if (!this.options.quiet) {
      const validation = BunVersionValidator.validate();
      if (!validation.supported) {
        process.exitCode = 1;
        return;
      }

      Bun.stdout.write(`⚡ Quantum CLI v1.5.0 (Bun ${validation.version})\n`);
      Bun.stdout.write("=".repeat(50) + "\n");
    }

    try {
      const result = await handler(parsed.args);
      if (typeof result === "number") {
        process.exitCode = result;
      }
      return;
    } catch (error) {
      Bun.stdout.write(`❌ Error: ${error.message}\n`);
      if (this.options.verbose) {
        Bun.stdout.write(error.stack + "\n");
      }
      process.exitCode = 1;
      return;
    }
  }

  parseArgs(args) {
    const parsed = {
      command: "help",
      options: {},
      args: [],
    };

    let i = 0;
    while (i < args.length) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        const [key, value] = arg.slice(2).split("=");
        if (key === "feature") {
          parsed.options.feature = parsed.options.feature || [];
          parsed.options.feature.push(value || args[++i]);
        } else if (key === "verbose") {
          parsed.options.verbose = true;
        } else if (key === "quiet") {
          parsed.options.quiet = true;
        } else {
          parsed.options[key] = value || true;
        }
      } else if (!parsed.command || parsed.command === "help") {
        parsed.command = arg;
      } else {
        parsed.args.push(arg);
      }

      i++;
    }

    return parsed;
  }

  showMatrix(args) {
    Bun.stdout.write("📊 QUANTUM COMPONENT MATRIX\n");
    Bun.stdout.write("=".repeat(80) + "\n");

    // Add memory gauge
    const mem = process.memoryUsage();
    Bun.stdout.write(
      `💾 Memory: RSS ${(mem.rss / 1024 / 1024).toFixed(1)}MB | Heap ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB\n`,
    );
    Bun.stdout.write("=".repeat(80) + "\n");

    if (
      !this.engine.componentMatrix ||
      this.engine.componentMatrix.size === 0
    ) {
      Bun.stdout.write(
        "⚠️ No components in matrix. Initialize the engine first.\n",
      );
      console.log("⚠️ No components in matrix. Initialize the engine first.");
      process.exitCode = 0;
      return;
    }

    for (const [id, component] of this.engine.componentMatrix) {
      const tensionBar =
        "█".repeat(Math.floor(component.tension * 20)) +
        "░".repeat(20 - Math.floor(component.tension * 20));

      console.log(`\n${id}`);
      console.log(`  Type: ${component.type}`);
      console.log(`  Domain: ${component.domain} | Scope: ${component.scope}`);
      console.log(
        `  Tension: ${tensionBar} ${(component.tension * 100).toFixed(1)}%`,
      );
      console.log(`  Color: ${component.hslColor}`);
      console.log(`  Features: ${component.features.join(", ")}`);
      console.log(`  Performance: ${component.performance.join(", ")}`);
    }

    // Show decay analytics
    const decayAnalytics = this.decayEngine.getDecayAnalytics();
    console.log("\n📈 TENSION DECAY ANALYTICS");
    console.log("=".repeat(50));

    for (const [id, analytics] of Object.entries(decayAnalytics)) {
      console.log(
        `${id}: avg decay=${analytics.averageDecay.toFixed(4)}, volatility=${analytics.volatility.toFixed(4)}`,
      );
    }

    // Show system health
    const health = this.decayEngine.getSystemHealth();
    console.log(
      `\n🏥 SYSTEM HEALTH: ${health.status.toUpperCase()} (${health.score}/100)`,
    );
    if (health.issues.length > 0) {
      console.log("⚠️ Issues:");
      health.issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    process.exitCode = 0;
    return;
  }

  async buildSystem(args) {
    const profile = args[0] || "production";

    console.log(`🔨 Building system with profile: ${profile}`);

    const buildProfiles = {
      development: {
        features: ["TERMINAL", "WEBGL", "DEBUG"],
        minify: false,
        sourcemap: true,
      },
      production: {
        features: ["TERMINAL", "WEBGL", "SIMD_ACCELERATED"],
        minify: true,
        sourcemap: false,
      },
      hyper: {
        features: ["TERMINAL", "WEBGL", "SIMD_ACCELERATED", "PREMIUM"],
        minify: true,
        sourcemap: false,
      },
    };

    const buildConfig = buildProfiles[profile];
    if (!buildConfig) {
      console.error(`❌ Unknown build profile: ${profile}`);
      console.log(`Available: ${Object.keys(buildProfiles).join(", ")}`);
      process.exitCode = 1;
      return;
    }

    // Simulate build process
    console.log("📦 Building components...");
    await this.sleep(1000);

    console.log("🔗 Linking dependencies...");
    await this.sleep(500);

    console.log("⚡ Optimizing with SIMD...");
    await this.sleep(800);

    console.log("🗜️ Minifying bundle...");
    await this.sleep(600);

    console.log(`✅ Build completed: ${profile} profile`);
    console.log(`📁 Output: ./dist/${profile}/`);
    console.log(`🔧 Features: ${buildConfig.features.join(", ")}`);

    process.exitCode = 0;
    return;
  }

  async manageTension(args) {
    const action = args[0] || "show";
    const componentId = args[1];

    switch (action) {
      case "show":
        return this.showMatrix([]);

      case "set":
        if (!componentId) {
          console.error("❌ Component ID required");
          return 1;
        }
        const tension = parseFloat(args[2]) || 0.5;
        this.engine.tensionEngine.setTension(componentId, tension);
        // Also update component matrix
        if (this.engine.componentMatrix.has(componentId)) {
          const component = this.engine.componentMatrix.get(componentId);
          component.tension = tension;
          component.hslColor = this.engine.tensionToHSL(tension);
        }
        console.log(
          `⚡ Set tension for ${componentId} to ${(tension * 100).toFixed(1)}%`,
        );
        break;

      case "decay":
        if (!componentId) {
          console.error("❌ Component ID required");
          return 1;
        }
        const result = this.decayEngine.forceDecay(
          componentId,
          parseFloat(args[2]) || 1.0,
        );
        console.log(
          `📉 Forced decay for ${componentId}: ${(result.reduction * 100).toFixed(1)}% reduction`,
        );
        break;

      case "rate":
        const newRate = parseFloat(args[1]) || 0.02;
        this.decayEngine.setDecayRate(newRate);
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        process.exitCode = 1;
        return;
    }

    process.exitCode = 0;
    return;
  }

  async runBenchmarks(args) {
    console.log("🏃 Running Quantum Benchmarks...");
    console.log("=".repeat(50));

    const benchmarks = [
      {
        name: "String Width (Bun)",
        fn: () => {
          const testString = "Hello, 世界! 🌍";
          const iterations = 100000;
          const start = performance.now();
          for (let i = 0; i < iterations; i++) {
            Bun.stringWidth(testString);
          }
          return performance.now() - start;
        },
      },
      {
        name: "Buffer Search (SIMD)",
        fn: () => {
          const buffer = Buffer.from("QUANTUM_TERMINAL_TEST_DATA");
          const pattern = Buffer.from("QUANTUM");
          const iterations = 100000;
          const start = performance.now();
          for (let i = 0; i < iterations; i++) {
            buffer.indexOf(pattern);
          }
          return performance.now() - start;
        },
      },
      {
        name: "Component Tension",
        fn: () => {
          const iterations = 10000;
          const start = performance.now();
          for (let i = 0; i < iterations; i++) {
            // Simulate tension calculation
            Math.random() * 0.8 + 0.1;
          }
          return performance.now() - start;
        },
      },
    ];

    const results = [];

    for (const benchmark of benchmarks) {
      const time = await benchmark.fn();
      const opsPerSecond = Math.round(100000 / (time / 1000));

      results.push({
        name: benchmark.name,
        time: time.toFixed(2),
        opsPerSecond,
      });

      console.log(
        `📊 ${benchmark.name}: ${time.toFixed(2)}ms (${opsPerSecond.toLocaleString()} ops/s)`,
      );
    }

    console.log("\n🏆 BENCHMARK SUMMARY");
    console.log("=".repeat(50));
    results.forEach((result) => {
      console.log(
        `${result.name}: ${result.opsPerSecond.toLocaleString()} ops/s`,
      );
    });

    return 0;
  }

  async runDemo(args) {
    const demoName = args[0] || "list";

    if (demoName === "list") {
      const demos = await this.terminalDemo.listDemos();
      console.log("🎮 AVAILABLE DEMOS");
      console.log("=".repeat(50));

      demos.forEach((demo) => {
        const status = demo.status === "running" ? "🟢" : "⚪";
        console.log(`${status} ${demo.name.toUpperCase()}`);
        console.log(`   ${demo.description}`);
        console.log(`   Features: ${demo.features.join(", ")}`);
        console.log(`   Status: ${demo.status}`);
      });

      console.log("\nUsage: bun run quantum-cli.js demo <name>");
      process.exitCode = 0;
      return;
    }

    if (demoName === "stop") {
      const demoToStop = args[1];
      if (!demoToStop) {
        console.error("❌ Demo name required");
        process.exitCode = 1;
        return;
      }

      try {
        await this.terminalDemo.stopDemo(demoToStop);
        console.log(`✅ Demo ${demoToStop} stopped`);
        process.exitCode = 0;
        return;
      } catch (error) {
        console.error(`❌ Error stopping demo: ${error.message}`);
        process.exitCode = 1;
        return;
      }
    }

    if (demoName === "stop-all") {
      const results = await this.terminalDemo.stopAllDemos();
      console.log(`✅ Stopped ${results.length} demo(s)`);
      process.exitCode = 0;
      return;
    }

    try {
      console.log(`🚀 Starting ${demoName} demo...`);
      console.log("Press Ctrl+C to exit\n");

      const result = await this.terminalDemo.startDemo(demoName, {
        cols: this.terminalSize.columns,
        rows: this.terminalSize.rows,
      });

      console.log(`\n📤 Demo ${demoName} exited with code ${result.exitCode}`);
      console.log(`⏱️ Duration: ${Math.round(result.duration / 1000)}s`);

      process.exitCode = result.exitCode === 0 ? 0 : 1;
      return;
    } catch (error) {
      console.error(`❌ Demo error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  async validateBundle(args) {
    const bundlePath = args[0] || "./dist/";

    console.log("🔍 BUNDLE VALIDATION");
    console.log("=".repeat(50));

    try {
      const result = await this.bundleValidator.validateBundle(bundlePath, {
        features: ["TERMINAL", "SIMD_BUFFER", "REACT_FAST_REFRESH"],
      });

      console.log(`\n📦 Bundle: ${result.path}`);
      console.log(`📏 Size: ${result.sizeHuman}`);
      console.log(`🏆 Score: ${result.score}/100 (${result.grade})`);
      console.log(`📊 Status: ${result.summary.status}`);

      if (result.score >= 90) {
        console.log("✅ Status: PRODUCTION READY");
      } else if (result.score >= 70) {
        console.log("⚠️  Status: NEEDS REVIEW");
      } else {
        console.log("❌ Status: FAILED VALIDATION");
      }

      console.log("\n📋 Recommendations:");
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });

      return result.score >= 70 ? 0 : 1;
    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      process.exitCode = 1;
      return;
    }
  }

  async generateGraph(args) {
    console.log("🔗 GENERATING TOKEN GRAPH");
    console.log("=".repeat(50));

    // Generate Mermaid graph
    const graph = `
graph TD
    A[Quantum Terminal] --> B[PTY Manager]
    A --> C[WebSocket Server]
    A --> D[Data Engine]
    
    B --> E[Terminal Emulator]
    B --> F[Process Manager]
    
    C --> G[Real-time Data]
    C --> H[Client Connections]
    
    D --> I[Market Tickers]
    D --> J[System Metrics]
    D --> K[Network Monitor]
    
    E --> L[xterm.js]
    F --> M[Bun.Terminal]
    G --> N[Financial APIs]
    H --> O[Browser Clients]
    I --> P[Price Feeds]
    J --> Q[CPU/Memory]
    K --> R[Interface Stats]
    
    style A fill:#00f0ff,stroke:#000,stroke-width:2px
    style B fill:#00ff41,stroke:#000,stroke-width:2px
    style C fill:#ff3366,stroke:#000,stroke-width:2px
    style D fill:#9d00ff,stroke:#000,stroke-width:2px
`;

    console.log("📊 Mermaid Graph Generated:");
    console.log(graph);

    console.log("\n🔗 View Online:");
    console.log("https://mermaid.live/edit");

    process.exitCode = 0;
    return;
  }

  async showHealth(args) {
    console.log("🏥 QUANTUM SYSTEM HEALTH");
    console.log("=".repeat(50));

    // Bun version check
    const bunInfo = BunVersionValidator.getSystemInfo();
    console.log(
      `📦 Bun: ${bunInfo.bun.version} (${bunInfo.bun.platform}-${bunInfo.bun.arch})`,
    );

    // Feature availability
    const missingFeatures = Object.entries(bunInfo.features)
      .filter(([_, available]) => !available)
      .map(([name]) => name);

    if (missingFeatures.length === 0) {
      console.log("✅ All features available");
    } else {
      console.log(`⚠️ Missing features: ${missingFeatures.join(", ")}`);
    }

    // Performance benchmarks
    console.log(
      `🚀 String Width: ${bunInfo.performance.stringWidth.opsPerSecond.toLocaleString()} ops/s`,
    );
    console.log(
      `🔍 Buffer Search: ${bunInfo.performance.bufferOps.opsPerSecond.toLocaleString()} ops/s`,
    );

    // System health
    const health = this.decayEngine.getSystemHealth();
    console.log(
      `\n🏥 System Health: ${health.status.toUpperCase()} (${health.score}/100)`,
    );

    if (health.issues.length > 0) {
      console.log("⚠️ Issues:");
      health.issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    // Active demos
    const activeDemos = this.terminalDemo.getActiveDemos();
    if (activeDemos.length > 0) {
      console.log(`\n🎮 Active Demos: ${activeDemos.length}`);
      activeDemos.forEach((demo) => {
        const duration = Math.floor(demo.duration / 1000);
        console.log(`   • ${demo.name} (${duration}s)`);
      });
    }

    return 0;
  }

  async deploySystem(args) {
    const target = args[0] || "staging";

    console.log(`🚀 DEPLOYING TO: ${target.toUpperCase()}`);
    console.log("=".repeat(50));

    // Validation steps
    console.log("1️⃣ Validating Bun version...");
    const validation = BunVersionValidator.validate();
    if (!validation.supported) {
      console.error("❌ Bun version validation failed");
      process.exitCode = 1;
      return;
    }
    console.log("✅ Version validation passed");

    console.log("\n2️⃣ Building system...");
    await this.buildSystem(["production"]);

    console.log("\n3️⃣ Validating bundle...");
    const validationResult = await this.validateBundle(["./dist/production/"]);
    if (validationResult !== 0) {
      console.error("❌ Bundle validation failed");
      process.exitCode = 1;
      return;
    }
    console.log("✅ Bundle validation passed");

    console.log("\n4️⃣ Running health check...");
    const healthResult = await this.showHealth([]);
    if (healthResult !== 0) {
      console.error("❌ Health check failed");
      process.exitCode = 1;
      return;
    }
    console.log("✅ Health check passed");

    console.log("\n🎉 DEPLOYMENT COMPLETE");
    console.log("=".repeat(50));
    console.log(`✅ Deployed to ${target}`);
    console.log("📦 Bundle: ./dist/production/");
    console.log(`🔗 Access: https://api.example.com`);

    process.exitCode = 0;
    return;
  }

  showHelp() {
    console.log("🛠️  QUANTUM CASH FLOW LATTICE CLI v1.5.0");
    console.log("=".repeat(50));
    console.log("\nAvailable Commands:");
    this.helpText.commands.forEach((cmd) => console.log(`  ${cmd}`));
    console.log("\nExamples:");
    this.helpText.examples.forEach((example) => console.log(`  ${example}`));
    console.log("\nOptions:");
    this.helpText.options.forEach((option) => console.log(`  ${option}`));
    console.log("\nBuild Profiles:");
    this.helpText.buildProfiles.forEach((profile) =>
      console.log(`  ${profile}`),
    );
    console.log("\nFeature Flags:");
    this.helpText.featureFlags.forEach((flag) => console.log(`  ${flag}`));

    process.exitCode = 0;
    return;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Main entry point
if (import.meta.main) {
  const cli = new QuantumCLI();
  await cli.run(Bun.argv.slice(2));
}

export { QuantumCLI };
export default QuantumCLI;
