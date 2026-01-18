/**
 * simd-worker.js - SIMD-Optimized Worker for parallel buffer processing
 * Uses Bun's faster IPC for worker communication
 */

import { Buffer } from "buffer";

/**
 * Process buffer with SIMD optimizations
 */
function processBuffer(
  buffer,
  patterns = ["MARKET", "PRICE", "VOLUME", "QUANTUM"],
) {
  const results = new Map();

  for (const pattern of patterns) {
    const patternBuffer = Buffer.from(pattern);
    const positions = [];
    let position = 0;

    // SIMD-optimized search
    while (true) {
      const foundPos = buffer.indexOf(patternBuffer, position);
      if (foundPos === -1) break;

      positions.push(foundPos);
      position = foundPos + 1;
    }

    if (positions.length > 0) {
      results.set(pattern, {
        count: positions.length,
        positions,
        first: positions[0],
        last: positions[positions.length - 1],
      });
    }
  }

  return results;
}

/**
 * Parse financial data from buffer
 */
function parseFinancialData(buffer) {
  const str = buffer.toString("utf8");
  const lines = str.split("\n").filter((l) => l.trim());

  return lines
    .map((line) => {
      try {
        // Try JSON parse first
        if (line.startsWith("{")) {
          return JSON.parse(line);
        }

        // Try CSV format
        const parts = line.split(",");
        if (parts.length >= 3) {
          return {
            symbol: parts[0],
            price: parseFloat(parts[1]),
            volume: parseInt(parts[2]),
            timestamp: parts[3] ? parseInt(parts[3]) : Date.now(),
          };
        }

        return null;
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Calculate statistics on buffer data
 */
function calculateStats(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { count: 0, avg: 0, min: 0, max: 0 };
  }

  const prices = data.filter((d) => d.price).map((d) => d.price);

  if (prices.length === 0) {
    return { count: data.length, avg: 0, min: 0, max: 0 };
  }

  return {
    count: data.length,
    avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
    sum: prices.reduce((a, b) => a + b, 0),
  };
}

// Handle messages from main thread
self.onmessage = (event) => {
  const { type, buffer, workerId, patterns } = event.data;
  const startTime = performance.now();

  try {
    let result;

    switch (type) {
      case "process_buffer":
        const bufferData = Buffer.from(buffer.data || buffer);
        const searchResults = processBuffer(bufferData, patterns);

        result = {
          workerId,
          type: "process_buffer",
          results: Array.from(searchResults.entries()),
          bufferLength: bufferData.length,
          processedAt: Date.now(),
          processingTime: performance.now() - startTime,
        };
        break;

      case "parse_financial":
        const parseBuffer = Buffer.from(buffer.data || buffer);
        const parsedData = parseFinancialData(parseBuffer);
        const stats = calculateStats(parsedData);

        result = {
          workerId,
          type: "parse_financial",
          data: parsedData,
          stats,
          processedAt: Date.now(),
          processingTime: performance.now() - startTime,
        };
        break;

      case "ping":
        result = {
          workerId,
          type: "pong",
          timestamp: Date.now(),
        };
        break;

      default:
        result = {
          workerId,
          type: "error",
          error: `Unknown message type: ${type}`,
        };
    }

    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      workerId,
      type: "error",
      error: error.message,
      processingTime: performance.now() - startTime,
    });
  }
};

// Signal ready
self.postMessage({ type: "ready", workerId: "simd-worker" });
