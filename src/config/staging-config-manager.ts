// [DOMAIN][CONFIG][STAGING][HSL:180,70%,85%][META:{STAGING-ENV}][CLASS:StagingConfigManager]{BUN-API}

/**
 * Staging Configuration Manager
 * Handles staging-specific configuration with environment variable interpolation
 */

import configs from './staging-config-fixed.yaml';

class StagingConfigManager {
  private config: any;
  private interpolatedConfig: any;

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load and interpolate staging configuration
   */
  private loadConfiguration(): void {
    try {
      const stagingConfig = configs.staging;
      
      if (!stagingConfig) {
        throw new Error('Staging configuration not found');
      }

      // Interpolate environment variables
      this.interpolatedConfig = this.interpolateEnvVars(stagingConfig);
      this.config = stagingConfig;

      console.log('✅ Staging configuration loaded successfully');
    } catch (error) {
      console.error(`❌ Failed to load staging configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recursively interpolate environment variables
   */
  private interpolateEnvVars(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^:}]+)(?::([^}]+))?\}/g, (_, key, defaultValue) => {
        const envValue = process.env[key];
        if (envValue === undefined) {
          if (defaultValue !== undefined) {
            console.warn(`⚠️ Environment variable '${key}' not found, using default: ${defaultValue}`);
            return defaultValue;
          } else {
            console.warn(`⚠️ Environment variable '${key}' not found and no default provided`);
            return '';
          }
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
   * Get logging configuration
   */
  getLoggingConfig(): any {
    return this.get('logging', {});
  }

  /**
   * Get security configuration
   */
  getSecurityConfig(): any {
    return this.get('security', {});
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): any {
    return this.get('cache', {});
  }

  /**
   * Get features configuration
   */
  getFeaturesConfig(): any {
    return this.get('features', {});
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): any {
    return this.get('performance', {});
  }

  /**
   * Get quantum configuration
   */
  getQuantumConfig(): any {
    return this.get('quantum', {});
  }

  /**
   * Get notifications configuration
   */
  getNotificationsConfig(): any {
    return this.get('notifications', {});
  }

  /**
   * Get external services configuration
   */
  getExternalServicesConfig(): any {
    return this.get('external_services', {});
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    const features = this.getFeaturesConfig();
    return features[featureName] === true;
  }

  /**
   * Get API endpoints
   */
  getAPIEndpoints(): string[] {
    return this.get('api.endpoints', []);
  }

  /**
   * Get database connection string
   */
  getDatabaseConnectionString(): string {
    const db = this.getDatabaseConfig();
    const ssl = db.ssl ? '?ssl=true' : '';
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.name}${ssl}`;
  }

  /**
   * Get Redis connection string
   */
  getRedisConnectionString(): string {
    const cache = this.getCacheConfig();
    const auth = cache.password ? `:${cache.password}@` : '';
    return `redis://${auth}${cache.host}:${cache.port}/${cache.db || 0}`;
  }

  /**
   * Validate staging configuration
   */
  validate(): boolean {
    const errors = [];

    // Validate required fields
    const requiredPaths = [
      'server.host',
      'server.port',
      'database.host',
      'database.name',
      'database.username',
      'database.password',
      'api.url',
      'api.key',
      'security.jwt_secret'
    ];

    for (const path of requiredPaths) {
      const value = this.get(path);
      if (!value || value === '') {
        errors.push(`Missing required configuration: ${path}`);
      }
    }

    // Validate specific staging requirements
    const apiHost = this.get('api.url');
    if (!apiHost.includes('staging')) {
      errors.push('API URL should contain "staging" for staging environment');
    }

    const dbHost = this.get('database.host');
    if (!dbHost.includes('staging') && dbHost !== 'localhost') {
      errors.push('Database host should contain "staging" for staging environment');
    }

    // Validate quantum configuration
    const tensionThreshold = this.get('quantum.tension_threshold');
    if (tensionThreshold && (isNaN(tensionThreshold) || tensionThreshold < 0 || tensionThreshold > 1)) {
      errors.push('Tension threshold must be between 0 and 1');
    }

    if (errors.length > 0) {
      console.error('❌ Staging configuration validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }

    console.log('✅ Staging configuration validation passed');
    return true;
  }

  /**
   * Generate staging configuration report
   */
  generateReport(): void {
    console.log('\n🚀 STAGING CONFIGURATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🖥️  Server: ${this.get('server.host')}:${this.get('server.port')}`);
    console.log(`🗄️  Database: ${this.get('database.host')}:${this.get('database.port')}/${this.get('database.name')}`);
    console.log(`🌐 API: ${this.get('api.url')} (v${this.get('api.version')})`);
    console.log(`💾 Cache: ${this.get('cache.enabled') ? 'Enabled' : 'Disabled'} (${this.get('cache.provider')})`);
    console.log(`🔒 Security: JWT configured, Rate limiting: ${this.get('security.rate_limiting.enabled') ? 'Enabled' : 'Disabled'}`);
    console.log(`⚡ Performance: SIMD ${this.get('performance.simd_enabled') ? 'Enabled' : 'Disabled'}, ${this.get('performance.worker_threads')} workers`);
);
    console.log(`⚛️  Quantum: Tension threshold ${this.get('quantum.tension_threshold')}, Analytics ${this.get('quantum.analytics_enabled') ? 'Enabled' : 'Disabled'}`);
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

    console.log(`\n📡 API Endpoints:`);
    const endpoints = this.getAPIEndpoints();
    if (endpoints.length === 0) {
      console.log('   No endpoints configured');
    } else {
      endpoints.forEach(endpoint => {
        console.log(`   📡 ${endpoint}`);
      });
    }

    console.log(`\n🔔 Notifications:`);
    const notifications = this.getNotificationsConfig();
    if (notifications.slack?.webhook_url) {
      console.log(`   📱 Slack: ${notifications.slack.channel}`);
    }
    if (notifications.email?.smtp_host) {
      console.log(`   📧 Email: ${notifications.email.from}`);
    }

    console.log(`\n🌐 External Services:`);
    const external = this.getExternalServicesConfig();
    console.log(`   📊 Analytics: ${external.analytics.provider}`);
    console.log(`   🌍 CDN: ${external.cdn.provider}`);
    console.log(`   📈 Monitoring: ${external.monitoring.provider}`);
  }

  /**
   * Export staging configuration for deployment
   */
  exportDeploymentConfig(): any {
    return {
      environment: 'staging',
      server: this.getServerConfig(),
      database: {
        host: this.get('database.host'),
        port: this.get('database.port'),
        name: this.get('database.name'),
        ssl: this.get('database.ssl'),
        pool: this.get('database.pool')
      },
      api: {
        url: this.get('api.url'),
        version: this.get('api.version'),
        endpoints: this.getAPIEndpoints()
      },
      cache: this.getCacheConfig(),
      features: this.getFeaturesConfig(),
      performance: this.getPerformanceConfig(),
      quantum: this.getQuantumConfig(),
      notifications: {
        slack: {
          channel: this.get('notifications.slack.channel')
        },
        email: {
          from: this.get('notifications.email.from')
        }
      },
      external_services: {
        analytics: {
          provider: this.get('external_services.analytics.provider')
        },
        cdn: {
          provider: this.get('external_services.cdn.provider'),
          domain: this.get('external_services.cdn.domain')
        },
        monitoring: {
          provider: this.get('external_services.monitoring.provider')
        }
      }
    };
  }

  /**
   * Get environment variables summary
   */
  getRequiredEnvironmentVariables(): string[] {
    return [
      'STAGING_DB_HOST',
      'STAGING_DB_USER',
      'STAGING_DB_PASS',
      'STAGING_API_KEY',
      'STAGING_JWT_SECRET',
      'STAGING_ENCRYPTION_KEY',
      'STAGING_REDIS_HOST',
      'STAGING_SLACK_WEBHOOK',
      'STAGING_SMTP_HOST',
      'STAGING_ANALYTICS_KEY',
      'STAGING_MONITORING_KEY'
    ];
  }

  /**
   * Check environment variables status
   */
  checkEnvironmentVariables(): any {
    const required = this.getRequiredEnvironmentVariables();
    const status = {
      configured: [],
      missing: [],
      total: required.length
    };

    required.forEach(envVar => {
      if (process.env[envVar]) {
        status.configured.push(envVar);
      } else {
        status.missing.push(envVar);
      }
    });

    status.percentage = (status.configured.length / status.total) * 100;
    return status;
  }
}

// Create singleton instance
const stagingConfigManager = new StagingConfigManager();

// Export as default and named export
export default stagingConfigManager;
export { StagingConfigManager };

// Hot reloading support
if (typeof process !== 'undefined') {
  process.on('SIGUSR2', () => {
    console.log('📡 Received staging configuration reload signal');
    stagingConfigManager['loadConfiguration']();
  });
}
