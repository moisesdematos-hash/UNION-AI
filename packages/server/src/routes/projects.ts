import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { workflowRepository } from '../services/workflow-repository.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

projectsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const projects = workflowRepository.listProjects(userId);
  res.status(200).json({ status: 'success', data: { projects } });
});

projectsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = CreateProjectSchema.parse(req.body);
    const project = workflowRepository.createProject(userId, data.name, data.description);
    res.status(201).json({ status: 'success', data: { project } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    res.status(400).json({ status: 'error', message });
  }
});
