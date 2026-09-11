import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { workflowsRouter } from './routes/workflows.js';
import { extractorsRouter } from './routes/extractors.js';
import { aiRouter } from './routes/ai.js';
import { aiRouterRouter } from './routes/ai-router.js';
import { creditsRouter } from './routes/credits.js';
import { marketingRouter } from './routes/marketing.js';
import { webhooksRouter } from './routes/webhooks.js';
import { organizationsRouter } from './routes/organizations.js';
import { observabilityRouter } from './routes/observability.js';
import { templatesRouter } from './routes/templates.js';
import { chatRouter } from './routes/chat.js';
import { metricsCollector } from './services/metrics-collector.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Prometheus Metrics Scrape Endpoint
  app.get('/metrics', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsCollector.getPrometheusFormat());
  });

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/credits', creditsRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/observability', observabilityRouter);
  app.use('/api/templates', templatesRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/workflows', workflowsRouter);
  app.use('/api/extractors', extractorsRouter);
  app.use('/api/ai/router', aiRouterRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/marketing', marketingRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/webhooks', webhooksRouter);

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[UNION.AI Server Error]:', err);
    res.status(500).json({
      status: 'error',
      message: err.message || 'Internal Server Error'
    });
  });

  return app;
}
