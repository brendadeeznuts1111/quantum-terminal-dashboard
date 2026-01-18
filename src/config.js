/**
 * Configuration loader using Bun's built-in YAML support
 * Loads bun.yaml from project root and exports configuration
 */

// Load configuration from bun.yaml using Bun's native YAML loader
export const cfg = await Bun.yaml('bun.yaml');

// Export commonly used configuration sections
// Local dev fallback (env switch)
export const API = Bun.env.LOCAL
  ? 'http://localhost:3000'
  : cfg.api.base;
export const COOKIE_OPTS = cfg.api.cookie;
export const SERVER_CONFIG = cfg.server;
export const DB_CONFIG = cfg.database;
export const CACHE_CONFIG = cfg.cache;
export const LOGGING_CONFIG = cfg.logging;
export const SECURITY_CONFIG = cfg.security;

/**
 * Get environment-specific configuration
 * @param {string} key - Configuration key (dot notation supported)
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value
 */
export function getConfig(key, defaultValue = undefined) {
  const keys = key.split('.');
  let value = cfg;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

/**
 * Check if a configuration key exists
 * @param {string} key - Configuration key
 * @returns {boolean} True if key exists
 */
export function hasConfig(key) {
  return getConfig(key) !== undefined;
}

/**
 * Get all configuration
 * @returns {object} Complete configuration object
 */
export function getAllConfig() {
  return cfg;
}

// Log configuration on load (non-sensitive values only)
if (Bun.env.DEBUG) {
  console.log('Configuration loaded:', {
    api: cfg.api.base,
    server: `${cfg.server.host}:${cfg.server.port}`,
    database: `${cfg.database.host}:${cfg.database.port}/${cfg.database.name}`,
    cache: cfg.cache.enabled ? cfg.cache.provider : 'disabled',
  });
}