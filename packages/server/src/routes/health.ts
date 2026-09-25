import { Router, Request, Response } from 'express';
import { getActiveDatabaseProvider, isSupabaseConfigured, testSupabaseConnection } from '../db/supabase-client.js';

export const healthRouter = Router();

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
  const check = await testSupabaseConnection();
  res.status(200).json({
    success: true,
    data: check
  });
});

