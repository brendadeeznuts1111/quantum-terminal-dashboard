// Optimization 12: SIMD tension batch decay
"use strict";

// Check if SIMD is available
const SIMD_AVAILABLE = typeof WebAssembly !== 'undefined' && 
                       WebAssembly.validate && 
                       WebAssembly.validate(new Uint8Array([
                         0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
                         0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7c, 0x01,
                         0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01, 0x03,
                         0x6d, 0x75, 0x6c, 0x00, 0x00, 0x0a, 0x09, 0x01,
                         0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x20, 0x01,
                         0x92, 0x0b
                       ]));

// SIMD WebAssembly module for batch decay
const SIMD_WASM_CODE = `
  (module
    (memory (export "memory") 16 16 shared)
    (global (export "decayFactor") (mut f32) (f32.const 0.95))
    (global (export "noiseFloor") (mut f32) (f32.const 0.01))
    
    (func (export "decay8") (param $ptr i32) (param $len i32)
      (local $i i32)
      (local $vec v128)
      (local $decay v128)
      (local $noise v128)
      (local $mask v128)
      
      ;; Load decay factor and noise floor as vectors
      (local.set $decay (v128.splat (global.get decayFactor)))
      (local.set $noise (v128.splat (global.get noiseFloor)))
      
      (loop $decay_loop
        ;; Load 8 tensions
        (local.set $vec (v128.load (local.get $ptr)))
        
        ;; Apply decay: vec * decayFactor
        (local.set $vec (f32x4.mul (local.get $vec) (local.get $decay)))
        
        ;; Create mask for values below noise floor
        (local.set $mask (f32x4.lt (local.get $vec) (local.get $noise)))
        
        ;; Set values below noise floor to 0
        (local.set $vec (v128.bitselect 
          (v128.splat (f32.const 0.0))
          (local.get $vec)
          (local.get $mask)
        ))
        
        ;; Store result
        (v128.store (local.get $ptr) (local.get $vec))
        
        ;; Next 8 elements (32 bytes)
        (local.set $ptr (i32.add (local.get $ptr) (i32.const 32)))
        (local.set $i (i32.add (local.get $i) (i32.const 8)))
        (br_if $decay_loop (i32.lt_u (local.get $i) (local.get $len)))
      )
    )
    
    (func (export "decay4") (param $ptr i32) (param $len i32)
      (local $i i32)
      (local $vec v128)
      (local $decay v128)
      (local $noise v128)
      (local $mask v128)
      
      (local.set $decay (v128.splat (global.get decayFactor)))
      (local.set $noise (v128.splat (global.get noiseFloor)))
      
      (loop $decay_loop
        (local.set $vec (v128.load (local.get $ptr)))
        (local.set $vec (f32x4.mul (local.get $vec) (local.set $decay)))
        (local.set $mask (f32x4.lt (local.get $vec) (local.get $noise)))
        (local.set $vec (v128.bitselect 
          (v128.splat (f32.const 0.0))
          (local.get $vec)
          (local.get $mask)
        ))
        (v128.store (local.get $ptr) (local.get $vec))
        
        (local.set $ptr (i32.add (local.get $ptr) (i32.const 16)))
        (local.set $i (i32.add (local.get $i) (i32.const 4)))
        (br_if $decay_loop (i32.lt_u (local.get $i) (local.get $len)))
      )
    )
    
    (func (export "setDecayFactor") (param $factor f32)
      (global.set decayFactor (local.get $factor))
    )
    
    (func (export "setNoiseFloor") (param $floor f32)
      (global.set noiseFloor (local.get $floor))
    )
  )
`;

export class SIMDTensionDecayEngine {
  constructor(decayRate = 0.95, useSIMD = true) {
    this.decayRate = decayRate;
    this.useSIMD = useSIMD && SIMD_AVAILABLE;
    this.wasmInstance = null;
    this.sharedBuffer = null;
    this.vectorSize = 8; // Process 8 tensions at once
    
    if (this.useSIMD) {
      this.initSIMD();
    }
  }

  async initSIMD() {
    try {
      // Compile SIMD WebAssembly module
      const wasmModule = await WebAssembly.compile(SIMD_WASM_CODE);
      
      // Create shared memory for SIMD operations
      this.sharedBuffer = new WebAssembly.Memory({ 
        initial: 16, 
        maximum: 16, 
        shared: true 
      });
      
      // Create instance
      this.wasmInstance = await WebAssembly.instantiate(wasmModule, {
        env: {
          memory: this.sharedBuffer
        }
      });
      
      // Set initial decay factor
      this.wasmInstance.exports.setDecayFactor(this.decayRate);
      
      console.log('⚡ SIMD decay engine initialized');
    } catch (error) {
      console.warn('⚠️ SIMD initialization failed, using fallback:', error.message);
      this.useSIMD = false;
    }
  }

