import { randomUUID } from 'crypto';
import { getOperationalDatabase } from '../db/operational-database.js';
import { Organization, OrgMember, OrgRole, hasPermission, OrgRoleEnum } from '@union/shared';
export interface CreateOrgParams {
    name: string;
    slug?: string;
    ownerId: string;
}
export class OrganizationsService {
    private db = getOperationalDatabase();
    async createOrganization(params: CreateOrgParams): Promise<Organization> {
        const { name, ownerId } = params;
        const cleanName = name.trim();
        const slug = params.slug || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + randomUUID().slice(0, 6);
        const id = randomUUID();
        const now = Date.now();
        const runCreation = this.db.transaction(async () => {
            (await this.db.prepare(`
        INSERT INTO organizations (id, name, slug, owner_id, credits_balance, created_at, updated_at)
        VALUES (?, ?, ?, ?, 100.0, ?, ?)
      `).run(id, cleanName, slug, ownerId, now, now));
            // Add owner as member with OWNER role
            const memberId = randomUUID();
            (await this.db.prepare(`
        INSERT INTO org_members (id, org_id, user_id, role, created_at, updated_at)
        VALUES (?, ?, ?, 'OWNER', ?, ?)
      `).run(memberId, id, ownerId, now, now));
            return {
                id,
                name: cleanName,
                slug,
                ownerId,
                creditsBalance: 100.0,
                createdAt: now,
                updatedAt: now
            };
        });
        return (await runCreation());
    }
    async listUserOrganizations(userId: string): Promise<Array<Organization & {
        userRole: OrgRole;
    }>> {
        const rows = (await this.db.prepare(`
      SELECT o.id, o.name, o.slug, o.owner_id, o.credits_balance, o.created_at, o.updated_at, m.role as user_role
      FROM organizations o
      JOIN org_members m ON o.id = m.org_id
      WHERE m.user_id = ?
      ORDER BY o.created_at DESC
    `).all(userId)) as Array<{
            id: string;
            name: string;
            slug: string;
            owner_id: string;
            credits_balance: number;
            created_at: number;
            updated_at: number;
            user_role: string;
        }>;
        return rows.map(r => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            ownerId: r.owner_id,
            creditsBalance: r.credits_balance,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            userRole: r.user_role as OrgRole
        }));
    }
    async getMemberRole(userId: string, orgId: string): Promise<OrgRole | null> {
        const row = (await this.db.prepare(`
      SELECT role FROM org_members WHERE org_id = ? AND user_id = ?
    `).get(orgId, userId)) as {
            role: string;
        } | undefined;
        return row ? (row.role as OrgRole) : null;
    }
    async checkAccess(userId: string, orgId: string, requiredRole: OrgRole): Promise<boolean> {
        const role = (await this.getMemberRole(userId, orgId));
        if (!role)
            return false;
        return hasPermission(role, requiredRole);
    }
    async addMember(requesterId: string, orgId: string, targetUserId: string, role: OrgRole): Promise<OrgMember> {
        // Requester must be at least ADMIN to add members
        if (!(await this.checkAccess(requesterId, orgId, 'ADMIN'))) {
            throw new Error('Unauthorized: Only OWNER or ADMIN can invite members');
        }
        // Only OWNER can assign OWNER role
        if (role === 'OWNER' && !(await this.checkAccess(requesterId, orgId, 'OWNER'))) {
            throw new Error('Unauthorized: Only OWNER can transfer or assign OWNER role');
        }
        // Get user details
        const user = (await this.db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(targetUserId)) as {
            id: string;
            email: string;
            name: string;
        } | undefined;
        if (!user) {
            throw new Error('Target user not found');
        }
        const memberId = randomUUID();
        const now = Date.now();
        (await this.db.prepare(`
      INSERT INTO org_members (id, org_id, user_id, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(org_id, user_id) DO UPDATE SET role = excluded.role, updated_at = excluded.updated_at
    `).run(memberId, orgId, targetUserId, role, now, now));
        return {
            id: memberId,
            orgId,
            userId: targetUserId,
            role,
            userEmail: user.email,
            userName: user.name,
            joinedAt: now
        };
    }
    async listMembers(requesterId: string, orgId: string): Promise<OrgMember[]> {
        if (!(await this.checkAccess(requesterId, orgId, 'VIEWER'))) {
            throw new Error('Unauthorized: User is not a member of this organization');
        }
        const rows = (await this.db.prepare(`
      SELECT m.id, m.org_id, m.user_id, m.role, u.email as user_email, u.name as user_name, m.created_at as joined_at
      FROM org_members m
      JOIN users u ON m.user_id = u.id
      WHERE m.org_id = ?
      ORDER BY m.created_at ASC
    `).all(orgId)) as Array<{
            id: string;
            org_id: string;
            user_id: string;
            role: string;
            user_email: string;
            user_name: string;
            joined_at: number;
        }>;
        return rows.map(r => ({
            id: r.id,
            orgId: r.org_id,
            userId: r.user_id,
            role: r.role as OrgRole,
            userEmail: r.user_email,
            userName: r.user_name,
            joinedAt: r.joined_at
        }));
    }
    async removeMember(requesterId: string, orgId: string, targetUserId: string): Promise<void> {
        if (!(await this.checkAccess(requesterId, orgId, 'ADMIN'))) {
            throw new Error('Unauthorized: Only OWNER or ADMIN can remove members');
        }
        const targetRole = (await this.getMemberRole(targetUserId, orgId));
        if (!targetRole) {
            throw new Error('Member not found in organization');
        }
        if (targetRole === 'OWNER') {
            throw new Error('Cannot remove organization OWNER');
        }
        (await this.db.prepare('DELETE FROM org_members WHERE org_id = ? AND user_id = ?').run(orgId, targetUserId));
    }
}
export const organizationsService = new OrganizationsService();
