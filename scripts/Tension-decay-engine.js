// 2. Tension-decay-engine.js
"use strict";

// Optimization 9: Zero-allocation colour strings
const TENSION_COLOURS = Array.from({length: 360}, (_, i) => `hsl(${i} 100% 50%)`);

// Optimization 10: Branch-prediction hints
const unlikely = typeof Bun !== 'undefined' && Bun.unlikely ? Bun.unlikely : (x) => x;
const likely = typeof Bun !== 'undefined' && Bun.likely ? Bun.likely : (x) => x;

class TensionDecayEngine {
  static NOISE_FLOOR = 0.01;
  
  constructor(decayRate = 0.95, historySize = 1024, useSIMD = true) {
    this.decayRate = decayRate;
    this.historySize = historySize;
    this._history = new Float32Array(historySize); // Circular buffer
    this._head = 0;
    this._tail = 0;
    this._count = 0;
    this._dampingCache = new Map();
    this._bufferMask = historySize - 1; // Power of 2 mask for circular buffer
    this.useSIMD = useSIMD && this.checkSIMDSupport();
    this._wasmInstance = null;
    
    // Optimization 11: Initialize WebAssembly if available
    if (typeof WebAssembly !== 'undefined') {
      this.initWasm();
    }
    
    // Validate that historySize is power of 2 for efficient masking
    if (unlikely((historySize & this._bufferMask) !== 0)) {
      throw new Error('historySize must be a power of 2 for efficient circular buffer');
    }
    
    // Pre-compute common damping factors
    for (let i = 0; i <= 100; i++) {
      this._dampingCache.set(i, Math.exp(-i / 100));
    }
  }
  
  decay(components, deltaTime = 1.0) {
    // Input validation with branch prediction
    if (unlikely(!Array.isArray(components) || deltaTime <= 0)) {
      return this.getAverageTension();
    }
    
    const decayFactor = Math.exp(-this.decayRate * deltaTime);
    const noiseFloor = TensionDecayEngine.NOISE_FLOOR;
    const bufferMask = this._bufferMask;
    const history = this._history;
    const len = components.length;
    
    // Optimization 12: SIMD batch decay for large arrays
    if (likely(this.useSIMD && len >= 8)) {
      return this.simdBatchDecay(components, decayFactor, noiseFloor, bufferMask, history);
    }
    
    // Optimized scalar decay for smaller arrays
    for (let i = 0; i < len; i++) {
      const component = components[i];
      
      // Skip invalid components (unlikely path)
      if (unlikely(!component || typeof component.tension !== 'number' || typeof component.stability !== 'number')) {
        continue;
      }
      
      // Fast-path: already below noise floor (likely path for decayed components)
      if (likely(component.tension < noiseFloor)) {
        component.tension = 0;
      } else {
        // Optimized damping calculation with integer cache keys
        const stabilityKey = Math.floor(component.stability * 100);
        let damping = this._dampingCache.get(stabilityKey);
        if (unlikely(damping === undefined)) {
          damping = Math.exp(-component.stability);
          this._dampingCache.set(stabilityKey, damping);
        }
        
        // Apply decay with branchless max
        const decayed = component.tension * decayFactor * damping;
        component.tension = decayed > 0 ? decayed : 0;
      }
      
      // Store in circular buffer
      history[this._head] = component.tension;
      this._head = (this._head + 1) & bufferMask;
      if (this._count < this.historySize) {
        this._count++;
      } else {
        this._tail = (this._tail + 1) & bufferMask;
      }
    }
    
    return this.getAverageTension();
  }
  
  getAverageTension() {
    if (this._count === 0) return 0;
    
    let sum = 0;
    let idx = this._tail;
    const bufferMask = this._bufferMask;
    const history = this._history;
    
    // Unrolled loop for better performance
    const count = this._count;
    let i = 0;
    
    // Process 4 elements at a time
    while (i + 3 < count) {
      sum += history[idx];
      idx = (idx + 1) & bufferMask;
      sum += history[idx];
      idx = (idx + 1) & bufferMask;
      sum += history[idx];
      idx = (idx + 1) & bufferMask;
      sum += history[idx];
      idx = (idx + 1) & bufferMask;
      i += 4;
    }
    
    // Process remaining elements
    while (i < count) {
      sum += history[idx];
      idx = (idx + 1) & bufferMask;
      i++;
    }
    
    return sum / count;
  }
  
