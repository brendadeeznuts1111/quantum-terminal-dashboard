// Optimization 15: SIGUSR2 live tunables
"use strict";

// Using Bun's native file operations (Bun-Pure compliant)

export class LiveTunables {
  constructor(configPath = '/tmp/quantum-tune.json') {
    this.configPath = configPath;
    this.tunables = new Map();
    this.watchers = new Map();
    this.signalHandlers = new Map();
    this.isListening = false;
    
    // Default tunables
    this.setDefaults();
    
    // Start listening for SIGUSR2
    this.setupSignalHandler();
  }

  setDefaults() {
    // Default configuration values
    this.tunables.set('decayRate', 0.015);
    this.tunables.set('noiseFloor', 0.008);
    this.tunables.set('maxTensions', 1000000);
    this.tunables.set('batchSize', 8);
    this.tunables.set('updateInterval', 16); // ms
    this.tunables.set('enableSIMD', true);
    this.tunables.set('enableWASM', true);
    this.tunables.set('logLevel', 'info');
    this.tunables.set('memoryLimit', 512 * 1024 * 1024); // 512MB
    this.tunables.set('cpuThreshold', 0.8); // 80%
  }

  setupSignalHandler() {
    if (typeof process !== 'undefined' && process.on) {
      process.on('SIGUSR2', () => {
        this.handleSignal();
      });
      
      process.on('SIGUSR1', () => {
        this.dumpConfig();
      });
      
      this.isListening = true;
      console.log('📡 Live tunables listening on SIGUSR2');
    }
  }

  async handleSignal() {
    try {
      console.log('🔄 SIGUSR2 received - reloading configuration...');
      
      // Read new configuration atomically
      const newConfig = await this.readConfigAtomically();
      
      if (newConfig) {
        await this.applyConfig(newConfig);
        console.log('✅ Configuration updated successfully');
      } else {
        console.log('ℹ️ No configuration changes found');
      }
    } catch (error) {
      console.error('❌ Failed to reload configuration:', error.message);
    }
  }

  async readConfigAtomically() {
    try {
      // Check if config file exists
      const tempPath = `${this.configPath}.tmp`;
      
      // Try to read temporary file first (atomic write in progress)
      try {
        const tempFile = Bun.file(tempPath);
        const tempData = await tempFile.text();
        const config = JSON.parse(tempData);
        
        // Move temp to main config atomically
        await Bun.write(this.configPath, tempData);
        await Bun.write(tempPath, ''); // Clear temp
        return config;
      } catch (tempError) {
        // No temp file, read main config
      }
      
      // Read main config file
      const file = Bun.file(this.configPath);
      if (!(await file.exists())) {
        // Config file doesn't exist, create default
        await this.writeDefaultConfig();
        return null;
      }
      const data = await file.text();
      return JSON.parse(data);
    } catch (error) {
      throw error;
    }
  }

  async writeDefaultConfig() {
    const defaultConfig = {};
    for (const [key, value] of this.tunables) {
      defaultConfig[key] = value;
    }
    
    const tempPath = `${this.configPath}.tmp`;
    const configJson = JSON.stringify(defaultConfig, null, 2);
    
    // Atomic write: temp -> rename
    await Bun.write(tempPath, configJson);
    await Bun.write(this.configPath, configJson);
    await Bun.write(tempPath, ''); // Clear temp
    
    console.log(`📝 Default config written to ${this.configPath}`);
  }

  async applyConfig(newConfig) {
    const changes = [];
    
    for (const [key, newValue] of Object.entries(newConfig)) {
      const oldValue = this.tunables.get(key);
      
      if (oldValue !== undefined && oldValue !== newValue) {
        // Validate the new value
        if (this.validateTunable(key, newValue)) {
          this.tunables.set(key, newValue);
          changes.push({ key, oldValue, newValue });
          
          // Notify callbacks
          this.notifyChange(key, oldValue, newValue);
        } else {
          console.warn(`⚠️ Invalid value for ${key}: ${newValue}`);
        }
      }
    }
    
    if (changes.length > 0) {
      console.log(`📊 Applied ${changes.length} configuration changes:`);
      changes.forEach(({ key, oldValue, newValue }) => {
        console.log(`   ${key}: ${oldValue} → ${newValue}`);
      });
    }
    
    return changes;
  }

  validateTunable(key, value) {
    switch (key) {
      case 'decayRate':
        return typeof value === 'number' && value >= 0 && value <= 1;
      case 'noiseFloor':
        return typeof value === 'number' && value >= 0 && value <= 1;
      case 'maxTensions':
        return typeof value === 'number' && value > 0 && value <= 10000000;
      case 'batchSize':
        return typeof value === 'number' && value > 0 && (value & (value - 1)) === 0; // Power of 2
      case 'updateInterval':
        return typeof value === 'number' && value >= 1 && value <= 1000;
      case 'enableSIMD':
      case 'enableWASM':
        return typeof value === 'boolean';
      case 'logLevel':
        return ['debug', 'info', 'warn', 'error'].includes(value);
      case 'memoryLimit':
        return typeof value === 'number' && value > 0;
      case 'cpuThreshold':
        return typeof value === 'number' && value >= 0 && value <= 1;
      default:
        return true; // Unknown tunables are allowed
    }
  }

