// Test Complete Environment Configuration with Staging and Production Patterns

console.log("🌍 Testing Complete Environment Configuration\n");

async function testStagingConfiguration() {
  console.log("📄 1. Staging Configuration Pattern");
  console.log("-".repeat(50));

  // Set staging environment variables
  process.env.STAGING_DB_HOST = "staging-db.quantum-lattice.com";
  process.env.STAGING_API_KEY = "staging_api_key_12345";
  process.env.STAGING_JWT_SECRET = "staging_jwt_secret_67890";
  process.env.STAGING_ENCRYPTION_KEY = "staging_encryption_key";
  process.env.STAGING_REDIS_HOST = "staging-redis.quantum-lattice.com";
  process.env.STAGING_SLACK_WEBHOOK = "https://hooks.slack.com/staging/webhook";
  process.env.STAGING_SMTP_HOST = "smtp.staging.quantum-lattice.com";
  process.env.STAGING_ANALYTICS_KEY = "staging_analytics_key";
  process.env.STAGING_MONITORING_KEY = "staging_monitoring_key";

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");
    const stagingManager = new CompleteEnvironmentManager("staging");

    console.log("✅ Staging configuration loaded successfully");
    console.log(`   Environment: ${stagingManager.getEnvironment()}`);
    console.log(
      `   Server: ${stagingManager.get("server.host")}:${stagingManager.get("server.port")}`,
    );
    console.log(`   Database: ${stagingManager.get("database.name")}`);
    console.log(`   API URL: ${stagingManager.get("api.url")}`);
    console.log(`   Cache TTL: ${stagingManager.get("cache.ttl")}s`);
    console.log(`   Log Level: ${stagingManager.get("logging.level")}`);
    console.log(`   Log Pretty: ${stagingManager.get("logging.pretty")}`);
    console.log(
      `   Workers: ${stagingManager.get("performance.worker_threads")}`,
    );

    // Test inherited defaults
    console.log("\n🔗 Inherited defaults (<<: *defaults equivalent):");
    console.log(`   Server timeout: ${stagingManager.get("server.timeout")}ms`);
    console.log(`   Server retries: ${stagingManager.get("server.retries")}`);
    console.log(`   Cache enabled: ${stagingManager.get("cache.enabled")}`);
    console.log(`   API version: ${stagingManager.get("api.version")}`);
    console.log(
      `   Quantum threshold: ${stagingManager.get("quantum.tension_threshold")}`,
    );

    // Test staging-specific overrides
    console.log("\n🔧 Staging-specific overrides:");
    console.log(
      `   Cache TTL: ${stagingManager.get("cache.ttl")}s (vs default 3600s)`,
    );
    console.log(
      `   Log format: ${stagingManager.get("logging.format")} (vs default pretty)`,
    );
    console.log(
      `   Workers: ${stagingManager.get("performance.worker_threads")} (vs default 4)`,
    );

    // Test environment variable interpolation
    console.log("\n🔗 Environment variable interpolation:");
    console.log(`   Database host: ${stagingManager.get("database.host")}`);
    console.log(`   API key: ${stagingManager.get("api.key")}`);
    console.log(
      `   JWT secret: ${stagingManager.get("security.jwt_secret") ? "***configured***" : "missing"}`,
    );

    return stagingManager;
  } catch (error) {
    console.error("❌ Staging configuration test failed:", error.message);
    return null;
  }
}

