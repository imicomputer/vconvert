import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import test, { after, before } from 'node:test';

process.env.NODE_ENV = 'production';

const [{ default: app }] = await Promise.all([
  import('../../src/app.js')
]);

let server: Server;
let baseUrl: string;

before(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('Swagger routes are not mounted in production', async () => {
  const ui = await fetch(`${baseUrl}/api-docs/`);
  assert.equal(ui.status, 404);

  const document = await fetch(`${baseUrl}/api-docs/openapi.json`);
  assert.equal(document.status, 404);
});

test('application routes remain available in production', async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
});
