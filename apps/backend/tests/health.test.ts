import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health & System API', () => {
  const app = createApp();

  it('GET / should return online status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'online');
    expect(res.body).toHaveProperty('version', '1.0.0');
  });

  it('GET /api/v1/health should return health information structure', async () => {
    const res = await request(app).get('/api/v1/health');
    // Depending on DB/Redis connectivity, status can be healthy, degraded, or unhealthy
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('database');
    expect(res.body.services).toHaveProperty('redis');
    expect(res.body).toHaveProperty('uptimeSeconds');
  });

  it('GET /unknown-route should return 404 with structured error', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
