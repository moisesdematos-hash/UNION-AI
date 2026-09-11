import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';

describe('Authentication & User Isolation API', () => {
  const app = createApp();

  beforeEach(() => {
    resetTestDatabase();
  });

  it('should register a new user successfully and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'developer@union.ai',
        password: 'securePassword123!',
        name: 'Lead AI Engineer'
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe('developer@union.ai');
    expect(res.body.data.user.name).toBe('Lead AI Engineer');
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject registration with duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@union.ai',
        password: 'password123',
        name: 'User One'
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'duplicate@union.ai',
        password: 'anotherPassword',
        name: 'User Two'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  it('should authenticate registered user with valid password and reject invalid password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'login@union.ai',
        password: 'correctPassword',
        name: 'Login User'
      });

    // Valid login
    const validRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@union.ai',
        password: 'correctPassword'
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.data.token).toBeDefined();

    // Invalid login
    const invalidRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@union.ai',
        password: 'wrongPassword'
      });

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.message).toContain('Invalid email or password');
  });

  it('should allow access to /api/auth/me only with valid Bearer token', async () => {
    // Unauthenticated
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);

    // Authenticated
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'tokenuser@union.ai',
        password: 'password123',
        name: 'Token User'
      });

    const token = reg.body.data.token;

    const authRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.user.email).toBe('tokenuser@union.ai');
  });
});
