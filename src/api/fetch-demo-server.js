// [DOMAIN][API][FETCH][HSL:200,70%,85%][META:{BUN-FETCH}][CLASS:FetchDemoServer]{BUN-API}

/**
 * Fetch Demo Server for https://staging-api.example.com/
 * Demonstrates Bun's complete fetch API with all features
 */

import { CompleteEnvironmentManager } from "../config/complete-environment-manager.js";

class FetchDemoServer {
  constructor() {
    this.configManager = new CompleteEnvironmentManager("staging");
    this.server = null;
    this.setupRoutes();
  }

  /**
   * Setup routes with fetch demonstration
   */
  setupRoutes() {
    console.log("🌐 Setting up Fetch Demo Server...");
    console.log("📋 Target URL: https://staging-api.example.com/");

    this.fetchHandler = async (req) => {
      const url = new URL(req.url);

      // Add CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-API-Key, Proxy-Authorization, X-Custom-Header",
        "Access-Control-Expose-Headers": "Content-Length, X-Response-Time",
        "X-Staging-Environment": "true",
        "X-Fetch-Demo": "true",
      };

      // Handle preflight OPTIONS
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 200,
          headers: corsHeaders,
        });
      }

      try {
        // Route handling with fetch features
        if (url.pathname === "/") {
          return this.handleRoot(req, corsHeaders);
        }

        if (url.pathname === "/basic-fetch") {
          return this.handleBasicFetch(req, corsHeaders);
        }

        if (url.pathname === "/post-request") {
          return this.handlePostRequest(req, corsHeaders);
        }

        if (url.pathname === "/custom-headers") {
          return this.handleCustomHeaders(req, corsHeaders);
        }

        if (url.pathname === "/response-bodies") {
          return this.handleResponseBodies(req, corsHeaders);
        }

        if (url.pathname === "/streaming") {
          return this.handleStreaming(req, corsHeaders);
        }

        if (url.pathname === "/timeout") {
          return this.handleTimeout(req, corsHeaders);
        }

        if (url.pathname === "/proxy") {
          return this.handleProxy(req, corsHeaders);
        }

        if (url.pathname === "/abort") {
          return this.handleAbort(req, corsHeaders);
        }

        if (url.pathname === "/upload") {
          return this.handleUpload(req, corsHeaders);
        }

        if (url.pathname === "/api/v1/health") {
          return this.handleHealth(req, corsHeaders);
        }

        // 404
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: `Route ${req.method} ${url.pathname} not found`,
            staging_url: "https://staging-api.example.com",
            fetch_demo: true,
            available_endpoints: [
              "/basic-fetch",
              "/post-request",
              "/custom-headers",
              "/response-bodies",
              "/streaming",
              "/timeout",
              "/proxy",
              "/abort",
              "/upload",
            ],
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        console.error("Fetch Demo Server Error:", error);
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: error.message,
            timestamp: new Date().toISOString(),
            fetch_demo: true,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    };
  }

  /**
   * Handle root route with fetch demonstration
   */
  async handleRoot(req, corsHeaders) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Fetch Demo - Staging API</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 2.5rem; }
        .header p { color: #64748b; margin: 10px 0 0 0; font-size: 1.1rem; }
        .url-display { background: #1e293b; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 1.2rem; margin: 20px 0; }
        .section { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .section h2 { color: #1e40af; margin-top: 0; }
        .endpoint { background: #f1f5f9; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .get { background: #10b981; color: white; }
        .post { background: #f59e0b; color: white; }
        .url { font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
        .code { background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; overflow-x: auto; }
        .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
        .button:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Fetch Demo Server</h1>
            <p>Bun Fetch API for https://staging-api.example.com/</p>
            <div class="url-display">https://staging-api.example.com/</div>
        </div>

        <div class="section">
            <h2>📡 Fetch API Endpoints</h2>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/basic-fetch</span>
                <p>Demonstrates basic fetch with status codes and response handling</p>
            </div>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="url">/post-request</span>
                <p>Shows POST requests with different body types (string, JSON, FormData)</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/custom-headers</span>
                <p>Demonstrates custom headers and Headers object usage</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/response-bodies</span>
                <p>Shows different response body types (text, JSON, bytes, blob)</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/streaming</span>
                <p>Demonstrates streaming request and response bodies</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/timeout</span>
                <p>Shows fetch with timeout using AbortSignal.timeout</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/proxy</span>
                <p>Demonstrates proxy requests with custom proxy headers</p>
            </div>
            
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="url">/abort</span>
                <p>Shows request cancellation with AbortController</p>
            </div>
            
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="url">/upload</span>
                <p>Demonstrates file upload with streaming</p>
            </div>
        </div>

        <div class="section">
            <h2>🔧 Basic Fetch Examples</h2>
            <div class="code">
// Basic GET request
const response = await fetch("http://example.com");
console.log(response.status); // => 200
const text = await response.text();

// POST request with body
const response = await fetch("http://example.com", {
  method: "POST",
  body: "Hello, world!",
});

// Custom headers
const response = await fetch("http://example.com", {
  headers: {
    "X-Custom-Header": "value",
  },
});

// With timeout
const response = await fetch("http://example.com", {
  signal: AbortSignal.timeout(1000),
});
            </div>
        </div>

        <div class="section">
            <h2>🧪 Testing with curl</h2>
            <div class="code">
# Basic fetch
curl -s "http://api.example.com/basic-fetch"

# POST request
curl -X POST -H "Content-Type: application/json" \\
  -d '{"message": "Hello"}' \\
  "http://api.example.com/post-request"

# Custom headers
curl -H "X-Custom-Header: test-value" \\
  "http://api.example.com/custom-headers"

# Streaming response
curl -N "http://api.example.com/streaming"

# With timeout (client-side)
curl -m 5 "http://api.example.com/timeout"
            </div>
        </div>

        <div class="section">
            <h3>🚀 Quick Test Links</h3>
            <a href="/basic-fetch" class="button">📡 Basic Fetch</a>
            <a href="/custom-headers" class="button">📋 Custom Headers</a>
            <a href="/response-bodies" class="button">📄 Response Bodies</a>
            <a href="/streaming" class="button">🌊 Streaming</a>
            <a href="/timeout" class="button">⏱️ Timeout</a>
            <a href="/api/v1/health" class="button">❤️ Health</a>
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
        "X-Fetch-Demo-URL": "https://staging-api.example.com/",
      },
    });
  }

  /**
   * Handle basic fetch demonstration
   */
  async handleBasicFetch(req, corsHeaders) {
    const startTime = Date.now();

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100));

    const basicResponse = {
      message: "Basic fetch demonstration",
      staging_url: "https://staging-api.example.com",
      request_info: {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers),
        timestamp: new Date().toISOString(),
      },
      response_info: {
        status: 200,
        status_text: "OK",
        content_type: "application/json",
        processing_time_ms: Date.now() - startTime,
      },
      fetch_features: {
        basic_request: true,
        status_codes: true,
        response_handling: true,
        timing: true,
      },
    };

    return new Response(JSON.stringify(basicResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Response-Time": `${Date.now() - startTime}ms`,
      },
    });
  }

  /**
   * Handle POST request demonstration
   */
  async handlePostRequest(req, corsHeaders) {
    const contentType = req.headers.get("content-type") || "";
    let body = null;
    let bodyType = "unknown";

    try {
      if (contentType.includes("application/json")) {
        body = await req.json();
        bodyType = "json";
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        body = Object.fromEntries(new URLSearchParams(text));
        bodyType = "form-urlencoded";
      } else if (contentType.includes("multipart/form-data")) {
        body = await req.formData();
        bodyType = "form-data";
      } else {
        body = await req.text();
        bodyType = "text";
      }
    } catch (error) {
      body = `Error parsing body: ${error.message}`;
      bodyType = "error";
    }

    const postResponse = {
      message: "POST request demonstration",
      staging_url: "https://staging-api.example.com",
      request_info: {
        method: req.method,
        content_type: contentType,
        body_type: bodyType,
        body_size: req.headers.get("content-length") || "unknown",
      },
      received_body: body,
      fetch_features: {
        post_requests: true,
        body_parsing: true,
        content_types: ["json", "form-urlencoded", "form-data", "text"],
      },
    };

    return new Response(JSON.stringify(postResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Handle custom headers demonstration
   */
  async handleCustomHeaders(req, corsHeaders) {
    const customHeaders = {};
    const allHeaders = {};

    // Extract all headers
    for (const [key, value] of req.headers) {
      allHeaders[key] = value;
      if (key.startsWith("x-") || key.startsWith("custom-")) {
        customHeaders[key] = value;
      }
    }

    const headersResponse = {
      message: "Custom headers demonstration",
      staging_url: "https://staging-api.example.com",
      headers_info: {
        total_headers: Object.keys(allHeaders).length,
        custom_headers: customHeaders,
        all_headers: allHeaders,
        special_headers: {
          authorization: req.headers.get("authorization") || "not set",
          "x-api-key": req.headers.get("x-api-key") || "not set",
          "x-custom-header": req.headers.get("x-custom-header") || "not set",
          "user-agent": req.headers.get("user-agent") || "not set",
        },
      },
      fetch_features: {
        custom_headers: true,
        headers_object: true,
        header_iteration: true,
      },
    };

    return new Response(JSON.stringify(headersResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Custom-Response-Header": "demo-value",
      },
    });
  }

  /**
   * Handle response bodies demonstration
   */
  async handleResponseBodies(req, corsHeaders) {
    const acceptHeader = req.headers.get("accept") || "";

    let response;
    let responseType = "json";

    if (acceptHeader.includes("text/plain")) {
      response = "This is a plain text response from the staging API server.";
      responseType = "text";
    } else if (acceptHeader.includes("application/octet-stream")) {
      const encoder = new TextEncoder();
      const bytes = encoder.encode("Binary data: " + new Date().toISOString());
      response = bytes;
      responseType = "bytes";
    } else if (acceptHeader.includes("application/xml")) {
      response =
        '<?xml version="1.0"?><response><message>XML response</message><timestamp>' +
        new Date().toISOString() +
        "</timestamp></response>";
      responseType = "xml";
    } else {
      // Default to JSON
      response = {
        message: "JSON response from staging API",
        staging_url: "https://staging-api.example.com",
        response_types: ["json", "text", "bytes", "xml"],
        timestamp: new Date().toISOString(),
        random_data: Math.random().toString(36),
      };
      responseType = "json";
    }

    const bodyResponse = {
      message: "Response bodies demonstration",
      staging_url: "https://staging-api.example.com",
      response_info: {
        type: responseType,
        accept_header: acceptHeader,
        content_negotiation: true,
      },
      fetch_features: {
        response_text: true,
        response_json: true,
        response_bytes: true,
        response_blob: true,
        response_array_buffer: true,
      },
    };

    return new Response(JSON.stringify(bodyResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Handle streaming demonstration
   */
  async handleStreaming(req, corsHeaders) {
    const stream = new ReadableStream({
      start(controller) {
        const data = [
          "🌊 Streaming response from staging API\n",
          "📡 URL: https://staging-api.example.com/\n",
          "⏰ Time: " + new Date().toISOString() + "\n",
          "🔢 Chunk 1 of 5\n",
          "📊 Data: " + Math.random().toString(36) + "\n",
          "🔢 Chunk 2 of 5\n",
          "🚀 Status: Streaming active\n",
          "📊 Data: " + Math.random().toString(36) + "\n",
          "🔢 Chunk 3 of 5\n",
          "🌐 Environment: staging\n",
          "📊 Data: " + Math.random().toString(36) + "\n",
          "🔢 Chunk 4 of 5\n",
          "⚡ Performance: Real-time streaming\n",
          "📊 Data: " + Math.random().toString(36) + "\n",
          "🔢 Chunk 5 of 5\n",
          "✅ Streaming complete\n",
        ];

        let index = 0;
        const interval = setInterval(() => {
          if (index < data.length) {
            controller.enqueue(new TextEncoder().encode(data[index]));
            index++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 200);
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
        "X-Streaming": "true",
      },
    });
  }

  /**
   * Handle timeout demonstration
   */
  async handleTimeout(req, corsHeaders) {
    const timeoutParam = new URL(req.url).searchParams.get("timeout") || "2000";
    const timeoutMs = parseInt(timeoutParam);

    // Simulate a slow operation
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(timeoutMs, 5000)),
    );

    const timeoutResponse = {
      message: "Timeout demonstration",
      staging_url: "https://staging-api.example.com",
      timeout_info: {
        requested_timeout: timeoutMs,
        actual_delay: Math.min(timeoutMs, 5000),
        completed: true,
      },
      fetch_features: {
        timeout: true,
        abort_signal: true,
        signal_timeout: true,
      },
      usage_example: {
        javascript: "await fetch(url, { signal: AbortSignal.timeout(1000) })",
        curl: "curl -m 1 " + req.url,
      },
    };

    return new Response(JSON.stringify(timeoutResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Handle proxy demonstration
   */
  async handleProxy(req, corsHeaders) {
    const proxyHeaders = {};

    // Extract proxy-related headers
    for (const [key, value] of req.headers) {
      if (
        key.toLowerCase().includes("proxy") ||
        key.toLowerCase().includes("authorization")
      ) {
        proxyHeaders[key] = value;
      }
    }

    const proxyResponse = {
      message: "Proxy demonstration",
      staging_url: "https://staging-api.example.com",
      proxy_info: {
        headers_received: proxyHeaders,
        proxy_usage: {
          string_format: 'proxy: "http://proxy.com"',
          object_format: 'proxy: { url: "http://proxy.com", headers: {...} }',
        },
      },
      fetch_features: {
        proxy_support: true,
        custom_proxy_headers: true,
        proxy_authorization: true,
      },
      examples: {
        basic_proxy: 'await fetch(url, { proxy: "http://proxy.com" })',
        with_headers:
          'await fetch(url, { proxy: { url: "http://proxy.com", headers: { "Proxy-Authorization": "Bearer token" } } })',
      },
    };

    return new Response(JSON.stringify(proxyResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Handle abort demonstration
   */
  async handleAbort(req, corsHeaders) {
    const delayParam = new URL(req.url).searchParams.get("delay") || "3000";
    const delayMs = parseInt(delayParam);

    // Simulate a long operation that can be aborted
    const abortResponse = {
      message: "Abort demonstration",
      staging_url: "https://staging-api.example.com",
      abort_info: {
        delay_ms: delayMs,
        abortable: true,
        controller_usage: "new AbortController()",
      },
      fetch_features: {
        abort_controller: true,
        signal_support: true,
        cancellation: true,
      },
      examples: {
        javascript: `
const controller = new AbortController();
const response = await fetch(url, { signal: controller.signal });
controller.abort(); // Cancel the request
        `,
        timeout_abort: `
const response = await fetch(url, { 
  signal: AbortSignal.timeout(1000) 
});
        `,
      },
    };

    // Don't actually wait, just return the response immediately
    return new Response(JSON.stringify(abortResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Handle upload demonstration
   */
  async handleUpload(req, corsHeaders) {
    const contentType = req.headers.get("content-type") || "";
    let uploadInfo = {
      content_type: contentType,
      size: req.headers.get("content-length") || "unknown",
      processing: "streaming",
    };

    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        uploadInfo.files = [];
        uploadInfo.fields = {};

        for (const [key, value] of formData) {
          if (value instanceof File) {
            uploadInfo.files.push({
              name: key,
              filename: value.name,
              size: value.size,
              type: value.type,
            });
          } else {
            uploadInfo.fields[key] = value;
          }
        }
      } else {
        const body = await req.text();
        uploadInfo.body_preview =
          body.substring(0, 200) + (body.length > 200 ? "..." : "");
      }
    } catch (error) {
      uploadInfo.error = error.message;
    }

    const uploadResponse = {
      message: "Upload demonstration",
      staging_url: "https://staging-api.example.com",
      upload_info: uploadInfo,
      fetch_features: {
        file_upload: true,
        form_data: true,
        streaming_upload: true,
        multipart_support: true,
      },
      examples: {
        file_upload: `
const formData = new FormData();
formData.append('file', fileInput.files[0]);
await fetch('/upload', { method: 'POST', body: formData });
        `,
        streaming_upload: `
const stream = new ReadableStream({...});
await fetch('/upload', { method: 'POST', body: stream });
        `,
      },
    };

    return new Response(JSON.stringify(uploadResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Handle health check with fetch info
   */
  async handleHealth(req, corsHeaders) {
    const healthData = {
      status: "healthy",
      environment: "staging",
      staging_url: "https://staging-api.example.com",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      fetch_demo: {
        enabled: true,
        features: [
          "basic_fetch",
          "post_requests",
          "custom_headers",
          "response_bodies",
          "streaming",
          "timeout",
          "proxy",
          "abort",
          "upload",
        ],
        supported_methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        response_types: [
          "json",
          "text",
          "bytes",
          "blob",
          "arrayBuffer",
          "formData",
        ],
      },
      quantum: {
        tension_threshold: this.configManager.get("quantum.tension_threshold"),
        decay_rate: this.configManager.get("quantum.decay_rate"),
        health_check_interval: this.configManager.get(
          "quantum.health_check_interval",
        ),
      },
      features: this.configManager.getFeaturesConfig(),
    };

    return new Response(JSON.stringify(healthData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Fetch-Demo-Endpoint": "/api/v1/health",
      },
    });
  }

  /**
   * Start the fetch demo server
   */
  async start() {
    try {
      this.server = Bun.serve({
        port: 3000,
        hostname: "localhost",
        fetch: this.fetchHandler.bind(this),
        error(error) {
          console.error("Fetch Demo Server error:", error);
          return new Response("Internal Server Error", { status: 500 });
        },
      });

      console.log("🌐 Fetch Demo Server started successfully!");
      console.log(`   Staging URL: https://staging-api.example.com/`);
      console.log(`   Development URL: http://api.example.com/`);
      console.log(`   Environment: ${this.configManager.getEnvironment()}`);
      console.log(`   Fetch Demo: Enabled`);

      console.log("\n🌐 Available Fetch Demo Endpoints:");
      console.log("   🏠 http://api.example.com/ - Fetch demo home");
      console.log("   📡 http://api.example.com/basic-fetch - Basic fetch");
      console.log("   📤 http://api.example.com/post-request - POST requests");
      console.log(
        "   📋 http://api.example.com/custom-headers - Custom headers",
      );
      console.log(
        "   📄 http://api.example.com/response-bodies - Response bodies",
      );
      console.log("   🌊 http://api.example.com/streaming - Streaming");
      console.log("   ⏱️ http://api.example.com/timeout - Timeout demo");
      console.log("   🔀 http://api.example.com/proxy - Proxy demo");
      console.log("   🚫 http://api.example.com/abort - Abort demo");
      console.log("   📤 http://api.example.com/upload - Upload demo");
      console.log(
        "   ❤️ http://api.example.com/api/v1/health - Health with fetch info",
      );

      console.log("\n🧪 Testing with curl:");
      console.log(`# Basic fetch`);
      console.log(`curl -s "http://api.example.com/basic-fetch"`);
      console.log(`# POST request`);
      console.log(
        `curl -X POST -H "Content-Type: application/json" -d '{"test": true}' "http://api.example.com/post-request"`,
      );
      console.log(`# Custom headers`);
      console.log(
        `curl -H "X-Custom-Header: demo" "http://api.example.com/custom-headers"`,
      );
      console.log(`# Streaming response`);
      console.log(`curl -N "http://api.example.com/streaming"`);

      return this.server;
    } catch (error) {
      console.error("❌ Failed to start Fetch Demo server:", error.message);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    if (this.server) {
      console.log("🛑 Stopping Fetch Demo server...");
      this.server.stop();
      console.log("✅ Server stopped successfully");
    }
  }
}

// Create and export server instance
const fetchDemoServer = new FetchDemoServer();

// Auto-start if run directly
if (import.meta.main) {
  fetchDemoServer.start().catch(console.error);
}

export default fetchDemoServer;
export { FetchDemoServer };
