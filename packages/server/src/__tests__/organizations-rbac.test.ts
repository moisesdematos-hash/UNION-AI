import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';

describe('Gate 16: Multi-Tenant Organizations & RBAC API', () => {
  const app = createApp();
  let ownerToken: string;
  let ownerId: string;
  let memberToken: string;
  let memberId: string;

  beforeEach(async () => {
    resetTestDatabase();

    const ownerRes = await authService.register('agency.owner@example.com', 'SecureP@ss123', 'Agency Owner');
    ownerToken = ownerRes.token;
    ownerId = ownerRes.user.id;

    const memberRes = await authService.register('copywriter@example.com', 'SecureP@ss123', 'Junior Copywriter');
    memberToken = memberRes.token;
    memberId = memberRes.user.id;
  });

  describe('Organization Lifecycle & Ownership', () => {
    it('creates a new organization and automatically assigns creator as OWNER', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Nexus Digital Agency'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      const org = res.body.data.organization;
      expect(org.id).toBeDefined();
      expect(org.name).toBe('Nexus Digital Agency');
      expect(org.ownerId).toBe(ownerId);
      expect(org.creditsBalance).toBe(100.0);

      // Verify listUserOrganizations returns org with userRole = OWNER
      const listRes = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.organizations.length).toBe(1);
      expect(listRes.body.data.organizations[0].userRole).toBe('OWNER');
    });

    it('rejects unauthenticated requests to create organizations', async () => {
      const res = await request(app)
        .post('/api/organizations')
        .send({ name: 'Hacker Org' });

      expect(res.status).toBe(401);
    });
  });

  describe('Member Management & RBAC Permissions', () => {
    let orgId: string;

    beforeEach(async () => {
      const orgRes = await request(app)
        .post('/api/organizations')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Apex Media Corp' });

      orgId = orgRes.body.data.organization.id;
    });

    it('allows OWNER to invite/add member with EDITOR role', async () => {
      const addRes = await request(app)
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          userId: memberId,
          role: 'EDITOR'
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.status).toBe('success');
      expect(addRes.body.data.member.role).toBe('EDITOR');
      expect(addRes.body.data.member.userEmail).toBe('copywriter@example.com');

      // Check member sees organization in their list
      const memberOrgsRes = await request(app)
        .get('/api/organizations')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(memberOrgsRes.status).toBe(200);
      expect(memberOrgsRes.body.data.organizations.length).toBe(1);
      expect(memberOrgsRes.body.data.organizations[0].userRole).toBe('EDITOR');
    });

    it('allows members to list organization members', async () => {
      await request(app)
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberId, role: 'VIEWER' });

      const res = await request(app)
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.members.length).toBe(2);
      expect(res.body.data.members.some((m: { role: string }) => m.role === 'OWNER')).toBe(true);
      expect(res.body.data.members.some((m: { role: string }) => m.role === 'VIEWER')).toBe(true);
    });

    it('prevents non-members from viewing organization members', async () => {
      const outsider = await authService.register('outsider@example.com', 'SecureP@ss123', 'Outsider');

      const res = await request(app)
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${outsider.token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('prevents regular members (EDITOR/VIEWER) from adding other members', async () => {
      await request(app)
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberId, role: 'EDITOR' });

      const outsider = await authService.register('other@example.com', 'SecureP@ss123', 'Other User');

      const res = await request(app)
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ userId: outsider.user.id, role: 'VIEWER' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('allows OWNER to remove member and prevents removing OWNER', async () => {
      await request(app)
        .post(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ userId: memberId, role: 'EDITOR' });

      // Remove member
      const removeRes = await request(app)
        .delete(`/api/organizations/${orgId}/members/${memberId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(removeRes.status).toBe(200);

      // Verify member is gone
      const listRes = await request(app)
        .get(`/api/organizations/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(listRes.body.data.members.length).toBe(1);

      // Try to remove OWNER -> should fail
      const removeOwnerRes = await request(app)
        .delete(`/api/organizations/${orgId}/members/${ownerId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(removeOwnerRes.status).toBe(400);
      expect(removeOwnerRes.body.message).toContain('Cannot remove organization OWNER');
    });
  });
});
