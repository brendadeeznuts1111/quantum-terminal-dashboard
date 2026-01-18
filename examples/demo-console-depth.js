// Demo script to test Bun's --console-depth feature

const nested = {
  a: {
    b: {
      c: {
        d: {
          e: {
            f: "very deep value",
          },
        },
      },
    },
  },
};

console.log("=== Default console depth (2) ===");
console.log(nested);

console.log("\n=== Quantum System Metrics ===");
const quantumMetrics = {
  system: {
    tension: {
      current: 0.379,
      threshold: 0.5,
      status: "normal",
      history: {
        lastHour: [0.3, 0.35, 0.37, 0.38, 0.379],
        trend: "increasing",
        volatility: 0.082,
      },
    },
    performance: {
      cpu: {
        usage: 45.2,
        cores: 8,
        frequency: "3.2GHz",
        temperature: {
          current: 65,
          max: 85,
          zones: {
            core1: 64,
            core2: 66,
            core3: 65,
            core4: 67,
          },
        },
      },
      memory: {
        used: 248.6,
        total: 512,
        percent: 48.6,
        heap: {
          used: 120.3,
          limit: 256,
          gc: {
            collections: 142,
            time: 23.5,
            efficiency: 0.87,
          },
        },
      },
    },
    network: {
      connections: {
        active: 23,
        pending: 2,
        closed: 1456,
        types: {
          websocket: 8,
          http: 12,
          tcp: 3,
        },
      },
      throughput: {
        inbound: 1024.5,
        outbound: 2048.7,
        latency: {
          average: 12.3,
          p95: 45.6,
          p99: 78.9,
        },
      },
    },
  },
};

console.log(quantumMetrics);

console.log("\n=== Simple object ===");
console.log({ name: "Quantum System", version: "1.5.0", status: "active" });

console.log("\n=== Array with nested objects ===");
const dataArray = [
  { id: 1, metrics: { cpu: 45, memory: 60 } },
  { id: 2, metrics: { cpu: 52, memory: 58 } },
  { id: 3, metrics: { cpu: 38, memory: 62 } },
];
console.log(dataArray);
