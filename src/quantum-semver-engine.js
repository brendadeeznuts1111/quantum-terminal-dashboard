/**
 * quantum-semver-engine.js - Bun Semantic Versioning System
 * Uses Bun.semver API for version management and release channels
 *
 * Versioned Component Matrix:
 * - qcf-lattice-scene@1.3.5-alpha.1 (alpha)
 * - qcf-particles@1.3.5-rc.1 (release-candidate)
 * - qcf-network@1.3.5 (stable)
 * - qcf-connections@1.3.5-beta.3 (beta)
 * - qcf-ui@1.3.5-canary.YYYYMMDD (canary)
 * - qcf-data@1.3.5-nightly (nightly)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename, dirname } from 'path';

/**
 * Custom semver utilities (Bun only provides satisfies/order)
 */
const SemverUtils = {
  // Parse semver string into components
  parse(version) {
    if (!version || typeof version !== 'string') return null;

    // Match: major.minor.patch[-prerelease][+build]
    const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/);
    if (!match) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] ? match[4].split('.') : [],
      build: match[5] ? match[5].split('.') : [],
      raw: version
    };
  },

  // Compare using Bun.semver.order
  gt(v1, v2) { return Bun.semver.order(v1, v2) === 1; },
  lt(v1, v2) { return Bun.semver.order(v1, v2) === -1; },
  eq(v1, v2) { return Bun.semver.order(v1, v2) === 0; },

  // Determine what changed between versions
  diff(v1, v2) {
    const p1 = this.parse(v1);
    const p2 = this.parse(v2);
    if (!p1 || !p2) return null;

    if (p1.major !== p2.major) return 'major';
    if (p1.minor !== p2.minor) return 'minor';
    if (p1.patch !== p2.patch) return 'patch';
    if (p1.prerelease.join('.') !== p2.prerelease.join('.')) return 'prerelease';
    if (p1.build.join('.') !== p2.build.join('.')) return 'build';
    return null;
  },

  // Increment version
  inc(version, type, prereleaseId = 'alpha') {
    const p = this.parse(version);
    if (!p) return null;

    switch (type) {
      case 'major':
        return `${p.major + 1}.0.0`;
      case 'minor':
        return `${p.major}.${p.minor + 1}.0`;
      case 'patch':
        return `${p.major}.${p.minor}.${p.patch + 1}`;
      case 'premajor':
        return `${p.major + 1}.0.0-${prereleaseId}.0`;
      case 'preminor':
        return `${p.major}.${p.minor + 1}.0-${prereleaseId}.0`;
      case 'prepatch':
        return `${p.major}.${p.minor}.${p.patch + 1}-${prereleaseId}.0`;
      case 'prerelease':
        if (p.prerelease.length > 0) {
          // Increment last numeric segment
          const last = p.prerelease[p.prerelease.length - 1];
          const num = parseInt(last, 10);
          if (!isNaN(num)) {
            p.prerelease[p.prerelease.length - 1] = String(num + 1);
          } else {
            p.prerelease.push('0');
          }
          return `${p.major}.${p.minor}.${p.patch}-${p.prerelease.join('.')}`;
        }
        return `${p.major}.${p.minor}.${p.patch + 1}-${prereleaseId}.0`;
      default:
        return null;
    }
  }
};

class QuantumSemverEngine {
  constructor() {
    this.version = this.loadVersion();
    this.releaseChannels = new Map();
    this.buildManifests = new Map();
    this.dependencyGraph = new Map();
    this.initializeReleaseChannels();
  }

  /**
   * Load version from package.json or environment
   */
  loadVersion() {
    try {
      const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
      return {
        full: pkg.version,
        parsed: SemverUtils.parse(pkg.version),
        package: pkg
      };
    } catch {
      const version = process.env.QUANTUM_VERSION || '1.0.0';
      return {
        full: version,
        parsed: SemverUtils.parse(version),
        package: { version }
      };
    }
  }

