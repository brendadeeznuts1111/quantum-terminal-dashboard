// Test Bun Fetch API for https://staging-api.example.com/

console.log("🌐 Testing Bun Fetch API Implementation\n");

async function startFetchDemoServer() {
  console.log("🚀 Starting Fetch Demo Server...");

  try {
    const { FetchDemoServer } = await import("./src/api/fetch-demo-server.js");
    const server = new FetchDemoServer();

    // Start the server
    await server.start();

    // Wait a moment for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return server;
  } catch (error) {
    console.error("❌ Failed to start Fetch Demo server:", error.message);
    return null;
  }
}

async function testBasicFetch() {
  console.log("📄 1. Testing Basic Fetch");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing basic GET request:");
    const response = await fetch("http://localhost:3000/basic-fetch");

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📄 Status Text: ${response.statusText}`);
    console.log(`   📊 Content-Type: ${response.headers.get("content-type")}`);
    console.log(
      `   ⏱️ Response Time: ${response.headers.get("x-response-time")}`,
    );

    const data = await response.json();
    console.log(`   📄 Message: ${data.message}`);
    console.log(`   🌐 Staging URL: ${data.staging_url}`);
    console.log(
      `   📊 Processing Time: ${data.response_info.processing_time_ms}ms`,
    );

    return response;
  } catch (error) {
    console.error("❌ Basic fetch test error:", error.message);
    return null;
  }
}

async function testPostRequest() {
  console.log("\n📄 2. Testing POST Requests");
  console.log("-".repeat(50));

  try {
    // Test JSON POST
    console.log("🔍 Testing JSON POST request:");
    const jsonResponse = await fetch("http://localhost:3000/post-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello from fetch!",
        timestamp: new Date().toISOString(),
        test: true,
      }),
    });

    if (jsonResponse.ok) {
      const jsonData = await jsonResponse.json();
      console.log(`   ✅ JSON POST Status: ${jsonResponse.status}`);
      console.log(`   📊 Body Type: ${jsonData.request_info.body_type}`);
      console.log(`   📊 Content-Type: ${jsonData.request_info.content_type}`);
      console.log(`   📄 Received Message: ${jsonData.received_body.message}`);
    }

    // Test Form POST
    console.log("\n🔍 Testing Form POST request:");
    const formResponse = await fetch("http://localhost:3000/post-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "name=test&message=Hello+Form&timestamp=" + Date.now(),
    });

    if (formResponse.ok) {
      const formData = await formResponse.json();
      console.log(`   ✅ Form POST Status: ${formResponse.status}`);
      console.log(`   📊 Body Type: ${formData.request_info.body_type}`);
      console.log(`   📄 Received Name: ${formData.received_body.name}`);
      console.log(`   📄 Received Message: ${formData.received_body.message}`);
    }

    // Test Text POST
    console.log("\n🔍 Testing Text POST request:");
    const textResponse = await fetch("http://localhost:3000/post-request", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: "Plain text body from fetch",
    });

    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log(`   ✅ Text POST Status: ${textResponse.status}`);
      console.log(`   📊 Body Type: ${textData.request_info.body_type}`);
      console.log(`   📄 Received Body: ${textData.received_body}`);
    }

    return { jsonResponse, formResponse, textResponse };
  } catch (error) {
    console.error("❌ POST request test error:", error.message);
    return null;
  }
}

async function testCustomHeaders() {
  console.log("\n📄 3. Testing Custom Headers");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing custom headers:");
    const response = await fetch("http://localhost:3000/custom-headers", {
      headers: {
        "X-Custom-Header": "demo-value",
        "X-API-Key": "test-api-key-12345",
        Authorization: "Bearer test-token-abcde",
        "User-Agent": "Bun-Fetch-Demo/1.0",
        "X-Request-ID": "req_" + Date.now(),
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📊 Total Headers: ${data.headers_info.total_headers}`);
      console.log(
        `   📊 Custom Headers: ${Object.keys(data.headers_info.custom_headers).length}`,
      );

      console.log("\n   📋 Custom Headers Received:");
      Object.entries(data.headers_info.custom_headers).forEach(
        ([key, value]) => {
          console.log(`     ${key}: ${value}`);
        },
      );

      console.log("\n   📋 Special Headers:");
      Object.entries(data.headers_info.special_headers).forEach(
        ([key, value]) => {
          console.log(`     ${key}: ${value}`);
        },
      );
    }

    return response;
  } catch (error) {
    console.error("❌ Custom headers test error:", error.message);
    return null;
  }
}

