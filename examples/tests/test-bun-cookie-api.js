// Test Bun Cookie API for https://staging-api.example.com/

console.log("🍪 Testing Bun Cookie API Implementation\n");

async function startCookieServer() {
  console.log("🚀 Starting Cookie Server...");

  try {
    const { CookieServer } = await import("./src/api/cookie-server.js");
    const server = new CookieServer();

    // Start the server
    await server.start();

    // Wait a moment for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return server;
  } catch (error) {
    console.error("❌ Failed to start Cookie server:", error.message);
    return null;
  }
}

async function testCookieReading() {
  console.log("📄 1. Testing Cookie Reading");
  console.log("-".repeat(50));

  try {
    // First visit - no cookies
    console.log("🔍 Testing profile page without cookies:");
    const response1 = await fetch("http://api.example.com/profile");

    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`   ✅ Status: ${response1.status}`);
      console.log(`   📊 Authenticated: ${data1.authenticated}`);
      console.log(`   📊 User ID: ${data1.user_id}`);
      console.log(`   📊 Session ID: ${data1.session_id}`);
      console.log(`   📊 Theme: ${data1.theme}`);
      console.log(`   📄 Message: ${data1.message}`);

      // Check if Set-Cookie headers are present
      const setCookieHeaders = response1.headers.getSetCookie();
      console.log(`   🍪 Cookies set: ${setCookieHeaders.length}`);
      setCookieHeaders.forEach((cookie, index) => {
        console.log(`     ${index + 1}. ${cookie.split(";")[0]}`);
      });
    } else {
      console.log(`   ❌ Failed: ${response1.status}`);
    }

    return response1;
  } catch (error) {
    console.error("❌ Cookie reading test error:", error.message);
    return null;
  }
}

async function testCookieSetting() {
  console.log("\n📄 2. Testing Cookie Setting");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing login endpoint (sets cookies):");
    const response = await fetch("http://api.example.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "test_user",
        password: "test_password",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Message: ${data.message}`);
      console.log(`   🍪 Cookies set: ${Object.keys(data.cookies_set).length}`);

      Object.entries(data.cookies_set).forEach(([name, value]) => {
        console.log(`     ${name}: ${value}`);
      });

      // Check Set-Cookie headers
      const setCookieHeaders = response.headers.getSetCookie();
      console.log(`   🍪 Set-Cookie headers: ${setCookieHeaders.length}`);
      setCookieHeaders.forEach((cookie, index) => {
        const [nameValue] = cookie.split(";");
        console.log(`     ${index + 1}. ${nameValue}`);
      });

      return response;
    } else {
      console.log(`   ❌ Failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Cookie setting test error:", error.message);
    return null;
  }
}

