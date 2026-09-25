import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { workflowsRouter } from './routes/workflows.js';
import { extractorsRouter } from './routes/extractors.js';
import { aiRouter } from './routes/ai.js';
import { aiRouterRouter } from './routes/ai-router.js';
import { creditsRouter } from './routes/credits.js';
import { marketingRouter, publishedPagesStore } from './routes/marketing.js';
import { webhooksRouter } from './routes/webhooks.js';
import { organizationsRouter } from './routes/organizations.js';
import { observabilityRouter } from './routes/observability.js';
import { templatesRouter } from './routes/templates.js';
import { chatRouter } from './routes/chat.js';
import { paymentsRouter } from './routes/payments.js';
import { metricsCollector } from './services/metrics-collector.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // API Rate Limiting (Relaxed in test environment)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'test' ? 10000 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 'error',
      message: 'Too many requests from this IP, please try again after 15 minutes'
    }
  });
  app.use('/api', apiLimiter);

  // Prometheus Metrics Scrape Endpoint
  app.get('/metrics', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metricsCollector.getPrometheusFormat());
  });

  // Public Sales Page Live Render Endpoint (/p/:slug)
  app.get('/p/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const page = publishedPagesStore.get(slug);
    if (!page) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"><title>Página Não Encontrada | UNION.AI</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-black text-white min-h-screen flex items-center justify-center p-6 text-center">
  <div class="space-y-4 max-w-md">
    <div class="text-4xl">⚠️</div>
    <h1 class="text-2xl font-bold">Página de Vendas Não Encontrada</h1>
    <p class="text-zinc-400 text-sm">O link pode ter expirado ou o slug "${escapeHtml(slug)}" não existe.</p>
    <a href="/" class="inline-block px-4 py-2 rounded-lg bg-emerald-500 text-black font-bold text-sm">Voltar ao UNION.AI</a>
  </div>
</body>
</html>`);
    }

    publishedPagesStore.incrementViews(slug);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(page.html);
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
  app.use('/api/payments', paymentsRouter);

  // Static Frontend Serving for Client SPA
  const clientDistCandidates = [
    path.resolve(process.cwd(), 'packages/client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../../packages/client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../client/dist')
  ];

  const clientDistPath = clientDistCandidates.find(p => fs.existsSync(p));

  if (clientDistPath) {
    app.use(express.static(clientDistPath));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/metrics') || req.path.startsWith('/p/')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

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

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
