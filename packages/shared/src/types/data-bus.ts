import { z } from 'zod';
import { DataTypeEnum, DataPacketSchema } from './data-types.js';

export const ConnectionInspectionSchema = z.object({
  connectionId: z.string(),
  sourceNodeId: z.string(),
  sourcePortId: z.string(),
  targetNodeId: z.string(),
  targetPortId: z.string(),
  inputSummary: z.object({
    type: DataTypeEnum,
    sizeBytes: z.number().nonnegative(),
    origin: z.string(),
    timestamp: z.number()
  }),
  outputSummary: z.object({
    dataPreview: z.unknown(),
    quantity: z.number().nonnegative().optional(),
    status: z.string(),
    processingTimeMs: z.number().nonnegative().optional(),
    tokens: z.number().nonnegative().optional(),
    credits: z.number().nonnegative().optional()
  }),
  fullPacket: DataPacketSchema.optional()
});

export type ConnectionInspection = z.infer<typeof ConnectionInspectionSchema>;
