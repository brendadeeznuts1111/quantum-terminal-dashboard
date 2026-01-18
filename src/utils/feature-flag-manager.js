// [DOMAIN][FEATURES][FLAGS][HSL:240,70%,85%][META:{CONFIGURATION}][CLASS:FeatureFlagManager]{BUN-API}

/**
 * Feature Flag Management System
 * Controls feature rollouts and experimental features for Quantum System
 */

class FeatureFlagManager {
  constructor(config = {}) {
    this.config = {
      features: {
        newDashboard: {
          enabled: true,
          rolloutPercentage: 50,
          allowedUsers: ["admin@example.com", "beta@example.com"],
          description: "Next-generation dashboard interface",
          version: "2.0.0",
          dependencies: ["modernUI", "enhancedCharts"],
          rolloutStrategy: "gradual",
        },
        experimentalAPI: {
          enabled: false,
          endpoints: ["/api/v2/experimental", "/api/v2/beta"],
          description: "Experimental API endpoints for testing",
          version: "0.1.0",
          dependencies: ["apiGateway"],
          rolloutStrategy: "opt-in",
          requiresAuth: true,
        },
        darkMode: {
          enabled: true,
          default: "auto", // auto, light, dark
          description: "Dark mode theme support",
          version: "1.0.0",
          dependencies: ["themeEngine"],
          rolloutStrategy: "universal",
          userPreference: true,
        },
      },
      ...config,
    };

    this.userContext = null;
    this.metrics = {
      featureChecks: 0,
      enabledFeatures: 0,
      rolloutHits: 0,
    };
  }

  /**
   * Set user context for personalized feature flags
   */
  setUserContext(user) {
    this.userContext = {
      id: user.id || "anonymous",
      email: user.email || "",
      role: user.role || "user",
      preferences: user.preferences || {},
      ...user,
    };
  }

  /**
   * Check if a feature is enabled for current context
   */
  isFeatureEnabled(featureName, context = {}) {
    this.metrics.featureChecks++;

    const feature = this.config.features[featureName];
    if (!feature) {
      console.warn(`Feature '${featureName}' not found`);
      return false;
    }

    // Check if feature is globally enabled
    if (!feature.enabled) {
      return false;
    }

    // Check rollout percentage
    if (!this.isInRollout(feature)) {
      return false;
    }

    // Check user-specific allowlist
    if (!this.isUserAllowed(feature)) {
      return false;
    }

    // Check dependencies
    if (!this.areDependenciesMet(feature)) {
      return false;
    }

    this.metrics.enabledFeatures++;
    return true;
  }

  /**
   * Check if current user is in rollout percentage
   */
  isInRollout(feature) {
    if (!feature.rolloutPercentage || feature.rolloutPercentage >= 100) {
      return true;
    }

    if (feature.rolloutPercentage <= 0) {
      return false;
    }

    // Use user ID for consistent rollout
    const userId = this.userContext?.id || "anonymous";
    const hash = this.hashString(userId);
    const percentage = (hash % 100) + 1;

    const inRollout = percentage <= feature.rolloutPercentage;
    if (inRollout) {
      this.metrics.rolloutHits++;
    }

    return inRollout;
  }

  /**
   * Check if user is in allowed users list
   */
  isUserAllowed(feature) {
    if (!feature.allowedUsers || feature.allowedUsers.length === 0) {
      return true;
    }

    if (!this.userContext) {
      return false;
    }

    return feature.allowedUsers.includes(this.userContext.email);
  }

  /**
   * Check if feature dependencies are met
   */
  areDependenciesMet(feature) {
    if (!feature.dependencies || feature.dependencies.length === 0) {
      return true;
    }

    return feature.dependencies.every((dep) => this.isFeatureEnabled(dep));
  }

