// [DOMAIN][API][FETCH-CLIENT][HSL:200,70%,85%][META:{BUN-FETCH}][CLASS:BunFetchClient]{BUN-API}

/**
 * Comprehensive Bun Fetch Client
 * Implements all Bun-specific fetch extensions for https://staging-api.example.com/
 *
 * Features:
 * - DNS prefetching
 * - Preconnect
 * - TLS configuration
 * - Unix domain sockets
 * - Proxy support
 * - Streaming (request/response)
 * - Timeout & abort
 * - Verbose debugging
 * - Connection pooling
 * - S3 protocol support
 * - File/Data/Blob URLs
 */

import { dns } from "bun";

class BunFetchClient {
  constructor(baseURL = "https://api.example.com") {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "Upgrade-Insecure-Requests": "1",
    };
    this.verbose = false;
  }

  /**
   * DNS Prefetching - Resolve DNS before making requests
   * Useful when you know you'll need to connect to a host soon
   */
  async prefetchDNS(hostname) {
    console.log(`🔍 Prefetching DNS for: ${hostname}`);
    try {
      dns.prefetch(hostname);
      console.log(`   ✅ DNS prefetch initiated for ${hostname}`);
      return true;
    } catch (error) {
      console.error(`   ❌ DNS prefetch failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get DNS cache statistics
   */
  getDNSCacheStats() {
    try {
      const stats = dns.getCacheStats();
      console.log("📊 DNS Cache Stats:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Failed to get DNS cache stats:", error.message);
      return null;
    }
  }

  /**
   * Preconnect to a host - DNS lookup + TCP + TLS handshake
   * Start the connection early before you need it
   */
  async preconnect(url) {
    console.log(`🔗 Preconnecting to: ${url}`);
    try {
      fetch.preconnect(url);
      console.log(`   ✅ Preconnect initiated for ${url}`);
      return true;
    } catch (error) {
      console.error(`   ❌ Preconnect failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Basic GET request
   */
  async get(path, options = {}) {
    const url = this.buildURL(path);
    return this.request(url, { method: "GET", ...options });
  }

  /**
   * POST request with body
   */
  async post(path, body, options = {}) {
    const url = this.buildURL(path);
    return this.request(url, {
      method: "POST",
      body: typeof body === "object" ? JSON.stringify(body) : body,
      headers: {
        "Content-Type":
          typeof body === "object" ? "application/json" : "text/plain",
        ...options.headers,
      },
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(path, body, options = {}) {
    const url = this.buildURL(path);
    return this.request(url, {
      method: "PUT",
      body: typeof body === "object" ? JSON.stringify(body) : body,
      headers: {
        "Content-Type":
          typeof body === "object" ? "application/json" : "text/plain",
        ...options.headers,
      },
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(path, options = {}) {
    const url = this.buildURL(path);
    return this.request(url, { method: "DELETE", ...options });
  }

  /**
   * Core request method with all Bun-specific options
   */
  async request(url, options = {}) {
    const startTime = performance.now();

    const fetchOptions = {
      method: options.method || "GET",
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      // Bun-specific: Control automatic response decompression
      decompress: options.decompress !== false,
      // Bun-specific: Connection reuse (keep-alive)
      keepalive: options.keepalive !== false,
      // Bun-specific: Verbose debugging
      verbose: options.verbose || this.verbose,
    };

    // Add body if present
    if (options.body) {
      fetchOptions.body = options.body;
    }

    // Add signal for timeout/abort
    if (options.signal) {
      fetchOptions.signal = options.signal;
    } else if (options.timeout) {
      fetchOptions.signal = AbortSignal.timeout(options.timeout);
    }

    // Bun-specific: Proxy support
    if (options.proxy) {
      fetchOptions.proxy = options.proxy;
    }

    // Bun-specific: Unix domain socket
    if (options.unix) {
      fetchOptions.unix = options.unix;
    }

    // Bun-specific: TLS configuration
    if (options.tls) {
      fetchOptions.tls = options.tls;
    }

    try {
      const response = await fetch(url, fetchOptions);
      const endTime = performance.now();

      if (this.verbose) {
        console.log(`📡 ${fetchOptions.method} ${url}`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Time: ${(endTime - startTime).toFixed(2)}ms`);
      }

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        response,
        timing: {
          duration: endTime - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ Request failed: ${error.message}`);
      return {
        ok: false,
        error: error.message,
        timing: {
          duration: endTime - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Fetch with timeout using AbortSignal.timeout
   */
  async fetchWithTimeout(url, timeoutMs = 5000, options = {}) {
    console.log(`⏱️ Fetching with ${timeoutMs}ms timeout: ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.defaultHeaders, ...options.headers },
        signal: AbortSignal.timeout(timeoutMs),
      });

      return {
        ok: response.ok,
        status: response.status,
        response,
        timedOut: false,
      };
    } catch (error) {
      if (error.name === "TimeoutError" || error.name === "AbortError") {
        console.log(`   ⏰ Request timed out after ${timeoutMs}ms`);
        return { ok: false, timedOut: true, error: error.message };
      }
      throw error;
    }
  }

  /**
   * Fetch with AbortController for manual cancellation
   */
  createAbortableFetch(url, options = {}) {
    const controller = new AbortController();

    const fetchPromise = fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
      signal: controller.signal,
    });

    return {
      promise: fetchPromise,
      abort: () => {
        console.log(`🚫 Aborting request to: ${url}`);
        controller.abort();
      },
      controller,
    };
  }

  /**
   * Fetch through a proxy
   */
  async fetchWithProxy(url, proxyUrl, proxyHeaders = {}) {
    console.log(`🔀 Fetching through proxy: ${proxyUrl}`);

    const response = await fetch(url, {
      headers: this.defaultHeaders,
      proxy: {
        url: proxyUrl,
        headers: {
          "Proxy-Authorization": proxyHeaders.authorization || "",
          ...proxyHeaders,
        },
      },
    });

    return response;
  }

  /**
   * Fetch using Unix domain socket
   */
  async fetchUnixSocket(socketPath, path, options = {}) {
    console.log(`🔌 Fetching via Unix socket: ${socketPath}`);

    const response = await fetch(`https://127.0.0.1${path}`, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
      unix: socketPath,
    });

    return response;
  }

  /**
   * Fetch with TLS client certificate
   */
  async fetchWithTLS(url, tlsOptions = {}) {
    console.log(`🔐 Fetching with TLS: ${url}`);

    const response = await fetch(url, {
      headers: this.defaultHeaders,
      tls: {
        key: tlsOptions.key,
        cert: tlsOptions.cert,
        ca: tlsOptions.ca,
        rejectUnauthorized: tlsOptions.rejectUnauthorized !== false,
        checkServerIdentity: tlsOptions.checkServerIdentity,
      },
    });

    return response;
  }

  /**
   * Fetch with disabled TLS validation (for self-signed certs)
   */
  async fetchInsecure(url, options = {}) {
    console.log(`⚠️ Fetching with TLS validation disabled: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
      tls: {
        rejectUnauthorized: false,
      },
    });

    return response;
  }

  /**
   * Streaming response - async iterator
   */
  async *streamResponse(url, options = {}) {
    console.log(`🌊 Streaming response from: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
    });

    for await (const chunk of response.body) {
      yield chunk;
    }
  }

  /**
   * Streaming response - ReadableStream reader
   */
  async streamWithReader(url, options = {}) {
    console.log(`🌊 Streaming with reader from: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
    });

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return {
      response,
      chunks,
      totalChunks: chunks.length,
    };
  }

  /**
   * Streaming request body
   */
  async postStream(url, dataChunks, options = {}) {
    console.log(`🌊 Posting stream to: ${url}`);

    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of dataChunks) {
          controller.enqueue(
            typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk,
          );
        }
        controller.close();
      },
    });

    const response = await fetch(url, {
      method: "POST",
      body: stream,
      headers: { ...this.defaultHeaders, ...options.headers },
    });

    return response;
  }

  /**
   * Fetch local file using file:// protocol
   */
  async fetchFile(filePath) {
    console.log(`📁 Fetching file: ${filePath}`);

    const url = filePath.startsWith("file://")
      ? filePath
      : `file://${filePath}`;
    const response = await fetch(url);

    return {
      ok: response.ok,
      status: response.status,
      text: () => response.text(),
      bytes: () => response.bytes(),
      blob: () => response.blob(),
    };
  }

  /**
   * Fetch data URL
   */
  async fetchDataURL(dataUrl) {
    console.log(`📊 Fetching data URL`);

    const response = await fetch(dataUrl);
    return response;
  }

  /**
   * Fetch blob URL
   */
  async fetchBlobURL(blob) {
    console.log(`📦 Fetching blob URL`);

    const url = URL.createObjectURL(blob);
    try {
      const response = await fetch(url);
      return response;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Fetch from S3 bucket
   */
  async fetchS3(bucket, key, s3Options = {}) {
    console.log(`☁️ Fetching from S3: s3://${bucket}/${key}`);

    const response = await fetch(`s3://${bucket}/${key}`, {
      s3: {
        accessKeyId: s3Options.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:
          s3Options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
        region: s3Options.region || process.env.AWS_REGION || "us-east-1",
        ...s3Options,
      },
    });

    return response;
  }

  /**
   * Upload to S3 bucket
   */
  async uploadS3(bucket, key, body, s3Options = {}) {
    console.log(`☁️ Uploading to S3: s3://${bucket}/${key}`);

    const response = await fetch(`s3://${bucket}/${key}`, {
      method: "PUT",
      body,
      s3: {
        accessKeyId: s3Options.accessKeyId || process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:
          s3Options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
        region: s3Options.region || process.env.AWS_REGION || "us-east-1",
        ...s3Options,
      },
    });

    return response;
  }

  /**
   * Verbose fetch with detailed logging
   */
  async fetchVerbose(url, options = {}) {
    console.log(`🔍 Verbose fetch: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
      verbose: true, // Bun-specific: prints request/response headers
    });

    return response;
  }

  /**
   * Fetch with curl-style verbose output
   */
  async fetchCurlVerbose(url, options = {}) {
    console.log(`🔍 Curl-style verbose fetch: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
      verbose: "curl", // Bun-specific: more detailed output
    });

    return response;
  }

  /**
   * Response body helpers
   */
  async getJSON(path, options = {}) {
    const result = await this.get(path, options);
    if (result.ok) {
      return await result.response.json();
    }
    throw new Error(`Request failed: ${result.status}`);
  }

  async getText(path, options = {}) {
    const result = await this.get(path, options);
    if (result.ok) {
      return await result.response.text();
    }
    throw new Error(`Request failed: ${result.status}`);
  }

  async getBytes(path, options = {}) {
    const result = await this.get(path, options);
    if (result.ok) {
      return await result.response.bytes();
    }
    throw new Error(`Request failed: ${result.status}`);
  }

  async getBlob(path, options = {}) {
    const result = await this.get(path, options);
    if (result.ok) {
      return await result.response.blob();
    }
    throw new Error(`Request failed: ${result.status}`);
  }

  async getArrayBuffer(path, options = {}) {
    const result = await this.get(path, options);
    if (result.ok) {
      return await result.response.arrayBuffer();
    }
    throw new Error(`Request failed: ${result.status}`);
  }

  async getFormData(path, options = {}) {
    const result = await this.get(path, options);
    if (result.ok) {
      return await result.response.formData();
    }
    throw new Error(`Request failed: ${result.status}`);
  }

  /**
   * Write response to file using Bun.write
   */
  async downloadToFile(url, outputPath, options = {}) {
    console.log(`📥 Downloading to file: ${outputPath}`);

    const response = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
    });

    await Bun.write(outputPath, response);
    console.log(`   ✅ Downloaded to: ${outputPath}`);

    return { ok: true, path: outputPath };
  }

  /**
   * Build full URL from path
   */
  buildURL(path) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `${this.baseURL}${path.startsWith("/") ? "" : "/"}${path}`;
  }

  /**
   * Set verbose mode
   */
  setVerbose(enabled) {
    this.verbose = enabled;
  }

  /**
   * Set default headers
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Set base URL
   */
  setBaseURL(url) {
    this.baseURL = url;
  }
}

// Create default client instance
const bunFetchClient = new BunFetchClient("https://api.example.com");

// Export
export default bunFetchClient;
export { BunFetchClient };
