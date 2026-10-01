import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { getOperationalDatabase } from '../db/operational-database.js';
import { WorkflowJobs } from '../services/workflow-jobs.js';
import { WorkflowDefinitionSchema } from '@union/shared';
import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { workflowRepository } from '../services/workflow-repository.js';
import { userStorageService } from '../services/user-storage-service.js';
import { creditsService } from '../services/credits-service.js';
import { NodeDefinitionSchema, ConnectionDefinitionSchema, ViewportSchema, WorkflowGroupSchema, WorkflowEngine } from '@union/shared';
export const workflowsRouter = Router();
workflowsRouter.use(requireAuth);
const CreateWorkflowSchema = z.object({
    projectId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional()
});
const SaveWorkflowStateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    viewport: ViewportSchema.optional(),
    nodes: z.array(NodeDefinitionSchema).default([]),
    connections: z.array(ConnectionDefinitionSchema).default([]),
    groups: z.array(WorkflowGroupSchema).optional().default([])
});
workflowsRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { projectId, name, description } = CreateWorkflowSchema.parse(req.body);
        const workflow = (await workflowRepository.createWorkflow(projectId, userId, name, description));
        res.status(201).json({ status: 'success', data: { workflow } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create workflow';
        res.status(400).json({ status: 'error', message });
    }
});
workflowsRouter.post('/import', async (req: AuthenticatedRequest, res: Response) => {
  const incoming = WorkflowDefinitionSchema.parse(req.body.workflow);
  const db = getOperationalDatabase();
  const saved = await db.transaction(async () => {
    const projects = await workflowRepository.listProjects(req.user!.id);
    const project = projects[0] || await workflowRepository.createProject(req.user!.id, 'Default Workspace');
    const workflow = await workflowRepository.createWorkflow(project.id, req.user!.id, incoming.name, incoming.description);
    const mapping = new Map(incoming.nodes.map(node => [node.id, randomUUID()]));
    return workflowRepository.saveWorkflowState(workflow.id, req.user!.id, { ...incoming,
      nodes: incoming.nodes.map(node => ({ ...node, id: mapping.get(node.id)! })),
      connections: incoming.connections.map(connection => ({ ...connection, id: randomUUID(), sourceNodeId: mapping.get(connection.sourceNodeId)!, targetNodeId: mapping.get(connection.targetNodeId)! })),
      groups: incoming.groups.map(group => ({ ...group, nodeIds: group.nodeIds.map(id => mapping.get(id) || id) })) });
  })();
  res.status(201).json({ status: 'success', data: { workflow: saved } });
});

workflowsRouter.post('/jobs', async (req: AuthenticatedRequest, res: Response) => {
  if (req.body.mode && req.body.mode !== 'RUN') return res.status(422).json({ status: 'error', message: 'PARTIAL_EXECUTION_NOT_IMPLEMENTED: Execute o workflow completo; retomada parcial requer checkpoints de entradas persistidos no servidor.' });
  const workflow = WorkflowDefinitionSchema.parse(req.body.workflow);
  const job = await WorkflowJobs.enqueue(req.user!.id, workflow);
  res.status(202).json({ status: 'success', data: job });
});
const jobPollingLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 2000, keyGenerator: req => (req as AuthenticatedRequest).user!.id, standardHeaders: true, legacyHeaders: false });
workflowsRouter.get('/jobs/:jobId', jobPollingLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const job = await WorkflowJobs.get(req.params.jobId, req.user!.id);
  res.status(job ? 200 : 404).json({ status: job ? 'success' : 'error', data: job });
});
workflowsRouter.delete('/jobs/:jobId', async (req: AuthenticatedRequest, res: Response) => {
  const cancelled = await WorkflowJobs.cancel(req.params.jobId, req.user!.id);
  res.status(cancelled ? 200 : 404).json({ status: cancelled ? 'success' : 'error' });
});

workflowsRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const workflow = (await workflowRepository.getWorkflow(workflowId, userId));
    if (!workflow) {
        return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }
    res.status(200).json({ status: 'success', data: { workflow } });
});
workflowsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const data = SaveWorkflowStateSchema.parse(req.body);
        if (!await workflowRepository.getWorkflow(workflowId, userId)) return res.status(404).json({ status: 'error', message: 'Workflow not found' });
        const updated = (await workflowRepository.saveWorkflowState(workflowId, userId, data));
        if (!updated) {
            return res.status(404).json({ status: 'error', message: 'Workflow not found' });
        }
        res.status(200).json({ status: 'success', data: { workflow: updated } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to save workflow state';
        res.status(400).json({ status: 'error', message });
    }
});
workflowsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const deleted = (await workflowRepository.deleteWorkflow(workflowId, userId));
    if (!deleted) {
        return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }
    res.status(200).json({ status: 'success', message: 'Workflow deleted' });
});
workflowsRouter.post('/:id/validate', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const workflow = (await workflowRepository.getWorkflow(workflowId, userId));
        if (!workflow) {
            return res.status(404).json({ status: 'error', message: 'Workflow not found' });
        }
        const validation = WorkflowEngine.validate(workflow);
        res.status(200).json({ status: 'success', data: { validation } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to validate workflow';
        res.status(400).json({ status: 'error', message });
    }
});
const PlanRequestSchema = z.object({
    mode: z.enum(['RUN', 'RUN_FROM_HERE', 'RETRY']).default('RUN'),
    targetNodeId: z.string().optional()
});
workflowsRouter.post('/:id/plan', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const { mode, targetNodeId } = PlanRequestSchema.parse(req.body);
        const workflow = (await workflowRepository.getWorkflow(workflowId, userId));
        if (!workflow) {
            return res.status(404).json({ status: 'error', message: 'Workflow not found' });
        }
        const plan = WorkflowEngine.generateExecutionPlan(workflow, mode, targetNodeId);
        const estimatedCost = Math.round(plan.totalNodes * 0.05 * 100000) / 100000;
        const quota = (await creditsService.checkQuota(userId, estimatedCost));
        res.status(200).json({ status: 'success', data: { plan, quota } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to generate execution plan';
        res.status(400).json({ status: 'error', message });
    }
});
// --- GATE 12: EXECUTION RUNS & VERSIONING ENDPOINTS ---
const RecordRunSchema = z.object({
    status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'STOPPED']),
    mode: z.enum(['RUN', 'RUN_FROM_HERE', 'RETRY']).optional(),
    totalNodes: z.number().int().optional(),
    completedNodes: z.number().int().optional(),
    failedNodes: z.number().int().optional(),
    totalTokens: z.number().int().optional(),
    totalCostCredits: z.number().optional(),
    durationMs: z.number().int().optional(),
    summary: z.record(z.unknown()).optional()
});
workflowsRouter.post('/:id/runs', (_req: AuthenticatedRequest, res: Response) => {
    res.status(403).json({ status: 'error', message: 'Execuções e custos são registados exclusivamente pelo servidor.' });
});

workflowsRouter.get('/:id/runs', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const runs = (await workflowRepository.listWorkflowRuns(userId, workflowId, limit));
        res.status(200).json({ status: 'success', data: { runs } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to list workflow runs';
        res.status(400).json({ status: 'error', message });
    }
});
workflowsRouter.get('/:id/runs/:runId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const runId = req.params.runId;
        const run = (await workflowRepository.getWorkflowRun(userId, workflowId, runId));
        if (!run) {
            return res.status(404).json({ status: 'error', message: 'Workflow run not found' });
        }
        res.status(200).json({ status: 'success', data: { run } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to get workflow run';
        res.status(400).json({ status: 'error', message });
    }
});
const CreateVersionSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
});
workflowsRouter.post('/:id/versions', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const { name, description } = CreateVersionSchema.parse(req.body);
        const version = (await workflowRepository.createWorkflowVersion(userId, workflowId, name, description));
        res.status(201).json({ status: 'success', data: { version } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to create workflow version';
        res.status(400).json({ status: 'error', message });
    }
});
workflowsRouter.get('/:id/versions', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const versions = (await workflowRepository.listWorkflowVersions(userId, workflowId));
        res.status(200).json({ status: 'success', data: { versions } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to list workflow versions';
        res.status(400).json({ status: 'error', message });
    }
});
workflowsRouter.post('/:id/versions/:versionId/rollback', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const workflowId = req.params.id;
        const versionId = req.params.versionId;
        const restored = (await workflowRepository.rollbackWorkflowToVersion(userId, workflowId, versionId));
        res.status(200).json({ status: 'success', data: { workflow: restored } });
    }
    catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to rollback workflow version';
        res.status(400).json({ status: 'error', message });
    }
});
