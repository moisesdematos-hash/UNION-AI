import { z } from 'zod';

export const TriggerTypeEnum = z.enum([
  'MANUAL',
  'WEBHOOK',
  'SCHEDULE',
  'EVENT'
]);

export type TriggerType = z.infer<typeof TriggerTypeEnum>;

export const WebhookTriggerConfigSchema = z.object({
  secretToken: z.string().min(8),
  enabled: z.boolean().default(true),
  allowedOrigins: z.array(z.string()).default(['*']),
  expectedMethod: z.enum(['POST', 'GET']).default('POST')
});

export type WebhookTriggerConfig = z.infer<typeof WebhookTriggerConfigSchema>;

export const ScheduleTriggerConfigSchema = z.object({
  cronExpression: z.string().min(5), // e.g., '0 9 * * *'
  timezone: z.string().default('America/Sao_Paulo'),
  enabled: z.boolean().default(true),
  lastTriggeredAt: z.number().optional(),
  nextScheduledAt: z.number().optional()
});

export type ScheduleTriggerConfig = z.infer<typeof ScheduleTriggerConfigSchema>;

export const WorkflowTriggerSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  type: TriggerTypeEnum,
  webhookConfig: WebhookTriggerConfigSchema.optional(),
  scheduleConfig: ScheduleTriggerConfigSchema.optional(),
  isActive: z.boolean().default(true),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type WorkflowTrigger = z.infer<typeof WorkflowTriggerSchema>;

// --- Loop & Iterator Constructs ---
export const LoopConfigSchema = z.object({
  maxIterations: z.number().int().positive().max(100).default(10),
  accumulateOutput: z.boolean().default(true),
  stopOnError: z.boolean().default(true),
  batchSize: z.number().int().positive().default(1)
});

export type LoopConfig = z.infer<typeof LoopConfigSchema>;

export const IteratorPayloadSchema = z.object({
  index: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currentItem: z.unknown(),
  isLast: z.boolean()
});

export type IteratorPayload = z.infer<typeof IteratorPayloadSchema>;

// --- Autonomous Agent / Sidecar Types ---
export const AgentStepLogSchema = z.object({
  stepNumber: z.number().int().positive(),
  thought: z.string(),
  action: z.string(),
  toolName: z.string().optional(),
  observation: z.string(),
  durationMs: z.number().nonnegative()
});

export type AgentStepLog = z.infer<typeof AgentStepLogSchema>;

export const AutonomousAgentConfigSchema = z.object({
  agentGoal: z.string().min(3),
  maxSteps: z.number().int().positive().max(15).default(5),
  availableTools: z.array(z.string()).default(['web-search', 'fact-check', 'summarize']),
  temperature: z.number().min(0).max(1).default(0.4),
  reflectionEnabled: z.boolean().default(true)
});

export type AutonomousAgentConfig = z.infer<typeof AutonomousAgentConfigSchema>;

export const AutonomousAgentResultSchema = z.object({
  goal: z.string(),
  finalAnswer: z.string(),
  totalSteps: z.number(),
  success: z.boolean(),
  steps: z.array(AgentStepLogSchema),
  tokensUsed: z.number(),
  creditsCost: z.number()
});

export type AutonomousAgentResult = z.infer<typeof AutonomousAgentResultSchema>;
