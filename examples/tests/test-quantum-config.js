// Test Quantum Configuration with Anchors and Aliases

console.log("⚛️ Testing Quantum Configuration with YAML Anchors & Aliases\n");

async function testEnvironmentConfigs() {
  console.log("📄 1. Environment Configuration Testing");
  console.log("-".repeat(50));

  const environments = ["development", "staging", "production", "testing"];

  for (const env of environments) {
    console.log(`\n🔹 Testing ${env} environment:`);

    // Set environment
    process.env.NODE_ENV = env;

    // Set environment variables for staging/production
    if (env === "staging") {
      process.env.STAGING_DB_HOST = "staging-db.quantum-lattice.com";
      process.env.STAGING_API_KEY = "staging_key_12345";
      process.env.STAGING_JWT_SECRET = "staging_jwt_secret";
    }

    if (env === "production") {
      process.env.PROD_DB_HOST = "prod-db.quantum-lattice.com";
      process.env.PROD_API_KEY = "prod_key_67890";
      process.env.PROD_JWT_SECRET = "prod_jwt_secret";
    }

    // Import and test configuration
    const { QuantumConfigManager } =
      await import("./src/config/quantum-config-manager.ts");
    const config = new QuantumConfigManager();

    console.log(`   Environment: ${config.getEnvironment()}`);
    console.log(
      `   Server: ${config.get("server.host")}:${config.get("server.port")}`,
    );
    console.log(`   Database: ${config.get("database.name")}`);
    console.log(`   API URL: ${config.get("api.url")}`);
    console.log(`   Cache TTL: ${config.get("cache.ttl")}s`);
    console.log(`   Log Level: ${config.get("logging.level")}`);
    console.log(`   SIMD Enabled: ${config.get("performance.simd_enabled")}`);
    console.log(`   Workers: ${config.get("performance.worker_threads")}`);
    console.log(
      `   Quantum Threshold: ${config.get("quantum.tension_threshold")}`,
    );

    // Test features
    const features = config.getFeaturesConfig();
    const enabledFeatures = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name);
    console.log(`   Features: ${enabledFeatures.join(", ") || "None"}`);

    // Test API endpoints
    const endpoints = config.get("api.endpoints", []);
    console.log(`   API Endpoints: ${endpoints.join(", ") || "None"}`);
  }
}

async function testAnchorsAndAliases() {
  console.log("\n📄 2. YAML Anchors and Aliases Testing");
  console.log("-".repeat(50));

  process.env.NODE_ENV = "development";
  const { QuantumConfigManager } =
    await import("./src/config/quantum-config-manager.ts");
  const config = new QuantumConfigManager();

  console.log("🔗 Testing inherited properties from defaults:");
  console.log(
    `   Server timeout (from defaults): ${config.get("server.timeout")}ms`,
  );
  console.log(
    `   Server retries (from defaults): ${config.get("server.retries")}`,
  );
  console.log(
    `   Database port (from defaults): ${config.get("database.port")}`,
  );
  console.log(
    `   Cache enabled (from defaults): ${config.get("cache.enabled")}`,
  );
  console.log(
    `   Security session timeout (from defaults): ${config.get("security.session_timeout")}s`,
  );
  console.log(
    `   Performance SIMD (from defaults): ${config.get("performance.simd_enabled")}`,
  );
  console.log(
    `   Quantum decay rate (from defaults): ${config.get("quantum.decay_rate")}`,
  );

  console.log("\n🔧 Testing overridden properties:");
  console.log(`   Development API key: ${config.get("api.key")}`);
  console.log(`   Development log format: ${config.get("logging.format")}`);
  console.log(
    `   Development memory limit: ${config.get("performance.memory_limit")}`,
  );
}

async function testEnvironmentInterpolation() {
  console.log("\n📄 3. Environment Variable Interpolation");
  console.log("-".repeat(50));

  // Test staging environment with variables
  process.env.NODE_ENV = "staging";
  process.env.STAGING_DB_HOST = "staging-db.example.com";
  process.env.STAGING_API_KEY = "interpolated_staging_key";
  process.env.STAGING_JWT_SECRET = "interpolated_jwt_secret";

  const { QuantumConfigManager } =
    await import("./src/config/quantum-config-manager.ts");
  const config = new QuantumConfigManager();

  console.log("🔗 Interpolated values in staging:");
  console.log(`   Database host: ${config.get("database.host")}`);
  console.log(`   API key: ${config.get("api.key")}`);
  console.log(
    `   JWT secret: ${config.get("security.jwt_secret") ? "***configured***" : "missing"}`,
  );

  // Test production environment
  process.env.NODE_ENV = "production";
  process.env.PROD_DB_HOST = "prod-db.example.com";
  process.env.PROD_API_KEY = "interpolated_prod_key";
  process.env.PROD_JWT_SECRET = "interpolated_prod_jwt_secret";

  const prodConfig = new QuantumConfigManager();

  console.log("\n🔗 Interpolated values in production:");
  console.log(`   Database host: ${prodConfig.get("database.host")}`);
  console.log(`   API key: ${prodConfig.get("api.key")}`);
  console.log(
    `   JWT secret: ${prodConfig.get("security.jwt_secret") ? "***configured***" : "missing"}`,
  );
}

