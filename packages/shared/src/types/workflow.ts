import { z } from 'zod';
import { NodeDefinitionSchema } from './nodes.js';
import { ConnectionDefinitionSchema } from './connections.js';
import { DataPacketSchema } from './data-types.js';

export const ViewportSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  zoom: z.number().default(1)
});

export type Viewport = z.infer<typeof ViewportSchema>;

export const WorkflowGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().default('#6366f1'),
  nodeIds: z.array(z.string()).default([]),
  isCollapsed: z.boolean().default(false)
});

export type WorkflowGroup = z.infer<typeof WorkflowGroupSchema>;

export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(NodeDefinitionSchema).default([]),
  connections: z.array(ConnectionDefinitionSchema).default([]),
  groups: z.array(WorkflowGroupSchema).optional().default([]),
  viewport: ViewportSchema.default({ x: 0, y: 0, zoom: 1 }),
  version: z.number().int().positive().default(1),
  createdAt: z.number(),
  updatedAt: z.number()
});

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: z.infer<typeof NodeDefinitionSchema>[];
  connections: z.infer<typeof ConnectionDefinitionSchema>[];
  groups?: WorkflowGroup[];
  viewport: Viewport;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export const ExecutionEventTypeEnum = z.enum([
  'WORKFLOW_QUEUED',
  'WORKFLOW_STARTED',
  'NODE_QUEUED',
  'NODE_STARTED',
  'NODE_PROGRESS',
  'NODE_COMPLETED',
  'NODE_FAILED',
  'DATA_TRANSFERRED',
  'WORKFLOW_COMPLETED',
  'WORKFLOW_STOPPED',
  'WORKFLOW_FAILED'
]);

export type ExecutionEventType = z.infer<typeof ExecutionEventTypeEnum>;

export const ExecutionEventSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  type: ExecutionEventTypeEnum,
  timestamp: z.number(),
  nodeId: z.string().optional(),
  connectionId: z.string().optional(),
  packet: DataPacketSchema.optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
  metrics: z.object({
    tokens: z.number().optional(),
    credits: z.number().optional(),
    durationMs: z.number().optional()
  }).optional()
});

export type ExecutionEvent = z.infer<typeof ExecutionEventSchema>;

export const ValidationErrorCodeEnum = z.enum([
  'CYCLE_DETECTED',
  'MISSING_REQUIRED_INPUT',
  'MISSING_REQUIRED_CONFIG',
  'INCOMPATIBLE_CONNECTION_TYPE',
  'DANGLING_NODE',
  'EMPTY_WORKFLOW'
]);

export type ValidationErrorCode = z.infer<typeof ValidationErrorCodeEnum>;

export const ValidationErrorSchema = z.object({
  nodeId: z.string().optional(),
  connectionId: z.string().optional(),
  portId: z.string().optional(),
  message: z.string(),
  code: ValidationErrorCodeEnum
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const ValidationWarningSchema = z.object({
  nodeId: z.string().optional(),
  connectionId: z.string().optional(),
  message: z.string(),
  code: z.string()
});

export type ValidationWarning = z.infer<typeof ValidationWarningSchema>;

export const WorkflowValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationWarningSchema)
});

export type WorkflowValidationResult = z.infer<typeof WorkflowValidationResultSchema>;

export const ExecutionModeEnum = z.enum(['RUN', 'RUN_FROM_HERE', 'RETRY']);

export type ExecutionMode = z.infer<typeof ExecutionModeEnum>;

export const ExecutionPlanSchema = z.object({
  workflowId: z.string(),
  mode: ExecutionModeEnum,
  targetNodeId: z.string().optional(),
  totalNodes: z.number().nonnegative(),
  levels: z.array(z.array(z.string())),
  executionOrder: z.array(z.string()),
  dependencies: z.record(z.array(z.string())),
  dependents: z.record(z.array(z.string()))
});

export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

export const WorkflowRunStatusEnum = z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'STOPPED']);
export type WorkflowRunStatus = z.infer<typeof WorkflowRunStatusEnum>;

export const WorkflowRunSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  userId: z.string(),
  status: WorkflowRunStatusEnum,
  mode: ExecutionModeEnum.default('RUN'),
  totalNodes: z.number().int().nonnegative().default(0),
  completedNodes: z.number().int().nonnegative().default(0),
  failedNodes: z.number().int().nonnegative().default(0),
  totalTokens: z.number().int().nonnegative().default(0),
  totalCostCredits: z.number().nonnegative().default(0),
  durationMs: z.number().int().nonnegative().default(0),
  summary: z.record(z.unknown()).default({}),
  createdAt: z.number(),
  completedAt: z.number().nullable().optional()
});

export type WorkflowRun = z.infer<typeof WorkflowRunSchema>;

export const WorkflowVersionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  versionNumber: z.number().int().positive(),
  name: z.string(),
  description: z.string().optional(),
  snapshot: WorkflowDefinitionSchema,
  createdAt: z.number()
});

export type WorkflowVersion = z.infer<typeof WorkflowVersionSchema>;
