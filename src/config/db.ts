// [DOMAIN][DATABASE][CONFIG][HSL:220,70%,85%][META:{CONNECTIONS}][CLASS:DatabaseConfig]{BUN-API}

/**
 * Database Configuration and Connection Management
 * Demonstrates Bun's YAML import with environment variable interpolation
 */

import { connections, migrations, seeds, backup, monitoring, replication } from './database.yaml';
import { createConnection } from './database-driver';

// Parse environment variables with defaults
function parseConfig(config: any): any {
  return JSON.parse(
    JSON.stringify(config).replace(
      /\$\{([^:-]+)(?::([^}]+))?}/g,
      (_, key, defaultValue) => process.env[key] || defaultValue || "",
    ),
  );
}

// Parse configurations
const dbConfig = parseConfig(connections);
const migrationConfig = parseConfig(migrations);
const seedConfig = parseConfig(seeds);
const backupConfig = parseConfig(backup);
const monitoringConfig = parseConfig(monitoring);
const replicationConfig = parseConfig(replication);

// Create database connections
export const db = await createConnection(dbConfig.primary);
export const cache = await createConnection(dbConfig.cache);
export const analytics = await createConnection(dbConfig.analytics);
export const search = await createConnection(dbConfig.search);

// Connection status
export const connectionsStatus = {
  primary: 'connected',
  cache: 'connected',
  analytics: 'connected',
  search: 'connected'
};

// Auto-run migrations if configured
if (migrationConfig.autoRun === "true") {
  console.log("🔄 Running database migrations...");
  try {
    await runMigrations(db, migrationConfig.directory);
    console.log("✅ Migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  }
}

// Seed database if configured
if (seedConfig.enabled === "true") {
  console.log("🌱 Seeding database...");
  try {
    await seedDatabase(db, seedConfig.directory, seedConfig.truncate);
    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    throw error;
  }
}

// Setup backup if configured
if (backupConfig.enabled === "true") {
  console.log("💾 Setting up database backup...");
  setupBackup(db, backupConfig);
}

// Setup monitoring if configured
if (monitoringConfig.enabled === "true") {
  console.log("📊 Setting up database monitoring...");
  setupMonitoring(db, monitoringConfig);
}

// Setup replication if configured
if (replicationConfig.enabled === "true") {
  console.log("🔄 Setting up database replication...");
  setupReplication(db, replicationConfig);
}

// Helper functions
async function runMigrations(connection: any, directory: string): Promise<void> {
  // Mock migration runner
  console.log(`Running migrations from: ${directory}`);
  // In real implementation:
  // const migrationFiles = await fs.readdir(directory);
  // for (const file of migrationFiles.sort()) {
  //   const migration = await import(path.join(directory, file));
  //   await migration.up(connection);
  // }
}

async function seedDatabase(connection: any, directory: string, truncate: boolean = false): Promise<void> {
  // Mock seeder
  console.log(`Seeding database from: ${directory}, truncate: ${truncate}`);
  // In real implementation:
  // if (truncate) {
  //   await connection.query('TRUNCATE TABLE users, posts CASCADE');
  // }
  // const seedFiles = await fs.readdir(directory);
  // for (const file of seedFiles) {
  //   const seed = await import(path.join(directory, file));
  //   await seed.run(connection);
  // }
}

function setupBackup(connection: any, config: any): void {
  console.log(`Backup enabled with schedule: ${config.schedule}`);
  console.log(`Retention: ${config.retention}, Directory: ${config.directory}`);
  // In real implementation:
  // cron.schedule(config.schedule, () => {
  //   performBackup(connection, config);
  // });
}

function setupMonitoring(connection: any, config: any): void {
  console.log("Database monitoring enabled");
  console.log(`Metrics - Connections: ${config.metrics.connections}, Queries: ${config.metrics.queries}`);
  console.log(`Slow query threshold: ${config.metrics.threshold}ms`);
  // In real implementation:
  // if (config.metrics.connections) {
  //   monitorConnections(connection);
  // }
  // if (config.metrics.queries) {
  //   monitorQueries(connection, config.metrics.threshold);
  // }
}

function setupReplication(connection: any, config: any): void {
  console.log(`Replication enabled in ${config.mode} mode`);
  console.log(`Master: ${config.master.host}:${config.master.port}`);
  console.log(`Slaves: ${config.slaves.length} configured`);
  // In real implementation:
  // if (config.mode === 'master-slave') {
  //   setupMasterSlaveReplication(config);
  // }
}

// Health check functions
export async function checkDatabaseHealth(): Promise<any> {
  const health = {
    primary: await checkConnection(db, 'Primary'),
    cache: await checkConnection(cache, 'Cache'),
    analytics: await checkConnection(analytics, 'Analytics'),
    search: await checkConnection(search, 'Search')
  };

  const overall = Object.values(health).every(status => status.healthy);
  return { overall, connections: health };
}

async function checkConnection(connection: any, name: string): Promise<any> {
  try {
    const start = Date.now();
    await connection.query('SELECT 1');
    const latency = Date.now() - start;
    
    return {
      name,
      healthy: true,
      latency,
      status: 'connected'
    };
  } catch (error) {
    return {
      name,
      healthy: false,
      latency: -1,
      status: 'error',
      error: error.message
    };
  }
}

// Configuration accessors
export function getDatabaseConfig(): any {
  return dbConfig;
}

export function getCacheConfig(): any {
  return dbConfig.cache;
}

export function getAnalyticsConfig(): any {
  return dbConfig.analytics;
}

export function getSearchConfig(): any {
  return dbConfig.search;
}

export function getMigrationConfig(): any {
  return migrationConfig;
}

export function getBackupConfig(): any {
  return backupConfig;
}

export function getMonitoringConfig(): any {
  return monitoringConfig;
}

export function getReplicationConfig(): any {
  return replicationConfig;
}

// Connection utilities
export async function closeAllConnections(): Promise<void> {
  console.log("🔄 Closing all database connections...");
  
  try {
    await db.close();
    await cache.close();
    await analytics.close();
    await search.close();
    console.log("✅ All connections closed successfully");
  } catch (error) {
    console.error("❌ Error closing connections:", error.message);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing database connections...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing database connections...');
  await closeAllConnections();
  process.exit(0);
});

// Export configuration for debugging
export const debugInfo = {
  parsedConfig: dbConfig,
  migrationConfig,
  seedConfig,
  backupConfig,
  monitoringConfig,
  replicationConfig,
  connectionsStatus
};
