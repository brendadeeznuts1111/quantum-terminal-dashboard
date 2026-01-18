// [DOMAIN][API][PRECONNECT][HSL:200,70%,85%][META:{PRECONNECT}][CLASS:PreconnectionDemo]{BUN-API}

/**
 * Preconnection Demo for https://staging-api.example.com/
 * Demonstrates proper headers and preconnection techniques
 */

import { CompleteEnvironmentManager } from "../config/complete-environment-manager.js";

class PreconnectionDemo {
  constructor() {
    this.configManager = new CompleteEnvironmentManager("staging");
    this.stagingURL = "https://staging-api.example.com";
  }

  /**
   * Generate proper preconnection headers for staging API
   */
  generatePreconnectionHeaders() {
    return {
      // Standard browser headers for preconnection
      "Upgrade-Insecure-Requests": "1",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',

      // Staging-specific headers
      "X-Staging-Environment": "true",
      "X-Client-Version": "1.0.0",
      "X-Request-ID": this.generateRequestId(),

      // Security headers
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site",

      // Accept headers
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "en-US,en;q=0.9",

      // Connection headers
      Connection: "keep-alive",

      // Cache headers
      "Cache-Control": "max-age=0",
      Pragma: "no-cache",
    };
  }

  /**
   * Generate API-specific headers for staging
   */
  generateAPIHeaders() {
    const baseHeaders = this.generatePreconnectionHeaders();

    return {
      ...baseHeaders,
      // API-specific headers
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "X-API-Version": "v1",
      "X-Staging-API-Key":
        this.configManager.get("api.key") || "staging_api_key_12345",

      // Authentication (if available)
      Authorization: `Bearer ${this.configManager.get("security.jwt_secret") || "staging_jwt_token"}`,

      // Request tracking
      "X-Request-Timestamp": new Date().toISOString(),
      "X-Client-Platform": "web",
      "X-Client-OS": "macOS",
    };
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Demonstrate preconnection techniques
   */
  async demonstratePreconnection() {
    console.log("🔗 Preconnection Demo for https://staging-api.example.com/\n");

    const headers = this.generatePreconnectionHeaders();

    console.log("📋 Generated Preconnection Headers:");
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log("\n🌐 Preconnection Techniques:");
    console.log(`
1. DNS Prefetch: <link rel="dns-prefetch" href="https://staging-api.example.com">
2. Preconnect: <link rel="preconnect" href="https://staging-api.example.com" crossorigin>
3. Prefetch: <link rel="prefetch" href="https://staging-api.example.com/api/v1/health">
4. Preload: <link rel="preload" href="https://staging-api.example.com/api/v1/config" as="fetch">
    `);

    return headers;
  }

  /**
   * Test preconnection with staging API
   */
  async testPreconnection() {
    console.log("\n🧪 Testing Preconnection with Staging API");
    console.log("-".repeat(50));

    const headers = this.generatePreconnectionHeaders();

    try {
      // Simulate preconnection request
      console.log("🔍 Sending preconnection request...");

      const response = await fetch("http://localhost:3000/", {
        method: "HEAD", // HEAD request for preconnection
        headers: headers,
      });

      console.log(`✅ Preconnection successful: ${response.status}`);
      console.log(
        `📄 Response headers: ${response.headers.size} headers received`,
      );

      // Check for staging-specific response headers
      const stagingHeaders = [
        "X-Staging-Environment",
        "X-Staging-URL",
        "Access-Control-Allow-Origin",
      ];

      console.log("\n🔍 Staging Response Headers:");
      stagingHeaders.forEach((headerName) => {
        const value = response.headers.get(headerName);
        console.log(`   ${headerName}: ${value || "Not set"}`);
      });

      return response;
    } catch (error) {
      console.error("❌ Preconnection failed:", error.message);
      return null;
    }
  }

  /**
   * Test API calls with proper headers
   */
  async testAPIWithHeaders() {
    console.log("\n🧪 Testing API Calls with Proper Headers");
    console.log("-".repeat(50));

    const apiHeaders = this.generateAPIHeaders();
    const endpoints = ["/api/v1/health", "/api/v1/metrics", "/api/v1/config"];

    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint}:`);

      try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          headers: apiHeaders,
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${response.status} - Success`);
          console.log(
            `   📊 Response contains staging_url: ${data.staging_url === "https://staging-api.example.com" ? "✅" : "❌"}`,
          );
          console.log(
            `   🆔 Request ID header: ${response.headers.get("X-Request-ID") || "Not set"}`,
          );
        } else {
          console.log(`   ❌ ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }

  /**
   * Generate HTML preconnection examples
   */
  generateHTMLPreconnection() {
    console.log("\n📄 HTML Preconnection Examples");
    console.log("-".repeat(50));

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staging API Preconnection Demo</title>
    
    <!-- Preconnection for https://staging-api.example.com -->
    <link rel="dns-prefetch" href="https://staging-api.example.com">
    <link rel="preconnect" href="https://staging-api.example.com" crossorigin>
    <link rel="prefetch" href="https://staging-api.example.com/api/v1/health">
    <link rel="preload" href="https://staging-api.example.com/api/v1/config" as="fetch">
    
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .section { margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 8px; }
        .code { background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; }
        .status { padding: 10px; border-radius: 6px; margin: 10px 0; }
        .success { background: #dcfce7; color: #166534; }
        .info { background: #dbeafe; color: #1e40af; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 Staging API Preconnection Demo</h1>
        <p>https://staging-api.example.com/ - Optimized Loading</p>
    </div>

    <div class="section">
        <h2>📋 Preconnection Headers Used</h2>
        <div class="code">
curl 'https://staging-api.example.com/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'X-Staging-Environment: true' \\
  -H 'X-Request-ID: req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}'
        </div>
    </div>

    <div class="section">
        <h2>🚀 Performance Benefits</h2>
        <div class="status success">✅ DNS Resolution: Pre-resolved</div>
        <div class="status success">✅ TCP Connection: Established</div>
        <div class="status success">✅ TLS Handshake: Completed</div>
        <div class="status success">✅ HTTP/2 Session: Ready</div>
        <div class="status info">ℹ️ Latency Reduction: ~100-300ms</div>
    </div>

    <div class="section">
        <h2>📊 Live API Status</h2>
        <div id="api-status">
            <div class="status info">🔄 Checking staging API status...</div>
        </div>
    </div>

    <script>
        // Test API with proper headers
        async function testStagingAPI() {
            const headers = {
                'Upgrade-Insecure-Requests': '1',
                'User-Agent': navigator.userAgent,
                'sec-ch-ua': '"Google Chrome";v="143"',
                'sec-ch-ua-platform': '"macOS"',
                'X-Staging-Environment': 'true',
                'Accept': 'application/json'
            };

            try {
                const response = await fetch('https://staging-api.example.com/api/v1/health', {
                    headers: headers
                });

                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('api-status').innerHTML = \`
                        <div class="status success">✅ API Status: \${data.status}</div>
                        <div class="status success">✅ Environment: \${data.environment}</div>
                        <div class="status success">✅ URL: \${data.staging_url}</div>
                        <div class="status success">✅ Uptime: \${Math.floor(data.uptime)}s</div>
                    \`;
                } else {
                    document.getElementById('api-status').innerHTML = \`
                        <div class="status error">❌ API Error: \${response.status}</div>
                    \`;
                }
            } catch (error) {
                document.getElementById('api-status').innerHTML = \`
                    <div class="status error">❌ Connection Error: \${error.message}</div>
                \`;
            }
        }

        // Test API on page load
        testStagingAPI();
    </script>
</body>
</html>`;

    console.log("📄 Generated HTML with preconnection:");
    console.log(html.substring(0, 1000) + "...");

    return html;
  }

  /**
   * Generate curl commands with proper headers
   */
  generateCurlCommands() {
    console.log("\n📋 Curl Commands with Proper Headers");
    console.log("-".repeat(50));

    const commands = {
      preconnection: `# Preconnection HEAD request
curl -I 'https://staging-api.example.com/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'X-Staging-Environment: true' \\
  -H 'Connection: keep-alive'`,

      apiCall: `# API call with full headers
curl 'https://staging-api.example.com/api/v1/health' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"' \\
  -H 'Accept: application/json, text/plain, */*' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Version: v1' \\
  -H 'X-Staging-Environment: true' \\
  -H 'Authorization: Bearer YOUR_STAGING_TOKEN'`,

      performance: `# Performance testing with timing
curl -w "@curl-format.txt" \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' \\
  -H 'X-Staging-Environment: true' \\
  'https://staging-api.example.com/api/v1/health'`,
    };

    Object.entries(commands).forEach(([name, command]) => {
      console.log(`\n${name.toUpperCase()}:`);
      console.log(command);
    });

    console.log("\n📄 curl-format.txt for timing:");
    console.log(`
     time_namelookup:  %{time_namelookup}s\\n
        time_connect:  %{time_connect}s\\n
     time_appconnect:  %{time_appconnect}s\\n
    time_pretransfer:  %{time_pretransfer}s\\n
       time_redirect:  %{time_redirect}s\\n
  time_starttransfer:  %{time_starttransfer}s\\n
                     ----------\\n
          time_total:  %{time_total}s\\n
    `);

    return commands;
  }

  /**
   * Run complete preconnection demo
   */
  async runDemo() {
    console.log(
      "🚀 Starting Preconnection Demo for https://staging-api.example.com/\n",
    );

    try {
      // Generate headers
      await this.demonstratePreconnection();

      // Test preconnection
      await this.testPreconnection();

      // Test API calls
      await this.testAPIWithHeaders();

      // Generate HTML examples
      this.generateHTMLPreconnection();

      // Generate curl commands
      this.generateCurlCommands();

      console.log("\n✅ Preconnection demo completed successfully!");
      console.log("\n🔗 Key Benefits:");
      console.log("   ✅ Reduced DNS lookup time");
      console.log("   ✅ Pre-established TCP connections");
      console.log("   ✅ Ready TLS handshakes");
      console.log("   ✅ Optimized HTTP/2 sessions");
      console.log("   ✅ Proper staging headers");
      console.log("   ✅ Request tracking and debugging");
    } catch (error) {
      console.error("❌ Demo failed:", error.message);
    }
  }
}

// Create and run demo
const preconnectionDemo = new PreconnectionDemo();

// Auto-run if executed directly
if (import.meta.main) {
  preconnectionDemo.runDemo();
}

export default preconnectionDemo;
export { PreconnectionDemo };
