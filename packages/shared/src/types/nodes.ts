import { z } from 'zod';
import { PortDefinitionSchema } from './ports.js';

export const NodeCategoryEnum = z.enum([
  'INPUT',
  'SOURCE',
  'EXTRACTOR',
  'UNDERSTAND',
  'AI',
  'TRANSFORM',
  'OUTPUT'
]);

export type NodeCategory = z.infer<typeof NodeCategoryEnum>;

export const NodeStateEnum = z.enum([
  'IDLE',
  'QUEUED',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
]);

export type NodeState = z.infer<typeof NodeStateEnum>;

export const ExecutionInfoSchema = z.object({
  durationMs: z.number().nonnegative().optional(),
  tokens: z.number().nonnegative().optional(),
  credits: z.number().nonnegative().optional(),
  error: z.string().optional(),
  lastExecutedAt: z.number().optional(),
  provider: z.string().optional(),
  model: z.string().optional()
});

export type ExecutionInfo = z.infer<typeof ExecutionInfoSchema>;

export const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export type NodePosition = z.infer<typeof NodePositionSchema>;

export const NodeDefinitionSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  category: NodeCategoryEnum,
  position: NodePositionSchema,
  inputs: z.array(PortDefinitionSchema).default([]),
  outputs: z.array(PortDefinitionSchema).default([]),
  config: z.record(z.unknown()).default({}),
  state: NodeStateEnum.default('IDLE'),
  executionInfo: ExecutionInfoSchema.optional()
});

export type NodeDefinition = z.infer<typeof NodeDefinitionSchema>;