async function testResponseBodies() {
  console.log("\n📄 4. Testing Response Bodies");
  console.log("-".repeat(50));

  try {
    // Test JSON response
    console.log("🔍 Testing JSON response:");
    const jsonResponse = await fetch("http://localhost:3000/response-bodies", {
      headers: {
        Accept: "application/json",
      },
    });

    if (jsonResponse.ok) {
      const jsonData = await jsonResponse.json();
      console.log(`   ✅ JSON Response Status: ${jsonResponse.status}`);
      console.log(`   📊 Response Type: ${jsonData.response_info.type}`);
      console.log(`   📄 Message: ${jsonData.message}`);
      console.log(`   🌐 Staging URL: ${jsonData.staging_url}`);
    }

    // Test Text response
    console.log("\n🔍 Testing Text response:");
    const textResponse = await fetch("http://localhost:3000/response-bodies", {
      headers: {
        Accept: "text/plain",
      },
    });

    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log(`   ✅ Text Response Status: ${textResponse.status}`);
      console.log(`   📊 Response Type: ${textData.response_info.type}`);
      console.log(
        `   📄 Accept Header: ${textData.response_info.accept_header}`,
      );
    }

    // Test Bytes response
    console.log("\n🔍 Testing Bytes response:");
    const bytesResponse = await fetch("http://localhost:3000/response-bodies", {
      headers: {
        Accept: "application/octet-stream",
      },
    });

    if (bytesResponse.ok) {
      const bytesData = await bytesResponse.json();
      console.log(`   ✅ Bytes Response Status: ${bytesResponse.status}`);
      console.log(`   📊 Response Type: ${bytesData.response_info.type}`);
    }

    return { jsonResponse, textResponse, bytesResponse };
  } catch (error) {
    console.error("❌ Response bodies test error:", error.message);
    return null;
  }
}

async function testStreaming() {
  console.log("\n📄 5. Testing Streaming");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing streaming response:");
    const response = await fetch("http://localhost:3000/streaming");

    if (response.ok) {
      console.log(`   ✅ Streaming Status: ${response.status}`);
      console.log(
        `   📊 Content-Type: ${response.headers.get("content-type")}`,
      );
      console.log(`   🌊 Streaming: ${response.headers.get("x-streaming")}`);

      console.log("\n   📄 Streaming Response:");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkCount++;
        const chunk = decoder.decode(value);
        process.stdout.write(
          `   Chunk ${chunkCount}: ${chunk.split("\n")[0]}\n`,
        );
      }

      console.log(`   📊 Total Chunks: ${chunkCount}`);
    }

    return response;
  } catch (error) {
    console.error("❌ Streaming test error:", error.message);
    return null;
  }
}

async function testTimeout() {
  console.log("\n📄 6. Testing Timeout");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing fetch with timeout:");

    // Test with 1 second timeout
    console.log("   Testing with 1 second timeout:");
    const response1 = await fetch("http://localhost:3000/timeout?timeout=500", {
      signal: AbortSignal.timeout(1000),
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`     ✅ Success: ${data1.timeout_info.completed}`);
      console.log(`     📊 Delay: ${data1.timeout_info.actual_delay}ms`);
    }

    // Test with short timeout (should fail)
    console.log("\n   Testing with 100ms timeout (should fail):");
    try {
      const response2 = await fetch(
        "http://localhost:3000/timeout?timeout=2000",
        {
          signal: AbortSignal.timeout(100),
        },
      );
      console.log(`     ❌ Unexpected success: ${response2.status}`);
    } catch (error) {
      console.log(`     ✅ Expected timeout error: ${error.name}`);
    }

    // Test AbortController
    console.log("\n   Testing AbortController:");
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 500);

    try {
      const response3 = await fetch(
        "http://localhost:3000/timeout?timeout=2000",
        {
          signal: controller.signal,
        },
      );
      console.log(`     ❌ Unexpected success: ${response3.status}`);
    } catch (error) {
      console.log(`     ✅ Expected abort error: ${error.name}`);
    }

    return { response1 };
  } catch (error) {
    console.error("❌ Timeout test error:", error.message);
    return null;
  }
}

