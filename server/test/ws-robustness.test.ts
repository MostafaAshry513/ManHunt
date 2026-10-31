import assert from 'node:assert/strict';
import test from 'node:test';
import { makeApp, register } from './helpers.ts';

/**
 * A valid-JSON-but-not-a-message frame ("null", "42", "[]") must never throw inside the
 * websocket handler. The old code dereferenced the parsed value directly, which crashed
 * the process; this test proves the socket and server survive and stay usable.
 */
test('malformed websocket frames do not crash the socket or the server', async () => {
  const ctx = await makeApp();
  const user = await register(ctx.app, 'wssurvivor');

  await ctx.app.listen({ port: 0, host: '127.0.0.1' });
  const address = ctx.app.server.address() as { port: number };
  const ws = new WebSocket(`ws://127.0.0.1:${address.port}/ws?token=${encodeURIComponent(user.token)}`);

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('websocket did not open')), 5_000);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('websocket failed to open')); });
    });

    const pong = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server stopped answering after bad frames')), 5_000);
      ws.addEventListener('message', (event: any) => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg.type === 'pong') { clearTimeout(timer); resolve(); }
        } catch {
          // ignore unrelated frames
        }
      });
    });

    for (const frame of ['null', '42', '"hello"', '[]', '{}', '{"type":null}', '{"type":"subscribe"}']) {
      ws.send(frame);
    }
    ws.send(JSON.stringify({ type: 'ping' }));

    await pong;
    const health = await ctx.app.inject({ method: 'GET', url: '/health' });
    assert.equal(health.statusCode, 200, 'server still serves HTTP after bad frames');
  } finally {
    ws.close();
    await ctx.app.close();
  }
});
