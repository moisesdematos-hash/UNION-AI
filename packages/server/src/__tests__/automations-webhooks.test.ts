import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { workflowRepository } from '../services/workflow-repository.js';
import { creditsService } from '../services/credits-service.js';

describe('Gate 15: Automations, Webhooks & Autonomous Trigger API', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let projectId: string;
  let workflowId: string;

  beforeEach(async () => {
    resetTestDatabase();

    const authRes = await authService.register('automation.user@example.com', 'SecureP@ss123', 'Automation User');
    userToken = authRes.token;
    userId = authRes.user.id;

    const project = workflowRepository.createProject(userId, 'Autonomous Marketing Project');
    projectId = project.id;

    const workflow = workflowRepository.createWorkflow(projectId, userId, 'Automated Ad Generator');
    workflowId = workflow.id;

    // Add source and transform nodes so workflow is valid
    workflowRepository.saveWorkflowState(workflowId, userId, {
      nodes: [
        {
          id: 'node-trigger-1',
          type: 'trigger-webhook',
          label: 'Webhook Trigger',
          category: 'SOURCE',
          position: { x: 100, y: 100 },
          inputs: [],
          outputs: [{ id: 'out-data', name: 'data', label: 'Payload', type: 'TEXT', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        },
        {
          id: 'node-writer-1',
          type: 'ai-writer',
          label: 'AI Content Writer',
          category: 'AI',
          position: { x: 400, y: 100 },
          inputs: [{ id: 'in-briefing', name: 'briefing', label: 'Briefing', type: 'TEXT', isMulti: true, required: true }],
          outputs: [{ id: 'out-content', name: 'content', label: 'Written Content', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        }
      ],
      connections: [
        {
          id: 'conn-1',
          sourceNodeId: 'node-trigger-1',
          sourcePortId: 'out-data',
          targetNodeId: 'node-writer-1',
          targetPortId: 'in-briefing',
          state: 'connected'
        }
      ]
    });
  });

  describe('Webhook Trigger Management', () => {
    it('creates a new webhook trigger for a workflow', async () => {
      const res = await request(app)
        .post(`/api/webhooks/workflow/${workflowId}/triggers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'WEBHOOK',
          config: { filter: 'conversion-events' }
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.trigger).toBeDefined();
      expect(res.body.data.trigger.type).toBe('WEBHOOK');
      expect(res.body.data.trigger.webhookConfig).toBeDefined();
      expect(res.body.data.trigger.webhookConfig.secretToken).toMatch(/^whk_/);
    });

    it('lists all active triggers for a workflow', async () => {
      await request(app)
        .post(`/api/webhooks/workflow/${workflowId}/triggers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'WEBHOOK' });

      await request(app)
        .post(`/api/webhooks/workflow/${workflowId}/triggers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'SCHEDULE', config: { cronExpression: '0 9 * * *' } });

      const res = await request(app)
        .get(`/api/webhooks/workflow/${workflowId}/triggers`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.triggers.length).toBe(2);
    });
  });

  describe('External Webhook Invocation (/api/webhooks/v1/trigger/:workflowId)', () => {
    it('executes workflow end-to-end via valid webhook token and records run with deducted credits', async () => {
      // 1. Create trigger
      const triggerRes = await request(app)
        .post(`/api/webhooks/workflow/${workflowId}/triggers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'WEBHOOK' });

      const token = triggerRes.body.data.trigger.webhookConfig.secretToken;

      // 2. Call external webhook with payload
      const triggerPayload = {
        event: 'LEAD_CAPTURED',
        customerEmail: 'lead@example.com',
        interest: 'High Ticket Course'
      };

      const res = await request(app)
        .post(`/api/webhooks/v1/trigger/${workflowId}`)
        .set('x-webhook-token', token)
        .send(triggerPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.runId).toBeDefined();
      expect(res.body.data.summary.status).toBe('COMPLETED');
      expect(res.body.data.summary.completedNodes).toBe(2);
      expect(res.body.data.summary.totalCostCredits).toBeGreaterThan(0);

      // 3. Verify credits were deducted
      const credits = creditsService.getUserCredits(userId);
      expect(credits.balance).toBeLessThan(100.0);
      expect(credits.totalConsumed).toBeGreaterThan(0);
    });

    it('rejects webhook call without authentication token', async () => {
      const res = await request(app)
        .post(`/api/webhooks/v1/trigger/${workflowId}`)
        .send({ test: true });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('rejects webhook call with invalid token', async () => {
      const res = await request(app)
        .post(`/api/webhooks/v1/trigger/${workflowId}`)
        .set('x-webhook-token', 'whk_invalidtoken123')
        .send({ test: true });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('rejects webhook call when user has insufficient credits', async () => {
      const triggerRes = await request(app)
        .post(`/api/webhooks/workflow/${workflowId}/triggers`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ type: 'WEBHOOK' });

      const token = triggerRes.body.data.trigger.webhookConfig.secretToken;

      // Drain user credits
      creditsService.deductCredits(userId, 100.0, { description: 'Deplete balance for quota test' });

      const res = await request(app)
        .post(`/api/webhooks/v1/trigger/${workflowId}`)
        .set('x-webhook-token', token)
        .send({ test: true });

      expect(res.status).toBe(402);
      expect(res.body.message).toContain('Insufficient credits');
    });
  });
});
