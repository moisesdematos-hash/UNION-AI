import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { workflowRepository } from '../services/workflow-repository.js';
import { auditService } from '../services/audit-service.js';

describe('Gate 18: Workflow Templates & Instantiation API', () => {
  const app = createApp();
  let userToken: string;
  let userId: string;
  let userEmail: string;
  let projectId: string;

  beforeEach(async () => {
    resetTestDatabase();

    userEmail = 'template.creator@example.com';
    const authRes = await authService.register(userEmail, 'TplPass123!', 'Template Creator');
    userToken = authRes.token;
    userId = authRes.user.id;

    const project = workflowRepository.createProject(userId, 'Production Marketing Project');
    projectId = project.id;
  });

  describe('GET /api/templates', () => {
    it('should list all available official templates', async () => {
      const res = await request(app)
        .get('/api/templates')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain('youtube-content-factory');
      expect(ids).toContain('competitor-intel-report');
      expect(ids).toContain('marketing-vsl-engine');
    });

    it('should filter templates by category query parameter', async () => {
      const res = await request(app)
        .get('/api/templates?category=CONTENT')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const ids = res.body.data.map((t: any) => t.id);
      expect(ids).toContain('youtube-content-factory');
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should return the full template structure by ID', async () => {
      const res = await request(app)
        .get('/api/templates/marketing-vsl-engine')
        .expect(200);

      expect(res.body.success).toBe(true);
      const tpl = res.body.data;
      expect(tpl.name).toBe('Autonomous Marketing VSL Engine');
      expect(tpl.nodes).toHaveLength(4);
      expect(tpl.connections).toHaveLength(3);
    });

    it('should return 404 for nonexistent template ID', async () => {
      const res = await request(app)
        .get('/api/templates/nonexistent-template')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('POST /api/templates/:id/instantiate', () => {
    it('should reject unauthenticated template instantiation with 401', async () => {
      await request(app)
        .post('/api/templates/youtube-content-factory/instantiate')
        .send({ projectId })
        .expect(401);
    });

    it('should reject invalid payloads missing projectId with 400', async () => {
      const res = await request(app)
        .post('/api/templates/youtube-content-factory/instantiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid request');
    });

    it('should instantiate a template into a live, persistent workflow for the user', async () => {
      const instantiateRes = await request(app)
        .post('/api/templates/youtube-content-factory/instantiate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          projectId,
          workflowName: 'My Viral YouTube Pipeline'
        })
        .expect(201);

      expect(instantiateRes.body.success).toBe(true);
      const wf = instantiateRes.body.data;
      expect(wf.id).toBeDefined();
      expect(wf.name).toBe('My Viral YouTube Pipeline');
      expect(wf.nodes).toHaveLength(4);
      expect(wf.connections).toHaveLength(3);

      // Verify node IDs were regenerated and remapped
      const nodeIds = wf.nodes.map((n: any) => n.id);
      expect(nodeIds.every((id: string) => id.startsWith('node-'))).toBe(true);
      expect(nodeIds).not.toContain('tpl-yt-src');

      // Verify connections point to the new node IDs
      const firstConn = wf.connections[0];
      expect(nodeIds).toContain(firstConn.sourceNodeId);
      expect(nodeIds).toContain(firstConn.targetNodeId);

      // Fetch workflow back from workflow storage API
      const getWfRes = await request(app)
        .get(`/api/workflows/${wf.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getWfRes.body.status).toBe('success');
      expect(getWfRes.body.data.workflow.nodes).toHaveLength(4);
      expect(getWfRes.body.data.workflow.connections).toHaveLength(3);

      // Verify audit trail entry was recorded
      const auditRes = auditService.queryLogs({ actorId: userId, action: 'WORKFLOW_CREATE' });
      expect(auditRes.total).toBeGreaterThanOrEqual(1);
      expect(auditRes.logs[0].entityId).toBe(wf.id);
      expect(auditRes.logs[0].details).toHaveProperty('templateId', 'youtube-content-factory');
    });
  });
});
