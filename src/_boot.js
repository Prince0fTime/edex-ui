// main -> add code-server IPC handlers
const codeServerService = require('./services/code-server.service.js');

ipc.handle('start-code-server', async (evt, { cwd, preferredPort, binaryPath } = {}) => {
  try {
    const res = await codeServerService.start({ cwd, preferredPort, binaryPath });
    return { success: true, ...res };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipc.handle('stop-code-server', async () => {
  try {
    await codeServerService.stop();
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipc.handle('code-server-status', () => {
  try {
    return { success: true, ...codeServerService.status() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});
