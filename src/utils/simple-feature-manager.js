// [DOMAIN][FEATURES][FLAGS][HSL:240,70%,85%][META:{CONFIGURATION}][CLASS:SimpleFeatureManager]{BUN-API}

/**
 * Simple Feature Flag Management System
 * Based on your provided configuration
 */

class SimpleFeatureManager {
  constructor() {
    this.features = {
      newDashboard: {
        enabled: true,
        rolloutPercentage: 50,
        allowedUsers: ["admin@example.com", "beta@example.com"],
      },
      experimentalAPI: {
        enabled: false,
        endpoints: ["/api/v2/experimental", "/api/v2/beta"],
      },
      darkMode: {
        enabled: true,
        default: "auto", // auto, light, dark
      },
    };

    this.userContext = null;
  }

  /**
   * Set user context
   */
  setUserContext(user) {
    this.userContext = {
      id: user.id || "anonymous",
      email: user.email || "",
      role: user.role || "user",
      ...user,
    };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName) {
    const feature = this.features[featureName];
    if (!feature) {
      return false;
    }

    // Check global enabled flag
    if (!feature.enabled) {
      return false;
    }

    // Check user allowlist
    if (feature.allowedUsers && feature.allowedUsers.length > 0) {
      if (
        !this.userContext ||
        !feature.allowedUsers.includes(this.userContext.email)
      ) {
        return false;
      }
    }

    // Check rollout percentage
    if (feature.rolloutPercentage !== undefined) {
      if (!this.isInRollout(feature.rolloutPercentage)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user is in rollout percentage
   */
  isInRollout(percentage) {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    const userId = this.userContext?.id || "anonymous";
    const hash = this.hashString(userId);
    const userPercentage = (hash % 100) + 1;

    return userPercentage <= percentage;
  }

  /**
   * Simple hash function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get feature value
   */
  getFeatureValue(featureName) {
    if (!this.isFeatureEnabled(featureName)) {
      return null;
    }

    const feature = this.features[featureName];

    switch (featureName) {
      case "darkMode":
        return this.getDarkModeValue(feature);
      case "experimentalAPI":
        return feature.endpoints || [];
      default:
        return feature.value || null;
    }
  }

  /**
   * Get dark mode value
   */
  getDarkModeValue(feature) {
    const userPreference = this.userContext?.preferences?.darkMode;

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
   * Get all enabled features
   */
  getEnabledFeatures() {
    const enabled = [];

    Object.entries(this.features).forEach(([name, feature]) => {
      if (this.isFeatureEnabled(name)) {
        enabled.push({
          name,
          enabled: this.getFeatureValue(name),
        });
      }
    });

    return enabled;
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log("\n🚀 FEATURE FLAG REPORT");
    console.log("=".repeat(50));

    console.log("\n🎯 Current User Features:");
    const userFeatures = this.getEnabledFeatures();

    if (userFeatures.length === 0) {
      console.log("   No features enabled for current user");
    } else {
      userFeatures.forEach((feature) => {
        console.log(`   ✅ ${feature.name}: ${JSON.stringify(feature.value)}`);
      });
    }

    console.log("\n🔧 All Features:");
    Object.entries(this.features).forEach(([name, feature]) => {
      const status = feature.enabled ? "✅" : "❌";
      const rollout =
        feature.rolloutPercentage !== undefined
          ? `${feature.rolloutPercentage}%`
          : "N/A";
      console.log(`   ${status} ${name} - Rollout: ${rollout}`);

      if (feature.allowedUsers) {
        console.log(`      Allowed users: ${feature.allowedUsers.join(", ")}`);
      }
      if (feature.endpoints) {
        console.log(`      Endpoints: ${feature.endpoints.join(", ")}`);
      }
      if (feature.default) {
        console.log(`      Default: ${feature.default}`);
      }
    });
  }
}

// Test the feature manager
const manager = new SimpleFeatureManager();

console.log("🧪 Testing Feature Flags\n");

// Test with admin user
console.log("🔹 Testing with admin@example.com:");
manager.setUserContext({
  id: "admin-123",
  email: "admin@example.com",
  role: "admin",
});

console.log(
  `newDashboard: ${manager.isFeatureEnabled("newDashboard") ? "✅ ENABLED" : "❌ DISABLED"}`,
);
console.log(`darkMode: ${manager.getFeatureValue("darkMode")}`);
console.log(
  `experimentalAPI: ${manager.isFeatureEnabled("experimentalAPI") ? "✅ ENABLED" : "❌ DISABLED"}`,
);

// Test with beta user
console.log("\n🔹 Testing with beta@example.com:");
manager.setUserContext({
  id: "beta-456",
  email: "beta@example.com",
  role: "beta",
});

console.log(
  `newDashboard: ${manager.isFeatureEnabled("newDashboard") ? "✅ ENABLED" : "❌ DISABLED"}`,
);
console.log(`darkMode: ${manager.getFeatureValue("darkMode")}`);

// Test with regular user (50% rollout)
console.log("\n🔹 Testing with regular user (50% rollout chance):");
manager.setUserContext({
  id: "user-789",
  email: "user@example.com",
  role: "user",
});

console.log(
  `newDashboard: ${manager.isFeatureEnabled("newDashboard") ? "✅ ENABLED" : "❌ DISABLED"}`,
);

// Test dark mode
console.log("\n🔹 Testing dark mode with preferences:");
manager.setUserContext({
  id: "user-789",
  email: "user@example.com",
  role: "user",
  preferences: {
    darkMode: "dark",
  },
});

console.log(
  `darkMode (user preference): ${manager.getFeatureValue("darkMode")}`,
);

// Generate full report
console.log("\n🔹 Full Report:");
manager.generateReport();
