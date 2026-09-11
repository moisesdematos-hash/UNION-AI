import { describe, it, expect } from 'vitest';
import {
  MODEL_PRICING_CATALOG,
  calculateModelCreditCost,
  AiPromptRequestSchema,
  AiModel
} from '../types/ai.js';

describe('Shared AI Domain & Pricing Engine', () => {
  it('should have pricing entries for all major models', () => {
    const expectedModels: AiModel[] = [
      'auto',
      'gpt-4o',
      'gpt-4o-mini',
      'claude-3-7-sonnet',
      'claude-3-5-haiku',
      'gemini-1-5-pro',
      'gemini-1-5-flash',
      'deepseek-r1',
      'deepseek-chat',
      'groq-llama-3'
    ];

    expectedModels.forEach((model) => {
      const pricing = MODEL_PRICING_CATALOG[model];
      expect(pricing).toBeDefined();
      expect(pricing.inputPer1k).toBeGreaterThan(0);
      expect(pricing.outputPer1k).toBeGreaterThan(0);
      expect(pricing.provider).toBeDefined();
      expect(pricing.displayName).toBeDefined();
    });
  });

  it('should calculate accurate credit costs for GPT-4o', () => {
    // 1,000 prompt tokens ($0.0025) + 1,000 completion tokens ($0.01) = $0.0125
    const cost = calculateModelCreditCost('gpt-4o', 1000, 1000);
    expect(cost).toBeCloseTo(0.0125, 4);
  });

  it('should calculate accurate credit costs for Claude 3.7 Sonnet', () => {
    // 2,000 prompt ($0.006) + 1,000 completion ($0.015) = $0.021
    const cost = calculateModelCreditCost('claude-3-7-sonnet', 2000, 1000);
    expect(cost).toBeCloseTo(0.021, 4);
  });

  it('should calculate low cost for Gemini 1.5 Flash', () => {
    // 10,000 prompt ($0.00075) + 2,000 completion ($0.0006) = $0.00135
    const cost = calculateModelCreditCost('gemini-1-5-flash', 10000, 2000);
    expect(cost).toBeCloseTo(0.00135, 5);
  });

  it('should enforce minimum credit floor of $0.0001', () => {
    const cost = calculateModelCreditCost('gemini-1-5-flash', 1, 1);
    expect(cost).toBe(0.0001);
  });

  it('validates valid AiPromptRequest schemas', () => {
    const valid = {
      role: 'ai-writer',
      model: 'claude-3-7-sonnet',
      userPrompt: 'Write a retention script for YouTube',
      options: {
        format: 'youtube-script',
        temperature: 0.7
      }
    };

    const parsed = AiPromptRequestSchema.parse(valid);
    expect(parsed.role).toBe('ai-writer');
    expect(parsed.model).toBe('claude-3-7-sonnet');
    expect(parsed.options?.format).toBe('youtube-script');
  });

  it('rejects invalid AiPromptRequest with empty userPrompt', () => {
    const invalid = {
      role: 'ai-chat',
      userPrompt: ''
    };

    expect(() => AiPromptRequestSchema.parse(invalid)).toThrow();
  });
});
