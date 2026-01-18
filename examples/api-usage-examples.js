/**
 * Quantum Terminal Dashboard API Usage Examples
 *
 * This file demonstrates comprehensive usage of all APIs and components
 * in the Quantum Terminal Dashboard project.
 */

import { BunFetchClient } from '../src/api/bun-fetch-client.js';
import { startTerminalServer } from '../src/servers/terminal-server.js';
import { startHttpServer } from '../src/servers/http-server.js';

// ============================================================================
// 1. BUN FETCH CLIENT EXAMPLES
// ============================================================================

/**
 * Example 1: Basic HTTP requests with Bun Fetch Client
 */
async function basicFetchExample() {
  console.log('🚀 Basic Fetch Client Example');

  const client = new BunFetchClient('https://api.example.com');

  try {
    // GET request
    const healthResponse = await client.get('/api/v1/health');
    console.log('Health check:', healthResponse);

    // POST request with JSON
    const analyticsResponse = await client.post('/api/v1/analytics', {
      timeframe: '1h',
      metrics: ['response_time', 'error_rate']
    });
    console.log('Analytics:', analyticsResponse);

    // PUT request
    const configResponse = await client.put('/api/v1/config', {
      theme: 'quantum',
      notifications: true
    });
    console.log('Config update:', configResponse);

  } catch (error) {
    console.error('Request failed:', error);
  }
}

/**
 * Example 2: Advanced Bun features (DNS prefetch, streaming, etc.)
 */
async function advancedFetchExample() {
  console.log('🔧 Advanced Fetch Client Example');

  const client = new BunFetchClient('https://staging-api.example.com');

  // DNS prefetching
  await client.prefetchDNS('staging-api.example.com');
  console.log('DNS prefetched');

  // Connection prewarming
  await client.preconnect('https://staging-api.example.com');
  console.log('Connection prewarmed');

  // Timeout control
  const timeoutResponse = await client.fetchWithTimeout(
    '/api/v1/metrics',
    5000
  );
  console.log('Timeout response:', timeoutResponse);

  // Streaming response
  console.log('Streaming response:');
  for await (const chunk of client.streamResponse('/api/v1/tension')) {
    console.log('Chunk:', chunk.toString().slice(0, 50) + '...');
  }

  // S3 access
  const s3File = await client.fetchS3('my-bucket', 'data/export.json', {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
  });
  console.log('S3 file:', await s3File.text());
}

/**
 * Example 3: Error handling and retries
 */
async function errorHandlingExample() {
  console.log('🛡️ Error Handling Example');

  const client = new BunFetchClient('https://api.example.com');

  // Automatic retries with exponential backoff
  async function fetchWithRetry(path, maxRetries = 3) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const response = await client.get(path);
        if (response.ok) return response;
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) throw error;

        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  try {
    const data = await fetchWithRetry('/api/v1/health');
    console.log('Success after retries:', data);
  } catch (error) {
    console.error('All retries failed:', error);
  }
}

// ============================================================================
// 2. TERMINAL SERVER EXAMPLES
// ============================================================================

/**
 * Example 4: Terminal server setup and management
 */
async function terminalServerExample() {
  console.log('🖥️ Terminal Server Example');

  // Start terminal server
  const server = startTerminalServer(3001);
  console.log('Terminal server started on port 3001');

  // WebSocket client connection
  const ws = new WebSocket('wss://terminal.example.com/terminal');

  ws.onopen = () => {
    console.log('Connected to terminal');

    // Send terminal input
    ws.send(JSON.stringify({
      type: 'terminal_input',
      data: 'echo "Hello Quantum Terminal"\n'
    }));

    // Execute quantum command
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'terminal_command',
        command: 'quantum.help'
      }));
    }, 1000);

    // Resize terminal
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'terminal_resize',
        cols: 120,
        rows: 30
      }));
    }, 2000);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'terminal_data') {
      console.log('Terminal output:', data.data);
    }
  };

  ws.onclose = () => {
    console.log('Terminal connection closed');
  };

  // Cleanup after 10 seconds
  setTimeout(() => {
    ws.close();
    server.stop();
  }, 10000);
}

/**
 * Example 5: Session management and monitoring
 */
