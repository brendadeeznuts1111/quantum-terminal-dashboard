// [DOMAIN][DATABASE][DRIVER][HSL:220,70%,85%][META:{MOCK}][CLASS:DatabaseDriver]{BUN-API}

/**
 * Mock Database Driver for Testing
 * Simulates database connections for configuration testing
 */

export async function createConnection(config: any): Promise<any> {
  console.log(`🔗 Creating ${config.type} connection to ${config.host}:${config.port}`);
  
  return {
    type: config.type,
    host: config.host,
    port: config.port,
    database: config.database,
    
    async query(sql: string, params?: any[]): Promise<any> {
      console.log(`📊 Executing query: ${sql}`);
      return { rows: [], rowCount: 0 };
    },
    
    async close(): Promise<void> {
      console.log(`🔌 Closing ${config.type} connection`);
    },
    
    async ping(): Promise<boolean> {
      return true;
    },
    
    getStatus(): string {
      return 'connected';
    }
  };
}