  // Get current tunable value
  get(key) {
    return this.tunables.get(key);
  }

  // Set tunable value locally (not persisted)
  set(key, value) {
    if (this.validateTunable(key, value)) {
      const oldValue = this.tunables.get(key);
      this.tunables.set(key, value);
      this.notifyChange(key, oldValue, value);
      return true;
    }
    return false;
  }

  // Register callback for tunable changes
  onChange(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key).add(callback);
  }

  // Unregister callback
  offChange(key, callback) {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.watchers.delete(key);
      }
    }
  }

  // Notify all callbacks of a change
  notifyChange(key, oldValue, newValue) {
    const callbacks = this.watchers.get(key);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`❌ Callback error for ${key}:`, error.message);
        }
      }
    }
  }

  // Get all current tunables
  getAll() {
    return Object.fromEntries(this.tunables);
  }

  // Dump current configuration to console
  dumpConfig() {
    console.log('📋 Current tunables configuration:');
    for (const [key, value] of this.tunables) {
      console.log(`   ${key}: ${value} (${typeof value})`);
    }
  }

  // Write current configuration to file
  async saveConfig(path = null) {
    const configPath = path || this.configPath;
    const config = {};
    
    for (const [key, value] of this.tunables) {
      config[key] = value;
    }
    
    const tempPath = `${configPath}.tmp`;
    const configJson = JSON.stringify(config, null, 2);
    
    // Atomic write
    await Bun.write(tempPath, configJson);
    await Bun.write(configPath, configJson);
    await Bun.write(tempPath, ''); // Clear temp
    
    console.log(`💾 Configuration saved to ${configPath}`);
  }

  // Load configuration from file
  async loadConfig(path = null) {
    const configPath = path || this.configPath;
    
    try {
      const file = Bun.file(configPath);
      if (!(await file.exists())) {
        console.error(`❌ Config file not found: ${configPath}`);
        return false;
      }
      const data = await file.text();
      const config = JSON.parse(data);
      await this.applyConfig(config);
      return true;
    } catch (error) {
      console.error(`❌ Failed to load config from ${configPath}:`, error.message);
      return false;
    }
  }

  // Reset to defaults
  reset() {
    const oldConfig = Object.fromEntries(this.tunables);
    this.setDefaults();
    
    const changes = [];
    for (const [key, newValue] of this.tunables) {
      const oldValue = oldConfig[key];
      if (oldValue !== newValue) {
        changes.push({ key, oldValue, newValue });
        this.notifyChange(key, oldValue, newValue);
      }
    }
    
    console.log(`🔄 Reset ${changes.length} tunables to defaults`);
    return changes;
  }

  // Get performance metrics
  getMetrics() {
    return {
      isListening: this.isListening,
      tunablesCount: this.tunables.size,
      watchersCount: Array.from(this.watchers.values()).reduce((sum, set) => sum + set.size, 0),
      configPath: this.configPath
    };
  }

  // Cleanup resources
  destroy() {
    if (typeof process !== 'undefined' && process.removeAllListeners) {
      process.removeAllListeners('SIGUSR2');
      process.removeAllListeners('SIGUSR1');
    }
    
    this.watchers.clear();
    this.tunables.clear();
    this.isListening = false;
    
    console.log('🧹 Live tunables cleaned up');
  }
}

// Utility function for atomic config updates
export async function updateConfigAtomically(configPath, updates) {
  const tunables = new LiveTunables(configPath);
  
  try {
    // Read current config
    const currentConfig = await tunables.readConfigAtomically() || {};
    
    // Apply updates
    const newConfig = { ...currentConfig, ...updates };
    
    // Write atomically
    const tempPath = `${configPath}.tmp`;
    const configJson = JSON.stringify(newConfig, null, 2);
    
    await Bun.write(tempPath, configJson);
    await Bun.write(configPath, configJson);
    await Bun.write(tempPath, ''); // Clear temp
    
    console.log(`✅ Config updated atomically: ${Object.keys(updates).join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Atomic config update failed:', error.message);
    return false;
  } finally {
    tunables.destroy();
  }
}

// Example usage:
// const tunables = new LiveTunables();
// tunables.onChange('decayRate', (newValue, oldValue) => {
//   console.log(`Decay rate changed: ${oldValue} → ${newValue}`);
//   // Update your decay engine here
// });
//
// // Update config from external process:
// // echo '{"decayRate": 0.02}' > /tmp/quantum-tune.tmp && mv /tmp/quantum-tune.tmp /tmp/quantum-tune.json
// // kill -SIGUSR2 <pid>

export default LiveTunables;