  /**
   * Initialize release channels with semver ranges
   */
  initializeReleaseChannels() {
    const { major, minor, patch } = this.version.parsed;

    this.releaseChannels.set('canary', {
      semver: `${major}.${minor}.${patch}-canary`,
      directory: 'canary',
      stability: 'unstable',
      retention: '7days',
      autoPrune: true,
      autoBump: 'daily'
    });

    this.releaseChannels.set('nightly', {
      semver: `${major}.${minor}.${patch}-nightly`,
      directory: 'nightly',
      stability: 'unstable',
      retention: '30days',
      autoPrune: true,
      autoBump: 'daily'
    });

    this.releaseChannels.set('alpha', {
      semver: `${major}.${minor}.${patch}-alpha`,
      directory: 'alpha',
      stability: 'testing',
      retention: '30days',
      autoPrune: false,
      autoBump: 'weekly'
    });

    this.releaseChannels.set('beta', {
      semver: `${major}.${minor}.${patch}-beta`,
      directory: 'beta',
      stability: 'testing',
      retention: '90days',
      autoPrune: false,
      autoBump: 'biweekly'
    });

    this.releaseChannels.set('rc', {
      semver: `${major}.${minor}.${patch}-rc`,
      directory: 'release-candidate',
      stability: 'pre-release',
      retention: '180days',
      autoPrune: false,
      autoBump: 'manual'
    });

    this.releaseChannels.set('stable', {
      semver: `${major}.${minor}.${patch}`,
      directory: 'stable',
      stability: 'production',
      retention: 'forever',
      autoPrune: false,
      autoBump: 'manual'
    });
  }

  /**
   * Generate versioned filename
   */
  generateVersionedFilename(component, channel = 'stable', options = {}) {
    const channelConfig = this.releaseChannels.get(channel);
    const timestamp = options.timestamp || new Date().toISOString().split('T')[0].replace(/-/g, '');
    const buildId = options.buildId || Bun.hash.crc32(`${component}-${timestamp}`).toString(16).slice(0, 8);

    const parts = [
      'quantum',
      component.toLowerCase().replace(/\s+/g, '-'),
      channelConfig.semver,
      channel !== 'stable' ? channel : null,
      options.features?.length ? options.features.join('.') : null,
      buildId,
      options.ext || 'js'
    ].filter(Boolean);

    return parts.join('.');
  }

  /**
   * Get build directory for channel
   */
  getBuildDirectory(channel, component = null) {
    const channelConfig = this.releaseChannels.get(channel);
    const { major, minor, patch } = this.version.parsed;

    let base;
    if (channel === 'canary' || channel === 'nightly') {
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      base = join('builds', channelConfig.directory, date);
    } else {
      base = join('builds', channelConfig.directory, `v${major}.${minor}.${patch}`);
    }

    if (component) {
      return join(base, component.toLowerCase().replace(/\s+/g, '-'));
    }

    return base;
  }

  /**
   * Generate build version with channel
   */
  generateBuildVersion(channel) {
    const { major, minor, patch } = this.version.parsed;
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().split('T')[0].replace(/-/g, '');
    const commitHash = process.env.GIT_COMMIT_HASH || 'local';

    let version;
    switch (channel) {
      case 'canary':
        version = `${major}.${minor}.${patch}-canary.${dateStr}+${commitHash}`;
        break;
      case 'nightly':
        version = `${major}.${minor}.${patch}-nightly.${dateStr}+${commitHash}`;
        break;
      case 'alpha':
        version = `${major}.${minor}.${patch}-alpha.${dateStr}+${commitHash}`;
        break;
      case 'beta':
        version = `${major}.${minor}.${patch}-beta.${dateStr}+${commitHash}`;
        break;
      case 'rc':
        version = `${major}.${minor}.${patch}-rc.${dateStr}+${commitHash}`;
        break;
      case 'stable':
        version = `${major}.${minor}.${patch}+${commitHash}`;
        break;
      default:
        version = `${major}.${minor}.${patch}-${channel}.${dateStr}+${commitHash}`;
    }

    return {
      full: version,
      parsed: SemverUtils.parse(version)
    };
  }

