import { describe, it, expect } from 'vitest';
import { AiRouterEngine } from '../router/AiRouterEngine.js';

describe('Shared AI Router Engine', () => {
  describe('recommendModel', () => {
    it('should recommend cheapest model and calculate high savings for cost priority', () => {
      const rec = AiRouterEngine.recommendModel({
        role: 'ai-writer',
        optimizeFor: 'cost',
        promptLength: 1000,
        expectedOutputLength: 2000
      });

      expect(rec.recommendedModel).toBe('gpt-4o-mini');
      expect(rec.priority).toBe('cost');
      expect(rec.estimatedCost).toBeLessThan(rec.benchmarkComparison.premiumCost);
      expect(rec.benchmarkComparison.savingsPercent).toBeGreaterThanOrEqual(90);
      expect(rec.reasoning).toBeDefined();
    });

    it('should recommend gemini-1-5-flash for ai-summarizer under cost priority', () => {
      const rec = AiRouterEngine.recommendModel({
        role: 'ai-summarizer',
        optimizeFor: 'cost'
      });

      expect(rec.recommendedModel).toBe('gemini-1-5-flash');
      expect(rec.provider).toBe('google');
      expect(rec.benchmarkComparison.savingsPercent).toBeGreaterThan(90);
    });

    it('should recommend groq-llama-3 for ai-router under speed priority', () => {
      const rec = AiRouterEngine.recommendModel({
        role: 'ai-router',
        optimizeFor: 'speed'
      });

      expect(rec.recommendedModel).toBe('groq-llama-3');
      expect(rec.provider).toBe('groq');
      expect(rec.reasoning).toContain('menor latência');
    });

    it('should recommend claude-3-7-sonnet for ai-writer under quality priority', () => {
      const rec = AiRouterEngine.recommendModel({
        role: 'ai-writer',
        optimizeFor: 'quality'
      });

      expect(rec.recommendedModel).toBe('claude-3-7-sonnet');
      expect(rec.provider).toBe('anthropic');
    });

    it('should recommend deepseek-r1 for ai-analyst under balanced or quality priority', () => {
      const rec = AiRouterEngine.recommendModel({
        role: 'ai-analyst',
        optimizeFor: 'balanced',
        taskComplexity: 'complex'
      });

      expect(rec.recommendedModel).toBe('deepseek-r1');
      expect(rec.provider).toBe('deepseek');
      expect(rec.reasoning).toContain('DeepSeek R1');
    });

    it('should adapt to simple complexity under balanced priority', () => {
      const rec = AiRouterEngine.recommendModel({
        role: 'ai-chat',
        optimizeFor: 'balanced',
        taskComplexity: 'simple'
      });

      expect(rec.recommendedModel).toBe('gpt-4o-mini');
      expect(rec.benchmarkComparison.savingsPercent).toBeGreaterThan(90);
    });
  });

  describe('classifyTask', () => {
    it('should classify analytics task and route to deep branch', () => {
      const classification = AiRouterEngine.classifyTask(
        'Por favor, faça uma análise de avatar, mapeie as principais dores e monte a matriz SWOT dos concorrentes'
      );

      expect(classification.branch).toBe('deep');
      expect(classification.category).toBe('analytics');
      expect(classification.detectedKeywords).toContain('swot');
      expect(classification.detectedKeywords).toContain('avatar');
      expect(classification.detectedKeywords).toContain('dor');
      expect(classification.confidence).toBeGreaterThanOrEqual(0.85);
      expect(classification.recommendedModel).toBe('deepseek-r1');
    });

    it('should classify copywriting task and route to balanced branch', () => {
      const classification = AiRouterEngine.classifyTask(
        'Elabore um roteiro de alta retenção para YouTube e uma copy de vendas para VSL'
      );

      expect(classification.branch).toBe('balanced');
      expect(classification.category).toBe('copywriting');
      expect(classification.detectedKeywords).toContain('roteiro');
      expect(classification.detectedKeywords).toContain('vsl');
      expect(classification.recommendedModel).toBe('claude-3-7-sonnet');
    });

    it('should classify summarization task and route to fast branch', () => {
      const classification = AiRouterEngine.classifyTask(
        'Gere um resumo executivo com os principais pontos e tldr do documento'
      );

      expect(classification.branch).toBe('fast');
      expect(classification.category).toBe('summarization');
      expect(classification.detectedKeywords).toContain('resumo');
      expect(classification.detectedKeywords).toContain('tldr');
      expect(classification.recommendedModel).toBe('gemini-1-5-flash');
    });
  });
});
