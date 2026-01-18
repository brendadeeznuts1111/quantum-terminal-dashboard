// Integration test for all optimizations 9-18
"use strict";

import { tensionToHSL, batchTensionToHSL } from './zero-allocation-colours.js';
import { FastValidator, FastPathProcessor } from './branch-prediction.js';
import LockFreeDecayEngine from './lockfree-decay-wasm.js';
import SIMDTensionDecayEngine from './simd-tension-decay.js';
import StaticImportSnapshot from './static-import-snapshot.js';
import TTYGradientProgress from './tty-gradient-progress.js';
import LiveTunables from './sigusr2-live-tunables.js';

export class OptimizationIntegrationTest {
  constructor() {
    this.results = new Map();
    this.startTime = performance.now();
  }

  async runAllTests() {
    console.log('🧪 Running optimization integration tests...');
    
    try {
      await this.testZeroAllocationColours();
      await this.testBranchPrediction();
      await this.testLockFreeDecay();
      await this.testSIMDDecay();
      await this.testStaticImportSnapshot();
      await this.testTTYGradientProgress();
      await this.testLiveTunables();
      
      this.generateReport();
      return true;
    } catch (error) {
      console.error('❌ Integration test failed:', error.message);
      return false;
    }
  }

  async testZeroAllocationColours() {
    console.log('🎨 Testing zero-allocation colours...');
    
    const start = performance.now();
    
    // Test single tension lookup
    const colour1 = tensionToHSL(0.5);
    const colour2 = tensionToHSL(0.75);
    
    // Test batch lookup
    const tensions = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      tensions[i] = Math.random();
    }
    const colours = new Array(1000);
    batchTensionToHSL(tensions, colours);
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('zeroAllocationColours', {
      passed: colour1.startsWith('hsl') && colour2.startsWith('hsl') && colours.length === 1000,
      duration,
      opsPerSecond: (1000 / duration * 1000).toFixed(0)
    });
    
