import { z } from 'zod';

export type AiProviderName = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq' | 'local';

export type AiModel =
  | 'auto'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-7-sonnet'
  | 'claude-3-5-haiku'
  | 'gemini-1-5-pro'
  | 'gemini-1-5-flash'
  | 'deepseek-r1'
  | 'deepseek-chat'
  | 'groq-llama-3';

export type AiNodeRole =
  | 'ai-chat'
  | 'ai-writer'
  | 'ai-analyst'
  | 'ai-summarizer'
  | 'ai-vision'
  | 'ai-router';

export type WriterOutputFormat =
  | 'youtube-script'
  | 'instagram-carousel'
  | 'vsl-12-step'
  | 'ebook-chapter'
  | 'sales-page-copy';

export interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
  provider: AiProviderName;
  displayName: string;
}

export const MODEL_PRICING_CATALOG: Record<AiModel, ModelPricing> = {
  auto: {
    inputPer1k: 0.001,
    outputPer1k: 0.003,
    provider: 'local',
    displayName: 'Auto Router (Smart)'
  },
  'gpt-4o': {
    inputPer1k: 0.0025,
    outputPer1k: 0.01,
    provider: 'openai',
    displayName: 'OpenAI GPT-4o'
  },
  'gpt-4o-mini': {
    inputPer1k: 0.00015,
    outputPer1k: 0.0006,
    provider: 'openai',
    displayName: 'OpenAI GPT-4o Mini'
  },
  'claude-3-7-sonnet': {
    inputPer1k: 0.003,
    outputPer1k: 0.015,
    provider: 'anthropic',
    displayName: 'Anthropic Claude 3.7 Sonnet'
  },
  'claude-3-5-haiku': {
    inputPer1k: 0.0008,
    outputPer1k: 0.004,
    provider: 'anthropic',
    displayName: 'Anthropic Claude 3.5 Haiku'
  },
  'gemini-1-5-pro': {
    inputPer1k: 0.00125,
    outputPer1k: 0.005,
    provider: 'google',
    displayName: 'Google Gemini 1.5 Pro'
  },
  'gemini-1-5-flash': {
    inputPer1k: 0.000075,
    outputPer1k: 0.0003,
    provider: 'google',
    displayName: 'Google Gemini 1.5 Flash'
  },
  'deepseek-r1': {
    inputPer1k: 0.00055,
    outputPer1k: 0.00219,
    provider: 'deepseek',
    displayName: 'DeepSeek R1 (Reasoning)'
  },
  'deepseek-chat': {
    inputPer1k: 0.00014,
    outputPer1k: 0.00028,
    provider: 'deepseek',
    displayName: 'DeepSeek V3 Chat'
  },
  'groq-llama-3': {
    inputPer1k: 0.00059,
    outputPer1k: 0.00079,
    provider: 'groq',
    displayName: 'Groq Llama 3.3 70B'
  }
};

export const AiPromptRequestSchema = z.object({
  nodeId: z.string().optional(),
  role: z.enum(['ai-chat', 'ai-writer', 'ai-analyst', 'ai-summarizer', 'ai-vision', 'ai-router']),
  model: z.enum([
    'auto',
    'gpt-4o',
    'gpt-4o-mini',
    'claude-3-7-sonnet',
    'claude-3-5-haiku',
    'gemini-1-5-pro',
    'gemini-1-5-flash',
    'deepseek-r1',
    'deepseek-chat',
    'groq-llama-3'
  ]).default('auto'),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1),
  context: z.unknown().optional(),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    format: z.string().optional()
  }).optional()
});

export type AiPromptRequest = z.infer<typeof AiPromptRequestSchema>;

export interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiExecutionResult {
  role: AiNodeRole;
  modelUsed: AiModel;
  provider: AiProviderName;
  content: string;
  structured?: Record<string, unknown>;
  tokens: TokenMetrics;
  creditsCost: number;
  durationMs: number;
}

/**
 * Calculates credit cost based on model and token counts.
 */
export function calculateModelCreditCost(
  model: AiModel,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING_CATALOG[model] || MODEL_PRICING_CATALOG.auto;
  const inputCost = (promptTokens / 1000) * pricing.inputPer1k;
  const outputCost = (completionTokens / 1000) * pricing.outputPer1k;
  const rawTotal = inputCost + outputCost;
  // Round to 5 decimal places with a minimum floor of $0.0001
  return Math.max(0.0001, Math.round(rawTotal * 100000) / 100000);
}
