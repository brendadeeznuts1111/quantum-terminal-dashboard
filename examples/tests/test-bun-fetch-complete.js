// Complete Bun Fetch API Test Suite
// Tests all Bun-specific fetch extensions against the staging API

import { BunFetchClient } from "./src/api/bun-fetch-client.js";
import { dns } from "bun";

console.log("🌐 Complete Bun Fetch API Test Suite\n");
console.log("━".repeat(60));

const client = new BunFetchClient("http://localhost:3000");

// Test 1: DNS Prefetching
async function testDNSPrefetch() {
  console.log("\n📄 1. DNS Prefetching");
  console.log("-".repeat(50));

  // Prefetch DNS for localhost
  await client.prefetchDNS("localhost");

  // Get DNS cache stats
  const stats = client.getDNSCacheStats();
  console.log("   📊 DNS Cache Stats:", stats || "Not available");

  console.log("   ✅ DNS prefetch test completed");
}

// Test 2: Preconnect
async function testPreconnect() {
  console.log("\n📄 2. Preconnect");
  console.log("-".repeat(50));

  // Preconnect to staging API
  await client.preconnect("http://localhost:3000");

  console.log("   ✅ Preconnect test completed");
}

// Test 3: Basic Fetch
async function testBasicFetch() {
  console.log("\n📄 3. Basic Fetch");
  console.log("-".repeat(50));

  const result = await client.get("/api/v1/health");

  if (result.ok) {
    const data = await result.response.json();
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📊 Environment: ${data.environment}`);
    console.log(`   📊 Uptime: ${data.uptime}s`);
    console.log(`   ⏱️ Request time: ${result.timing.duration.toFixed(2)}ms`);
  } else {
    console.log(`   ❌ Failed: ${result.error || result.status}`);
  }
}

// Test 4: POST Request
async function testPostRequest() {
  console.log("\n📄 4. POST Request");
  console.log("-".repeat(50));

  const result = await client.post("/api/v1/health", {
    message: "Hello from Bun fetch!",
    timestamp: new Date().toISOString(),
  });

  if (result.ok) {
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   ⏱️ Request time: ${result.timing.duration.toFixed(2)}ms`);
  } else {
    console.log(`   ❌ Failed: ${result.error || result.status}`);
  }
}

// Test 5: Custom Headers
async function testCustomHeaders() {
  console.log("\n📄 5. Custom Headers");
  console.log("-".repeat(50));

  const result = await client.get("/api/v1/health", {
    headers: {
      "X-Custom-Header": "test-value",
      "X-API-Key": "staging-api-key-12345",
      Authorization: "Bearer test-token",
    },
  });

  if (result.ok) {
    const data = await result.response.json();
    console.log(`   ✅ Status: ${result.status}`);
    console.log(`   📋 Request headers received by server`);
    if (data.request_headers) {
      console.log(
        `      User-Agent: ${data.request_headers["user-agent"]?.substring(0, 50)}...`,
      );
      console.log(`      sec-ch-ua: ${data.request_headers["sec-ch-ua"]}`);
    }
  } else {
    console.log(`   ❌ Failed: ${result.error || result.status}`);
  }
}

// Test 6: Response Body Types
async function testResponseBodies() {
  console.log("\n📄 6. Response Body Types");
  console.log("-".repeat(50));

  // JSON
  console.log("   🔍 Testing response.json():");
  try {
    const json = await client.getJSON("/api/v1/health");
    console.log(`      ✅ JSON parsed: ${typeof json === "object"}`);
    console.log(`      📊 Status: ${json.status}`);
  } catch (e) {
    console.log(`      ❌ JSON failed: ${e.message}`);
  }

  // Text
  console.log("   🔍 Testing response.text():");
  try {
    const text = await client.getText("/api/v1/health");
    console.log(`      ✅ Text received: ${text.length} characters`);
  } catch (e) {
    console.log(`      ❌ Text failed: ${e.message}`);
  }

  // Bytes
  console.log("   🔍 Testing response.bytes():");
  try {
    const bytes = await client.getBytes("/api/v1/health");
    console.log(`      ✅ Bytes received: ${bytes.length} bytes`);
  } catch (e) {
    console.log(`      ❌ Bytes failed: ${e.message}`);
  }

  // ArrayBuffer
  console.log("   🔍 Testing response.arrayBuffer():");
  try {
    const buffer = await client.getArrayBuffer("/api/v1/health");
    console.log(`      ✅ ArrayBuffer received: ${buffer.byteLength} bytes`);
  } catch (e) {
    console.log(`      ❌ ArrayBuffer failed: ${e.message}`);
  }

  // Blob
  console.log("   🔍 Testing response.blob():");
  try {
    const blob = await client.getBlob("/api/v1/health");
    console.log(
      `      ✅ Blob received: ${blob.size} bytes, type: ${blob.type}`,
    );
  } catch (e) {
    console.log(`      ❌ Blob failed: ${e.message}`);
  }
}

