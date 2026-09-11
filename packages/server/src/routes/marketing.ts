import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { MarketingEngine } from '../services/marketing/marketing-engine.js';
import { SimulationEngine } from '../services/marketing/simulation-engine.js';
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

const SalesPageRequestSchema = z.object({
  context: z.string().min(1),
  productName: z.string().optional(),
  targetAudience: z.string().optional(),
  offerPrice: z.string().optional()
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

/**
 * POST /api/marketing/sales-page
 * Generates full 14-Block High-Converting Sales Page copy (UNION.AI 2.0 / Seção 27).
 */
marketingRouter.post('/sales-page', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = SalesPageRequestSchema.parse(req.body);

    const execution = await MarketingEngine.generateSalesPageCopy(data);

    let creditsRemaining: number | undefined;
    if (execution.creditsCost > 0) {
      const deduction = creditsService.deductCredits(userId, execution.creditsCost, {
        description: `Marketing Intelligence: 14-Block Sales Page Copy (${execution.tokens.totalTokens} tokens)`
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
      error: error instanceof Error ? error.message : 'Failed to generate sales page copy'
    });
  }
});

const SimulateConversionRequestSchema = z.object({
  title: z.string().optional(),
  sourceType: z.enum(['SALES_PAGE', 'VSL', 'CUSTOM_COPY']),
  blocks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    content: z.string()
  })),
  targetNiche: z.string().optional()
});

const AutoHealRequestSchema = z.object({
  blockId: z.string(),
  blockName: z.string(),
  originalContent: z.string(),
  personaArchetype: z.string(),
  frictionPoint: z.string(),
  suggestedAction: z.string()
});

/**
 * POST /api/marketing/simulate-conversion
 * Evaluates copy/VSL against 5 synthetic personas and returns Heatmap + CPS score.
 */
marketingRouter.post('/simulate-conversion', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = SimulateConversionRequestSchema.parse(req.body);

    const execution = await SimulationEngine.simulateConversion(data);

    let creditsRemaining: number | undefined;
    if (execution.creditsCost > 0) {
      const deduction = creditsService.deductCredits(userId, execution.creditsCost, {
        description: `Marketing Intelligence: AI Conversion Simulator (${execution.tokens.totalTokens} tokens)`
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
      error: error instanceof Error ? error.message : 'Failed to simulate conversion'
    });
  }
});

/**
 * POST /api/marketing/auto-heal-block
 * 1-Click Auto-Healing for cold/drop-off blocks.
 */
marketingRouter.post('/auto-heal-block', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = AutoHealRequestSchema.parse(_req.body);
    const result = await SimulationEngine.autoHealBlock(data);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-heal block'
    });
  }
});
