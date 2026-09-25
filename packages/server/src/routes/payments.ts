import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { PaymentService, CREDIT_PACKAGES } from '../services/payment/payment-service.js';

export const paymentsRouter = Router();

const CheckoutSchema = z.object({
  packageId: z.string().min(1),
  provider: z.enum(['stripe', 'pix', 'multicaixa_express', 'multicaixa_ref', 'paypay']).default('pix'),
  phone: z.string().optional()
});

/**
 * GET /api/payments/packages
 * Returns the public pricing and credit catalog.
 */
paymentsRouter.get('/packages', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: Object.values(CREDIT_PACKAGES)
  });
});

/**
 * POST /api/payments/checkout
 * Initiates an authentic payment flow (Stripe, PIX, Multicaixa Express, Multicaixa Ref, or PayPay).
 */
paymentsRouter.post('/checkout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { packageId, provider, phone } = CheckoutSchema.parse(req.body);

    const session = await PaymentService.createCheckout(userId, packageId, provider, { phone });

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao iniciar checkout'
    });
  }
});

/**
 * POST /api/payments/webhook/:provider
 * Idempotent webhook receiver for Stripe, PIX, Multicaixa (Express / Ref), and PayPay AO.
 */
paymentsRouter.post('/webhook/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const allowedProviders = ['stripe', 'pix', 'multicaixa', 'multicaixa_express', 'multicaixa_ref', 'paypay'];
    if (!allowedProviders.includes(provider)) {
      return res.status(400).json({ success: false, error: 'Provedor de pagamento não suportado' });
    }

    const signature = (req.headers['stripe-signature'] || req.headers['x-signature']) as string | undefined;
    const result = await PaymentService.processWebhook(provider, req.body, signature);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao processar webhook'
    });
  }
});
