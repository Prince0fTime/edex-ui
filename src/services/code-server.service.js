const { spawn } = require('child_process');
const signale = require('signale');

let current = null;

function generatePassword() {
  return Math.random().toString(36).slice(2, 10);
}

module.exports = {
  async start({ cwd = process.cwd(), preferredPort = 8085, binaryPath = null } = {}) {
    if (current) {
      signale.info('code-server already running at', current.url);
      return { running: true, url: current.url, port: current.port, pid: current.pid, password: current.password };
    }

    const port = Number(preferredPort) || 8085;
    const binary = binaryPath || process.env.CODE_SERVER_BIN || 'code-server';
    const password = generatePassword();

    signale.pending(`Starting code-server (${binary}) on port ${port}...`);

    const args = ['--bind-addr', `127.0.0.1:${port}`, '--auth', 'password'];
    const env = Object.assign({}, process.env, { PASSWORD: password });

    try {
      const proc = spawn(binary, args, { env, cwd, stdio: ['ignore', 'pipe', 'pipe'] });

      current = {
        proc,
        port,
        url: `http://127.0.0.1:${port}`,
        password,
        pid: proc.pid
      };

      proc.stdout.on('data', d => signale.debug(`[code-server stdout] ${d.toString()}`));
      proc.stderr.on('data', d => signale.debug(`[code-server stderr] ${d.toString()}`));
      proc.on('exit', (code, sig) => {
        signale.info(`code-server exited with ${code} ${sig}`);
        current = null;
      });

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 400));

      signale.success(`code-server started at ${current.url}`);
      return { running: true, url: current.url, port: current.port, pid: current.pid, password: current.password };
    } catch (e) {
      signale.error('Failed to start code-server', e);
      current = null;
      throw e;
    }
  },

  async stop() {
    if (!current) return { running: false };
    try {
      current.proc.kill();
      current = null;
      signale.success('code-server stopped');
      return { stopped: true };
    } catch (e) {
      signale.error('Failed to stop code-server', e);
      throw e;
    }
  },

  status() {
    if (!current) return { running: false };
    return { running: true, url: current.url, port: current.port, pid: current.pid };
  }
};