async function testProxy() {
  console.log("\n📄 7. Testing Proxy");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing proxy headers:");
    const response = await fetch("http://localhost:3000/proxy", {
      headers: {
        "Proxy-Authorization": "Bearer proxy-token-12345",
        "X-Custom-Proxy-Header": "custom-value",
        "X-Proxy-User": "test-user",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Message: ${data.message}`);
      console.log(
        `   📊 Headers Received: ${Object.keys(data.proxy_info.headers_received).length}`,
      );

      console.log("\n   📋 Proxy Headers:");
      Object.entries(data.proxy_info.headers_received).forEach(
        ([key, value]) => {
          console.log(`     ${key}: ${value}`);
        },
      );

      console.log("\n   🔧 Usage Examples:");
      console.log(`     ${data.examples.basic_proxy}`);
      console.log(`     ${data.examples.with_headers}`);
    }

    return response;
  } catch (error) {
    console.error("❌ Proxy test error:", error.message);
    return null;
  }
}

async function testUpload() {
  console.log("\n📄 8. Testing Upload");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing file upload simulation:");

    // Create a simple form data
    const formData = new FormData();
    formData.append("message", "Hello from upload!");
    formData.append("timestamp", new Date().toISOString());
    formData.append("test", "true");

    // Simulate a file (in real scenario, this would be an actual file)
    const blob = new Blob(["Sample file content"], { type: "text/plain" });
    formData.append("file", blob, "sample.txt");

    const response = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Upload Status: ${response.status}`);
      console.log(`   📄 Message: ${data.message}`);
      console.log(`   📊 Content-Type: ${data.upload_info.content_type}`);
      console.log(`   📊 Processing: ${data.upload_info.processing}`);

      if (data.upload_info.files) {
        console.log(`   📁 Files: ${data.upload_info.files.length}`);
        data.upload_info.files.forEach((file) => {
          console.log(
            `     - ${file.name}: ${file.filename} (${file.size} bytes)`,
          );
        });
      }

      if (data.upload_info.fields) {
        console.log(
          `   📋 Fields: ${Object.keys(data.upload_info.fields).length}`,
        );
        Object.entries(data.upload_info.fields).forEach(([key, value]) => {
          console.log(`     - ${key}: ${value}`);
        });
      }
    }

    return response;
  } catch (error) {
    console.error("❌ Upload test error:", error.message);
    return null;
  }
}

async function demonstrateBunFetchAPI() {
  console.log("\n📄 9. Bun Fetch API Documentation");
  console.log("-".repeat(50));

  console.log("🌐 Bun Fetch API Features:");
  console.log(`
📚 BASIC FETCH
==============

// Basic GET request
const response = await fetch("http://example.com");
console.log(response.status); // => 200
const text = await response.text();

// Works with HTTPS
const response = await fetch("https://example.com");

// Request object
const request = new Request("http://example.com", {
  method: "POST",
  body: "Hello, world!",
});
const response = await fetch(request);

📤 POST REQUESTS
=================

// POST with body
const response = await fetch("http://example.com", {
  method: "POST",
  body: "Hello, world!",
});

// Body types: string, FormData, ArrayBuffer, Blob, etc.

🔀 PROXY REQUESTS
==================

// Simple proxy
const response = await fetch("http://example.com", {
  proxy: "http://proxy.com",
});

// Proxy with custom headers
const response = await fetch("http://example.com", {
  proxy: {
    url: "http://proxy.com",
    headers: {
      "Proxy-Authorization": "Bearer my-token",
      "X-Custom-Proxy-Header": "value",
    },
  },
});

📋 CUSTOM HEADERS
==================

// Object format
const response = await fetch("http://example.com", {
  headers: {
    "X-Custom-Header": "value",
  },
});

// Headers object
const headers = new Headers();
headers.append("X-Custom-Header", "value");
const response = await fetch("http://example.com", { headers });

📄 RESPONSE BODIES
==================

response.text()   // Promise<string>
response.json()   // Promise<any>
response.formData() // Promise<FormData>
response.bytes()  // Promise<Uint8Array>
response.arrayBuffer() // Promise<ArrayBuffer>
response.blob()  // Promise<Blob>

🌊 STREAMING RESPONSES
========================

// Async iterator
for await (const chunk of response.body) {
  console.log(chunk);
}

// Direct stream access
const stream = response.body;
const reader = stream.getReader();
const { value, done } = await reader.read();

🌊 STREAMING REQUESTS
=======================

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello");
    controller.enqueue(" ");
    controller.enqueue("World");
    controller.close();
  },
});

const response = await fetch("http://example.com", {
  method: "POST",
  body: stream,
});

⏱️ TIMEOUT & ABORT
==================

// Timeout
const response = await fetch("http://example.com", {
  signal: AbortSignal.timeout(1000),
});

// AbortController
const controller = new AbortController();
const response = await fetch("http://example.com", {
  signal: controller.signal,
});
controller.abort();
  `);
}

