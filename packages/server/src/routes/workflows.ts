import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { workflowRepository } from '../services/workflow-repository.js';
import { creditsService } from '../services/credits-service.js';
import { 
  NodeDefinitionSchema, 
  ConnectionDefinitionSchema, 
  ViewportSchema,
  WorkflowEngine
} from '@union/shared';

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
  connections: z.array(ConnectionDefinitionSchema).default([])
});

workflowsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { projectId, name, description } = CreateWorkflowSchema.parse(req.body);
    const workflow = workflowRepository.createWorkflow(projectId, userId, name, description);
    res.status(201).json({ status: 'success', data: { workflow } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create workflow';
    res.status(400).json({ status: 'error', message });
  }
});

workflowsRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const workflowId = req.params.id;
  const workflow = workflowRepository.getWorkflow(workflowId, userId);

  if (!workflow) {
    return res.status(404).json({ status: 'error', message: 'Workflow not found' });
  }

  res.status(200).json({ status: 'success', data: { workflow } });
});

workflowsRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const data = SaveWorkflowStateSchema.parse(req.body);
    const updated = workflowRepository.saveWorkflowState(workflowId, userId, data);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }
    res.status(200).json({ status: 'success', data: { workflow: updated } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save workflow state';
    res.status(400).json({ status: 'error', message });
  }
});

workflowsRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const workflowId = req.params.id;
  const deleted = workflowRepository.deleteWorkflow(workflowId, userId);

  if (!deleted) {
    return res.status(404).json({ status: 'error', message: 'Workflow not found' });
  }

  res.status(200).json({ status: 'success', message: 'Workflow deleted' });
});

workflowsRouter.post('/:id/validate', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const workflow = workflowRepository.getWorkflow(workflowId, userId);

    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    const validation = WorkflowEngine.validate(workflow);
    res.status(200).json({ status: 'success', data: { validation } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to validate workflow';
    res.status(400).json({ status: 'error', message });
  }
});

const PlanRequestSchema = z.object({
  mode: z.enum(['RUN', 'RUN_FROM_HERE', 'RETRY']).default('RUN'),
  targetNodeId: z.string().optional()
});

workflowsRouter.post('/:id/plan', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const { mode, targetNodeId } = PlanRequestSchema.parse(req.body);
    const workflow = workflowRepository.getWorkflow(workflowId, userId);

    if (!workflow) {
      return res.status(404).json({ status: 'error', message: 'Workflow not found' });
    }

    const plan = WorkflowEngine.generateExecutionPlan(workflow, mode, targetNodeId);
    const estimatedCost = Math.round(plan.totalNodes * 0.05 * 100000) / 100000;
    const quota = creditsService.checkQuota(userId, estimatedCost);
    res.status(200).json({ status: 'success', data: { plan, quota } });
  } catch (err: unknown) {
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

workflowsRouter.post('/:id/runs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const data = RecordRunSchema.parse(req.body);
    const run = workflowRepository.recordWorkflowRun(userId, workflowId, data);

    let deduction = null;
    if (data.totalCostCredits && data.totalCostCredits > 0) {
      deduction = creditsService.deductCredits(userId, data.totalCostCredits, {
        workflowId,
        runId: run.id,
        description: `Execution Run (${data.mode || 'RUN'} - ${data.status}): ${data.totalTokens || 0} tokens`
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        run,
        creditsRemaining: deduction ? deduction.newBalance : undefined
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record workflow run';
    res.status(400).json({ status: 'error', message });
  }
});

workflowsRouter.get('/:id/runs', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const runs = workflowRepository.listWorkflowRuns(userId, workflowId, limit);
    res.status(200).json({ status: 'success', data: { runs } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list workflow runs';
    res.status(400).json({ status: 'error', message });
  }
});

workflowsRouter.get('/:id/runs/:runId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const runId = req.params.runId;
    const run = workflowRepository.getWorkflowRun(userId, workflowId, runId);
    if (!run) {
      return res.status(404).json({ status: 'error', message: 'Workflow run not found' });
    }
    res.status(200).json({ status: 'success', data: { run } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get workflow run';
    res.status(400).json({ status: 'error', message });
  }
});

const CreateVersionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

workflowsRouter.post('/:id/versions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const { name, description } = CreateVersionSchema.parse(req.body);
    const version = workflowRepository.createWorkflowVersion(userId, workflowId, name, description);
    res.status(201).json({ status: 'success', data: { version } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create workflow version';
    res.status(400).json({ status: 'error', message });
  }
});

workflowsRouter.get('/:id/versions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const versions = workflowRepository.listWorkflowVersions(userId, workflowId);
    res.status(200).json({ status: 'success', data: { versions } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list workflow versions';
    res.status(400).json({ status: 'error', message });
  }
});

workflowsRouter.post('/:id/versions/:versionId/rollback', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const versionId = req.params.versionId;
    const restored = workflowRepository.rollbackWorkflowToVersion(userId, workflowId, versionId);
    res.status(200).json({ status: 'success', data: { workflow: restored } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to rollback workflow version';
    res.status(400).json({ status: 'error', message });
  }
});

