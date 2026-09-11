import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { automationsService } from '../services/automations-service.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { TriggerTypeEnum } from '@union/shared';

export const webhooksRouter = Router();

const CreateTriggerSchema = z.object({
  type: TriggerTypeEnum,
  secretToken: z.string().optional(),
  config: z.record(z.unknown()).optional()
});

// Authenticated: Manage triggers for a workflow
webhooksRouter.post('/workflow/:id/triggers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const { type, secretToken, config } = CreateTriggerSchema.parse(req.body);

    const trigger = automationsService.createTrigger({
      workflowId,
      userId,
      type,
      secretToken,
      config
    });

    res.status(201).json({
      status: 'success',
      data: { trigger }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create trigger';
    console.error('DEBUG CREATE TRIGGER ERROR:', err);
    res.status(400).json({ status: 'error', message });
  }
});

webhooksRouter.get('/workflow/:id/triggers', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const workflowId = req.params.id;
    const triggers = automationsService.listTriggers(workflowId, userId);

    res.status(200).json({
      status: 'success',
      data: { triggers }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list triggers';
    res.status(400).json({ status: 'error', message });
  }
});

// Public Endpoint: External Webhook Invocation
// Protected via x-webhook-token header or ?token= query parameter
webhooksRouter.post('/v1/trigger/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const token = (req.headers['x-webhook-token'] as string) || (req.query.token as string);

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing webhook authentication token. Provide via header x-webhook-token or query param token.'
      });
    }

    const payload = req.body || {};
    const result = await automationsService.executeWebhookTrigger(workflowId, token, payload);

    res.status(200).json({
      status: 'success',
      message: 'Workflow triggered successfully via webhook',
      data: {
        runId: result.runId,
        summary: result.summary
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook execution failed';
    console.error('DEBUG WEBHOOK EXECUTION ERROR:', err);
    const status = message.includes('Insufficient credits') ? 402 : message.includes('token') ? 403 : 400;
    res.status(status).json({ status: 'error', message });
  }
});
