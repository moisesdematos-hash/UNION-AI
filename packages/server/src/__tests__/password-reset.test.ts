import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, resetTestDatabase, closeDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';

describe('Password Reset & Email Recovery Workflow', () => {
  const app = createApp();

  beforeEach(() => {
    resetTestDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should process forgot-password request safely without revealing user existence', async () => {
    // 1. Non-existent email
    const resUnknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(resUnknown.status).toBe(200);
    expect(resUnknown.body.status).toBe('success');
    expect(resUnknown.body.message).toContain('instruções');

    // 2. Real user
    await authService.register('alberto@example.com', 'InitialPassword123', 'Alberto Santos');

    const resUser = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'alberto@example.com' });

    expect(resUser.status).toBe(200);
    expect(resUser.body.status).toBe('success');
    expect(resUser.body.devToken).toBeDefined();

    // Verify token exists in database
    const db = getDatabase();
    const tokenRecord = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?').get(resUser.body.devToken) as any;
    expect(tokenRecord).toBeDefined();
    expect(tokenRecord.used).toBe(0);
    expect(tokenRecord.expires_at).toBeGreaterThan(Date.now());
  });

  it('should reset password with valid token and allow subsequent login with new password', async () => {
    await authService.register('beatriz@example.com', 'OldPassword123', 'Beatriz Silva');

    const resetReq = await authService.requestPasswordReset('beatriz@example.com');
    const token = resetReq.devToken!;
    expect(token).toBeDefined();

    // Reset password
    const resReset = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token,
        newPassword: 'BrandNewSecurePassword456'
      });

    expect(resReset.status).toBe(200);
    expect(resReset.body.status).toBe('success');
    expect(resReset.body.message).toContain('sucesso');

    // Verify old password fails
    const resOldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'beatriz@example.com', password: 'OldPassword123' });
    expect(resOldLogin.status).toBe(401);

    // Verify new password succeeds
    const resNewLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'beatriz@example.com', password: 'BrandNewSecurePassword456' });
    expect(resNewLogin.status).toBe(200);
    expect(resNewLogin.body.data.token).toBeDefined();
  });

  it('should reject reused or invalid password reset tokens', async () => {
    await authService.register('carlos@example.com', 'CarlosPassword123', 'Carlos Lima');

    const resetReq = await authService.requestPasswordReset('carlos@example.com');
    const token = resetReq.devToken!;

    // 1st use: success
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'FirstNewPassword999' });

    // 2nd use: should be rejected
    const resSecondUse = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, newPassword: 'SecondNewPassword999' });

    expect(resSecondUse.status).toBe(400);
    expect(resSecondUse.body.message).toContain('already been used');

    // Invalid token: should be rejected
    const resInvalid = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'completely-fake-token-xyz', newPassword: 'SomePassword123' });

    expect(resInvalid.status).toBe(400);
    expect(resInvalid.body.message).toContain('Invalid password reset token');
  });
});
