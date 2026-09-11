import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';

describe('Gate 12: Workflow Runs & Versioning API', () => {
  const app = createApp();

  let tokenA: string;
  let tokenB: string;
  let projectIdA: string;
  let workflowIdA: string;

  beforeEach(async () => {
    resetTestDatabase();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'userA_gate12@union.ai',
        name: 'User A',
        password: 'Password123!'
      });
    tokenA = resA.body.data.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'userB_gate12@union.ai',
        name: 'User B',
        password: 'Password123!'
      });
    tokenB = resB.body.data.token;

    // Create Project for User A
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Marketing Automation Project' });
    projectIdA = projRes.body.data.project.id;

    // Create Workflow for User A
    const wfRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        projectId: projectIdA,
        name: 'Omnichannel Launch Campaign'
      });
    workflowIdA = wfRes.body.data.workflow.id;
  });

  describe('Workflow Runs History', () => {
    it('should record a workflow run and retrieve it in history list', async () => {
      const recordRes = await request(app)
        .post(`/api/workflows/${workflowIdA}/runs`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          status: 'COMPLETED',
          mode: 'RUN',
          totalNodes: 4,
          completedNodes: 4,
          failedNodes: 0,
          totalTokens: 1450,
          totalCostCredits: 0.045,
          durationMs: 820,
          summary: {
            pipelineName: 'Omnichannel Launch Campaign',
            modelsUsed: ['claude-3-7-sonnet', 'gpt-4o-mini']
          }
        });

      expect(recordRes.status).toBe(201);
      expect(recordRes.body.status).toBe('success');
      const run = recordRes.body.data.run;
      expect(run.id).toBeDefined();
      expect(run.status).toBe('COMPLETED');
      expect(run.totalTokens).toBe(1450);
      expect(run.totalCostCredits).toBe(0.045);

      // Retrieve list
      const listRes = await request(app)
        .get(`/api/workflows/${workflowIdA}/runs`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.runs.length).toBe(1);
      expect(listRes.body.data.runs[0].id).toBe(run.id);

      // Retrieve single run details
      const getRes = await request(app)
        .get(`/api/workflows/${workflowIdA}/runs/${run.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.run.summary.pipelineName).toBe('Omnichannel Launch Campaign');
    });

    it('should prevent User B from accessing User A runs', async () => {
      // Record run as User A
      const recordRes = await request(app)
        .post(`/api/workflows/${workflowIdA}/runs`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ status: 'COMPLETED' });
      const runId = recordRes.body.data.run.id;

      // User B tries to list User A's runs
      const listRes = await request(app)
        .get(`/api/workflows/${workflowIdA}/runs`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(listRes.status).toBe(400);

      // User B tries to get single run
      const getRes = await request(app)
        .get(`/api/workflows/${workflowIdA}/runs/${runId}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Workflow Versioning & Rollback', () => {
    it('should create version snapshots, list versions, and rollback workflow state', async () => {
      // 1. Update workflow to v1 state with 1 node
      await request(app)
        .put(`/api/workflows/${workflowIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Campaign v1 (Draft)',
          nodes: [
            {
              id: 'node-v1',
              type: 'source-text',
              label: 'Briefing',
              category: 'SOURCE',
              position: { x: 50, y: 50 },
              inputs: [],
              outputs: [],
              config: { text: 'Briefing v1' },
              state: 'IDLE'
            }
          ],
          connections: []
        });

      // Create snapshot Version 1
      const v1Res = await request(app)
        .post(`/api/workflows/${workflowIdA}/versions`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Milestone 1: Briefing Ready',
          description: 'Initial briefing node added'
        });

      expect(v1Res.status).toBe(201);
      const v1 = v1Res.body.data.version;
      expect(v1.name).toBe('Milestone 1: Briefing Ready');
      expect(v1.snapshot.nodes.length).toBe(1);

      // 2. Modify workflow to v2 state with 2 nodes
      await request(app)
        .put(`/api/workflows/${workflowIdA}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          name: 'Campaign v2 (With AI Writer)',
          nodes: [
            {
              id: 'node-v1',
              type: 'source-text',
              label: 'Briefing',
              category: 'SOURCE',
              position: { x: 50, y: 50 },
              inputs: [],
              outputs: [],
              config: { text: 'Briefing v1' },
              state: 'IDLE'
            },
            {
              id: 'node-v2',
              type: 'ai-writer',
              label: 'AI Script',
              category: 'AI',
              position: { x: 300, y: 50 },
              inputs: [],
              outputs: [],
              config: {},
              state: 'IDLE'
            }
          ],
          connections: []
        });

      // Verify active workflow has 2 nodes
      const activeWf = await request(app)
        .get(`/api/workflows/${workflowIdA}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(activeWf.body.data.workflow.nodes.length).toBe(2);

      // 3. List versions
      const versionsList = await request(app)
        .get(`/api/workflows/${workflowIdA}/versions`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(versionsList.status).toBe(200);
      expect(versionsList.body.data.versions.length).toBe(1);

      // 4. Rollback to Version 1 snapshot
      const rollbackRes = await request(app)
        .post(`/api/workflows/${workflowIdA}/versions/${v1.id}/rollback`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(rollbackRes.status).toBe(200);
      const restored = rollbackRes.body.data.workflow;
      expect(restored.name).toBe('Campaign v1 (Draft)');
      expect(restored.nodes.length).toBe(1);
      expect(restored.nodes[0].id).toBe('node-v1');
    });
  });
});
