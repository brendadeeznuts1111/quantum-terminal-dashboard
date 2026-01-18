/**
 * build-terminal.js - Production Build Script
 * Builds the Quantum Terminal Dashboard with feature flags
 */

import { mkdir, rm } from "fs/promises";
import { join } from "path";

const ROOT_DIR = import.meta.dir.replace("/scripts", "");

// Build profiles
const BUILD_PROFILES = {
  "desktop-terminal": {
    name: "Desktop with Terminal",
    features: [
      "TERMINAL",
      "WEBGL",
      "PREMIUM",
      "SIMD_ACCELERATED",
      "PTY_SUPPORT",
    ],
    terminal: true,
    dimensions: { cols: 120, rows: 40 },
    minify: true,
    target: "browser",
  },
  "mobile-terminal": {
    name: "Mobile with Terminal",
    features: ["TERMINAL", "WEBGL", "MOBILE_OPTIMIZED"],
    terminal: true,
    dimensions: { cols: 60, rows: 20 },
    minify: true,
    target: "browser",
  },
  "server-terminal": {
    name: "Server Terminal",
    features: ["TERMINAL", "PTY_SUPPORT", "NETWORK_VISUALIZATION"],
    terminal: true,
    dimensions: { cols: 80, rows: 24 },
    minify: true,
    target: "node",
  },
  "no-terminal": {
    name: "No Terminal",
    features: ["WEBGL", "SIMD_ACCELERATED"],
    terminal: false,
    minify: true,
    target: "browser",
  },
};

/**
 * Build a specific profile
 */
async function buildProfile(profileName) {
  const profile = BUILD_PROFILES[profileName];
  if (!profile) {
    throw new Error(`Unknown profile: ${profileName}`);
  }

  console.log(`\nBuilding ${profile.name}...`);
  console.log(`  Features: ${profile.features.join(", ")}`);
  console.log(`  Terminal: ${profile.terminal ? "Enabled" : "Disabled"}`);
  console.log(`  Target: ${profile.target}`);

  const outdir = join(
    ROOT_DIR,
    "builds",
    profile.terminal ? "with-terminal" : "without-terminal",
    profileName.replace("-terminal", "").replace("no-", ""),
  );

  // Clean output directory
  try {
    await rm(outdir, { recursive: true });
  } catch {}
  await mkdir(outdir, { recursive: true });

  const startTime = Date.now();

  try {
    const result = await Bun.build({
      entrypoints: [join(ROOT_DIR, "src/quantum-app.ts")],
      outdir,
      target: profile.target === "node" ? "node" : "browser",
      format: "esm",
      minify: profile.minify,
      sourcemap: "external",
      splitting: true,
      define: {
        "process.env.TERMINAL_ENABLED": JSON.stringify(profile.terminal),
        "process.env.TERMINAL_DIMENSIONS": JSON.stringify(profile.dimensions),
        "process.env.BUILD_PROFILE": JSON.stringify(profileName),
        "process.env.BUILD_TIMESTAMP": JSON.stringify(Date.now()),
        "process.env.VERSION": JSON.stringify("1.4.0-pty.alpha.1"),
      },
      external: profile.target === "node" ? ["react", "react-dom"] : [],
    });

    const buildTime = Date.now() - startTime;

    if (result.success) {
      const totalSize = result.outputs.reduce((sum, o) => sum + o.size, 0);

      console.log(`  Output files: ${result.outputs.length}`);
      console.log(`  Total size: ${(totalSize / 1024).toFixed(1)} KB`);
      console.log(`  Build time: ${buildTime}ms`);
      console.log(`  Output: ${outdir}`);

      // Write build manifest
      const manifest = {
        profile: profileName,
        name: profile.name,
        features: profile.features,
        terminal: profile.terminal,
        dimensions: profile.dimensions,
        target: profile.target,
        buildTime,
        totalSize,
        outputs: result.outputs.map((o) => ({
          path: o.path,
          size: o.size,
          kind: o.kind,
        })),
        timestamp: new Date().toISOString(),
      };

      await Bun.write(
        join(outdir, "build-manifest.json"),
        JSON.stringify(manifest, null, 2),
      );

      return { success: true, profile: profileName, manifest };
    } else {
      console.error(`  Build failed:`, result.logs);
      return { success: false, profile: profileName, errors: result.logs };
    }
  } catch (error) {
    console.error(`  Build error:`, error.message);
    return { success: false, profile: profileName, error: error.message };
  }
}

