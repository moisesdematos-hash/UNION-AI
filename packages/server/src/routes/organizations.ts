import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { organizationsService } from '../services/organizations-service.js';
import { OrgRoleEnum } from '@union/shared';

export const organizationsRouter = Router();

organizationsRouter.use(requireAuth);

const CreateOrgSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional()
});

const AddMemberSchema = z.object({
  userId: z.string().min(1),
  role: OrgRoleEnum.default('EDITOR')
});

organizationsRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const ownerId = req.user!.id;
    const data = CreateOrgSchema.parse(req.body);
    const organization = organizationsService.createOrganization({
      name: data.name,
      slug: data.slug,
      ownerId
    });

    res.status(201).json({
      status: 'success',
      data: { organization }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create organization';
    res.status(400).json({ status: 'error', message });
  }
});

organizationsRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const organizations = organizationsService.listUserOrganizations(userId);

    res.status(200).json({
      status: 'success',
      data: { organizations }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list organizations';
    res.status(400).json({ status: 'error', message });
  }
});

organizationsRouter.get('/:orgId/members', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const orgId = req.params.orgId;
    const members = organizationsService.listMembers(requesterId, orgId);

    res.status(200).json({
      status: 'success',
      data: { members }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list organization members';
    const status = message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ status: 'error', message });
  }
});

organizationsRouter.post('/:orgId/members', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const orgId = req.params.orgId;
    const { userId, role } = AddMemberSchema.parse(req.body);

    const member = organizationsService.addMember(requesterId, orgId, userId, role);

    res.status(201).json({
      status: 'success',
      data: { member }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add member';
    const status = message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ status: 'error', message });
  }
});

organizationsRouter.delete('/:orgId/members/:userId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const requesterId = req.user!.id;
    const { orgId, userId } = req.params;

    organizationsService.removeMember(requesterId, orgId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove member';
    const status = message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ status: 'error', message });
  }
});
