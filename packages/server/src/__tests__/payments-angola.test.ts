import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { getDatabase, resetTestDatabase, closeDatabase } from '../db/database.js';
import { authService } from '../services/auth.js';
import { creditsService } from '../services/credits-service.js';

describe('Angola Payment Gateways (Multicaixa Express, Referência & PayPay AO)', () => {
  const app = createApp();

  beforeEach(() => {
    resetTestDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should include Angolan Kwanza (AOA) prices in the packages catalog', async () => {
    const res = await request(app).get('/api/payments/packages');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const packages = res.body.data;
    expect(packages.length).toBe(4);

    const pack25 = packages.find((p: any) => p.id === 'pack-25');
    expect(pack25.priceAoa).toBe(2500);
    expect(pack25.priceAoaFormatted).toBe('2.500 Kz');

    const pack100 = packages.find((p: any) => p.id === 'pack-100');
    expect(pack100.priceAoa).toBe(9500);
    expect(pack100.priceAoaFormatted).toBe('9.500 Kz');
  });

  it('should initiate checkout for Multicaixa Express with phone push payload', async () => {
    const session = await authService.register('angola.user@example.com', 'AngolaPass123', 'Manuel dos Santos');
    const token = session.token;

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        packageId: 'pack-50',
        provider: 'multicaixa_express',
        phone: '923112233'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe('multicaixa_express');
    expect(res.body.data.amountAoa).toBe(5000);
    expect(res.body.data.credits).toBe(50);
    expect(res.body.data.multicaixaPhone).toContain('+244 923 112 233');
    expect(res.body.data.message).toContain('MCX Express');
  });

  it('should initiate checkout for Referência Multicaixa with official entity 00142', async () => {
    const session = await authService.register('ref.user@example.com', 'AngolaPass123', 'Ana Luanda');
    const token = session.token;

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        packageId: 'pack-100',
        provider: 'multicaixa_ref'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe('multicaixa_ref');
    expect(res.body.data.multicaixaEntity).toBe('00142');
    expect(res.body.data.multicaixaReference).toBeDefined();
    expect(res.body.data.multicaixaReference.replace(/\s+/g, '').length).toBe(9);
    expect(res.body.data.amountAoa).toBe(9500);
    expect(res.body.data.credits).toBe(100);
  });

  it('should initiate checkout for PayPay AO with wallet details and QR code', async () => {
    const session = await authService.register('paypay.user@example.com', 'AngolaPass123', 'Kátia Benguela');
    const token = session.token;

    const res = await request(app)
      .post('/api/payments/checkout')
      .set('Authorization', `Bearer ${token}`)
      .send({
        packageId: 'pack-250',
        provider: 'paypay'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.provider).toBe('paypay');
    expect(res.body.data.paypayAccount).toBe('+244 924 112 233');
    expect(res.body.data.paypayQrCode).toContain('<svg');
    expect(res.body.data.paypayLink).toContain('paypay.ao/pay');
    expect(res.body.data.amountAoa).toBe(19000);
    expect(res.body.data.credits).toBe(250);
  });

  it('should process Multicaixa webhook and credit wallet idempotently', async () => {
    const session = await authService.register('mcx.payer@example.com', 'PassWord123', 'Kwanza Payer');
    const userId = session.user.id;

    const initial = creditsService.getUserCredits(userId);
    expect(initial.balance).toBe(100.0);

    const webhookPayload = {
      transactionId: 'mcx_tx_9988776655',
      userId: userId,
      packageId: 'pack-100',
      amountAoa: 9500,
      status: 'PAID'
    };

    // First call
    const res1 = await request(app)
      .post('/api/payments/webhook/multicaixa')
      .send(webhookPayload);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);
    expect(res1.body.credited).toBe(true);
    expect(res1.body.duplicate).toBe(false);

    const afterFirst = creditsService.getUserCredits(userId);
    expect(afterFirst.balance).toBe(200.0);

    // Second call with identical transactionId must be recognized as duplicate
    const res2 = await request(app)
      .post('/api/payments/webhook/multicaixa')
      .send(webhookPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.success).toBe(true);
    expect(res2.body.duplicate).toBe(true);
    expect(res2.body.credited).toBe(false);

    // Balance remains 200.0
    const afterSecond = creditsService.getUserCredits(userId);
    expect(afterSecond.balance).toBe(200.0);
  });

  it('should process PayPay AO webhook and credit wallet idempotently', async () => {
    const session = await authService.register('paypay.payer@example.com', 'PassWord123', 'PayPay Payer');
    const userId = session.user.id;

    const webhookPayload = {
      orderId: 'paypay_order_445566',
      userId: userId,
      packageId: 'pack-50',
      amountAoa: 5000,
      status: 'CONFIRMED'
    };

    const res1 = await request(app)
      .post('/api/payments/webhook/paypay')
      .send(webhookPayload);

    expect(res1.status).toBe(200);
    expect(res1.body.credited).toBe(true);

    const wallet = creditsService.getUserCredits(userId);
    expect(wallet.balance).toBe(150.0);

    // Duplicate check
    const res2 = await request(app)
      .post('/api/payments/webhook/paypay')
      .send(webhookPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.duplicate).toBe(true);
    expect(res2.body.credited).toBe(false);

    const walletAfter = creditsService.getUserCredits(userId);
    expect(walletAfter.balance).toBe(150.0);
  });
});
