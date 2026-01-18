// Test rollout logic with specific user IDs

class RolloutTester {
  constructor() {
    this.features = {
      newDashboard: {
        enabled: true,
        rolloutPercentage: 50,
        allowedUsers: ["admin@example.com", "beta@example.com"],
      },
    };
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  isInRollout(userId, percentage) {
    const hash = this.hashString(userId);
    const userPercentage = (hash % 100) + 1;
    console.log(
      `   User ID: ${userId}, Hash: ${hash}, Percentage: ${userPercentage}%`,
    );
    return userPercentage <= percentage;
  }

  isFeatureEnabled(featureName, userEmail, userId) {
    const feature = this.features[featureName];
    if (!feature || !feature.enabled) return false;

    // Check allowlist first
    if (feature.allowedUsers && feature.allowedUsers.includes(userEmail)) {
      console.log(`   ✅ User ${userEmail} is in allowlist`);
      return true;
    }

    // Check rollout
    if (feature.rolloutPercentage !== undefined) {
      const inRollout = this.isInRollout(userId, feature.rolloutPercentage);
      console.log(
        `   ${inRollout ? "✅" : "❌"} User in ${feature.rolloutPercentage}% rollout`,
      );
      return inRollout;
    }

    return false;
  }
}

console.log("🧪 Testing Rollout Logic\n");

const tester = new RolloutTester();

// Test specific user IDs to find ones in rollout
const testUsers = [
  { id: "user-1", email: "user1@example.com" },
  { id: "user-2", email: "user2@example.com" },
  { id: "user-3", email: "user3@example.com" },
  { id: "user-4", email: "user4@example.com" },
  { id: "user-5", email: "user5@example.com" },
];

testUsers.forEach((user) => {
  console.log(`\n🔹 Testing ${user.email}:`);
  const enabled = tester.isFeatureEnabled("newDashboard", user.email, user.id);
  console.log(`   Result: ${enabled ? "✅ ENABLED" : "❌ DISABLED"}`);
});

// Test admin/beta users (should always be enabled)
console.log("\n🔹 Testing allowlist users:");
const allowlistUsers = [
  { id: "admin-123", email: "admin@example.com" },
  { id: "beta-456", email: "beta@example.com" },
];

allowlistUsers.forEach((user) => {
  console.log(`\n🔹 Testing ${user.email}:`);
  const enabled = tester.isFeatureEnabled("newDashboard", user.email, user.id);
  console.log(`   Result: ${enabled ? "✅ ENABLED" : "❌ DISABLED"}`);
});
