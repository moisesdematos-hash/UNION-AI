import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { auditService } from '../services/audit-service.js';
import { metricsCollector } from '../services/metrics-collector.js';
import { AuditActionEnum, AuditAction } from '@union/shared';
import { z } from 'zod';

export const observabilityRouter = Router();

const PostAuditSchema = z.object({
  action: AuditActionEnum,
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  details: z.record(z.unknown()).optional()
});

/**
 * GET /api/observability/metrics
 * Prometheus exposition format
 */
observabilityRouter.get('/metrics', (_req, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metricsCollector.getPrometheusFormat());
});

/**
 * GET /api/observability/telemetry
 * Structured JSON metrics snapshot
 */
observabilityRouter.get('/telemetry', (_req, res: Response) => {
  const snapshot = metricsCollector.getSnapshot();
  res.json({
    success: true,
    data: snapshot
  });
});

/**
 * GET /api/observability/audit
 * Query audit trail
 */
observabilityRouter.get('/audit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const actorId = typeof req.query.actorId === 'string' ? req.query.actorId : undefined;
    const action = typeof req.query.action === 'string' ? (req.query.action as AuditAction) : undefined;
    const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : undefined;
    const entityId = typeof req.query.entityId === 'string' ? req.query.entityId : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = auditService.queryLogs({
      actorId,
      action,
      entityType,
      entityId,
      limit: isNaN(limit) ? 50 : limit,
      offset: isNaN(offset) ? 0 : offset
    });

    res.json({
      success: true,
      data: result.logs,
      total: result.total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query audit logs'
    });
  }
});

/**
 * POST /api/observability/audit
 * Record an audit log entry
 */
observabilityRouter.post('/audit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = PostAuditSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid audit payload: ' + parsed.error.issues.map(i => i.message).join(', ')
      });
    }

    const ipAddress = req.ip || req.socket?.remoteAddress || undefined;

    const log = auditService.recordEvent({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: parsed.data.action,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      details: parsed.data.details,
      ipAddress
    });

    res.status(201).json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record audit log'
    });
  }
});
