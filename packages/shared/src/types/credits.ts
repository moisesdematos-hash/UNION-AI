import { z } from 'zod';

export const CreditTransactionTypeEnum = z.enum([
  'TOPUP',
  'CONSUMPTION',
  'REFUND',
  'BONUS'
]);

export type CreditTransactionType = z.infer<typeof CreditTransactionTypeEnum>;

export const CreditTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  workflowId: z.string().optional().nullable(),
  runId: z.string().optional().nullable(),
  amount: z.number(), // positive for addition, negative for consumption
  type: CreditTransactionTypeEnum,
  description: z.string(),
  balanceAfter: z.number(),
  createdAt: z.number()
});

export type CreditTransaction = z.infer<typeof CreditTransactionSchema>;

export const UserCreditsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  balance: z.number().min(0),
  totalConsumed: z.number().min(0),
  updatedAt: z.number()
});

export type UserCredits = z.infer<typeof UserCreditsSchema>;

export const TopupRequestSchema = z.object({
  amount: z.number().positive(),
  packageId: z.string().optional(),
  description: z.string().optional()
});

export type TopupRequest = z.infer<typeof TopupRequestSchema>;
