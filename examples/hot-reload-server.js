// Hot Reloading Server Demo
// Demonstrates Bun's YAML hot reloading capabilities

import { server, features, logging, performance } from "./hot-reload-demo.yaml";

console.log("🔥 Hot Reloading Server Demo");
console.log("=".repeat(50));

console.log(`\n🚀 Starting server on ${server.host}:${server.port}`);

if (features.debug) {
  console.log("🐛 Debug mode enabled");
}

if (features.verbose) {
  console.log("📝 Verbose logging enabled");
}

console.log(
  `⚡ Performance: SIMD ${performance.simdEnabled ? "enabled" : "disabled"}, ${performance.workerThreads} workers`,
);
console.log(`📊 Logging: ${logging.level} (${logging.format})`);

// Create server with configuration
const bunServer = Bun.serve({
  port: server.port,
  hostname: server.host,
  fetch(req) {
    const url = new URL(req.url);

    if (features.verbose) {
      console.log(`${req.method} ${req.url}`);
    }

    if (url.pathname === "/status") {
      return new Response(
        JSON.stringify({
          status: "running",
          features: features,
          logging: logging,
          performance: performance,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (url.pathname === "/config") {
      return new Response(
        `
        <html>
          <head><title>YAML Hot Reload Demo</title></head>
          <body>
            <h1>🔥 YAML Hot Reload Demo</h1>
            <h2>Current Configuration</h2>
            <pre>${JSON.stringify({ server, features, logging, performance }, null, 2)}</pre>
            <h2>Instructions</h2>
            <p>Edit <code>hot-reload-demo.yaml</code> and watch the server update automatically!</p>
            <p>Try changing features.debug, logging.level, or performance.workerThreads</p>
            <p><a href="/status">View Status API</a></p>
          </body>
        </html>
      `,
        {
          headers: { "Content-Type": "text/html" },
        },
      );
    }

    return new Response("Hello from YAML-configured server! 🚀");
  },
});

console.log(`\n✅ Server started successfully!`);
console.log(`🌐 Visit: http://${server.host}:${server.port}/config`);
console.log(`📊 Status API: http://${server.host}:${server.port}/status`);
console.log(
  `\n💡 Try editing hot-reload-demo.yaml to see hot reloading in action!`,
);

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  bunServer.stop();
  process.exit(0);
});
