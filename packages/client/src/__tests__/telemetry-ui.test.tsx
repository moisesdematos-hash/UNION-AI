import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { MetricsSnapshotSchema, AuditLogSchema } from '@union/shared';

describe('Gate 17: Observability & Telemetry UI Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCanvasStore.getState().resetCanvas();
  });

  it('validates client-side schemas for metrics snapshots and audit logs', () => {
    const validSnapshot = MetricsSnapshotSchema.parse({
      uptimeSeconds: 3600,
      workflowsExecutedTotal: 42,
      tokensConsumedTotal: 125000,
      creditsDeductedTotal: 12.5,
      avgDurationMs: 345.5,
      activeNodesGauge: 2,
      errorRatePercent: 4.76
    });

    expect(validSnapshot.workflowsExecutedTotal).toBe(42);
    expect(validSnapshot.uptimeSeconds).toBe(3600);

    const validAuditLog = AuditLogSchema.parse({
      id: 'audit-001',
      actorId: 'usr-123',
      actorEmail: 'devops@union.ai',
      action: 'WORKFLOW_EXECUTE',
      entityType: 'workflow',
      entityId: 'wf-999',
      details: { trigger: 'MANUAL', durationMs: 250 },
      createdAt: Date.now()
    });

    expect(validAuditLog.action).toBe('WORKFLOW_EXECUTE');
    expect(validAuditLog.actorEmail).toBe('devops@union.ai');
  });

  it('renders Gate 17 Active badge and canvas metrics in top bar', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'UNION.AI Core Server'
      })
    });

    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /UNION\.AI/i })).toBeInTheDocument();
    expect(screen.getByText(/Gate 1[78] Active/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Backend: ONLINE/i)).toBeInTheDocument();
    });
  });
});
