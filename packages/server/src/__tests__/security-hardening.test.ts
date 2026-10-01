import { EmailService } from '../services/email/email-service.js';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { authService } from '../services/auth.js';
import { resetTestDatabase } from '../db/database.js';
import { env } from '../config/env.js';
import { AiEngine } from '../services/ai/ai-engine.js';
import { executeBilledAi } from '../services/ai/billed-ai.js';
import { creditsService } from '../services/credits-service.js';
import { PaymentService } from '../services/payment/payment-service.js';
import { WebsiteScraper } from '../services/extractors/website-scraper.js';
import { validateSsrfTarget, isPrivateOrReservedIPv6 } from '../utils/ssrf-guard.js';
import { SalesPageRenderer } from '../services/marketing/sales-page-renderer.js';
import { MarketingEngine } from '../services/marketing/marketing-engine.js';
import { injectPostgresForTests } from '../db/operational-database.js';
const app = createApp();
const original = { ...env };
beforeEach(() => resetTestDatabase());
afterEach(() => { Object.assign(env, original); vi.restoreAllMocks(); injectPostgresForTests(undefined); });

describe('Production regression and security', () => {
  it('blocks localhost, metadata, IPv4-mapped IPv6 and non-HTTP targets', async () => {
    for (const url of ['http://127.0.0.1', 'http://169.254.169.254', 'file:///etc/passwd', 'http://[::ffff:7f00:1]']) expect((await validateSsrfTarget(url)).safe).toBe(false);
    expect(isPrivateOrReservedIPv6('::ffff:7f00:1')).toBe(true);
    await expect(WebsiteScraper.scrape('http://127.0.0.1')).rejects.toThrow('SSRF_BLOCKED');
  });
  it('rejects anonymous AI execution and shortcuts before provider use', async () => {
    for (const route of ['/api/ai/execute', '/api/ai/chat', '/api/ai/router/execute']) expect((await request(app).post(route).send({ userPrompt: 'hello', text: 'hello' })).status).toBe(401);
  });
  it('does not grant administrator status to first or named admin accounts', async () => {
    const first = await authService.register('admin@union.ai', 'SecurePass123', 'Admin Name');
    expect(first.user.role).toBe('USER');
    expect((await request(app).get('/api/admin/users').set('Authorization', `Bearer ${first.token}`)).status).toBe(403);
  });
  it('shortcuts call the common handler once and demo outputs have no billable usage', async () => {
    const user = await authService.register('shortcuts@example.com', 'SecurePass123', 'Shortcuts');
    const response = await request(app).post('/api/ai/chat').set('Authorization', `Bearer ${user.token}`).send({ userPrompt: 'hello' });
    expect(response.status).toBe(200);
    expect(response.body.data.raw).toMatchObject({ executionMode: 'FALLBACK_OFFLINE', provider: 'local', modelUsed: 'offline-demo', creditsCost: 0 });
    expect((await creditsService.getUserCredits(user.user.id)).balance).toBe(100);
  });
  it('returns reservations after provider failure without changing balance', async () => {
    const user = await authService.register('billing@example.com', 'SecurePass123', 'Billing');
    vi.spyOn(AiEngine, 'execute').mockRejectedValue(new Error('PROVIDER_DOWN'));
    await expect(executeBilledAi(user.user.id, { role: 'ai-chat', userPrompt: 'test' })).rejects.toThrow('PROVIDER_DOWN');
    expect((await creditsService.getUserCredits(user.user.id)).balance).toBe(100);
  });
  it('prevents provider calls when credits cannot be reserved', async () => {
    const user = await authService.register('quota@example.com', 'SecurePass123', 'Quota');
    await creditsService.deductCredits(user.user.id, 100, { description: 'fixture' });
    const spy = vi.spyOn(AiEngine, 'execute');
    await expect(executeBilledAi(user.user.id, { role: 'ai-chat', userPrompt: 'test' })).rejects.toThrow('INSUFFICIENT_CREDITS');
    expect(spy).not.toHaveBeenCalled();
  });
  it('uses actual Groq transport/model/usage and rejects missing production credentials', async () => {
    env.NODE_ENV = 'production'; env.GROQ_API_KEY = 'fixture';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ model: 'provider-model', choices: [{ message: { content: 'result' } }], usage: { prompt_tokens: 12, completion_tokens: 5 } }), { status: 200 }));
    const result = await AiEngine.execute({ role: 'ai-chat', model: 'groq-llama-3', userPrompt: 'test' });
    expect(result).toMatchObject({ provider: 'groq', modelUsed: 'provider-model', executionMode: 'REAL_AI', tokens: { promptTokens: 12, completionTokens: 5, totalTokens: 17 } });
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).model).toBe(env.GROQ_MODEL);
    await expect(AiEngine.execute({ role: 'ai-chat', model: 'claude-3-7-sonnet', userPrompt: 'test' })).rejects.toThrow('AI_MODEL_NOT_SUPPORTED');
    env.GROQ_API_KEY = undefined;
    await expect(AiEngine.execute({ role: 'ai-chat', userPrompt: 'test' })).rejects.toThrow('AI_PROVIDER_UNAVAILABLE');
  });
  it('rejects unsigned payment webhooks and posted workflow billing/history', async () => {
    await expect(PaymentService.processWebhook('stripe', { type: 'checkout.session.completed' })).rejects.toThrow('WEBHOOK_SIGNATURE_REQUIRED');
    const user = await authService.register('runs@example.com', 'SecurePass123', 'Runs');
    expect((await request(app).post('/api/workflows/arbitrary/runs').set('Authorization', `Bearer ${user.token}`).send({ status: 'COMPLETED', totalCostCredits: 0 })).status).toBe(403);
  });
  it('escapes malicious checkout attributes and rejects javascript URLs', async () => {
    const demo = await MarketingEngine.generateSalesPageCopy({ context: 'safe fixture' });
    expect(() => SalesPageRenderer.renderToHtml(demo.result, { checkoutUrl: 'javascript:alert(1)' })).toThrow();
    const html = SalesPageRenderer.renderToHtml(demo.result, { checkoutUrl: 'https://example.com/?x=" onclick="alert(1)' });
    expect(html).not.toContain('href="https://example.com/?x=" onclick=');
  });
  it('keeps a production process alive but marks missing operational database unready', async () => {
    env.NODE_ENV = 'production'; env.DATABASE_URL = undefined;
    expect((await request(app).get('/api/health/live')).status).toBe(200);
    expect((await request(app).get('/api/health/ready')).status).toBe(503);
  });
  it('denies arbitrary CORS origins and sets security headers', async () => {
    const denied = await request(app).get('/api/health').set('Origin', 'https://evil-attacker.vercel.app');
    expect(denied.status).toBe(500);
    const response = await request(app).get('/api/health/live');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).not.toContain("'unsafe-eval'");
  });
  it('rejects wrong Google audience, false verification and invalid expiration before creating a user', async () => {
    env.NODE_ENV = 'development'; env.GOOGLE_CLIENT_ID = 'expected-client';
    const payload = { email: 'google-safe@example.com', email_verified: 'true', aud: 'expected-client', iss: 'https://accounts.google.com', sub: 'google-user', exp: Math.floor(Date.now() / 1000) + 600 };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    for (const invalid of [{ aud: 'wrong-client' }, { email_verified: 'false' }, { exp: undefined }, { exp: 1 }]) {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ ...payload, ...invalid }), { status: 200 }));
      expect((await request(app).post('/api/auth/google').send({ credential: 'fixture' })).status).toBe(401);
    }
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(payload), { status: 200 }));
    const accepted = await request(app).post('/api/auth/google').send({ credential: 'fixture' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.data.user.role).toBe('USER');
  });
  it('does not report password email delivered when the production provider fails', async () => {
    env.NODE_ENV = 'production'; env.RESEND_API_KEY = 'fixture-resend';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(EmailService.sendPasswordResetEmail('fixture@example.com', 'Fixture', 'never-log-this-token')).rejects.toThrow('EMAIL_PROVIDER_UNAVAILABLE');
    env.RESEND_API_KEY = undefined;
    await expect(EmailService.sendPasswordResetEmail('fixture@example.com', 'Fixture', 'never-log-this-token')).rejects.toThrow('EMAIL_PROVIDER_UNAVAILABLE');
  });
  it('does not exhaust the general API rate limit while polling a long-running job', async () => {
    env.NODE_ENV = 'development';
    const productionLimitsApp = createApp();
    const user = await authService.register('polling@example.com', 'SecurePass123', 'Polling');
    const statuses = await Promise.all(Array.from({ length: 305 }, () => request(productionLimitsApp).get('/api/workflows/jobs/nonexistent').set('Authorization', `Bearer ${user.token}`).then(response => response.status)));
    expect(new Set(statuses)).toEqual(new Set([404]));
  });
});
