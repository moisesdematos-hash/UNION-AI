import { z } from 'zod';

export const DataTypeEnum = z.enum([
  'TEXT',
  'URL',
  'VIDEO',
  'IMAGE',
  'AUDIO',
  'DOCUMENT',
  'JSON',
  'TABLE',
  'TRANSCRIPT',
  'METADATA',
  'AI_RESPONSE'
]);

export type DataType = z.infer<typeof DataTypeEnum>;

export const DataPacketMetadataSchema = z.object({
  sizeBytes: z.number().nonnegative(),
  timestamp: z.number(),
  tokens: z.number().nonnegative().optional(),
  processingTimeMs: z.number().nonnegative().optional(),
  creditsCost: z.number().nonnegative().optional(),
  originNodeId: z.string().optional(),
  originPortId: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional()
});

export type DataPacketMetadata = z.infer<typeof DataPacketMetadataSchema>;

export const DataPacketSchema = z.object({
  id: z.string(),
  type: DataTypeEnum,
  payload: z.unknown(),
  metadata: DataPacketMetadataSchema
});

export type DataPacket = z.infer<typeof DataPacketSchema>;
