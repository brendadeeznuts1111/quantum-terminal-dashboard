/**
 * State Vault Tests
 * 
 * Tests for encrypted cookie-based state management
 * 
 * Run with:
 * QUANTUM_SECRET=$(openssl rand -hex 32) bun examples/tests/test-state-vault.js
 */

import { saveState, loadState, deleteState, getAllState, clearState } from '../../src/state-vault.js';
import { COOKIE_OPTS } from '../../src/config.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

async function test(name, fn) {
  console.log(`\n🧪 ${name}`);
  try {
    await fn();
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

// Create mock request
const mockRequest = new Request('http://localhost:3000', {
  headers: { 'Cookie': '' }
});

console.log('🔐 State Vault Test Suite\n');
console.log(`Configuration:`);
console.log(`  Cookie Name: ${COOKIE_OPTS.name}`);
console.log(`  HttpOnly: ${COOKIE_OPTS.httpOnly}`);
console.log(`  Secure: ${COOKIE_OPTS.secure}`);
console.log(`  SameSite: ${COOKIE_OPTS.sameSite}`);
console.log(`  MaxAge: ${COOKIE_OPTS.maxAge}s\n`);

// Test 1: Save and load string state
await test('Save and load string state', async () => {
  const cookie = await saveState(mockRequest, 'test_string', 'hello world');
  assert(typeof cookie === 'string', 'Cookie is a string');
  assert(cookie.includes(COOKIE_OPTS.name), 'Cookie contains cookie name');
  
  const loaded = await loadState(mockRequest, 'test_string');
  assert(loaded === 'hello world', 'Loaded string matches saved value');
});

// Test 2: Save and load object state
await test('Save and load object state', async () => {
  const testObj = { id: '123', name: 'Test User', role: 'admin' };
  const cookie = await saveState(mockRequest, 'test_object', testObj);
  
  const loaded = await loadState(mockRequest, 'test_object');
  assert(loaded.id === '123', 'Object id matches');
  assert(loaded.name === 'Test User', 'Object name matches');
  assert(loaded.role === 'admin', 'Object role matches');
});

// Test 3: Save and load array state
await test('Save and load array state', async () => {
  const testArray = [1, 2, 3, 'four', { five: 5 }];
  const cookie = await saveState(mockRequest, 'test_array', testArray);
  
  const loaded = await loadState(mockRequest, 'test_array');
  assert(Array.isArray(loaded), 'Loaded value is an array');
  assert(loaded.length === 5, 'Array length matches');
  assert(loaded[3] === 'four', 'Array element matches');
});

// Test 4: Save and load number state
await test('Save and load number state', async () => {
  const testNum = 42;
  const cookie = await saveState(mockRequest, 'test_number', testNum);
  
  const loaded = await loadState(mockRequest, 'test_number');
  assert(loaded === 42, 'Number matches');
  assert(typeof loaded === 'number', 'Type is number');
});

// Test 5: Save and load boolean state
await test('Save and load boolean state', async () => {
  const cookie = await saveState(mockRequest, 'test_bool', true);
  
  const loaded = await loadState(mockRequest, 'test_bool');
  assert(loaded === true, 'Boolean matches');
  assert(typeof loaded === 'boolean', 'Type is boolean');
});

// Test 6: Load non-existent state
await test('Load non-existent state returns null', async () => {
  const loaded = await loadState(mockRequest, 'non_existent_key');
  assert(loaded === null, 'Non-existent key returns null');
});

// Test 7: Delete state
await test('Delete state', async () => {
  await saveState(mockRequest, 'to_delete', 'value');
  const cookie = await deleteState(mockRequest, 'to_delete');
  
  assert(typeof cookie === 'string', 'Delete returns cookie string');
  const loaded = await loadState(mockRequest, 'to_delete');
  assert(loaded === null, 'Deleted state returns null');
});

// Test 8: Get all state
await test('Get all state', async () => {
  await saveState(mockRequest, 'key1', 'value1');
  await saveState(mockRequest, 'key2', { data: 'value2' });
  
  const allState = await getAllState(mockRequest);
  assert(typeof allState === 'object', 'getAllState returns object');
  assert(allState.key1 === 'value1', 'First key matches');
  assert(allState.key2.data === 'value2', 'Second key matches');
});

// Test 9: Clear all state
await test('Clear all state', async () => {
  await saveState(mockRequest, 'clear1', 'value1');
  await saveState(mockRequest, 'clear2', 'value2');
  
  const cookie = await clearState(mockRequest);
  assert(typeof cookie === 'string', 'Clear returns cookie string');
  
  const allState = await getAllState(mockRequest);
  assert(Object.keys(allState).length === 0, 'All state cleared');
});

// Test 10: Complex nested object
await test('Save and load complex nested object', async () => {
  const complex = {
    user: {
      id: '123',
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
    },
    metadata: {
      created: new Date().toISOString(),
      version: 1
    }
  };
  
  const cookie = await saveState(mockRequest, 'complex', complex);
  const loaded = await loadState(mockRequest, 'complex');
  
  assert(loaded.user.id === '123', 'Nested user id matches');
  assert(loaded.user.profile.name === 'John Doe', 'Nested profile name matches');
  assert(loaded.user.profile.settings.theme === 'dark', 'Deeply nested setting matches');
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log(`❌ ${failed} test(s) failed`);
  process.exit(1);
}

