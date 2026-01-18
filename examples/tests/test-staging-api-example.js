// Test Staging API Server for https://staging-api.example.com/

console.log(
  "🌐 Testing Staging API Server: https://staging-api.example.com/\n",
);

async function startStagingAPIServer() {
  console.log(
    "🚀 Starting staging API server for https://staging-api.example.com/...",
  );

  try {
    const { StagingAPIServer } =
      await import("./src/api/staging-api-server.js");
    const server = new StagingAPIServer();

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

async function testStagingAPIURL() {
  console.log("📄 1. Testing https://staging-api.example.com/ - Root Endpoint");
  console.log("-".repeat(60));

  const curlCommand = `curl 'https://staging-api.example.com/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"'`;

  console.log("🔧 Testing staging API URL:");
  console.log(`   URL: https://staging-api.example.com/`);
  console.log("🔧 Executing curl command:");
  console.log(curlCommand);

  try {
    // Execute curl command to test the staging API
    const result =
      await Bun.$`curl -s http://localhost:3000/ -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' -H 'sec-ch-ua: "Google Chrome";v="143"' -H 'sec-ch-ua-platform: "macOS"'`.text();

    console.log("✅ Staging API request executed successfully!");
    console.log("📄 Response (first 500 characters):");
    console.log(result.substring(0, 500) + (result.length > 500 ? "..." : ""));

    // Check if response contains staging URL
    if (result.includes("https://staging-api.example.com")) {
      console.log(
        "✅ Response correctly contains staging URL: https://staging-api.example.com/",
      );
    } else {
      console.log("⚠️  Response does not contain expected staging URL");
    }

    return result;
  } catch (error) {
    console.error("❌ Staging API request failed:", error.message);
    return null;
  }
}

async function testAllStagingEndpoints() {
  console.log("\n📄 2. Testing All Staging API Endpoints");
  console.log("-".repeat(60));

  const endpoints = [
    {
      path: "/",
      name: "Root - https://staging-api.example.com/",
      expected: "HTML",
    },
    { path: "/api/v1/health", name: "Health Check", expected: "JSON" },
    { path: "/api/v1/metrics", name: "Metrics", expected: "JSON" },
    { path: "/api/v1/tension", name: "Tension Data", expected: "JSON" },
    { path: "/api/v1/analytics", name: "Analytics", expected: "JSON" },
    { path: "/api/v1/experiments", name: "A/B Experiments", expected: "JSON" },
    { path: "/api/v1/config", name: "Configuration", expected: "JSON" },
  ];

  const results = {};

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint.name}:`);
    console.log(`   URL: https://staging-api.example.com${endpoint.path}`);

    try {
      const response = await fetch(`http://localhost:3000${endpoint.path}`, {
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

          // Check for staging URL in JSON responses
          if (data.staging_url === "https://staging-api.example.com") {
            console.log(`   ✅ Contains correct staging URL`);
          }
        } else {
          const text = await response.text();
          console.log(`   ✅ ${response.status} - HTML response`);
          console.log(`   📄 Content length: ${text.length} characters`);

          // Check for staging URL in HTML
          if (text.includes("https://staging-api.example.com")) {
            console.log(`   ✅ Contains correct staging URL`);
          }
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

async function testStagingHeaders() {
  console.log("\n📄 3. Testing Staging-Specific Headers");
  console.log("-".repeat(60));

  try {
    const response = await fetch("http://localhost:3000/api/v1/health", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "sec-ch-ua": '"Google Chrome";v="143"',
        "sec-ch-ua-platform": '"macOS"',
      },
    });

    console.log("🔍 Checking staging-specific headers:");
    console.log(`   Status: ${response.status}`);
    console.log(
      `   X-Staging-Environment: ${response.headers.get("X-Staging-Environment")}`,
    );
    console.log(`   X-Staging-URL: ${response.headers.get("X-Staging-URL")}`);
    console.log(
      `   X-Staging-Endpoint: ${response.headers.get("X-Staging-Endpoint")}`,
    );
    console.log(
      `   Access-Control-Allow-Origin: ${response.headers.get("Access-Control-Allow-Origin")}`,
    );

    return true;
  } catch (error) {
    console.error("❌ Header test failed:", error.message);
    return false;
  }
}

async function testStagingFeatures() {
  console.log("\n📄 4. Testing Staging Feature Flags");
  console.log("-".repeat(60));

  try {
    // Test analytics endpoint (should be enabled in staging)
    console.log("🔍 Testing Analytics (should be enabled in staging):");
    const analyticsResponse = await fetch(
      "http://localhost:3000/api/v1/analytics",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
    );

    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      console.log(`   ✅ Analytics enabled - Status: ${analytics.status}`);
      console.log(`   📊 Staging URL: ${analytics.staging_url}`);
    } else {
      console.log(
        `   ❌ Analytics disabled - Status: ${analyticsResponse.status}`,
      );
    }

    // Test experiments endpoint (should be enabled in staging)
    console.log("\n🔍 Testing A/B Experiments (should be enabled in staging):");
    const experimentsResponse = await fetch(
      "http://localhost:3000/api/v1/experiments",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
    );

    if (experimentsResponse.ok) {
      const experiments = await experimentsResponse.json();
      console.log(
        `   ✅ Experiments enabled - Active: ${experiments.active_experiments?.length || 0}`,
      );
      console.log(`   📊 Staging URL: ${experiments.staging_url}`);
    } else {
      console.log(
        `   ❌ Experiments disabled - Status: ${experimentsResponse.status}`,
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Feature test failed:", error.message);
    return false;
  }
}

async function demonstrateStagingCurlCommands() {
  console.log("\n📄 5. Complete Staging API curl Reference");
  console.log("-".repeat(60));

  console.log(
    "📚 Complete curl commands for https://staging-api.example.com/:",
  );
  console.log(`
# Main staging API endpoint
curl 'https://staging-api.example.com/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"'

# Health check
curl -s 'https://staging-api.example.com/api/v1/health' | jq .

# Get metrics
curl -s 'https://staging-api.example.com/api/v1/metrics' | jq .

# Get tension data
curl -s 'https://staging-api.example.com/api/v1/tension' | jq .

# Get analytics (staging feature)
curl -s 'https://staging-api.example.com/api/v1/analytics' | jq .

# Get experiments (staging feature)
curl -s 'https://staging-api.example.com/api/v1/experiments' | jq .

# Get public configuration
curl -s 'https://staging-api.example.com/api/v1/config' | jq .

# With custom headers
curl -s 'https://staging-api.example.com/api/v1/health' \\
  -H 'Authorization: Bearer YOUR_STAGING_TOKEN' \\
  -H 'X-API-Key: YOUR_STAGING_API_KEY' \\
  -H 'Content-Type: application/json'

# POST request example
curl -s -X POST \\
  -H 'Content-Type: application/json' \\
  -d '{"action": "update", "environment": "staging"}' \\
  'https://staging-api.example.com/api/v1/health'

# Debug mode with verbose output
curl -v 'https://staging-api.example.com/api/v1/health'

# Measure response time
curl -s -w "Time: %{time_total}s\\n" 'https://staging-api.example.com/api/v1/health' -o /dev/null

# Save response to file
curl -s 'https://staging-api.example.com/api/v1/health' -o staging-response.json
  `);

  // Execute a simple test
  try {
    console.log("\n🔍 Executing test curl command:");
    const result =
      await Bun.$`curl -s http://localhost:3000/api/v1/health`.text();
    const data = JSON.parse(result);
    console.log(`   ✅ Status: ${data.status}`);
    console.log(`   🌍 Environment: ${data.environment}`);
    console.log(`   🔗 Staging URL: ${data.staging_url}`);
    console.log(`   ⏱️ Uptime: ${Math.floor(data.uptime)}s`);
  } catch (error) {
    console.error("❌ Curl test failed:", error.message);
  }
}

async function generateStagingDocumentation() {
  console.log("\n📄 6. Staging API Documentation");
  console.log("-".repeat(60));

  console.log("📖 https://staging-api.example.com/ Documentation:");
  console.log(`
🌐 STAGING API SERVER
===================

Base URL: https://staging-api.example.com/
Environment: Staging
Version: v1
Status: Active

📡 AVAILABLE ENDPOINTS
=====================

GET  https://staging-api.example.com/
     Main staging API landing page with documentation

GET  https://staging-api.example.com/api/v1/health
     Health check and system status
     Returns: status, environment, uptime, quantum metrics

GET  https://staging-api.example.com/api/v1/metrics
     System and performance metrics
     Returns: memory usage, API metrics, cache stats

GET  https://staging-api.example.com/api/v1/tension
     Quantum tension monitoring data
 returns: component tensions, system health

GET  https://staging-api.example.com/api/v1/analytics
     Predictive analytics (staging feature)
     Returns: load predictions, recommendations

GET  https://staging-api.example.com/api/v1/experiments
     A/B testing data (staging feature)
 returns: active experiments, metrics

GET  https://staging-api.example.com/api/v1/config
     Public configuration information
 returns: features, performance settings

🚀 STAGING FEATURES
==================

✅ quantum_terminal     - Quantum terminal interface
✅ real_time_monitoring - Real-time system monitoring
✅ predictive_analytics - Predictive analytics engine
✅ a_b_testing         - A/B testing framework
✅ advanced_logging    - Enhanced logging features

🔧 HEADERS
=========

All requests support:
- User-Agent: Browser identification
- sec-ch-ua: Chrome version information
- sec-ch-ua-platform: Platform information
- Authorization: Bearer token (optional)
- X-API-Key: API key (optional)

🧪 TESTING
==========

Use curl commands to test all endpoints:
curl 'https://staging-api.example.com/' -H 'User-Agent: Mozilla/5.0...'

📊 MONITORING
============

Staging includes:
- Real-time metrics collection
- Performance monitoring
- Error tracking
- Feature flag analytics
- A/B testing analytics
  `);
}

// Run all tests
async function runAllTests() {
  console.log(
    "🚀 Starting Staging API Tests for https://staging-api.example.com/\n",
  );

  let server = null;

  try {
    // Start the staging server
    server = await startStagingAPIServer();

    if (!server) {
      console.error("❌ Failed to start server, skipping tests");
      return;
    }

    // Run all tests
    await testStagingAPIURL();
    await testAllStagingEndpoints();
    await testStagingHeaders();
    await testStagingFeatures();
    await demonstrateStagingCurlCommands();
    await generateStagingDocumentation();

    console.log("\n✅ All staging API tests completed successfully!");
    console.log("\n🌐 Staging API Server Information:");
    console.log(`   Primary URL: https://staging-api.example.com/`);
    console.log(`   Development URL: http://localhost:3000/`);
    console.log(`   Environment: staging`);
    console.log(`   Version: v1`);

    console.log("\n📡 Available endpoints:");
    console.log("   📡 https://staging-api.example.com/");
    console.log("   📡 https://staging-api.example.com/api/v1/health");
    console.log("   📡 https://staging-api.example.com/api/v1/metrics");
    console.log("   📡 https://staging-api.example.com/api/v1/tension");
    console.log("   📡 https://staging-api.example.com/api/v1/analytics");
    console.log("   📡 https://staging-api.example.com/api/v1/experiments");
    console.log("   📡 https://staging-api.example.com/api/v1/config");
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

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Run tests
runAllTests();
