// Optimization 10: Branch-prediction hints
"use strict";

// Bun.unlikely intrinsic for branch prediction (Bun ≥ 1.3.5)
const unlikely = typeof Bun !== 'undefined' && Bun.unlikely ? Bun.unlikely : (x) => x;
const likely = typeof Bun !== 'undefined' && Bun.likely ? Bun.likely : (x) => x;

export class FastValidator {
  constructor() {
    this.supported = true;
    this.cache = new Map();
  }

  validate(data) {
    // Fast path with branch prediction hint
    if (likely(this.supported && this.cache.has(data))) {
      return this.cache.get(data);
    }

    // Slow path - unlikely to be taken
    if (unlikely(!this.supported)) {
      console.error('Validation not supported');
      process.exit(1);
    }

    // Validation logic
    const result = this.performValidation(data);
    this.cache.set(data, result);
    return result;
  }

  performValidation(data) {
    // Expensive validation logic
    return data.length > 0 && data[0] !== null;
  }
}

export class FastPathProcessor {
  constructor() {
    this.initialized = true;
    this.errorCount = 0;
  }

  process(item) {
    // Fast path - item is valid (likely)
    if (likely(item && typeof item === 'object' && item.valid)) {
      return this.processValid(item);
    }

    // Slow path - error handling (unlikely)
    if (unlikely(!item)) {
      this.errorCount++;
      return null;
    }

    // Fallback processing
    return this.processFallback(item);
  }

  processValid(item) {
    // Optimized processing for valid items
    return item.data * 2;
  }

  processFallback(item) {
    // Less efficient fallback
    return item ? item.data || 0 : 0;
  }
}

// Memory allocation with branch prediction
export class FastAllocator {
  constructor(initialSize = 1024) {
    this.buffer = new Float32Array(initialSize);
    this.position = 0;
    this.size = initialSize;
  }

  allocate(count) {
    // Fast path - enough space available (likely)
    if (likely(this.position + count <= this.size)) {
      const start = this.position;
      this.position += count;
      return this.buffer.subarray(start, this.position);
    }

    // Slow path - need to resize (unlikely)
    if (unlikely(this.position + count > this.size)) {
      return this.resizeAndAllocate(count);
    }
  }

  resizeAndAllocate(count) {
    const newSize = Math.max(this.size * 2, this.position + count);
    const newBuffer = new Float32Array(newSize);
    newBuffer.set(this.buffer);
    this.buffer = newBuffer;
    this.size = newSize;
    return this.allocate(count);
  }
}

// Error handling with branch prediction
export function safeOperation(operation) {
  try {
    // Fast path - operation succeeds (likely)
    const result = operation();
    if (likely(result !== undefined)) {
      return { success: true, result };
    }
  } catch (error) {
    // Slow path - operation fails (unlikely)
    if (unlikely(error instanceof Error)) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Unknown error' };
}

export default {
  unlikely,
  likely,
  FastValidator,
  FastPathProcessor,
  FastAllocator,
  safeOperation
};
