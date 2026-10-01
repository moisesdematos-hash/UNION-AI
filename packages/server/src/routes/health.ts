import { checkDatabaseReadiness } from '../db/readiness.js';
import { Router, Request, Response } from 'express';
import { getOperationalDatabase } from '../db/operational-database.js';
import { getActiveDatabaseProvider, isSupabaseConfigured, testSupabaseConnection } from '../db/supabase-client.js';
export const healthRouter = Router();
/**
 * GET /api/health/live
 * Kubernetes/Docker liveness probe: indicates whether the process is alive.
 */
healthRouter.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime())
    });
});
/**
 * GET /api/health/ready
 * Kubernetes/Docker readiness probe: verifies database connectivity. Returns 503 if DB is down.
 */
healthRouter.get('/health/ready', async (_req: Request, res: Response) => {
    const check = await checkDatabaseReadiness();
    return res.status(check.connected ? 200 : 503).json({ status: check.connected ? 'ready' : 'not_ready', database: check.connected ? 'connected' : 'disconnected', activeProvider: check.provider });
});
healthRouter.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        service: 'UNION.AI Core Server',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
            activeProvider: getActiveDatabaseProvider(),
            supabaseConfigured: isSupabaseConfigured()
        },
        features: {
            dataBus: 'ACTIVE',
            workflowEngine: 'READY',
            multiModelRouter: 'STANDBY'
        }
    });
});
healthRouter.get('/health/db', async (_req: Request, res: Response) => {
    const check = await checkDatabaseReadiness();
    res.status(check.connected ? 200 : 503).json({ success: check.connected, data: check });
});
