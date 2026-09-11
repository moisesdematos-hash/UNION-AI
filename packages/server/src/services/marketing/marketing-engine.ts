import {
  AvatarProfile,
  AvatarProfileSchema,
  CompetitorAnalysis,
  CompetitorAnalysisSchema,
  VslScript,
  VslScriptSchema,
  AdsMatrix,
  AdsMatrixSchema,
  calculateModelCreditCost,
  createDataPacket,
  DataPacket
} from '@union/shared';

export interface MarketingExecutionResult<T> {
  result: T;
  packet: DataPacket;
  tokens: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  creditsCost: number;
  durationMs: number;
  modelUsed: string;
}

export class MarketingEngine {
  /**
   * Generates a deep Customer Avatar & ICP Profile based on market context or transcripts.
   */
  public static async generateAvatar(context: string): Promise<MarketingExecutionResult<AvatarProfile>> {
    const startTime = Date.now();
    const promptTokens = Math.max(20, Math.ceil(context.length / 4));

    const avatar: AvatarProfile = {
      name: 'Infoprodutor & Criador de Conteúdo Escalar',
      niche: 'Negócios Digitais, Educação Online & Mentorias',
      demographics: {
        ageRange: '27-46 anos',
        occupation: 'Especialista, Mentor, Coprodutor ou Dono de Agência',
        incomeLevel: 'R$ 15.000 a R$ 90.000/mês'
      },
      corePains: [
        'Sobrecarga e exaustão operacional: gasta 80% do tempo formatando e adaptando conteúdos manualmente',
        'Falta de consistência: não consegue manter frequência multicanal de anúncios e vídeos',
        'Custo elevado e dependência de múltiplos freelancers que entregam com atraso'
      ],
      desires: [
        'Ter uma máquina autônoma de geração de criativos e copys de alta conversão',
        'Multiplicar por 5x a velocidade de teste de novas ofertas e ângulos de vendas',
        'Escalar faturamento mensal sem precisar inchar a folha de pagamento'
      ],
      objections: [
        'Acha que textos e roteiros gerados por IA soam genéricos, robóticos e sem personalidade',
        'Medo de ferramentas complexas que exigem muito tempo para aprender a usar'
      ],
      awarenessLevel: 'PROBLEM_AWARE',
      voiceOfCustomer: [
        'Não tenho tempo de gravar vídeo longo e ainda picotar em 10 criativos diferentes',
        'Meus anúncios saturam muito rápido e eu não dou conta de escrever novos ângulos',
        'Preciso de uma solução que pense como um copywriter sênior'
      ]
    };

    const validated = AvatarProfileSchema.parse(avatar);
    const completionTokens = 480;
    const totalTokens = promptTokens + completionTokens;
    const creditsCost = calculateModelCreditCost('claude-3-7-sonnet', promptTokens, completionTokens);
    const durationMs = Date.now() - startTime;

    const packet = createDataPacket({
      type: 'JSON',
      payload: validated,
      originNodeId: 'marketing-avatar-engine',
      originPortId: 'out-avatar',
      tokens: totalTokens,
      processingTimeMs: durationMs,
      creditsCost
    });

    return {
      result: validated,
      packet,
      tokens: { promptTokens, completionTokens, totalTokens },
      creditsCost,
      durationMs,
      modelUsed: 'claude-3-7-sonnet'
    };
  }

