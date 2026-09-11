import { z } from 'zod';
import { DataTypeEnum } from './data-types.js';

export const PortDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: DataTypeEnum,
  isMulti: z.boolean().default(false),
  required: z.boolean().default(true),
  description: z.string().optional()
});

export type PortDefinition = z.infer<typeof PortDefinitionSchema>;
