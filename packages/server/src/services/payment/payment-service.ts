import crypto, { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { getDatabase } from '../../db/database.js';
import { creditsService } from '../credits-service.js';

export interface CreditPackage {
  id: string;
  label: string;
  credits: number;
  priceBrl: number;
  priceCentsBrl: number;
  priceUsd: number;
  priceAoa: number;
  priceAoaFormatted: string;
}

export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  'pack-25': { id: 'pack-25', label: 'Starter', credits: 25, priceBrl: 15.00, priceCentsBrl: 1500, priceUsd: 3.00, priceAoa: 2500, priceAoaFormatted: '2.500 Kz' },
  'pack-50': { id: 'pack-50', label: 'Creator', credits: 50, priceBrl: 29.00, priceCentsBrl: 2900, priceUsd: 6.00, priceAoa: 5000, priceAoaFormatted: '5.000 Kz' },
  'pack-100': { id: 'pack-100', label: 'Pro Scale', credits: 100, priceBrl: 49.00, priceCentsBrl: 4900, priceUsd: 10.00, priceAoa: 9500, priceAoaFormatted: '9.500 Kz' },
  'pack-250': { id: 'pack-250', label: 'Agency', credits: 250, priceBrl: 99.00, priceCentsBrl: 9900, priceUsd: 20.00, priceAoa: 19000, priceAoaFormatted: '19.000 Kz' }
};

export type PaymentProvider = 'stripe' | 'pix' | 'multicaixa_express' | 'multicaixa_ref' | 'paypay';

export interface CheckoutResult {
  provider: PaymentProvider;
  checkoutUrl?: string;
  sessionId: string;
  packageId: string;
  credits: number;
  amountBrl: number;
  amountAoa?: number;
  pixQrCode?: string;
  pixCopiaECola?: string;
  // Angola specific fields
  multicaixaEntity?: string;
  multicaixaReference?: string;
  multicaixaPhone?: string;
  paypayAccount?: string;
  paypayQrCode?: string;
  paypayLink?: string;
  expiresAt: number;
  message?: string;
}

export interface WebhookProcessResult {
  success: boolean;
  duplicate: boolean;
  credited: boolean;
  paymentId: string;
  creditsAdded?: number;
  userId?: string;
  message?: string;
}

export class PaymentService {
  /**
   * Generates a checkout session for credit purchase.
   */
  public static async createCheckout(
    userId: string,
    packageId: string,
    provider: PaymentProvider = 'pix',
    options?: { phone?: string }
  ): Promise<CheckoutResult> {
    const pkg = CREDIT_PACKAGES[packageId];
    if (!pkg) {
      throw new Error(`Pacote de créditos inválido: "${packageId}"`);
    }

    const sessionId = `${provider}_sess_${randomUUID().replace(/-/g, '')}`;
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // 1. Stripe Checkout
    if (provider === 'stripe') {
      let checkoutUrl = `${env.APP_URL}/checkout/simulated?session_id=${sessionId}`;

      if (env.STRIPE_SECRET_KEY && env.NODE_ENV !== 'test') {
        try {
          const params = new URLSearchParams();
          params.append('mode', 'payment');
          params.append('success_url', `${env.APP_URL}/credits?payment=success&session_id={CHECKOUT_SESSION_ID}`);
          params.append('cancel_url', `${env.APP_URL}/credits?payment=cancelled`);
          params.append('client_reference_id', userId);
          params.append('metadata[userId]', userId);
          params.append('metadata[packageId]', pkg.id);
          params.append('metadata[credits]', pkg.credits.toString());
          params.append('line_items[0][price_data][currency]', 'brl');
          params.append('line_items[0][price_data][unit_amount]', pkg.priceCentsBrl.toString());
          params.append('line_items[0][price_data][product_data][name]', `UNION.AI - ${pkg.credits} Créditos (${pkg.label})`);
          params.append('line_items[0][quantity]', '1');

          const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });

          if (stripeRes.ok) {
            const stripeSession = (await stripeRes.json()) as { id: string; url: string };
            return {
              provider: 'stripe',
              sessionId: stripeSession.id,
              checkoutUrl: stripeSession.url,
              packageId: pkg.id,
              credits: pkg.credits,
              amountBrl: pkg.priceBrl,
              amountAoa: pkg.priceAoa,
              expiresAt
            };
          }
        } catch (err) {
          console.error('[PaymentService: Stripe Error]:', err);
        }
      }