  // High-performance batch decay using SIMD
  batchDecay(tensions, decayFactor = null) {
    const factor = decayFactor || this.decayRate;
    const len = tensions.length;
    
    if (this.useSIMD && this.wasmInstance && len >= 4) {
      return this.simdBatchDecay(tensions, factor);
    } else {
      return this.fallbackBatchDecay(tensions, factor);
    }
  }

  simdBatchDecay(tensions, factor) {
    const len = tensions.length;
    const float32Array = new Float32Array(this.sharedBuffer.buffer);
    
    // Copy tensions to shared memory
    float32Array.set(tensions);
    
    // Update decay factor if different
    if (factor !== this.decayRate) {
      this.wasmInstance.exports.setDecayFactor(factor);
      this.decayRate = factor;
    }
    
    // Use SIMD for bulk processing
    const simdLen = Math.floor(len / this.vectorSize) * this.vectorSize;
    
    if (simdLen >= 8) {
      this.wasmInstance.exports.decay8(0, simdLen);
    } else if (simdLen >= 4) {
      this.wasmInstance.exports.decay4(0, simdLen);
    }
    
    // Handle remaining elements with scalar code
    for (let i = simdLen; i < len; i++) {
      const decayed = tensions[i] * factor;
      float32Array[i] = decayed < 0.01 ? 0 : decayed;
    }
    
    // Copy results back
    return new Float32Array(float32Array.slice(0, len));
  }

  fallbackBatchDecay(tensions, factor) {
    const results = new Float32Array(tensions.length);
    
    // Process 4 elements at a time for better cache locality
    const len = tensions.length;
    const vectorLen = Math.floor(len / 4) * 4;
    
    for (let i = 0; i < vectorLen; i += 4) {
      results[i] = tensions[i] * factor;
      results[i + 1] = tensions[i + 1] * factor;
      results[i + 2] = tensions[i + 2] * factor;
      results[i + 3] = tensions[i + 3] * factor;
      
      // Apply noise floor
      if (results[i] < 0.01) results[i] = 0;
      if (results[i + 1] < 0.01) results[i + 1] = 0;
      if (results[i + 2] < 0.01) results[i + 2] = 0;
      if (results[i + 3] < 0.01) results[i + 3] = 0;
    }
    
    // Handle remaining elements
    for (let i = vectorLen; i < len; i++) {
      const decayed = tensions[i] * factor;
      results[i] = decayed < 0.01 ? 0 : decayed;
    }
    
    return results;
  }

  // Ultra-fast decay for single tension
  decay(tension, factor = null) {
    const decayFactor = factor || this.decayRate;
    const decayed = tension * decayFactor;
    return decayed < 0.01 ? 0 : decayed;
  }

  // Update parameters
  setDecayRate(rate) {
    this.decayRate = rate;
    if (this.useSIMD && this.wasmInstance) {
      this.wasmInstance.exports.setDecayRate(rate);
    }
  }

  setNoiseFloor(floor) {
    if (this.useSIMD && this.wasmInstance) {
      this.wasmInstance.exports.setNoiseFloor(floor);
    }
  }

  // Performance benchmark
  benchmark(iterations = 1000000) {
    const tensions = new Float32Array(iterations);
    for (let i = 0; i < iterations; i++) {
      tensions[i] = Math.random();
    }

    console.log(`🏃 Benchmarking ${iterations} tensions...`);
    
    const start = performance.now();
    this.batchDecay(tensions);
    const end = performance.now();
    
    const time = end - start;
    const rate = iterations / (time / 1000);
    
    console.log(`⚡ SIMD decay: ${(time).toFixed(2)}ms for ${iterations} tensions`);
    console.log(`📈 Rate: ${(rate / 1000000).toFixed(2)}M tensions/second`);
    
    return { time, rate, useSIMD: this.useSIMD };
  }

  // Cleanup
  destroy() {
    this.wasmInstance = null;
    this.sharedBuffer = null;
  }

  getMetrics() {
    return {
      useSIMD: this.useSIMD,
      vectorSize: this.vectorSize,
      decayRate: this.decayRate,
      memoryUsage: this.sharedBuffer ? this.sharedBuffer.buffer.byteLength : 0
    };
  }
}

export default SIMDTensionDecayEngine;
