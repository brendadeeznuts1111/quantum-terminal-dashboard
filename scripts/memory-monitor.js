#!/usr/bin/env node

/**
 * Memory Usage Monitor
 * Tracks memory usage and provides detailed statistics
 */

const mem = process.memoryUsage();

console.log("=== Memory Usage Report ===");
console.log(`RSS: ${(mem.rss / 1024 / 1024).toFixed(1)} MB`);
console.log(`Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`);
console.log(`Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`);
console.log(`External: ${(mem.external / 1024 / 1024).toFixed(1)} MB`);
console.log(`Array Buffers: ${(mem.arrayBuffers / 1024 / 1024).toFixed(1)} MB`);

// Memory efficiency calculation
const heapEfficiency = ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1);
console.log(`Heap Efficiency: ${heapEfficiency}%`);

// Memory pressure indicator
const totalMemoryMB = mem.rss / 1024 / 1024;
let pressureLevel = "Low";
if (totalMemoryMB > 500) pressureLevel = "High";
else if (totalMemoryMB > 200) pressureLevel = "Medium";

console.log(`Memory Pressure: ${pressureLevel}`);
console.log("========================");