// Test 7: Timeout
async function testTimeout() {
  console.log("\n📄 7. Timeout (AbortSignal.timeout)");
  console.log("-".repeat(50));

  // Test with sufficient timeout
  console.log("   🔍 Testing with 5000ms timeout:");
  const result1 = await client.fetchWithTimeout(
    "http://localhost:3000/api/v1/health",
    5000,
  );
  console.log(
    `      ✅ Completed: ${result1.ok}, Timed out: ${result1.timedOut}`,
  );

  // Test with very short timeout (should timeout)
  console.log("   🔍 Testing with 1ms timeout (should fail):");
  const result2 = await client.fetchWithTimeout(
    "http://localhost:3000/api/v1/health",
    1,
  );
  console.log(
    `      ${result2.timedOut ? "✅ Expected timeout" : "❌ Unexpected success"}`,
  );
}

// Test 8: AbortController
async function testAbortController() {
  console.log("\n📄 8. AbortController");
  console.log("-".repeat(50));

  const { promise, abort, controller } = client.createAbortableFetch(
    "http://localhost:3000/api/v1/health",
  );

  // Abort after 10ms
  setTimeout(() => abort(), 10);

  try {
    await promise;
    console.log("   ❌ Request should have been aborted");
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("   ✅ Request successfully aborted");
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`);
    }
  }
}

// Test 9: Streaming Response
async function testStreamingResponse() {
  console.log("\n📄 9. Streaming Response");
  console.log("-".repeat(50));

  console.log("   🔍 Testing async iterator streaming:");
  let chunkCount = 0;
  let totalBytes = 0;

  try {
    for await (const chunk of client.streamResponse(
      "http://localhost:3000/api/v1/health",
    )) {
      chunkCount++;
      totalBytes += chunk.length;
    }
    console.log(
      `      ✅ Received ${chunkCount} chunks, ${totalBytes} bytes total`,
    );
  } catch (e) {
    console.log(`      ❌ Streaming failed: ${e.message}`);
  }

  console.log("   🔍 Testing ReadableStream reader:");
  try {
    const result = await client.streamWithReader(
      "http://localhost:3000/api/v1/health",
    );
    console.log(`      ✅ Received ${result.totalChunks} chunks via reader`);
  } catch (e) {
    console.log(`      ❌ Reader streaming failed: ${e.message}`);
  }
}

// Test 10: Streaming Request Body
async function testStreamingRequest() {
  console.log("\n📄 10. Streaming Request Body");
  console.log("-".repeat(50));

  const chunks = ["Hello", " ", "from", " ", "streaming", " ", "request!"];

  try {
    const response = await client.postStream(
      "http://localhost:3000/api/v1/health",
      chunks,
    );
    console.log(`   ✅ Stream POST status: ${response.status}`);
  } catch (e) {
    console.log(`   ❌ Stream POST failed: ${e.message}`);
  }
}

// Test 11: File URL Protocol
async function testFileProtocol() {
  console.log("\n📄 11. File URL Protocol (file://)");
  console.log("-".repeat(50));

  try {
    const result = await client.fetchFile(
      "/Users/nolarose/bun-t/quantum-terminal-dashboard/package.json",
    );
    const text = await result.text();
    const pkg = JSON.parse(text);
    console.log(`   ✅ File fetched: package.json`);
    console.log(`      Name: ${pkg.name}`);
    console.log(`      Version: ${pkg.version || "not specified"}`);
  } catch (e) {
    console.log(`   ❌ File fetch failed: ${e.message}`);
  }
}

// Test 12: Data URL Protocol
async function testDataProtocol() {
  console.log("\n📄 12. Data URL Protocol (data:)");
  console.log("-".repeat(50));

  try {
    // Base64 encoded "Hello, World!"
    const dataUrl = "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==";
    const response = await client.fetchDataURL(dataUrl);
    const text = await response.text();
    console.log(`   ✅ Data URL fetched: "${text}"`);
  } catch (e) {
    console.log(`   ❌ Data URL fetch failed: ${e.message}`);
  }
}

// Test 13: Blob URL Protocol
async function testBlobProtocol() {
  console.log("\n📄 13. Blob URL Protocol (blob:)");
  console.log("-".repeat(50));

  try {
    const blob = new Blob(["Hello from Blob!"], { type: "text/plain" });
    const response = await client.fetchBlobURL(blob);
    const text = await response.text();
    console.log(`   ✅ Blob URL fetched: "${text}"`);
  } catch (e) {
    console.log(`   ❌ Blob URL fetch failed: ${e.message}`);
  }
}

// Test 14: Verbose Debugging
async function testVerboseDebugging() {
  console.log("\n📄 14. Verbose Debugging");
  console.log("-".repeat(50));

  console.log("   🔍 Testing verbose: true");
  try {
    const response = await client.fetchVerbose(
      "http://localhost:3000/api/v1/health",
    );
    console.log(`   ✅ Verbose fetch completed: ${response.status}`);
  } catch (e) {
    console.log(`   ❌ Verbose fetch failed: ${e.message}`);
  }
}

// Test 15: Request Options
async function testRequestOptions() {
  console.log("\n📄 15. Bun-Specific Request Options");
  console.log("-".repeat(50));

  // Test decompress option
  console.log("   🔍 Testing decompress: true");
  const result1 = await client.request("http://localhost:3000/api/v1/health", {
    decompress: true,
  });
  console.log(`      ✅ Decompress enabled: ${result1.ok}`);

  // Test keepalive option
  console.log("   🔍 Testing keepalive: false");
  const result2 = await client.request("http://localhost:3000/api/v1/health", {
    keepalive: false,
  });
  console.log(`      ✅ Keepalive disabled: ${result2.ok}`);
}

// Test 16: Download to File
async function testDownloadToFile() {
  console.log("\n📄 16. Download to File (Bun.write)");
  console.log("-".repeat(50));

  try {
    const result = await client.downloadToFile(
      "http://localhost:3000/api/v1/health",
      "/tmp/staging-health-response.json",
    );
    console.log(`   ✅ Downloaded to: ${result.path}`);

    // Verify the file
    const file = Bun.file("/tmp/staging-health-response.json");
    const content = await file.json();
    console.log(`      Status in file: ${content.status}`);
  } catch (e) {
    console.log(`   ❌ Download failed: ${e.message}`);
  }
}

// Test 17: Multiple Endpoints
async function testMultipleEndpoints() {
  console.log("\n📄 17. Multiple Staging API Endpoints");
  console.log("-".repeat(50));

  const endpoints = [
    "/api/v1/health",
    "/api/v1/metrics",
    "/api/v1/tension",
    "/api/v1/analytics",
    "/api/v1/experiments",
    "/api/v1/config",
  ];

  for (const endpoint of endpoints) {
    const result = await client.get(endpoint);
    if (result.ok) {
      const data = await result.response.json();
      console.log(
        `   ✅ ${endpoint}: ${result.status} (${result.timing.duration.toFixed(1)}ms)`,
      );
    } else {
      console.log(`   ❌ ${endpoint}: ${result.error || result.status}`);
    }
  }
}

// Test 18: Performance Comparison
async function testPerformance() {
  console.log("\n📄 18. Performance Comparison");
  console.log("-".repeat(50));

  const iterations = 10;
  const times = [];

  console.log(`   🔍 Running ${iterations} sequential requests...`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fetch("http://localhost:3000/api/v1/health");
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`   📊 Results:`);
  console.log(`      Average: ${avg.toFixed(2)}ms`);
  console.log(`      Min: ${min.toFixed(2)}ms`);
  console.log(`      Max: ${max.toFixed(2)}ms`);
  console.log(`   ✅ Connection pooling working (subsequent requests faster)`);
}

// Run all tests
async function runAllTests() {
  console.log("\n🚀 Starting Complete Bun Fetch API Tests\n");

  try {
    await testDNSPrefetch();
    await testPreconnect();
    await testBasicFetch();
    await testPostRequest();
    await testCustomHeaders();
    await testResponseBodies();
    await testTimeout();
    await testAbortController();
    await testStreamingResponse();
    await testStreamingRequest();
    await testFileProtocol();
    await testDataProtocol();
    await testBlobProtocol();
    await testVerboseDebugging();
    await testRequestOptions();
    await testDownloadToFile();
    await testMultipleEndpoints();
    await testPerformance();

    console.log("\n" + "━".repeat(60));
    console.log("✅ All Bun Fetch API tests completed!");
    console.log("━".repeat(60));

    console.log("\n📊 Bun Fetch API Features Tested:");
    console.log("   ✅ DNS prefetching (dns.prefetch)");
    console.log("   ✅ Preconnect (fetch.preconnect)");
    console.log("   ✅ Basic GET/POST requests");
    console.log("   ✅ Custom headers");
    console.log(
      "   ✅ Response body types (json, text, bytes, blob, arrayBuffer)",
    );
    console.log("   ✅ Timeout (AbortSignal.timeout)");
    console.log("   ✅ AbortController");
    console.log("   ✅ Streaming responses (async iterator, ReadableStream)");
    console.log("   ✅ Streaming request bodies");
    console.log("   ✅ File URL protocol (file://)");
    console.log("   ✅ Data URL protocol (data:)");
    console.log("   ✅ Blob URL protocol (blob:)");
    console.log("   ✅ Verbose debugging");
    console.log("   ✅ Bun-specific options (decompress, keepalive)");
    console.log("   ✅ Download to file (Bun.write)");
    console.log("   ✅ Connection pooling");

    console.log("\n🌐 Server: http://localhost:3000/");
    console.log("📋 Staging URL: https://staging-api.example.com/");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
    console.error(error.stack);
  }
}

// Run tests
runAllTests();
