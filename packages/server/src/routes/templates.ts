import { Router, Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { templateService } from '../services/template-service.js';
import { z } from 'zod';

export const templatesRouter = Router();

const InstantiateSchema = z.object({
  projectId: z.string().min(1, 'projectId is required'),
  workflowName: z.string().optional()
});

/**
 * GET /api/templates
 * Lists available workflow templates (optional ?category= filter)
 */
templatesRouter.get('/', (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const templates = templateService.listTemplates(category);
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list templates'
    });
  }
});

/**
 * GET /api/templates/:id
 * Fetches a single workflow template by ID
 */
templatesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const template = templateService.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template with ID '${req.params.id}' not found`
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch template'
    });
  }
});

/**
 * POST /api/templates/:id/instantiate
 * Instantiates a template into a project for the authenticated user
 */
templatesRouter.post('/:id/instantiate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = InstantiateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: ' + parseResult.error.issues.map(i => i.message).join(', ')
      });
    }

    const { projectId, workflowName } = parseResult.data;
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const workflow = templateService.instantiateTemplate({
      templateId: req.params.id,
      projectId,
      userId,
      userEmail,
      workflowName
    });

    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to instantiate template';
    const status = message.includes('not found') ? 404 : 500;
    res.status(status).json({
      success: false,
      error: message
    });
  }
});
