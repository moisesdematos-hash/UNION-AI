import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { metricsCollector } from '../services/metrics-collector.js';
import { auditService } from '../services/audit-service.js';

describe('Gate 17: Observability, Prometheus Metrics & Audit Trail API', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let userEmail: string;

  beforeEach(async () => {
    resetTestDatabase();
    metricsCollector.reset();

    userEmail = 'auditor.ops@example.com';
    const authRes = await authService.register(userEmail, 'AuditorPass123!', 'DevOps Auditor');
    userToken = authRes.token;
    userId = authRes.user.id;
  });

  describe('Prometheus Metrics (/metrics & /api/observability/metrics)', () => {
    it('should expose valid Prometheus text format metrics at /metrics', async () => {
      metricsCollector.recordExecution({ durationMs: 250, success: true, tokens: 1200, credits: 0.15 });
      metricsCollector.recordExecution({ durationMs: 350, success: false, tokens: 800, credits: 0.10 });
      metricsCollector.setActiveNodes(3);

      const res = await request(app)
        .get('/metrics')
        .expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('# HELP union_uptime_seconds');
      expect(res.text).toContain('# TYPE union_workflows_executed_total counter');
      expect(res.text).toContain('union_workflows_executed_total 2');
      expect(res.text).toContain('union_tokens_consumed_total 2000');
      expect(res.text).toContain('union_credits_deducted_total 0.25');
      expect(res.text).toContain('union_workflow_duration_ms_avg 300');
      expect(res.text).toContain('union_active_nodes_gauge 3');
      expect(res.text).toContain('union_error_rate_percent 50');
    });

    it('should expose Prometheus format also under /api/observability/metrics', async () => {
      const res = await request(app)
        .get('/api/observability/metrics')
        .expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('union_uptime_seconds');
    });
  });

  describe('Telemetry JSON Snapshot (/api/observability/telemetry)', () => {
    it('should return structured MetricsSnapshot matching schema', async () => {
      metricsCollector.recordExecution({ durationMs: 100, success: true, tokens: 500, credits: 0.05 });

      const res = await request(app)
        .get('/api/observability/telemetry')
        .expect(200);

      expect(res.body.success).toBe(true);
      const snapshot = res.body.data;
      expect(snapshot).toHaveProperty('uptimeSeconds');
      expect(snapshot.workflowsExecutedTotal).toBe(1);
      expect(snapshot.tokensConsumedTotal).toBe(500);
      expect(snapshot.creditsDeductedTotal).toBe(0.05);
      expect(snapshot.avgDurationMs).toBe(100);
      expect(snapshot.errorRatePercent).toBe(0);
    });
  });

  describe('Audit Trail API (/api/observability/audit)', () => {
    it('should reject unauthenticated access to audit endpoints', async () => {
      await request(app)
        .get('/api/observability/audit')
        .expect(401);

      await request(app)
        .post('/api/observability/audit')
        .send({ action: 'WORKFLOW_EXECUTE', entityType: 'workflow', entityId: 'wf-1' })
        .expect(401);
    });

    it('should reject invalid audit payloads with 400', async () => {
      const res = await request(app)
        .post('/api/observability/audit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'INVALID_ACTION_NAME',
          entityType: 'workflow',
          entityId: 'wf-1'
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid audit payload');
    });

    it('should successfully record an audit event and query it back', async () => {
      const postRes = await request(app)
        .post('/api/observability/audit')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          action: 'WORKFLOW_EXECUTE',
          entityType: 'workflow',
          entityId: 'wf-777',
          details: { durationMs: 420, nodesExecuted: 4 }
        })
        .expect(201);

      expect(postRes.body.success).toBe(true);
      const log = postRes.body.data;
      expect(log.actorId).toBe(userId);
      expect(log.actorEmail).toBe(userEmail);
      expect(log.action).toBe('WORKFLOW_EXECUTE');
      expect(log.entityType).toBe('workflow');
      expect(log.entityId).toBe('wf-777');
      expect(log.details).toEqual({ durationMs: 420, nodesExecuted: 4 });

      // Query audit logs
      const getRes = await request(app)
        .get('/api/observability/audit?action=WORKFLOW_EXECUTE')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getRes.body.success).toBe(true);
      expect(getRes.body.total).toBe(1);
      expect(getRes.body.data).toHaveLength(1);
      expect(getRes.body.data[0].id).toBe(log.id);
      expect(getRes.body.data[0].action).toBe('WORKFLOW_EXECUTE');
    });

    it('should filter audit logs by action and entityType', async () => {
      auditService.recordEvent({
        actorId: userId,
        actorEmail: userEmail,
        action: 'ORG_CREATE',
        entityType: 'organization',
        entityId: 'org-1'
      });
      auditService.recordEvent({
        actorId: userId,
        actorEmail: userEmail,
        action: 'MEMBER_ADD',
        entityType: 'organization',
        entityId: 'org-1'
      });
      auditService.recordEvent({
        actorId: userId,
        actorEmail: userEmail,
        action: 'CREDIT_TOPUP',
        entityType: 'credits',
        entityId: 'tx-1'
      });

      const orgRes = await request(app)
        .get('/api/observability/audit?entityType=organization')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orgRes.body.total).toBe(2);
      expect(orgRes.body.data).toHaveLength(2);

      const topupRes = await request(app)
        .get('/api/observability/audit?action=CREDIT_TOPUP')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(topupRes.body.total).toBe(1);
      expect(topupRes.body.data[0].action).toBe('CREDIT_TOPUP');
    });

    it('should paginate audit logs using limit and offset', async () => {
      for (let i = 1; i <= 5; i++) {
        auditService.recordEvent({
          actorId: userId,
          actorEmail: userEmail,
          action: 'WORKFLOW_UPDATE',
          entityType: 'workflow',
          entityId: `wf-${i}`,
          details: { version: i }
        });
      }

      const page1 = await request(app)
        .get('/api/observability/audit?limit=2&offset=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(page1.body.total).toBe(5);
      expect(page1.body.data).toHaveLength(2);

      const page2 = await request(app)
        .get('/api/observability/audit?limit=2&offset=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(page2.body.total).toBe(5);
      expect(page2.body.data).toHaveLength(2);
      expect(page2.body.data[0].id).not.toBe(page1.body.data[0].id);
    });
  });
});