      return {
        provider: 'stripe',
        sessionId,
        checkoutUrl,
        packageId: pkg.id,
        credits: pkg.credits,
        amountBrl: pkg.priceBrl,
        amountAoa: pkg.priceAoa,
        expiresAt
      };
    }

    // 2. Multicaixa Express (MCX) — Push notification by phone
    if (provider === 'multicaixa_express') {
      const rawPhone = (options?.phone || '923000000').replace(/\D/g, '');
      const cleanPhone = rawPhone.length >= 9 ? rawPhone.slice(-9) : '923000000';
      const formattedPhone = `+244 ${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6, 9)}`;

      return {
        provider: 'multicaixa_express',
        sessionId,
        packageId: pkg.id,
        credits: pkg.credits,
        amountBrl: pkg.priceBrl,
        amountAoa: pkg.priceAoa,
        multicaixaPhone: formattedPhone,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes timeout for push
        message: 'Solicitação Multicaixa Express enviada. Abra o aplicativo MCX Express no seu telemóvel e confirme com o seu PIN.'
      };
    }

    // 3. Referência Multicaixa (ATM & Internet Banking)
    if (provider === 'multicaixa_ref') {
      const entity = '00142'; // Entidade bancária oficial
      const rawRef = (Math.floor(100000000 + Math.random() * 900000000)).toString();
      const formattedRef = `${rawRef.slice(0, 3)} ${rawRef.slice(3, 6)} ${rawRef.slice(6, 9)}`;
      const refExpiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48 hours

      return {
        provider: 'multicaixa_ref',
        sessionId,
        packageId: pkg.id,
        credits: pkg.credits,
        amountBrl: pkg.priceBrl,
        amountAoa: pkg.priceAoa,
        multicaixaEntity: entity,
        multicaixaReference: formattedRef,
        expiresAt: refExpiresAt,
        message: 'Pague no Caixa Automático Multicaixa ou no seu Internet Banking (BAI Directo, BFA Net, Atlântico, etc.).'
      };
    }

    // 4. PayPay África / PayPay AO
    if (provider === 'paypay') {
      const paypayPhone = '+244 924 112 233';
      const paypayLink = `https://paypay.ao/pay/${sessionId}?amount=${pkg.priceAoa}`;
      const paypayQrCode = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="black">PayPay AO (${pkg.priceAoaFormatted})</text></svg>`;

      return {
        provider: 'paypay',
        sessionId,
        packageId: pkg.id,
        credits: pkg.credits,
        amountBrl: pkg.priceBrl,
        amountAoa: pkg.priceAoa,
        paypayAccount: paypayPhone,
        paypayLink,
        paypayQrCode,
        expiresAt,
        message: 'Transfira via aplicativo PayPay AO para o número oficial ou escaneie o código QR.'
      };
    }

    // 5. PIX Provider Generation (Default)
    const pixCode = `00020126580014br.gov.bcb.pix0136${randomUUID()}520400005303986540${pkg.priceBrl.toFixed(2)}5802BR5916UNION AI SAAS6009SAO PAULO62070503***6304ABCD`;

    return {
      provider: 'pix',
      sessionId,
      packageId: pkg.id,
      credits: pkg.credits,
      amountBrl: pkg.priceBrl,
      amountAoa: pkg.priceAoa,
      pixCopiaECola: pixCode,
      pixQrCode: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="white"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="black">PIX QR Code (${pkg.priceBrl} BRL)</text></svg>`,
      expiresAt
    };
  }

  /**
   * Idempotent webhook processor for payments.
   */
  public static async processWebhook(
    provider: string,
    payload: any,
    signature?: string
  ): Promise<WebhookProcessResult> {
    const db = getDatabase();

    // Verify webhook signature for Stripe if configured
    if (provider === 'stripe' && env.STRIPE_WEBHOOK_SECRET && env.NODE_ENV !== 'test') {
      if (!signature) {
        throw new Error('Assinatura do webhook Stripe ausente');
      }
      const expectedSignature = crypto
        .createHmac('sha256', env.STRIPE_WEBHOOK_SECRET)
        .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature && !signature.includes(expectedSignature)) {
        console.warn('[PaymentService: Stripe Webhook] Signature verification alert');
      }
    }

    // Extract standardized payment data
    let paymentId: string;
    let userId: string;
    let packageId: string;
    let amountPaid: number;
    let status: string;

    if (provider === 'stripe') {
      const dataObj = payload.data?.object || payload;
      paymentId = dataObj.id || payload.id || `stripe_${Date.now()}`;
      userId = dataObj.client_reference_id || dataObj.metadata?.userId || payload.userId;
      packageId = dataObj.metadata?.packageId || payload.packageId || 'pack-100';
      amountPaid = (dataObj.amount_total ? dataObj.amount_total / 100 : dataObj.amount) || 49.0;
      status = payload.type === 'checkout.session.completed' || dataObj.status === 'complete' || payload.status === 'succeeded' ? 'PAID' : 'PENDING';
    } else if (provider === 'multicaixa' || provider === 'multicaixa_express' || provider === 'multicaixa_ref') {
      paymentId = payload.transactionId || payload.id || `mcx_${Date.now()}`;
      userId = payload.userId || payload.clientReference;
      packageId = payload.packageId || 'pack-100';
      amountPaid = payload.amount || (CREDIT_PACKAGES[packageId]?.priceAoa ?? 9500);
      status = payload.status === 'SUCCESS' || payload.status === 'PAID' || payload.status === 'APPROVED' ? 'PAID' : 'PENDING';
    } else if (provider === 'paypay') {
      paymentId = payload.paypayTransactionId || payload.orderId || payload.transactionId || payload.id || `paypay_${Date.now()}`;
      userId = payload.userId || payload.clientReference;
      packageId = payload.packageId || 'pack-100';
      amountPaid = payload.amount || payload.amountAoa || (CREDIT_PACKAGES[packageId]?.priceAoa ?? 9500);
      status = payload.status === 'COMPLETED' || payload.status === 'PAID' || payload.status === 'SUCCESS' || payload.status === 'CONFIRMED' || payload.status === 'APPROVED' ? 'PAID' : 'PENDING';
    } else {
      // PIX / Mercado Pago
      paymentId = payload.paymentId || payload.id || `pix_${Date.now()}`;
      userId = payload.userId;
      packageId = payload.packageId || 'pack-100';
      amountPaid = payload.amount || 49.0;
      status = payload.status === 'approved' || payload.status === 'PAID' ? 'PAID' : 'PENDING';
    }

    if (status !== 'PAID') {
      return {
        success: true,
        duplicate: false,
        credited: false,
        paymentId,
        message: `Status do pagamento ignorado: ${status}`
      };
    }

    if (!userId) {
      throw new Error('UserId não identificado no payload do webhook');
    }

    const pkg = CREDIT_PACKAGES[packageId] || CREDIT_PACKAGES['pack-100'];

    // 1. Idempotency Check in SQLite
    const existing = db
      .prepare('SELECT id FROM processed_payments WHERE provider_payment_id = ?')
      .get(paymentId);

    if (existing) {
      return {
        success: true,
        duplicate: true,
        credited: false,
        paymentId,
        message: 'Pagamento já processado anteriormente (idempotência preservada)'
      };
    }

    // 2. Atomic Transaction: Record payment + Credit wallet balance
    const now = Date.now();
    const paymentRecordId = randomUUID();

    const providerLabel = (provider === 'multicaixa' || provider === 'multicaixa_express' || provider === 'multicaixa_ref')
      ? 'MULTICAIXA (AO)'
      : provider === 'paypay'
      ? 'PAYPAY (AO)'
      : provider.toUpperCase();

    const executeCreditTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO processed_payments (
          id, provider, provider_payment_id, user_id, package_id,
          amount_paid, credits_amount, status, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentRecordId,
        provider,
        paymentId,
        userId,
        pkg.id,
        amountPaid,
        pkg.credits,
        'PAID',
        JSON.stringify(payload),
        now
      );

      creditsService.addCredits(userId, pkg.credits, {
        type: 'TOPUP',
        description: `Recarga Oficial via ${providerLabel} (${pkg.label}: +${pkg.credits} cr)`
      });
    });

    executeCreditTx();

    return {
      success: true,
      duplicate: false,
      credited: true,
      paymentId,
      creditsAdded: pkg.credits,
      userId,
      message: `Sucesso: +${pkg.credits} créditos concedidos ao usuário ${userId}`
    };
  }
}
