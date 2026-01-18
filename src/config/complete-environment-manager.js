// [DOMAIN][CONFIG][COMPLETE][HSL:200,70%,85%][META:{ENV-INHERITANCE}][CLASS:CompleteEnvironmentManager]{BUN-API}

/**
 * Complete Environment Configuration Manager
 * Handles staging and production configurations with inheritance patterns
 * Demonstrates the equivalent of YAML anchors/aliases for Bun compatibility
 */

import configs from "./complete-environment-config.yaml";

class CompleteEnvironmentManager {
  constructor(environment = null) {
    this.environment = environment || process.env.NODE_ENV || "development";
    this.config = null;
    this.interpolatedConfig = null;
    this.loadConfiguration();
  }

  /**
   * Load and interpolate configuration for the specified environment
   */
  loadConfiguration() {
    try {
      const envConfig = configs[this.environment];

      if (!envConfig) {
        throw new Error(
          `Configuration for environment '${this.environment}' not found`,
        );
      }

      // Apply inheritance pattern manually (equivalent to YAML anchors/aliases)
      const configWithDefaults = this.applyDefaults(envConfig);

      // Interpolate environment variables
      this.interpolatedConfig = this.interpolateEnvVars(configWithDefaults);
      this.config = configWithDefaults;

      console.log(`✅ ${this.environment} configuration loaded successfully`);
    } catch (error) {
      console.error(
        `❌ Failed to load ${this.environment} configuration: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Apply default values (equivalent to YAML <<: *defaults)
   */
  applyDefaults(envConfig) {
    const defaults = {
      server: {
        timeout: 5000,
        retries: 3,
      },
      database: {
        port: 5432,
        pool_size: 10,
      },
      cache: {
        enabled: true,
        ttl: 3600,
        provider: "redis",
      },
      api: {
        version: "v1",
        timeout: 5000,
        retries: 3,
      },
      security: {
        session_timeout: 86400,
        cors_enabled: true,
      },
      performance: {
        simd_enabled: true,
        worker_threads: 4,
        memory_limit: "512MB",
      },
      quantum: {
        tension_threshold: 0.7,
        decay_rate: 0.02,
        health_check_interval: 30000,
      },
      logging: {
        pretty: true,
        format: "pretty",
        colors: true,
      },
    };

    // Deep merge defaults with environment-specific config
    return this.deepMerge(defaults, envConfig);
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key])
      ) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  /**
   * Recursively interpolate environment variables
   */
  interpolateEnvVars(obj) {
    if (typeof obj === "string") {
      return obj.replace(
        /\$\{([^:}]+)(?::([^}]+))?\}/g,
        (_, key, defaultValue) => {
          const envValue = process.env[key];
          if (envValue === undefined) {
            if (defaultValue !== undefined) {
              console.warn(
                `⚠️ Environment variable '${key}' not found, using default: ${defaultValue}`,
              );
              return defaultValue;
            } else {
              console.warn(
                `⚠️ Environment variable '${key}' not found and no default provided`,
              );
              return "";
            }
          }
          return envValue;
        },
      );
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateEnvVars(item));
    }

    if (typeof obj === "object" && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateEnvVars(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Get configuration value by path
   */
  get(path, defaultValue = undefined) {
    const keys = path.split(".");
    let current = this.interpolatedConfig;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Get server configuration
   */
  getServerConfig() {
    return this.get("server", {});
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return this.get("database", {});
  }

  /**
   * Get API configuration
   */
  getAPIConfig() {
    return this.get("api", {});
  }

  /**
   * Get cache configuration
   */
  getCacheConfig() {
    return this.get("cache", {});
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.get("logging", {});
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.get("security", {});
  }

  /**
   * Get features configuration
   */
  getFeaturesConfig() {
    return this.get("features", {});
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return this.get("performance", {});
  }

  /**
   * Get quantum configuration
   */
  getQuantumConfig() {
    return this.get("quantum", {});
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName) {
    const features = this.getFeaturesConfig();
    return features[featureName] === true;
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Environment helpers
   */
  isDevelopment() {
    return this.environment === "development";
  }

  isStaging() {
    return this.environment === "staging";
  }

  isProduction() {
    return this.environment === "production";
  }

  isTest() {
    return this.environment === "testing";
  }

  /**
   * Get database connection string
   */
  getDatabaseConnectionString() {
    const db = this.getDatabaseConfig();
    const ssl = db.ssl ? "?ssl=true" : "";
    const auth =
      db.username && db.password ? `${db.username}:${db.password}@` : "";
    return `postgresql://${auth}${db.host}:${db.port}/${db.name}${ssl}`;
  }

  /**
   * Get Redis connection string
   */
  getRedisConnectionString() {
    const cache = this.getCacheConfig();
    const auth = cache.password ? `:${cache.password}@` : "";
    return `redis://${auth}${cache.host}:${cache.port}/${cache.db || 0}`;
  }

  /**
   * Validate configuration
   */
  validate() {
    const errors = [];

    // Validate required fields
    const requiredPaths = [
      "server.host",
      "server.port",
      "database.host",
      "database.name",
      "api.url",
      "api.key",
    ];

    for (const path of requiredPaths) {
      const value = this.get(path);
      if (!value || value === "") {
        errors.push(`Missing required configuration: ${path}`);
      }
    }

    // Environment-specific validation
    if (this.isProduction()) {
      const prodSpecific = ["security.jwt_secret", "security.encryption_key"];

      for (const path of prodSpecific) {
        const value = this.get(path);
        if (!value || value === "") {
          errors.push(`Missing production required configuration: ${path}`);
        }
      }
    }

    // Validate quantum configuration
    const tensionThreshold = this.get("quantum.tension_threshold");
    if (
      tensionThreshold &&
      (isNaN(tensionThreshold) || tensionThreshold < 0 || tensionThreshold > 1)
    ) {
      errors.push("Tension threshold must be between 0 and 1");
    }

    if (errors.length > 0) {
      console.error(`❌ ${this.environment} configuration validation failed:`);
      errors.forEach((error) => console.error(`   - ${error}`));
      return false;
    }

    console.log(`✅ ${this.environment} configuration validation passed`);
    return true;
  }

  /**
   * Generate environment-specific report
   */
  generateReport() {
    console.log(`\n🚀 ${this.environment.toUpperCase()} CONFIGURATION REPORT`);
    console.log("=".repeat(60));

    console.log(
      `\n🖥️  Server: ${this.get("server.host")}:${this.get("server.port")}`,
    );
    console.log(
      `🗄️  Database: ${this.get("database.host")}:${this.get("database.port")}/${this.get("database.name")}`,
    );
    console.log(`🌐 API: ${this.get("api.url")} (v${this.get("api.version")})`);
    console.log(
      `💾 Cache: ${this.get("cache.enabled") ? "Enabled" : "Disabled"} (${this.get("cache.provider")})`,
    );
    console.log(
      `🔒 Security: Session timeout ${this.get("security.session_timeout")}s`,
    );
    console.log(
      `⚡ Performance: SIMD ${this.get("performance.simd_enabled") ? "Enabled" : "Disabled"}, ${this.get("performance.worker_threads")} workers`,
    );
    console.log(
      `⚛️  Quantum: Tension threshold ${this.get("quantum.tension_threshold")}, decay rate ${this.get("quantum.decay_rate")}`,
    );
    console.log(
      `📝 Logging: Level ${this.get("logging.level")} (${this.get("logging.format")})`,
    );

    console.log(`\n🚀 Enabled Features:`);
    const features = this.getFeaturesConfig();
    const enabledFeatures = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name);

    if (enabledFeatures.length === 0) {
      console.log("   No features enabled");
    } else {
      enabledFeatures.forEach((feature) => {
        console.log(`   ✅ ${feature}`);
      });
    }

    console.log(`\n📡 API Endpoints:`);
    const endpoints = this.get("api.endpoints", []);
    if (endpoints.length === 0) {
      console.log("   No endpoints configured");
    } else {
      endpoints.forEach((endpoint) => {
        console.log(`   📡 ${endpoint}`);
      });
    }

    // Environment-specific sections
    if (this.isStaging() || this.isProduction()) {
      console.log(`\n🔔 Notifications:`);
      const notifications = this.get("notifications");
      if (notifications?.slack?.channel) {
        console.log(`   📱 Slack: ${notifications.slack.channel}`);
      }
      if (notifications?.email?.from) {
        console.log(`   📧 Email: ${notifications.email.from}`);
      }
      if (this.isProduction() && notifications?.pagerduty?.integration_key) {
        console.log(`   📟 PagerDuty: Configured`);
      }
    }

    if (this.isStaging() || this.isProduction()) {
      console.log(`\n🌐 External Services:`);
      const external = this.get("external_services");
      if (external?.analytics) {
        console.log(`   📊 Analytics: ${external.analytics.provider}`);
      }
      if (external?.cdn) {
        console.log(`   🌍 CDN: ${external.cdn.provider}`);
      }
      if (external?.monitoring) {
        console.log(`   📈 Monitoring: ${external.monitoring.provider}`);
      }
      if (this.isProduction() && external?.backup) {
        console.log(`   💾 Backup: ${external.backup.provider}`);
      }
    }
  }

  /**
   * Export configuration for deployment (safe values only)
   */
  exportDeploymentConfig() {
    const baseConfig = {
      environment: this.environment,
      server: this.getServerConfig(),
      database: {
        host: this.get("database.host"),
        port: this.get("database.port"),
        name: this.get("database.name"),
        ssl: this.get("database.ssl"),
        pool_size: this.get("database.pool_size"),
      },
      api: {
        url: this.get("api.url"),
        version: this.get("api.version"),
        endpoints: this.get("api.endpoints", []),
      },
      cache: this.getCacheConfig(),
      features: this.getFeaturesConfig(),
      performance: this.getPerformanceConfig(),
      quantum: this.getQuantumConfig(),
      logging: this.getLoggingConfig(),
    };

    // Add environment-specific sections
    if (this.isStaging() || this.isProduction()) {
      baseConfig.notifications = {
        slack: { channel: this.get("notifications.slack.channel") },
        email: { from: this.get("notifications.email.from") },
      };

      baseConfig.external_services = {
        analytics: {
          provider: this.get("external_services.analytics.provider"),
        },
        cdn: { provider: this.get("external_services.cdn.provider") },
        monitoring: {
          provider: this.get("external_services.monitoring.provider"),
        },
      };
    }

    if (this.isProduction()) {
      baseConfig.notifications.pagerduty = {
        severity: this.get("notifications.pagerduty.severity"),
      };
      baseConfig.external_services.backup = {
        provider: this.get("external_services.backup.provider"),
      };
    }

    return baseConfig;
  }

  /**
   * Get required environment variables for current environment
   */
  getRequiredEnvironmentVariables() {
    const baseVars = [];

    if (this.isStaging()) {
      baseVars.push(
        "STAGING_DB_HOST",
        "STAGING_DB_USER",
        "STAGING_DB_PASS",
        "STAGING_API_KEY",
        "STAGING_JWT_SECRET",
        "STAGING_ENCRYPTION_KEY",
        "STAGING_REDIS_HOST",
        "STAGING_SLACK_WEBHOOK",
        "STAGING_SMTP_HOST",
        "STAGING_ANALYTICS_KEY",
        "STAGING_MONITORING_KEY",
      );
    } else if (this.isProduction()) {
      baseVars.push(
        "PROD_DB_HOST",
        "PROD_DB_USER",
        "PROD_DB_PASS",
        "PROD_API_KEY",
        "PROD_JWT_SECRET",
        "PROD_ENCRYPTION_KEY",
        "PROD_REDIS_HOST",
        "PROD_SLACK_WEBHOOK",
        "PROD_SMTP_HOST",
        "PROD_ANALYTICS_KEY",
        "PROD_MONITORING_KEY",
        "PROD_PAGERDUTY_KEY",
        "PROD_BACKUP_PROVIDER",
        "PROD_SECURITY_PROVIDER",
      );
    }

    return baseVars;
  }

  /**
   * Check environment variables status
   */
  checkEnvironmentVariables() {
    const required = this.getRequiredEnvironmentVariables();
    const status = {
      configured: [],
      missing: [],
      total: required.length,
    };

    required.forEach((envVar) => {
      if (process.env[envVar]) {
        status.configured.push(envVar);
      } else {
        status.missing.push(envVar);
      }
    });

    status.percentage = (status.configured.length / status.total) * 100;
    return status;
  }

  /**
   * Reload configuration
   */
  reload() {
    console.log(`🔄 Reloading ${this.environment} configuration...`);
    this.loadConfiguration();
  }
}

// Export class and factory function
export { CompleteEnvironmentManager };

export function createEnvironmentManager(environment) {
  return new CompleteEnvironmentManager(environment);
}

// Create default instance
const defaultManager = new CompleteEnvironmentManager();
export default defaultManager;