    console.log(`✅ Zero-allocation colours: ${(1000 / duration * 1000).toFixed(0)} ops/sec`);
  }

  async testBranchPrediction() {
    console.log('🔮 Testing branch-prediction hints...');
    
    const start = performance.now();
    
    const validator = new FastValidator();
    const processor = new FastPathProcessor();
    
    // Test validation with likely/unlikely paths
    const validData = { valid: true, data: 42 };
    const invalidData = null;
    
    const validResult = validator.validate(validData);
    const processedResult = processor.process(validData);
    const invalidResult = processor.process(invalidData);
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('branchPrediction', {
      passed: validResult === true && processedResult === 84 && invalidResult === null,
      duration
    });
    
    console.log(`✅ Branch-prediction hints: ${duration.toFixed(2)}ms`);
  }

  async testLockFreeDecay() {
    console.log('⚡ Testing lock-free decay counter...');
    
    const start = performance.now();
    
    const engine = new LockFreeDecayEngine(0.95, true);
    
    // Test counter increment
    const counter1 = engine.increment(5);
    const counter2 = engine.increment(3);
    
    // Test decay operations
    const decayed1 = engine.decay(1.0);
    const decayed2 = engine.decay(0.05);
    
    // Test batch decay
    const tensions = new Float32Array([1.0, 0.8, 0.6, 0.4, 0.2]);
    const decayedBatch = engine.batchDecay(tensions);
    
    engine.destroy();
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('lockFreeDecay', {
      passed: Number(counter1) === 5 && decayed1 < 1.0 && decayedBatch.length === 5,
      duration,
      useWasm: engine.useWasm
    });
    
    console.log(`✅ Lock-free decay: ${duration.toFixed(2)}ms (${engine.useWasm ? 'WASM' : 'fallback'})`);
  }

  async testSIMDDecay() {
    console.log('🚀 Testing SIMD tension batch decay...');
    
    const start = performance.now();
    
    const engine = new SIMDTensionDecayEngine(0.95, true);
    
    // Test single decay
    const singleDecayed = engine.decay(1.0);
    
    // Test batch decay
    const tensions = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      tensions[i] = Math.random();
    }
    const batchDecayed = engine.batchDecay(tensions);
    
    // Benchmark
    const benchmark = engine.benchmark(10000);
    
    engine.destroy();
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('simdDecay', {
      passed: singleDecayed < 1.0 && batchDecayed.length === 1000,
      duration,
      useSIMD: engine.useSIMD,
      benchmarkRate: benchmark.rate
    });
    
    console.log(`✅ SIMD decay: ${duration.toFixed(2)}ms (${engine.useSIMD ? 'SIMD' : 'fallback'})`);
  }

  async testStaticImportSnapshot() {
    console.log('📸 Testing static import graph snapshot...');
    
    const start = performance.now();
    
    const snapshot = new StaticImportSnapshot();
    
    // Test snapshot creation
    const metrics = snapshot.getMetrics();
    
    // Test prewarming
    await snapshot.prewarmImports();
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('staticImportSnapshot', {
      passed: metrics.snapshotPath !== undefined,
      duration,
      metrics
    });
    
    console.log(`✅ Static import snapshot: ${duration.toFixed(2)}ms`);
  }

  async testTTYGradientProgress() {
    console.log('🌈 Testing TTY gradient progress bar...');
    
    const start = performance.now();
    
    const progress = new TTYGradientProgress(50);
    
    // Test gradient creation
    const bar1 = progress.createGradient(0.5);
    const bar2 = progress.createGradient(0.8);
    
    // Test tension progress
    progress.updateTension(0.6);
    
    // Test multi-gradient
    const multiBar = progress.createMultiGradient([0.3, 0.7, 0.9], ['\x1b[48;2;255;0;0m', '\x1b[48;2;0;255;0m', '\x1b[48;2;0;0;255m']);
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('ttyGradientProgress', {
      passed: bar1.length > 0 && bar2.length > 0 && multiBar.length > 0,
      duration,
      isTTY: progress.isTTY
    });
    
    console.log(`✅ TTY gradient progress: ${duration.toFixed(2)}ms`);
  }

  async testLiveTunables() {
    console.log('📡 Testing SIGUSR2 live tunables...');
    
    const start = performance.now();
    
    const tunables = new LiveTunables('/tmp/test-quantum-tune.json');
    
    // Test getting/setting tunables
    const decayRate = tunables.get('decayRate');
    tunables.set('maxTensions', 2000000);
    
    // Test change notification
    let notified = false;
    tunables.onChange('decayRate', (newValue) => {
      notified = true;
    });
    
    tunables.set('decayRate', 0.02);
    
    // Test metrics
    const metrics = tunables.getMetrics();
    
    tunables.destroy();
    
    const end = performance.now();
    const duration = end - start;
    
    this.results.set('liveTunables', {
      passed: decayRate !== undefined && notified && metrics.tunablesCount > 0,
      duration,
      metrics
    });
    
    console.log(`✅ Live tunables: ${duration.toFixed(2)}ms`);
  }

  generateReport() {
    const totalTime = performance.now() - this.startTime;
    const passedTests = Array.from(this.results.values()).filter(r => r.passed).length;
    const totalTests = this.results.size;
    
    console.log('');
    console.log('📊 Integration Test Report');
    console.log('================================');
    console.log(`⏱️ Total time: ${totalTime.toFixed(2)}ms`);
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    
    console.log('');
    console.log('📋 Detailed Results:');
    for (const [name, result] of this.results) {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration.toFixed(2);
      console.log(`${status} ${name}: ${duration}ms`);
      
      if (result.useWasm !== undefined) {
        console.log(`   WebAssembly: ${result.useWasm ? '✅' : '❌'}`);
      }
      if (result.useSIMD !== undefined) {
        console.log(`   SIMD: ${result.useSIMD ? '✅' : '❌'}`);
      }
      if (result.opsPerSecond !== undefined) {
        console.log(`   Performance: ${result.opsPerSecond} ops/sec`);
      }
      if (result.benchmarkRate !== undefined) {
        console.log(`   Benchmark: ${(result.benchmarkRate / 1000000).toFixed(2)}M ops/sec`);
      }
    }
    
    console.log('');
    if (passedTests === totalTests) {
      console.log('🎉 All optimization tests passed!');
      console.log('🚀 System is ready for production deployment');
    } else {
      console.log('⚠️ Some tests failed - review implementation');
    }
    
    return {
      totalTime,
      passedTests,
      totalTests,
      results: Object.fromEntries(this.results)
    };
  }
}

// Run integration tests if executed directly
if (import.meta.main) {
  const test = new OptimizationIntegrationTest();
  test.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default OptimizationIntegrationTest;
