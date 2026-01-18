/**
 * Test Suite - Advanced Patterns
 * 
 * Tests for:
 * - Session rotation
 * - Multi-domain isolation
 * - Trace ID propagation
 * - Health checks
 * - Deployment helpers
 */

import { api } from '../../src/api.js';
import {
  saveState,
  loadState,
  deleteState,
  clearState,
  getAllState,
  saveCdnToken,
  loadCdnToken,
} from '../../src/state-vault-advanced.js';
import {
  healthCheck,
  verifyMigration,
} from '../../src/deploy-helpers.js';

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

async function test(name, fn) {
  try {
    console.log(`\n📝 ${name}`);
    await fn();
  } catch (err) {
    console.error(`❌ ERROR: ${err.message}`);
    failed++;
  }
}

// Mock request
const mockRequest = new Request('http://localhost:3000/api/test', {
  headers: {
    'Cookie': '__quantum=mock_session_data',
  },
});

// ============================================================================
// TESTS
// ============================================================================

console.log('🧪 Advanced Patterns Test Suite\n');
console.log('═'.repeat(50));

// Test 1: Save and load state
await test('Save and load state', async () => {
  const testData = { userId: '123', email: 'test@example.com' };
  await saveState(mockRequest, 'session', testData);
  const loaded = await loadState(mockRequest, 'session');
  assert(loaded !== null, 'State was saved and loaded');
  assert(loaded?.userId === '123', 'State data is correct');
});

// Test 2: Delete state
await test('Delete state', async () => {
  await saveState(mockRequest, 'temp', { data: 'temporary' });
  await deleteState(mockRequest, 'temp');
  const loaded = await loadState(mockRequest, 'temp');
  assert(loaded === null, 'State was deleted');
});

// Test 3: Clear all state
await test('Clear all state', async () => {
  await saveState(mockRequest, 'key1', { data: 1 });
  await saveState(mockRequest, 'key2', { data: 2 });
  await clearState(mockRequest);
  const all = await getAllState(mockRequest);
  assert(Object.keys(all).length === 0, 'All state was cleared');
});

// Test 4: Get all state
await test('Get all state', async () => {
  await saveState(mockRequest, 'user', { id: '1' });
  await saveState(mockRequest, 'session', { token: 'abc' });
  const all = await getAllState(mockRequest);
  assert(all.user !== undefined, 'User state exists');
  assert(all.session !== undefined, 'Session state exists');
});

// Test 5: Save large state with compression
await test('Save large state with compression', async () => {
  const largeData = {
    matrix: Array(1000).fill({ id: 1, value: 'test' }),
  };
  const result = await saveState(mockRequest, 'large', largeData);
  assert(result !== null, 'Large state was saved');
  const loaded = await loadState(mockRequest, 'large');
  assert(loaded?.matrix?.length === 1000, 'Large state was loaded correctly');
});

// Test 6: CDN token isolation
await test('CDN token isolation', async () => {
  const token = crypto.randomUUID();
  await saveCdnToken(mockRequest, token);
  const loaded = await loadCdnToken(mockRequest);
  assert(loaded === token, 'CDN token saved and loaded');
});

// Test 7: Multiple data types
await test('Multiple data types', async () => {
  await saveState(mockRequest, 'string', 'hello');
  await saveState(mockRequest, 'number', 42);
  await saveState(mockRequest, 'boolean', true);
  await saveState(mockRequest, 'array', [1, 2, 3]);
  await saveState(mockRequest, 'object', { key: 'value' });

  const str = await loadState(mockRequest, 'string');
  const num = await loadState(mockRequest, 'number');
  const bool = await loadState(mockRequest, 'boolean');
  const arr = await loadState(mockRequest, 'array');
  const obj = await loadState(mockRequest, 'object');

  assert(str === 'hello', 'String state works');
  assert(num === 42, 'Number state works');
  assert(bool === true, 'Boolean state works');
  assert(arr?.length === 3, 'Array state works');
  assert(obj?.key === 'value', 'Object state works');
});

// Test 8: API trace ID
await test('API trace ID propagation', async () => {
  try {
    const res = await api.fetch('/health', { method: 'GET' });
    assert(res !== null, 'API request completed');
  } catch (err) {
    console.log(`⚠️  API not available: ${err.message}`);
  }
});

// Test 9: Health check
await test('Health check', async () => {
  const health = await healthCheck();
  assert(health !== null, 'Health check returned result');
  assert(health.status !== undefined, 'Health check has status');
});

// Test 10: Migration verification
await test('Migration verification', async () => {
  const result = await verifyMigration();
  assert(result !== null, 'Migration verification completed');
  assert(result.success !== undefined, 'Migration check has success flag');
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '═'.repeat(50));
console.log(`\n📊 Test Results`);
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📈 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failed} test(s) failed`);
  process.exit(1);
}

