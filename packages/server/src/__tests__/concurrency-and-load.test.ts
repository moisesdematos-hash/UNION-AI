import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase, closeDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { creditsService } from '../services/credits-service.js';
describe('Performance, Concurrency & Request Correlation Tests', () => {
    const app = createApp();
    beforeEach(() => {
        resetTestDatabase();
    });
    afterAll(() => {
        closeDatabase();
    });
    it('should inject X-Request-Id and X-Trace-Id correlation headers on all responses', async () => {
        const res = await request(app).get('/api/health/live');
        expect(res.status).toBe(200);
        expect(res.headers['x-request-id']).toBeDefined();
        expect(res.headers['x-trace-id']).toBeDefined();
        expect(res.headers['x-request-id']).toMatch(/^req_/);
        expect(res.headers['x-trace-id']).toMatch(/^trace_/);
    });
    it('should preserve incoming X-Request-Id when provided by client / API gateway', async () => {
        const customReqId = 'req_custom_upstream_gateway_12345';
        const res = await request(app)
            .get('/api/health/live')
            .set('X-Request-Id', customReqId);
        expect(res.status).toBe(200);
        expect(res.headers['x-request-id']).toBe(customReqId);
    });
    it('should handle 50 concurrent requests to /api/health/live and calculate actual per-request p95 latency', async () => {
        const concurrency = 50;
        const start = Date.now();
        const latencies: number[] = [];
        const promises = Array.from({ length: concurrency }).map(async () => { const requestStart = Date.now(); const response = await request(app).get('/api/health/live'); latencies.push(Date.now() - requestStart); return response; });
        const responses = await Promise.all(promises);
        const duration = Date.now() - start;
        expect(responses.length).toBe(concurrency);
        responses.forEach((res) => {
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('alive');
            expect(res.headers['x-request-id']).toBeDefined();
        });
        const p95 = latencies.sort((a, b) => a - b)[Math.ceil(latencies.length * 0.95) - 1];
        expect(p95).toBeLessThan(1000);
    });
    it('should handle 25 concurrent database readiness checks without connection pool exhaustion', async () => {
        const concurrency = 25;
        const promises = Array.from({ length: concurrency }).map(() => request(app).get('/api/health/ready'));
        const responses = await Promise.all(promises);
        expect(responses.length).toBe(concurrency);
        responses.forEach((res) => {
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ready');
            expect(res.body.database).toBe('connected');
        });
    });
    it('should execute concurrent credit quota checks atomically under load', async () => {
        const userSession = await authService.register('loadtest@example.com', 'LoadPass123', 'Load Tester');
        const token = userSession.token;
        const userId = userSession.user.id;
        // Verify initial credits = 100.0
        const initialWallet = (await creditsService.getUserCredits(userId));
        expect(initialWallet.balance).toBe(100.0);
        const concurrency = 20;
        const promises = Array.from({ length: concurrency }).map(() => request(app)
            .post('/api/credits/check-quota')
            .set('Authorization', `Bearer ${token}`)
            .send({ estimatedCost: 1.5 }));
        const responses = await Promise.all(promises);
        expect(responses.length).toBe(concurrency);
        responses.forEach((res) => {
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.allowed).toBe(true);
            expect(res.body.data.balance).toBe(100.0);
        });
    });
});
