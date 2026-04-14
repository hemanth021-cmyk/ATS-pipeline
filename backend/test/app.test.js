/**
 * Smoke tests — run with: npm test
 * Integration test for /health requires DATABASE_URL (e.g. CI Postgres service).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { createApp } = require('../src/app');

describe('createApp', () => {
  test('returns an Express application', () => {
    const app = createApp();
    assert.ok(app);
    assert.strictEqual(typeof app.handle, 'function');
  });
});

describe('GET /health', () => {
  test(
    'returns 200 when the database is reachable',
    { skip: !process.env.DATABASE_URL },
    async () => {
      const app = createApp();
      const res = await request(app).get('/health').expect(200);
      assert.strictEqual(res.body.ok, true);
      assert.strictEqual(res.body.db, 'up');
    }
  );
});
