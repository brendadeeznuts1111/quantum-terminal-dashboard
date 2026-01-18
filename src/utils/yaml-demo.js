// [DOMAIN][YAML][DEMO][HSL:280,70%,85%][META:{BUN-FEATURES}][CLASS:YAMLDemo]{BUN-API}

/**
 * Comprehensive YAML Demo for Quantum Cash Flow Lattice
 * Demonstrates Bun's built-in YAML support with real-world examples
 */

import { YAML } from "bun";

console.log("🧪 Comprehensive Bun YAML Demo\n");

// 1. Basic YAML Parsing
console.log("📄 1. Basic YAML Parsing");
console.log("-".repeat(40));

const basicYAML = `
name: John Doe
age: 30
email: john@example.com
hobbies:
  - reading
  - coding
  - hiking
`;

const basicData = YAML.parse(basicYAML);
console.log("Parsed basic YAML:");
console.log(basicData);

// 2. Multi-document YAML
console.log("\n📄 2. Multi-document YAML");
console.log("-".repeat(40));

const multiDocYAML = `
---
name: Document 1
type: config
---
name: Document 2
type: data
---
name: Document 3
type: metadata
`;

const docs = YAML.parse(multiDocYAML);
console.log("Multi-document YAML (array):");
docs.forEach((doc, index) => {
  console.log(`  Document ${index + 1}: ${doc.name} (${doc.type})`);
});

// 3. Advanced YAML Features
console.log("\n📄 3. Advanced YAML Features");
console.log("-".repeat(40));

const advancedYAML = `
# Employee record with anchors and aliases
employee: &emp
  name: Jane Smith
  department: Engineering
  skills:
    - JavaScript
    - TypeScript
    - React

manager: *emp  # Reference to employee

# Explicit type tags
config: !!str 123
number: !!int "456"
boolean: !!bool "true"
nullValue: !!null "null"

# Multi-line strings
description: |
  This is a multi-line
  literal string that preserves
  line breaks and spacing.

summary: >
  This is a folded string
  that joins lines with spaces
  unless there are blank lines.

# Nested objects and arrays
quantumSystem:
  version: "1.5.0"
  components:
    - name: "qsimd-scene"
      enabled: true
      performance: 95
    - name: "qsimd-connections"
      enabled: true
      performance: 87
  features:
    realTimeMonitoring: true
    predictiveAnalytics: false
    darkMode: "auto"
`;

const advancedData = YAML.parse(advancedYAML);
console.log("Advanced YAML features:");
console.log(`  Employee name: ${advancedData.employee.name}`);
console.log(`  Manager name: ${advancedData.manager.name}`);
console.log(
  `  Config as string: ${advancedData.config} (type: ${typeof advancedData.config})`,
);
console.log(
  `  Number: ${advancedData.number} (type: ${typeof advancedData.number})`,
);
console.log(
  `  Boolean: ${advancedData.boolean} (type: ${typeof advancedData.boolean})`,
);
console.log(`  Null value: ${advancedData.nullValue}`);
console.log(`  Quantum version: ${advancedData.quantumSystem.version}`);
console.log(
  `  Components: ${advancedData.quantumSystem.components.length} total`,
);

// 4. Error Handling
console.log("\n📄 4. Error Handling");
console.log("-".repeat(40));

try {
  YAML.parse("invalid: yaml: content:");
} catch (error) {
  console.log("Caught YAML parsing error:");
  console.log(`  Type: ${error.constructor.name}`);
  console.log(`  Message: ${error.message}`);
}

// 5. Module Import Demo (simulated)
console.log("\n📄 5. Module Import Simulation");
console.log("-".repeat(40));

// Simulate importing a YAML file
const configYAML = `
database:
  host: localhost
  port: 5432
  name: quantum_lattice

redis:
  host: localhost
  port: 6379

features:
  auth: true
  rateLimit: true
  analytics: false
`;

const simulatedConfig = YAML.parse(configYAML);
console.log("Simulated module import:");
console.log(`  Database host: ${simulatedConfig.database.host}`);
console.log(`  Redis port: ${simulatedConfig.redis.port}`);
console.log(`  Auth feature: ${simulatedConfig.features.auth}`);

// 6. Environment-based Configuration
console.log("\n📄 6. Environment-based Configuration");
console.log("-".repeat(40));

const envConfigYAML = `
development:
  server:
    host: localhost
    port: 3000
  database:
    name: quantum_lattice_dev
  logging:
    level: debug

staging:
  server:
    host: staging.quantum-lattice.com
    port: 443
  database:
    name: quantum_lattice_staging
  logging:
    level: info

production:
  server:
    host: api.quantum-lattice.com
    port: 443
  database:
    name: quantum_lattice_prod
  logging:
    level: error
`;

const envConfigs = YAML.parse(envConfigYAML);
const currentEnv = process.env.NODE_ENV || "development";
const currentConfig = envConfigs[currentEnv];

console.log(`Environment: ${currentEnv}`);
console.log(
  `Server: ${currentConfig.server.host}:${currentConfig.server.port}`,
);
console.log(`Database: ${currentConfig.database.name}`);
console.log(`Log level: ${currentConfig.logging.level}`);

// 7. Feature Flags Configuration
console.log("\n📄 7. Feature Flags Configuration");
console.log("-".repeat(40));