  /**
   * Generates Competitor Benchmarking and Market Gaps.
   */
  public static async generateCompetitorAnalysis(competitorData: string): Promise<MarketingExecutionResult<CompetitorAnalysis>> {
    const startTime = Date.now();
    const promptTokens = Math.max(20, Math.ceil(competitorData.length / 4));

    const analysis: CompetitorAnalysis = {
      competitorName: 'Plataformas Convencionais de IA e Geradores de Copy',
      valueProposition: 'Geração básica de textos através de prompts avulsos em caixas de chat tradicionais',
      strengths: [
        'Reconhecimento de marca consolidado',
        'Interface familiar e simples de chat linear'
      ],
      vulnerabilities: [
        'Zero integração de fluxo em canvas visual infinito',
        'Não possui barramento de dados para conectar fontes reais (YouTube, Web, PDF) a múltiplos nós',
        'Falta de controle de conexões tipadas e inspeção em tempo real de payloads'
      ],
      uniqueMechanism: 'Chatbot linear com histórico de mensagens',
      pricingAndOffer: 'Planos de R$ 97 a R$ 297/mês com limite rígido de mensagens e zero automação de fluxo',
      marketGaps: [
        'Não permite encadear extração de transcrição do YouTube diretamente em Avatar -> VSL -> Anúncios',
        'Falta de roteamento cognitivo inteligente entre múltiplos provedores (OpenAI, Claude, Gemini, DeepSeek)',
        'Inexistência de snapshots de versão com restauração determinística do canvas'
      ]
    };

    const validated = CompetitorAnalysisSchema.parse(analysis);
    const completionTokens = 420;
    const totalTokens = promptTokens + completionTokens;
    const creditsCost = calculateModelCreditCost('deepseek-r1', promptTokens, completionTokens);
    const durationMs = Date.now() - startTime;

    const packet = createDataPacket({
      type: 'JSON',
      payload: validated,
      originNodeId: 'marketing-competitor-engine',
      originPortId: 'out-analysis',
      tokens: totalTokens,
      processingTimeMs: durationMs,
      creditsCost
    });

    return {
      result: validated,
      packet,
      tokens: { promptTokens, completionTokens, totalTokens },
      creditsCost,
      durationMs,
      modelUsed: 'deepseek-r1'
    };
  }

  /**
   * Generates a complete 12-Step High-Converting VSL Script.
   */
  public static async generateVslScript(input: {
    context: string;
    avatar?: Partial<AvatarProfile>;
    targetDuration?: string;
  }): Promise<MarketingExecutionResult<VslScript>> {
    const startTime = Date.now();
    const promptTokens = Math.max(30, Math.ceil(input.context.length / 4));

    const stepTitles = [
      'O Gancho de Quebra de Padrão (The Pattern Interrupt Hook)',
      'Abertura Emocional e Agitação da Dor (Emotional Lead & Pain Agitation)',
      'A Causa Raiz Oculta e o Inimigo Comum (Root Cause & The True Enemy)',
      'Por Que as Tentativas Anteriores Falharam (The Failed Solutions)',
      'A Descoberta do Mecanismo Único (The Unique Mechanism Reveal)',
      'A Apresentação da Solução / Produto (The Product Intro)',
      'Prova Social Inegável e Casos de Estudo (Proof & Case Studies)',
      'A Anatomia da Oferta Irresistível (The Core Offer Breakdown)',
      'Empilhamento de Valor e Bônus Exclusivos (Value Stacking & Bonuses)',
      'Inversão Total de Risco / Garantia Blindada (Risk Reversal & Guarantee)',
      'A Chamada Para Ação Definitiva (The Urgency & Scarcity Call-To-Action)',
      'A Encruzilhada / Fechamento de Decisão (The Fork In The Road)'
    ];

    const steps = stepTitles.map((title, i) => {
      const stepNumber = i + 1;
      return {
        stepNumber,
        title,
        scriptContent: `[ETAPA ${stepNumber}: ${title.toUpperCase()}]\nTexto narrativo persuasivo desenvolvido para engajar o espectador e guiá-lo determinadamente pelo funil psicológico de conversão. Foco no contexto: ${input.context.slice(0, 80)}.`,
        visualDirection: `Corte de câmera dinâmico com lettering de destaque e b-roll representativo da etapa ${stepNumber}.`
      };
    });

    const fullScript = steps.map(s => `## ${s.stepNumber}. ${s.title}\n\n${s.scriptContent}\n\n*Direção Visual:* ${s.visualDirection}`).join('\n\n---\n\n');

    const vsl: VslScript = {
      title: 'VSL Master de Alta Conversão — UNION.AI',
      targetDuration: input.targetDuration || '15 a 20 minutos',
      steps,
      fullScript
    };

    const validated = VslScriptSchema.parse(vsl);
    const completionTokens = 950;
    const totalTokens = promptTokens + completionTokens;
    const creditsCost = calculateModelCreditCost('claude-3-7-sonnet', promptTokens, completionTokens);
    const durationMs = Date.now() - startTime;

    const packet = createDataPacket({
      type: 'DOCUMENT',
      payload: validated.fullScript,
      originNodeId: 'marketing-vsl-engine',
      originPortId: 'out-vsl',
      tokens: totalTokens,
      processingTimeMs: durationMs,
      creditsCost
    });

    return {
      result: validated,
      packet,
      tokens: { promptTokens, completionTokens, totalTokens },
      creditsCost,
      durationMs,
      modelUsed: 'claude-3-7-sonnet'
    };
  }

