import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { creditsService } from '../services/credits-service.js';
import { TopupRequestSchema } from '@union/shared';

export const creditsRouter = Router();

// All credits routes require authenticated user
creditsRouter.use(requireAuth);

/**
 * GET /api/credits/balance
 * Returns the current credit balance and consumption statistics.
 */
creditsRouter.get('/balance', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const credits = creditsService.getUserCredits(userId);
    res.json({
      success: true,
      data: credits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credit balance'
    });
  }
});

/**
 * GET /api/credits/transactions
 * Returns the audit trail of credit transactions.
 */
creditsRouter.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const transactions = creditsService.listTransactions(userId, isNaN(limit) ? 50 : limit);
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch credit transactions'
    });
  }
});

/**
 * POST /api/credits/topup
 * Add credits to user wallet (mocking payment gateway integration like Stripe/Pix).
 */
creditsRouter.post('/topup', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = TopupRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid topup request payload',
        details: parsed.error.issues
      });
    }

    const { amount, packageId, description } = parsed.data;

    if (amount > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Topup amount exceeds maximum allowed single transaction quota (10,000 credits)'
      });
    }

    const desc = description || (packageId ? `Credit Refill (${packageId})` : `Credit Refill (+${amount} cr)`);

    const updatedCredits = creditsService.addCredits(userId, amount, {
      type: 'TOPUP',
      description: desc
    });

    res.json({
      success: true,
      data: updatedCredits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process credit topup'
    });
  }
});

/**
 * POST /api/credits/check-quota
 * Checks if current user balance can cover the estimated execution cost.
 */
creditsRouter.post('/check-quota', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const estimatedCost = typeof req.body.estimatedCost === 'number' ? req.body.estimatedCost : 0;
    const quota = creditsService.checkQuota(userId, estimatedCost);

    if (!quota.allowed) {
      return res.status(402).json({
        success: false,
        error: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits balance (${quota.balance} cr available, ${estimatedCost} cr needed). Shortfall: ${quota.shortfall} cr.`,
        data: quota
      });
    }

    res.json({
      success: true,
      data: quota
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify quota'
    });
  }
});

