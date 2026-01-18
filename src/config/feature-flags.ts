// [DOMAIN][FEATURES][FLAGS][HSL:240,70%,85%][META:{ROLLBACK}][CLASS:FeatureFlags]{BUN-API}

/**
 * Feature Flags Management System
 * Demonstrates Bun's YAML import and feature flag implementation
 */

import { features } from './features.yaml';

export function isFeatureEnabled(featureName: string, userEmail?: string): boolean {
  const feature = features[featureName];

  if (!feature?.enabled) {
    return false;
  }

  // Check rollout percentage
  if (feature.rolloutPercentage < 100) {
    const hash = hashCode(userEmail || "anonymous");
    if (hash % 100 >= feature.rolloutPercentage) {
      return false;
    }
  }

  // Check allowed users
  if (feature.allowedUsers && userEmail) {
    return feature.allowedUsers.includes(userEmail);
  }

  return true;
}

export function getFeatureValue(featureName: string, defaultValue: any = null): any {
  const feature = features[featureName];
  
  if (!isFeatureEnabled(featureName)) {
    return defaultValue;
  }

  switch (featureName) {
    case 'darkMode':
      return getDarkModeValue(feature);
    case 'experimentalAPI':
      return feature.endpoints || [];
    default:
      return feature.value || defaultValue;
  }
}

export function getFeatureConfig(featureName: string): any {
  return features[featureName] || null;
}

export function getAllFeatures(): any {
  return features;
}

export function getEnabledFeatures(userEmail?: string): any[] {
  const enabled = [];
  
  for (const [name, feature] of Object.entries(features)) {
    if (isFeatureEnabled(name, userEmail)) {
      enabled.push({
        name,
        ...feature,
        value: getFeatureValue(name)
      });
    }
  }

  return enabled;
}

function getDarkModeValue(feature: any, userPreference?: string): string {
  if (userPreference && userPreference !== 'auto') {
    return userPreference;
  }

  if (feature.default === 'auto') {
    const hour = new Date().getHours();
    return (hour >= 18 || hour < 6) ? 'dark' : 'light';
  }

  return feature.default;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Usage examples with hot reloading support
export function renderDashboard(userEmail?: string) {
  if (isFeatureEnabled("newDashboard", userEmail)) {
    console.log("🎨 Rendering new dashboard");
    // renderNewDashboard();
  } else {
    console.log("🖥️ Rendering legacy dashboard");
    // renderLegacyDashboard();
  }
}

export function setupAPI(userEmail?: string) {
  if (isFeatureEnabled("experimentalAPI", userEmail)) {
    const endpoints = getFeatureValue("experimentalAPI");
    console.log("🔬 Setting up experimental API endpoints:", endpoints);
    // setupExperimentalAPI(endpoints);
  } else {
    console.log("📡 Using standard API");
    // setupStandardAPI();
  }
}

export function applyTheme(userEmail?: string, userPreference?: string) {
  const theme = getFeatureValue("darkMode", "light");
  console.log("🎨 Applying theme:", theme);
  // applyThemeToUI(theme);
}

export function initializeQuantumTerminal(userEmail?: string) {
  if (isFeatureEnabled("quantumTerminal", userEmail)) {
    console.log("⚛️ Initializing quantum terminal");
    // initQuantumTerminal();
  }
}

export function enableRealTimeMonitoring(userEmail?: string) {
  if (isFeatureEnabled("realTimeMonitoring", userEmail)) {
    console.log("📊 Enabling real-time monitoring");
    // startRealTimeMonitoring();
  }
}

export function enableSIMDOptimization(userEmail?: string) {
  if (isFeatureEnabled("simdOptimization", userEmail)) {
    console.log("⚡ Enabling SIMD optimization");
    // enableSIMD();
  }
}

// Feature dependency checker
export function checkFeatureDependencies(featureName: string, availableFeatures: string[] = []): boolean {
  const feature = features[featureName];
  
  if (!feature?.dependencies) {
    return true;
  }

  return feature.dependencies.every((dep: string) => 
    availableFeatures.includes(dep) && isFeatureEnabled(dep)
  );
}

// Feature rollout simulator
export function simulateRollout(featureName: string, userEmails: string[]): any {
  const feature = features[featureName];
  const results = {
    total: userEmails.length,
    enabled: 0,
    disabled: 0,
    percentage: 0,
    users: [] as any[]
  };

  userEmails.forEach(email => {
    const enabled = isFeatureEnabled(featureName, email);
    if (enabled) {
      results.enabled++;
    } else {
      results.disabled++;
    }
    
    results.users.push({
      email,
      enabled: enabled,
      hash: hashCode(email)
    });
  });

  results.percentage = (results.enabled / results.total) * 100;
  return results;
}

// Export for testing
export { hashCode };