async function sessionManagementExample() {
  console.log('📊 Session Management Example');

  const server = startTerminalServer(3002);

  // Monitor active sessions
  setInterval(async () => {
    try {
      const response = await fetch('https://terminal.example.com/api/sessions');
      const { sessions } = await response.json();

      console.log(`Active sessions: ${sessions.length}`);
      sessions.forEach(session => {
        console.log(`  - ${session.id}: ${session.config.cols}x${session.config.rows}`);
      });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  }, 5000);

  // Cleanup
  setTimeout(() => server.stop(), 30000);
}

// ============================================================================
// 3. HTTP SERVER EXAMPLES
// ============================================================================

/**
 * Example 6: HTTP server with dashboard
 */
async function httpServerExample() {
  console.log('🌐 HTTP Server Example');

  // Start both servers
  const { httpServer, wsServer } = await startServers(3000, 3001);

  console.log('Servers started:');
  console.log('  HTTP: https://dashboard.example.com');
  console.log('  WS: wss://terminal.example.com/terminal');

  // Test endpoints
  setTimeout(async () => {
    try {
      // Health check
      const healthResponse = await fetch('https://dashboard.example.com/health');
      console.log('Health:', await healthResponse.json());

      // Server info
      const infoResponse = await fetch('https://dashboard.example.com/api/info');
      console.log('Info:', await infoResponse.json());

    } catch (error) {
      console.error('HTTP test failed:', error);
    }
  }, 2000);

  // Cleanup
  setTimeout(() => {
    httpServer.stop();
    wsServer.stop();
  }, 15000);
}

// ============================================================================
// 4. REACT COMPONENTS EXAMPLES (Pseudocode)
// ============================================================================

/**
 * Example 7: WebSocketTerminal component usage
 */
function WebSocketTerminalExample() {
  console.log('⚛️ WebSocketTerminal Component Example');

  // In a React component:
  /*
  import { WebSocketTerminal, WebSocketTerminalHandle } from './src/components/Terminal/WebSocketTerminal';

  function App() {
    const terminalRef = useRef<WebSocketTerminalHandle>(null);

    const handleCommand = () => {
      terminalRef.current?.send({
        type: 'terminal_command',
        command: 'quantum.status'
      });
    };

    return (
      <div style={{ height: '100vh' }}>
        <button onClick={handleCommand}>Get Status</button>
        <WebSocketTerminal
          ref={terminalRef}
          url="wss://terminal.example.com/terminal"
          theme={{
            background: '#000010',
            foreground: '#00f0ff',
            cursor: '#9d00ff'
          }}
          onConnect={() => console.log('Terminal connected')}
          onData={(data) => console.log('Terminal data:', data)}
        />
      </div>
    );
  }
  */
}

/**
 * Example 8: FinancialTerminal component usage
 */
function FinancialTerminalExample() {
  console.log('💰 FinancialTerminal Component Example');

  // In a React component:
  /*
  import { FinancialTerminal } from './src/components/Terminal/FinancialTerminal';

  function FinancialDashboard() {
    const [marketData, setMarketData] = useState([]);

    return (
      <div style={{ height: '100vh', padding: '20px' }}>
        <h1>Quantum Financial Dashboard</h1>

        <FinancialTerminal
          websocketUrl="wss://terminal.example.com/terminal"
          symbols={['AAPL', 'GOOGL', 'TSLA', 'MSFT']}
          theme="quantum"
          onData={(data) => {
            // Process market data
            const parsed = parseMarketData(data);
            setMarketData(prev => [...prev, parsed]);
          }}
          onConnect={() => console.log('Financial terminal connected')}
        />

        <div style={{ marginTop: '20px' }}>
          <h2>Recent Market Data</h2>
          {marketData.slice(-5).map((item, i) => (
            <div key={i}>{JSON.stringify(item)}</div>
          ))}
        </div>
      </div>
    );
  }
  */
}

// ============================================================================
// 5. INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example 9: Complete system integration
 */
async function fullSystemExample() {
  console.log('🚀 Full System Integration Example');

  // Start all servers
  const { httpServer, wsServer } = await startServers(3000, 3001);

  // Initialize API client
  const apiClient = new BunFetchClient('https://api.example.com');

  // Wait for servers to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    // Test staging API
    console.log('Testing staging API...');
    const health = await apiClient.get('/api/v1/health');
    console.log('Health check passed:', health.ok);

    // Test metrics
    const metrics = await apiClient.get('/api/v1/metrics');
    console.log('Metrics retrieved:', metrics.ok);

    // Test tension monitoring
    const tension = await apiClient.get('/api/v1/tension');
    console.log('Tension data retrieved:', tension.ok);

    // WebSocket terminal test
    const ws = new WebSocket('wss://terminal.example.com/terminal');

    ws.onopen = () => {
      console.log('WebSocket connected');

      // Send quantum command
      ws.send(JSON.stringify({
        type: 'terminal_command',
        command: 'quantum.status'
      }));

      // Close after response
      setTimeout(() => ws.close(), 5000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Terminal response:', data);
    };

    // Wait for WebSocket test
    await new Promise(resolve => setTimeout(resolve, 6000));

  } catch (error) {
    console.error('Integration test failed:', error);
  } finally {
    // Cleanup
    httpServer.stop();
    wsServer.stop();
    console.log('Servers stopped');
  }
}

/**
 * Example 10: Performance testing
 */
async function performanceExample() {
  console.log('📊 Performance Testing Example');

  const client = new BunFetchClient('https://api.example.com');
  const iterations = 100;

  console.log(`Running ${iterations} API calls...`);

  const startTime = performance.now();

  const promises = Array.from({ length: iterations }, () =>
    client.get('/api/v1/health')
  );

  const results = await Promise.all(promises);
  const endTime = performance.now();

  const successCount = results.filter(r => r.ok).length;
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;

  console.log('Performance Results:');
  console.log(`  Total requests: ${iterations}`);
  console.log(`  Successful: ${successCount}`);
  console.log(`  Failed: ${iterations - successCount}`);
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Average time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Requests/sec: ${(1000 / avgTime).toFixed(2)}`);
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🎯 Running Quantum Terminal Dashboard API Examples\n');

  try {
    // Basic fetch examples
    await basicFetchExample();
    console.log('');

    await advancedFetchExample();
    console.log('');

    await errorHandlingExample();
    console.log('');

    // Server examples (run in parallel for speed)
    await Promise.all([
      terminalServerExample(),
      sessionManagementExample(),
      httpServerExample()
    ]);
    console.log('');

    // Component examples (just show code)
    WebSocketTerminalExample();
    console.log('');
    FinancialTerminalExample();
    console.log('');

    // Integration and performance
    await fullSystemExample();
    console.log('');

    await performanceExample();
    console.log('');

    console.log('✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Example execution failed:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (import.meta.main) {
  runAllExamples();
}

export {
  basicFetchExample,
  advancedFetchExample,
  errorHandlingExample,
  terminalServerExample,
  sessionManagementExample,
  httpServerExample,
  WebSocketTerminalExample,
  FinancialTerminalExample,
  fullSystemExample,
  performanceExample,
  runAllExamples
};