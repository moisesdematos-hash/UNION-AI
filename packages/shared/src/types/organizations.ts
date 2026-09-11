import { z } from 'zod';

export const OrgRoleEnum = z.enum([
  'OWNER',
  'ADMIN',
  'EDITOR',
  'VIEWER'
]);

export type OrgRole = z.infer<typeof OrgRoleEnum>;

export const ROLE_HIERARCHY: Record<OrgRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1
};

export function hasPermission(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  slug: z.string().min(2),
  ownerId: z.string(),
  creditsBalance: z.number().nonnegative().default(100.0),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrgMemberSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  userId: z.string(),
  role: OrgRoleEnum,
  userEmail: z.string().email(),
  userName: z.string(),
  joinedAt: z.number()
});

export type OrgMember = z.infer<typeof OrgMemberSchema>;

export const OrgInvitationSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.string().email(),
  role: OrgRoleEnum,
  token: z.string(),
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED']).default('PENDING'),
  expiresAt: z.number(),
  createdAt: z.number()
});

export type OrgInvitation = z.infer<typeof OrgInvitationSchema>;
