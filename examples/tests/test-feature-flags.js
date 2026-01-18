// Test feature flags with different users

import { QuantumFeatureManager } from "./src/utils/feature-flag-manager.js";

console.log("🧪 Testing Feature Flags with Different Users\n");

// Test with admin user (should be in rollout)
console.log("🔹 Testing with admin@example.com:");
const adminManager = new QuantumFeatureManager();
adminManager.setUserContext({
  id: "admin-123",
  email: "admin@example.com",
  role: "admin",
});

console.log(
  `newDashboard: ${adminManager.isFeatureEnabled("newDashboard") ? "✅" : "❌"}`,
);
console.log(`darkMode: ${adminManager.getFeatureValue("darkMode")}`);
console.log(
  `experimentalAPI: ${adminManager.isFeatureEnabled("experimentalAPI") ? "✅" : "❌"}`,
);
console.log(
  `quantumTerminal: ${adminManager.isFeatureEnabled("quantumTerminal") ? "✅" : "❌"}`,
);

// Test with beta user (should be in rollout)
console.log("\n🔹 Testing with beta@example.com:");
const betaManager = new QuantumFeatureManager();
betaManager.setUserContext({
  id: "beta-456",
  email: "beta@example.com",
  role: "beta",
});

console.log(
  `newDashboard: ${betaManager.isFeatureEnabled("newDashboard") ? "✅" : "❌"}`,
);
console.log(`darkMode: ${betaManager.getFeatureValue("darkMode")}`);
console.log(
  `experimentalAPI: ${betaManager.isFeatureEnabled("experimentalAPI") ? "✅" : "❌"}`,
);

// Test with regular user (50% chance)
console.log("\n🔹 Testing with regular user:");
const regularManager = new QuantumFeatureManager();
regularManager.setUserContext({
  id: "user-789",
  email: "user@example.com",
  role: "user",
});

console.log(
  `newDashboard: ${regularManager.isFeatureEnabled("newDashboard") ? "✅" : "❌"}`,
);
console.log(`darkMode: ${regularManager.getFeatureValue("darkMode")}`);
console.log(
  `simdOptimization: ${regularManager.isFeatureEnabled("simdOptimization") ? "✅" : "❌"}`,
);

// Test system capabilities
console.log("\n🔹 System Capabilities:");
const capabilities = adminManager.getSystemCapabilities();
Object.entries(capabilities).forEach(([feature, enabled]) => {
  console.log(`   ${enabled ? "✅" : "❌"} ${feature}`);
});

// Test metrics
console.log("\n🔹 Feature Metrics:");
const metrics = adminManager.getMetrics();
console.log(`   Total Features: ${metrics.totalFeatures}`);
console.log(`   Enabled Features: ${metrics.enabledFeatures}`);
console.log(`   Feature Checks: ${metrics.featureChecks}`);
console.log(`   Rollout Efficiency: ${metrics.rolloutEfficiency.toFixed(1)}%`);
