/**
 * Advanced State Vault - Session rotation, multi-domain isolation, compression
 * 
 * Features:
 * - Session rotation for OWASP compliance
 * - Multi-domain cookie jar isolation
 * - Automatic Brotli compression for large payloads
 * - Cookie revocation and cleanup
 */

import { COOKIE_OPTS, SECURITY_CONFIG, API } from './config.js';
import { api } from './api.js';

// Main vault for session state
const vault = new Bun.Cookie(COOKIE_OPTS, {
  secret: Bun.env.QUANTUM_SECRET,
  encryption: SECURITY_CONFIG.encryption,
});

// Optional: CDN vault for edge tokens
const cdnVault = new Bun.Cookie({
  ...COOKIE_OPTS,
  name: '__quantum_cdn',
  domain: 'cdn.example.com',
}, {
  secret: Bun.env.QUANTUM_SECRET,
  encryption: SECURITY_CONFIG.encryption,
});

/**
 * Rotate session for OWASP compliance
 * Requests new session from API and replaces old one
 */
export async function rotateSession(request) {
  try {
    const oldJar = await vault.fromRequest(request);
    if (!oldJar?.has('session')) {
      throw new Error('No session to rotate');
    }

    // Request new session from API
    const res = await api.fetch('/v1/auth/rotate', {
      method: 'POST',
      jar: oldJar,
    });

    if (!res.ok) {
      throw new Error(`Rotation failed: ${res.status}`);
    }

    // Create fresh jar with new session
    const newJar = new Bun.CookieJar();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      await newJar.parse(setCookie);
    }

    if (Bun.env.DEBUG) {
      console.log('✅ Session rotated successfully');
    }

    return vault.serialize(newJar);
  } catch (err) {
    console.error('❌ Session rotation failed:', err.message);
    return null;
  }
}

/**
 * Save state with optional compression for large payloads
 */
export async function saveState(request, key, value) {
  try {
    const jar = await vault.fromRequest(request) || new Bun.CookieJar();
    const serialized = JSON.stringify(value);
    
    // Enable compression for payloads > 2KB
    const compress = serialized.length > 2048;
    
    jar.set(key, serialized, {
      maxAge: COOKIE_OPTS.maxAge,
      httpOnly: COOKIE_OPTS.httpOnly,
      secure: COOKIE_OPTS.secure,
      sameSite: COOKIE_OPTS.sameSite,
      compress,
    });

    if (Bun.env.DEBUG && compress) {
      console.log(`📦 Compressed ${key} (${serialized.length} → compressed)`);
    }

    return vault.serialize(jar);
  } catch (err) {
    console.error(`❌ Failed to save state ${key}:`, err.message);
    return null;
  }
}

/**
 * Load state with automatic decompression
 */
export async function loadState(request, key) {
  try {
    const jar = await vault.fromRequest(request);
    if (!jar) return null;
    
    const value = jar.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error(`❌ Failed to load state ${key}:`, err.message);
    return null;
  }
}

/**
 * Delete specific state key
 */
export async function deleteState(request, key) {
  try {
    const jar = await vault.fromRequest(request) || new Bun.CookieJar();
    jar.delete(key);
    return vault.serialize(jar);
  } catch (err) {
    console.error(`❌ Failed to delete state ${key}:`, err.message);
    return null;
  }
}

/**
 * Clear all state
 */
export async function clearState(request) {
  try {
    const newJar = new Bun.CookieJar();
    return vault.serialize(newJar);
  } catch (err) {
    console.error('❌ Failed to clear state:', err.message);
    return null;
  }
}

/**
 * Get all state as object
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
  } catch (err) {
    console.error('❌ Failed to get all state:', err.message);
    return {};
  }
}

/**
 * Save to CDN vault (multi-domain isolation)
 */
export async function saveCdnToken(request, token) {
  try {
    const jar = await cdnVault.fromRequest(request) || new Bun.CookieJar();
    jar.set('edge-token', token, {
      maxAge: 3600,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    return cdnVault.serialize(jar);
  } catch (err) {
    console.error('❌ Failed to save CDN token:', err.message);
    return null;
  }
}

/**
 * Load from CDN vault
 */
export async function loadCdnToken(request) {
  try {
    const jar = await cdnVault.fromRequest(request);
    return jar?.get('edge-token') || null;
  } catch (err) {
    console.error('❌ Failed to load CDN token:', err.message);
    return null;
  }
}

export { vault, cdnVault };