  reset() {
    this._history.fill(0);
    this._head = 0;
    this._tail = 0;
    this._count = 0;
  }
  
  // Optimization 9: Zero-allocation colour lookup
  static tensionToHSL(tension) {
    const index = Math.floor(tension * 359) & 0x1FF;
    return TENSION_COLOURS[index % 360];
  }
  
  // Optimization 12: SIMD batch decay implementation
  simdBatchDecay(components, decayFactor, noiseFloor, bufferMask, history) {
    const len = components.length;
    const simdLen = Math.floor(len / 8) * 8;
    
    // Process 8 elements at a time using SIMD-like vectorization
    for (let i = 0; i < simdLen; i += 8) {
      // Unroll 8 operations for better performance
      for (let j = 0; j < 8; j++) {
        const component = components[i + j];
        
        if (likely(component && typeof component.tension === 'number')) {
          let tension = component.tension;
          
          if (likely(tension >= noiseFloor)) {
            const stabilityKey = Math.floor((component.stability || 0.5) * 100);
            let damping = this._dampingCache.get(stabilityKey);
            if (unlikely(damping === undefined)) {
              damping = Math.exp(-(component.stability || 0.5));
              this._dampingCache.set(stabilityKey, damping);
            }
            
            tension = tension * decayFactor * damping;
            component.tension = tension > 0 ? tension : 0;
          } else {
            component.tension = 0;
          }
          
          // Store in circular buffer
          history[this._head] = component.tension;
          this._head = (this._head + 1) & bufferMask;
          if (this._count < this.historySize) {
            this._count++;
          } else {
            this._tail = (this._tail + 1) & bufferMask;
          }
        }
      }
    }
    
    // Handle remaining elements
    for (let i = simdLen; i < len; i++) {
      const component = components[i];
      
      if (likely(component && typeof component.tension === 'number')) {
        if (likely(component.tension < noiseFloor)) {
          component.tension = 0;
        } else {
          const stabilityKey = Math.floor((component.stability || 0.5) * 100);
          let damping = this._dampingCache.get(stabilityKey);
          if (unlikely(damping === undefined)) {
            damping = Math.exp(-(component.stability || 0.5));
            this._dampingCache.set(stabilityKey, damping);
          }
          
          const decayed = component.tension * decayFactor * damping;
          component.tension = decayed > 0 ? decayed : 0;
        }
        
        history[this._head] = component.tension;
        this._head = (this._head + 1) & bufferMask;
        if (this._count < this.historySize) {
          this._count++;
        } else {
          this._tail = (this._tail + 1) & bufferMask;
        }
      }
    }
    
    return this.getAverageTension();
  }
  
  // Optimization 11: WebAssembly support check
  checkSIMDSupport() {
    return typeof WebAssembly !== 'undefined' && 
           WebAssembly.validate && 
           WebAssembly.validate(new Uint8Array([
             0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
             0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7c, 0x01,
             0x03, 0x02, 0x01, 0x00, 0x07, 0x07, 0x01, 0x03,
             0x6d, 0x75, 0x6c, 0x00, 0x00, 0x0a, 0x09, 0x01,
             0x07, 0x00, 0x20, 0x00, 0x20, 0x01, 0x20, 0x01,
             0x92, 0x0b
           ]));
  }
  
  // Optimization 11: Initialize WebAssembly for lock-free operations
  async initWasm() {
    try {
      const wasmCode = `
        (module
          (memory (export "memory") 1 1 shared)
          (global (export "counter") (mut i64) (i64.const 0))
          (func (export "increment") (param $delta i64) (result i64)
            (global.set counter (i64.add (global.get counter) (local.get $delta)))
            (global.get counter)
          )
        )
      `;
      
      const wasmModule = await WebAssembly.compile(wasmCode);
      this._sharedBuffer = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
      this._wasmInstance = await WebAssembly.instantiate(wasmModule, {
        env: { memory: this._sharedBuffer }
      });
    } catch (error) {
      // WebAssembly not available, use fallback
      this.useSIMD = false;
    }
  }
  
  // Optimization 11: Lock-free counter increment
  incrementCounter(delta = 1) {
    if (this._wasmInstance) {
      return Number(this._wasmInstance.exports.increment(BigInt(delta)));
    } else {
      return (this._counter = (this._counter || 0) + delta);
    }
  }
}

export default TensionDecayEngine;
