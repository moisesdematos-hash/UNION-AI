import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { DataPacketSchema } from '@union/shared';

describe('AI Engine Server API (/api/ai)', () => {
  const app = createApp();

  describe('POST /api/ai/execute — ai-writer', () => {
    it('should generate high-retention YouTube Script with tokens and credit costs', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          nodeId: 'node-writer-yt',
          role: 'ai-writer',
          model: 'claude-3-7-sonnet',
          userPrompt: 'Transform this transcript into a retention-focused YouTube script',
          options: {
            format: 'youtube-script'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();

      const { raw, packets } = res.body.data;
      expect(raw.role).toBe('ai-writer');
      expect(raw.modelUsed).toBe('claude-3-7-sonnet');
      expect(raw.provider).toBe('anthropic');
      expect(raw.content).toContain('GANCHO DE ALTA RETENÇÃO');
      expect(raw.tokens.totalTokens).toBeGreaterThan(0);
      expect(raw.creditsCost).toBeGreaterThan(0);

      // Verify DataPackets
      expect(packets.text).toBeDefined();
      expect(() => DataPacketSchema.parse(packets.text)).not.toThrow();
      expect(packets.text.type).toBe('TEXT');
      expect(packets.text.metadata.originNodeId).toBe('node-writer-yt');
      expect(packets.text.metadata.provider).toBe('anthropic');
      expect(packets.text.metadata.model).toBe('claude-3-7-sonnet');
    });

    it('should generate a 10-slide Instagram carousel with structured slides packet', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          nodeId: 'node-carousel-1',
          role: 'ai-writer',
          model: 'gpt-4o',
          userPrompt: 'Create an educational 10-slide carousel about workflow automation',
          options: {
            format: 'instagram-carousel'
          }
        });

      expect(res.status).toBe(200);
      const { raw, packets } = res.body.data;
      expect(raw.modelUsed).toBe('gpt-4o');
      expect(raw.structured).toBeDefined();
      expect(raw.structured.totalSlides).toBe(10);
      expect(raw.structured.slides.length).toBe(10);
      expect(raw.content).toContain('[SLIDE 1 - COVER]');
      expect(raw.content).toContain('[SLIDE 10 - CTA]');

      expect(packets.structured).toBeDefined();
      expect(() => DataPacketSchema.parse(packets.structured)).not.toThrow();
      expect(packets.structured.type).toBe('JSON');
    });

    it('should generate a 12-step VSL script', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          role: 'ai-writer',
          model: 'auto',
          userPrompt: 'Generate a direct response VSL',
          options: {
            format: 'vsl-12-step'
          }
        });

      expect(res.status).toBe(200);
      const { raw } = res.body.data;
      // Auto routing for ai-writer should choose claude-3-7-sonnet
      expect(raw.modelUsed).toBe('claude-3-7-sonnet');
      expect(raw.structured.totalSteps).toBe(12);
      expect(raw.content).toContain('Passo 1: Pattern Interrupt');
      expect(raw.content).toContain('Passo 12: Urgent Call to Action');
    });
  });

  describe('POST /api/ai/execute — ai-analyst', () => {
    it('should extract avatar persona, SWOT matrix, and KPIs with auto routing to deepseek-r1', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          nodeId: 'node-analyst-1',
          role: 'ai-analyst',
          model: 'auto',
          userPrompt: 'Analyze market audience and competitive advantages'
        });

      expect(res.status).toBe(200);
      const { raw, packets } = res.body.data;
      expect(raw.modelUsed).toBe('deepseek-r1');
      expect(raw.provider).toBe('deepseek');
      expect(raw.structured.targetAudience).toBeDefined();
      expect(raw.structured.swot).toBeDefined();
      expect(raw.structured.swot.strengths.length).toBeGreaterThan(0);
      expect(raw.content).toContain('Matriz SWOT Aplicada');

      expect(packets.text).toBeDefined();
      expect(packets.structured).toBeDefined();
      expect(() => DataPacketSchema.parse(packets.text)).not.toThrow();
      expect(() => DataPacketSchema.parse(packets.structured)).not.toThrow();
    });
  });

  describe('POST /api/ai/execute — ai-summarizer', () => {
    it('should generate TL;DR and key takeaways with auto routing to gemini-1-5-flash', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          nodeId: 'node-summarizer-1',
          role: 'ai-summarizer',
          model: 'auto',
          userPrompt: 'Summarize the core takeaways from this market briefing'
        });

      expect(res.status).toBe(200);
      const { raw } = res.body.data;
      expect(raw.modelUsed).toBe('gemini-1-5-flash');
      expect(raw.provider).toBe('google');
      expect(raw.content).toContain('TL;DR');
      expect(raw.structured.keyTakeaways.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/ai/execute — ai-chat', () => {
    it('should answer conversational query with auto routing to gpt-4o', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          role: 'ai-chat',
          model: 'auto',
          userPrompt: 'Como configuro o fluxo para gerar um carrossel a partir de um vídeo?'
        });

      expect(res.status).toBe(200);
      const { raw } = res.body.data;
      expect(raw.modelUsed).toBe('gpt-4o');
      expect(raw.content).toBeDefined();
      expect(raw.tokens.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('Error Handling & Validation', () => {
    it('should reject request when userPrompt is empty', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          role: 'ai-chat',
          userPrompt: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject request when role is invalid', async () => {
      const res = await request(app)
        .post('/api/ai/execute')
        .send({
          role: 'invalid-role',
          userPrompt: 'Hello'
        });

      expect(res.status).toBe(400);
    });
  });
});