const featuresYAML = `
features:
  newDashboard:
    enabled: true
    rolloutPercentage: 50
    allowedUsers:
      - admin@example.com
      - beta@example.com

  experimentalAPI:
    enabled: false
    endpoints:
      - /api/v2/experimental
      - /api/v2/beta

  darkMode:
    enabled: true
    default: auto

  quantumTerminal:
    enabled: true
    rolloutPercentage: 100

  realTimeMonitoring:
    enabled: true
    rolloutPercentage: 25
`;

const featuresConfig = YAML.parse(featuresYAML);

// Feature flag checker function
function isFeatureEnabled(featureName, userEmail = null) {
  const feature = featuresConfig.features[featureName];

  if (!feature?.enabled) {
    return false;
  }

  // Check rollout percentage
  if (
    feature.rolloutPercentage !== undefined &&
    feature.rolloutPercentage < 100
  ) {
    const hash = hashCode(userEmail || "anonymous");
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

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Test feature flags
const testUsers = ["admin@example.com", "beta@example.com", "user@example.com"];
const featureNames = [
  "newDashboard",
  "experimentalAPI",
  "darkMode",
  "quantumTerminal",
];

console.log("Feature flag results:");
testUsers.forEach((user) => {
  console.log(`\n  User: ${user}`);
  featureNames.forEach((feature) => {
    const enabled = isFeatureEnabled(feature, user);
    console.log(`    ${feature}: ${enabled ? "✅" : "❌"}`);
  });
});

// 8. Database Configuration with Environment Variables
console.log("\n📄 8. Database Configuration");
console.log("-".repeat(40));

const databaseYAML = `
connections:
  primary:
    type: postgres
    host: \${DB_HOST:-localhost}
    port: \${DB_PORT:-5432}
    database: \${DB_NAME:-myapp}
    username: \${DB_USER:-postgres}
    password: \${DB_PASS}
    pool:
      min: 2
      max: 10

  cache:
    type: redis
    host: \${REDIS_HOST:-localhost}
    port: \${REDIS_PORT:-6379}
    password: \${REDIS_PASS}

migrations:
  autoRun: \${AUTO_MIGRATE:-false}
  directory: ./migrations
`;

// Environment variable interpolation function
function interpolateEnvVars(obj) {
  if (typeof obj === "string") {
    return obj.replace(
      /\$\{([^:-]+)(?::([^}]+))?}/g,
      (_, key, defaultValue) => {
        return process.env[key] || defaultValue || "";
      },
    );
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateEnvVars(item));
  }

  if (typeof obj === "object" && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateEnvVars(value);
    }
    return result;
  }

  return obj;
}

const dbConfig = YAML.parse(databaseYAML);
const interpolatedDbConfig = interpolateEnvVars(dbConfig);

console.log("Database configuration (with defaults):");
console.log(`  Primary host: ${interpolatedDbConfig.connections.primary.host}`);
console.log(`  Primary port: ${interpolatedDbConfig.connections.primary.port}`);
console.log(`  Cache host: ${interpolatedDbConfig.connections.cache.host}`);
console.log(`  Auto-migrate: ${interpolatedDbConfig.migrations.autoRun}`);

// 9. Performance Metrics Configuration
console.log("\n📄 9. Performance Metrics");
console.log("-".repeat(40));

const metricsYAML = `
systemMetrics:
  cpu:
    threshold: 80
    checkInterval: 5000
    alerting: true
  
  memory:
    threshold: 90
    checkInterval: 3000
    alerting: true
    
  disk:
    threshold: 85
    checkInterval: 10000
    alerting: false

applicationMetrics:
  responseTime:
    p95: 500
    p99: 1000
    target: 200
    
  errorRate:
    threshold: 0.01
    window: 300000
    
  throughput:
    target: 1000
    minimum: 500
`;

const metricsConfig = YAML.parse(metricsYAML);
console.log("Performance metrics configuration:");
console.log(`  CPU threshold: ${metricsConfig.systemMetrics.cpu.threshold}%`);
console.log(
  `  Memory threshold: ${metricsConfig.systemMetrics.memory.threshold}%`,
);
console.log(
  `  Response time P95: ${metricsConfig.applicationMetrics.responseTime.p95}ms`,
);
console.log(
  `  Error rate threshold: ${(metricsConfig.applicationMetrics.errorRate.threshold * 100).toFixed(1)}%`,
);

// 10. Summary
console.log("\n📄 10. YAML Capabilities Summary");
console.log("-".repeat(40));

console.log("✅ Demonstrated Bun YAML Features:");
console.log("   • Basic parsing with scalars, arrays, objects");
console.log("   • Multi-document YAML support");
console.log("   • Anchors and aliases (& and *)");
console.log("   • Type tags (!!str, !!int, !!bool, !!null)");
console.log("   • Multi-line strings (| and >)");
console.log("   • Comments and directives");
console.log("   • Error handling with SyntaxError");
console.log("   • Environment-based configuration");
console.log("   • Feature flags management");
console.log("   • Environment variable interpolation");
console.log("   • Performance metrics configuration");
console.log("   • Module import simulation");

console.log("\n🚀 YAML Performance:");
console.log("   • 90%+ YAML test suite conformance");
console.log("   • Zig-based parser for optimal performance");
console.log("   • Hot reloading support with --hot flag");
console.log("   • Bundler integration for production builds");
console.log("   • Tree-shaking support for named imports");

console.log("\n✅ Quantum Cash Flow Lattice Integration:");
console.log("   • Environment-specific configurations");
console.log("   • Feature flag management system");
console.log("   • Database connection management");
console.log("   • Performance monitoring setup");
console.log("   • Security configuration");
console.log("   • Real-time configuration updates");