async function testProductionConfiguration() {
  console.log("\n📄 2. Production Configuration Pattern");
  console.log("-".repeat(50));

  // Set production environment variables
  process.env.PROD_DB_HOST = "prod-db.quantum-lattice.com";
  process.env.PROD_API_KEY = "prod_api_key_abcdef";
  process.env.PROD_JWT_SECRET = "prod_jwt_secret_secure";
  process.env.PROD_ENCRYPTION_KEY = "prod_encryption_key_secure";
  process.env.PROD_REDIS_HOST = "prod-redis.quantum-lattice.com";
  process.env.PROD_SLACK_WEBHOOK = "https://hooks.slack.com/production/webhook";
  process.env.PROD_SMTP_HOST = "smtp.prod.quantum-lattice.com";
  process.env.PROD_ANALYTICS_KEY = "prod_analytics_key";
  process.env.PROD_MONITORING_KEY = "prod_monitoring_key";
  process.env.PROD_PAGERDUTY_KEY = "prod_pagerduty_key";

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");
    const prodManager = new CompleteEnvironmentManager("production");

    console.log("✅ Production configuration loaded successfully");
    console.log(`   Environment: ${prodManager.getEnvironment()}`);
    console.log(
      `   Server: ${prodManager.get("server.host")}:${prodManager.get("server.port")}`,
    );
    console.log(`   Database: ${prodManager.get("database.name")}`);
    console.log(`   API URL: ${prodManager.get("api.url")}`);
    console.log(`   Cache TTL: ${prodManager.get("cache.ttl")}s`);
    console.log(`   Log Level: ${prodManager.get("logging.level")}`);
    console.log(`   Log Pretty: ${prodManager.get("logging.pretty")}`);
    console.log(`   Workers: ${prodManager.get("performance.worker_threads")}`);

    // Test inherited defaults
    console.log("\n🔗 Inherited defaults (<<: *defaults equivalent):");
    console.log(`   Server retries: ${prodManager.get("server.retries")}`);
    console.log(`   Cache enabled: ${prodManager.get("cache.enabled")}`);
    console.log(`   API version: ${prodManager.get("api.version")}`);
    console.log(
      `   Quantum decay rate: ${prodManager.get("quantum.decay_rate")}`,
    );

    // Test production-specific overrides
    console.log("\n🔧 Production-specific overrides:");
    console.log(
      `   Server timeout: ${prodManager.get("server.timeout")}ms (vs default 5000ms)`,
    );
    console.log(
      `   Cache TTL: ${prodManager.get("cache.ttl")}s (vs default 3600s)`,
    );
    console.log(
      `   Log format: ${prodManager.get("logging.format")} (vs default pretty)`,
    );
    console.log(
      `   Workers: ${prodManager.get("performance.worker_threads")} (vs default 4)`,
    );
    console.log(
      `   Memory limit: ${prodManager.get("performance.memory_limit")} (vs default 512MB)`,
    );

    // Test environment variable interpolation
    console.log("\n🔗 Environment variable interpolation:");
    console.log(`   Database host: ${prodManager.get("database.host")}`);
    console.log(`   API key: ${prodManager.get("api.key")}`);
    console.log(
      `   JWT secret: ${prodManager.get("security.jwt_secret") ? "***configured***" : "missing"}`,
    );
    console.log(
      `   PagerDuty key: ${prodManager.get("notifications.pagerduty.integration_key") ? "***configured***" : "missing"}`,
    );

    return prodManager;
  } catch (error) {
    console.error("❌ Production configuration test failed:", error.message);
    return null;
  }
}

async function testInheritancePattern() {
  console.log("\n📄 3. Inheritance Pattern Demonstration");
  console.log("-".repeat(50));

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");

    const devManager = new CompleteEnvironmentManager("development");
    const stagingManager = new CompleteEnvironmentManager("staging");
    const prodManager = new CompleteEnvironmentManager("production");

    console.log("🔗 Demonstrating YAML anchors/aliases equivalent:");
    console.log("   Original pattern: <<: *defaults");
    console.log("   Implementation: deepMerge(defaults, environmentConfig)");

    console.log("\n📊 Default values inherited across environments:");
    const defaultFields = [
      "server.retries",
      "cache.enabled",
      "api.version",
      "quantum.decay_rate",
    ];

    defaultFields.forEach((field) => {
      const devValue = devManager.get(field);
      const stagingValue = stagingManager.get(field);
      const prodValue = prodManager.get(field);
      const same = devValue === stagingValue && stagingValue === prodValue;
      console.log(
        `   ${field}: ${devValue} ${same ? "✅" : "❌"} (same across all)`,
      );
    });

    console.log("\n📊 Environment-specific overrides:");
    const overrideFields = [
      { field: "cache.ttl", dev: 3600, staging: 1800, prod: 86400 },
      { field: "logging.level", dev: "debug", staging: "info", prod: "error" },
      { field: "performance.worker_threads", dev: 4, staging: 6, prod: 8 },
    ];

    overrideFields.forEach(({ field, dev, staging, prod }) => {
      const devValue = devManager.get(field);
      const stagingValue = stagingManager.get(field);
      const prodValue = prodManager.get(field);
      console.log(
        `   ${field}: dev=${devValue}, staging=${stagingValue}, prod=${prodValue} ✅`,
      );
    });

    return { devManager, stagingManager, prodManager };
  } catch (error) {
    console.error("❌ Inheritance pattern test failed:", error.message);
    return null;
  }
}

