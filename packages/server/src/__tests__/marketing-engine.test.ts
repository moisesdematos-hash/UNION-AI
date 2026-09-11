import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { AuthService } from '../services/auth.js';
import { MarketingEngine } from '../services/marketing/marketing-engine.js';

describe('Gate 14: Marketing Intelligence Engine API & Services', () => {
  const app = createApp();
  const authService = new AuthService();
  let userToken: string;

  beforeEach(async () => {
    resetTestDatabase();
    const session = await authService.register('marketer@union.ai', 'Secret123!', 'Marketing Pro');
    userToken = session.token;
  });

  describe('Direct Service Method Execution', () => {
    it('should generate structured Avatar Profile with typed DataPacket', async () => {
      const exec = await MarketingEngine.generateAvatar('Canal de marketing digital sobre automação e escala com IA');
      expect(exec.result.name).toBeDefined();
      expect(exec.result.corePains.length).toBeGreaterThan(0);
      expect(exec.result.desires.length).toBeGreaterThan(0);
      expect(exec.packet.type).toBe('JSON');
      expect(exec.tokens.totalTokens).toBeGreaterThan(0);
      expect(exec.creditsCost).toBeGreaterThan(0);
    });

    it('should generate Competitor Analysis with strengths and gaps', async () => {
      const exec = await MarketingEngine.generateCompetitorAnalysis('Ferramenta concorrente com chat linear');
      expect(exec.result.competitorName).toBeDefined();
      expect(exec.result.vulnerabilities.length).toBeGreaterThan(0);
      expect(exec.result.marketGaps.length).toBeGreaterThan(0);
      expect(exec.packet.type).toBe('JSON');
    });

    it('should generate complete 12-Step VSL Script', async () => {
      const exec = await MarketingEngine.generateVslScript({
        context: 'Lançamento de mentoria high-ticket para infoprodutores'
      });
      expect(exec.result.steps.length).toBe(12);
      expect(exec.result.fullScript).toContain('## 1.');
      expect(exec.result.fullScript).toContain('## 12.');
      expect(exec.packet.type).toBe('DOCUMENT');
    });

    it('should generate Multi-Platform Ads Matrix with Meta, Google and TikTok', async () => {
      const exec = await MarketingEngine.generateAdsMatrix({
        sourceText: 'UNION.AI automação de marketing em canvas visual'
      });
      expect(exec.result.creatives.length).toBeGreaterThanOrEqual(3);
      const platforms = exec.result.creatives.map(c => c.platform);
      expect(platforms).toContain('meta');
      expect(platforms).toContain('google');
      expect(platforms).toContain('tiktok');
    });
  });

  describe('HTTP REST Endpoints (/api/marketing/*)', () => {
    it('should call POST /api/marketing/avatar and deduct user credits', async () => {
      const res = await request(app)
        .post('/api/marketing/avatar')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          context: 'Especialista em tráfego pago ensinando escalar campanhas'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.name).toBeDefined();
      expect(res.body.data.creditsRemaining).toBeLessThan(100.0);
    });

    it('should call POST /api/marketing/competitor', async () => {
      const res = await request(app)
        .post('/api/marketing/competitor')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          competitorData: 'Concorrente direto com curso de marketing digital'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.marketGaps.length).toBeGreaterThan(0);
    });

    it('should call POST /api/marketing/vsl and return 12 steps', async () => {
      const res = await request(app)
        .post('/api/marketing/vsl')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          context: 'Oferta irresistível de consultoria de vendas B2B'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.steps.length).toBe(12);
    });

    it('should call POST /api/marketing/ads and return ad variations', async () => {
      const res = await request(app)
        .post('/api/marketing/ads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sourceText: 'Workshop online de automação com inteligência artificial',
          campaignName: 'Workshop IA 2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.result.creatives.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/marketing/avatar')
        .send({ context: 'Teste sem token' });

      expect(res.status).toBe(401);
    });
  });
});
