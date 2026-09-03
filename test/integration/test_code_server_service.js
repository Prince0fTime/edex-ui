#!/usr/bin/env node
// test/integration/test_code_server_service.js
// Simple integration test for src/services/code-server.service.js
// Usage: from repository root run: node test/integration/test_code_server_service.js

const path = require('path');
const servicePath = path.join(__dirname, '..', '..', 'src', 'services', 'code-server.service.js');
const service = require(servicePath);

(async () => {
  console.log('=== code-server.service integration test ===');

  try {
    const cwd = process.cwd();
    const preferredPort = process.env.TEST_CODE_SERVER_PORT ? Number(process.env.TEST_CODE_SERVER_PORT) : 8086;
    const binaryPath = process.env.CODE_SERVER_BIN || null;

    console.log('Starting code-server with:', { cwd, preferredPort, binaryPath });
    const res = await service.start({ cwd, preferredPort, binaryPath });
    console.log('start() returned:', res);

    if (!res || !res.url) {
      throw new Error('start() did not return a valid url');
    }

    // Check that PID looks valid
    if (!res.pid || typeof res.pid !== 'number') {
      throw new Error('start() did not return a valid pid');
    }

    // Verify the process exists (best-effort). On some platforms this may throw if permission denied.
    try {
      process.kill(res.pid, 0);
      console.log(`Process ${res.pid} is alive (pid check passed)`);
    } catch (e) {
      console.warn(`PID check failed: ${e.message}`);
    }

    // Query status
    const status = service.status();
    console.log('status() returned:', status);

    // Stop the service
    console.log('Stopping code-server...');
    const stopRes = await service.stop();
    console.log('stop() returned:', stopRes);

    // Final status
    const finalStatus = service.status();
    console.log('Final status:', finalStatus);

    console.log('=== SUCCESS: code-server.service integration test completed ===');
    process.exit(0);
  } catch (err) {
    console.error('=== FAILURE: code-server.service integration test failed ===');
    console.error(err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