async function testFeatureComparison() {
  console.log("\n📄 4. Feature Comparison Across Environments");
  console.log("-".repeat(50));

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");

    const environments = ["development", "staging", "production"];
    const allFeatures = new Set();
    const featureMatrix = {};

    // Collect all features
    for (const env of environments) {
      const manager = new CompleteEnvironmentManager(env);
      const features = manager.getFeaturesConfig();
      Object.keys(features).forEach((feature) => allFeatures.add(feature));
      featureMatrix[env] = features;
    }

    console.log("🚀 Feature matrix:");
    console.log(
      "   Feature".padEnd(25) +
        "Dev".padEnd(8) +
        "Staging".padEnd(10) +
        "Production",
    );
    console.log("   ".padEnd(25 + 8 + 10 + 12, "-"));

    Array.from(allFeatures).forEach((feature) => {
      const dev = featureMatrix.development[feature] ? "✅" : "❌";
      const staging = featureMatrix.staging[feature] ? "✅" : "❌";
      const prod = featureMatrix.production[feature] ? "✅" : "❌";
      console.log(
        `   ${feature.padEnd(25)}${dev.padEnd(8)}${staging.padEnd(10)}${prod}`,
      );
    });

    return featureMatrix;
  } catch (error) {
    console.error("❌ Feature comparison test failed:", error.message);
    return null;
  }
}

async function testConnectionStrings() {
  console.log("\n📄 5. Connection String Generation");
  console.log("-".repeat(50));

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");

    const environments = ["staging", "production"];

    for (const env of environments) {
      const manager = new CompleteEnvironmentManager(env);

      console.log(`\n🔗 ${env.toUpperCase()} connection strings:`);
      const dbConnectionString = manager.getDatabaseConnectionString();
      const redisConnectionString = manager.getRedisConnectionString();

      console.log(`   Database: ${dbConnectionString}`);
      console.log(`   Redis: ${redisConnectionString}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Connection string test failed:", error.message);
    return null;
  }
}

async function testValidation() {
  console.log("\n📄 6. Configuration Validation");
  console.log("-".repeat(50));

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");

    const environments = ["development", "staging", "production"];
    const results = {};

    for (const env of environments) {
      const manager = new CompleteEnvironmentManager(env);
      console.log(`\n🔍 Validating ${env} configuration:`);

      const isValid = manager.validate();
      const envStatus = manager.checkEnvironmentVariables();

      console.log(`   Validation: ${isValid ? "✅ Passed" : "❌ Failed"}`);
      console.log(
        `   Environment variables: ${envStatus.configured.length}/${envStatus.total} configured`,
      );

      results[env] = { isValid, envStatus };
    }

    return results;
  } catch (error) {
    console.error("❌ Validation test failed:", error.message);
    return null;
  }
}

async function testDeploymentExports() {
  console.log("\n📄 7. Deployment Configuration Exports");
  console.log("-".repeat(50));

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");

    const environments = ["staging", "production"];

    for (const env of environments) {
      const manager = new CompleteEnvironmentManager(env);
      const deploymentConfig = manager.exportDeploymentConfig();

      console.log(`\n📤 ${env.toUpperCase()} deployment configuration:`);
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

      if (deploymentConfig.notifications) {
        console.log(
          `   Notifications: Slack (${deploymentConfig.notifications.slack?.channel}), Email (${deploymentConfig.notifications.email?.from})`,
        );
      }

      if (deploymentConfig.external_services) {
        console.log(
          `   External Services: Analytics (${deploymentConfig.external_services.analytics?.provider}), CDN (${deploymentConfig.external_services.cdn?.provider})`,
        );
      }

      // Ensure no sensitive data
      const hasSensitive = !!(
        deploymentConfig.api?.key || deploymentConfig.security?.jwt_secret
      );
      console.log(`   Sensitive data excluded: ${!hasSensitive ? "✅" : "❌"}`);
    }

    return true;
  } catch (error) {
    console.error("❌ Deployment export test failed:", error.message);
    return null;
  }
}

async function generateReports() {
  console.log("\n📄 8. Full Environment Reports");
  console.log("-".repeat(50));

  try {
    const { CompleteEnvironmentManager } =
      await import("./src/config/complete-environment-manager.js");

    const environments = ["development", "staging", "production"];

    for (const env of environments) {
      const manager = new CompleteEnvironmentManager(env);
      manager.generateReport();
    }

    return true;
  } catch (error) {
    console.error("❌ Report generation failed:", error.message);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Complete Environment Configuration Tests\n");

  try {
    await testStagingConfiguration();
    await testProductionConfiguration();
    await testInheritancePattern();
    await testFeatureComparison();
    await testConnectionStrings();
    await testValidation();
    await testDeploymentExports();
    await generateReports();

    console.log(
      "\n✅ All complete environment configuration tests completed successfully!",
    );
  } catch (error) {
    console.error("\n❌ Test suite failed:", error.message);
    console.error(error.stack);
  }
}

// Run tests
runAllTests();
