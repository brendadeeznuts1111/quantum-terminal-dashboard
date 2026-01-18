/**
 * Cloud Utilities - S3 and WebSocket with Proxy Support
 * 
 * Features:
 * - S3 Requester Pays bucket support
 * - WebSocket HTTP/HTTPS proxy support
 * - S3 multipart upload with requester pays
 * - WebSocket authentication through proxies
 */

import { s3 } from "bun";

/**
 * S3 Requester Pays file operations
 */
export class RequesterPaysS3 {
  constructor(bucket, options = {}) {
    this.bucket = bucket;
    this.requestPayer = true;
    this.options = options;
  }

  /**
   * Read file from Requester Pays bucket
   */
  async read(key) {
    const file = s3.file(key, {
      bucket: this.bucket,
      requestPayer: this.requestPayer,
      ...this.options,
    });

    return await file.text();
  }

  /**
   * Read file as buffer
   */
  async readBuffer(key) {
    const file = s3.file(key, {
      bucket: this.bucket,
      requestPayer: this.requestPayer,
      ...this.options,
    });

    return await file.arrayBuffer();
  }

  /**
   * Read file as JSON
   */
  async readJSON(key) {
    const content = await this.read(key);
    return JSON.parse(content);
  }

  /**
   * Write file to Requester Pays bucket
   */
  async write(key, data) {
    return await s3.write(key, data, {
      bucket: this.bucket,
      requestPayer: this.requestPayer,
      ...this.options,
    });
  }

  /**
   * Write JSON to Requester Pays bucket
   */
  async writeJSON(key, data) {
    return await this.write(key, JSON.stringify(data, null, 2));
  }

  /**
   * Get file metadata
   */
  async stat(key) {
    const file = s3.file(key, {
      bucket: this.bucket,
      requestPayer: this.requestPayer,
      ...this.options,
    });

    return {
      size: file.size,
      lastModified: file.lastModified,
      etag: file.etag,
    };
  }

  /**
   * Delete file from Requester Pays bucket
   */
  async delete(key) {
    return await s3.delete(key, {
      bucket: this.bucket,
      requestPayer: this.requestPayer,
      ...this.options,
    });
  }

  /**
   * List files in Requester Pays bucket
   */
  async list(prefix = '') {
    return await s3.list({
      bucket: this.bucket,
      prefix,
      requestPayer: this.requestPayer,
      ...this.options,
    });
  }
}

/**
 * WebSocket with proxy support
 */
export class ProxiedWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
  }

  /**
   * Connect through HTTP proxy
   */
  async connectHttpProxy(proxyUrl) {
    this.ws = new WebSocket(this.url, {
      proxy: proxyUrl,
      ...this.options,
    });

    return this.ws;
  }

  /**
   * Connect through HTTPS proxy
   */
  async connectHttpsProxy(proxyUrl, tlsOptions = {}) {
    this.ws = new WebSocket(this.url, {
      proxy: proxyUrl,
      tls: tlsOptions,
      ...this.options,
    });

    return this.ws;
  }

  /**
   * Connect with proxy authentication
   */
  async connectWithAuth(proxyUrl, username, password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    this.ws = new WebSocket(this.url, {
      proxy: proxyUrl,
      headers: {
        'Proxy-Authorization': `Basic ${auth}`,
      },
      ...this.options,
    });

    return this.ws;
  }

  /**
   * Connect with custom proxy headers
   */
  async connectWithHeaders(proxyUrl, headers) {
    this.ws = new WebSocket(this.url, {
      proxy: {
        url: proxyUrl,
        headers,
      },
      ...this.options,
    });

    return this.ws;
  }

  /**
   * Send message
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  /**
   * Close connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Add event listener
   */
  on(event, handler) {
    if (this.ws) {
      this.ws.addEventListener(event, handler);
    }
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    if (this.ws) {
      this.ws.removeEventListener(event, handler);
    }
  }
}

/**
 * WebSocket connection pool with proxy support
 */
export class WebSocketPool {
  constructor(baseUrl, proxyUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.proxyUrl = proxyUrl;
    this.options = options;
    this.connections = new Map();
  }

  /**
   * Get or create connection
   */
  async getConnection(id) {
    if (!this.connections.has(id)) {
      const ws = new ProxiedWebSocket(this.baseUrl, this.options);
      await ws.connectHttpProxy(this.proxyUrl);
      this.connections.set(id, ws);
    }

    return this.connections.get(id);
  }

  /**
   * Close connection
   */
  closeConnection(id) {
    const ws = this.connections.get(id);
    if (ws) {
      ws.close();
      this.connections.delete(id);
    }
  }

  /**
   * Close all connections
   */
  closeAll() {
    for (const ws of this.connections.values()) {
      ws.close();
    }
    this.connections.clear();
  }

  /**
   * Get connection count
   */
  size() {
    return this.connections.size;
  }
}

export default {
  RequesterPaysS3,
  ProxiedWebSocket,
  WebSocketPool,
};

