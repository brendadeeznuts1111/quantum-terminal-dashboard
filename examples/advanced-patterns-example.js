/**
 * Advanced Patterns Example
 * 
 * Demonstrates:
 * - Session rotation
 * - Multi-domain cookie isolation
 * - Trace ID propagation
 * - Health checks
 * - Deployment uploads
 * - Migration verification
 */

import { api } from '../src/api.js';
import {
  rotateSession,
  saveState,
  loadState,
  saveCdnToken,
  loadCdnToken,
} from '../src/state-vault-advanced.js';
import {
  healthCheck,
  deploymentUpload,
  verifyMigration,
  getDeploymentStatus,
} from '../src/deploy-helpers.js';

console.log('🚀 Advanced Patterns Example\n');

// ============================================================================
// 1. HEALTH CHECK WITH COOKIE STATE
// ============================================================================
console.log('1️⃣  Health Check');
console.log('─'.repeat(50));

const health = await healthCheck();
console.log(`Status: ${health.healthy ? '✅' : '❌'} ${health.message}`);
console.log(`HTTP Status: ${health.status}\n`);

// ============================================================================
// 2. SESSION ROTATION
// ============================================================================
console.log('2️⃣  Session Rotation');
console.log('─'.repeat(50));

// Simulate a request with session
const mockRequest = new Request('http://localhost:3000/api/test', {
  headers: {
    'Cookie': '__quantum=mock_session_data',
  },
});

console.log('Rotating session...');
const newCookie = await rotateSession(mockRequest);
if (newCookie) {
  console.log('✅ Session rotated successfully');
  console.log(`New cookie: ${newCookie.substring(0, 50)}...\n`);
} else {
  console.log('⚠️  Session rotation skipped (no session)\n');
}

// ============================================================================
// 3. MULTI-DOMAIN COOKIE ISOLATION
// ============================================================================
console.log('3️⃣  Multi-Domain Cookie Isolation');
console.log('─'.repeat(50));

// Save to main vault
await saveState(mockRequest, 'session', {
  userId: '12345',
  email: 'user@example.com',
  loginTime: new Date().toISOString(),
});
console.log('✅ Saved session to main vault');

// Save to CDN vault
await saveCdnToken(mockRequest, crypto.randomUUID());
console.log('✅ Saved edge token to CDN vault');

// Load from both
const session = await loadState(mockRequest, 'session');
const cdnToken = await loadCdnToken(mockRequest);
console.log(`Session: ${JSON.stringify(session)}`);
console.log(`CDN Token: ${cdnToken?.substring(0, 20)}...\n`);

// ============================================================================
// 4. TRACE ID PROPAGATION
// ============================================================================
console.log('4️⃣  Trace ID Propagation');
console.log('─'.repeat(50));

console.log('Making request with trace ID...');
try {
  const res = await api.fetch('/health', { method: 'GET' });
  const traceId = res.headers.get('x-quantum-id');
  console.log(`✅ Request completed`);
  console.log(`Trace ID: ${traceId || 'Not returned by API'}\n`);
} catch (err) {
  console.log(`⚠️  Request failed: ${err.message}\n`);
}

// ============================================================================
// 5. RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================
console.log('5️⃣  Retry with Exponential Backoff');
console.log('─'.repeat(50));

console.log('Testing retry logic (will fail gracefully)...');
try {
  const res = await api.fetch('/nonexistent', {
    method: 'GET',
    retries: 2,
  });
  console.log(`Response: ${res.status}\n`);
} catch (err) {
  console.log(`⚠️  Request failed after retries: ${err.message}\n`);
}

// ============================================================================
// 6. MIGRATION VERIFICATION
// ============================================================================
console.log('6️⃣  Migration Verification');
console.log('─'.repeat(50));

const migration = await verifyMigration();
console.log(`${migration.success ? '✅' : '❌'} ${migration.message}`);
if (migration.filesChecked) {
  console.log(`Files checked: ${migration.filesChecked}`);
}
if (migration.files) {
  console.log('Files with localhost:');
  migration.files.forEach(f => console.log(`  - ${f}`));
}
console.log();

// ============================================================================
// 7. DEPLOYMENT UPLOAD FLOW
// ============================================================================
console.log('7️⃣  Deployment Upload Flow');
console.log('─'.repeat(50));

// Create a mock tarball
const mockTarball = new Blob(['mock deployment data'], {
  type: 'application/gzip',
});

console.log('Starting deployment upload...');
const deployResult = await deploymentUpload(
  'quantum-v2.0.0.tar.gz',
  mockTarball,
  null
);

if (deployResult.success) {
  console.log(`✅ ${deployResult.message}`);
} else {
  console.log(`⚠️  ${deployResult.message}`);
}
console.log();

// ============================================================================
// 8. DEPLOYMENT STATUS
// ============================================================================
console.log('8️⃣  Deployment Status');
console.log('─'.repeat(50));

const status = await getDeploymentStatus('deploy-123');
if (status.success) {
  console.log(`Status: ${status.status}`);
  console.log(`Progress: ${status.progress}%`);
  console.log(`Message: ${status.message}`);
} else {
  console.log(`⚠️  ${status.message}`);
}
console.log();

// ============================================================================
// SUMMARY
// ============================================================================
console.log('═'.repeat(50));
console.log('✅ Advanced Patterns Example Complete');
console.log('═'.repeat(50));
console.log(`
Key Features Demonstrated:
  ✓ Health checks with cookie state
  ✓ Session rotation for OWASP compliance
  ✓ Multi-domain cookie isolation
  ✓ Trace ID propagation for observability
  ✓ Retry logic with exponential backoff
  ✓ Migration verification
  ✓ Deployment upload flow
  ✓ Deployment status tracking

Next Steps:
  1. Review docs/guides/STATE-VAULT-ADVANCED-PATTERNS.md
  2. Integrate into your application
  3. Configure CORS and CSP headers
  4. Enable HTTP/2 in bun.yaml
  5. Deploy to production
`);

