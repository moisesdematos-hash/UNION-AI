import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Server Health API', () => {
  const app = createApp();

  it('GET /api/health should return 200 OK and core status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('UNION.AI Core Server');
    expect(response.body.features.dataBus).toBe('ACTIVE');
    expect(response.body.features.workflowEngine).toBe('READY');
  });
});
