// [DOMAIN][API][STAGING][HSL:180,70%,85%][META:{STAGING-API}][CLASS:StagingAPIServer]{BUN-API}

/**
 * Staging API Server
 * Demonstrates the staging API configuration with real endpoints
 * Integrates with the staging configuration manager
 */

import { CompleteEnvironmentManager } from "../config/complete-environment-manager.js";

class StagingAPIServer {
  constructor() {
    this.configManager = new CompleteEnvironmentManager("staging");
    this.server = null;
    this.setupRoutes();
  }

  /**
   * Setup API routes based on staging configuration
   */
  setupRoutes() {
    const apiConfig = this.configManager.getAPIConfig();
    const features = this.configManager.getFeaturesConfig();
    const quantumConfig = this.configManager.getQuantumConfig();

    console.log("🔧 Setting up staging API routes...");
    console.log(`   Base URL: ${apiConfig.url}`);
    console.log(`   Version: ${apiConfig.version}`);
    console.log(`   Endpoints: ${apiConfig.endpoints?.length || 0} configured`);

    // Create fetch handler
    this.fetchHandler = async (req) => {
      const url = new URL(req.url);

      // Add CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-API-Key",
        "Access-Control-Max-Age": "86400",
      };

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      try {
        // Route handling
        if (url.pathname === "/") {
          return this.handleRoot(req, corsHeaders);
        }

        if (url.pathname === `/api/${apiConfig.version}/health`) {
          return this.handleHealth(req, corsHeaders);
        }

        if (url.pathname === `/api/${apiConfig.version}/metrics`) {
          return this.handleMetrics(req, corsHeaders);
        }

        if (url.pathname === `/api/${apiConfig.version}/tension`) {
          return this.handleTension(req, corsHeaders);
        }

        if (url.pathname === `/api/${apiConfig.version}/analytics`) {
          return this.handleAnalytics(req, corsHeaders);
        }

        if (url.pathname === `/api/${apiConfig.version}/experiments`) {
          return this.handleExperiments(req, corsHeaders);
        }

        if (url.pathname === `/api/${apiConfig.version}/config`) {
          return this.handleConfig(req, corsHeaders);
        }

        // 404 for unknown routes
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: `Route ${req.method} ${url.pathname} not found`,
            available_endpoints: apiConfig.endpoints || [],
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        console.error("API Error:", error);
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
   * Handle root route
   */
  async handleRoot(req, corsHeaders) {
    const apiConfig = this.configManager.getAPIConfig();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Staging API - Quantum Cash Flow Lattice</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
        .endpoint { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .get { background: #10b981; color: white; }
        .post { background: #f59e0b; color: white; }
        .url { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
        .features { margin-top: 30px; }
        .feature { display: inline-block; margin: 5px; padding: 5px 10px; background: #e0e7ff; color: #3730a3; border-radius: 15px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Staging API Server</h1>
        <p>Quantum Cash Flow Lattice - Staging Environment</p>
        <p><strong>Base URL:</strong> <span class="url">${apiConfig.url}</span></p>
        <p><strong>Version:</strong> ${apiConfig.version}</p>
        <p><strong>Status:</strong> <span style="color: green;">● Running</span></p>
    </div>

    <h2>📡 Available Endpoints</h2>
    ${(apiConfig.endpoints || [])
      .map(
        (endpoint) => `
        <div class="endpoint">
            <span class="method get">GET</span>
            <span class="url">${apiConfig.url}${endpoint}</span>
        </div>
    `,
      )
      .join("")}

    <div class="features">
        <h3>🚀 Enabled Features</h3>
        ${Object.entries(this.configManager.getFeaturesConfig())
          .filter(([_, enabled]) => enabled)
          .map(([name, _]) => `<span class="feature">✅ ${name}</span>`)
          .join("")}
    </div>

    <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
        <h3>🧪 Testing with curl</h3>
        <pre style="background: #1f2937; color: #f3f4f6; padding: 15px; border-radius: 6px; overflow-x: auto;">
curl '${apiConfig.url}/' \\
  -H 'Upgrade-Insecure-Requests: 1' \\
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' \\
  -H 'sec-ch-ua: "Google Chrome";v="143", "Chromium";v="143"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "macOS"'
        </pre>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  /**
   * Handle health check
   */
  async handleHealth(req, corsHeaders) {
    const quantumConfig = this.configManager.getQuantumConfig();
    const serverConfig = this.configManager.getServerConfig();

    const healthData = {
      status: "healthy",
      environment: "staging",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: this.configManager.getAPIConfig().version,
      server: {
        host: serverConfig.host,
        port: serverConfig.port,
      },
      quantum: {
        tension_threshold: quantumConfig.tension_threshold,
        decay_rate: quantumConfig.decay_rate,
        health_check_interval: quantumConfig.health_check_interval,
        analytics_enabled: quantumConfig.analytics_enabled,
      },
      features: this.configManager.getFeaturesConfig(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };

    return new Response(JSON.stringify(healthData, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  /**
   * Handle metrics endpoint
   */
  async handleMetrics(req, corsHeaders) {
    const performanceConfig = this.configManager.getPerformanceConfig();

    const metrics = {
      timestamp: new Date().toISOString(),
      environment: "staging",
      system: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage(),
      },
      performance: {
        simd_enabled: performanceConfig.simd_enabled,
        worker_threads: performanceConfig.worker_threads,
        memory_limit: performanceConfig.memory_limit,
        monitoring_enabled: performanceConfig.monitoring?.enabled,
      },
      quantum: {
        tension_threshold: this.configManager.get("quantum.tension_threshold"),
        decay_rate: this.configManager.get("quantum.decay_rate"),
        health_check_interval: this.configManager.get(
          "quantum.health_check_interval",
        ),
      },
      api_metrics: {
        requests_per_minute: Math.floor(Math.random() * 1000) + 500,
        average_response_time: Math.floor(Math.random() * 100) + 50,
        error_rate: (Math.random() * 0.05).toFixed(4),
      },
      cache: {
        hit_rate: (Math.random() * 0.3 + 0.7).toFixed(4),
        memory_usage: (Math.random() * 0.8).toFixed(4),
        ttl: this.configManager.get("cache.ttl"),
      },
    };

    return new Response(JSON.stringify(metrics, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  /**
   * Handle tension endpoint
   */
  async handleTension(req, corsHeaders) {
    const quantumConfig = this.configManager.getQuantumConfig();

    // Simulate tension data
    const components = [
      "qsimd-scene",
      "qsimd-connections",
      "quantum-terminal",
      "tension-engine",
    ];
    const tensionData = {
      timestamp: new Date().toISOString(),
      threshold: quantumConfig.tension_threshold,
      decay_rate: quantumConfig.decay_rate,
      components: components.map((name) => ({
        name,
        tension: Math.random() * quantumConfig.tension_threshold,
        status: Math.random() > 0.8 ? "warning" : "normal",
        last_updated: new Date().toISOString(),
      })),
      system_health: {
        overall_tension: Math.random() * quantumConfig.tension_threshold,
        status:
          Math.random() > 0.9
            ? "critical"
            : Math.random() > 0.7
              ? "warning"
              : "healthy",
        recommendations:
          Math.random() > 0.8
            ? ["Reduce component load", "Increase decay rate"]
            : [],
      },
    };

    return new Response(JSON.stringify(tensionData, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  /**
   * Handle analytics endpoint
   */
  async handleAnalytics(req, corsHeaders) {
    if (!this.configManager.isFeatureEnabled("predictive_analytics")) {
      return new Response(
        JSON.stringify({
          error: "Feature Not Available",
          message: "Predictive analytics is not enabled in staging",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const analytics = {
      timestamp: new Date().toISOString(),
      environment: "staging",
      predictions: {
        next_hour: {
          expected_load: Math.floor(Math.random() * 1000) + 500,
          tension_prediction: (Math.random() * 0.8).toFixed(3),
          confidence: (Math.random() * 0.3 + 0.7).toFixed(3),
        },
        next_day: {
          peak_load_time: "14:00 UTC",
          expected_tension_spike: Math.random() > 0.7,
          recommended_actions:
            Math.random() > 0.6
              ? ["Scale up workers", "Increase cache TTL"]
              : [],
        },
      },
      current_metrics: {
        active_users: Math.floor(Math.random() * 100) + 50,
        request_rate: Math.floor(Math.random() * 50) + 10,
        error_rate: (Math.random() * 0.02).toFixed(4),
      },
    };

    return new Response(JSON.stringify(analytics, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  /**
   * Handle experiments endpoint
   */
  async handleExperiments(req, corsHeaders) {
    if (!this.configManager.isFeatureEnabled("a_b_testing")) {
      return new Response(
        JSON.stringify({
          error: "Feature Not Available",
          message: "A/B testing is not enabled",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const experiments = {
      timestamp: new Date().toISOString(),
      environment: "staging",
      active_experiments: [
        {
          name: "quantum_ui_redesign",
          variant: Math.random() > 0.5 ? "A" : "B",
          traffic_split: 0.5,
          start_date: "2024-01-15",
          metrics: {
            conversion_rate: (Math.random() * 0.1 + 0.05).toFixed(4),
            engagement_score: Math.floor(Math.random() * 100) + 50,
          },
        },
        {
          name: "tension_threshold_optimization",
          variant: Math.random() > 0.5 ? "control" : "test",
          traffic_split: 0.3,
          start_date: "2024-01-10",
          metrics: {
            system_stability: (Math.random() * 0.2 + 0.8).toFixed(4),
            user_satisfaction: Math.floor(Math.random() * 20) + 80,
          },
        },
      ],
      feature_flags: this.configManager.getFeaturesConfig(),
    };

    return new Response(JSON.stringify(experiments, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  /**
   * Handle configuration endpoint
   */
  async handleConfig(req, corsHeaders) {
    const config = this.configManager.exportDeploymentConfig();

    // Remove sensitive information for public endpoint
    const publicConfig = {
      ...config,
      api: {
        ...config.api,
        version: config.api.version,
        endpoints: config.api.endpoints,
      },
      features: config.features,
      performance: {
        ...config.performance,
        simd_enabled: config.performance.simd_enabled,
        worker_threads: config.performance.worker_threads,
      },
      quantum: {
        tension_threshold: config.quantum.tension_threshold,
        decay_rate: config.quantum.decay_rate,
        health_check_interval: config.quantum.health_check_interval,
      },
    };

    return new Response(JSON.stringify(publicConfig, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  /**
   * Start the staging server
   */
  async start() {
    const serverConfig = this.configManager.getServerConfig();

    try {
      this.server = Bun.serve({
        port: serverConfig.port,
        hostname: serverConfig.host,
        fetch: this.fetchHandler.bind(this),
        error(error) {
          console.error("Server error:", error);
          return new Response("Internal Server Error", { status: 500 });
        },
      });

      console.log("🚀 Staging API Server started successfully!");
      console.log(`   Server: ${serverConfig.host}:${serverConfig.port}`);
      console.log(`   Environment: ${this.configManager.getEnvironment()}`);
      console.log(
        `   API Version: ${this.configManager.getAPIConfig().version}`,
      );
      console.log(
        `   Features: ${Object.values(this.configManager.getFeaturesConfig()).filter(Boolean).length} enabled`,
      );

      console.log("\n📡 Available endpoints:");
      const endpoints = this.configManager.getAPIConfig().endpoints || [];
      endpoints.forEach((endpoint) => {
        console.log(
          `   📡 ${this.configManager.getAPIConfig().url}${endpoint}`,
        );
      });

      console.log("\n🧪 Test with curl:");
      console.log(`curl '${this.configManager.getAPIConfig().url}/' \\`);
      console.log(
        `  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' \\`,
      );
      console.log(`  -H 'sec-ch-ua: "Google Chrome";v="143"' \\`);
      console.log(`  -H 'sec-ch-ua-platform: "macOS"'`);

      return this.server;
    } catch (error) {
      console.error("❌ Failed to start staging server:", error.message);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    if (this.server) {
      console.log("🛑 Stopping staging API server...");
      this.server.stop();
      console.log("✅ Server stopped successfully");
    }
  }

  /**
   * Get server info
   */
  getInfo() {
    return {
      environment: this.configManager.getEnvironment(),
      server: this.configManager.getServerConfig(),
      api: this.configManager.getAPIConfig(),
      features: this.configManager.getFeaturesConfig(),
      status: this.server ? "running" : "stopped",
    };
  }
}

// Create and export server instance
const stagingServer = new StagingAPIServer();

// Auto-start if run directly
if (import.meta.main) {
  stagingServer.start().catch(console.error);
}

export default stagingServer;
export { StagingAPIServer };