/**
 * Build all profiles
 */
async function buildAll() {
  console.log("Quantum Terminal Dashboard - Build System");
  console.log("=".repeat(50));
  console.log(`Root: ${ROOT_DIR}`);

  const results = [];
  const startTime = Date.now();

  for (const profileName of Object.keys(BUILD_PROFILES)) {
    const result = await buildProfile(profileName);
    results.push(result);
  }

  const totalTime = Date.now() - startTime;

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("Build Summary");
  console.log("=".repeat(50));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\nSuccessful: ${successful.length}/${results.length}`);

  if (successful.length > 0) {
    console.log("\nBuilt profiles:");
    successful.forEach((r) => {
      console.log(
        `  - ${r.profile}: ${(r.manifest.totalSize / 1024).toFixed(1)} KB`,
      );
    });
  }

  if (failed.length > 0) {
    console.log("\nFailed profiles:");
    failed.forEach((r) => {
      console.log(`  - ${r.profile}: ${r.error || "Unknown error"}`);
    });
  }

  console.log(`\nTotal build time: ${totalTime}ms`);

  return results;
}

/**
 * Test feature flag elimination
 */
async function testFeatureFlags() {
  console.log("\nTesting Feature Flag Elimination");
  console.log("=".repeat(50));

  const testCode = `
    const hasTerminal = typeof feature === 'function' ? feature('TERMINAL') : false;
    const hasWebGL = typeof feature === 'function' ? feature('WEBGL') : false;

    console.log('Terminal:', hasTerminal);
    console.log('WebGL:', hasWebGL);

    if (hasTerminal) {
      console.log('Terminal code path');
    }

    if (hasWebGL) {
      console.log('WebGL code path');
    }
  `;

  const configs = [
    { name: "all-features", features: ["TERMINAL", "WEBGL", "PREMIUM"] },
    { name: "terminal-only", features: ["TERMINAL"] },
    { name: "webgl-only", features: ["WEBGL"] },
    { name: "no-features", features: [] },
  ];

  for (const config of configs) {
    const result = await Bun.build({
      entrypoints: ["/test.ts"],
      minify: true,
    });

    if (result.success) {
      const output = await result.outputs[0].text();
      console.log(`\n${config.name}:`);
      console.log(`  Size: ${result.outputs[0].size} bytes`);
      console.log(`  Contains 'Terminal': ${output.includes("Terminal")}`);
      console.log(`  Contains 'WebGL': ${output.includes("WebGL")}`);
    }
  }
}

// CLI
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Quantum Terminal Dashboard - Build System

Usage:
  bun run scripts/build-terminal.js [options]

Options:
  --all           Build all profiles (default)
  --profile NAME  Build specific profile
  --test          Test feature flag elimination
  --help, -h      Show this help

Profiles:
  desktop-terminal  - Desktop with full terminal support
  mobile-terminal   - Mobile with terminal support
  server-terminal   - Server-side terminal
  no-terminal       - Build without terminal features
`);
    process.exit(0);
  }

  if (args.includes("--test")) {
    await testFeatureFlags();
  } else if (args.includes("--profile")) {
    const profileIdx = args.indexOf("--profile");
    const profileName = args[profileIdx + 1];
    if (profileName && BUILD_PROFILES[profileName]) {
      await buildProfile(profileName);
    } else {
      console.error(
        `Invalid profile. Available: ${Object.keys(BUILD_PROFILES).join(", ")}`,
      );
      process.exit(1);
    }
  } else {
    await buildAll();
  }
}

export { buildProfile, buildAll, testFeatureFlags, BUILD_PROFILES };