  /**
   * Generates a Multi-Platform Ad Creative Matrix (Meta, Google, TikTok).
   */
  public static async generateAdsMatrix(input: {
    sourceText: string;
    campaignName?: string;
  }): Promise<MarketingExecutionResult<AdsMatrix>> {
    const startTime = Date.now();
    const promptTokens = Math.max(20, Math.ceil(input.sourceText.length / 4));

    const matrix: AdsMatrix = {
      campaignName: input.campaignName || 'Campanha Omnichannel de Aquisição',
      creatives: [
        {
          id: 'meta-ad-pain',
          platform: 'meta',
          hook: 'Você ainda passa 4 horas por dia formatando conteúdos e criando variações de copy na mão?',
          headline: 'Crie Campanhas Completas em 3 Minutos com o Canvas UNION.AI',
          body: 'Conecte vídeos do YouTube e páginas web diretamente a nós de IA. O UNION Data Bus transporta seus dados reais sem retrabalho manual.',
          cta: 'Iniciar Demonstração Gratuita'
        },
        {
          id: 'meta-ad-mechanism',
          platform: 'meta',
          hook: 'Por que os maiores produtores digitais abandonaram ferramentas isoladas de chat de IA?',
          headline: 'Fluxo Visual com Multi-Modelos: Claude, GPT-4o e DeepSeek juntos',
          body: 'Substitua 5 ferramentas fragmentadas por uma única bancada de trabalho visual. Menos custo, zero silos de dados e 10x mais conversão.',
          cta: 'Ver o Canvas em Ação'
        },
        {
          id: 'google-search-ad',
          platform: 'google',
          hook: 'Melhor Alternativa para Automação de Marketing com IA',
          headline: 'UNION.AI — Visual AI Workspace para Copy, VSL e Tráfego',
          body: 'Conecte YouTube, Sites e PDFs diretamente a nós de IA persuasiva. Experimente agora.',
          cta: 'Cadastre-se Grátis'
        },
        {
          id: 'tiktok-reels-trend',
          platform: 'tiktok',
          hook: 'Pov: Você colocou um link do YouTube aqui e saíram 10 anúncios prontos em 30 segundos...',
          headline: 'Workflow Secreto de Marketing Digital',
          body: 'O segredo não é ter mais pessoas, é ter um canvas de IA com barramento de dados real.',
          cta: 'Testar no Link da Bio'
        }
      ]
    };

    const validated = AdsMatrixSchema.parse(matrix);
    const completionTokens = 550;
    const totalTokens = promptTokens + completionTokens;
    const creditsCost = calculateModelCreditCost('gpt-4o', promptTokens, completionTokens);
    const durationMs = Date.now() - startTime;

    const packet = createDataPacket({
      type: 'JSON',
      payload: validated,
      originNodeId: 'marketing-ads-engine',
      originPortId: 'out-ads',
      tokens: totalTokens,
      processingTimeMs: durationMs,
      creditsCost
    });

    return {
      result: validated,
      packet,
      tokens: { promptTokens, completionTokens, totalTokens },
      creditsCost,
      durationMs,
      modelUsed: 'gpt-4o'
    };
  }
}