async function testQuantumFeatures() {
  console.log("\n📄 4. Quantum-Specific Configuration");
  console.log("-".repeat(50));

  const environments = ["development", "staging", "production"];

  for (const env of environments) {
    process.env.NODE_ENV = env;

    const { QuantumConfigManager } =
      await import("./src/config/quantum-config-manager.ts");
    const config = new QuantumConfigManager();

    console.log(`\n⚛️  Quantum config for ${env}:`);
    console.log(
      `   Tension threshold: ${config.get("quantum.tension_threshold")}`,
    );
    console.log(`   Decay rate: ${config.get("quantum.decay_rate")}`);
    console.log(
      `   Health check interval: ${config.get("quantum.health_check_interval")}ms`,
    );

    // Environment-specific quantum settings
    if (env === "development") {
      console.log(
        `   Simulation mode: ${config.get("quantum.simulation_mode")}`,
      );
      console.log(
        `   Debug visualization: ${config.get("quantum.debug_visualization")}`,
      );
    } else if (env === "staging") {
      console.log(
        `   Analytics enabled: ${config.get("quantum.analytics_enabled")}`,
      );
    } else if (env === "production") {
      console.log(
        `   High availability: ${config.get("quantum.high_availability")}`,
      );
      console.log(
        `   Disaster recovery: ${config.get("quantum.disaster_recovery")}`,
      );
    }
  }
}

async function testConfigurationValidation() {
  console.log("\n📄 5. Configuration Validation");
  console.log("-".repeat(50));

  process.env.NODE_ENV = "development";
  const { QuantumConfigManager } =
    await import("./src/config/quantum-config-manager.ts");
  const config = new QuantumConfigManager();

  console.log("🔍 Running configuration validation:");
  const isValid = config.validate();
  console.log(`   Validation result: ${isValid ? "✅ Passed" : "❌ Failed"}`);

  // Test configuration summary
  console.log("\n📊 Configuration summary:");
  const summary = config.getSummary();
  console.log(`   Environment: ${summary.environment}`);
  console.log(
    `   Server config keys: ${Object.keys(summary.server).join(", ")}`,
  );
  console.log(
    `   Database config keys: ${Object.keys(summary.database).join(", ")}`,
  );
  console.log(`   API config keys: ${Object.keys(summary.api).join(", ")}`);
  console.log(
    `   Quantum config keys: ${Object.keys(summary.quantum).join(", ")}`,
  );
}

async function testClientExport() {
  console.log("\n📄 6. Client-Side Configuration Export");
  console.log("-".repeat(50));

  process.env.NODE_ENV = "staging";
  const { QuantumConfigManager } =
    await import("./src/config/quantum-config-manager.ts");
  const config = new QuantumConfigManager();

  console.log("📤 Exporting client-safe configuration:");
  const clientConfig = config.exportClientConfig();

  console.log(`   Environment: ${clientConfig.environment}`);
  console.log(`   API URL: ${clientConfig.api.url}`);
  console.log(`   API Version: ${clientConfig.api.version}`);
  console.log(`   API Endpoints: ${clientConfig.api.endpoints.join(", ")}`);
  console.log(`   Features: ${Object.keys(clientConfig.features).join(", ")}`);
  console.log(
    `   Server: ${clientConfig.server.host}:${clientConfig.server.port}`,
  );
  console.log(
    `   Quantum threshold: ${clientConfig.quantum.tension_threshold}`,
  );

  // Ensure no sensitive data is exported
  const hasSensitiveData = !!(
    clientConfig.api?.key || clientConfig.security?.jwt_secret
  );
  console.log(`   Sensitive data excluded: ${!hasSensitiveData ? "✅" : "❌"}`);
}

async function testHotReloading() {
  console.log("\n📄 7. Hot Reloading Simulation");
  console.log("-".repeat(50));

  process.env.NODE_ENV = "development";
  const { QuantumConfigManager } =
    await import("./src/config/quantum-config-manager.ts");
  const config = new QuantumConfigManager();

  console.log("🔄 Testing configuration reload:");
  console.log(`   Before reload - Log level: ${config.get("logging.level")}`);

  // Simulate reload
  config.reload();

  console.log(`   After reload - Log level: ${config.get("logging.level")}`);
  console.log("   ✅ Reload completed successfully");
}

async function generateFullReport() {
  console.log("\n📄 8. Full Configuration Report");
  console.log("-".repeat(50));

  process.env.NODE_ENV = "development";
  const { QuantumConfigManager } =
    await import("./src/config/quantum-config-manager.ts");
  const config = new QuantumConfigManager();

  config.generateReport();
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Quantum Configuration Tests\n");

  try {
    await testEnvironmentConfigs();
    await testAnchorsAndAliases();
    await testEnvironmentInterpolation();
    await testQuantumFeatures();
    await testConfigurationValidation();
    await testClientExport();
    await testHotReloading();
    await generateFullReport();

    console.log("\n✅ All quantum configuration tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

// Run tests
runAllTests();