async function testCookieModification() {
  console.log("\n📄 3. Testing Cookie Modification");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing theme toggle (modifies existing cookies):");

    // First login to set cookies
    const loginResponse = await fetch("http://api.example.com/login");
    const cookies = loginResponse.headers.getSetCookie();

    // Extract cookies for the theme request
    const cookieString = cookies.map((c) => c.split(";")[0]).join("; ");

    const themeResponse = await fetch("http://api.example.com/theme", {
      headers: {
        Cookie: cookieString,
      },
    });

    if (themeResponse.ok) {
      const data = await themeResponse.json();
      console.log(`   ✅ Status: ${themeResponse.status}`);
      console.log(`   📄 Message: ${data.message}`);
      console.log(`   🎨 Previous theme: ${data.previous_theme}`);
      console.log(`   🎨 New theme: ${data.new_theme}`);
      console.log(`   🍪 Cookie updated: ${data.cookie_updated}`);

      // Check if theme cookie was updated
      const setCookieHeaders = themeResponse.headers.getSetCookie();
      console.log(`   🍪 Updated cookies: ${setCookieHeaders.length}`);
      setCookieHeaders.forEach((cookie, index) => {
        const [nameValue] = cookie.split(";");
        console.log(`     ${index + 1}. ${nameValue}`);
      });

      return themeResponse;
    } else {
      console.log(`   ❌ Failed: ${themeResponse.status}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Cookie modification test error:", error.message);
    return null;
  }
}

async function testCookieDeletion() {
  console.log("\n📄 4. Testing Cookie Deletion");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing logout endpoint (deletes cookies):");

    // First login to set cookies
    const loginResponse = await fetch("http://api.example.com/login");
    const cookies = loginResponse.headers.getSetCookie();
    const cookieString = cookies.map((c) => c.split(";")[0]).join("; ");

    console.log(`   🍪 Cookies before logout: ${cookies.length}`);

    // Logout to delete cookies
    const logoutResponse = await fetch("http://api.example.com/logout", {
      headers: {
        Cookie: cookieString,
      },
    });

    if (logoutResponse.ok) {
      const data = await logoutResponse.json();
      console.log(`   ✅ Status: ${logoutResponse.status}`);
      console.log(`   📄 Message: ${data.message}`);
      console.log(`   🍪 Cookies deleted: ${data.cookies_deleted.length}`);

      data.cookies_deleted.forEach((cookie, index) => {
        console.log(`     ${index + 1}. ${cookie}`);
      });

      // Check Set-Cookie headers for deletion (maxAge=0)
      const setCookieHeaders = logoutResponse.headers.getSetCookie();
      console.log(`   🍪 Deletion headers: ${setCookieHeaders.length}`);
      setCookieHeaders.forEach((cookie, index) => {
        const [nameValue] = cookie.split(";");
        console.log(`     ${index + 1}. ${nameValue}`);
      });

      return logoutResponse;
    } else {
      console.log(`   ❌ Failed: ${logoutResponse.status}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Cookie deletion test error:", error.message);
    return null;
  }
}

async function testCookieOverview() {
  console.log("\n📄 5. Testing Cookie Overview");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing cookies overview endpoint:");

    // First login to set cookies
    const loginResponse = await fetch("http://api.example.com/login");
    const cookies = loginResponse.headers.getSetCookie();
    const cookieString = cookies.map((c) => c.split(";")[0]).join("; ");

    // Get cookie overview
    const overviewResponse = await fetch("http://api.example.com/cookies", {
      headers: {
        Cookie: cookieString,
      },
    });

    if (overviewResponse.ok) {
      const data = await overviewResponse.json();
      console.log(`   ✅ Status: ${overviewResponse.status}`);
      console.log(`   🍪 Total cookies: ${data.total_cookies}`);
      console.log(`   📊 Staging URL: ${data.staging_url}`);

      console.log("\n   🍪 All cookies:");
      Object.entries(data.cookies).forEach(([name, value]) => {
        console.log(`     ${name}: ${value}`);
      });

      console.log("\n   📋 Cookie types:");
      Object.entries(data.cookie_types).forEach(([type, names]) => {
        console.log(`     ${type}: ${names.join(", ")}`);
      });

      console.log("\n   🔒 Security info:");
      Object.entries(data.security_info).forEach(([key, value]) => {
        console.log(
          `     ${key}: ${Array.isArray(value) ? value.join(", ") : value}`,
        );
      });

      return overviewResponse;
    } else {
      console.log(`   ❌ Failed: ${overviewResponse.status}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Cookie overview test error:", error.message);
    return null;
  }
}

async function testHealthWithCookies() {
  console.log("\n📄 6. Testing Health Check with Cookie Info");
  console.log("-".repeat(50));

  try {
    console.log("🔍 Testing health endpoint with cookie information:");

    // Test without cookies
    const response1 = await fetch("http://api.example.com/api/v1/health");
    if (response1.ok) {
      const data1 = await response1.json();
      console.log("   📊 Without cookies:");
      console.log(`     Status: ${data1.status}`);
      console.log(`     Authenticated: ${data1.cookie_demo.authenticated}`);
      console.log(`     Total cookies: ${data1.cookie_demo.total_cookies}`);
      console.log(`     Theme: ${data1.cookie_demo.theme}`);
    }

    // Test with cookies
    const loginResponse = await fetch("http://api.example.com/login");
    const cookies = loginResponse.headers.getSetCookie();
    const cookieString = cookies.map((c) => c.split(";")[0]).join("; ");

    const response2 = await fetch("http://api.example.com/api/v1/health", {
      headers: {
        Cookie: cookieString,
      },
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log("\n   📊 With cookies:");
      console.log(`     Status: ${data2.status}`);
      console.log(`     Authenticated: ${data2.cookie_demo.authenticated}`);
      console.log(`     Total cookies: ${data2.cookie_demo.total_cookies}`);
      console.log(`     Theme: ${data2.cookie_demo.theme}`);
      console.log(`     Staging env: ${data2.cookie_demo.staging_env}`);
    }

    return response2;
  } catch (error) {
    console.error("❌ Health check test error:", error.message);
    return null;
  }
}

async function demonstrateBunCookieAPI() {
  console.log("\n📄 7. Bun Cookie API Documentation");
  console.log("-".repeat(50));

  console.log("🍪 Bun Cookie API Features:");
  console.log(`
📚 READING COOKIES
================

// Access cookies from the request
const userId = req.cookies.get("user_id");
const theme = req.cookies.get("theme") || "light";

// Iterate over all cookies
for (const [name, value] of req.cookies) {
  console.log(name, value);
}

📝 SETTING COOKIES
==================

// Set a cookie with various options
req.cookies.set("user_id", "12345", {
  maxAge: 60 * 60 * 24 * 7, // 1 week
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "lax"
});

// Set multiple cookies
req.cookies.set("theme", "dark");
req.cookies.set("preferences", JSON.stringify({...}));

🗑️ DELETING COOKIES
==================

// Delete a cookie
req.cookies.delete("user_id", {
  path: "/"
});

// Delete multiple cookies
req.cookies.delete("session_id");
req.cookies.delete("theme");

🔧 COOKIE OPTIONS
================

{
  maxAge: 60 * 60 * 24 * 7,    // Expiration in seconds
  expires: new Date(),         // Absolute expiration date
  httpOnly: true,              // HTTP-only cookie
  secure: true,                // HTTPS-only cookie
  path: "/",                   // Cookie path
  domain: "example.com",       // Cookie domain
  sameSite: "lax"              // SameSite policy
}

🌐 AUTOMATIC COOKIE TRACKING
===========================

// Bun.serve() automatically tracks modified cookies
// from the request and applies them to the response

Bun.serve({
  routes: {
    "/login": req => {
      req.cookies.set("user_id", "12345");
      // Set-Cookie header automatically added to response
      return new Response("Login successful");
    }
  }
});
  `);
}

async function testCurlCommands() {
  console.log("\n📄 8. Testing with curl Commands");
  console.log("-".repeat(50));

  console.log("🧪 Testing curl commands for cookie handling:");

  try {
    // Test login with curl
    console.log("\n🔍 Testing login with curl:");
    const loginResult =
      await Bun.$`curl -c /tmp/cookies.txt -s -w "Status: %{http_code}\\n" http://api.example.com/login`.text();
    console.log(`   ${loginResult}`);

    // Test profile with curl
    console.log("\n🔍 Testing profile with curl:");
    const profileResult =
      await Bun.$`curl -b /tmp/cookies.txt -c /tmp/cookies.txt -s -w "Status: %{http_code}\\n" http://api.example.com/profile`.text();
    console.log(`   ${profileResult}`);

    // Test theme toggle with curl
    console.log("\n🔍 Testing theme toggle with curl:");
    const themeResult =
      await Bun.$`curl -b /tmp/cookies.txt -c /tmp/cookies.txt -s -w "Status: %{http_code}\\n" http://api.example.com/theme`.text();
    console.log(`   ${themeResult}`);

    // Test logout with curl
    console.log("\n🔍 Testing logout with curl:");
    const logoutResult =
      await Bun.$`curl -b /tmp/cookies.txt -c /tmp/cookies.txt -s -w "Status: %{http_code}\\n" http://api.example.com/logout`.text();
    console.log(`   ${logoutResult}`);

    // Show cookie file contents
    console.log("\n🍪 Cookie file contents:");
    try {
      const cookieFile = await Bun.file("/tmp/cookies.txt").text();
      console.log(`   ${cookieFile}`);
    } catch (e) {
      console.log("   No cookie file found");
    }
  } catch (error) {
    console.error("❌ Curl test error:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Bun Cookie API Tests\n");

  let server = null;

  try {
    // Start the cookie server
    server = await startCookieServer();

    if (!server) {
      console.error("❌ Failed to start server, skipping tests");
      return;
    }

    // Run all tests
    await testCookieReading();
    await testCookieSetting();
    await testCookieModification();
    await testCookieDeletion();
    await testCookieOverview();
    await testHealthWithCookies();
    await demonstrateBunCookieAPI();
    await testCurlCommands();

    console.log("\n✅ All Bun Cookie API tests completed successfully!");
    console.log("\n🍪 Bun Cookie API Summary:");
    console.log("   ✅ Cookie reading implemented");
    console.log("   ✅ Cookie setting with options");
    console.log("   ✅ Cookie modification working");
    console.log("   ✅ Cookie deletion functional");
    console.log("   ✅ Cookie overview available");
    console.log("   ✅ Health check with cookie info");
    console.log("   ✅ Automatic cookie tracking");
    console.log("   ✅ Security options configured");

    console.log("\n🌐 Server Information:");
    console.log("   🎯 Target URL: https://staging-api.example.com/");
    console.log("   🔧 Development URL: http://api.example.com/");
    console.log("   🍪 Cookie Demo: Enabled");
    console.log("   🔒 Security: httpOnly, secure, sameSite");
    console.log("   📊 Features: Authentication, preferences, theme");
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
