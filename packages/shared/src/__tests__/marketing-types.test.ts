import { describe, it, expect } from 'vitest';
import {
  AvatarProfileSchema,
  CompetitorAnalysisSchema,
  VslScriptSchema,
  AdsMatrixSchema
} from '../types/marketing.js';

describe('Gate 14: Shared Marketing Intelligence Schemas', () => {
  it('should validate complete AvatarProfile', () => {
    const validAvatar = {
      name: 'Especialista / Criador Autônomo',
      niche: 'Infoprodutos & Serviços High-Ticket',
      demographics: {
        ageRange: '28-45 anos',
        occupation: 'Infoprodutor, Mentor ou Dono de Agência',
        incomeLevel: 'R$ 15.000 - R$ 80.000/mês'
      },
      corePains: [
        'Gargalo operacional de criação',
        'Falta de consistência nos criativos',
        'Dependência de múltiplos freelancers caros'
      ],
      desires: [
        'Automatizar esteira de copy e criativos em escala',
        'Multiplicar volume de testes de anúncios sem gastar horas'
      ],
      objections: [
        'Achar que copy gerada por IA soa genérica',
        'Dificuldade de conectar ferramentas isoladas'
      ],
      awarenessLevel: 'PROBLEM_AWARE' as const,
      voiceOfCustomer: [
        'Não dou conta de gravar vídeo e ainda escrever copy todo dia',
        'Preciso de criativos novos toda semana para não saturar tráfego'
      ]
    };

    const parsed = AvatarProfileSchema.parse(validAvatar);
    expect(parsed.name).toBe('Especialista / Criador Autônomo');
    expect(parsed.corePains.length).toBe(3);
    expect(parsed.awarenessLevel).toBe('PROBLEM_AWARE');
  });

  it('should validate CompetitorAnalysis schema', () => {
    const competitor = {
      competitorName: 'Ferramenta X de Automação',
      valueProposition: 'Geração de copy com templates estáticos',
      strengths: ['Marca estabelecida no mercado', 'Preço baixo'],
      vulnerabilities: ['Sem Canvas visual', 'Não suporta múltiplos modelos de IA', 'Sem barramento de dados'],
      uniqueMechanism: 'Templates fixos pré-programados',
      pricingAndOffer: 'Assinatura mensal R$ 97/mês',
      marketGaps: [
        'Não conecta extração de YouTube diretamente com copy de anúncios',
        'Não permite personalização de fluxo em grafo'
      ]
    };

    const parsed = CompetitorAnalysisSchema.parse(competitor);
    expect(parsed.competitorName).toBe('Ferramenta X de Automação');
    expect(parsed.vulnerabilities.length).toBe(3);
  });

  it('should validate 12-step VSL script structure', () => {
    const steps = Array.from({ length: 12 }, (_, i) => ({
      stepNumber: i + 1,
      title: `Passo ${i + 1}`,
      scriptContent: `Conteúdo da etapa ${i + 1} do roteiro persuasivo.`,
      visualDirection: `Corte de câmera e texto na tela para etapa ${i + 1}`
    }));

    const vsl = {
      title: 'VSL de Alta Conversão — UNION.AI',
      targetDuration: '18 minutos',
      steps,
      fullScript: steps.map(s => `[${s.title}]: ${s.scriptContent}`).join('\n\n')
    };

    const parsed = VslScriptSchema.parse(vsl);
    expect(parsed.steps.length).toBe(12);
    expect(parsed.steps[0].stepNumber).toBe(1);
  });

  it('should validate AdsMatrix schema for multi-platform campaigns', () => {
    const ads = {
      campaignName: 'Lançamento UNION.AI Q3',
      creatives: [
        {
          id: 'meta-ad-1',
          platform: 'meta' as const,
          hook: 'Pare de perder 4 horas por dia escrevendo copy na mão.',
          headline: 'Crie campanhas completas em 3 minutos no Canvas de IA',
          body: 'Enquanto seus concorrentes usam ferramentas isoladas, o UNION.AI extrai insights de vídeos e gera anúncios prontos para rodar.',
          cta: 'Experimente Grátis'
        },
        {
          id: 'tiktok-ad-1',
          platform: 'tiktok' as const,
          hook: 'Pov: você descobriu que dá pra transformar 1 vídeo do YouTube em 10 anúncios no automático.',
          headline: 'Automação de Marketing com IA',
          body: 'Arrasta pra cima e veja o workflow visual em ação.',
          cta: 'Saiba Mais'
        }
      ]
    };

    const parsed = AdsMatrixSchema.parse(ads);
    expect(parsed.creatives.length).toBe(2);
    expect(parsed.creatives[0].platform).toBe('meta');
    expect(parsed.creatives[1].platform).toBe('tiktok');
  });
});
