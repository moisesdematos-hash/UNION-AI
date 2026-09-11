import { describe, it, expect } from 'vitest';
import {
  AuditActionEnum,
  AuditLogSchema,
  MetricsSnapshotSchema
} from '../types/observability.js';

describe('Gate 17: Observability & Audit Trail Schemas', () => {
  it('validates AuditActionEnum values', () => {
    expect(AuditActionEnum.parse('AUTH_LOGIN')).toBe('AUTH_LOGIN');
    expect(AuditActionEnum.parse('ORG_CREATE')).toBe('ORG_CREATE');
    expect(AuditActionEnum.parse('WORKFLOW_EXECUTE')).toBe('WORKFLOW_EXECUTE');
    expect(AuditActionEnum.parse('WEBHOOK_TRIGGER')).toBe('WEBHOOK_TRIGGER');
    expect(() => AuditActionEnum.parse('INVALID_ACTION')).toThrow();
  });

  it('validates AuditLogSchema structure', () => {
    const validLog = {
      id: 'aud-123',
      actorId: 'usr-1',
      actorEmail: 'admin@union.ai',
      action: 'WORKFLOW_EXECUTE',
      entityType: 'workflow',
      entityId: 'wf-456',
      details: { mode: 'RUN', totalCostCredits: 0.05 },
      ipAddress: '192.168.1.100',
      createdAt: Date.now()
    };

    const parsed = AuditLogSchema.parse(validLog);
    expect(parsed.id).toBe('aud-123');
    expect(parsed.action).toBe('WORKFLOW_EXECUTE');
    expect(parsed.details.mode).toBe('RUN');
  });

  it('validates MetricsSnapshotSchema', () => {
    const snapshot = MetricsSnapshotSchema.parse({
      uptimeSeconds: 3600,
      workflowsExecutedTotal: 42,
      tokensConsumedTotal: 15400,
      creditsDeductedTotal: 2.35,
      avgDurationMs: 450,
      activeNodesGauge: 3,
      errorRatePercent: 0.5
    });

    expect(snapshot.workflowsExecutedTotal).toBe(42);
    expect(snapshot.tokensConsumedTotal).toBe(15400);
    expect(snapshot.errorRatePercent).toBe(0.5);
  });
});
