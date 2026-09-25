import { Router, Response } from 'express';
import { z } from 'zod';
import { SalesPageCopySchema } from '@union/shared';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { MarketingEngine } from '../services/marketing/marketing-engine.js';
import { SimulationEngine } from '../services/marketing/simulation-engine.js';
import { SalesPageRenderer } from '../services/marketing/sales-page-renderer.js';
import { creditsService } from '../services/credits-service.js';
import { getDatabase } from '../db/database.js';

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

const RenderSalesPageSchema = z.object({
  copy: SalesPageCopySchema,
  checkoutUrl: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional(),
  customTitle: z.string().optional()
});

const PublishSalesPageSchema = z.object({
  copy: SalesPageCopySchema,
  slug: z.string().optional(),
  checkoutUrl: z.string().optional(),
  theme: z.enum(['dark', 'light']).optional(),
  customTitle: z.string().optional()
});

// SQLite-backed persistent published sales pages store
export interface PublishedSalesPage {
  slug: string;
  userId: string;
  copy: any;
  html: string;
  checkoutUrl: string;
  publishedAt: string;
  views: number;
}

class PublishedPagesStore {
  private memCache = new Map<string, PublishedSalesPage>();

  public get(slug: string): PublishedSalesPage | undefined {
    try {
      const db = getDatabase();
      const row = db.prepare('SELECT * FROM published_sales_pages WHERE slug = ?').get(slug) as any;
      if (row) {
        const record: PublishedSalesPage = {
          slug: row.slug,
          userId: row.user_id,
          copy: JSON.parse(row.copy_json),
          html: row.html,
          checkoutUrl: row.checkout_url,
          publishedAt: row.published_at,
          views: row.views
        };
        this.memCache.set(slug, record);
        return record;
      }
    } catch {
      // Fallback to cache if DB unavailable
    }
    return this.memCache.get(slug);
  }

  public set(slug: string, record: PublishedSalesPage): this {
    this.memCache.set(slug, record);
    try {
      const db = getDatabase();
      db.prepare(`
        INSERT OR REPLACE INTO published_sales_pages (
          slug, user_id, copy_json, html, checkout_url, published_at, views
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.slug,
        record.userId,
        JSON.stringify(record.copy),
        record.html,
        record.checkoutUrl,
        record.publishedAt,
        record.views
      );
    } catch (err) {
      console.error('[PublishedPagesStore Persist Error]:', err);
    }
    return this;
  }

  public incrementViews(slug: string): void {
    const page = this.get(slug);
    if (page) {
      page.views += 1;
      try {
        const db = getDatabase();
        db.prepare('UPDATE published_sales_pages SET views = views + 1 WHERE slug = ?').run(slug);
      } catch {}
    }
  }

  public clear(): void {
    this.memCache.clear();
  }
}

export const publishedPagesStore = new PublishedPagesStore();

/**
 * POST /api/marketing/sales-page/render-html
 * Generates standalone HTML5 + Tailwind code for the 14-block copy.
 */
marketingRouter.post('/sales-page/render-html', (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = RenderSalesPageSchema.parse(req.body);
    const html = SalesPageRenderer.renderToHtml(data.copy, {
      checkoutUrl: data.checkoutUrl,
      theme: data.theme,
      customTitle: data.customTitle
    });

    res.status(200).json({
      success: true,
      data: {
        html,
        title: data.customTitle || data.copy.title || 'Página de Vendas',
        sizeBytes: Buffer.byteLength(html, 'utf8')
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to render sales page HTML'
    });
  }
});

/**
 * POST /api/marketing/sales-page/publish
 * Deploys sales page with a unique public URL slug.
 */
marketingRouter.post('/sales-page/publish', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = PublishSalesPageSchema.parse(req.body);

    const baseSlug = (data.slug || data.copy.title || 'oferta')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'oferta';

    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
    const checkoutUrl = data.checkoutUrl || '#checkout';

    const html = SalesPageRenderer.renderToHtml(data.copy, {
      checkoutUrl,
      theme: data.theme,
      customTitle: data.customTitle
    });

    const publishedRecord: PublishedSalesPage = {
      slug,
      userId,
      copy: data.copy,
      html,
      checkoutUrl,
      publishedAt: new Date().toISOString(),
      views: 0
    };

    publishedPagesStore.set(slug, publishedRecord);

    res.status(201).json({
      success: true,
      data: {
        slug,
        publicUrl: `/p/${slug}`,
        publishedAt: publishedRecord.publishedAt,
        title: data.customTitle || data.copy.title || 'Oferta Exclusiva'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish sales page'
    });
  }
});

