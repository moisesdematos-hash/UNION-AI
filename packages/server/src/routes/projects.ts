import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { workflowRepository } from '../services/workflow-repository.js';
import { userStorageService } from '../services/user-storage-service.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

const SaveFileSchema = z.object({
  category: z.enum(['projects', 'ebooks', 'assets']),
  fileName: z.string().min(1),
  content: z.union([z.string(), z.record(z.unknown())]),
  extension: z.enum(['json', 'md', 'html']).optional()
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

    // Also initialize user directory on disk
    userStorageService.getUserDir(userId);

    res.status(201).json({ status: 'success', data: { project } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    res.status(400).json({ status: 'error', message });
  }
});

/**
 * GET /api/projects/storage/overview
 * Returns metadata and list of all files in user's dedicated disk directory
 */
projectsRouter.get('/storage/overview', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const overview = userStorageService.listUserFiles(userId);
    res.status(200).json({ status: 'success', data: overview });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get user storage overview';
    res.status(500).json({ status: 'error', message });
  }
});

/**
 * POST /api/projects/storage/save
 * Explicitly save an asset, ebook, or project json snapshot to user's folder
 */
projectsRouter.post('/storage/save', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { category, fileName, content, extension } = SaveFileSchema.parse(req.body);

    let result;
    if (category === 'ebooks') {
      const ext = extension || (fileName.endsWith('.md') ? 'md' : 'json');
      const textContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      result = userStorageService.saveEbookFile(userId, fileName, textContent, ext);
    } else {
      result = userStorageService.saveProjectFile(userId, fileName, content);
    }

    res.status(201).json({ status: 'success', data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save file to user folder';
    res.status(400).json({ status: 'error', message });
  }
});

/**
 * GET /api/projects/storage/file/:category/:fileName
 * Retrieve a specific file content from user's directory
 */
projectsRouter.get('/storage/file/:category/:fileName', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const category = req.params.category as 'projects' | 'ebooks' | 'assets';
    const fileName = req.params.fileName;

    if (!['projects', 'ebooks', 'assets'].includes(category)) {
      return res.status(400).json({ status: 'error', message: 'Invalid category' });
    }

    const fileData = userStorageService.getFileContent(userId, category, fileName);
    if (!fileData) {
      return res.status(404).json({ status: 'error', message: 'File not found' });
    }

    res.status(200).json({ status: 'success', data: fileData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve file';
    res.status(500).json({ status: 'error', message });
  }
});

/**
 * DELETE /api/projects/storage/file/:category/:fileName
 * Deletes a file from user's directory
 */
projectsRouter.delete('/storage/file/:category/:fileName', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const category = req.params.category as 'projects' | 'ebooks' | 'assets';
    const fileName = req.params.fileName;

    if (!['projects', 'ebooks', 'assets'].includes(category)) {
      return res.status(400).json({ status: 'error', message: 'Invalid category' });
    }

    const deleted = userStorageService.deleteFile(userId, category, fileName);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'File not found' });
    }

    res.status(200).json({ status: 'success', message: 'File deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete file';
    res.status(500).json({ status: 'error', message });
  }
});
