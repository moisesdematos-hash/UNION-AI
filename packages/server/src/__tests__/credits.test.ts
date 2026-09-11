import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { resetTestDatabase } from '../db/database.js';
import { AuthService } from '../services/auth.js';
import { creditsService } from '../services/credits-service.js';

describe('Gate 13: Credits, Quotas & Token Accounting System', () => {
  const app = createApp();
  const authService = new AuthService();
  let userA: { token: string; id: string };
  let userB: { token: string; id: string };

  beforeEach(async () => {
    resetTestDatabase();
    const sessionA = await authService.register('alice@union.ai', 'Secret123!', 'Alice');
    userA = { token: sessionA.token, id: sessionA.user.id };

    const sessionB = await authService.register('bob@union.ai', 'Secret123!', 'Bob');
    userB = { token: sessionB.token, id: sessionB.user.id };
  });

  describe('Wallet & Balance Inquiries', () => {
    it('should initialize new user with 100.0 credits and 0 consumed', async () => {
      const res = await request(app)
        .get('/api/credits/balance')
        .set('Authorization', 'Bearer ' + userA.token);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(100.0);
      expect(res.body.data.totalConsumed).toBe(0.0);
    });

    it('should reject unauthenticated requests to credits API', async () => {
      const res = await request(app).get('/api/credits/balance');
      expect(res.status).toBe(401);
    });
  });

  describe('Topup & Refill Operations', () => {
    it('should successfully top up credits and record transaction', async () => {
      const res = await request(app)
        .post('/api/credits/topup')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({
          amount: 50.0,
          packageId: 'pro-pack-50',
          description: 'Payment via Stripe Checkout'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.balance).toBe(150.0);

      // Verify transaction appears in audit history
      const txRes = await request(app)
        .get('/api/credits/transactions')
        .set('Authorization', 'Bearer ' + userA.token);

      expect(txRes.status).toBe(200);
      expect(txRes.body.data.length).toBe(1);
      expect(txRes.body.data[0].amount).toBe(50.0);
      expect(txRes.body.data[0].type).toBe('TOPUP');
      expect(txRes.body.data[0].balanceAfter).toBe(150.0);
    });

    it('should reject non-positive topup amount', async () => {
      const res = await request(app)
        .post('/api/credits/topup')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({ amount: -10 });

      expect(res.status).toBe(400);
    });
  });

  describe('Atomic Deductions & Quota Enforcement', () => {
    it('should deduct credits atomically and update consumed total', () => {
      const deduction = creditsService.deductCredits(userA.id, 2.55, {
        description: 'AI Writer processing'
      });

      expect(deduction.success).toBe(true);
      expect(deduction.newBalance).toBe(97.45);

      const credits = creditsService.getUserCredits(userA.id);
      expect(credits.balance).toBe(97.45);
      expect(credits.totalConsumed).toBe(2.55);

      const txs = creditsService.listTransactions(userA.id);
      expect(txs.length).toBe(1);
      expect(txs[0].amount).toBe(-2.55);
      expect(txs[0].type).toBe('CONSUMPTION');
      expect(txs[0].balanceAfter).toBe(97.45);
    });

    it('should reject deduction and prevent negative balance when credits are insufficient', () => {
      // User starts with 100. Attempt to deduct 150.
      const deduction = creditsService.deductCredits(userA.id, 150.0, {
        description: 'Oversized batch run'
      });

      expect(deduction.success).toBe(false);
      expect(deduction.error).toBe('INSUFFICIENT_CREDITS');
      expect(deduction.newBalance).toBe(100.0);

      // Verify balance was not modified
      const credits = creditsService.getUserCredits(userA.id);
      expect(credits.balance).toBe(100.0);
    });

    it('should check quota via POST /api/credits/check-quota', async () => {
      // Check 50 credits (allowed)
      const allowedRes = await request(app)
        .post('/api/credits/check-quota')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({ estimatedCost: 50 });

      expect(allowedRes.status).toBe(200);
      expect(allowedRes.body.data.allowed).toBe(true);
      expect(allowedRes.body.data.shortfall).toBe(0);

      // Check 250 credits (rejected 402)
      const rejectedRes = await request(app)
        .post('/api/credits/check-quota')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({ estimatedCost: 250 });

      expect(rejectedRes.status).toBe(402);
      expect(rejectedRes.body.error).toBe('INSUFFICIENT_CREDITS');
      expect(rejectedRes.body.data.allowed).toBe(false);
      expect(rejectedRes.body.data.shortfall).toBe(150);
    });
  });

  describe('Workflow Execution Integration & Multi-tenant Isolation', () => {
    it('should deduct credits when recording a workflow execution run', async () => {
      // Create project & workflow for user A
      const projRes = await request(app)
        .post('/api/projects')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({ name: 'Project A' });
      const projectId = projRes.body.data.project.id;

      const wfRes = await request(app)
        .post('/api/workflows')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({ projectId, name: 'Workflow A' });
      const workflowId = wfRes.body.data.workflow.id;

      // Record a completed run costing 0.45 credits
      const runRes = await request(app)
        .post('/api/workflows/' + workflowId + '/runs')
        .set('Authorization', 'Bearer ' + userA.token)
        .send({
          status: 'COMPLETED',
          mode: 'RUN',
          totalNodes: 3,
          completedNodes: 3,
          failedNodes: 0,
          totalTokens: 1500,
          totalCostCredits: 0.45,
          durationMs: 820
        });

      expect(runRes.status).toBe(201);
      expect(runRes.body.data.creditsRemaining).toBe(99.55);

      // Check updated balance
      const balRes = await request(app)
        .get('/api/credits/balance')
        .set('Authorization', 'Bearer ' + userA.token);
      expect(balRes.body.data.balance).toBe(99.55);
      expect(balRes.body.data.totalConsumed).toBe(0.45);
    });

    it('should strictly isolate credits and transactions between users', async () => {
      // Alice consumes 10 credits
      creditsService.deductCredits(userA.id, 10.0, { description: 'Alice task' });

      // Bob balance must remain untouched at 100.0
      const bobBal = await request(app)
        .get('/api/credits/balance')
        .set('Authorization', 'Bearer ' + userB.token);
      expect(bobBal.body.data.balance).toBe(100.0);
      expect(bobBal.body.data.totalConsumed).toBe(0.0);

      // Bob cannot see Alice transaction
      const bobTxs = await request(app)
        .get('/api/credits/transactions')
        .set('Authorization', 'Bearer ' + userB.token);
      expect(bobTxs.body.data.length).toBe(0);
    });
  });
});
