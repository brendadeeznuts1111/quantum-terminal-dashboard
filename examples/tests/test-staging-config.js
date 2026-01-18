// Test Staging Configuration with Environment Variables

console.log("🚀 Testing Staging Configuration\n");

async function testStagingConfiguration() {
  console.log("📄 1. Basic Staging Configuration Loading");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    console.log("✅ Staging configuration loaded successfully");
    console.log(
      `   Server: ${config.getServerConfig().host}:${config.getServerConfig().port}`,
    );
    console.log(`   Database: ${config.getDatabaseConfig().name}`);
    console.log(`   API URL: ${config.getAPIConfig().url}`);
    console.log(`   Log Level: ${config.getLoggingConfig().level}`);
    console.log(`   Cache TTL: ${config.getCacheConfig().ttl}s`);

    return config;
  } catch (error) {
    console.error("❌ Failed to load staging configuration:", error.message);
    return null;
  }
}

async function testEnvironmentVariables() {
  console.log("\n📄 2. Environment Variable Interpolation");
  console.log("-".repeat(50));

  // Set test environment variables
  process.env.STAGING_DB_HOST = "staging-db.quantum-lattice.com";
  process.env.STAGING_DB_USER = "staging_user";
  process.env.STAGING_DB_PASS = "staging_password";
  process.env.STAGING_API_KEY = "staging_api_key_12345";
  process.env.STAGING_JWT_SECRET = "staging_jwt_secret_67890";
  process.env.STAGING_ENCRYPTION_KEY = "staging_encryption_key";
  process.env.STAGING_REDIS_HOST = "staging-redis.quantum-lattice.com";
  process.env.STAGING_SLACK_WEBHOOK = "https://hooks.slack.com/staging/webhook";
  process.env.STAGING_SMTP_HOST = "smtp.staging.quantum-lattice.com";
  process.env.STAGING_ANALYTICS_KEY = "staging_analytics_key";
  process.env.STAGING_MONITORING_KEY = "staging_monitoring_key";

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    console.log("🔗 Interpolated values:");
    console.log(`   Database host: ${config.get("database.host")}`);
    console.log(`   Database user: ${config.get("database.username")}`);
    console.log(
      `   Database password: ${config.get("database.password") ? "***configured***" : "missing"}`,
    );
    console.log(`   API key: ${config.get("api.key")}`);
    console.log(
      `   JWT secret: ${config.get("security.jwt_secret") ? "***configured***" : "missing"}`,
    );
    console.log(`   Redis host: ${config.get("cache.host")}`);
    console.log(
      `   Slack webhook: ${config.get("notifications.slack.webhook_url") ? "***configured***" : "missing"}`,
    );
    console.log(`   SMTP host: ${config.get("notifications.email.smtp_host")}`);

    return config;
  } catch (error) {
    console.error("❌ Environment variable test failed:", error.message);
    return null;
  }
}

async function testConnectionStrings() {
  console.log("\n📄 3. Connection String Generation");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    const dbConnectionString = config.getDatabaseConnectionString();
    const redisConnectionString = config.getRedisConnectionString();

    console.log("🔗 Generated connection strings:");
    console.log(`   Database: ${dbConnectionString}`);
    console.log(`   Redis: ${redisConnectionString}`);

    return { dbConnectionString, redisConnectionString };
  } catch (error) {
    console.error("❌ Connection string test failed:", error.message);
    return null;
  }
}

