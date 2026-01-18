// Test cases for TensionDecayEngine
import TensionDecayEngine from './Tension-decay-engine.js';

function runTests() {
  console.log('🧪 Running TensionDecayEngine tests...\n');
  
  let passed = 0;
  let total = 0;
  
  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
    }
  }
  
  function assertEqual(actual, expected, message = '') {
    if (Math.abs(actual - expected) > 1e-10) {
      throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
    }
  }
  
  function assert(condition, message = '') {
    if (!condition) {
      throw new Error(`Assertion failed. ${message}`);
    }
  }
  
  // Test 1: Constructor validation
  test('Constructor with valid power of 2 size', () => {
    const engine = new TensionDecayEngine(0.95, 512);
    assert(engine.historySize === 512);
    assert(engine._bufferMask === 511);
  });
  
  test('Constructor rejects non-power of 2 size', () => {
    try {
      new TensionDecayEngine(0.95, 1000);
      throw new Error('Should have thrown error');
    } catch (error) {
      assert(error.message.includes('power of 2'));
    }
  });
  
  // Test 2: Basic decay functionality
  test('Basic decay reduces tension', () => {
    const engine = new TensionDecayEngine(0.1, 64); // High decay rate for testing
    const components = [{ tension: 1.0, stability: 0.5 }];
    
    const initialTension = components[0].tension;
    engine.decay(components, 1.0);
    
    assert(components[0].tension < initialTension);
    assert(components[0].tension >= 0);
  });
  
  test('Noise floor cutoff', () => {
    const engine = new TensionDecayEngine(0.1, 64);
    const components = [{ tension: 0.005, stability: 0.5 }]; // Below noise floor
    
    engine.decay(components, 1.0);
    
    assertEqual(components[0].tension, 0);
  });
  
  // Test 3: Input validation
  test('Handles invalid components gracefully', () => {
    const engine = new TensionDecayEngine(0.1, 64);
    const components = [
      { tension: 1.0, stability: 0.5 }, // Valid
      null, // Invalid
      undefined, // Invalid
      { tension: 'invalid', stability: 0.5 }, // Invalid
      { tension: 1.0, stability: 'invalid' }, // Invalid
      {}, // Missing properties
    ];
    
    const initialValidTension = components[0].tension;
    const result = engine.decay(components, 1.0);
    
    assert(components[0].tension < initialValidTension);
    assert(typeof result === 'number');
  });
  
  test('Handles invalid deltaTime', () => {
    const engine = new TensionDecayEngine(0.1, 64);
    const components = [{ tension: 1.0, stability: 0.5 }];
    
    const initialTension = components[0].tension;
    engine.decay(components, -1.0); // Invalid deltaTime
    
    assertEqual(components[0].tension, initialTension); // Should not change
  });
  
  // Test 4: Circular buffer behavior
  test('Circular buffer wraps correctly', () => {
    const engine = new TensionDecayEngine(0.1, 8); // Small buffer for testing
    const components = [{ tension: 1.0, stability: 0.5 }];
    
    // Fill buffer beyond capacity
    for (let i = 0; i < 16; i++) {
      engine.decay(components, 0.1);
    }
    
    assert(engine._count <= 8); // Should not exceed buffer size
    assert(engine._head < 8);
    assert(engine._tail < 8);
  });
  
  // Test 5: Average tension calculation
  test('Average tension calculation', () => {
    const engine = new TensionDecayEngine(0.1, 64);
    
    // Empty buffer
    assertEqual(engine.getAverageTension(), 0);
    
    // Add some values
    const components = [{ tension: 1.0, stability: 0.5 }];
    engine.decay(components, 0.1);
    engine.decay(components, 0.1);
    
    const avg = engine.getAverageTension();
    assert(avg > 0 && avg <= 1.0);
  });
  
  // Test 6: Damping cache optimization
  test('Damping cache uses integer keys', () => {
    const engine = new TensionDecayEngine(0.1, 64);
    const components = [{ tension: 1.0, stability: 0.75 }];
    
    engine.decay(components, 1.0);
    
    // Should cache with integer key (75 for 0.75)
    assert(engine._dampingCache.has(75));
  });
  
  // Test 7: Reset functionality
  test('Reset clears all state', () => {
    const engine = new TensionDecayEngine(0.1, 64);
    const components = [{ tension: 1.0, stability: 0.5 }];
    
    engine.decay(components, 1.0);
    assert(engine._count > 0);
    
    engine.reset();
    assertEqual(engine._count, 0);
    assertEqual(engine._head, 0);
    assertEqual(engine._tail, 0);
    assertEqual(engine.getAverageTension(), 0);
  });
  
  // Test 8: Performance with many components
  test('Handles many components efficiently', () => {
    const engine = new TensionDecayEngine(0.1, 1024);
    const components = [];
    
    // Create many components
    for (let i = 0; i < 1000; i++) {
      components.push({
        tension: Math.random(),
        stability: Math.random()
      });
    }
    
    const start = performance.now();
    engine.decay(components, 1.0);
    const end = performance.now();
    
    // Should complete quickly (less than 100ms for 1000 components)
    assert(end - start < 100);
    assert(engine._count <= 1024);
  });
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('❌ Some tests failed.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };
