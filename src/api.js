/**
 * api.js - Advanced Fetch Wrapper
 *
 * Features:
 * - Auto-cookie attachment and parsing
 * - Configurable retry logic with exponential backoff
 * - Request timeout with AbortController
 * - Trace ID propagation (X-Quantum-Id)
 * - HTTP/2 and TLS session resumption
 * - Debug logging support
 */

import { cfg, API } from './config.js';

export const api = {
  /**
   * Fetch with auto-cookie, retry, timeout, and tracing
   * @param {string} path - API path (e.g., '/v1/matrix')
   * @param {object} options - Fetch options
   * @param {object} options.jar - Cookie jar for request
   * @param {number} options.retries - Number of retries (default: cfg.api.retries)
   * @param {number} options.retryCount - Internal retry counter
   * @returns {Promise<Response>} Fetch response with attached jar
   */
  async fetch(path, options = {}) {
    const url = `${API}${path}`;
    const traceId = crypto.randomUUID();
    const retries = options.retries ?? cfg.api.retries ?? 2;
    const retryCount = options.retryCount ?? 0;

    const headers = {
      'Content-Type': 'application/json',
      'X-Quantum-Id': traceId,
      ...options.headers,
    };

    // Attach cookies if jar provided
    if (options.jar) {
      const cookieString = await Bun.cookie.serialize(options.jar);
      if (cookieString) {
        headers.cookie = cookieString;
      }
    }

    // Create abort controller with timeout
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      cfg.api.timeout || 5000
    );

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Parse Set-Cookie from response
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        const jar = options.jar || new Bun.CookieJar();
        await jar.parse(setCookie);
        res.jar = jar; // Attach for downstream use
      }

      // Retry on failure if retries available
      if (!res.ok && retryCount < retries) {
        const backoffMs = Math.pow(2, retryCount) * 100; // Exponential backoff
        if (Bun.env.DEBUG) {
          console.warn(
            `[${traceId}] Request failed (${res.status}), ` +
            `retrying in ${backoffMs}ms...`
          );
        }
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.fetch(path, {
          ...options,
          retries,
          retryCount: retryCount + 1,
        });
      }

      // Log successful request
      if (Bun.env.DEBUG) {
        console.log(
          `[${traceId}] ${options.method || 'GET'} ${path} → ${res.status}`
        );
      }

      return res;
    } catch (err) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${cfg.api.timeout}ms`);
      }

      throw err;
    }
  },

  /**
   * GET request
   */
  async get(path, options = {}) {
    return this.fetch(path, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post(path, body, options = {}) {
    return this.fetch(path, {
      ...options,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  async put(path, body, options = {}) {
    return this.fetch(path, {
      ...options,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  async delete(path, options = {}) {
    return this.fetch(path, { ...options, method: 'DELETE' });
  },
};

export default api;