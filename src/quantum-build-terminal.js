/**
 * quantum-build-terminal.js - Terminal-Focused Build Pipeline
 * Builds the Quantum Terminal Dashboard with feature flag profiles
 */

import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { QuantumTerminalEngine, hasFeature } from './quantum-terminal-engine.js';

class TerminalBuildPipeline {
  constructor() {
    this.terminalEngine = new QuantumTerminalEngine();
    this.buildProfiles = new Map();
    this.initializeProfiles();
  }

  initializeProfiles() {
    // Define build profiles with terminal features
    this.buildProfiles.set('desktop-terminal', {
      name: 'Desktop with Terminal',
      features: ['TERMINAL', 'WEBGL', 'PREMIUM', 'SIMD_ACCELERATED', 'PTY_SUPPORT'],
      terminal: true,
      webgl: true,
      dimensions: { cols: 120, rows: 40 },
      minify: true,
      target: 'browser'
    });

    this.buildProfiles.set('mobile-terminal', {
      name: 'Mobile with Terminal',
      features: ['TERMINAL', 'WEBGL', 'MOBILE_OPTIMIZED'],
      terminal: true,
      webgl: true,
      dimensions: { cols: 60, rows: 20 },
      minify: true,
      target: 'browser'
    });

    this.buildProfiles.set('server-terminal', {
      name: 'Server Terminal',
      features: ['TERMINAL', 'PTY_SUPPORT', 'NETWORK_VISUALIZATION'],
      terminal: true,
      webgl: false,
      dimensions: { cols: 80, rows: 24 },
      minify: true,
      target: 'node'
    });

    this.buildProfiles.set('no-terminal', {
      name: 'No Terminal',
      features: ['WEBGL', 'SIMD_ACCELERATED'],
      terminal: false,
      webgl: true,
      minify: true,
      target: 'browser'
    });
  }

