// [DOMAIN][CONFIG][APP][HSL:200,70%,85%][META:{ENV-INTERPOLATION}][CLASS:AppConfig]{BUN-API}

/**
 * Application Configuration with Environment Variable Interpolation
 * Demonstrates Bun's YAML import and environment variable processing
 */

import configs from '../../config-fixed.yaml';

const env = process.env.NODE_ENV || "development";
const config = configs[env];

// Environment variables in YAML values can be interpolated
function interpolateEnvVars(obj: any): any {
  if (typeof obj === "string") {
    return obj.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] || "");
  }
  if (typeof obj === "object") {
    for (const key in obj) {
      obj[key] = interpolateEnvVars(obj[key]);
    }
  }
  return obj;
}

const interpolatedConfig = interpolateEnvVars(config);

export default interpolatedConfig;

// Export typed configuration accessors
export function getServerConfig() {
  return interpolatedConfig?.server || {};
}

export function getDatabaseConfig() {
  return interpolatedConfig?.database || {};
}

export function getCacheConfig() {
  return interpolatedConfig?.cache || {};
}

export function getSecurityConfig() {
  return interpolatedConfig?.security || {};
}

export function getPerformanceConfig() {
  return interpolatedConfig?.performance || {};
}

export function getLoggingConfig() {
  return interpolatedConfig?.logging || {};
}

export function getFeaturesConfig() {
  return interpolatedConfig?.features || {};
}

// Environment helpers
export function isDevelopment() {
  return env === 'development';
}

export function isStaging() {
  return env === 'staging';
}

export function isProduction() {
  return env === 'production';
}

export function isTest() {
  return env === 'test';
}

export function getCurrentEnvironment() {
  return env;
}
