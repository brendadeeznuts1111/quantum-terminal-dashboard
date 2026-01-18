/**
 * State Vault - Encrypted cookie-based state management
 * Uses Bun's native Cookie API with AES-256-GCM encryption
 *
 * SECURITY REQUIREMENTS:
 * - QUANTUM_SECRET environment variable must be set to a 256-bit (32-byte) key
 * - In production, use a cryptographically secure random key
 * - Example: openssl rand -hex 32
 *
 * INTEGRATION:
 * - Imports COOKIE_OPTS from config.js (loaded from bun.yaml)
 * - Uses SECURITY_CONFIG.encryption for AES-256-GCM
 * - Respects all cookie security settings (httpOnly, secure, sameSite, maxAge)
 */

import { COOKIE_OPTS, SECURITY_CONFIG } from './config.js';

/**
 * Validate encryption secret
 * @throws {Error} If QUANTUM_SECRET is not set or invalid
 */
function validateSecret() {
  const secret = Bun.env.QUANTUM_SECRET;
  if (!secret) {
    throw new Error(
      'QUANTUM_SECRET environment variable is required for state vault encryption. ' +
      'Generate a 256-bit key with: openssl rand -hex 32'
    );
  }
  // Warn if using development secret
  if (secret === 'dev-secret-key-change-in-production') {
    console.warn('⚠️  WARNING: Using development secret key. Set QUANTUM_SECRET in production!');
  }
  return secret;
}

/**
 * Initialize encrypted cookie vault
 * Requires QUANTUM_SECRET environment variable (256-bit key)
 */
const vault = new Bun.Cookie(COOKIE_OPTS, {
  secret: validateSecret(),
  encryption: SECURITY_CONFIG.encryption, // aes-256-gcm
});

/**
 * Save state to encrypted cookie
 * @param {Request} request - HTTP request object
 * @param {string} key - State key
 * @param {*} value - State value (will be JSON serialized)
 * @returns {Promise<string>} Serialized cookie string
 */
export async function saveState(request, key, value) {
  try {
    const jar = await vault.fromRequest(request) || new Bun.CookieJar();
    jar.set(key, JSON.stringify(value), { 
      maxAge: COOKIE_OPTS.maxAge,
      httpOnly: COOKIE_OPTS.httpOnly,
      secure: COOKIE_OPTS.secure,
      sameSite: COOKIE_OPTS.sameSite,
    });
    return vault.serialize(jar);
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
}

/**
 * Load state from encrypted cookie
 * @param {Request} request - HTTP request object
 * @param {string} key - State key
 * @returns {Promise<*>} Parsed state value or null
 */
export async function loadState(request, key) {
  try {
    const jar = await vault.fromRequest(request);
    if (!jar) return null;
    
    const value = jar.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error loading state:', error);
    return null;
  }
}

/**
 * Delete state from cookie
 * @param {Request} request - HTTP request object
 * @param {string} key - State key
 * @returns {Promise<string>} Serialized cookie string
 */
export async function deleteState(request, key) {
  try {
    const jar = await vault.fromRequest(request) || new Bun.CookieJar();
    jar.delete(key);
    return vault.serialize(jar);
  } catch (error) {
    console.error('Error deleting state:', error);
    throw error;
  }
}

/**
 * Clear all state from cookie
 * @param {Request} request - HTTP request object
 * @returns {Promise<string>} Serialized cookie string
 */
export async function clearState(request) {
  try {
    const jar = new Bun.CookieJar();
    return vault.serialize(jar);
  } catch (error) {
    console.error('Error clearing state:', error);
    throw error;
  }
}

/**
 * Get all state from cookie
 * @param {Request} request - HTTP request object
 * @returns {Promise<object>} All state key-value pairs
 */
export async function getAllState(request) {
  try {
    const jar = await vault.fromRequest(request);
    if (!jar) return {};
    
    const state = {};
    for (const [key, value] of jar) {
      try {
        state[key] = JSON.parse(value);
      } catch {
        state[key] = value;
      }
    }
    return state;
  } catch (error) {
    console.error('Error getting all state:', error);
    return {};
  }
}

