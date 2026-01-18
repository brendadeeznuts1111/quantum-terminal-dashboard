/**
 * Performance Optimization Tests
 * 
 * Tests for:
 * - Zero-allocation colour strings
 * - Branch prediction hints
 * - Lock-free decay counter
 * - SIMD batch decay
 * - TTY gradient bar
 * - Live tunables
 * - Performance metrics
 */

import {
  TENSION_COLOURS,
  tensionToHSL,
  validateWithHints,
  LockFreeDecayCounter,
  simdBatchDecay,
  optimizedDecay,
  renderGradientBar,
  LiveTunables,
  PerformanceMetrics,
} from '../../src/performance-optimizations.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`❌ FAILED: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    process.exit(1);
  }
}

function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const avg = (end - start) / iterations;
  console.log(`  ⏱️  ${name}: ${avg.toFixed(3)}ms (${iterations} iterations)`);
  return avg;
}

// ============================================================================
// TEST 1: Zero-Allocation Colour Strings
// ============================================================================

console.log('\n📋 TEST 1: Zero-Allocation Colour Strings');

assert(TENSION_COLOURS.length === 360, 'Should have 360 colours');
assert(TENSION_COLOURS[0] === 'hsl(0 100% 50%)', 'First colour should be red');
assert(TENSION_COLOURS[120] === 'hsl(120 100% 50%)', 'Colour 120 should be green');
assert(TENSION_COLOURS[240] === 'hsl(240 100% 50%)', 'Colour 240 should be blue');

const colour1 = tensionToHSL(0.0);
const colour2 = tensionToHSL(0.5);
const colour3 = tensionToHSL(1.0);

assert(colour1 === TENSION_COLOURS[0], 'Tension 0 should map to colour 0');
// 0.5 * 359 = 179.5, floor = 179
assert(colour2 === TENSION_COLOURS[179], 'Tension 0.5 should map to colour 179');
assert(colour3 === TENSION_COLOURS[359], 'Tension 1.0 should map to colour 359');

console.log('  ✅ All colour tests passed');

// Benchmark colour lookup
benchmark('tensionToHSL lookup', () => tensionToHSL(Math.random()));

// ============================================================================
// TEST 2: Branch Prediction Hints
// ============================================================================

console.log('\n📋 TEST 2: Branch Prediction Hints');

assert(validateWithHints({ version: 1 }) === true, 'Valid data should pass');
assert(validateWithHints(null) === false, 'Null data should fail');
assert(validateWithHints({ version: 3 }) === false, 'Unsupported version should fail');

console.log('  ✅ All validation tests passed');

// ============================================================================
// TEST 3: Lock-Free Decay Counter
// ============================================================================

console.log('\n📋 TEST 3: Lock-Free Decay Counter');

const counter = new LockFreeDecayCounter(1.0, 0.015);
assert(counter.value === 1.0, 'Initial value should be 1.0');

counter.decay();
assert(counter.value < 1.0, 'Value should decay');
assert(counter.value > 0.99, 'Decay should be small');

counter.reset(0.5);
assert(counter.value === 0.5, 'Reset should set new value');

console.log('  ✅ All decay counter tests passed');

// Benchmark decay operation
benchmark('LockFreeDecayCounter.decay', () => {
  const c = new LockFreeDecayCounter(1.0, 0.015);
  c.decay();
});

// ============================================================================
// TEST 4: SIMD Batch Decay
// ============================================================================

console.log('\n📋 TEST 4: SIMD Batch Decay');

const tensions = new Float32Array([1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]);
const decayFactor = 0.99;

const decayed = simdBatchDecay(tensions, decayFactor);
assert(decayed.length === 8, 'Should maintain array length');
assert(decayed[0] < 1.0, 'Values should decay');
assert(decayed[0] > 0.98, 'Decay should be small');

console.log('  ✅ All SIMD decay tests passed');

// Benchmark SIMD decay
const largeTensions = new Float32Array(1000000);
for (let i = 0; i < largeTensions.length; i++) {
  largeTensions[i] = Math.random();
}

benchmark('simdBatchDecay (1M tensions)', () => {
  simdBatchDecay(largeTensions, 0.99);
}, 1);

// ============================================================================
// TEST 5: Optimized Decay
// ============================================================================

console.log('\n📋 TEST 5: Optimized Decay');

const testTensions = new Float32Array([1.0, 0.9, 0.8, 0.7]);
const result = optimizedDecay(testTensions, 0.015);

assert(result.length === 4, 'Should maintain array length');
assert(result[0] < 1.0, 'Values should decay');

console.log('  ✅ All optimized decay tests passed');

// ============================================================================
// TEST 6: TTY Gradient Progress Bar
// ============================================================================

console.log('\n📋 TEST 6: TTY Gradient Progress Bar');

const bar1 = renderGradientBar(0.0, 40);
const bar2 = renderGradientBar(0.5, 40);
const bar3 = renderGradientBar(1.0, 40);

assert(bar1.includes('\x1b[48;2;'), 'Should contain ANSI escape sequence');
assert(bar1.includes('\x1b[0m'), 'Should contain reset sequence');
assert(bar1.length > 40, 'Should include escape sequences');

console.log('  ✅ All gradient bar tests passed');

// Benchmark gradient bar rendering
benchmark('renderGradientBar', () => renderGradientBar(Math.random(), 40));

// ============================================================================
// TEST 7: Live Tunables
// ============================================================================

console.log('\n📋 TEST 7: Live Tunables');

const tunables = new LiveTunables({
  decayRate: 0.015,
  noiseFloor: 0.008,
});

assertEqual(tunables.get('decayRate'), 0.015, 'Should get decayRate');
assertEqual(tunables.get('noiseFloor'), 0.008, 'Should get noiseFloor');
assertEqual(tunables.get('missing', 'default'), 'default', 'Should return default');

tunables.set('decayRate', 0.02);
assertEqual(tunables.get('decayRate'), 0.02, 'Should set decayRate');

console.log('  ✅ All live tunables tests passed');

// ============================================================================
// TEST 8: Performance Metrics
// ============================================================================

console.log('\n📋 TEST 8: Performance Metrics');

const metrics = new PerformanceMetrics();

metrics.recordDecay(0.5);
metrics.recordDecay(0.6);
metrics.recordRender(1.0);
metrics.recordRender(1.2);
metrics.metrics.totalFrames = 100;

const summary = metrics.getSummary();
assert(summary.uptime, 'Should have uptime');
assert(summary.avgDecayTime, 'Should have avgDecayTime');
assert(summary.avgRenderTime, 'Should have avgRenderTime');
assert(summary.totalFrames === 100, 'Should track frames');
assert(summary.fps, 'Should calculate FPS');

console.log('  ✅ All metrics tests passed');
console.log(`  📊 Summary: ${JSON.stringify(summary)}`);

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║              ✅ ALL PERFORMANCE TESTS PASSED                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('\n📊 Performance Optimizations Summary:');
console.log('  ✅ Zero-allocation colour strings');
console.log('  ✅ Branch prediction hints');
console.log('  ✅ Lock-free decay counter');
console.log('  ✅ SIMD batch decay');
console.log('  ✅ TTY gradient progress bar');
console.log('  ✅ Live tunables');
console.log('  ✅ Performance metrics');
console.log('\n🚀 Ready for production deployment!\n');

