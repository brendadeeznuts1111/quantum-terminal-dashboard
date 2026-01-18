// [DOMAIN][API][STAGING-LOCAL][HSL:200,70%,85%][META:{STAGING-LOCAL}][CLASS:StagingAPILocal]{BUN-API}

/**
 * Local Staging API Server
 * Runs on api.example.com to simulate https://staging-api.example.com/
 *
 * To map staging-api.example.com to localhost, add to /etc/hosts:
 *   127.0.0.1 staging-api.example.com
 *
 * Then access via: https://staging-api.example.com:3000/
 */

import { CompleteEnvironmentManager } from "../config/complete-environment-manager.js";

class StagingAPILocal {
  constructor() {
    this.configManager = new CompleteEnvironmentManager("staging");
    this.server = null;
    this.startTime = Date.now();
  }

  /**
   * Create the fetch handler with all staging API routes
   */
  createFetchHandler() {
    return async (req) => {
      const url = new URL(req.url);
      const startTime = Date.now();

      // Log request matching HAR format
      console.log(
        `📡 ${req.method} ${url.pathname} - ${new Date().toISOString()}`,
      );
      console.log(
        `   User-Agent: ${req.headers.get("user-agent")?.substring(0, 50)}...`,
      );
      console.log(`   sec-ch-ua: ${req.headers.get("sec-ch-ua")}`);

      // CORS headers matching Chrome expectations
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-API-Key, Upgrade-Insecure-Requests, User-Agent, sec-ch-ua, sec-ch-ua-mobile, sec-ch-ua-platform",
        "Access-Control-Max-Age": "86400",
        "X-Staging-Environment": "true",
        "X-Response-Time": `${Date.now() - startTime}ms`,
      };

      // Handle preflight OPTIONS
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      try {
        // Route handling
        switch (url.pathname) {
          case "/":
            return this.handleRoot(req, corsHeaders);
          case "/api/v1/health":
            return this.handleHealth(req, corsHeaders);
          case "/api/v1/metrics":
            return this.handleMetrics(req, corsHeaders);
          case "/api/v1/tension":
            return this.handleTension(req, corsHeaders);
          case "/api/v1/analytics":
            return this.handleAnalytics(req, corsHeaders);
          case "/api/v1/experiments":
            return this.handleExperiments(req, corsHeaders);
          case "/api/v1/config":
            return this.handleConfig(req, corsHeaders);
          default:
            return this.handle404(req, corsHeaders);
        }
      } catch (error) {
        console.error("❌ Server Error:", error);
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: error.message,
            timestamp: new Date().toISOString(),
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
   * Handle root route - matches HAR request
   */
  handleRoot(req, corsHeaders) {
    const userAgent = req.headers.get("user-agent") || "";
    const secChUa = req.headers.get("sec-ch-ua") || "";
    const secChUaMobile = req.headers.get("sec-ch-ua-mobile") || "";
    const secChUaPlatform = req.headers.get("sec-ch-ua-platform") || "";
    const upgradeInsecure = req.headers.get("upgrade-insecure-requests") || "";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staging API - staging-api.example.com</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; padding: 40px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 40px; border-radius: 16px; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .url-badge { display: inline-block; background: rgba(0,0,0,0.3); padding: 12px 20px; border-radius: 8px; font-family: monospace; font-size: 1.1rem; margin-top: 15px; color: #10b981; }
        .status { display: inline-flex; align-items: center; gap: 8px; background: #22c55e; color: white; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-top: 15px; }
        .status::before { content: ''; width: 8px; height: 8px; background: white; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .section { background: #1e293b; padding: 25px; border-radius: 12px; margin-bottom: 20px; }
        .section h2 { color: #60a5fa; margin-bottom: 15px; font-size: 1.3rem; }
        .endpoint { background: #0f172a; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #3b82f6; display: flex; align-items: center; gap: 15px; }
        .method { background: #10b981; color: white; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; min-width: 50px; text-align: center; }
        .path { font-family: monospace; color: #94a3b8; }
        .headers-grid { display: grid; gap: 10px; }
        .header-item { background: #0f172a; padding: 12px 15px; border-radius: 8px; display: grid; grid-template-columns: 200px 1fr; gap: 15px; }
        .header-name { color: #60a5fa; font-family: monospace; font-weight: 600; }
        .header-value { color: #94a3b8; font-family: monospace; word-break: break-all; }
        .code { background: #0f172a; padding: 20px; border-radius: 8px; font-family: monospace; overflow-x: auto; white-space: pre; color: #10b981; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .metric { background: #0f172a; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2rem; font-weight: bold; color: #60a5fa; }
        .metric-label { color: #64748b; font-size: 0.9rem; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Staging API Server</h1>
            <p>Local development server simulating staging-api.example.com</p>
            <div class="url-badge">https://staging-api.example.com/</div>
            <div class="status">Running</div>
        </div>

        <div class="section">
            <h2>📡 API Endpoints</h2>
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/health</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/metrics</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/tension</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/analytics</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/experiments</span></div>
            <div class="endpoint"><span class="method">GET</span><span class="path">/api/v1/config</span></div>
        </div>

        <div class="section">
            <h2>📋 Request Headers (from your browser)</h2>
            <div class="headers-grid">
                <div class="header-item"><span class="header-name">Upgrade-Insecure-Requests</span><span class="header-value">${upgradeInsecure}</span></div>
                <div class="header-item"><span class="header-name">User-Agent</span><span class="header-value">${userAgent}</span></div>
                <div class="header-item"><span class="header-name">sec-ch-ua</span><span class="header-value">${secChUa}</span></div>
                <div class="header-item"><span class="header-name">sec-ch-ua-mobile</span><span class="header-value">${secChUaMobile}</span></div>
                <div class="header-item"><span class="header-name">sec-ch-ua-platform</span><span class="header-value">${secChUaPlatform}</span></div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Server Metrics</h2>
            <div class="metrics">
                <div class="metric"><div class="metric-value">${Math.floor((Date.now() - this.startTime) / 1000)}s</div><div class="metric-label">Uptime</div></div>
                <div class="metric"><div class="metric-value">200</div><div class="metric-label">Status</div></div>
                <div class="metric"><div class="metric-value">6</div><div class="metric-label">Endpoints</div></div>
                <div class="metric"><div class="metric-value">staging</div><div class="metric-label">Environment</div></div>
            </div>
        </div>

        <div class="section">
            <h2>🧪 Test with curl</h2>
            <div class="code">curl 'https://staging-api.example.com:3000/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"'</div>
        </div>

        <div class="section">
            <h2>🔧 Setup Instructions</h2>
            <p style="color: #94a3b8; margin-bottom: 15px;">To access via staging-api.example.com, add this to /etc/hosts:</p>
            <div class="code">sudo echo "127.0.0.1 staging-api.example.com" >> /etc/hosts</div>
            <p style="color: #94a3b8; margin-top: 15px;">Then access: <code style="color: #10b981;">https://staging-api.example.com:3000/</code></p>
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  /**
   * Handle health endpoint
   */
  handleHealth(req, corsHeaders) {
    return new Response(
      JSON.stringify(
        {
          status: "healthy",
          environment: "staging",
          staging_url: "https://staging-api.example.com",
          timestamp: new Date().toISOString(),
          uptime: Math.floor((Date.now() - this.startTime) / 1000),
          version: "v1",
          request_headers: {
            "user-agent": req.headers.get("user-agent"),
            "sec-ch-ua": req.headers.get("sec-ch-ua"),
            "sec-ch-ua-mobile": req.headers.get("sec-ch-ua-mobile"),
            "sec-ch-ua-platform": req.headers.get("sec-ch-ua-platform"),
            "upgrade-insecure-requests": req.headers.get(
              "upgrade-insecure-requests",
            ),
          },
          features: this.configManager.getFeaturesConfig(),
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Handle metrics endpoint
   */
  handleMetrics(req, corsHeaders) {
    return new Response(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          environment: "staging",
          staging_url: "https://staging-api.example.com",
          system: {
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          },
          api: {
            requests_per_minute: Math.floor(Math.random() * 500) + 100,
            avg_response_time_ms: Math.floor(Math.random() * 50) + 10,
            error_rate: (Math.random() * 0.02).toFixed(4),
          },
          quantum: {
            tension_threshold: this.configManager.get(
              "quantum.tension_threshold",
            ),
            decay_rate: this.configManager.get("quantum.decay_rate"),
          },
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Handle tension endpoint
   */
  handleTension(req, corsHeaders) {
    const components = [
      "qsimd-scene",
      "qsimd-connections",
      "quantum-terminal",
      "tension-engine",
    ];
    return new Response(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          staging_url: "https://staging-api.example.com",
          threshold:
            this.configManager.get("quantum.tension_threshold") || 0.85,
          decay_rate: this.configManager.get("quantum.decay_rate") || 0.02,
          components: components.map((name) => ({
            name,
            tension: Math.random() * 0.85,
            status: Math.random() > 0.8 ? "warning" : "normal",
            last_updated: new Date().toISOString(),
          })),
          system_health: {
            overall_tension: Math.random() * 0.7,
            status: "healthy",
          },
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Handle analytics endpoint
   */
  handleAnalytics(req, corsHeaders) {
    return new Response(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          staging_url: "https://staging-api.example.com",
          environment: "staging",
          predictions: {
            next_hour: {
              expected_load: Math.floor(Math.random() * 500) + 200,
              tension_prediction: (Math.random() * 0.6).toFixed(3),
              confidence: (Math.random() * 0.2 + 0.8).toFixed(3),
            },
          },
          current: {
            active_users: Math.floor(Math.random() * 50) + 10,
            request_rate: Math.floor(Math.random() * 30) + 5,
          },
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Handle experiments endpoint
   */
  handleExperiments(req, corsHeaders) {
    return new Response(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          staging_url: "https://staging-api.example.com",
          environment: "staging",
          active_experiments: [
            {
              name: "quantum_ui_v2",
              variant: Math.random() > 0.5 ? "A" : "B",
              traffic: 0.5,
            },
            { name: "tension_optimization", variant: "control", traffic: 0.3 },
          ],
          feature_flags: this.configManager.getFeaturesConfig(),
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Handle config endpoint
   */
  handleConfig(req, corsHeaders) {
    return new Response(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          staging_url: "https://staging-api.example.com",
          environment: "staging",
          api: this.configManager.getAPIConfig(),
          features: this.configManager.getFeaturesConfig(),
          quantum: {
            tension_threshold: this.configManager.get(
              "quantum.tension_threshold",
            ),
            decay_rate: this.configManager.get("quantum.decay_rate"),
            health_check_interval: this.configManager.get(
              "quantum.health_check_interval",
            ),
          },
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Handle 404
   */
  handle404(req, corsHeaders) {
    return new Response(
      JSON.stringify(
        {
          error: "Not Found",
          message: `Route ${req.method} ${new URL(req.url).pathname} not found`,
          staging_url: "https://staging-api.example.com",
          available_endpoints: [
            "/api/v1/health",
            "/api/v1/metrics",
            "/api/v1/tension",
            "/api/v1/analytics",
            "/api/v1/experiments",
            "/api/v1/config",
          ],
        },
        null,
        2,
      ),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Start the server
   */
  async start() {
    this.server = Bun.serve({
      port: 3000,
      hostname: "0.0.0.0", // Listen on all interfaces
      fetch: this.createFetchHandler(),
      error(error) {
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
      },
    });

    console.log(`
🚀 Staging API Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Local URL:     https://api.example.com/
📍 Staging URL:   https://staging-api.example.com/ (requires /etc/hosts entry)

📡 Available Endpoints:
   GET /                    - Landing page
   GET /api/v1/health       - Health check
   GET /api/v1/metrics      - System metrics
   GET /api/v1/tension      - Tension data
   GET /api/v1/analytics    - Analytics
   GET /api/v1/experiments  - A/B experiments
   GET /api/v1/config       - Configuration

🔧 To map staging-api.example.com to localhost:
   sudo sh -c 'echo "127.0.0.1 staging-api.example.com" >> /etc/hosts'

🧪 Test with curl:
   curl https://staging-api.example.com:3000/api/v1/health

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

    return this.server;
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      this.server.stop();
      console.log("🛑 Server stopped");
    }
  }
}

// Auto-start if run directly
const server = new StagingAPILocal();
if (import.meta.main) {
  server.start();
}

export default server;
export { StagingAPILocal };
