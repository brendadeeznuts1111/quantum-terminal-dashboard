/**
 * PTY-Enabled Terminal Components for Quantum Terminal Dashboard
 * Bun 1.3.5+ with Bun.Terminal API
 *
 * Component Matrix:
 * - QTermScene: THREE.Scene + PTY (pty-alpha)
 * - QTermParticles: ParticleSystem + Terminal Output (pty-beta)
 * - QTermNetwork: NetworkNode + Streaming Data (pty-rc)
 * - QTermData: DataStream + Reusable PTY (pty-stable)
 */

import { Buffer } from 'buffer';

const VERSION = '1.4.0-pty.stable';
const RELEASE_TAG = 'pty-stable';

/**
 * QTermScene - THREE.Scene with PTY Terminal Support
 * @version 1.4.0-pty.alpha.1
 * @tag pty-alpha
 */
export class QTermScene {
  static COMPONENT_ID = 'qterm-scene@1.4.0-pty.alpha.1';
  static VERSION = '1.4.0-pty.alpha.1+terminal.v1';
  static COMPONENT_TYPE = 'THREE.Scene';
  static FEATURE_FLAGS = ['TERMINAL', 'WEBGL', 'PTY_SUPPORT'];
  static BUN_TERMINAL = 'Bun.Terminal';
  static PTY_DIMENSIONS = { cols: 120, rows: 40 };
  static TERMINAL_FEATURES = 'INTERACTIVE_SHELL';
  static RELEASE_TAG = 'pty-alpha';

  // SIMD properties
  static SIMD_BUFFER = 'SIMD_ENABLED';
  static SPAWN_SYNC = '30X_FASTER';
  static GAIN = '5.8x';

  constructor(options = {}) {
    this.id = `qterm-scene-${Date.now()}`;
    this.dimensions = options.dimensions || QTermScene.PTY_DIMENSIONS;
    this.terminal = null;
    this.process = null;
    this.outputBuffer = Buffer.alloc(64 * 1024);
    this.outputOffset = 0;
    this.listeners = new Set();

    this.metrics = {
      bytesReceived: 0,
      bytesSent: 0,
      commands: 0
    };
  }

  async init() {
    if (typeof Bun?.Terminal === 'undefined') {
      console.warn('Bun.Terminal not available - PTY features disabled');
      return null;
    }

    this.terminal = new Bun.Terminal({
      cols: this.dimensions.cols,
      rows: this.dimensions.rows,
      data: (term, data) => this.handleData(term, data)
    });

    return this.terminal;
  }

  handleData(term, data) {
    const bytes = Buffer.from(data);
    this.metrics.bytesReceived += bytes.length;

    // Store in buffer
    if (this.outputOffset + bytes.length > this.outputBuffer.length) {
      this.outputOffset = 0;
    }
    bytes.copy(this.outputBuffer, this.outputOffset);
    this.outputOffset += bytes.length;

    // Notify listeners
    for (const listener of this.listeners) {
      listener(data.toString(), this.id);
    }
  }

  async spawn(command = 'bash', args = ['-i']) {
    if (!this.terminal) await this.init();
    if (!this.terminal) return null;

    this.process = Bun.spawn([command, ...args], {
      terminal: this.terminal,
      env: { ...process.env, TERM: 'xterm-256color' }
    });

    return this.process;
  }

  write(data) {
    if (!this.terminal) return false;
    this.terminal.write(data);
    this.metrics.bytesSent += data.length;
    this.metrics.commands++;
    return true;
  }

  resize(cols, rows) {
    if (!this.terminal) return false;
    this.terminal.resize(cols, rows);
    this.dimensions = { cols, rows };
    return true;
  }

  onData(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async close() {
    if (this.process) {
      this.process.kill();
      await this.process.exited;
    }
    if (this.terminal) {
      this.terminal.close();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      dimensions: this.dimensions,
      bufferUsage: this.outputOffset
    };
  }
}

/**
 * QTermParticles - ParticleSystem with Terminal Output
 * @version 1.4.0-pty.beta.1
 * @tag pty-beta
 */
export class QTermParticles {
  static COMPONENT_ID = 'qterm-particles@1.4.0-pty.beta.1';
  static VERSION = '1.4.0-pty.beta.1+simd.pty';
  static COMPONENT_TYPE = 'ParticleSystem';
  static FEATURE_FLAGS = ['TERMINAL', 'SIMD', 'PTY_ANIMATION'];
  static BUN_TERMINAL = 'Bun.spawn(terminal:)';
  static PTY_DIMENSIONS = { cols: 80, rows: 24 };
  static TERMINAL_FEATURES = 'TERMINAL_OUTPUT';
  static RELEASE_TAG = 'pty-beta';