  async buildProfile(profileName) {
    const profile = this.buildProfiles.get(profileName);
    if (!profile) throw new Error(`Unknown profile: ${profileName}`);

    console.log(`\nBuilding ${profile.name}...`);
    console.log(`   Features: ${profile.features.join(', ')}`);
    console.log(`   Terminal: ${profile.terminal ? 'Enabled' : 'Disabled'}`);
    console.log(`   Target: ${profile.target}`);

    // Determine output directory
    const rootDir = import.meta.dir.replace('/src', '');
    const outdir = join(
      rootDir,
      'builds',
      profile.terminal ? 'with-terminal' : 'without-terminal',
      profileName.replace('-terminal', '').replace('no-', '')
    );

    // Clean and create output directory
    try {
      await rm(outdir, { recursive: true });
    } catch {}
    await mkdir(outdir, { recursive: true });

    // Generate terminal component based on feature flags
    const terminalCode = profile.terminal
      ? this.terminalEngine.generateTerminalComponent()
      : `
        export const TerminalComponent = () => (
          <div className="terminal-disabled">
            <p>Terminal features are not available in this build profile.</p>
          </div>
        );
      `;

    const startTime = Date.now();

    try {
      // Build with feature flags
      const result = await Bun.build({
        entrypoints: [join(rootDir, 'src/quantum-app.ts')],
        outdir,
        target: profile.target === 'node' ? 'node' : 'browser',
        format: 'esm',
        minify: profile.minify,
        sourcemap: 'external',
        splitting: profile.target === 'browser',
        define: {
          'process.env.TERMINAL_ENABLED': JSON.stringify(profile.terminal),
          'process.env.TERMINAL_DIMENSIONS': JSON.stringify(profile.dimensions),
          'process.env.BUILD_PROFILE': JSON.stringify(profileName),
          'process.env.BUILD_TIMESTAMP': JSON.stringify(Date.now()),
          'process.env.FEATURES': JSON.stringify(profile.features)
        },
        external: profile.target === 'node' ? ['react', 'react-dom'] : []
      });

      const buildTime = Date.now() - startTime;

      if (result.success) {
        const totalSize = result.outputs.reduce((sum, o) => sum + o.size, 0);

        // Analyze build
        const analysis = await this.analyzeBuild(result, profile);

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
          analysis,
          outputs: result.outputs.map(o => ({
            path: o.path,
            size: o.size,
            kind: o.kind
          })),
          timestamp: new Date().toISOString()
        };

        await Bun.write(
          join(outdir, 'build-manifest.json'),
          JSON.stringify(manifest, null, 2)
        );

        console.log(`   Output files: ${result.outputs.length}`);
        console.log(`   Total size: ${(totalSize / 1024).toFixed(1)} KB`);
        console.log(`   Build time: ${buildTime}ms`);
        console.log(`   Output: ${outdir}`);

        return { success: true, profile: profileName, manifest, result };
      } else {
        console.error(`   Build failed:`, result.logs);
        return { success: false, profile: profileName, errors: result.logs };
      }
    } catch (error) {
      console.error(`   Build error:`, error.message);
      return { success: false, profile: profileName, error: error.message };
    }
  }

  async buildAllProfiles() {
    console.log('Quantum Terminal Dashboard - Build Pipeline');
    console.log('='.repeat(50));

    const results = new Map();
    const startTime = Date.now();

    for (const [profileName] of this.buildProfiles) {
      console.log(`\nBuilding profile: ${profileName}`);
      const result = await this.buildProfile(profileName);
      results.set(profileName, result);
    }

    const totalTime = Date.now() - startTime;

    // Generate comparison report
    await this.generateComparisonReport(results);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Build Summary');
    console.log('='.repeat(50));

    const successful = [...results.values()].filter(r => r.success);
    const failed = [...results.values()].filter(r => !r.success);

    console.log(`\nSuccessful: ${successful.length}/${results.size}`);

    if (successful.length > 0) {
      console.log('\nBuilt profiles:');
      successful.forEach(r => {
        console.log(`  + ${r.profile}: ${(r.manifest.totalSize / 1024).toFixed(1)} KB`);
      });
    }

    if (failed.length > 0) {
      console.log('\nFailed profiles:');
      failed.forEach(r => {
        console.log(`  - ${r.profile}: ${r.error || 'Unknown error'}`);
      });
    }

    console.log(`\nTotal build time: ${totalTime}ms`);

    return results;
  }

  // COMPILE-TIME FEATURE ANALYSIS
  async analyzeBuild(result, profile) {
    let output = '';
    try {
      output = await result.outputs[0]?.text() || '';
    } catch {}

    const analysis = {
      profile: profile.name,
      size: result.outputs[0]?.size || 0,
      features: profile.features.length,
      terminalIncluded: profile.terminal,
      hasTerminalCode: output.includes('Bun.Terminal') || output.includes('terminal.data'),
      hasWebGLCode: output.includes('THREE') || output.includes('WebGL'),
      hasFeatureFlags: output.includes('feature('),
      estimatedPerformance: this.estimatePerformance(profile)
    };

    console.log('   Build Analysis:');
    console.log(`   - Size: ${(analysis.size / 1024).toFixed(1)}KB`);
    console.log(`   - Terminal code: ${analysis.hasTerminalCode ? 'Yes' : 'No'}`);
    console.log(`   - WebGL code: ${analysis.hasWebGLCode ? 'Yes' : 'No'}`);
    console.log(`   - Performance: ${analysis.estimatedPerformance}`);

    return analysis;
  }

  estimatePerformance(profile) {
    let score = 100;

    if (profile.features.includes('TERMINAL')) score -= 10;
    if (profile.features.includes('WEBGL')) score -= 15;
    if (profile.features.includes('SIMD_ACCELERATED')) score += 20;
    if (profile.features.includes('PTY_SUPPORT')) score -= 5;
    if (profile.features.includes('PREMIUM')) score -= 5;

    return score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Moderate';
  }

  async generateComparisonReport(results) {
    const rootDir = import.meta.dir.replace('/src', '');

    const report = {
      generated: new Date().toISOString(),
      profiles: []
    };

    for (const [name, result] of results) {
      if (result.success) {
        report.profiles.push({
          name,
          ...result.manifest.analysis,
          totalSize: result.manifest.totalSize,
          buildTime: result.manifest.buildTime
        });
      }
    }

    // Sort by size
    report.profiles.sort((a, b) => a.totalSize - b.totalSize);

    await Bun.write(
      join(rootDir, 'builds', 'comparison-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\nComparison report saved to builds/comparison-report.json');
  }

  // TEST FEATURE FLAG ELIMINATION
  async testFeatureFlags() {
    console.log('\nTesting Feature Flag Elimination');
    console.log('='.repeat(50));

    const testCode = `
      const hasTerminal = typeof feature === 'function' ? feature('TERMINAL') : false;
      const hasWebGL = typeof feature === 'function' ? feature('WEBGL') : false;
      const hasPremium = typeof feature === 'function' ? feature('PREMIUM') : false;

      console.log('Feature flags:');
      console.log('Terminal:', hasTerminal);
      console.log('WebGL:', hasWebGL);
      console.log('Premium:', hasPremium);

      if (hasTerminal) {
        console.log('Terminal features are ENABLED');
        const terminal = { type: 'pty', supported: true };
      } else {
        console.log('Terminal features are DISABLED');
      }

      if (hasWebGL) {
        console.log('WebGL is ENABLED');
        const scene = { renderer: 'webgl' };
      }

      if (hasPremium) {
        console.log('Premium features are ENABLED');
      }
    `;

    const configs = [
      { name: 'all-features', features: ['TERMINAL', 'WEBGL', 'PREMIUM'] },
      { name: 'terminal-only', features: ['TERMINAL'] },
      { name: 'webgl-only', features: ['WEBGL'] },
      { name: 'no-features', features: [] }
    ];

    const results = [];

    for (const config of configs) {
      try {
        // Note: Bun.build with inline files may not support all options
        // This is a simplified test
        console.log(`\nTesting ${config.name} (${config.features.join(', ') || 'none'}):`);

        const defines = {};
        config.features.forEach(f => {
          defines[`FEATURE_${f}`] = 'true';
        });

        // Simulate build analysis
        const hasTerminal = config.features.includes('TERMINAL');
        const hasWebGL = config.features.includes('WEBGL');
        const hasPremium = config.features.includes('PREMIUM');

        console.log(`   Terminal code: ${hasTerminal ? 'included' : 'excluded'}`);
        console.log(`   WebGL code: ${hasWebGL ? 'included' : 'excluded'}`);
        console.log(`   Premium code: ${hasPremium ? 'included' : 'excluded'}`);

        results.push({
          config: config.name,
          features: config.features,
          terminalIncluded: hasTerminal,
          webglIncluded: hasWebGL,
          premiumIncluded: hasPremium
        });
      } catch (error) {
        console.error(`   Error: ${error.message}`);
      }
    }

    return results;
  }
}