  /**
   * Build versioned component
   */
  async buildVersionedComponent(component, options = {}) {
    const {
      channel = 'stable',
      features = [],
      profile = 'production',
      minify = true,
      sourcemap = false
    } = options;

    const version = this.generateBuildVersion(channel);
    const filename = this.generateVersionedFilename(component, channel, { features });
    const outdir = this.getBuildDirectory(channel, component);

    // Ensure directory exists
    if (!existsSync(outdir)) {
      mkdirSync(outdir, { recursive: true });
    }

    // Build manifest
    const manifest = {
      component,
      version: version.full,
      channel,
      profile,
      features,
      timestamp: new Date().toISOString(),
      buildId: Bun.hash.crc32(`${component}-${Date.now()}`).toString(16),
      semver: {
        major: version.parsed.major,
        minor: version.parsed.minor,
        patch: version.parsed.patch,
        prerelease: version.parsed.prerelease,
        build: version.parsed.build
      },
      bun: {
        version: Bun.version,
        revision: Bun.revision
      }
    };

    // Generate component source
    const source = `
// ${component} - Version ${version.full}
// Built: ${manifest.timestamp}
// Channel: ${channel}

export const VERSION = ${JSON.stringify(version.full)};
export const BUILD_INFO = ${JSON.stringify(manifest, null, 2)};
export const CHANNEL = ${JSON.stringify(channel)};

// Bun.semver utilities
export const satisfies = (range) => Bun.semver.satisfies(VERSION, range);
export const compare = (other) => Bun.semver.order(VERSION, other);
export const isStable = () => !SemverUtils.parse(VERSION).prerelease?.length;
export const isPreRelease = () => (SemverUtils.parse(VERSION).prerelease?.length || 0) > 0;

export class ${component.replace(/[^a-zA-Z0-9]/g, '')}Component {
  static VERSION = VERSION;
  static BUILD_INFO = BUILD_INFO;
  static CHANNEL = CHANNEL;

  constructor(options = {}) {
    this.version = VERSION;
    this.channel = CHANNEL;
    this.options = options;
  }

  getVersion() {
    return this.version;
  }

  satisfies(range) {
    return satisfies(range);
  }
}

export default ${component.replace(/[^a-zA-Z0-9]/g, '')}Component;
`;

    try {
      const result = await Bun.build({
        entrypoints: [`/virtual/${filename}`],
        files: {
          [`/virtual/${filename}`]: source
        },
        outdir,
        minify,
        sourcemap: sourcemap ? 'external' : 'none',
        target: 'browser',
        format: 'esm',
        naming: `[name].${manifest.buildId.slice(0, 8)}.[ext]`,
        define: {
          'process.env.QUANTUM_VERSION': JSON.stringify(version.full),
          'process.env.QUANTUM_BUILD_ID': JSON.stringify(manifest.buildId),
          'process.env.QUANTUM_CHANNEL': JSON.stringify(channel)
        }
      });

      // Save manifest
      const manifestPath = join(outdir, `${filename}.manifest.json`);
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      this.buildManifests.set(manifest.buildId, manifest);

      console.log(`  Built: ${filename}`);
      console.log(`    Version: ${version.full}`);
      console.log(`    Output: ${outdir}`);

      return { manifest, result, filename, outdir };
    } catch (error) {
      console.error(`  Build failed for ${component}:`, error.message);
      return { manifest, error: error.message };
    }
  }

  /**
   * Check version compatibility using Bun.semver
   */
  checkCompatibility(version1, version2, options = {}) {
    const v1 = SemverUtils.parse(version1);
    const v2 = SemverUtils.parse(version2);

    return {
      compatible: Bun.semver.satisfies(version1, `^${version2}`) ||
                  Bun.semver.satisfies(version2, `^${version1}`),
      order: Bun.semver.order(version1, version2),
      diff: SemverUtils.diff(version1, version2),
      sameMajor: v1.major === v2.major,
      sameMinor: v1.minor === v2.minor,
      samePatch: v1.patch === v2.patch,
      canUpgrade: SemverUtils.gt(version1, version2),
      canDowngrade: SemverUtils.lt(version1, version2),
      v1IsPrerelease: v1.prerelease?.length > 0,
      v2IsPrerelease: v2.prerelease?.length > 0
    };
  }

  /**
   * Bump version
   */
  bumpVersion(type = 'patch', prereleaseId = null) {
    const current = this.version.full;
    let newVersion;

    switch (type) {
      case 'major':
        newVersion = SemverUtils.inc(current, 'major');
        break;
      case 'minor':
        newVersion = SemverUtils.inc(current, 'minor');
        break;
      case 'patch':
        newVersion = SemverUtils.inc(current, 'patch');
        break;
      case 'premajor':
        newVersion = SemverUtils.inc(current, 'premajor', prereleaseId || 'alpha');
        break;
      case 'preminor':
        newVersion = SemverUtils.inc(current, 'preminor', prereleaseId || 'alpha');
        break;
      case 'prepatch':
        newVersion = SemverUtils.inc(current, 'prepatch', prereleaseId || 'alpha');
        break;
      case 'prerelease':
        newVersion = SemverUtils.inc(current, 'prerelease', prereleaseId || 'alpha');
        break;
      default:
        throw new Error(`Unknown bump type: ${type}`);
    }

    // Update package.json
    try {
      const pkgPath = './package.json';
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      pkg.version = newVersion;
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

      this.version = {
        full: newVersion,
        parsed: SemverUtils.parse(newVersion),
        package: pkg
      };

      // Re-initialize channels with new version
      this.initializeReleaseChannels();
    } catch (e) {
      console.warn('Could not update package.json:', e.message);
    }

    return newVersion;
  }

