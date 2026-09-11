import { randomUUID } from 'crypto';
import { getDatabase } from '../db/database.js';
import { AuditLog, AuditAction, AuditLogSchema } from '@union/shared';

export interface RecordAuditParams {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface QueryAuditFilters {
  actorId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

interface AuditLogRow {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details_json: string;
  ip_address: string | null;
  created_at: number;
}

export class AuditService {
  private get db() {
    return getDatabase();
  }

  recordEvent(params: RecordAuditParams): AuditLog {
    const id = randomUUID();
    const now = Date.now();
    const details = params.details || {};
    const detailsJson = JSON.stringify(details);

    this.db.prepare(`
      INSERT INTO audit_logs (id, actor_id, actor_email, action, entity_type, entity_id, details_json, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.actorId,
      params.actorEmail,
      params.action,
      params.entityType,
      params.entityId,
      detailsJson,
      params.ipAddress || null,
      now
    );

    const log: AuditLog = {
      id,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details,
      ipAddress: params.ipAddress,
      createdAt: now
    };

    return AuditLogSchema.parse(log);
  }

  queryLogs(filters: QueryAuditFilters = {}): { logs: AuditLog[]; total: number } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.actorId) {
      conditions.push('actor_id = ?');
      params.push(filters.actorId);
    }

    if (filters.action) {
      conditions.push('action = ?');
      params.push(filters.action);
    }

    if (filters.entityType) {
      conditions.push('entity_type = ?');
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      conditions.push('entity_id = ?');
      params.push(filters.entityId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = this.db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs ${whereClause}
    `).get(...params) as { count: number };

    const limit = Math.min(Math.max(filters.limit || 50, 1), 200);
    const offset = Math.max(filters.offset || 0, 0);

    const rows = this.db.prepare(`
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as AuditLogRow[];

    const logs: AuditLog[] = rows.map(row => ({
      id: row.id,
      actorId: row.actor_id,
      actorEmail: row.actor_email,
      action: row.action as AuditAction,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: JSON.parse(row.details_json || '{}'),
      ipAddress: row.ip_address || undefined,
      createdAt: row.created_at
    }));

    return {
      logs,
      total: countRow.count
    };
  }
}

export const auditService = new AuditService();
