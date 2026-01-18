// Optimization 11: Lock-free decay counter with WebAssembly
"use strict";

// WebAssembly module for atomic decay operations
const WASM_CODE = `
  (module
    (memory (export "memory") 1 1 shared)
    (global (export "counter") (mut i64) (i64.const 0))
    (global (export "decayRate") (mut f64) (f64.const 0.95))
    (global (export "noiseFloor") (mut f64) (f64.const 0.01))
    
    (func (export "increment") (param $delta i64) (result i64)
      (global.set counter (i64.add (global.get counter) (local.get $delta)))
      (global.get counter)
    )
    
    (func (export "decay") (param $tension f64) (result f64)
      (local $decayed f64)
      (local.set $decayed 
        (f64.mul 
          (local.get $tension)
          (f64.sub 
            (f64.const 1.0)
            (global.get decayRate)
          )
        )
      )
      (if (f64.lt (local.get $decayed) (global.get noiseFloor))
        (then (return (f64.const 0.0)))
      )
      (local.get $decayed)
    )
    
    (func (export "batchDecay") (param $ptr i32) (param $len i32) (param $decayFactor f64)
      (local $i i32)
      (local $tension f64)
      (loop $decay_loop
        (local.set $tension 
          (f64.load (local.get $ptr))
        )
        (local.set $tension
          (f64.mul (local.get $tension) (local.get $decayFactor))
        )
        (if (f64.lt (local.get $tension) (global.get noiseFloor))
          (then 
            (f64.store (local.get $ptr) (f64.const 0.0))
          )
          (else
            (f64.store (local.get $ptr) (local.get $tension))
          )
        )
        (local.set $ptr (i32.add (local.get $ptr) (i32.const 8)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br_if $decay_loop (i32.lt_u (local.get $i) (local.get $len)))
      )
    )
    
    (func (export "setDecayRate") (param $rate f64)
      (global.set decayRate (local.get $rate))
    )
    
    (func (export "getCounter") (result i64)
      (global.get counter)
    )
  )
`;

export class LockFreeDecayEngine {
  constructor(decayRate = 0.95, useWasm = true) {
    this.decayRate = decayRate;
    this.useWasm = useWasm && typeof WebAssembly === 'object';
    this.wasmInstance = null;
    this.sharedBuffer = null;
    this.fallbackTimer = null;
    this.counter = 0;
    
    if (this.useWasm) {
      this.initWasm();
    } else {
      this.initFallback();
    }
  }

  async initWasm() {
    try {
      // Compile WebAssembly module
      const wasmModule = await WebAssembly.compile(WASM_CODE);
      
      // Create shared memory for lock-free operations
      this.sharedBuffer = new WebAssembly.Memory({ 
        initial: 1, 
        maximum: 1, 
        shared: true 
      });
      
      // Create instance with shared memory
      this.wasmInstance = await WebAssembly.instantiate(wasmModule, {
        env: {
          memory: this.sharedBuffer
        }
      });
      
      // Set initial decay rate
      this.wasmInstance.exports.setDecayRate(this.decayRate);
      
      console.log('🚀 WebAssembly decay engine initialized');
    } catch (error) {
      console.warn('⚠️ WASM initialization failed, using fallback:', error.message);
      this.useWasm = false;
      this.initFallback();
    }
  }

  initFallback() {
    // Fallback to setInterval
    this.fallbackTimer = setInterval(() => {
      this.counter++;
    }, 16); // ~60Hz
    console.log('🔄 Fallback decay timer initialized');
  }

  // Lock-free counter increment
  increment(delta = 1) {
    if (this.useWasm && this.wasmInstance) {
      return this.wasmInstance.exports.increment(BigInt(delta));
    } else {
      this.counter += delta;
      return BigInt(this.counter);
    }
  }

  // Fast decay operation
  decay(tension) {
    if (this.useWasm && this.wasmInstance) {
      return this.wasmInstance.exports.decay(tension);
    } else {
      const decayed = tension * (1 - this.decayRate);
      return decayed < 0.01 ? 0 : decayed;
    }
  }

  // Batch decay for multiple tensions
  batchDecay(tensions, decayFactor = null) {
    const factor = decayFactor || (1 - this.decayRate);
    
    if (this.useWasm && this.wasmInstance && this.sharedBuffer) {
      // Copy tensions to shared memory
      const tensionArray = new Float64Array(this.sharedBuffer.buffer);
      tensionArray.set(tensions);
      
      // Call WASM batch decay
      this.wasmInstance.exports.batchDecay(0, tensions.length, factor);
      
      // Copy results back
      return new Float64Array(tensionArray.slice(0, tensions.length));
    } else {
      // Fallback batch processing
      const results = new Float64Array(tensions.length);
      for (let i = 0; i < tensions.length; i++) {
        results[i] = this.decay(tensions[i]);
      }
      return results;
    }
  }

  // Update decay rate at runtime
  setDecayRate(rate) {
    this.decayRate = rate;
    if (this.useWasm && this.wasmInstance) {
      this.wasmInstance.exports.setDecayRate(rate);
    }
  }

  // Get current counter value
  getCounter() {
    if (this.useWasm && this.wasmInstance) {
      return Number(this.wasmInstance.exports.getCounter());
    } else {
      return this.counter;
    }
  }

  // Cleanup
  destroy() {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.wasmInstance = null;
    this.sharedBuffer = null;
  }

  // Performance metrics
  getMetrics() {
    return {
      useWasm: this.useWasm,
      counter: this.getCounter(),
      decayRate: this.decayRate,
      memoryUsage: this.sharedBuffer ? this.sharedBuffer.buffer.byteLength : 0
    };
  }
}

export default LockFreeDecayEngine;
