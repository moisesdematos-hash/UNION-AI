import { z } from 'zod';
import { AiModel, AiNodeRole, AiProviderName } from './ai.js';

export type RouterOptimizationGoal = 'cost' | 'speed' | 'quality' | 'balanced';
export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'extreme';

export interface AiRouterCriteria {
  role?: AiNodeRole;
  optimizeFor: RouterOptimizationGoal;
  taskComplexity?: TaskComplexity;
  promptLength?: number;
  expectedOutputLength?: number;
  maxCostPerCall?: number;
  allowDeepReasoning?: boolean;
}

export interface BenchmarkComparison {
  premiumModel: AiModel;
  premiumCost: number;
  savingsAmount: number;
  savingsPercent: number;
}

export interface ModelRecommendation {
  recommendedModel: AiModel;
  provider: AiProviderName;
  priority: RouterOptimizationGoal;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  benchmarkComparison: BenchmarkComparison;
  reasoning: string;
  confidenceScore: number;
}

export interface BranchClassification {
  branch: 'fast' | 'balanced' | 'deep';
  category: 'copywriting' | 'analytics' | 'summarization' | 'general';
  confidence: number;
  detectedKeywords: string[];
  recommendedModel: AiModel;
}

export const AiRouterCriteriaSchema = z.object({
  role: z.enum(['ai-chat', 'ai-writer', 'ai-analyst', 'ai-summarizer', 'ai-vision', 'ai-router']).optional(),
  optimizeFor: z.enum(['cost', 'speed', 'quality', 'balanced']).default('balanced'),
  taskComplexity: z.enum(['simple', 'moderate', 'complex', 'extreme']).optional(),
  promptLength: z.number().nonnegative().optional(),
  expectedOutputLength: z.number().nonnegative().optional(),
  maxCostPerCall: z.number().positive().optional(),
  allowDeepReasoning: z.boolean().optional()
});

export const TaskClassificationRequestSchema = z.object({
  text: z.string().min(1),
  optimizeFor: z.enum(['cost', 'speed', 'quality', 'balanced']).default('balanced')
});
