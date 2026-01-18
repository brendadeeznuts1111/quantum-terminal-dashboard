// 2. Tension-decay-engine.js
"use strict";

class TensionDecayEngine {
  static NOISE_FLOOR = 0.01;
  
  constructor(decayRate = 0.95, historySize = 1024) {
    this.decayRate = decayRate;
    this.historySize = historySize;
    this._history = new Float32Array(historySize); // Circular buffer
    this._head = 0;
    this._tail = 0;
    this._count = 0;
    this._dampingCache = new Map();
    this._bufferMask = historySize - 1; // Power of 2 mask for circular buffer
    
    // Validate that historySize is power of 2 for efficient masking
    if ((historySize & this._bufferMask) !== 0) {
      throw new Error('historySize must be a power of 2 for efficient circular buffer');
    }
    
    // Pre-compute common damping factors
    for (let i = 0; i <= 100; i++) {
      this._dampingCache.set(i, Math.exp(-i / 100));
    }
  }
  
  decay(components, deltaTime = 1.0) {
    // Input validation
    if (!Array.isArray(components) || deltaTime <= 0) {
      return this.getAverageTension();
    }
    
    const decayFactor = Math.exp(-this.decayRate * deltaTime);
    const noiseFloor = TensionDecayEngine.NOISE_FLOOR;
    const bufferMask = this._bufferMask;
    const history = this._history;
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      
      // Skip invalid components
      if (!component || typeof component.tension !== 'number' || typeof component.stability !== 'number') {
        continue;
      }
      
      // Fast-path: already below noise floor
      if (component.tension < noiseFloor) {
        component.tension = 0;
      } else {
        // Optimized damping calculation with integer cache keys
        const stabilityKey = Math.floor(component.stability * 100);
        let damping = this._dampingCache.get(stabilityKey);
        if (damping === undefined) {
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
}

export default TensionDecayEngine;