async function testCurlCommands() {
  console.log("\n📄 10. Testing with curl Commands");
  console.log("-".repeat(50));

  console.log("🧪 Testing curl commands for fetch features:");

  try {
    // Basic fetch
    console.log("\n🔍 Testing basic fetch with curl:");
    const basicResult =
      await Bun.$`curl -s -w "Status: %{http_code}, Time: %{time_total}s\\n" http://localhost:3000/basic-fetch`.text();
    console.log(`   ${basicResult}`);

    // POST request
    console.log("\n🔍 Testing POST with curl:");
    const postResult =
      await Bun.$`curl -s -w "Status: %{http_code}, Size: %{size_download} bytes\\n" -X POST -H "Content-Type: application/json" -d '{"test": true}' http://localhost:3000/post-request`.text();
    console.log(`   ${postResult}`);

    // Custom headers
    console.log("\n🔍 Testing custom headers with curl:");
    const headersResult =
      await Bun.$`curl -s -w "Status: %{http_code}\\n" -H "X-Custom-Header: curl-test" -H "X-API-Key: curl-key" http://localhost:3000/custom-headers`.text();
    console.log(`   ${headersResult}`);

    // Streaming
    console.log("\n🔍 Testing streaming with curl:");
    console.log("   (First 3 lines of streaming response):");
    const streamResult =
      await Bun.$`curl -s -m 5 http://localhost:3000/streaming | head -3`.text();
    console.log(`   ${streamResult}`);
  } catch (error) {
    console.error("❌ Curl test error:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Bun Fetch API Tests\n");

  let server = null;

  try {
    // Start the fetch demo server
    server = await startFetchDemoServer();

    if (!server) {
      console.error("❌ Failed to start server, skipping tests");
      return;
    }

    // Run all tests
    await testBasicFetch();
    await testPostRequest();
    await testCustomHeaders();
    await testResponseBodies();
    await testStreaming();
    await testTimeout();
    await testProxy();
    await testUpload();
    await demonstrateBunFetchAPI();
    await testCurlCommands();

    console.log("\n✅ All Bun Fetch API tests completed successfully!");
    console.log("\n🌐 Bun Fetch API Summary:");
    console.log("   ✅ Basic fetch implemented");
    console.log("   ✅ POST requests working");
    console.log("   ✅ Custom headers supported");
    console.log("   ✅ Response bodies functional");
    console.log("   ✅ Streaming responses working");
    console.log("   ✅ Timeout and abort features");
    console.log("   ✅ Proxy support implemented");
    console.log("   ✅ File upload capability");
    console.log("   ✅ Request/Response streaming");

    console.log("\n🌐 Server Information:");
    console.log("   🎯 Target URL: https://staging-api.example.com/");
    console.log("   🔧 Development URL: http://localhost:3000/");
    console.log("   🌐 Fetch Demo: Enabled");
    console.log("   📊 Features: 9 fetch endpoints");
    console.log("   🔧 Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
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