  // SIMD properties
  static SIMD_BUFFER = 'SIMD_2X';
  static SPAWN_SYNC = 'CLOSE_RANGE_FIX';
  static GAIN = '32.5x';

  constructor(options = {}) {
    this.id = `qterm-particles-${Date.now()}`;
    this.dimensions = options.dimensions || QTermParticles.PTY_DIMENSIONS;
    this.particles = [];
    this.terminal = null;
    this.animationFrame = null;

    this.config = {
      maxParticles: options.maxParticles || 10000,
      fps: options.fps || 30,
      ...options
    };

    this.metrics = {
      frames: 0,
      particlesRendered: 0,
      avgFrameTime: 0
    };
  }

  async init() {
    if (typeof Bun?.Terminal === 'undefined') return null;

    this.terminal = new Bun.Terminal({
      cols: this.dimensions.cols,
      rows: this.dimensions.rows,
      data: (term, data) => process.stdout.write(data)
    });

    return this.terminal;
  }

  spawnParticles(count, generator) {
    for (let i = 0; i < count && this.particles.length < this.config.maxParticles; i++) {
      this.particles.push(generator ? generator(i) : {
        x: Math.random() * this.dimensions.cols,
        y: Math.random() * this.dimensions.rows,
        char: '*',
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1.0
      });
    }
    return this.particles.length;
  }

  renderFrame() {
    if (!this.terminal) return;

    const start = performance.now();

    // Clear and build frame
    let frame = '\x1b[2J\x1b[H'; // Clear screen, home cursor

    for (const p of this.particles) {
      const x = Math.floor(p.x);
      const y = Math.floor(p.y);
      if (x >= 0 && x < this.dimensions.cols && y >= 0 && y < this.dimensions.rows) {
        frame += `\x1b[${y + 1};${x + 1}H${p.char}`;
      }
    }

    this.terminal.write(frame);

    const frameTime = performance.now() - start;
    this.metrics.frames++;
    this.metrics.particlesRendered += this.particles.length;
    this.metrics.avgFrameTime =
      (this.metrics.avgFrameTime * (this.metrics.frames - 1) + frameTime) / this.metrics.frames;
  }

  update(dt = 0.033) {
    let alive = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx * dt * 10;
      p.y += p.vy * dt * 10;
      p.life -= dt * 0.1;

      // Bounce off walls
      if (p.x < 0 || p.x >= this.dimensions.cols) p.vx *= -1;
      if (p.y < 0 || p.y >= this.dimensions.rows) p.vy *= -1;

      if (p.life > 0) {
        this.particles[alive++] = p;
      }
    }
    this.particles.length = alive;
  }

  startAnimation() {
    const frameInterval = 1000 / this.config.fps;
    this.animationFrame = setInterval(() => {
      this.update(frameInterval / 1000);
      this.renderFrame();
    }, frameInterval);
  }

  stopAnimation() {
    if (this.animationFrame) {
      clearInterval(this.animationFrame);
      this.animationFrame = null;
    }
  }

  async close() {
    this.stopAnimation();
    if (this.terminal) this.terminal.close();
  }

  getMetrics() {
    return {
      ...this.metrics,
      particleCount: this.particles.length,
      fps: this.config.fps
    };
  }
}

/**
 * QTermNetwork - NetworkNode with Streaming Data
 * @version 1.4.0-pty.rc.1
 * @tag pty-rc
 */
export class QTermNetwork {
  static COMPONENT_ID = 'qterm-network@1.4.0-pty.rc.1';
  static VERSION = '1.4.0-pty.rc.1+pty.stream';
  static COMPONENT_TYPE = 'NetworkNode';
  static FEATURE_FLAGS = ['TERMINAL', 'NETWORK_VIS', 'PTY_STREAM'];
  static BUN_TERMINAL = 'terminal.data()';
  static PTY_DIMENSIONS = { cols: 100, rows: 30 };
  static TERMINAL_FEATURES = 'STREAMING_DATA';
  static RELEASE_TAG = 'pty-rc';

