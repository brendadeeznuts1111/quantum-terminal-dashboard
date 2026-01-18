"use strict";

/**
 * version-validation.js - Bun Version Validation System
 * Ensures minimum version requirements and feature availability
 */

export class BunVersionValidator {
  static MINIMUM_VERSION = "1.3.5";
  static _min = this.MINIMUM_VERSION.split(".").map(Number);

  // Freeze enum-like objects for JSC optimization
  static FEATURES = Object.freeze({
    TERMINAL: 1,
    SIMD_BUFFER: 2,
    WEBGL: 3,
    PREMIUM: 4,
  });

  static VALIDATION_LEVELS = Object.freeze({
    SYNTAX: 1,
    PERFORMANCE: 2,
    SECURITY: 3,
  });

  static validate() {
    const bunVersion = Bun.version;
    const [major, minor, patch] = bunVersion.split(".").map(Number);
    const [reqMajor, reqMinor, reqPatch] = this._min;

    const isSupported =
      major > reqMajor ||
      (major === reqMajor && minor > reqMinor) ||
      (major === reqMajor && minor === reqMinor && patch >= reqPatch);

    if (!isSupported) {
      Bun.stderr.write(
        `🚨 Bun ${bunVersion} detected. Minimum required: ${this.MINIMUM_VERSION}\n`,
      );
      Bun.stderr.write(`   Run: bun upgrade\n`);
      process.exit(1);
    }

    // Check specific features with micro-benchmark guard
    const t0 = performance.now();
    const features = {
      terminal: typeof Bun.Terminal !== "undefined",
      semver: typeof Bun.semver?.satisfies === "function",
      featureFlags: typeof Bun.feature === "function",
      buildFiles: typeof Bun.build === "function",
      spawnSync: typeof Bun.spawnSync === "function",
      stringWidth: typeof Bun.stringWidth === "function",
      inspect: typeof Bun.inspect === "function",
      peek: typeof Bun.peek === "function",
    };
    if (performance.now() - t0 > 0.5) {
      Bun.stderr.write("⚠️ Feature detection >0.5 ms\n");
    }

    return { version: bunVersion, supported: isSupported, features };
  }

  static checkFeature(featureName) {
    const validation = this.validate();
    return validation.features[featureName] || false;
  }

  static getSystemInfo() {
    const validation = this.validate();

    return {
      bun: {
        version: validation.version,
        revision: Bun.revision || "unknown",
        platform: process.platform,
        arch: process.arch,
      },
      features: validation.features,
      performance: {
        stringWidth: this.benchmarkStringWidth(),
        bufferOps: this.benchmarkBufferOps(),
      },
    };
  }

  static benchmarkStringWidth() {
    const testString = "Hello, 世界! 🌍";
    const iterations = 100000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      Bun.stringWidth(testString);
    }
    const end = performance.now();

    return {
      opsPerSecond: Math.round(iterations / ((end - start) / 1000)),
      avgLatency: ((end - start) / iterations).toFixed(3) + "ms",
    };
  }

  static benchmarkBufferOps() {
    const buffer = Buffer.from("QUANTUM_TERMINAL_TEST_DATA");
    const pattern = Buffer.from("QUANTUM");
    const iterations = 100000;

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      buffer.indexOf(pattern);
    }
    const end = performance.now();

    return {
      opsPerSecond: Math.round(iterations / ((end - start) / 1000)),
      avgLatency: ((end - start) / iterations).toFixed(3) + "ms",
    };
  }

  static generateReport() {
    const info = this.getSystemInfo();

    Bun.stdout.write("🔍 QUANTUM SYSTEM VALIDATION REPORT\n");
    Bun.stdout.write("=".repeat(50) + "\n");
    Bun.stdout.write(
      `📦 Bun Version: ${info.bun.version} (${info.bun.revision})\n`,
    );
    Bun.stdout.write(`🖥️  Platform: ${info.bun.platform}-${info.bun.arch}\n`);
    Bun.stdout.write("\n");

    Bun.stdout.write("⚡ FEATURE AVAILABILITY:\n");
    Object.entries(info.features).forEach(([feature, available]) => {
      const icon = available ? "✅" : "❌";
      Bun.stdout.write(`  ${icon} ${feature}\n`);
    });
    Bun.stdout.write("\n");

    Bun.stdout.write("🚀 PERFORMANCE BENCHMARKS:\n");
    Bun.stdout.write(
      `  📏 String Width: ${info.performance.stringWidth.opsPerSecond.toLocaleString()} ops/s\n`,
    );
    Bun.stdout.write(
      `  🔍 Buffer Search: ${info.performance.bufferOps.opsPerSecond.toLocaleString()} ops/s\n`,
    );
    Bun.stdout.write("\n");

    const missingFeatures = Object.entries(info.features)
      .filter(([_, available]) => !available)
      .map(([name]) => name);

    if (missingFeatures.length > 0) {
      Bun.stdout.write("⚠️  MISSING FEATURES:\n");
      missingFeatures.forEach((feature) => {
        Bun.stdout.write(`  - ${feature}\n`);
      });
      Bun.stdout.write("\n");
      Bun.stdout.write("💡 Some quantum features may be limited\n");
    } else {
      Bun.stdout.write("✅ ALL FEATURES AVAILABLE - Full Quantum Mode\n");
    }

    return info;
  }
}

// Auto-validate when imported directly
if (import.meta.main) {
  const validation = BunVersionValidator.validate();
  console.log(`✅ Bun ${validation.version} validated`);
  console.log(
    `📋 Features: ${Object.entries(validation.features)
      .map(([k, v]) => `${k}: ${v ? "✅" : "❌"}`)
      .join(", ")}`,
  );

  // Generate full report
  BunVersionValidator.generateReport();
}

export default BunVersionValidator;
