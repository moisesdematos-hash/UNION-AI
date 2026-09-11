import { describe, it, expect } from 'vitest';
import {
  SyntheticPersonaSchema,
  BlockEvaluationSchema,
  ConversionSimulationResultSchema,
  ConversionSimulationResult
} from '../types/simulation.js';

describe('AI Conversion Simulator - Types & Zod Schemas', () => {
  it('validates a synthetic persona successfully', () => {
    const persona = {
      id: 'p-skeptic',
      name: 'Dr. Roberto (O Cético)',
      archetype: 'SKEPTIC',
      description: 'Engenheiro sênior que busca dados empíricos e odeia chavões de marketing',
      skepticismLevel: 9,
      decisionDriver: 'Provas científicas, estudos de caso com métricas e garantia real',
      verdict: 'CONSIDER',
      primaryObjection: 'Cadê os benchmarks de latência e consumo de créditos?',
      quote: 'Se não tiver evidência real no código, não compro.'
    };

    const parsed = SyntheticPersonaSchema.parse(persona);
    expect(parsed.skepticismLevel).toBe(9);
    expect(parsed.archetype).toBe('SKEPTIC');
    expect(parsed.verdict).toBe('CONSIDER');
  });

  it('validates a block evaluation with psychological heatmap rating', () => {
    const blockEval = {
      blockIndex: 6,
      blockName: 'Bloco 7: Oferta Irresistível & Empilhamento',
      originalSnippet: 'Por apenas 12x de R$ 97 você leva o pacote completo com bônus...',
      rating: 'HOT',
      score: 8.8,
      persuasionStrength: 'Ancoragem de preço agressiva com contraste de valor claro',
      frictionPoints: ['Falta esclarecer política de cancelamento imediato'],
      suggestedImprovement: 'Adicionar garantia incondicional de 30 dias com devolução em 1 clique.'
    };

    const parsed = BlockEvaluationSchema.parse(blockEval);
    expect(parsed.rating).toBe('HOT');
    expect(parsed.score).toBe(8.8);
    expect(parsed.frictionPoints.length).toBe(1);
  });

  it('validates a full conversion simulation result with CPS score', () => {
    const result: ConversionSimulationResult = {
      id: 'sim-12345',
      campaignName: 'Funil SaaS Enterprise UNION.AI',
      conversionProbabilityScore: 86,
      estimatedConversionRate: '4.8% - 7.2%',
      retentionIndex: 78,
      summaryVerdict: 'Campanha de altíssimo potencial de tração com mínima fricção no fechamento.',
      personas: [
        {
          id: 'p-1',
          name: 'Ana Lívia (A Decisora Ocupada)',
          archetype: 'BUSY_EXECUTIVE',
          description: 'CMO sem tempo para ler páginas longas',
          skepticismLevel: 6,
          decisionDriver: 'Velocidade de implantação',
          verdict: 'BUY',
          quote: 'Resolve meu problema de escala em minutos.'
        }
      ],
      heatmap: [
        {
          blockIndex: 0,
          blockName: 'Bloco 1: Headline Magnética',
          originalSnippet: 'Transforme Dados Reais em Funis Completos em Menos de 3 Minutos',
          rating: 'HOT',
          score: 9.5,
          persuasionStrength: 'Promessa clara com especificidade temporal',
          frictionPoints: [],
          suggestedImprovement: 'Manter.'
        }
      ],
      topStrengths: ['Velocidade da promessa', 'Clareza da pilha de valor'],
      topFatalFlaws: ['Garantia pode ser mais enfatizada no checkout'],
      autoHealingAvailable: true,
      timestamp: Date.now()
    };

    const parsed = ConversionSimulationResultSchema.parse(result);
    expect(parsed.conversionProbabilityScore).toBe(86);
    expect(parsed.heatmap[0].rating).toBe('HOT');
    expect(parsed.personas[0].verdict).toBe('BUY');
  });
});