  // SIMD properties
  static SIMD_BUFFER = 'SIMD_ACCEL';
  static SPAWN_SYNC = 'ARM64_OPTIMIZED';
  static GAIN = '3.2x';

  constructor(options = {}) {
    this.id = `qterm-network-${Date.now()}`;
    this.dimensions = options.dimensions || QTermNetwork.PTY_DIMENSIONS;
    this.nodes = new Map();
    this.streams = new Map();
    this.terminal = null;

    this.metrics = {
      nodesCreated: 0,
      streamsActive: 0,
      dataReceived: 0
    };
  }

  async init() {
    if (typeof Bun?.Terminal === 'undefined') return null;

    this.terminal = new Bun.Terminal({
      cols: this.dimensions.cols,
      rows: this.dimensions.rows,
      data: (term, data) => this.handleStreamData(data)
    });

    return this.terminal;
  }

  handleStreamData(data) {
    this.metrics.dataReceived += data.length;

    // Parse and route to appropriate stream
    const str = data.toString();
    for (const [streamId, stream] of this.streams) {
      if (stream.filter(str)) {
        stream.callback(str, streamId);
      }
    }
  }

  addNode(nodeData) {
    const id = nodeData.id || `node-${this.nodes.size}`;
    this.nodes.set(id, {
      ...nodeData,
      id,
      connections: new Set(),
      created: Date.now()
    });
    this.metrics.nodesCreated++;
    return id;
  }

  createStream(config = {}) {
    const id = config.id || `stream-${this.streams.size}`;
    this.streams.set(id, {
      id,
      filter: config.filter || (() => true),
      callback: config.callback || (() => {}),
      active: true
    });
    this.metrics.streamsActive++;
    return id;
  }

  async spawnNetworkMonitor(command = 'netstat', args = ['-an']) {
    if (!this.terminal) await this.init();
    if (!this.terminal) return null;

    const proc = Bun.spawn([command, ...args], {
      terminal: this.terminal,
      env: { ...process.env, TERM: 'xterm-256color' }
    });

    return proc;
  }

  async close() {
    if (this.terminal) this.terminal.close();
  }

  getMetrics() {
    return {
      ...this.metrics,
      nodeCount: this.nodes.size,
      dimensions: this.dimensions
    };
  }
}

/**
 * QTermData - DataStream with Reusable PTY
 * @version 1.4.0-pty.stable
 * @tag pty-stable
 */
export class QTermData {
  static COMPONENT_ID = 'qterm-data@1.4.0-pty.stable';
  static VERSION = '1.4.0+pty.integrated';
  static COMPONENT_TYPE = 'DataStream';
  static FEATURE_FLAGS = ['TERMINAL', 'LIVE_DATA', 'PTY_MONITOR'];
  static BUN_TERMINAL = 'Bun.Terminal()';
  static PTY_DIMENSIONS = { cols: 160, rows: 50 };
  static TERMINAL_FEATURES = 'REUSABLE_PTY';
  static RELEASE_TAG = 'pty-stable';

  // SIMD properties
  static SIMD_BUFFER = 'SIMD_MULTI';
  static SPAWN_SYNC = 'FD_OPTIMIZED';
  static GAIN = '4.7x';

  constructor(options = {}) {
    this.id = `qterm-data-${Date.now()}`;
    this.dimensions = options.dimensions || QTermData.PTY_DIMENSIONS;
    this.terminal = null;
    this.dataBuffer = Buffer.alloc(256 * 1024);
    this.dataOffset = 0;
    this.subscribers = new Set();
    this.processes = [];

    this.metrics = {
      processesSpawned: 0,
      dataCollected: 0,
      avgLatency: 0
    };
  }

  async init() {
    if (typeof Bun?.Terminal === 'undefined') return null;

    // Reusable terminal - can spawn multiple processes
    this.terminal = new Bun.Terminal({
      cols: this.dimensions.cols,
      rows: this.dimensions.rows,
      data: (term, data) => this.collectData(data)
    });

    return this.terminal;
  }

