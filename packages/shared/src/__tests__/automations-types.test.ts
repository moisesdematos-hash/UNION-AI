import { describe, it, expect } from 'vitest';
import {
  TriggerTypeEnum,
  WebhookTriggerConfigSchema,
  ScheduleTriggerConfigSchema,
  LoopConfigSchema,
  AutonomousAgentConfigSchema,
  AutonomousAgentResultSchema
} from '../types/automations.js';

describe('Gate 15: Automations & Autonomous Agents Schemas', () => {
  it('validates TriggerType enum values', () => {
    expect(TriggerTypeEnum.parse('MANUAL')).toBe('MANUAL');
    expect(TriggerTypeEnum.parse('WEBHOOK')).toBe('WEBHOOK');
    expect(TriggerTypeEnum.parse('SCHEDULE')).toBe('SCHEDULE');
    expect(TriggerTypeEnum.parse('EVENT')).toBe('EVENT');
    expect(() => TriggerTypeEnum.parse('INVALID')).toThrow();
  });

  it('validates WebhookTriggerConfigSchema correctly', () => {
    const valid = {
      secretToken: 'super-secret-token-12345',
      enabled: true,
      allowedOrigins: ['https://app.union.ai'],
      expectedMethod: 'POST'
    };
    const parsed = WebhookTriggerConfigSchema.parse(valid);
    expect(parsed.secretToken).toBe('super-secret-token-12345');
    expect(parsed.expectedMethod).toBe('POST');

    // Reject short secret
    expect(() => WebhookTriggerConfigSchema.parse({ secretToken: '123' })).toThrow();
  });

  it('validates ScheduleTriggerConfigSchema correctly', () => {
    const valid = {
      cronExpression: '0 8 * * *',
      timezone: 'America/Sao_Paulo',
      enabled: true
    };
    const parsed = ScheduleTriggerConfigSchema.parse(valid);
    expect(parsed.cronExpression).toBe('0 8 * * *');
    expect(parsed.timezone).toBe('America/Sao_Paulo');

    expect(() => ScheduleTriggerConfigSchema.parse({ cronExpression: '' })).toThrow();
  });

  it('enforces LoopConfigSchema guard rails and defaults', () => {
    const defaults = LoopConfigSchema.parse({});
    expect(defaults.maxIterations).toBe(10);
    expect(defaults.accumulateOutput).toBe(true);
    expect(defaults.stopOnError).toBe(true);

    // Limit maximum iterations to avoid runaway graphs
    expect(() => LoopConfigSchema.parse({ maxIterations: 500 })).toThrow();
  });

  it('validates AutonomousAgentConfig and Result Schema', () => {
    const config = AutonomousAgentConfigSchema.parse({
      agentGoal: 'Realizar benchmark profundo de 3 concorrentes',
      maxSteps: 7,
      reflectionEnabled: true
    });
    expect(config.agentGoal).toContain('benchmark');
    expect(config.maxSteps).toBe(7);

    const result = AutonomousAgentResultSchema.parse({
      goal: config.agentGoal,
      finalAnswer: 'Concorrentes analisados com sucesso com 4 brechas encontradas.',
      totalSteps: 3,
      success: true,
      tokensUsed: 1250,
      creditsCost: 0.05,
      steps: [
        {
          stepNumber: 1,
          thought: 'Identificar o primeiro concorrente',
          action: 'search_database',
          toolName: 'web-search',
          observation: 'Concorrente Alpha encontrado',
          durationMs: 120
        }
      ]
    });
    expect(result.success).toBe(true);
    expect(result.steps.length).toBe(1);
  });
});
