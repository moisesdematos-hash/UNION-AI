import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { AuthService } from '../services/auth.js';
import { SalesPageCopySchema } from '@union/shared';

describe('Sales Page Copy API (14 Blocks Engine)', () => {
  const app = createApp();
  const authService = new AuthService();
  let authToken: string;

  beforeEach(async () => {
    resetTestDatabase();
    const session = await authService.register('copywriter@union.ai', 'Password123!', 'Copy Master');
    authToken = session.token;
  });

  it('should generate a validated 14-block Sales Page copy with all required sections', async () => {
    const res = await request(app)
      .post('/api/marketing/sales-page')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        context: 'Lançamento de mentoria exclusiva de High-Ticket e Automação com Inteligência Artificial para infoprodutores que faturam acima de 50k por mês.',
        productName: 'Mentoria Scale AI 10X',
        targetAudience: 'Produtores Digitais e Donos de Agência',
        offerPrice: '12x de R$ 497,00'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const copy = res.body.data.result;
    // Strict schema check
    const validated = SalesPageCopySchema.safeParse(copy);
    expect(validated.success).toBe(true);

    // Verify presence of all 14 mandatory blocks
    expect(copy.title).toBeDefined();
    expect(copy.headline).toBeDefined();
    expect(copy.subheadline).toBeDefined();
    expect(copy.problem).toBeDefined();
    expect(copy.consequences).toBeDefined();
    expect(copy.opportunity).toBeDefined();
    expect(copy.mechanism).toBeDefined();
    expect(copy.benefits.length).toBeGreaterThanOrEqual(1);
    expect(copy.proof.length).toBeGreaterThanOrEqual(1);
    expect(copy.offer).toBeDefined();
    expect(copy.bonuses.length).toBeGreaterThanOrEqual(1);
    expect(copy.guarantee).toBeDefined();
    expect(copy.objections.length).toBeGreaterThanOrEqual(1);
    expect(copy.faq.length).toBeGreaterThanOrEqual(1);
    expect(copy.cta).toBeDefined();

    // Verify token tracking and credit deduction
    expect(res.body.data.tokens.totalTokens).toBeGreaterThan(500);
    expect(res.body.data.creditsCost).toBeGreaterThan(0);
    expect(res.body.data.creditsRemaining).toBeDefined();
  });
});
