/**
 * Testing Utilities - Fake Timers with @testing-library/react
 * 
 * Features:
 * - Fake timer support for @testing-library/react
 * - User event handling with fake timers
 * - Immediate timer handling (setTimeout(fn, 0))
 * - Microtask queue draining
 */

import { jest } from "bun:test";

/**
 * Setup fake timers for testing
 * Works correctly with @testing-library/react and @testing-library/user-event
 */
export function setupFakeTimers() {
  jest.useFakeTimers();
  
  // Bun now sets setTimeout.clock = true when fake timers are enabled
  // This allows @testing-library/react to detect fake timers
  if (typeof setTimeout !== 'undefined') {
    setTimeout.clock = true;
  }
  
  return {
    advance: (ms) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    reset: () => jest.clearAllTimers(),
    restore: () => jest.useRealTimers(),
  };
}

/**
 * Restore real timers
 */
export function restoreRealTimers() {
  jest.useRealTimers();
  if (typeof setTimeout !== 'undefined') {
    delete setTimeout.clock;
  }
}

/**
 * Wait for microtask queue to drain
 * Useful with fake timers to ensure all promises resolve
 */
export async function drainMicrotasks() {
  return new Promise(resolve => {
    // Schedule a microtask
    Promise.resolve().then(resolve);
  });
}

/**
 * Advance timers and drain microtasks
 * Ensures all timers and promises are processed
 */
export async function advanceAndDrain(ms = 0) {
  jest.advanceTimersByTime(ms);
  await drainMicrotasks();
}

/**
 * Test helper for user interactions with fake timers
 */
export async function testUserInteraction(fn) {
  const timers = setupFakeTimers();
  try {
    await fn(timers);
  } finally {
    restoreRealTimers();
  }
}

/**
 * Immediate timer helper
 * advanceTimersByTime(0) now correctly fires setTimeout(fn, 0) callbacks
 */
export function scheduleImmediate(fn) {
  return setTimeout(fn, 0);
}

/**
 * Clear immediate timer
 */
export function clearImmediate(id) {
  return clearTimeout(id);
}

/**
 * Run all immediate timers
 */
export function runImmediateTimers() {
  jest.advanceTimersByTime(0);
}

/**
 * Test helper for immediate timers
 */
export async function testImmediateTimers(fn) {
  const timers = setupFakeTimers();
  try {
    await fn({
      schedule: scheduleImmediate,
      clear: clearImmediate,
      runAll: runImmediateTimers,
      advance: (ms) => jest.advanceTimersByTime(ms),
    });
  } finally {
    restoreRealTimers();
  }
}

/**
 * Mock timer state
 */
export class TimerState {
  constructor() {
    this.timers = new Map();
    this.nextId = 1;
  }

  schedule(fn, delay = 0) {
    const id = this.nextId++;
    this.timers.set(id, { fn, delay, executed: false });
    return id;
  }

  clear(id) {
    this.timers.delete(id);
  }

  advance(ms) {
    for (const [id, timer] of this.timers) {
      if (!timer.executed && timer.delay <= ms) {
        timer.fn();
        timer.executed = true;
      }
    }
  }

  runAll() {
    for (const [id, timer] of this.timers) {
      if (!timer.executed) {
        timer.fn();
        timer.executed = true;
      }
    }
  }

  clear() {
    this.timers.clear();
  }
}

export default {
  setupFakeTimers,
  restoreRealTimers,
  drainMicrotasks,
  advanceAndDrain,
  testUserInteraction,
  scheduleImmediate,
  clearImmediate,
  runImmediateTimers,
  testImmediateTimers,
  TimerState,
};