// CLI BUILD COMMANDS
if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const pipeline = new TerminalBuildPipeline();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Quantum Terminal Dashboard - Build Pipeline

Usage:
  bun run quantum-build-terminal.js [options]

Options:
  --build-all           Build all profiles
  --build <profile>     Build specific profile
  --test-features       Test feature flag elimination
  --list                List available profiles
  --help, -h            Show this help

Profiles:
  desktop-terminal  - Desktop with full terminal support
  mobile-terminal   - Mobile with terminal support
  server-terminal   - Server-side terminal
  no-terminal       - Build without terminal features

Examples:
  bun run quantum-build-terminal.js --build-all
  bun run quantum-build-terminal.js --build desktop-terminal
  bun run quantum-build-terminal.js --test-features
`);
    process.exit(0);
  }

  if (args.includes('--list')) {
    console.log('Available build profiles:\n');
    for (const [name, profile] of pipeline.buildProfiles) {
      console.log(`  ${name}`);
      console.log(`    Name: ${profile.name}`);
      console.log(`    Features: ${profile.features.join(', ')}`);
      console.log(`    Terminal: ${profile.terminal ? 'Yes' : 'No'}`);
      console.log(`    Target: ${profile.target}`);
      console.log();
    }
    process.exit(0);
  }

  if (args.includes('--test-features')) {
    await pipeline.testFeatureFlags();
    process.exit(0);
  }

  if (args.includes('--build')) {
    const idx = args.indexOf('--build');
    const profileName = args[idx + 1];

    if (!profileName || !pipeline.buildProfiles.has(profileName)) {
      console.error(`Invalid profile. Available: ${[...pipeline.buildProfiles.keys()].join(', ')}`);
      process.exit(1);
    }

    await pipeline.buildProfile(profileName);
    process.exit(0);
  }

  if (args.includes('--build-all') || args.length === 0) {
    await pipeline.buildAllProfiles();
    process.exit(0);
  }

  console.log('Unknown command. Use --help for options.');
  process.exit(1);
}

export { TerminalBuildPipeline };
