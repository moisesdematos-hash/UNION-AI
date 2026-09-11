import { z } from 'zod';

export const AwarenessLevelEnum = z.enum([
  'UNAWARE',
  'PROBLEM_AWARE',
  'SOLUTION_AWARE',
  'PRODUCT_AWARE',
  'MOST_AWARE'
]);

export type AwarenessLevel = z.infer<typeof AwarenessLevelEnum>;

export const AvatarProfileSchema = z.object({
  name: z.string(),
  niche: z.string(),
  demographics: z.object({
    ageRange: z.string(),
    occupation: z.string(),
    incomeLevel: z.string()
  }),
  corePains: z.array(z.string()).min(1),
  desires: z.array(z.string()).min(1),
  objections: z.array(z.string()).min(1),
  awarenessLevel: AwarenessLevelEnum,
  voiceOfCustomer: z.array(z.string())
});

export type AvatarProfile = z.infer<typeof AvatarProfileSchema>;

export const CompetitorAnalysisSchema = z.object({
  competitorName: z.string(),
  valueProposition: z.string(),
  strengths: z.array(z.string()),
  vulnerabilities: z.array(z.string()),
  uniqueMechanism: z.string(),
  pricingAndOffer: z.string(),
  marketGaps: z.array(z.string())
});

export type CompetitorAnalysis = z.infer<typeof CompetitorAnalysisSchema>;

export const VslStepSchema = z.object({
  stepNumber: z.number().int().min(1).max(12),
  title: z.string(),
  scriptContent: z.string(),
  visualDirection: z.string().optional()
});

export type VslStep = z.infer<typeof VslStepSchema>;

export const VslScriptSchema = z.object({
  title: z.string(),
  targetDuration: z.string(),
  steps: z.array(VslStepSchema).length(12),
  fullScript: z.string()
});

export type VslScript = z.infer<typeof VslScriptSchema>;

export const AdCreativeSchema = z.object({
  id: z.string(),
  platform: z.enum(['meta', 'google', 'tiktok']),
  hook: z.string(),
  headline: z.string(),
  body: z.string(),
  cta: z.string()
});

export type AdCreative = z.infer<typeof AdCreativeSchema>;

export const AdsMatrixSchema = z.object({
  campaignName: z.string(),
  creatives: z.array(AdCreativeSchema)
});

export type AdsMatrix = z.infer<typeof AdsMatrixSchema>;

export const SalesPageFaqItemSchema = z.object({
  question: z.string(),
  answer: z.string()
});

export const SalesPageCopySchema = z.object({
  title: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  problem: z.string(),
  consequences: z.string(),
  opportunity: z.string(),
  mechanism: z.string(),
  benefits: z.array(z.string()).min(1),
  proof: z.array(z.string()).min(1),
  offer: z.string(),
  bonuses: z.array(z.string()).default([]),
  guarantee: z.string(),
  objections: z.array(z.string()).default([]),
  faq: z.array(SalesPageFaqItemSchema).default([]),
  cta: z.string()
});

export type SalesPageCopy = z.infer<typeof SalesPageCopySchema>;

