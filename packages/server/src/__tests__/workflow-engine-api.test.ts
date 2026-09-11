import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';

describe('Workflow Engine Server API — Validation & Execution Plan', () => {
  const app = createApp();
  let authToken: string;
  let projectId: string;
  let workflowId: string;

  beforeEach(async () => {
    resetTestDatabase();

    // Register user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'engine-test@union.ai',
        password: 'Password123!',
        name: 'Engine Test User'
      });

    authToken = userRes.body.data.token;

    // Create project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Engine Project' });

    projectId = projRes.body.data.project.id;

    // Create workflow
    const wfRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId,
        name: 'DAG Engine Test Workflow'
      });

    workflowId = wfRes.body.data.workflow.id;
  });

  it('should validate workflow and report empty workflow error', async () => {
    const res = await request(app)
      .post(`/api/workflows/${workflowId}/validate`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.validation.isValid).toBe(false);
    expect(res.body.data.validation.errors[0].code).toBe('EMPTY_WORKFLOW');
  });

  it('should save valid DAG workflow and generate execution plan with parallel batches', async () => {
    // Save 3-node DAG: Source -> Analyst -> Writer
    await request(app)
      .put(`/api/workflows/${workflowId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        nodes: [
          {
            id: 'src-1',
            type: 'source-youtube',
            label: 'YouTube Source',
            category: 'SOURCE',
            position: { x: 0, y: 0 },
            inputs: [],
            outputs: [{ id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true }],
            config: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            state: 'IDLE'
          },
          {
            id: 'ai-1',
            type: 'ai-analyst',
            label: 'Market Analyst',
            category: 'AI',
            position: { x: 300, y: 0 },
            inputs: [{ id: 'in-sources', name: 'sources', label: 'Sources', type: 'TRANSCRIPT', isMulti: true, required: false }],
            outputs: [{ id: 'out-analysis', name: 'analysis', label: 'Analysis', type: 'AI_RESPONSE', isMulti: true, required: true }],
            config: {},
            state: 'IDLE'
          },
          {
            id: 'writer-1',
            type: 'ai-writer',
            label: 'Content Writer',
            category: 'AI',
            position: { x: 600, y: 0 },
            inputs: [{ id: 'in-briefing', name: 'briefing', label: 'Briefing', type: 'AI_RESPONSE', isMulti: false, required: false }],
            outputs: [{ id: 'out-content', name: 'content', label: 'Content', type: 'AI_RESPONSE', isMulti: true, required: true }],
            config: { format: 'youtube-script' },
            state: 'IDLE'
          }
        ],
        connections: [
          {
            id: 'c1',
            sourceNodeId: 'src-1',
            sourcePortId: 'out-transcript',
            targetNodeId: 'ai-1',
            targetPortId: 'in-sources',
            status: 'connected'
          },
          {
            id: 'c2',
            sourceNodeId: 'ai-1',
            sourcePortId: 'out-analysis',
            targetNodeId: 'writer-1',
            targetPortId: 'in-briefing',
            status: 'connected'
          }
        ]
      });

    // 1. Validate
    const valRes = await request(app)
      .post(`/api/workflows/${workflowId}/validate`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(valRes.status).toBe(200);
    expect(valRes.body.data.validation.isValid).toBe(true);
    expect(valRes.body.data.validation.errors.length).toBe(0);

    // 2. Plan
    const planRes = await request(app)
      .post(`/api/workflows/${workflowId}/plan`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ mode: 'RUN' });

    expect(planRes.status).toBe(200);
    const plan = planRes.body.data.plan;
    expect(plan.totalNodes).toBe(3);
    expect(plan.levels.length).toBe(3);
    expect(plan.levels[0]).toEqual(['src-1']);
    expect(plan.levels[1]).toEqual(['ai-1']);
    expect(plan.levels[2]).toEqual(['writer-1']);
    expect(plan.executionOrder).toEqual(['src-1', 'ai-1', 'writer-1']);
  });
});
