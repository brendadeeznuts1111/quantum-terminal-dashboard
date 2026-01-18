/**
 * ipc-worker.js - IPC Performance Test Worker
 * Uses Bun's faster IPC for worker communication benchmarks
 */

let messageCount = 0;
let startTime = null;

// Handle messages from main thread
self.onmessage = (event) => {
  const { type, id, data, sentAt, payload } = event.data;

  switch (type) {
    case "ping":
      // Respond immediately for ping-pong latency test
      messageCount++;
      self.postMessage({
        type: "pong",
        id,
        count: messageCount,
        sentAt, // Echo back for latency calculation
        timestamp: Date.now(),
      });
      break;

    case "start_benchmark":
      startTime = performance.now();
      messageCount = 0;
      self.postMessage({
        type: "benchmark_started",
        startTime,
      });
      break;

    case "end_benchmark":
      const endTime = performance.now();
      const duration = endTime - (startTime || endTime);
      self.postMessage({
        type: "benchmark_complete",
        messageCount,
        duration,
        messagesPerSec: messageCount / (duration / 1000),
      });
      break;

    case "echo":
      // Echo back the data for throughput testing
      self.postMessage({
        type: "echo_response",
        id,
        data,
        timestamp: Date.now(),
      });
      break;

    case "process":
      // Simulate some processing
      const result = processData(data);
      self.postMessage({
        type: "process_complete",
        id,
        result,
        timestamp: Date.now(),
      });
      break;

    default:
      self.postMessage({
        type: "unknown",
        originalType: type,
      });
  }
};

/**
 * Simulate data processing
 */
function processData(data) {
  if (!data) return null;

  // Simulate some CPU work
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += Math.sqrt(i);
  }

  return {
    processed: true,
    inputSize: JSON.stringify(data).length,
    checksum: sum,
    timestamp: Date.now(),
  };
}

// Signal ready
self.postMessage({ type: "ready", workerId: "ipc-worker" });
