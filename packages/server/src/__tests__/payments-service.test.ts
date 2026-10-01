import Stripe from 'stripe';
import { env } from '../config/env.js';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, resetTestDatabase, closeDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { creditsService } from '../services/credits-service.js';
describe('Payment Gateway & Idempotent Webhook Processing', () => {
    const app = createApp();
    beforeEach(() => {
        resetTestDatabase();
    });
    afterAll(() => {
        closeDatabase();
    });
    it('should list all official credit packages with prices and credit amounts', async () => {
        const res = await request(app).get('/api/payments/packages');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(4);
        const proPack = res.body.data.find((p: any) => p.id === 'pack-100');
        expect(proPack).toBeDefined();
        expect(proPack.credits).toBe(100);
        expect(proPack.priceBrl).toBe(49.00);
    });
    it('should reject checkout when payment gateway is unconfigured with PROVIDER_NOT_CONFIGURED', async () => {
        const session = await authService.register('payer@example.com', 'SecurePass123', 'Payer User');
        const token = session.token;
        // 1. PIX Checkout without MERCADO_PAGO_ACCESS_TOKEN
        const resPix = await request(app)
            .post('/api/payments/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
            packageId: 'pack-50',
            provider: 'pix'
        });
        expect(resPix.status).toBe(503);
        expect(resPix.body.success).toBe(false);
        expect(resPix.body.code).toBe('PROVIDER_NOT_CONFIGURED');
        expect(resPix.body.error).toContain('MERCADO_PAGO_ACCESS_TOKEN');
        // 2. Stripe Checkout without STRIPE_SECRET_KEY
        const resStripe = await request(app)
            .post('/api/payments/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
            packageId: 'pack-100',
            provider: 'stripe'
        });
        expect(resStripe.status).toBe(503);
        expect(resStripe.body.success).toBe(false);
        expect(resStripe.body.code).toBe('PROVIDER_NOT_CONFIGURED');
        expect(resStripe.body.error).toContain('STRIPE_SECRET_KEY');
        // 3. Multicaixa Express without MULTICAIXA_EXPRESS_API_KEY
        const resMcx = await request(app)
            .post('/api/payments/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({
            packageId: 'pack-100',
            provider: 'multicaixa_express',
            phone: '923112233'
        });
        expect(resMcx.status).toBe(503);
        expect(resMcx.body.success).toBe(false);
        expect(resMcx.body.code).toBe('PROVIDER_NOT_CONFIGURED');
        expect(resMcx.body.error).toContain('Nenhuma cobrança');
    });
    it('should process payment webhook atomically and enforce strict idempotency', async () => {
        const userSession = await authService.register('investor@example.com', 'InvestorPass123', 'Investor User');
        const userId = userSession.user.id;
        const initialWallet = (await creditsService.getUserCredits(userId));
        expect(initialWallet.balance).toBe(100.0); // 100 initial credits
        const webhookPayload = {
            id: 'evt_stripe_payment_test_998877',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_session_id_12345',
                    client_reference_id: userId,
                    status: 'complete', payment_status: 'paid', currency: 'brl',
                    amount_total: 4900,
                    metadata: {
                        userId: userId,
                        packageId: 'pack-100'
                    }
                }
            }
        };
        env.STRIPE_WEBHOOK_SECRET = 'whsec_fixture';
        const signature = new Stripe('sk_fixture').webhooks.generateTestHeaderString({ payload: JSON.stringify(webhookPayload), secret: env.STRIPE_WEBHOOK_SECRET });
        // 1. First Webhook execution -> should credit 100 credits
        const resFirst = await request(app)
            .post('/api/payments/webhook/stripe').set('stripe-signature', signature)
            .send(webhookPayload);
        expect(resFirst.status).toBe(200);
        expect(resFirst.body.success).toBe(true);
        expect(resFirst.body.credited).toBe(true);
        expect(resFirst.body.duplicate).toBe(false);
        // Verify wallet updated to 200.0 credits
        const updatedWallet = (await creditsService.getUserCredits(userId));
        expect(updatedWallet.balance).toBe(200.0);
        // Verify transaction recorded in credit_transactions
        const transactions = (await creditsService.listTransactions(userId));
        const topupTx = transactions.find(t => t.type === 'TOPUP');
        expect(topupTx).toBeDefined();
        expect(topupTx!.amount).toBe(100);
        // Verify SQLite processed_payments record
        const db = getDatabase();
        const paymentRecord = db.prepare('SELECT * FROM processed_payments WHERE provider_payment_id = ?').get('cs_test_session_id_12345') as any;
        expect(paymentRecord).toBeDefined();
        expect(paymentRecord.status).toBe('PAID');
        // 2. Second Webhook execution with IDENTICAL paymentId -> Idempotency must prevent double crediting!
        const resSecond = await request(app)
            .post('/api/payments/webhook/stripe').set('stripe-signature', signature)
            .send(webhookPayload);
        expect(resSecond.status).toBe(200);
        expect(resSecond.body.success).toBe(true);
        expect(resSecond.body.duplicate).toBe(true);
        expect(resSecond.body.credited).toBe(false);
        // Verify balance is STILL 200.0, NOT 300.0!
        const unchangedWallet = (await creditsService.getUserCredits(userId));
        expect(unchangedWallet.balance).toBe(200.0);
    });
});
