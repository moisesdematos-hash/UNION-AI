import { z } from 'zod';

export const TemperatureRatingEnum = z.enum([
  'HOT',        // Altíssima persuasão, desejo imediato
  'WARM',       // Relevante, mantém atenção
  'COLD',       // Monótono, clichê, risco de desinteresse
  'DROP_OFF'    // Ponto de ruptura, desconfiança ou objeção letal
]);

export type TemperatureRating = z.infer<typeof TemperatureRatingEnum>;

export const PersonaArchetypeEnum = z.enum([
  'SKEPTIC',       // O Cético que odeia promessas exageradas e busca provas
  'BUSY_EXECUTIVE',// O Ocupado que quer objetividade e benefício rápido
  'BUDGET_SAVER',  // O Econômico extremamente sensível a preço e risco
  'ANALYTICAL',    // O Detalhista que analisa especificações e processo
  'EMOTIONAL'      // O Impulsivo movido por status, alívio de dor e imediatismo
]);

export type PersonaArchetype = z.infer<typeof PersonaArchetypeEnum>;

export const SyntheticPersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  archetype: PersonaArchetypeEnum,
  description: z.string(),
  skepticismLevel: z.number().min(1).max(10), // 1 a 10
  decisionDriver: z.string(),
  verdict: z.enum(['BUY', 'CONSIDER', 'LEAVE']),
  primaryObjection: z.string().optional(),
  quote: z.string()
});

export type SyntheticPersona = z.infer<typeof SyntheticPersonaSchema>;

export const BlockEvaluationSchema = z.object({
  blockIndex: z.number().nonnegative(),
  blockName: z.string(),
  originalSnippet: z.string(),
  rating: TemperatureRatingEnum,
  score: z.number().min(0).max(10),
  persuasionStrength: z.string(),
  frictionPoints: z.array(z.string()).default([]),
  suggestedImprovement: z.string()
});

export type BlockEvaluation = z.infer<typeof BlockEvaluationSchema>;

export const ConversionSimulationResultSchema = z.object({
  id: z.string(),
  campaignName: z.string(),
  conversionProbabilityScore: z.number().min(0).max(100), // CPS Score 0 a 100
  estimatedConversionRate: z.string(),                   // ex: "4.2% - 6.8%"
  retentionIndex: z.number().min(0).max(100),            // % de pessoas que chegam até a oferta
  summaryVerdict: z.string(),
  personas: z.array(SyntheticPersonaSchema),
  heatmap: z.array(BlockEvaluationSchema),
  topStrengths: z.array(z.string()),
  topFatalFlaws: z.array(z.string()),
  autoHealingAvailable: z.boolean().default(true),
  timestamp: z.number()
});

export type ConversionSimulationResult = z.infer<typeof ConversionSimulationResultSchema>;
