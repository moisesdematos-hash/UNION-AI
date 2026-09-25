import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';

describe('Admin Panel & Multi-Provider Auth (Email & Google)', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    resetTestDatabase();
    app = createApp();
  });

  it('should register first user as ADMIN and subsequent user as USER', async () => {
    // 1. First user registers -> automatically ADMIN
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Chief Admin',
        email: 'admin@union.ai',
        password: 'password123'
      });

    expect(res1.status).toBe(201);
    expect(res1.body.status).toBe('success');
    expect(res1.body.data.user.role).toBe('ADMIN');
    expect(res1.body.data.user.authProvider).toBe('email');

    // 2. Second user registers -> standard USER
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Standard Client',
        email: 'client@example.com',
        password: 'password123'
      });

    expect(res2.status).toBe(201);
    expect(res2.body.data.user.role).toBe('USER');
  });

  it('should support Google OAuth authentication via /api/auth/google', async () => {
    const googleRes = await request(app)
      .post('/api/auth/google')
      .send({
        email: 'googleuser@gmail.com',
        name: 'Google User',
        avatarUrl: 'https://lh3.googleusercontent.com/a/avatar.jpg',
        googleId: 'google-oauth-123456'
      });

    expect(googleRes.status).toBe(200);
    expect(googleRes.body.status).toBe('success');
    expect(googleRes.body.data.user.email).toBe('googleuser@gmail.com');
    expect(googleRes.body.data.user.authProvider).toBe('google');
    expect(googleRes.body.data.user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/avatar.jpg');
    expect(googleRes.body.data.token).toBeDefined();

    // Verify /api/auth/me returns updated credits and profile
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${googleRes.body.data.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('googleuser@gmail.com');
    expect(meRes.body.data.user.credits.balance).toBe(100.0);
  });

  it('should restrict /api/admin/* to ADMIN users only (RBAC)', async () => {
    // Register Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin Boss',
        email: 'boss@union.ai',
        password: 'adminpassword'
      });
    const adminToken = adminRes.body.data.token;

    // Register Normal User
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Normal User',
        email: 'normal@test.com',
        password: 'normalpassword'
      });
    const userToken = userRes.body.data.token;

    // Normal user attempts to access /api/admin/metrics -> 403 Forbidden
    const unauthMetrics = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${userToken}`);

    expect(unauthMetrics.status).toBe(403);
    expect(unauthMetrics.body.message).toContain('Requer privilégios de administrador');

    // Admin accesses /api/admin/metrics -> 200 OK
    const authMetrics = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(authMetrics.status).toBe(200);
    expect(authMetrics.body.data.users.total).toBe(2);
    expect(authMetrics.body.data.credits.circulatingEstimated).toBeGreaterThan(0);
    expect(authMetrics.body.data.system.groqModel).toBeDefined();
  });

  it('should allow admin to list users, adjust credits, and change roles', async () => {
    // 1. Register Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@union.ai', password: 'password123' });
    const adminToken = adminRes.body.data.token;

    // 2. Register Client
    const clientRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Maria Silva', email: 'maria@empresa.ao', password: 'password123' });
    const clientUserId = clientRes.body.data.user.id;

    // 3. Admin lists users
    const listRes = await request(app)
      .get('/api/admin/users?q=maria')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.users.length).toBe(1);
    expect(listRes.body.data.users[0].name).toBe('Maria Silva');

    // 4. Admin adjusts credits (+250 cr)
    const creditAdjustRes = await request(app)
      .patch(`/api/admin/users/${clientUserId}/credits`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 250,
        mode: 'add',
        reason: 'Bônus especial de parceiro'
      });

    expect(creditAdjustRes.status).toBe(200);
    expect(creditAdjustRes.body.data.newBalance).toBe(350.0);

    // 5. Admin promotes Maria to ADMIN
    const roleRes = await request(app)
      .patch(`/api/admin/users/${clientUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' });

    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.role).toBe('ADMIN');
  });

  it('should record manual payment approvals in /api/admin/transactions/manual-credit', async () => {
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@union.ai', password: 'password123' });
    const adminToken = adminRes.body.data.token;

    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'João Manuel', email: 'joao@ao.com', password: 'password123' });
    const userId = userRes.body.data.user.id;

    // Admin approves a manual Multicaixa payment receipt
    const manualRes = await request(app)
      .post('/api/admin/transactions/manual-credit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId,
        packageId: 'pack-50', // 50 credits, 5.000 Kz
        provider: 'multicaixa_ref',
        receiptReference: 'MCX-REF-998877',
        note: 'Comprovativo enviado via WhatsApp verificado'
      });

    expect(manualRes.status).toBe(200);
    expect(manualRes.body.data.creditsAdded).toBe(50);

    // Admin lists transactions
    const txRes = await request(app)
      .get('/api/admin/transactions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(txRes.status).toBe(200);
    expect(txRes.body.data.length).toBeGreaterThan(0);
    expect(txRes.body.data[0].provider).toBe('multicaixa_ref');
    expect(txRes.body.data[0].amountPaid).toBe(5000);
  });
});
