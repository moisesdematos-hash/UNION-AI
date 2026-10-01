import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { authService } from '../services/auth.js';
import { resetTestDatabase } from '../db/database.js';
import { creditsService } from '../services/credits-service.js';
const app = createApp();
beforeEach(() => resetTestDatabase());
afterEach(() => { delete process.env.MULTICAIXA_EXPRESS_API_KEY; delete process.env.MULTICAIXA_REF_API_KEY; delete process.env.PAYPAY_AO_API_KEY; });
describe('Unimplemented Angola gateways fail honestly', () => {
  it.each(['multicaixa_express', 'multicaixa_ref', 'paypay'])('never emits fictitious checkout for %s, even with an API key', async provider => {
    process.env.MULTICAIXA_EXPRESS_API_KEY = 'fixture'; process.env.MULTICAIXA_REF_API_KEY = 'fixture'; process.env.PAYPAY_AO_API_KEY = 'fixture';
    const user = await authService.register('angola@example.com', 'SecurePass123', 'Angola');
    const response = await request(app).post('/api/payments/checkout').set('Authorization', `Bearer ${user.token}`).send({ provider, packageId: 'pack-100', phone: '923112233' });
    expect(response.status).toBe(503);
    expect(response.body.data).toBeUndefined();
    expect((await creditsService.getUserCredits(user.user.id)).balance).toBe(100);
  });
  it('rejects forged unsupported-gateway payment confirmations', async () => {
    const response = await request(app).post('/api/payments/webhook/paypay').send({ status: 'PAID', amount: 9500, userId: 'someone' });
    expect(response.status).toBe(400);
  });
});