  /**
   * Get channel info
   */
  getChannelInfo() {
    const info = [];
    for (const [name, config] of this.releaseChannels) {
      info.push({
        channel: name,
        ...config,
        currentVersion: this.generateBuildVersion(name).full
      });
    }
    return info;
  }
}

/**
 * Build Pipeline with Semver
 */
class QuantumBuildPipeline {
  constructor() {
    this.semverEngine = new QuantumSemverEngine();
    this.buildCache = new Map();
  }

  /**
   * Build all components for a channel
   */
  async buildChannelRelease(channel, components = null) {
    const targetComponents = components || [
      'scene', 'particles', 'network', 'connections',
      'ui', 'data', 'shaders', 'interaction'
    ];

    console.log(`\nBuilding ${channel} release...`);
    console.log(`Components: ${targetComponents.join(', ')}`);
    console.log('─'.repeat(50));

    const builds = [];
    for (const component of targetComponents) {
      const build = await this.semverEngine.buildVersionedComponent(component, {
        channel,
        features: this.getComponentFeatures(component),
        profile: channel === 'stable' ? 'production' : 'development',
        minify: channel === 'stable' || channel === 'rc'
      });

      builds.push(build);
      this.buildCache.set(`${component}@${build.manifest.version}`, build);
    }

    // Create release manifest
    const releaseDir = this.semverEngine.getBuildDirectory(channel);
    const releaseManifest = {
      id: `release-${channel}-${Date.now()}`,
      channel,
      version: this.semverEngine.version.full,
      timestamp: new Date().toISOString(),
      components: builds.map(b => ({
        component: b.manifest.component,
        version: b.manifest.version,
        filename: b.filename,
        buildId: b.manifest.buildId
      })),
      bun: {
        version: Bun.version
      }
    };

    writeFileSync(
      join(releaseDir, 'release.manifest.json'),
      JSON.stringify(releaseManifest, null, 2)
    );

    console.log('─'.repeat(50));
    console.log(`Release manifest: ${releaseDir}/release.manifest.json`);

    return { builds, releaseManifest };
  }

  getComponentFeatures(component) {
    const features = {
      scene: ['webgl', 'simd'],
      particles: ['simd', 'accelerated'],
      network: ['performance', 'optimized'],
      connections: ['pulse', 'animation'],
      ui: ['react', 'fastrefresh'],
      data: ['buffer', 'simd'],
      shaders: ['webgl', 'optimized'],
      interaction: ['ipc', 'fast']
    };
    return features[component] || [];
  }
}

/**
 * Semver utility functions
 */
const QuantumSemverUtils = {
  parse: (version) => SemverUtils.parse(version),
  satisfies: (version, range) => Bun.semver.satisfies(version, range),
  compare: (v1, v2) => Bun.semver.order(v1, v2),
  diff: (v1, v2) => SemverUtils.diff(v1, v2),
  bump: (version, type, id) => SemverUtils.inc(version, type, id),
  gt: (v1, v2) => SemverUtils.gt(v1, v2),
  lt: (v1, v2) => SemverUtils.lt(v1, v2),
  eq: (v1, v2) => SemverUtils.eq(v1, v2),

  latest: (versions) => versions.sort(Bun.semver.order).pop(),

  filterByChannel: (versions, channel) => {
    return versions.filter(v => {
      const parsed = SemverUtils.parse(v);
      if (channel === 'stable') return !parsed.prerelease?.length;
      return parsed.prerelease?.[0] === channel;
    });
  }
};

/**
 * Naming conventions
 */
const QuantumNamingConvention = {
  components: {
    pattern: 'quantum-{component}-{version}.{channel}.{features}.js',
    minified: 'quantum-{component}-{version}.{channel}.min.js',
    sourcemap: 'quantum-{component}-{version}.{channel}.js.map'
  },
  directories: {
    canary: 'builds/canary/{date}/{component}/',
    nightly: 'builds/nightly/{date}/{component}/',
    alpha: 'builds/alpha/v{major}.{minor}/{component}/',
    beta: 'builds/beta/v{major}.{minor}/{component}/',
    rc: 'builds/release-candidate/v{major}.{minor}.{patch}/{component}/',
    stable: 'builds/stable/v{major}.{minor}.{patch}/{component}/'
  },
  archives: {
    component: 'quantum-{component}-{version}.{channel}.tar.gz',
    release: 'quantum-release-{channel}-{version}.tar.gz'
  }
};

