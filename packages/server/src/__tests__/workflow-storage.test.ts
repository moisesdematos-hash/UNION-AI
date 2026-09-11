import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';

describe('Workflow & Project Storage Persistence API', () => {
  const app = createApp();
  let userAToken: string;
  let userBToken: string;
  let userAProjectId: string;

  beforeEach(async () => {
    resetTestDatabase();

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      email: 'usera@union.ai',
      password: 'passwordA123',
      name: 'User A'
    });
    userAToken = resA.body.data.token;

    // Get default project for User A
    const projResA = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${userAToken}`);
    userAProjectId = projResA.body.data.projects[0].id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      email: 'userb@union.ai',
      password: 'passwordB123',
      name: 'User B'
    });
    userBToken = resB.body.data.token;
  });

  it('should create and retrieve a workflow inside a project', async () => {
    const createRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        projectId: userAProjectId,
        name: 'YouTube Content Pipeline',
        description: 'Transcreve e gera posts para Instagram e LinkedIn'
      });

    expect(createRes.status).toBe(201);
    const wfId = createRes.body.data.workflow.id;
    expect(createRes.body.data.workflow.version).toBe(1);

    // Retrieve
    const getRes = await request(app)
      .get(`/api/workflows/${wfId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.workflow.name).toBe('YouTube Content Pipeline');
    expect(getRes.body.data.workflow.nodes).toEqual([]);
    expect(getRes.body.data.workflow.connections).toEqual([]);
  });

  it('should save workflow state with nodes, ports, and connections atomically and increment version', async () => {
    // 1. Create workflow
    const createRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        projectId: userAProjectId,
        name: 'Autosave Test Workflow'
      });
    const wfId = createRes.body.data.workflow.id;

    // 2. Put (autosave) with 2 nodes and 1 connection
    const sampleNodes = [
      {
        id: 'node-youtube-1',
        type: 'source-youtube',
        label: 'YouTube Source',
        category: 'SOURCE' as const,
        position: { x: 50, y: 100 },
        inputs: [
          { id: 'in-url', name: 'url', label: 'Video URL', type: 'URL' as const, isMulti: false, required: true }
        ],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT' as const, isMulti: true, required: true }
        ],
        config: { url: 'https://youtube.com/watch?v=sample123' },
        state: 'COMPLETED' as const
      },
      {
        id: 'node-ai-writer-2',
        type: 'ai-writer',
        label: 'Content Writer',
        category: 'AI' as const,
        position: { x: 400, y: 100 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Source Context', type: 'TEXT' as const, isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-post', name: 'content', label: 'Final Content', type: 'AI_RESPONSE' as const, isMulti: true, required: true }
        ],
        config: { model: 'gpt-4o', tone: 'persuasive' },
        state: 'IDLE' as const
      }
    ];

    const sampleConnections = [
      {
        id: 'conn-1-2',
        sourceNodeId: 'node-youtube-1',
        sourcePortId: 'out-transcript',
        targetNodeId: 'node-ai-writer-2',
        targetPortId: 'in-context',
        state: 'connected' as const
      }
    ];

    const saveRes = await request(app)
      .put(`/api/workflows/${wfId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Autosave Test Workflow (Updated)',
        viewport: { x: 120, y: 80, zoom: 1.25 },
        nodes: sampleNodes,
        connections: sampleConnections
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.workflow.version).toBe(2);
    expect(saveRes.body.data.workflow.viewport.zoom).toBe(1.25);
    expect(saveRes.body.data.workflow.nodes.length).toBe(2);
    expect(saveRes.body.data.workflow.connections.length).toBe(1);

    // 3. Reload and verify full persistence integrity
    const reloadRes = await request(app)
      .get(`/api/workflows/${wfId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(reloadRes.status).toBe(200);
    const loaded = reloadRes.body.data.workflow;
    expect(loaded.version).toBe(2);
    expect(loaded.nodes[0].id).toBe('node-youtube-1');
    expect(loaded.nodes[0].position.x).toBe(50);
    expect(loaded.nodes[0].config.url).toBe('https://youtube.com/watch?v=sample123');
    expect(loaded.nodes[1].id).toBe('node-ai-writer-2');
    expect(loaded.connections[0].id).toBe('conn-1-2');
    expect(loaded.connections[0].sourceNodeId).toBe('node-youtube-1');
    expect(loaded.connections[0].targetNodeId).toBe('node-ai-writer-2');
  });

  it('should enforce strict user isolation (User B cannot access or modify User A workflows)', async () => {
    // User A creates a workflow
    const createRes = await request(app)
      .post('/api/workflows')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        projectId: userAProjectId,
        name: 'Private Secret Pipeline'
      });
    const wfId = createRes.body.data.workflow.id;

    // User B tries to read User A's workflow
    const readAttempt = await request(app)
      .get(`/api/workflows/${wfId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(readAttempt.status).toBe(404);

    // User B tries to update User A's workflow
    const updateAttempt = await request(app)
      .put(`/api/workflows/${wfId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ name: 'Hacked Pipeline', nodes: [], connections: [] });

    expect(updateAttempt.status).toBe(400);
  });
});
