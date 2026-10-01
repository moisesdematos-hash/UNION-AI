import Stripe from 'stripe';
import crypto, { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { getOperationalDatabase } from '../../db/operational-database.js';
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
     * Generates an authentic checkout session for credit purchase.
     * Throws PROVIDER_NOT_CONFIGURED if API credentials are not set up in environment.
     */
    public static async createCheckout(userId: string, packageId: string, provider: PaymentProvider = 'pix', options?: {
        phone?: string;
    }): Promise<CheckoutResult> {
        const pkg = CREDIT_PACKAGES[packageId];
        if (!pkg) {
            throw new Error(`Pacote de créditos inválido: "${packageId}"`);
        }
        const db = getOperationalDatabase();
        const sessionId = `${provider}_sess_${randomUUID().replace(/-/g, '')}`;
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
        // 1. Stripe Checkout
        if (provider === 'stripe') {
            if (!env.STRIPE_SECRET_KEY) {
                throw new Error('PROVIDER_NOT_CONFIGURED: Stripe API keys (STRIPE_SECRET_KEY) não estão configuradas no ambiente.');
            }
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
                    method: 'POST', signal: AbortSignal.timeout(15000),
                    headers: {
                        'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                });
                if (!stripeRes.ok) {
                    const errData = await stripeRes.json().catch(() => ({}));
                    throw new Error(`Erro ao criar sessão no Stripe: ${(errData as any).error?.message || stripeRes.statusText}`);
                }
                const stripeSession = (await stripeRes.json()) as {
                    id: string;
                    url: string;
                };
                // Record pending checkout in database
                try {
                    (await db.prepare(`
            INSERT INTO processed_payments (
              id, provider, provider_payment_id, user_id, package_id,
              amount_paid, credits_amount, status, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(randomUUID(), 'stripe', stripeSession.id, userId, pkg.id, pkg.priceBrl, pkg.credits, 'PENDING', JSON.stringify({ checkoutUrl: stripeSession.url }), Date.now()));
                }
                catch (dbErr) {
                    console.warn('[PaymentService] Failed to record pending stripe checkout:', dbErr);
                }
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
            catch (err) {
                throw new Error(`Falha na integração Stripe: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        if (['multicaixa_express', 'multicaixa_ref', 'paypay'].includes(provider)) {
            throw new Error('PROVIDER_NOT_CONFIGURED: Este gateway ainda não foi integrado e homologado. Nenhuma cobrança foi iniciada.');
        }
        // 5. PIX Provider (Mercado Pago API)
        if (provider === 'pix') {
            if (!env.MERCADO_PAGO_ACCESS_TOKEN) {
                throw new Error('PROVIDER_NOT_CONFIGURED: Gateway PIX / Mercado Pago (MERCADO_PAGO_ACCESS_TOKEN) não configurado no ambiente.');
            }
            try {
                const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
                    method: 'POST', signal: AbortSignal.timeout(15000),
                    headers: {
                        'Authorization': `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': sessionId
                    },
                    body: JSON.stringify({
                        transaction_amount: pkg.priceBrl,
                        description: `UNION.AI - ${pkg.credits} Créditos (${pkg.label})`,
                        payment_method_id: 'pix',
                        payer: {
                            email: `${userId}@union.ai`
                        },
                        metadata: {
                            userId,
                            packageId: pkg.id,
                            credits: pkg.credits
                        }
                    })
                });
                if (!mpRes.ok) {
                    const errData = await mpRes.json().catch(() => ({}));
                    throw new Error(`Erro Mercado Pago PIX: ${(errData as any).message || mpRes.statusText}`);
                }
                const mpData = (await mpRes.json()) as any;
                const pixCopiaECola = mpData.point_of_interaction?.transaction_data?.qr_code;
                const pixQrCode = mpData.point_of_interaction?.transaction_data?.qr_code_base64
                    ? `data:image/png;base64,${mpData.point_of_interaction.transaction_data.qr_code_base64}`
                    : undefined;
                // Record pending checkout
                try {
                    (await db.prepare(`
            INSERT INTO processed_payments (
              id, provider, provider_payment_id, user_id, package_id,
              amount_paid, credits_amount, status, metadata_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(randomUUID(), 'pix', String(mpData.id), userId, pkg.id, pkg.priceBrl, pkg.credits, 'PENDING', JSON.stringify({ pixCopiaECola }), Date.now()));
                }
                catch (dbErr) {
                    throw dbErr;
                }
                return {
                    provider: 'pix',
                    sessionId: String(mpData.id),
                    packageId: pkg.id,
                    credits: pkg.credits,
                    amountBrl: pkg.priceBrl,
                    amountAoa: pkg.priceAoa,
                    pixCopiaECola,
                    pixQrCode,
                    expiresAt
                };
            }
            catch (err) {
                throw new Error(`Falha ao gerar cobrança PIX: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        throw new Error(`Provedor de pagamento não suportado: "${provider}"`);
    }
    /**
     * Idempotent webhook processor for payments.
     */
    public static async processWebhook(provider: string, payload: any, signature?: string, rawBody?: Buffer): Promise<WebhookProcessResult> {
        const db = getOperationalDatabase();
        let paymentId: string, userId: string, packageId: string, amountPaid: number, currency: string, paid: boolean;
        if (provider === 'stripe') {
            if (!env.STRIPE_WEBHOOK_SECRET || !signature || !rawBody)
                throw new Error('WEBHOOK_SIGNATURE_REQUIRED');
            const event = new Stripe(env.STRIPE_SECRET_KEY || 'sk_webhook_validation').webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
            if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type))
                return { success: true, duplicate: false, credited: false, paymentId: event.id };
            const session = event.data.object as Stripe.Checkout.Session;
            paymentId = session.id;
            userId = session.client_reference_id || session.metadata?.userId || '';
            packageId = session.metadata?.packageId || '';
            amountPaid = (session.amount_total || 0) / 100;
            currency = session.currency || '';
            paid = session.payment_status === 'paid';
            payload = event;
        }
        else if (provider === 'pix') {
            if (!env.MERCADO_PAGO_ACCESS_TOKEN)
                throw new Error('PROVIDER_NOT_CONFIGURED: MERCADO_PAGO_ACCESS_TOKEN');
            const id = String(payload.data?.id || payload.id || '');
            if (!/^\d+$/.test(id))
                throw new Error('INVALID_PAYMENT_ID');
            // Notification is a hint only. Never trust inbound status, amount or ownership.
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${env.MERCADO_PAGO_ACCESS_TOKEN}` }, signal: AbortSignal.timeout(10000) });
            if (!response.ok)
                throw new Error('PAYMENT_VERIFICATION_FAILED');
            payload = await response.json();
            paymentId = String(payload.id);
            if (paymentId !== id)
                throw new Error('PAYMENT_ID_MISMATCH');
            userId = payload.metadata?.userId || payload.metadata?.user_id || '';
            packageId = payload.metadata?.packageId || payload.metadata?.package_id || '';
            amountPaid = Number(payload.transaction_amount);
            currency = String(payload.currency_id).toLowerCase();
            paid = payload.status === 'approved';
        }
        else
            throw new Error('PROVIDER_NOT_CONFIGURED: Gateway sem integração homologada');
        if (!paid)
            return { success: true, duplicate: false, credited: false, paymentId };
        const pkg = CREDIT_PACKAGES[packageId];
        if (!pkg || !userId || currency !== 'brl' || Math.round(amountPaid * 100) !== pkg.priceCentsBrl)
            throw new Error('PAYMENT_AMOUNT_OR_METADATA_INVALID');
        return (await db.transaction(async () => {
            await db.lock(`payment:${provider}:${paymentId}`);
            const existing = await db.prepare('SELECT id, provider, user_id, package_id, status FROM processed_payments WHERE provider_payment_id = ?').get(paymentId);
            if (existing && (existing.provider !== provider || existing.user_id !== userId || existing.package_id !== packageId))
                throw new Error('PAYMENT_OWNERSHIP_MISMATCH');
            if (existing?.status === 'PAID')
                return { success: true, duplicate: true, credited: false, paymentId };
            if (existing)
                await db.prepare("UPDATE processed_payments SET status = 'PAID', metadata_json = ?, amount_paid = ? WHERE id = ?").run(JSON.stringify(payload), amountPaid, existing.id);
            else
                await db.prepare(`INSERT INTO processed_payments (id, provider, provider_payment_id, user_id, package_id, amount_paid, credits_amount, status, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?)`).run(randomUUID(), provider, paymentId, userId, pkg.id, amountPaid, pkg.credits, JSON.stringify(payload), Date.now());
            await creditsService.addCredits(userId, pkg.credits, { type: 'TOPUP', description: `Pagamento confirmado ${provider}: ${paymentId}` });
            return { success: true, duplicate: false, credited: true, paymentId, userId, creditsAdded: pkg.credits };
        })());
    }
}
