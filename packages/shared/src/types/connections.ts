import { z } from 'zod';
import { DataPacketSchema } from './data-types.js';

export const ConnectionStateEnum = z.enum([
  'connected',
  'active',
  'processing',
  'waiting',
  'error'
]);

export type ConnectionState = z.infer<typeof ConnectionStateEnum>;

export const ConnectionDefinitionSchema = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  sourcePortId: z.string(),
  targetNodeId: z.string(),
  targetPortId: z.string(),
  state: ConnectionStateEnum.default('connected'),
  lastPacket: DataPacketSchema.optional(),
  errorMessage: z.string().optional()
});

export type ConnectionDefinition = z.infer<typeof ConnectionDefinitionSchema>;
