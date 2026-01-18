// [DOMAIN][CONFIG][YAML][HSL:260,70%,85%][META:{ENVIRONMENT}][CLASS:ConfigManager]{BUN-API}

/**
 * Environment-based Configuration Manager
 * Leverages Bun's built-in YAML support for environment-specific configurations
 */

import configs from "../../config-fixed.yaml";

class ConfigManager {
  constructor() {
    this.environment = process.env.NODE_ENV || "development";
    this.config = null;
    this.interpolatedConfig = null;
    this.loadConfiguration();
  }

  /**
   * Load and interpolate configuration
   */
  loadConfiguration() {
    try {
      // Get environment-specific configuration
      const envConfig = configs[this.environment];

      if (!envConfig) {
        throw new Error(
          `Configuration for environment '${this.environment}' not found`,
        );
      }

      // Interpolate environment variables
      this.interpolatedConfig = this.interpolateEnvVars(envConfig);
      this.config = envConfig;

      console.log(
        `✅ Configuration loaded for environment: ${this.environment}`,
      );
    } catch (error) {
      console.error(`❌ Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recursively interpolate environment variables in configuration values
   */
  interpolateEnvVars(obj) {
    if (typeof obj === "string") {
      return obj.replace(/\$\{([^}]+)\}/g, (_, key) => {
        const envValue = process.env[key];
        if (envValue === undefined) {
          console.warn(`⚠️ Environment variable '${key}' not found`);
          return "";
        }
        return envValue;
      });
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
   * Get cache configuration
   */
  getCacheConfig() {
    return this.get("cache", {});
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.get("security", {});
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return this.get("performance", {});
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.get("logging", {});
  }

  /**
   * Get features configuration
   */
  getFeaturesConfig() {
    return this.get("features", {});
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName, userEmail = null) {
    const features = this.getFeaturesConfig();
    const feature = features[featureName];

    if (!feature || !feature.enabled) {
      return false;
    }

    // Check rollout percentage
    if (
      feature.rolloutPercentage !== undefined &&
      feature.rolloutPercentage < 100
    ) {
      const hash = this.hashCode(userEmail || "anonymous");
      if (hash % 100 >= feature.rolloutPercentage) {
        return false;
      }
    }

    // Check allowed users
    if (feature.allowedUsers && userEmail) {
      return feature.allowedUsers.includes(userEmail);
    }

    return true;
  }

  /**
   * Get feature value
   */
  getFeatureValue(featureName, defaultValue = null) {
    if (!this.isFeatureEnabled(featureName)) {
      return defaultValue;
    }

    const features = this.getFeaturesConfig();
    const feature = features[featureName];

    switch (featureName) {
      case "darkMode":
        return this.getDarkModeValue(feature);
      case "experimentalAPI":
        return feature.endpoints || [];
      default:
        return feature.value || defaultValue;
    }
  }

  /**
   * Get dark mode value with user preference support
   */
  getDarkModeValue(feature, userPreference = null) {
    if (userPreference && userPreference !== "auto") {
      return userPreference;
    }

    if (feature.default === "auto") {
      const hour = new Date().getHours();
      return hour >= 18 || hour < 6 ? "dark" : "light";
    }

    return feature.default;
  }

  /**
   * Simple hash function for consistent rollouts
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get all enabled features for user
   */
  getEnabledFeatures(userEmail = null) {
    const features = this.getFeaturesConfig();
    const enabled = [];

    for (const [name, feature] of Object.entries(features)) {
      if (this.isFeatureEnabled(name, userEmail)) {
        enabled.push({
          name,
          ...feature,
          value: this.getFeatureValue(name),
        });
      }
    }

    return enabled;
  }

  /**
   * Get current environment
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Check if running in development
   */
  isDevelopment() {
    return this.environment === "development";
  }

  /**
   * Check if running in production
   */
  isProduction() {
    return this.environment === "production";
  }

  /**
   * Check if running in test
   */
  isTest() {
    return this.environment === "test";
  }

  /**
   * Reload configuration (useful for hot reloading)
   */
  reload() {
    console.log("🔄 Reloading configuration...");
    this.loadConfiguration();
  }

  /**
   * Generate configuration report
   */
  generateReport() {
    console.log("\n🔧 CONFIGURATION REPORT");
    console.log("=".repeat(60));

    console.log(`\n📊 Environment: ${this.environment}`);
    console.log(
      `🖥️  Server: ${this.get("server.host")}:${this.get("server.port")}`,
    );
    console.log(
      `🗄️  Database: ${this.get("database.host")}:${this.get("database.port")}/${this.get("database.name")}`,
    );
    console.log(
      `💾 Cache: ${this.get("cache.enabled") ? "Enabled" : "Disabled"} (${this.get("cache.provider")})`,
    );
    console.log(
      `🔒 Security: JWT configured (${this.get("security.jwt_secret") ? "✅" : "❌"})`,
    );
    console.log(
      `⚡ Performance: SIMD ${this.get("performance.simd_enabled") ? "Enabled" : "Disabled"}`,
    );
    console.log(
      `📝 Logging: Level ${this.get("logging.level")} (${this.get("logging.format")})`,
    );

    console.log(`\n🚀 Enabled Features:`);
    const enabledFeatures = this.getEnabledFeatures();
    if (enabledFeatures.length === 0) {
      console.log("   No features enabled");
    } else {
      enabledFeatures.forEach((feature) => {
        const rollout = feature.rolloutPercentage
          ? ` (${feature.rolloutPercentage}%)`
          : "";
        console.log(`   ✅ ${feature.name}${rollout}`);
      });
    }

    console.log(`\n🔧 Full Configuration:`);
    console.log(JSON.stringify(this.interpolatedConfig, null, 2));

    return this.interpolatedConfig;
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
      "security.jwt_secret",
    ];

    for (const path of requiredPaths) {
      if (!this.get(path)) {
        errors.push(`Missing required configuration: ${path}`);
      }
    }

    // Validate port numbers
    const serverPort = this.get("server.port");
    if (
      serverPort &&
      (isNaN(serverPort) || serverPort < 1 || serverPort > 65535)
    ) {
      errors.push("Invalid server port number");
    }

    const dbPort = this.get("database.port");
    if (dbPort && (isNaN(dbPort) || dbPort < 1 || dbPort > 65535)) {
      errors.push("Invalid database port number");
    }

    if (errors.length > 0) {
      console.error("❌ Configuration validation failed:");
      errors.forEach((error) => console.error(`   - ${error}`));
      return false;
    }

    console.log("✅ Configuration validation passed");
    return true;
  }

  /**
   * Export configuration for client-side (safe values only)
   */
  exportClientConfig() {
    const clientConfig = {
      environment: this.environment,
      features: {},
      server: {
        host: this.get("server.host"),
        port: this.get("server.port"),
      },
    };

    // Only include non-sensitive features
    const features = this.getFeaturesConfig();
    for (const [name, feature] of Object.entries(features)) {
      if (!feature.requiresAuth && !feature.private) {
        clientConfig.features[name] = {
          enabled: this.isFeatureEnabled(name),
          value: this.getFeatureValue(name),
        };
      }
    }

    return clientConfig;
  }
}

// Create singleton instance
const configManager = new ConfigManager();

// Export as default and named export
export default configManager;
export { ConfigManager };

// Hot reloading support (optional)
if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
  // Watch for configuration changes in development
  process.on("SIGUSR2", () => {
    console.log("📡 Received configuration reload signal");
    configManager.reload();
  });
}