// CLI Interface
if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const engine = new QuantumSemverEngine();
  const pipeline = new QuantumBuildPipeline();

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`Quantum Semver Engine v${engine.version.full}`);
    console.log(`Bun ${Bun.version}`);
    console.log(`Platform: ${process.platform} (${process.arch})`);

  } else if (args.includes('--channels')) {
    console.log('\nRelease Channels:');
    console.log('─'.repeat(60));
    for (const info of engine.getChannelInfo()) {
      console.log(`  ${info.channel.padEnd(10)} ${info.stability.padEnd(12)} ${info.retention.padEnd(10)} ${info.currentVersion}`);
    }

  } else if (args.includes('--bump')) {
    const typeIdx = args.indexOf('--bump') + 1;
    const type = args[typeIdx] || 'patch';
    const idIdx = args.indexOf('--id');
    const prereleaseId = idIdx > -1 ? args[idIdx + 1] : null;

    const newVersion = engine.bumpVersion(type, prereleaseId);
    console.log(`Bumped version to ${newVersion}`);

  } else if (args.includes('--build-channel')) {
    const channelIdx = args.indexOf('--build-channel') + 1;
    const channel = args[channelIdx] || 'canary';
    await pipeline.buildChannelRelease(channel);

  } else if (args.includes('--build-all-channels')) {
    const channels = ['canary', 'nightly', 'alpha', 'beta', 'rc', 'stable'];
    for (const channel of channels) {
      await pipeline.buildChannelRelease(channel);
    }

  } else if (args.includes('--check-compatibility')) {
    const idx = args.indexOf('--check-compatibility');
    const v1 = args[idx + 1];
    const v2 = args[idx + 2];

    if (!v1 || !v2) {
      console.log('Usage: --check-compatibility <version1> <version2>');
      process.exit(1);
    }

    const result = engine.checkCompatibility(v1, v2);
    console.log('\nCompatibility Check:');
    console.log('─'.repeat(40));
    console.log(`  ${v1} vs ${v2}`);
    console.log(`  Compatible: ${result.compatible}`);
    console.log(`  Order: ${result.order > 0 ? 'v1 > v2' : result.order < 0 ? 'v1 < v2' : 'equal'}`);
    console.log(`  Diff: ${result.diff || 'none'}`);
    console.log(`  Can Upgrade: ${result.canUpgrade}`);
    console.log(`  Can Downgrade: ${result.canDowngrade}`);

  } else if (args.includes('--semver-test')) {
    console.log('\nTesting Bun.semver APIs:');
    console.log('─'.repeat(50));

    const testVersion = '1.3.5-beta.2+simd.accelerated';
    console.log(`Test version: ${testVersion}`);

    const parsed = SemverUtils.parse(testVersion);
    console.log(`Parsed:`, parsed);

    console.log(`Satisfies ^1.3.0: ${Bun.semver.satisfies(testVersion, '^1.3.0')}`);
    console.log(`Order vs 1.3.4: ${Bun.semver.order(testVersion, '1.3.4')}`);
    console.log(`Diff vs 1.3.5: ${SemverUtils.diff(testVersion, '1.3.5')}`);
    console.log(`Increment prerelease: ${SemverUtils.inc(testVersion, 'prerelease', 'beta')}`);

  } else {
    console.log(`
Quantum Semver Engine - Bun Semantic Versioning System

Usage: bun run quantum-semver-engine.js [options]

Options:
  --version, -v           Show current version
  --channels              List all release channels
  --bump <type>           Bump version (major/minor/patch/prerelease)
  --build-channel <ch>    Build all components for channel
  --build-all-channels    Build all components for all channels
  --check-compatibility   Check version compatibility
  --semver-test           Test Bun.semver APIs

Channels: canary, nightly, alpha, beta, rc, stable

Examples:
  bun run quantum-semver-engine.js --bump patch
  bun run quantum-semver-engine.js --build-channel canary
  bun run quantum-semver-engine.js --check-compatibility 1.3.5-beta.1 1.3.5
`);
  }
}

export {
  QuantumSemverEngine,
  QuantumBuildPipeline,
  QuantumSemverUtils,
  QuantumNamingConvention
};
