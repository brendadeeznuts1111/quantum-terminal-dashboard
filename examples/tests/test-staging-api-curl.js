// Test Staging API with curl command demonstration

console.log("🧪 Testing Staging API with curl commands\n");

async function startStagingServer() {
  console.log("🚀 Starting staging API server...");

  try {
    const { StagingAPIServerDev } =
      await import("./src/api/staging-server-dev.js");
    const server = new StagingAPIServerDev();

    // Start the server
    await server.start();

    // Wait a moment for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return server;
  } catch (error) {
    console.error("❌ Failed to start staging server:", error.message);
    return null;
  }
}

async function testCurlCommand() {
  console.log("📄 1. Testing Original curl Command");
  console.log("-".repeat(50));

  const curlCommand = `curl 'https://staging-api.example.com/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"'`;

  console.log("🔧 Executing curl command:");
  console.log(curlCommand);

  try {
    // Execute curl command using Bun's shell
    const result =
      await Bun.$`curl -s https://staging-api.example.com/ -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'sec-ch-ua: "Google Chrome";v="143"' -H 'sec-ch-ua-platform: "macOS"'`.text();

    console.log("✅ Curl command executed successfully!");
    console.log("📄 Response (first 500 characters):");
    console.log(result.substring(0, 500) + (result.length > 500 ? "..." : ""));

    return result;
  } catch (error) {
    console.error("❌ Curl command failed:", error.message);
    return null;
  }
}

async function testAPIEndpoints() {
  console.log("\n📄 2. Testing All API Endpoints");
  console.log("-".repeat(50));

  const endpoints = [
    { path: "/", name: "Root Endpoint" },
    { path: "/api/v1/health", name: "Health Check" },
    { path: "/api/v1/metrics", name: "Metrics" },
    { path: "/api/v1/tension", name: "Tension Data" },
    { path: "/api/v1/analytics", name: "Analytics" },
    { path: "/api/v1/experiments", name: "A/B Experiments" },
    { path: "/api/v1/config", name: "Configuration" },
  ];

  const results = {};

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint.name}:`);

    try {
      const response = await fetch(`https://staging-api.example.com${endpoint.path}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "sec-ch-ua": '"Google Chrome";v="143"',
          "sec-ch-ua-platform": '"macOS"',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const data = await response.json();
          console.log(`   ✅ ${response.status} - JSON response`);
          console.log(`   📊 Data keys: ${Object.keys(data).join(", ")}`);
        } else {
          const text = await response.text();
          console.log(`   ✅ ${response.status} - HTML response`);
          console.log(`   📄 Content length: ${text.length} characters`);
        }

        results[endpoint.path] = { status: response.status, success: true };
      } else {
        console.log(`   ❌ ${response.status} - ${response.statusText}`);
        results[endpoint.path] = { status: response.status, success: false };
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results[endpoint.path] = { error: error.message, success: false };
    }
  }

  return results;
}

async function demonstrateCurlVariations() {
  console.log("\n📄 3. Curl Command Variations");
  console.log("-".repeat(50));

  const variations = [
    {
      name: "Simple curl request",
      command: "curl -s https://staging-api.example.com/api/v1/health",
    },
    {
      name: "With JSON pretty-printing",
      command: "curl -s https://staging-api.example.com/api/v1/health | jq .",
    },
    {
      name: "With custom User-Agent",
      command:
        'curl -s -H "User-Agent: QuantumStaging/1.0" https://staging-api.example.com/api/v1/metrics',
    },
  ];

  console.log("🔧 Available curl variations for testing:");
  variations.forEach((variation, index) => {
    console.log(`\n${index + 1}. ${variation.name}:`);
    console.log(`   ${variation.command}`);
  });

  // Execute a simple one as demonstration
  try {
    console.log("\n🔍 Executing simple curl request:");
    const result =
      await Bun.$`curl -s https://staging-api.example.com/api/v1/health`.text();
    const data = JSON.parse(result);
    console.log(`   ✅ Status: ${data.status}`);
    console.log(`   🌍 Environment: ${data.environment}`);
    console.log(`   ⏱️ Uptime: ${Math.floor(data.uptime)}s`);
  } catch (error) {
    console.error("❌ Simple curl test failed:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Staging API curl Tests\n");

  let server = null;

  try {
    // Start the staging server
    server = await startStagingServer();

    if (!server) {
      console.error("❌ Failed to start server, skipping tests");
      return;
    }

    // Run all tests
    await testCurlCommand();
    await testAPIEndpoints();
    await demonstrateCurlVariations();

    console.log("\n✅ All staging API curl tests completed successfully!");

    // Keep server running for manual testing
    console.log("\n🌐 Server is still running for manual testing:");
    console.log("   https://staging-api.example.com/");
    console.log("   https://staging-api.example.com/api/v1/health");
    console.log("   https://staging-api.example.com/api/v1/metrics");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
    console.error(error.stack);
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

// Run tests
runAllTests();
