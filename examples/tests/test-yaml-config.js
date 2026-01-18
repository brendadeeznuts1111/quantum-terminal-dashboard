// Test YAML Configuration System

import configManager from "./src/config/config-manager.js";

console.log("🧪 Testing YAML Configuration System\n");

async function testEnvironments() {
  // Test different environments
  const environments = ["development", "staging", "production", "test"];

  for (const env of environments) {
    console.log(`\n🔹 Testing ${env} environment:`);

    // Set environment
    process.env.NODE_ENV = env;

    // Create new config manager instance for this test
    const { ConfigManager } = await import("./src/config/config-manager.js");
    const config = new ConfigManager();

    console.log(`   Environment: ${config.getEnvironment()}`);
    console.log(
      `   Server: ${config.get("server.host")}:${config.get("server.port")}`,
    );
    console.log(`   Database: ${config.get("database.name")}`);
    console.log(`   Cache TTL: ${config.get("cache.ttl")}s`);
    console.log(`   Log Level: ${config.get("logging.level")}`);
    console.log(`   SIMD Enabled: ${config.get("performance.simd_enabled")}`);

    // Test feature flags
    console.log(`   Features:`);
    console.log(
      `     newDashboard: ${config.isFeatureEnabled("newDashboard", "admin@example.com") ? "✅" : "❌"}`,
    );
    console.log(`     darkMode: ${config.getFeatureValue("darkMode")}`);
    console.log(
      `     experimentalAPI: ${config.isFeatureEnabled("experimentalAPI") ? "✅" : "❌"}`,
    );
  }
}

async function testEnvironmentInterpolation() {
  // Test environment variable interpolation
  console.log("\n🔹 Testing Environment Variable Interpolation:");
  process.env.NODE_ENV = "staging";
  process.env.STAGING_DB_HOST = "staging-db.example.com";
  process.env.STAGING_JWT_SECRET = "staging_secret_123";

  const { ConfigManager } = await import("./src/config/config-manager.js");
  const stagingConfig = new ConfigManager();

  console.log(`   Database Host: ${stagingConfig.get("database.host")}`);
  console.log(
    `   JWT Secret: ${stagingConfig.get("security.jwt_secret") ? "***configured***" : "missing"}`,
  );
}

async function testValidation() {
  // Test configuration validation
  console.log("\n🔹 Testing Configuration Validation:");
  const { ConfigManager } = await import("./src/config/config-manager.js");
  const stagingConfig = new ConfigManager();

  const isValid = stagingConfig.validate();
  console.log(`   Valid: ${isValid ? "✅" : "❌"}`);
}

async function testClientExport() {
  // Test client configuration export
  console.log("\n🔹 Testing Client Configuration Export:");
  const { ConfigManager } = await import("./src/config/config-manager.js");
  const stagingConfig = new ConfigManager();

  const clientConfig = stagingConfig.exportClientConfig();
  console.log(`   Client Config Keys: ${Object.keys(clientConfig).join(", ")}`);
  console.log(
    `   Features in Client Config: ${Object.keys(clientConfig.features).join(", ")}`,
  );
}

async function testReload() {
  // Test hot reloading simulation
  console.log("\n🔹 Testing Configuration Reload:");
  const { ConfigManager } = await import("./src/config/config-manager.js");
  const stagingConfig = new ConfigManager();

  console.log("   Before reload:", stagingConfig.get("logging.level"));
  stagingConfig.reload();
  console.log("   After reload:", stagingConfig.get("logging.level"));
}

async function generateReport() {
  // Generate full report for development
  console.log("\n🔹 Full Development Configuration Report:");
  process.env.NODE_ENV = "development";
  const { ConfigManager } = await import("./src/config/config-manager.js");
  const devConfig = new ConfigManager();
  devConfig.generateReport();
}

// Run all tests
async function runTests() {
  try {
    await testEnvironments();
    await testEnvironmentInterpolation();
    await testValidation();
    await testClientExport();
    await testReload();
    await generateReport();

    console.log("\n✅ All YAML configuration tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

runTests();
