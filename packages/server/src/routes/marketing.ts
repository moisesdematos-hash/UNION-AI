import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { MarketingEngine } from '../services/marketing/marketing-engine.js';
import { creditsService } from '../services/credits-service.js';

export const marketingRouter = Router();

// All marketing intelligence endpoints require authentication
marketingRouter.use(requireAuth);

const AvatarRequestSchema = z.object({
  context: z.string().min(1)
});

const CompetitorRequestSchema = z.object({
  competitorData: z.string().min(1)
});

const VslRequestSchema = z.object({
  context: z.string().min(1),
  avatar: z.record(z.unknown()).optional(),
  targetDuration: z.string().optional()
});

const AdsRequestSchema = z.object({
  sourceText: z.string().min(1),
  campaignName: z.string().optional()
});

/**
 * POST /api/marketing/avatar
 * Generates an in-depth customer persona and ICP profile.
 */
marketingRouter.post('/avatar', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { context } = AvatarRequestSchema.parse(req.body);

    const execution = await MarketingEngine.generateAvatar(context);

    let creditsRemaining: number | undefined;
    if (execution.creditsCost > 0) {
      const deduction = creditsService.deductCredits(userId, execution.creditsCost, {
        description: `Marketing Intelligence: Avatar Profile (${execution.tokens.totalTokens} tokens)`
      });
      creditsRemaining = deduction.newBalance;
    }

    res.status(200).json({
      success: true,
      data: {
        ...execution,
        creditsRemaining
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate avatar profile'
    });
  }
});

/**
 * POST /api/marketing/competitor
 * Generates competitor benchmarking, SWOT and market gap analysis.
 */
marketingRouter.post('/competitor', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { competitorData } = CompetitorRequestSchema.parse(req.body);

    const execution = await MarketingEngine.generateCompetitorAnalysis(competitorData);

    let creditsRemaining: number | undefined;
    if (execution.creditsCost > 0) {
      const deduction = creditsService.deductCredits(userId, execution.creditsCost, {
        description: `Marketing Intelligence: Competitor Analysis (${execution.tokens.totalTokens} tokens)`
      });
      creditsRemaining = deduction.newBalance;
    }

    res.status(200).json({
      success: true,
      data: {
        ...execution,
        creditsRemaining
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate competitor analysis'
    });
  }
});

/**
 * POST /api/marketing/vsl
 * Generates a full 12-Step Video Sales Letter (VSL) script.
 */
marketingRouter.post('/vsl', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = VslRequestSchema.parse(req.body);

    const execution = await MarketingEngine.generateVslScript(data);

    let creditsRemaining: number | undefined;
    if (execution.creditsCost > 0) {
      const deduction = creditsService.deductCredits(userId, execution.creditsCost, {
        description: `Marketing Intelligence: 12-Step VSL Script (${execution.tokens.totalTokens} tokens)`
      });
      creditsRemaining = deduction.newBalance;
    }

    res.status(200).json({
      success: true,
      data: {
        ...execution,
        creditsRemaining
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate VSL script'
    });
  }
});

/**
 * POST /api/marketing/ads
 * Generates multi-platform ad matrix (Meta, Google, TikTok).
 */
marketingRouter.post('/ads', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = AdsRequestSchema.parse(req.body);

    const execution = await MarketingEngine.generateAdsMatrix(data);

    let creditsRemaining: number | undefined;
    if (execution.creditsCost > 0) {
      const deduction = creditsService.deductCredits(userId, execution.creditsCost, {
        description: `Marketing Intelligence: Multi-Platform Ads (${execution.tokens.totalTokens} tokens)`
      });
      creditsRemaining = deduction.newBalance;
    }

    res.status(200).json({
      success: true,
      data: {
        ...execution,
        creditsRemaining
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate ads matrix'
    });
  }
});
