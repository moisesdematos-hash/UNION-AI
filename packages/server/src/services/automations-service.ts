import { randomUUID } from 'crypto';
import { getDatabase } from '../db/database.js';
import { 
  TriggerType, 
  WorkflowTrigger,
  WorkflowExecutionSummary,
  ExecutionPlan,
  WorkflowEngine,
  ExecutionEngine
} from '@union/shared';
import { workflowRepository } from '../services/workflow-repository.js';
import { creditsService } from '../services/credits-service.js';

export interface CreateTriggerParams {
  workflowId: string;
  userId: string;
  type: TriggerType;
  secretToken?: string;
  config?: Record<string, unknown>;
}

export class AutomationsService {
  private db = getDatabase();

  createTrigger(params: CreateTriggerParams): WorkflowTrigger {
    const { workflowId, userId, type, secretToken, config = {} } = params;

    // Verify ownership
    const workflow = workflowRepository.getWorkflow(workflowId, userId);
    if (!workflow) {
      throw new Error('Workflow not found or unauthorized');
    }

    const id = randomUUID();
    const token = secretToken || (type === 'WEBHOOK' ? `whk_${randomUUID().replace(/-/g, '')}` : null);
    const now = Date.now();

    this.db.prepare(`
      INSERT INTO workflow_triggers (id, workflow_id, user_id, type, secret_token, config_json, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, workflowId, userId, type, token, JSON.stringify(config), now, now);

    return {
      id,
      workflowId,
      type,
      webhookConfig: type === 'WEBHOOK' && token ? { secretToken: token, enabled: true, allowedOrigins: ['*'], expectedMethod: 'POST' } : undefined,
      scheduleConfig: type === 'SCHEDULE' ? { cronExpression: (config.cronExpression as string) || '0 9 * * *', timezone: 'America/Sao_Paulo', enabled: true } : undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
  }

  listTriggers(workflowId: string, userId: string): WorkflowTrigger[] {
    const workflow = workflowRepository.getWorkflow(workflowId, userId);
    if (!workflow) throw new Error('Workflow not found or unauthorized');

    const rows = this.db.prepare(`
      SELECT id, workflow_id, type, secret_token, config_json, is_active, last_triggered_at, created_at, updated_at
      FROM workflow_triggers
      WHERE workflow_id = ? AND user_id = ?
      ORDER BY created_at DESC
    `).all(workflowId, userId) as Array<{
      id: string;
      workflow_id: string;
      type: string;
      secret_token: string | null;
      config_json: string;
      is_active: number;
      last_triggered_at: number | null;
      created_at: number;
      updated_at: number;
    }>;

    return rows.map((r) => {
      const config = JSON.parse(r.config_json);
      return {
        id: r.id,
        workflowId: r.workflow_id,
        type: r.type as TriggerType,
        webhookConfig: r.type === 'WEBHOOK' && r.secret_token ? { secretToken: r.secret_token, enabled: !!r.is_active, allowedOrigins: ['*'], expectedMethod: 'POST' } : undefined,
        scheduleConfig: r.type === 'SCHEDULE' ? { cronExpression: config.cronExpression || '0 9 * * *', timezone: 'America/Sao_Paulo', enabled: !!r.is_active } : undefined,
        isActive: !!r.is_active,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      };
    });
  }

  async executeWebhookTrigger(workflowId: string, token: string, incomingPayload: Record<string, unknown>): Promise<{ runId: string; summary: WorkflowExecutionSummary }> {
    // 1. Find trigger by workflowId and token
    const triggerRow = this.db.prepare(`
      SELECT t.id, t.workflow_id, t.user_id, t.is_active
      FROM workflow_triggers t
      WHERE t.workflow_id = ? AND t.secret_token = ? AND t.type = 'WEBHOOK'
    `).get(workflowId, token) as { id: string; workflow_id: string; user_id: string; is_active: number } | undefined;

    if (!triggerRow || !triggerRow.is_active) {
      throw new Error('Invalid or disabled webhook token');
    }

    const userId = triggerRow.user_id;

    // 2. Check credits quota
    const quota = creditsService.checkQuota(userId, 0.05);
    if (!quota.allowed) {
      throw new Error(`Insufficient credits to execute webhook workflow: balance ${quota.balance}, shortfall ${quota.shortfall}`);
    }

    // 3. Load workflow
    const workflow = workflowRepository.getWorkflow(workflowId, userId);
    if (!workflow) {
      throw new Error('Associated workflow not found');
    }

    // 4. Validate and build execution plan
    const validation = WorkflowEngine.validate(workflow);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    const plan: ExecutionPlan = WorkflowEngine.generateExecutionPlan(workflow, 'RUN');

    // 5. Inject webhook payload into any trigger or input source node config
    const executionWorkflow = JSON.parse(JSON.stringify(workflow));
    for (const node of executionWorkflow.nodes) {
      if (node.type === 'trigger-webhook' || node.category === 'SOURCE' || node.category === 'INPUT') {
        node.config = {
          ...node.config,
          webhookPayload: incomingPayload,
          text: JSON.stringify(incomingPayload)
        };
      }
    }

    // 6. Execute workflow
    const summary = await ExecutionEngine.execute({
      workflow: executionWorkflow,
      plan
    });

    // 7. Update last_triggered_at
    this.db.prepare(`
      UPDATE workflow_triggers SET last_triggered_at = ?, updated_at = ? WHERE id = ?
    `).run(Date.now(), Date.now(), triggerRow.id);

    // 8. Record workflow run in repository & deduct credits
    const runStatus = (summary.status === 'IDLE' ? 'COMPLETED' : summary.status) as 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';
    const run = workflowRepository.recordWorkflowRun(userId, workflowId, {
      status: runStatus,
      mode: 'RUN',
      totalNodes: summary.totalNodes,
      completedNodes: summary.completedNodes,
      failedNodes: summary.failedNodes,
      totalTokens: summary.totalTokens,
      totalCostCredits: summary.totalCostCredits,
      durationMs: summary.durationMs,
      summary: summary as unknown as Record<string, unknown>
    });

    if (summary.totalCostCredits > 0) {
      creditsService.deductCredits(userId, summary.totalCostCredits, {
        workflowId,
        runId: run.id,
        description: `Webhook Autonomous Execution for workflow: ${workflow.name}`
      });
    }

    return {
      runId: run.id,
      summary
    };
  }
}

export const automationsService = new AutomationsService();
