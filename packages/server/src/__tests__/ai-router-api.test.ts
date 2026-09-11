import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { DataPacketSchema } from '@union/shared';

describe('AI Router Server API (/api/ai/router)', () => {
  const app = createApp();

  describe('POST /api/ai/router/recommend', () => {
    it('should calculate optimal model recommendation with savings comparison', async () => {
      const res = await request(app)
        .post('/api/ai/router/recommend')
        .send({
          role: 'ai-writer',
          optimizeFor: 'cost',
          promptLength: 800,
          expectedOutputLength: 1200
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const data = res.body.data;
      expect(data.recommendedModel).toBe('gpt-4o-mini');
      expect(data.priority).toBe('cost');
      expect(data.estimatedCost).toBeGreaterThan(0);
      expect(data.benchmarkComparison.savingsPercent).toBeGreaterThanOrEqual(90);
      expect(data.reasoning).toBeDefined();
    });

    it('should recommend groq-llama-3 when speed is prioritized', async () => {
      const res = await request(app)
        .post('/api/ai/router/recommend')
        .send({
          role: 'ai-router',
          optimizeFor: 'speed'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.recommendedModel).toBe('groq-llama-3');
      expect(res.body.data.provider).toBe('groq');
    });
  });

  describe('POST /api/ai/router/classify', () => {
    it('should classify copywriting prompt and recommend claude-3-7-sonnet', async () => {
      const res = await request(app)
        .post('/api/ai/router/classify')
        .send({
          text: 'Crie uma copy persuasiva para VSL e um roteiro dinâmico de alta retenção',
          optimizeFor: 'balanced'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const data = res.body.data;
      expect(data.category).toBe('copywriting');
      expect(data.branch).toBe('balanced');
      expect(data.detectedKeywords).toContain('vsl');
      expect(data.detectedKeywords).toContain('roteiro');
      expect(data.recommendedModel).toBe('claude-3-7-sonnet');
    });

    it('should reject request when text is empty', async () => {
      const res = await request(app)
        .post('/api/ai/router/classify')
        .send({
          text: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /api/ai/router/execute', () => {
    it('should execute end-to-end task with dynamic routing and return valid AI_RESPONSE DataPacket', async () => {
      const res = await request(app)
        .post('/api/ai/router/execute')
        .send({
          nodeId: 'node-router-test-1',
          text: 'Faça uma análise de avatar e monte a matriz SWOT dos concorrentes',
          optimizeFor: 'balanced'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const { raw, routing, packet } = res.body.data;
      expect(raw.content).toBeDefined();
      expect(raw.tokens.totalTokens).toBeGreaterThan(0);
      expect(raw.creditsCost).toBeGreaterThan(0);

      // Routing information
      expect(routing.classification.category).toBe('analytics');
      expect(routing.classification.branch).toBe('deep');
      expect(routing.recommendation.recommendedModel).toBe('deepseek-r1');

      // DataPacket validation
      expect(packet).toBeDefined();
      expect(() => DataPacketSchema.parse(packet)).not.toThrow();
      expect(packet.type).toBe('AI_RESPONSE');
      expect(packet.metadata.originNodeId).toBe('node-router-test-1');
      expect(packet.metadata.model).toBe('deepseek-r1');
    });

    it('should return 400 if text is missing', async () => {
      const res = await request(app)
        .post('/api/ai/router/execute')
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
