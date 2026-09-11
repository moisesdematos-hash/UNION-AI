import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'UNION.AI Core Server',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    features: {
      dataBus: 'ACTIVE',
      workflowEngine: 'READY',
      multiModelRouter: 'STANDBY'
    }
  });
});
