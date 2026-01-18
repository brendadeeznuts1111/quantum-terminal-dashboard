/**
 * State Vault Example - Secure encrypted state management
 * 
 * This example demonstrates how to use the State Vault for secure
 * session and state management with Bun's native Cookie API.
 * 
 * SETUP:
 * 1. Set QUANTUM_SECRET environment variable:
 *    export QUANTUM_SECRET=$(openssl rand -hex 32)
 * 
 * 2. Run this example:
 *    QUANTUM_SECRET=$(openssl rand -hex 32) bun examples/state-vault-example.js
 */

import { saveState, loadState, deleteState, getAllState } from '../src/state-vault.js';
import { API, COOKIE_OPTS, SERVER_CONFIG } from '../src/config.js';

console.log('🔐 State Vault Example\n');
console.log('Configuration:');
console.log(`  API Base: ${API}`);
console.log(`  Cookie Name: ${COOKIE_OPTS.name}`);
console.log(`  Cookie MaxAge: ${COOKIE_OPTS.maxAge}s (${COOKIE_OPTS.maxAge / 3600}h)`);
console.log(`  HttpOnly: ${COOKIE_OPTS.httpOnly}`);
console.log(`  Secure: ${COOKIE_OPTS.secure}`);
console.log(`  SameSite: ${COOKIE_OPTS.sameSite}\n`);

// Create a mock request object for demonstration
const mockRequest = new Request('http://localhost:3000', {
  headers: {
    'Cookie': ''
  }
});

// Example 1: Save user session state
console.log('📝 Example 1: Save User Session');
const sessionCookie = await saveState(mockRequest, 'session', {
  userId: '12345',
  username: 'quantum_user',
  role: 'admin',
  loginTime: new Date().toISOString(),
});
console.log('  ✓ Session saved to encrypted cookie');
console.log(`  Cookie header: ${sessionCookie.substring(0, 50)}...\n`);

// Example 2: Save user preferences
console.log('📝 Example 2: Save User Preferences');
const prefsCookie = await saveState(mockRequest, 'preferences', {
  theme: 'dark',
  language: 'en',
  notifications: true,
  timezone: 'UTC',
});
console.log('  ✓ Preferences saved to encrypted cookie\n');

// Example 3: Load state from cookie
console.log('📖 Example 3: Load State from Cookie');
const loadedSession = await loadState(mockRequest, 'session');
console.log('  Loaded session:', loadedSession);
console.log('  ✓ State decrypted and parsed\n');

// Example 4: Get all state
console.log('📖 Example 4: Get All State');
const allState = await getAllState(mockRequest);
console.log('  All state:', allState);
console.log('  ✓ Retrieved all encrypted state\n');

// Example 5: Delete specific state
console.log('🗑️  Example 5: Delete State');
const deleteCookie = await deleteState(mockRequest, 'preferences');
console.log('  ✓ Preferences deleted from cookie\n');

// Example 6: Real server usage
console.log('🚀 Example 6: Real Server Usage\n');
console.log('```javascript');
console.log('import { Bun } from "bun";');
console.log('import { saveState, loadState } from "./src/state-vault.js";');
console.log('');
console.log('const server = Bun.serve({');
console.log('  async fetch(request) {');
console.log('    const url = new URL(request.url);');
console.log('');
console.log('    // Login endpoint');
console.log('    if (url.pathname === "/login") {');
console.log('      const cookieHeader = await saveState(request, "user", {');
console.log('        id: "12345",');
console.log('        email: "user@example.com"');
console.log('      });');
console.log('      return new Response("Logged in", {');
console.log('        headers: { "Set-Cookie": cookieHeader }');
console.log('      });');
console.log('    }');
console.log('');
console.log('    // Protected endpoint');
console.log('    if (url.pathname === "/profile") {');
console.log('      const user = await loadState(request, "user");');
console.log('      if (!user) {');
console.log('        return new Response("Unauthorized", { status: 401 });');
console.log('      }');
console.log('      return new Response(`Hello ${user.email}`);');
console.log('    }');
console.log('');
console.log('    return new Response("Not found", { status: 404 });');
console.log('  }');
console.log('});');
console.log('```\n');

console.log('✅ State Vault example completed successfully!');
console.log('\n🔒 Security Notes:');
console.log('  • All state is encrypted with AES-256-GCM');
console.log('  • Cookies are HttpOnly (JavaScript cannot access)');
console.log('  • Secure flag ensures HTTPS-only transmission');
console.log('  • SameSite=strict prevents CSRF attacks');
console.log('  • Session timeout: ' + COOKIE_OPTS.maxAge + ' seconds');