  /**
   * Simple hash function for consistent rollouts
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get feature value with type handling
   */
  getFeatureValue(featureName, defaultValue = null) {
    const feature = this.config.features[featureName];
    if (!feature || !this.isFeatureEnabled(featureName)) {
      return defaultValue;
    }

    // Handle different feature types
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
   * Get dark mode value based on user preferences
   */
  getDarkModeValue(feature) {
    const userPreference = this.userContext?.preferences?.darkMode;

    if (userPreference && userPreference !== "auto") {
      return userPreference;
    }

    // Auto-detect based on system or time
    if (feature.default === "auto") {
      return this.detectSystemTheme();
    }

    return feature.default;
  }

  /**
   * Detect system theme (simplified)
   */
  detectSystemTheme() {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6 ? "dark" : "light";
  }

  /**
   * Get all enabled features for current user
   */
  getEnabledFeatures() {
    const enabled = [];

    for (const [name, feature] of Object.entries(this.config.features)) {
      if (this.isFeatureEnabled(name)) {
        enabled.push({
          name,
          version: feature.version,
          description: feature.description,
          value: this.getFeatureValue(name),
        });
      }
    }

    return enabled;
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(featureName) {
    return this.config.features[featureName] || null;
  }

  /**
   * Update feature configuration
   */
  updateFeature(featureName, updates) {
    if (!this.config.features[featureName]) {
      throw new Error(`Feature '${featureName}' not found`);
    }

    this.config.features[featureName] = {
      ...this.config.features[featureName],
      ...updates,
    };

    console.log(`✅ Feature '${featureName}' updated`);
  }

  /**
   * Add new feature
   */
  addFeature(name, config) {
    if (this.config.features[name]) {
      throw new Error(`Feature '${name}' already exists`);
    }

    this.config.features[name] = {
      enabled: false,
      rolloutPercentage: 0,
      description: "",
      version: "1.0.0",
      dependencies: [],
      rolloutStrategy: "gradual",
      ...config,
    };

    console.log(`✅ Feature '${name}' added`);
  }

  /**
   * Get feature metrics
   */
  getMetrics() {
    const totalFeatures = Object.keys(this.config.features).length;
    const enabledFeatures = Object.keys(this.config.features).filter(
      (name) => this.config.features[name].enabled,
    ).length;

    return {
      ...this.metrics,
      totalFeatures,
      enabledFeatures,
      rolloutEfficiency:
        (this.metrics.rolloutHits / Math.max(this.metrics.featureChecks, 1)) *
        100,
    };
  }

  /**
   * Generate feature report
   */
  generateReport() {
    console.log("\n🚀 FEATURE FLAG REPORT");
    console.log("=".repeat(60));

    const metrics = this.getMetrics();
    console.log(`\n📊 Metrics:`);
    console.log(`   Total Features: ${metrics.totalFeatures}`);
    console.log(`   Enabled Features: ${metrics.enabledFeatures}`);
    console.log(`   Feature Checks: ${metrics.featureChecks}`);
    console.log(
      `   Rollout Efficiency: ${metrics.rolloutEfficiency.toFixed(1)}%`,
    );

    console.log(`\n🎯 Current User Features:`);
    const userFeatures = this.getEnabledFeatures();
    if (userFeatures.length === 0) {
      console.log("   No features enabled for current user");
    } else {
      userFeatures.forEach((feature) => {
        console.log(
          `   ✅ ${feature.name} (${feature.version}): ${feature.description}`,
        );
        if (feature.value !== undefined) {
          console.log(`      Value: ${JSON.stringify(feature.value)}`);
        }
      });
    }

    console.log(`\n🔧 All Features:`);
    Object.entries(this.config.features).forEach(([name, feature]) => {
      const status = feature.enabled ? "✅" : "❌";
      const rollout = feature.rolloutPercentage
        ? `${feature.rolloutPercentage}%`
        : "N/A";
      console.log(
        `   ${status} ${name} (v${feature.version}) - Rollout: ${rollout}`,
      );
      console.log(`      ${feature.description}`);
    });

    return metrics;
  }

  /**
   * Create feature flag middleware for Express
   */
  createMiddleware() {
    return (req, res, next) => {
      // Set user context from request
      if (req.user) {
        this.setUserContext(req.user);
      }

      // Add feature checking to request
      req.isFeatureEnabled = (feature) => this.isFeatureEnabled(feature);
      req.getFeatureValue = (feature, defaultValue) =>
        this.getFeatureValue(feature, defaultValue);
      req.getEnabledFeatures = () => this.getEnabledFeatures();

      next();
    };
  }

  /**
   * Export configuration for client-side
   */
  exportClientConfig() {
    const clientConfig = {};

    for (const [name, feature] of Object.entries(this.config.features)) {
      // Only include non-sensitive features
      if (!feature.requiresAuth && !feature.private) {
        clientConfig[name] = {
          enabled: this.isFeatureEnabled(name),
          value: this.getFeatureValue(name),
        };
      }
    }

    return clientConfig;
  }
}

// Quantum-specific feature flag manager
class QuantumFeatureManager extends FeatureFlagManager {
  constructor() {
    super({
      features: {
        // Existing features from config
        newDashboard: {
          enabled: true,
          rolloutPercentage: 50,
          allowedUsers: ["admin@example.com", "beta@example.com"],
          description: "Next-generation dashboard interface",
          version: "2.0.0",
          dependencies: ["modernUI", "enhancedCharts"],
          rolloutStrategy: "gradual",
        },
        experimentalAPI: {
          enabled: false,
          endpoints: ["/api/v2/experimental", "/api/v2/beta"],
          description: "Experimental API endpoints for testing",
          version: "0.1.0",
          dependencies: ["apiGateway"],
          rolloutStrategy: "opt-in",
          requiresAuth: true,
        },
        darkMode: {
          enabled: true,
          default: "auto",
          description: "Dark mode theme support",
          version: "1.0.0",
          dependencies: ["themeEngine"],
          rolloutStrategy: "universal",
          userPreference: true,
        },

        // Quantum-specific features
        quantumTerminal: {
          enabled: true,
          rolloutPercentage: 100,
          description: "Quantum terminal interface",
          version: "1.5.0",
          dependencies: ["ptyManager", "webSocketServer"],
        },
        simdOptimization: {
          enabled: true,
          rolloutPercentage: 75,
          description: "SIMD-optimized performance",
          version: "1.0.0",
          dependencies: ["bunRuntime"],
        },
        realTimeMonitoring: {
          enabled: true,
          rolloutPercentage: 25,
          allowedUsers: ["admin@example.com"],
          description: "Real-time system monitoring",
          version: "2.0.0",
          dependencies: ["websocketServer", "metricsEngine"],
        },
        predictiveAnalytics: {
          enabled: false,
          rolloutPercentage: 0,
          description: "AI-powered predictive analytics",
          version: "0.1.0",
          dependencies: ["mlEngine", "dataPipeline"],
        },
      },
    });
  }

  /**
   * Get quantum-specific features
   */
  getQuantumFeatures() {
    return this.getEnabledFeatures().filter((feature) =>
      [
        "quantumTerminal",
        "simdOptimization",
        "realTimeMonitoring",
        "predictiveAnalytics",
      ].includes(feature.name),
    );
  }

  /**
   * Check quantum system capabilities
   */
  getSystemCapabilities() {
    return {
      quantumTerminal: this.isFeatureEnabled("quantumTerminal"),
      simdOptimization: this.isFeatureEnabled("simdOptimization"),
      realTimeMonitoring: this.isFeatureEnabled("realTimeMonitoring"),
      predictiveAnalytics: this.isFeatureEnabled("predictiveAnalytics"),
      darkMode: this.getFeatureValue("darkMode"),
      newDashboard: this.isFeatureEnabled("newDashboard"),
      experimentalAPI: this.getFeatureValue("experimentalAPI"),
    };
  }
}

// CLI interface
async function main() {
  const args = Bun.argv.slice(2);
  const command = args[0] || "help";

  const manager = new QuantumFeatureManager();

  switch (command) {
    case "check":
      const featureName = args[1];
      if (!featureName) {
        console.error("❌ Please provide a feature name");
        process.exit(1);
      }

      // Set demo user context
      manager.setUserContext({
        id: "demo-user",
        email: "beta@example.com",
        role: "beta",
      });

      const enabled = manager.isFeatureEnabled(featureName);
      const value = manager.getFeatureValue(featureName);

      console.log(
        `Feature '${featureName}': ${enabled ? "✅ ENABLED" : "❌ DISABLED"}`,
      );
      if (value !== null) {
        console.log(`Value: ${JSON.stringify(value)}`);
      }
      break;

    case "report":
      manager.setUserContext({
        id: "demo-user",
        email: "beta@example.com",
        role: "beta",
      });
      manager.generateReport();
      break;

    case "capabilities":
      manager.setUserContext({
        id: "demo-user",
        email: "beta@example.com",
        role: "beta",
      });

      const capabilities = manager.getSystemCapabilities();
      console.log("\n⚛️ QUANTUM SYSTEM CAPABILITIES");
      console.log("=".repeat(50));

      Object.entries(capabilities).forEach(([feature, enabled]) => {
        const status = enabled ? "✅" : "❌";
        console.log(`   ${status} ${feature}`);
      });
      break;

    case "export":
      const clientConfig = manager.exportClientConfig();
      console.log("\n📤 CLIENT CONFIGURATION");
      console.log("=".repeat(50));
      console.log(JSON.stringify(clientConfig, null, 2));
      break;

    case "help":
      console.log(`🛠️ Feature Flag Manager CLI`);
      console.log(`Usage:`);
      console.log(
        `  bun run feature-flag-manager.js check <feature>     Check if feature is enabled`,
      );
      console.log(
        `  bun run feature-flag-manager.js report              Generate feature report`,
      );
      console.log(
        `  bun run feature-flag-manager.js capabilities        Show system capabilities`,
      );
      console.log(
        `  bun run feature-flag-manager.js export              Export client configuration`,
      );
      console.log(`\nFeatures:`);
      console.log(`  newDashboard, experimentalAPI, darkMode`);
      console.log(`  quantumTerminal, simdOptimization, realTimeMonitoring`);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
  }
}

// Export for module usage
export { FeatureFlagManager, QuantumFeatureManager };

// Run CLI if called directly
if (import.meta.main) {
  main().catch(console.error);
}