  collectData(data) {
    const bytes = Buffer.from(data);
    this.metrics.dataCollected += bytes.length;

    // Store in circular buffer
    if (this.dataOffset + bytes.length > this.dataBuffer.length) {
      this.dataOffset = 0;
    }
    bytes.copy(this.dataBuffer, this.dataOffset);
    this.dataOffset += bytes.length;

    // Notify subscribers
    for (const sub of this.subscribers) {
      sub(data.toString());
    }
  }

  async spawn(command, args = []) {
    if (!this.terminal) await this.init();
    if (!this.terminal) return null;

    const start = performance.now();
    const proc = Bun.spawn([command, ...args], {
      terminal: this.terminal,
      env: { ...process.env, TERM: 'xterm-256color' }
    });

    this.processes.push(proc);
    this.metrics.processesSpawned++;

    const latency = performance.now() - start;
    this.metrics.avgLatency =
      (this.metrics.avgLatency * (this.metrics.processesSpawned - 1) + latency) /
      this.metrics.processesSpawned;

    return proc;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  searchBuffer(pattern) {
    const patternBuf = Buffer.from(pattern);
    const results = [];
    let pos = 0;

    while (pos < this.dataOffset) {
      const found = this.dataBuffer.indexOf(patternBuf, pos);
      if (found === -1 || found >= this.dataOffset) break;
      results.push(found);
      pos = found + 1;
    }

    return results;
  }

  async close() {
    for (const proc of this.processes) {
      proc.kill();
      await proc.exited;
    }
    if (this.terminal) this.terminal.close();
  }

  getMetrics() {
    return {
      ...this.metrics,
      bufferUsage: this.dataOffset,
      activeProcesses: this.processes.filter(p => !p.killed).length
    };
  }
}

/**
 * Component Registry
 */
export const TerminalComponents = {
  Scene: QTermScene,
  Particles: QTermParticles,
  Network: QTermNetwork,
  Data: QTermData,

  VERSION,
  RELEASE_TAG,

  getComponentMatrix() {
    return [
      {
        id: QTermScene.COMPONENT_ID,
        type: QTermScene.COMPONENT_TYPE,
        version: QTermScene.VERSION,
        featureFlags: QTermScene.FEATURE_FLAGS,
        bunTerminal: QTermScene.BUN_TERMINAL,
        ptyDimensions: QTermScene.PTY_DIMENSIONS,
        terminalFeatures: QTermScene.TERMINAL_FEATURES,
        releaseTag: QTermScene.RELEASE_TAG,
        gain: QTermScene.GAIN
      },
      {
        id: QTermParticles.COMPONENT_ID,
        type: QTermParticles.COMPONENT_TYPE,
        version: QTermParticles.VERSION,
        featureFlags: QTermParticles.FEATURE_FLAGS,
        bunTerminal: QTermParticles.BUN_TERMINAL,
        ptyDimensions: QTermParticles.PTY_DIMENSIONS,
        terminalFeatures: QTermParticles.TERMINAL_FEATURES,
        releaseTag: QTermParticles.RELEASE_TAG,
        gain: QTermParticles.GAIN
      },
      {
        id: QTermNetwork.COMPONENT_ID,
        type: QTermNetwork.COMPONENT_TYPE,
        version: QTermNetwork.VERSION,
        featureFlags: QTermNetwork.FEATURE_FLAGS,
        bunTerminal: QTermNetwork.BUN_TERMINAL,
        ptyDimensions: QTermNetwork.PTY_DIMENSIONS,
        terminalFeatures: QTermNetwork.TERMINAL_FEATURES,
        releaseTag: QTermNetwork.RELEASE_TAG,
        gain: QTermNetwork.GAIN
      },
      {
        id: QTermData.COMPONENT_ID,
        type: QTermData.COMPONENT_TYPE,
        version: QTermData.VERSION,
        featureFlags: QTermData.FEATURE_FLAGS,
        bunTerminal: QTermData.BUN_TERMINAL,
        ptyDimensions: QTermData.PTY_DIMENSIONS,
        terminalFeatures: QTermData.TERMINAL_FEATURES,
        releaseTag: QTermData.RELEASE_TAG,
        gain: QTermData.GAIN
      }
    ];
  }
};

export default TerminalComponents;
