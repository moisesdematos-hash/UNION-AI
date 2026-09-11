import {
  AiModel,
  MODEL_PRICING_CATALOG,
  calculateModelCreditCost
} from '../types/ai.js';
import {
  AiRouterCriteria,
  ModelRecommendation,
  BranchClassification
} from '../types/ai-router.js';

export class AiRouterEngine {
  /**
   * Recommends the optimal AI model based on multi-dimensional criteria (cost, speed, quality, complexity).
   */
  public static recommendModel(criteria: AiRouterCriteria): ModelRecommendation {
    const role = criteria.role || 'ai-chat';
    const goal = criteria.optimizeFor || 'balanced';
    const complexity = criteria.taskComplexity || 'moderate';

    let recommendedModel: AiModel = 'gpt-4o';
    let reasoning = '';
    let confidenceScore = 0.92;

    switch (goal) {
      case 'cost':
        if (role === 'ai-summarizer') {
          recommendedModel = 'gemini-1-5-flash';
          reasoning = 'Gemini 1.5 Flash oferece o menor custo de processamento com janela de contexto maciça.';
        } else if (role === 'ai-analyst') {
          recommendedModel = 'deepseek-chat';
          reasoning = 'DeepSeek V3 entrega alta capacidade analítica com custo extremamente reduzido ($0.14/M).';
        } else {
          recommendedModel = 'gpt-4o-mini';
          reasoning = 'GPT-4o Mini é otimizado para tarefas econômicas mantendo alta coerência semântica.';
        }
        confidenceScore = 0.95;
        break;

      case 'speed':
        if (role === 'ai-router') {
          recommendedModel = 'groq-llama-3';
          reasoning = 'Groq Llama 3 70B oferece a menor latência do mercado (>300 t/s) para classificação instantânea.';
        } else {
          recommendedModel = 'gemini-1-5-flash';
          reasoning = 'Gemini 1.5 Flash possui latência ultra-baixa de TTFT para execução em tempo real.';
        }
        confidenceScore = 0.96;
        break;

      case 'quality':
        if (role === 'ai-writer') {
          recommendedModel = 'claude-3-7-sonnet';
          reasoning = 'Claude 3.7 Sonnet é o padrão ouro de mercado para copy persuasiva, retenção e criatividade.';
        } else if (role === 'ai-analyst') {
          recommendedModel = 'deepseek-r1';
          reasoning = 'DeepSeek R1 utiliza cadeia de raciocínio profundo (CoT) para diagnósticos de mercado cirúrgicos.';
        } else {
          recommendedModel = 'gpt-4o';
          reasoning = 'OpenAI GPT-4o oferece o benchmark mais equilibrado para tarefas analíticas complexas.';
        }
        confidenceScore = 0.98;
        break;

      case 'balanced':
      default:
        if (complexity === 'simple') {
          recommendedModel = 'gpt-4o-mini';
          reasoning = 'Complexidade simples detectada: GPT-4o Mini entrega 98% da qualidade de modelos topo com 94% de economia.';
        } else if (role === 'ai-writer') {
          recommendedModel = 'claude-3-7-sonnet';
          reasoning = 'Redação de alta conversão exige nuance textual; Claude 3.7 Sonnet selecionado pelo equilíbrio retorno/qualidade.';
        } else if (role === 'ai-analyst') {
          recommendedModel = 'deepseek-r1';
          reasoning = 'Análise de mercado com DeepSeek R1 oferece poder de raciocínio com custo 70% menor que modelos proprietários.';
        } else if (role === 'ai-summarizer') {
          recommendedModel = 'gemini-1-5-flash';
          reasoning = 'Síntese de conteúdo com Gemini 1.5 Flash combina velocidade supersônica com custo irrisório.';
        } else {
          recommendedModel = 'gpt-4o';
          reasoning = 'Modelo versátil de referência para tarefas multi-propósito.';
        }
        confidenceScore = 0.93;
        break;
    }

    // Token & Cost Estimation
    const promptLen = criteria.promptLength || 600;
    const outputLen = criteria.expectedOutputLength || 1000;
    const estimatedInputTokens = Math.max(10, Math.ceil(promptLen / 4));
    const estimatedOutputTokens = Math.max(10, Math.ceil(outputLen / 4));

    const estimatedCost = calculateModelCreditCost(
      recommendedModel,
      estimatedInputTokens,
      estimatedOutputTokens
    );

    const premiumCost = calculateModelCreditCost(
      'gpt-4o',
      estimatedInputTokens,
      estimatedOutputTokens
    );

    const savingsAmount = Math.max(0, Math.round((premiumCost - estimatedCost) * 100000) / 100000);
    const savingsPercent = premiumCost > 0 ? Math.round((savingsAmount / premiumCost) * 100) : 0;

    const provider = MODEL_PRICING_CATALOG[recommendedModel].provider;

    return {
      recommendedModel,
      provider,
      priority: goal,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCost,
      benchmarkComparison: {
        premiumModel: 'gpt-4o',
        premiumCost,
        savingsAmount,
        savingsPercent
      },
      reasoning,
      confidenceScore
    };
  }

  /**
   * Semantically classifies incoming prompt/task and determines execution branch and category.
   */
  public static classifyTask(text: string, optimizeFor: 'cost' | 'speed' | 'quality' | 'balanced' = 'balanced'): BranchClassification {
    const lower = text.toLowerCase();

    const analyticsKeywords = ['swot', 'avatar', 'dor', 'desejo', 'métrica', 'kpi', 'concorrente', 'análise', 'mercado', 'persona'];
    const copywritingKeywords = ['vsl', 'carrossel', 'roteiro', 'script', 'copy', 'headline', 'gancho', 'vendas', 'retencao', 'oferta'];
    const summarizationKeywords = ['resumo', 'tldr', 'sintetize', 'principais pontos', 'bullets', 'sumarize', 'extraia'];

    const matchedAnalytics = analyticsKeywords.filter((kw) => lower.includes(kw));
    const matchedCopywriting = copywritingKeywords.filter((kw) => lower.includes(kw));
    const matchedSummarization = summarizationKeywords.filter((kw) => lower.includes(kw));

    if (matchedAnalytics.length >= matchedCopywriting.length && matchedAnalytics.length >= matchedSummarization.length && matchedAnalytics.length > 0) {
      return {
        branch: 'deep',
        category: 'analytics',
        confidence: Math.min(0.98, 0.75 + matchedAnalytics.length * 0.05),
        detectedKeywords: matchedAnalytics,
        recommendedModel: optimizeFor === 'cost' ? 'deepseek-chat' : 'deepseek-r1'
      };
    }

    if (matchedCopywriting.length >= matchedSummarization.length && matchedCopywriting.length > 0) {
      return {
        branch: 'balanced',
        category: 'copywriting',
        confidence: Math.min(0.98, 0.75 + matchedCopywriting.length * 0.05),
        detectedKeywords: matchedCopywriting,
        recommendedModel: optimizeFor === 'cost' ? 'gpt-4o-mini' : 'claude-3-7-sonnet'
      };
    }

    if (matchedSummarization.length > 0) {
      return {
        branch: 'fast',
        category: 'summarization',
        confidence: Math.min(0.98, 0.75 + matchedSummarization.length * 0.05),
        detectedKeywords: matchedSummarization,
        recommendedModel: 'gemini-1-5-flash'
      };
    }

    // Default general
    return {
      branch: 'balanced',
      category: 'general',
      confidence: 0.80,
      detectedKeywords: [],
      recommendedModel: optimizeFor === 'cost' ? 'gpt-4o-mini' : 'gpt-4o'
    };
  }
}
