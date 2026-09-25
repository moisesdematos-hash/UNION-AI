import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getActiveDatabaseProvider, isSupabaseConfigured, testSupabaseConnection } from '../db/supabase-client.js';

describe('Supabase Integration & Dual-Mode Health Diagnostic', () => {
  const app = createApp();

  it('should report sqlite as active database provider during test runs', () => {
    // In test environment, it must always remain isolated in SQLite (:memory:)
    const provider = getActiveDatabaseProvider();
    expect(provider).toBe('sqlite');
  });

  it('should detect Supabase configuration state gracefully', () => {
    const configured = isSupabaseConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('should perform health-check without throwing uncaught errors', async () => {
    const result = await testSupabaseConnection();
    expect(result).toBeDefined();
    expect(typeof result.connected).toBe('boolean');
    expect(['supabase', 'sqlite']).toContain(result.provider);
  });

  it('should expose database diagnostics via GET /api/health', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.activeProvider).toBe('sqlite');
    expect(typeof res.body.database.supabaseConfigured).toBe('boolean');
  });

  it('should expose database connectivity check via GET /api/health/db', async () => {
    const res = await request(app).get('/api/health/db');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.connected).toBe('boolean');
  });
});
