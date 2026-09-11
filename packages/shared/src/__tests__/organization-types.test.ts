import { describe, it, expect } from 'vitest';
import {
  OrgRoleEnum,
  OrganizationSchema,
  OrgMemberSchema,
  hasPermission
} from '../types/organizations.js';

describe('Gate 16: Multi-Tenant Organizations & RBAC Types', () => {
  it('validates OrgRoleEnum and hierarchy', () => {
    expect(OrgRoleEnum.parse('OWNER')).toBe('OWNER');
    expect(OrgRoleEnum.parse('ADMIN')).toBe('ADMIN');
    expect(OrgRoleEnum.parse('EDITOR')).toBe('EDITOR');
    expect(OrgRoleEnum.parse('VIEWER')).toBe('VIEWER');
    expect(() => OrgRoleEnum.parse('SUPERUSER')).toThrow();
  });

  it('correctly evaluates RBAC hierarchy permissions', () => {
    // OWNER has all permissions
    expect(hasPermission('OWNER', 'OWNER')).toBe(true);
    expect(hasPermission('OWNER', 'ADMIN')).toBe(true);
    expect(hasPermission('OWNER', 'EDITOR')).toBe(true);
    expect(hasPermission('OWNER', 'VIEWER')).toBe(true);

    // ADMIN can do EDITOR and VIEWER tasks
    expect(hasPermission('ADMIN', 'OWNER')).toBe(false);
    expect(hasPermission('ADMIN', 'ADMIN')).toBe(true);
    expect(hasPermission('ADMIN', 'EDITOR')).toBe(true);
    expect(hasPermission('ADMIN', 'VIEWER')).toBe(true);

    // EDITOR can edit and view
    expect(hasPermission('EDITOR', 'ADMIN')).toBe(false);
    expect(hasPermission('EDITOR', 'EDITOR')).toBe(true);
    expect(hasPermission('EDITOR', 'VIEWER')).toBe(true);

    // VIEWER is read-only
    expect(hasPermission('VIEWER', 'EDITOR')).toBe(false);
    expect(hasPermission('VIEWER', 'VIEWER')).toBe(true);
  });

  it('validates Organization and OrgMember schemas', () => {
    const org = OrganizationSchema.parse({
      id: 'org-123',
      name: 'Growth Agency HQ',
      slug: 'growth-agency-hq',
      ownerId: 'user-1',
      creditsBalance: 500.0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    expect(org.name).toBe('Growth Agency HQ');
    expect(org.creditsBalance).toBe(500.0);

    const member = OrgMemberSchema.parse({
      id: 'mem-1',
      orgId: org.id,
      userId: 'user-2',
      role: 'EDITOR',
      userEmail: 'copywriter@agency.com',
      userName: 'Senior Copywriter',
      joinedAt: Date.now()
    });
    expect(member.role).toBe('EDITOR');
    expect(member.userEmail).toBe('copywriter@agency.com');
  });
});
