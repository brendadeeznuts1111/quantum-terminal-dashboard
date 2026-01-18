// [DOMAIN][CONFIG][QUANTUM][HSL:200,70%,85%][META:{ANCHORS}][CLASS:QuantumConfigManager]{BUN-API}

/**
 * Quantum Configuration Manager
 * Handles YAML with anchors, aliases, and environment variable interpolation
 */

import configs from './quantum-config-fixed.yaml';

class QuantumConfigManager {
  private environment: string;
  private config: any;
  private interpolatedConfig: any;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.loadConfiguration();
  }

  /**
   * Load and interpolate configuration
   */
  private loadConfiguration(): void {
    try {
      const envConfig = configs[this.environment];
      
      if (!envConfig) {
        throw new Error(`Configuration for environment '${this.environment}' not found`);
      }

      // Interpolate environment variables
      this.interpolatedConfig = this.interpolateEnvVars(envConfig);
      this.config = envConfig;

      console.log(`✅ Quantum configuration loaded for environment: ${this.environment}`);
    } catch (error) {
      console.error(`❌ Failed to load quantum configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recursively interpolate environment variables
   */
  private interpolateEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (_, key) => {
        const envValue = process.env[key];
        if (envValue === undefined) {
          console.warn(`⚠️ Environment variable '${key}' not found`);
          return '';
        }
        return envValue;
      });
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateEnvVars(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.interpolateEnvVars(value);
      }
      return result;
    }

    return obj;
  }

  /**
   * Get configuration value by path
   */
  get(path: string, defaultValue: any = undefined): any {
    const keys = path.split('.');
    let current = this.interpolatedConfig;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Get server configuration
   */
  getServerConfig(): any {
    return this.get('server', {});
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig(): any {
    return this.get('database', {});
  }

  /**
   * Get API configuration
   */
  getAPIConfig(): any {
    return this.get('api', {});
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): any {
    return this.get('cache', {});
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): any {
    return this.get('security', {});
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): any {
    return this.get('performance', {});
  }

  /**
   * Get quantum-specific configuration
   */
  getQuantumConfig(): any {
    return this.get('quantum', {});
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig(): any {
    return this.get('logging', {});
  }

  /**
   * Get features configuration
   */
  getFeaturesConfig(): any {
    return this.get('features', {});
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    const features = this.getFeaturesConfig();
    return features[featureName] === true;
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return this.environment;
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.environment === 'development';
  }

  /**
   * Check if running in staging
   */
  isStaging(): boolean {
    return this.environment === 'staging';
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.environment === 'production';
  }

  /**
   * Check if running in test
   */
  isTest(): boolean {
    return this.environment === 'testing';
  }

  /**
   * Reload configuration (useful for hot reloading)
   */
  reload(): void {
    console.log('🔄 Reloading quantum configuration...');
    this.loadConfiguration();
  }

  /**
   * Validate configuration
   */
  validate(): boolean {
    const errors = [];

    // Validate required fields
    const requiredPaths = [
      'server.host',
      'server.port',
      'database.host',
      'database.name',
      'api.url',
      'api.key'
    ];

    for (const path of requiredPaths) {
      if (!this.get(path)) {
        errors.push(`Missing required configuration: ${path}`);
      }
    }

    // Validate port numbers
    const serverPort = this.get('server.port');
    if (serverPort && (isNaN(serverPort) || serverPort < 1 || serverPort > 65535)) {
      errors.push('Invalid server port number');
    }

    const dbPort = this.get('database.port');
    if (dbPort && (isNaN(dbPort) || dbPort < 1 || dbPort > 65535)) {
      errors.push('Invalid database port number');
    }

    // Validate quantum configuration
    const tensionThreshold = this.get('quantum.tension_threshold');
    if (tensionThreshold && (isNaN(tensionThreshold) || tensionThreshold < 0 || tensionThreshold > 1)) {
      errors.push('Tension threshold must be between 0 and 1');
    }

    if (errors.length > 0) {
      console.error('❌ Quantum configuration validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }

    console.log('✅ Quantum configuration validation passed');
    return true;
  }

  /**
   * Generate configuration report
   */
  generateReport(): void {
    console.log('\n⚛️ QUANTUM CONFIGURATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Environment: ${this.environment}`);
    console.log(`🖥️  Server: ${this.get('server.host')}:${this.get('server.port')}`);
    console.log(`🗄️  Database: ${this.get('database.host')}:${this.get('database.port')}/${this.get('database.name')}`);
    console.log(`🌐 API: ${this.get('api.url')}`);
    console.log(`💾 Cache: ${this.get('cache.enabled') ? 'Enabled' : 'Disabled'} (${this.get('cache.provider')})`);
    console.log(`🔒 Security: Session timeout ${this.get('security.session_timeout')}s`);
    console.log(`⚡ Performance: SIMD ${this.get('performance.simd_enabled') ? 'Enabled' : 'Disabled'}, ${this.get('performance.worker_threads')} workers`);
    console.log(`⚛️  Quantum: Tension threshold ${this.get('quantum.tension_threshold')}, decay rate ${this.get('quantum.decay_rate')}`);
    console.log(`📝 Logging: Level ${this.get('logging.level')} (${this.get('logging.format')})`);

    console.log(`\n🚀 Enabled Features:`);
    const features = this.getFeaturesConfig();
    const enabledFeatures = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([name, _]) => name);

    if (enabledFeatures.length === 0) {
      console.log('   No features enabled');
    } else {
      enabledFeatures.forEach(feature => {
        console.log(`   ✅ ${feature}`);
      });
    }

    console.log(`\n🔧 API Endpoints:`);
    const endpoints = this.get('api.endpoints', []);
    if (endpoints.length === 0) {
      console.log('   No endpoints configured');
    } else {
      endpoints.forEach(endpoint => {
        console.log(`   📡 ${endpoint}`);
      });
    }
  }

  /**
   * Export configuration for client-side (safe values only)
   */
  exportClientConfig(): any {
    return {
      environment: this.environment,
      api: {
        url: this.get('api.url'),
        version: this.get('api.version'),
        endpoints: this.get('api.endpoints', [])
      },
      features: this.getFeaturesConfig(),
      server: {
        host: this.get('server.host'),
        port: this.get('server.port')
      },
      quantum: {
        tension_threshold: this.get('quantum.tension_threshold'),
        health_check_interval: this.get('quantum.health_check_interval')
      }
    };
  }

  /**
   * Get configuration summary
   */
  getSummary(): any {
    return {
      environment: this.environment,
      server: this.getServerConfig(),
      database: this.getDatabaseConfig(),
      api: this.getAPIConfig(),
      cache: this.getCacheConfig(),
      security: this.getSecurityConfig(),
      performance: this.getPerformanceConfig(),
      quantum: this.getQuantumConfig(),
      logging: this.getLoggingConfig(),
      features: this.getFeaturesConfig()
    };
  }
}

// Create singleton instance
const quantumConfigManager = new QuantumConfigManager();

// Export as default and named export
export default quantumConfigManager;
export { QuantumConfigManager };

// Hot reloading support
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  process.on('SIGUSR2', () => {
    console.log('📡 Received quantum configuration reload signal');
    quantumConfigManager.reload();
  });
}
