import { z } from 'zod';

export const AuditActionEnum = z.enum([
  'AUTH_LOGIN',
  'AUTH_REGISTER',
  'ORG_CREATE',
  'MEMBER_ADD',
  'MEMBER_REMOVE',
  'WORKFLOW_CREATE',
  'WORKFLOW_UPDATE',
  'WORKFLOW_DELETE',
  'WORKFLOW_EXECUTE',
  'CREDIT_TOPUP',
  'CREDIT_DEDUCT',
  'WEBHOOK_TRIGGER'
]);

export type AuditAction = z.infer<typeof AuditActionEnum>;

export const AuditLogSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorEmail: z.string().email(),
  action: AuditActionEnum,
  entityType: z.string(),
  entityId: z.string(),
  details: z.record(z.unknown()).default({}),
  ipAddress: z.string().optional(),
  createdAt: z.number()
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const MetricsSnapshotSchema = z.object({
  uptimeSeconds: z.number().nonnegative(),
  workflowsExecutedTotal: z.number().nonnegative(),
  tokensConsumedTotal: z.number().nonnegative(),
  creditsDeductedTotal: z.number().nonnegative(),
  avgDurationMs: z.number().nonnegative(),
  activeNodesGauge: z.number().nonnegative(),
  errorRatePercent: z.number().min(0).max(100)
});

export type MetricsSnapshot = z.infer<typeof MetricsSnapshotSchema>;