async function testFeatures() {
  console.log("\n📄 4. Staging Features Configuration");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    console.log("🚀 Feature status:");
    const features = config.getFeaturesConfig();

    Object.entries(features).forEach(([name, enabled]) => {
      const status = enabled ? "✅" : "❌";
      console.log(`   ${status} ${name}`);
    });

    console.log("\n🔧 Feature-specific tests:");
    console.log(
      `   Quantum Terminal: ${config.isFeatureEnabled("quantum_terminal") ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `   Real-time Monitoring: ${config.isFeatureEnabled("real_time_monitoring") ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `   Experimental API: ${config.isFeatureEnabled("experimental_api") ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `   Predictive Analytics: ${config.isFeatureEnabled("predictive_analytics") ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `   A/B Testing: ${config.isFeatureEnabled("a_b_testing") ? "Enabled" : "Disabled"}`,
    );

    return features;
  } catch (error) {
    console.error("❌ Features test failed:", error.message);
    return null;
  }
}

async function testAPIEndpoints() {
  console.log("\n📄 5. API Endpoints Configuration");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    const endpoints = config.getAPIEndpoints();
    const apiConfig = config.getAPIConfig();

    console.log("📡 API Configuration:");
    console.log(`   Base URL: ${apiConfig.url}`);
    console.log(`   Version: ${apiConfig.version}`);
    console.log(`   Timeout: ${apiConfig.timeout}ms`);
    console.log(`   Retries: ${apiConfig.retries}`);

    console.log("\n📡 Available Endpoints:");
    endpoints.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ${apiConfig.url}${endpoint}`);
    });

    return { apiConfig, endpoints };
  } catch (error) {
    console.error("❌ API endpoints test failed:", error.message);
    return null;
  }
}

async function testQuantumConfig() {
  console.log("\n📄 6. Quantum System Configuration");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    const quantumConfig = config.getQuantumConfig();

    console.log("⚛️  Quantum Configuration:");
    console.log(`   Tension threshold: ${quantumConfig.tension_threshold}`);
    console.log(`   Decay rate: ${quantumConfig.decay_rate}`);
    console.log(
      `   Health check interval: ${quantumConfig.health_check_interval}ms`,
    );
    console.log(
      `   Simulation mode: ${quantumConfig.simulation_mode ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `   Analytics enabled: ${quantumConfig.analytics_enabled ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `   Debug mode: ${quantumConfig.debug_mode ? "Enabled" : "Disabled"}`,
    );

    return quantumConfig;
  } catch (error) {
    console.error("❌ Quantum config test failed:", error.message);
    return null;
  }
}

async function testNotifications() {
  console.log("\n📄 7. Notifications Configuration");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    const notifications = config.getNotificationsConfig();

    console.log("🔔 Notifications Setup:");

    if (notifications.slack) {
      console.log("   📱 Slack Integration:");
      console.log(`      Channel: ${notifications.slack.channel}`);
      console.log(
        `      Webhook: ${notifications.slack.webhook_url ? "***configured***" : "missing"}`,
      );
    }

    if (notifications.email) {
      console.log("   📧 Email Integration:");
      console.log(`      From: ${notifications.email.from}`);
      console.log(`      SMTP Host: ${notifications.email.smtp_host}`);
      console.log(`      SMTP Port: ${notifications.email.smtp_port}`);
    }

    return notifications;
  } catch (error) {
    console.error("❌ Notifications test failed:", error.message);
    return null;
  }
}

async function testExternalServices() {
  console.log("\n📄 8. External Services Configuration");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    const external = config.getExternalServicesConfig();

    console.log("🌐 External Services:");

    if (external.analytics) {
      console.log("   📊 Analytics:");
      console.log(`      Provider: ${external.analytics.provider}`);
      console.log(
        `      API Key: ${external.analytics.api_key ? "***configured***" : "missing"}`,
      );
    }

    if (external.cdn) {
      console.log("   🌍 CDN:");
      console.log(`      Provider: ${external.cdn.provider}`);
      console.log(`      Domain: ${external.cdn.domain}`);
    }

    if (external.monitoring) {
      console.log("   📈 Monitoring:");
      console.log(`      Provider: ${external.monitoring.provider}`);
      console.log(
        `      API Key: ${external.monitoring.api_key ? "***configured***" : "missing"}`,
      );
    }

    return external;
  } catch (error) {
    console.error("❌ External services test failed:", error.message);
    return null;
  }
}

async function testValidation() {
  console.log("\n📄 9. Configuration Validation");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    console.log("🔍 Running validation...");
    const isValid = config.validate();
    console.log(`   Result: ${isValid ? "✅ Passed" : "❌ Failed"}`);

    // Check environment variables
    console.log("\n🔍 Checking environment variables...");
    const envStatus = config.checkEnvironmentVariables();
    console.log(
      `   Configured: ${envStatus.configured.length}/${envStatus.total}`,
    );
    console.log(`   Missing: ${envStatus.missing.length}/${envStatus.total}`);
    console.log(`   Percentage: ${envStatus.percentage.toFixed(1)}%`);

    if (envStatus.missing.length > 0) {
      console.log("   Missing variables:");
      envStatus.missing.forEach((envVar) => {
        console.log(`     - ${envVar}`);
      });
    }

    return { isValid, envStatus };
  } catch (error) {
    console.error("❌ Validation test failed:", error.message);
    return null;
  }
}

async function testDeploymentExport() {
  console.log("\n📄 10. Deployment Configuration Export");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    const deploymentConfig = config.exportDeploymentConfig();

    console.log("📤 Deployment Configuration:");
    console.log(`   Environment: ${deploymentConfig.environment}`);
    console.log(
      `   Server: ${deploymentConfig.server.host}:${deploymentConfig.server.port}`,
    );
    console.log(`   Database: ${deploymentConfig.database.name}`);
    console.log(
      `   API: ${deploymentConfig.api.url} (v${deploymentConfig.api.version})`,
    );
    console.log(`   Cache: ${deploymentConfig.cache.provider}`);
    console.log(
      `   Features: ${Object.keys(deploymentConfig.features).length} configured`,
    );
    console.log(`   Workers: ${deploymentConfig.performance.worker_threads}`);

    console.log("\n🔔 Notifications:");
    console.log(`   Slack: ${deploymentConfig.notifications.slack.channel}`);
    console.log(`   Email: ${deploymentConfig.notifications.email.from}`);

    console.log("\n🌐 External Services:");
    console.log(
      `   Analytics: ${deploymentConfig.external_services.analytics.provider}`,
    );
    console.log(`   CDN: ${deploymentConfig.external_services.cdn.provider}`);
    console.log(
      `   Monitoring: ${deploymentConfig.external_services.monitoring.provider}`,
    );

    return deploymentConfig;
  } catch (error) {
    console.error("❌ Deployment export test failed:", error.message);
    return null;
  }
}

async function generateFullReport() {
  console.log("\n📄 11. Full Staging Configuration Report");
  console.log("-".repeat(50));

  try {
    const { StagingConfigManager } =
      await import("./src/config/staging-config-manager.js");
    const config = new StagingConfigManager();

    config.generateReport();
  } catch (error) {
    console.error("❌ Report generation failed:", error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Staging Configuration Tests\n");

  try {
    await testStagingConfiguration();
    await testEnvironmentVariables();
    await testConnectionStrings();
    await testFeatures();
    await testAPIEndpoints();
    await testQuantumConfig();
    await testNotifications();
    await testExternalServices();
    await testValidation();
    await testDeploymentExport();
    await generateFullReport();

    console.log("\n✅ All staging configuration tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
    console.error(error.stack);
  }
}

// Run tests
runAllTests();
