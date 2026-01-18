// [DOMAIN][API][COOKIES][HSL:200,70%,85%][META:{BUN-COOKIES}][CLASS:CookieServer]{BUN-API}

/**
 * Cookie Server Implementation for https://staging-api.example.com/
 * Demonstrates Bun's built-in Cookie API with staging configuration
 */

import { CompleteEnvironmentManager } from "../config/complete-environment-manager.js";

class CookieServer {
  constructor() {
    this.configManager = new CompleteEnvironmentManager("staging");
    this.server = null;
    this.setupRoutes();
  }

  /**
   * Setup routes with cookie handling
   */
  setupRoutes() {
    console.log("🍪 Setting up Cookie Server for staging API...");
    console.log("📋 Target URL: https://staging-api.example.com/");

    this.fetchHandler = async (req) => {
      const url = new URL(req.url);

      // Add CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-API-Key, Cookie",
        "Access-Control-Allow-Credentials": "true",
        "X-Staging-Environment": "true",
        "X-Cookie-Demo": "true",
      };

      // Handle preflight OPTIONS
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 200,
          headers: corsHeaders,
        });
      }

      try {
        // Route handling with cookie support
        if (url.pathname === "/") {
          return this.handleRoot(req, corsHeaders);
        }

        if (url.pathname === "/profile") {
          return this.handleProfile(req, corsHeaders);
        }

        if (url.pathname === "/login") {
          return this.handleLogin(req, corsHeaders);
        }

        if (url.pathname === "/logout") {
          return this.handleLogout(req, corsHeaders);
        }

        if (url.pathname === "/theme") {
          return this.handleTheme(req, corsHeaders);
        }

        if (url.pathname === "/cookies") {
          return this.handleCookies(req, corsHeaders);
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
            cookie_demo: true,
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        console.error("Cookie Server Error:", error);
        return new Response(
          JSON.stringify({
            error: "Internal Server Error",
            message: error.message,
            timestamp: new Date().toISOString(),
            cookie_demo: true,
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
   * Handle root route with cookie demonstration
   */
  async handleRoot(req, corsHeaders) {
    const cookies = req.cookies;

    // Read existing cookies
    const sessionId = cookies.get("session_id") || null;
    const userId = cookies.get("user_id") || null;
    const theme = cookies.get("theme") || "light";
    const preferences = cookies.get("preferences") || null;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Cookie Demo - Staging API</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; background: ${theme === "dark" ? "#1a1a1a" : "#f8fafc"}; color: ${theme === "dark" ? "#f3f4f6" : "#1f2937"}; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: ${theme === "dark" ? "#2d2d2d" : "white"}; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .header h1 { color: ${theme === "dark" ? "#60a5fa" : "#1e40af"}; margin: 0; font-size: 2.5rem; }
        .header p { color: ${theme === "dark" ? "#9ca3af" : "#64748b"}; margin: 10px 0 0 0; font-size: 1.1rem; }
        .url-display { background: ${theme === "dark" ? "#1e293b" : "#1e293b"}; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 1.2rem; margin: 20px 0; }
        .section { background: ${theme === "dark" ? "#2d2d2d" : "white"}; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .section h2 { color: ${theme === "dark" ? "#60a5fa" : "#1e40af"}; margin-top: 0; }
        .cookie-item { background: ${theme === "dark" ? "#374151" : "#f1f5f9"}; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .cookie-name { font-weight: 600; font-family: monospace; }
        .cookie-value { font-family: monospace; background: ${theme === "dark" ? "#1f2937" : "#e2e8f0"}; padding: 4px 8px; border-radius: 4px; word-break: break-all; }
        .button { display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 5px; }
        .button:hover { background: #2563eb; }
        .button.secondary { background: #6b7280; }
        .button.secondary:hover { background: #4b5563; }
        .status { padding: 10px; border-radius: 6px; margin: 10px 0; }
        .success { background: #dcfce7; color: #166534; }
        .info { background: #dbeafe; color: #1e40af; }
        .warning { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍪 Cookie Demo Server</h1>
            <p>Bun Cookie API for https://staging-api.example.com/</p>
            <div class="url-display">https://staging-api.example.com/</div>
        </div>

        <div class="section">
            <h2>📋 Current Cookies</h2>
            ${
              sessionId
                ? `
                <div class="cookie-item">
                    <div class="cookie-name">session_id:</div>
                    <div class="cookie-value">${sessionId}</div>
                </div>
            `
                : '<div class="status warning">⚠️ No session_id cookie</div>'
            }
            
            ${
              userId
                ? `
                <div class="cookie-item">
                    <div class="cookie-name">user_id:</div>
                    <div class="cookie-value">${userId}</div>
                </div>
            `
                : '<div class="status warning">⚠️ No user_id cookie</div>'
            }
            
            <div class="cookie-item">
                <div class="cookie-name">theme:</div>
                <div class="cookie-value">${theme}</div>
            </div>
            
            ${
              preferences
                ? `
                <div class="cookie-item">
                    <div class="cookie-name">preferences:</div>
                    <div class="cookie-value">${preferences}</div>
                </div>
            `
                : '<div class="status info">ℹ️ No preferences cookie</div>'
            }
        </div>

        <div class="section">
            <h2>🚀 Cookie Actions</h2>
            <a href="/login" class="button">🔑 Login (Set Cookies)</a>
            <a href="/profile" class="button">👤 Profile (Read Cookies)</a>
            <a href="/theme" class="button">🎨 Toggle Theme</a>
            <a href="/cookies" class="button">📊 View All Cookies</a>
            <a href="/logout" class="button secondary">🚪 Logout (Delete Cookies)</a>
        </div>

        <div class="section">
            <h2>🔧 Bun Cookie API Features</h2>
            <div style="background: ${theme === "dark" ? "#374151" : "#f1f5f9"}; padding: 20px; border-radius: 8px;">
                <h3>Reading Cookies:</h3>
                <code style="display: block; background: ${theme === "dark" ? "#1f2937" : "#e2e8f0"}; padding: 10px; border-radius: 4px; margin: 10px 0;">
const userId = req.cookies.get("user_id");<br>
const theme = req.cookies.get("theme") || "light";
                </code>
                
                <h3>Setting Cookies:</h3>
                <code style="display: block; background: ${theme === "dark" ? "#1f2937" : "#e2e8f0"}; padding: 10px; border-radius: 4px; margin: 10px 0;">
req.cookies.set("user_id", "12345", {<br>
&nbsp;&nbsp;maxAge: 60 * 60 * 24 * 7,<br>
&nbsp;&nbsp;httpOnly: true,<br>
&nbsp;&nbsp;secure: true,<br>
&nbsp;&nbsp;path: "/"<br>
});
                </code>
                
                <h3>Deleting Cookies:</h3>
                <code style="display: block; background: ${theme === "dark" ? "#1f2937" : "#e2e8f0"}; padding: 10px; border-radius: 4px; margin: 10px 0;">
req.cookies.delete("user_id", { path: "/" });
                </code>
            </div>
        </div>

        <div class="section">
            <h3>🧪 Testing with curl</h3>
            <div style="background: #1f2937; color: #f3f4f6; padding: 20px; border-radius: 8px; font-family: monospace;">
# Test login (sets cookies)
curl -c cookies.txt -b cookies.txt 'http://localhost:3000/login'

# Test profile (reads cookies)
curl -c cookies.txt -b cookies.txt 'http://localhost:3000/profile'

# Test theme toggle
curl -c cookies.txt -b cookies.txt 'http://localhost:3000/theme'

# Test logout (deletes cookies)
curl -c cookies.txt -b cookies.txt 'http://localhost:3000/logout'
            </div>
        </div>
    </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
        "X-Cookie-Demo-URL": "https://staging-api.example.com/",
      },
    });
  }

  /**
   * Handle profile page - reading cookies
   */
  async handleProfile(req, corsHeaders) {
    const cookies = req.cookies;

    // Read cookies from the request
    const userId = cookies.get("user_id");
    const sessionId = cookies.get("session_id");
    const theme = cookies.get("theme") || "light";
    const preferences = cookies.get("preferences");

    const profileData = {
      authenticated: !!userId && !!sessionId,
      user_id: userId || null,
      session_id: sessionId || null,
      theme: theme,
      preferences: preferences ? JSON.parse(preferences) : null,
      staging_url: "https://staging-api.example.com",
      cookie_demo: true,
      timestamp: new Date().toISOString(),
    };

    // If not authenticated, set some demo cookies
    if (!userId) {
      cookies.set("user_id", "demo_user_12345", {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: false, // Set to false for localhost testing
        path: "/",
        sameSite: "lax",
      });

      cookies.set("session_id", "demo_session_" + Date.now(), {
        maxAge: 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "lax",
      });

      cookies.set(
        "preferences",
        JSON.stringify({
          language: "en",
          timezone: "UTC",
          notifications: true,
        }),
        {
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: false,
          secure: false,
          path: "/",
        },
      );

      profileData.message = "Demo cookies set for testing";
      profileData.authenticated = true;
      profileData.user_id = "demo_user_12345";
      profileData.session_id = "demo_session_" + Date.now();
    } else {
      profileData.message = "Profile loaded from existing cookies";
    }

    return new Response(JSON.stringify(profileData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cookie-Demo-Endpoint": "/profile",
      },
    });
  }

  /**
   * Handle login - setting cookies
   */
  async handleLogin(req, corsHeaders) {
    const cookies = req.cookies;

    // Set various cookies with different options
    cookies.set(
      "user_id",
      "staging_user_" + Math.random().toString(36).substr(2, 9),
      {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: false, // Set to false for localhost testing
        path: "/",
        sameSite: "lax",
      },
    );

    cookies.set("session_id", "staging_session_" + Date.now(), {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "lax",
    });

    cookies.set("theme", "dark", {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      secure: false,
      path: "/",
    });

    cookies.set(
      "preferences",
      JSON.stringify({
        language: "en",
        timezone: "UTC",
        notifications: true,
        theme: "dark",
        last_login: new Date().toISOString(),
      }),
      {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: false,
        secure: false,
        path: "/",
      },
    );

    // Set a staging-specific cookie
    cookies.set("staging_env", "true", {
      maxAge: 60 * 60 * 24, // 1 day
      httpOnly: false,
      secure: false,
      path: "/",
    });

    const loginResponse = {
      success: true,
      message: "Login successful - cookies set",
      staging_url: "https://staging-api.example.com",
      cookies_set: {
        user_id: "staging_user_" + Math.random().toString(36).substr(2, 9),
        session_id: "staging_session_" + Date.now(),
        theme: "dark",
        preferences: "language, timezone, notifications",
        staging_env: "true",
      },
      cookie_options: {
        maxAge: "1 week for user_id, 1 day for session_id",
        httpOnly: "true for sensitive cookies",
        secure: "true in production",
        sameSite: "lax",
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(loginResponse, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cookie-Demo-Endpoint": "/login",
      },
    });
  }

  /**
   * Handle logout - deleting cookies
   */
  async handleLogout(req, corsHeaders) {
    const cookies = req.cookies;

    // Delete all cookies
    cookies.delete("user_id", { path: "/" });
    cookies.delete("session_id", { path: "/" });
    cookies.delete("theme", { path: "/" });
    cookies.delete("preferences", { path: "/" });
    cookies.delete("staging_env", { path: "/" });

    const logoutResponse = {
      success: true,
      message: "Logged out successfully - cookies deleted",
      staging_url: "https://staging-api.example.com",
      cookies_deleted: [
        "user_id",
        "session_id",
        "theme",
        "preferences",
        "staging_env",
      ],
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(logoutResponse, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cookie-Demo-Endpoint": "/logout",
      },
    });
  }

  /**
   * Handle theme toggle - modifying cookies
   */
  async handleTheme(req, corsHeaders) {
    const cookies = req.cookies;
    const currentTheme = cookies.get("theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    // Update theme cookie
    cookies.set("theme", newTheme, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      secure: false,
      path: "/",
    });

    // Update preferences if they exist
    const preferences = cookies.get("preferences");
    if (preferences) {
      try {
        const prefs = JSON.parse(preferences);
        prefs.theme = newTheme;
        prefs.last_theme_change = new Date().toISOString();
        cookies.set("preferences", JSON.stringify(prefs), {
          maxAge: 60 * 60 * 24 * 30,
          httpOnly: false,
          secure: false,
          path: "/",
        });
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    const themeResponse = {
      success: true,
      message: `Theme changed to ${newTheme}`,
      previous_theme: currentTheme,
      new_theme: newTheme,
      staging_url: "https://staging-api.example.com",
      cookie_updated: "theme",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(themeResponse, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cookie-Demo-Endpoint": "/theme",
      },
    });
  }

  /**
   * Handle cookies overview
   */
  async handleCookies(req, corsHeaders) {
    const cookies = req.cookies;

    // Get all cookies
    const allCookies = {};
    for (const [name, value] of cookies) {
      allCookies[name] = value;
    }

    const cookiesResponse = {
      staging_url: "https://staging-api.example.com",
      total_cookies: Object.keys(allCookies).length,
      cookies: allCookies,
      cookie_types: {
        authentication: ["user_id", "session_id"],
        preferences: ["theme", "preferences"],
        staging: ["staging_env"],
      },
      security_info: {
        httpOnly_cookies: ["user_id", "session_id"],
        secure_cookies: "true in production",
        sameSite_policy: "lax",
        path_scope: "/",
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(cookiesResponse, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cookie-Demo-Endpoint": "/cookies",
      },
    });
  }

  /**
   * Handle health check with cookie info
   */
  async handleHealth(req, corsHeaders) {
    const cookies = req.cookies;
    const hasAuthCookies = cookies.get("user_id") && cookies.get("session_id");

    const healthData = {
      status: "healthy",
      environment: "staging",
      staging_url: "https://staging-api.example.com",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cookie_demo: {
        enabled: true,
        total_cookies: Array.from(cookies).length,
        authenticated: hasAuthCookies,
        theme: cookies.get("theme") || "light",
        staging_env: cookies.get("staging_env") || "false",
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
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Cookie-Demo-Endpoint": "/api/v1/health",
      },
    });
  }

  /**
   * Start the cookie server
   */
  async start() {
    try {
      this.server = Bun.serve({
        port: 3000,
        hostname: "localhost",
        fetch: this.fetchHandler.bind(this),
        error(error) {
          console.error("Cookie Server error:", error);
          return new Response("Internal Server Error", { status: 500 });
        },
      });

      console.log("🍪 Cookie Server started successfully!");
      console.log(`   Staging URL: https://staging-api.example.com/`);
      console.log(`   Development URL: http://localhost:3000/`);
      console.log(`   Environment: ${this.configManager.getEnvironment()}`);
      console.log(`   Cookie Demo: Enabled`);

      console.log("\n🍪 Available Cookie Endpoints:");
      console.log("   🏠 http://localhost:3000/ - Cookie demo home");
      console.log("   🔑 http://localhost:3000/login - Set cookies");
      console.log("   👤 http://localhost:3000/profile - Read cookies");
      console.log("   🎨 http://localhost:3000/theme - Toggle theme");
      console.log("   📊 http://localhost:3000/cookies - View all cookies");
      console.log("   🚪 http://localhost:3000/logout - Delete cookies");
      console.log(
        "   ❤️ http://localhost:3000/api/v1/health - Health with cookie info",
      );

      console.log("\n🧪 Testing with curl:");
      console.log(`# Login (sets cookies)`);
      console.log(
        `curl -c cookies.txt -b cookies.txt 'http://localhost:3000/login'`,
      );
      console.log(`# Profile (reads cookies)`);
      console.log(
        `curl -c cookies.txt -b cookies.txt 'http://localhost:3000/profile'`,
      );
      console.log(`# Theme toggle`);
      console.log(
        `curl -c cookies.txt -b cookies.txt 'http://localhost:3000/theme'`,
      );
      console.log(`# Logout (deletes cookies)`);
      console.log(
        `curl -c cookies.txt -b cookies.txt 'http://localhost:3000/logout'`,
      );

      return this.server;
    } catch (error) {
      console.error("❌ Failed to start Cookie server:", error.message);
      throw error;
    }
  }

  /**
   * Stop the server
   */
  async stop() {
    if (this.server) {
      console.log("🛑 Stopping Cookie server...");
      this.server.stop();
      console.log("✅ Server stopped successfully");
    }
  }
}

// Create and export server instance
const cookieServer = new CookieServer();

// Auto-start if run directly
if (import.meta.main) {
  cookieServer.start().catch(console.error);
}

export default cookieServer;
export { CookieServer };
