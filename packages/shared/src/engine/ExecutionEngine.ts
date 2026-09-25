import {
  WorkflowDefinition,
  ExecutionPlan,
  ExecutionMode
} from '../types/workflow.js';
import { NodeDefinition } from '../types/nodes.js';
import { ConnectionDefinition } from '../types/connections.js';
import { DataPacket } from '../types/data-types.js';
import { createDataPacket, globalDataBus } from '../data-bus/DataBus.js';

export type WorkflowExecutionStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'STOPPED';

export interface NodeExecutionEvent {
  type: 'NODE_QUEUED' | 'NODE_STARTED' | 'NODE_PROGRESS' | 'NODE_COMPLETED' | 'NODE_FAILED';
  nodeId: string;
  stageIndex: number;
  dataPacket?: DataPacket;
  outputs?: Record<string, DataPacket>;
  error?: string;
  metrics?: {
    durationMs: number;
    tokens?: number;
    credits?: number;
  };
}

export interface WorkflowExecutionSummary {
  status: WorkflowExecutionStatus;
  mode: ExecutionMode;
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  totalTokens: number;
  totalCostCredits: number;
  startTime: number;
  endTime?: number;
  durationMs: number;
  error?: string;
}

export type NodeExecutionHandler = (
  node: NodeDefinition,
  inputs: Record<string, DataPacket>,
  signal: AbortSignal
) => Promise<{
  outputs: Record<string, DataPacket>;
  tokens?: number;
  credits?: number;
  durationMs: number;
}>;

export interface ExecutionEngineOptions {
  workflow: WorkflowDefinition;
  plan: ExecutionPlan;
  signal?: AbortSignal;
  handler?: NodeExecutionHandler;
  onNodeEvent?: (event: NodeExecutionEvent) => void;
  onSummaryUpdate?: (summary: WorkflowExecutionSummary) => void;
}

/**
 * Default node runner that synthesizes realistic, typed DataPackets along the graph.
 */
export async function defaultNodeHandler(
  node: NodeDefinition,
  inputs: Record<string, DataPacket>,
  signal: AbortSignal
): Promise<{ outputs: Record<string, DataPacket>; tokens: number; credits: number; durationMs: number }> {
  if (signal.aborted) {
    throw new Error('Execução abortada pelo usuário');
  }

  const startTime = Date.now();
  const outputs: Record<string, DataPacket> = {};
  let tokens = 100;
  let credits = 0.001;

  // Aggregate incoming payload
  const incomingTexts = Object.values(inputs).map((p) => {
    if (typeof p.payload === 'string') return p.payload;
    return JSON.stringify(p.payload);
  });
  const contextText = incomingTexts.join('\n\n');

  // Handle by category / type
  if (node.type === 'marketing-avatar') {
    tokens = 450;
    credits = 0.020;
    const niche = (node.config?.niche as string) || 'Marketing Digital';
    const targetAudience = (node.config?.targetAudience as string) || 'Empreendedores e Criadores';
    const awarenessLevel = (node.config?.awarenessLevel as string) || 'PROBLEM_AWARE';

    const avatarProfile = {
      name: 'Mentor / Criador de Alto Impacto',
      niche,
      targetAudience,
      demographics: { ageRange: '28-45', incomeLevel: 'R$ 10k - R$ 50k / mês' },
      awarenessLevel,
      pains: [
        'Gargalo na criação manual de copy e roteiros',
        'Falta de consistência nos criativos de anúncios',
        'Custo elevado de contratação de agências'
      ],
      desires: [
        'Escalar faturamento para 7 dígitos',
        'Automatizar esteira de vendas com IA previsível'
      ],
      objections: [
        'Será que a IA não soa genérica ou robotizada?',
        'Dificuldade técnica de configurar ferramentas complexas'
      ],
      voiceOfCustomer: [
        'Eu preciso de algo que pense a estratégia de conversão comigo, não só um gerador de texto raso.'
      ]
    };

    const dossierMarkdown = `# Dossier do Avatar: ${avatarProfile.name}\n\n**Nicho:** ${niche}\n**Público-Alvo:** ${targetAudience}\n**Nível de Consciência:** ${awarenessLevel}\n\n### Principais Dores:\n${avatarProfile.pains.map(p => `- ${p}`).join('\n')}\n\n### Desejos Centrais:\n${avatarProfile.desires.map(d => `- ${d}`).join('\n')}`;

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-avatar' ? avatarProfile : dossierMarkdown;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'marketing-competitor') {
    tokens = 400;
    credits = 0.020;
    const competitorName = (node.config?.competitorName as string) || 'Concorrente Alpha';
    const marketSegment = (node.config?.marketSegment as string) || 'Automação IA';

    const competitorAnalysis = {
      competitorName,
      marketSegment,
      valueProposition: 'Plataforma básica de geração de textos em lote sem grafo de execução',
      swot: {
        strengths: ['Marca estabelecida', 'Base grande de usuários'],
        weaknesses: ['Sem canvas visual', 'Qualidade de copy superficial', 'Sem suporte multi-modelo'],
        opportunities: ['Oferecer visualização de grafo em tempo real com controle de orquestração'],
        threats: ['Lançamento de recursos avançados de automação']
      },
      vulnerabilities: ['Interface em lista engessada', 'Sem roteamento inteligente de LLMs'],
      marketGaps: ['Falta de solução integrada com gestão de créditos e bus de dados tipado']
    };

    const swotTable = [
      { Tipo: 'Forças (Strengths)', Itens: competitorAnalysis.swot.strengths.join(', ') },
      { Tipo: 'Fraquezas (Weaknesses)', Itens: competitorAnalysis.swot.weaknesses.join(', ') },
      { Tipo: 'Oportunidades (Opportunities)', Itens: competitorAnalysis.swot.opportunities.join(', ') },
      { Tipo: 'Ameaças (Threats)', Itens: competitorAnalysis.swot.threats.join(', ') }
    ];

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-analysis' ? competitorAnalysis : swotTable;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'marketing-vsl') {
    tokens = 650;
    credits = 0.035;
    const productName = (node.config?.productName as string) || 'UNION.AI Suite';
    const hook = 'Pare de perder 40 horas por semana criando funis de marketing que não convertem.';

    const vslScript = {
      productName,
      targetDurationMinutes: 15,
      hook,
      steps: [
        { stepNumber: 1, stepName: 'Golden Hook', content: hook, durationSeconds: 45 },
        { stepNumber: 2, stepName: 'Apresentação do Problema Real', content: 'O verdadeiro motivo pelo qual suas campanhas não escalam.', durationSeconds: 60 },
        { stepNumber: 3, stepName: 'Mecanismo Único', content: 'Grafo Visual Multi-Modelo com Barramento de Dados em Tempo Real.', durationSeconds: 90 },
        { stepNumber: 12, stepName: 'Chamada para Ação Irresistível', content: 'Inicie seu teste grátis agora com 100 créditos sem cartão.', durationSeconds: 60 }
      ],
      fullScriptMarkdown: `# Roteiro VSL: ${productName}\n\n## 1. Golden Hook\n${hook}\n\n## 2. Mecanismo Único\nGrafo de Execução Visual com Roteamento Inteligente.\n\n## 12. Oferta & Chamada para Ação\nGaranta sua vaga hoje com bônus exclusivos.`
    };

    for (const outPort of node.outputs || []) {
      let payload: unknown = vslScript.fullScriptMarkdown;
      if (outPort.id === 'out-hook') payload = hook;
      else if (outPort.id === 'out-steps') payload = vslScript.steps;
      else if (outPort.type === 'JSON') payload = vslScript;

      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'marketing-ads') {
    tokens = 550;
    credits = 0.025;
    const adsMatrix = {
      campaignGoal: 'Conversão / Vendas Diretas',
      creatives: [
        {
          platform: 'META_FEED',
          hook: 'Cansado de prompts amadores que geram textos genéricos?',
          headline: 'Crie Funis Visuais com IA em Minutos',
          body: 'O UNION.AI conecta transcrições, dados de mercado e copywriting em um fluxo visual contínuo.',
          callToAction: 'Experimente Grátis'
        },
        {
          platform: 'TIKTOK',
          hook: 'Isso aqui substitui 5 ferramentas de marketing de uma vez só...',
          headline: 'Automação Visual com IA',
          body: 'Veja como funciona construir um funil em grafo infinito.',
          callToAction: 'Link na Bio'
        },
        {
          platform: 'GOOGLE_SEARCH',
          hook: 'Plataforma de IA para Copywriting e Marketing',
          headline: 'UNION.AI - Workspace Visual de IA',
          body: 'Orquestração multi-modelo em canvas infinito. 100 créditos grátis.',
          callToAction: 'Começar Agora'
        }
      ]
    };

    const adCopiesDoc = adsMatrix.creatives.map(c => `### [${c.platform}] ${c.headline}\n**Hook:** ${c.hook}\n**Body:** ${c.body}\n**CTA:** ${c.callToAction}\n`).join('\n---\n\n');

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-ads' ? adsMatrix : adCopiesDoc;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'trigger-webhook') {
    tokens = 30;
    credits = 0.002;
    const webhookData = node.config?.webhookPayload || { event: 'TRIGGER_WEBHOOK', source: 'external_api', timestamp: Date.now() };
    const rawText = typeof webhookData === 'string' ? webhookData : JSON.stringify(webhookData, null, 2);

    for (const outPort of node.outputs || []) {
      const payload = outPort.type === 'JSON' ? webhookData : rawText;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'trigger-schedule') {
    tokens = 15;
    credits = 0.001;
    const cronTick = {
      triggeredAt: Date.now(),
      cronExpression: (node.config?.cronExpression as string) || '0 9 * * *',
      type: 'SCHEDULE_TICK'
    };

    for (const outPort of node.outputs || []) {
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload: cronTick,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'flow-loop') {
    tokens = 80;
    credits = 0.005;
    const items = Array.isArray(inputs['in-items']?.payload) 
      ? (inputs['in-items'].payload as unknown[]) 
      : ['Item Alpha', 'Item Beta', 'Item Gamma'];

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-item' ? items[0] : items;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'ai-agent-autonomous') {
    tokens = 750;
    credits = 0.040;
    const goal = (node.config?.agentGoal as string) || contextText || 'Planejar e executar estratégia autônoma';
    const agentResult = {
      goal,
      finalAnswer: `[AGENTE AUTÔNOMO ReAct]: Objetivo concluído com êxito.\nSolução formulada com base no contexto: ${goal.slice(0, 100)}...`,
      totalSteps: 3,
      success: true,
      steps: [
        { stepNumber: 1, thought: 'Compreender a meta e avaliar ferramentas necessárias', action: 'plan', observation: 'Meta clara e viável', durationMs: 45 },
        { stepNumber: 2, thought: 'Coletar dados contextuais relevantes', action: 'extract_context', observation: 'Dados consolidados', durationMs: 60 },
        { stepNumber: 3, thought: 'Sintetizar a solução final e validar critério de parada', action: 'conclude', observation: 'Critério de parada atingido com 100% de confiança', durationMs: 40 }
      ],
      tokensUsed: tokens,
      creditsCost: credits
    };

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-logs' ? agentResult.steps : agentResult.finalAnswer;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'source-youtube') {
    const videoTitle = (node.config?.videoTitle as string) || (node.config?.title as string) || 'Vídeo Estratégico do YouTube';
    const transcriptText = `[00:00] Bem-vindo à análise completa sobre ${videoTitle}.\n` +
      `[01:15] O maior desafio de criadores e empresas modernas é a escala previsível sem perda de qualidade.\n` +
      `[03:40] Ao combinar automação em grafos e múltiplos modelos de inteligência artificial, você multiplica sua entrega em 10 vezes.\n` +
      `[07:10] A arquitetura orientada a dados garante que cada etapa seja validada antes de seguir para a próxima entrega.\n` +
      `[12:25] Conclusão: a orquestração inteligente de fluxos é a única alavanca indispensável para a escala sustentável no mercado digital.`;

    tokens = Math.max(80, Math.ceil(transcriptText.length / 4));
    credits = 0.005;

    for (const outPort of node.outputs || []) {
      const payload = outPort.type === 'METADATA'
        ? { title: videoTitle, duration: (node.config?.duration as string) || '15:20', url: node.config?.url }
        : outPort.type === 'TRANSCRIPT'
        ? [{ timestamp: '00:00', text: transcriptText }]
        : transcriptText;

      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.category === 'SOURCE') {
    const rawContent = node.config?.url
      ? `Conteúdo extraído de ${node.config.url}\n\nTranscrição: Automação em marketing com IA e grafos acelera a geração de ativos em 10x.`
      : (typeof node.config?.text === 'string' ? node.config.text : typeof node.config?.content === 'string' ? node.config.content : 'Briefing de entrada do cliente: Produto UNION.AI para automação de marketing digital.');

    tokens = Math.max(20, Math.ceil(rawContent.length / 4));
    credits = 0.005;

    for (const outPort of node.outputs || []) {
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload: outPort.type === 'TRANSCRIPT' ? [{ timestamp: '00:00', text: rawContent }] : rawContent,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'ai-ebook-forge') {
    tokens = 4800;
    credits = 0.080;
    const title = (node.config?.title as string) || 'Manual Estratégico de Escala e Inteligência Digital';
    const niche = (node.config?.niche as string) || (node.config?.targetNiche as string) || 'Negócios Online & Automação';
    const pageCount = Number(node.config?.pageCount) || 10;

    const chapterTitles = [
      'Fundamentos da Automação Cognitiva e Arquitetura de Grafos',
      'Desconstrução de Processos Operacionais e Identificação de Gargalos',
      'Engenharia de Prompts Estratégicos e Roteamento de Modelos LLM',
      'Mineração e Extração de Inteligência a Partir de Vídeos e Páginas Web',
      'Orquestração de Dados Multimodais com Tipagem e Barramentos Confiáveis',
      'Sistemas Autônomos de Geração de Conteúdo e Roteirização de Retenção',
      'Psicologia de Conversão e Mecanismos Únicos em Vendas Digitais',
      'Validação de Hipóteses e Otimização de Métricas de Engajamento',
      'Mitigação de Falhas e Garantia Editorial de Integridade e Profundidade',
      'Plano de Ação de 30 Dias para Implementação de Ecossistemas Autônomos'
    ];

    const chapters = chapterTitles.map((chTitle, idx) => {
      const chNum = idx + 1;
      const paragraphs = [
        `Neste capítulo ${chNum}, exploramos em detalhes profundos a dimensão crítica de ${chTitle.toLowerCase()}, integrando os fundamentos conceituais e as ferramentas práticas de execução que redefinem o mercado moderno.`,
        `A compreensão de como o contexto ${contextText ? `("${contextText.slice(0, 80)}...")` : 'estrutural da obra'} interage com os vetores de crescimento demonstra que a automação não se trata apenas de velocidade, mas da eliminação sistemática de atritos operacionais e retrabalho humano desnecessário.`,
        `Ao mapear cada elemento da esteira de produção, identificamos três pilares indispensáveis: a consistência de entrada de dados, o refinamento contínuo das instruções analíticas e a validação pontual de cada entrega intermediária. Quando esses três eixos operam em sintonia, o tempo necessário para materializar uma tese de mercado cai em mais de oitenta por cento.`,
        `Aprofundando os desdobramentos estratégicos, observa-se que as organizações que dominam pipelines inteligentes constroem uma barreira competitiva intransponível. A capacidade de sintetizar milhares de palavras com fidelidade semântica permite atender a múltiplos canais simultaneamente com alta coerência de posicionamento.`,
        `Para consolidar esta seção, apresentamos a síntese das melhores práticas: estabelecer checkpoints de qualidade a cada transição de etapa, priorizar a clareza sobre o excesso de complexidade e medir rigorosamente o retorno de cada token processado ao longo do fluxo de automação.`
      ];
      const content = paragraphs.join('\n\n');
      const wordCount = 1000 + (idx * 45);
      return {
        chapterNumber: chNum,
        title: chTitle,
        wordCount,
        pagesRange: `${idx * 2 + 1}-${idx * 2 + 2}`,
        content
      };
    });

    const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);
    const fullMarkdown = `# ${title}\n\n**Nicho:** ${niche} | **Extensão:** ${pageCount} Páginas | **Total:** ${totalWords.toLocaleString('pt-BR')} palavras\n\n---\n\n` +
      chapters.map(c => `## Capítulo ${c.chapterNumber}: ${c.title}\n*(${c.wordCount} palavras)*\n\n${c.content}\n\n`).join('---\n\n');

    const ebookData = {
      title,
      targetNiche: niche,
      pageCount,
      totalWords,
      totalWordCount: totalWords,
      chapters,
      fullMarkdown
    };

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-chapters' 
        ? chapters 
        : outPort.id === 'out-markdown' 
        ? fullMarkdown 
        : ebookData;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'ai-chat') {
    tokens = 350;
    credits = 0.015;
    const prompt = (node.config?.prompt as string) || 'Análise de contexto e recomendações estratégicas';
    const responseText = `[AI CHAT ASSISTANT (${node.config?.model || 'Groq Llama 3.3 70B'})]\n\nCom base no contexto conectado (${contextText ? contextText.slice(0, 120) + '...' : 'sem fontes conectadas'}) e na sua solicitação ("${prompt}"):\n\n1. **Diagnóstico Estrutural:** Identificamos pontos de alavancagem claros para aceleração do fluxo.\n2. **Recomendação de Próximo Passo:** Conectar o resultado ao nó de saída para leitura e exportação imediata.\n3. **Insights-Chave:** O pipeline está validado e pronto para escala.`;

    for (const outPort of node.outputs || []) {
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload: responseText,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.category === 'AI') {
    tokens = Math.max(50, Math.ceil(contextText.length / 4)) + 200;
    credits = 0.015;

    let responseText = `[${node.label.toUpperCase()}] Processamento concluído com sucesso.\n\nContexto recebido: ${contextText.slice(0, 100)}...`;
    if (node.type === 'ai-writer') {
      responseText = `[ROTEIRO DE ALTA RETENÇÃO]\nGancho: Pare de desperdiçar horas na criação manual.\nConteúdo: ${contextText.slice(0, 150)}...\nCTA: Teste agora o UNION.AI.`;
    } else if (node.type === 'ai-analyst') {
      responseText = `[RELATÓRIO DE INTELIGÊNCIA]\nAvatar: Criador / Agência de Marketing\nDor: Gargalo de produção\nOportunidade: Escalar com IA multi-modelo.`;
    }

    for (const outPort of node.outputs || []) {
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload: responseText,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'output-modal-viewer') {
    tokens = 20;
    credits = 0;
    const incomingEbook = Object.values(inputs).find(p => p.type === 'DOCUMENT' && p.payload && typeof p.payload === 'object')?.payload;
    const incomingText = Object.values(inputs).find(p => p.type === 'TEXT' || p.type === 'AI_RESPONSE')?.payload;
    const resolvedPayload = incomingEbook || incomingText || contextText || 'Documento pronto para visualização';

    for (const outPort of node.outputs || []) {
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload: resolvedPayload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else if (node.type === 'ai-cinema-agent') {
    tokens = 2800;
    credits = 0.18;

    const genre = (node.config?.genre as string) || 'thriller-transformacao';
    const cinematicStyle = (node.config?.cinematicStyle as string) || 'noir-futurista';
    const chaptersCount = Math.min(12, Math.max(3, Number(node.config?.chapters) || 7));
    const wordsPerChapter = Math.max(1000, Number(node.config?.wordsPerChapter) || 1200);
    const protagonist = (node.config?.protagonist as string) || 'O Arquiteto';
    const theme = (node.config?.theme as string) || contextText.slice(0, 120) || 'Transformação através da tecnologia';
    const modelUsed = (node.config?.model as string) || 'groq-llama-3';

    const GENRE_LABELS: Record<string, string> = {
      'thriller-transformacao': 'Thriller de Transformação',
      'noir-futurista': 'Noir Futurista',
      'epic-fantasy': 'Epic Fantasy',
      'sci-fi-emocional': 'Sci-Fi Emocional',
      'drama-psicologico': 'Drama Psicológico',
      'biografia-epica': 'Biografia Épica'
    };

    const STYLE_LABELS: Record<string, string> = {
      'noir-futurista': 'Noir Futurista',
      'cyberpunk-minimalista': 'Cyberpunk Minimalista',
      'dark-academy': 'Dark Academy',
      'solarpunk': 'Solarpunk',
      'neo-gotico': 'Neo-Gótico'
    };

    const EMOTIONAL_ARCS = [
      'Incerteza → Descoberta',
      'Resistência → Rendição',
      'Medo → Coragem Radical',
      'Fragmentação → Síntese',
      'Ilusão → Clareza Brutal',
      'Solidão → Conexão Profunda',
      'Caos → Ordem Emergente',
      'Dúvida → Propósito Inabalável',
      'Perda → Reinvenção',
      'Conformidade → Ruptura',
      'Escuridão → Visão',
      'Colapso → Renascimento'
    ];

    const CHAPTER_OPENINGS = [
      'A tela piscava no escuro quando tudo começou a fazer sentido.',
      'Ninguém havia avisado que a fronteira entre o possível e o impossível era apenas uma questão de perspectiva.',
      'O silêncio tinha textura naquele corredor — denso, elétrico, cheio de promessas não ditas.',
      'Era o tipo de manhã que nasce cinzenta mas termina em chamas.',
      'Três anos. Três anos foi o tempo que o universo levou para entregar a resposta.',
      'O mapa estava errado. Mas o destino — esse, era exatamente o certo.',
      'Quando a última certeza desaparece, o que resta é puro potencial.',
      'A voz no fone dizia "impossível". O campo em branco dizia outra coisa.',
      'Não era coragem. Era a única saída que sobrava.',
      'O algoritmo previu tudo — exceto a variável mais humana de todas.',
      'Havia uma linha invisível entre o antes e o depois. E ela a cruzou sem perceber.',
      'O problema com os sistemas perfeitos é que nunca contemplam a imperfeição como catalisador.'
    ];

    const genreLabel = GENRE_LABELS[genre] || 'Thriller de Transformação';
    const styleLabel = STYLE_LABELS[cinematicStyle] || 'Noir Futurista';
    const ebookTitle = `${protagonist}: Uma Jornada ${genreLabel}`;

    const synopsis = `## ${ebookTitle}\n\n**Género:** ${genreLabel} · **Estilo Visual:** ${styleLabel}\n**Modelo:** ${modelUsed} · **Capítulos:** ${chaptersCount}\n\n### Sinopse Cinematográfica\n\n*"${theme}"*\n\nNuma época em que os limites entre o humano e o digital se dissolvem como névoa ao amanhecer, **${protagonist}** embarca numa jornada que vai muito além de qualquer roadmap convencional. Com a narrativa visceral do ${genreLabel} e a paleta visual do ${styleLabel}, este e-book redefine o que significa transformar conhecimento em experiência imersiva.\n\nCada capítulo é uma cena. Cada palavra, um enquadramento. Cada insight, um corte certeiro que deixa marca.\n\n**Pitch:** Para quem acredita que o verdadeiro aprendizado acontece quando a barreira entre leitor e narrativa desaparece por completo.`;

    const chapters = Array.from({ length: chaptersCount }, (_, i) => {
      const chNum = i + 1;
      const arc = EMOTIONAL_ARCS[i % EMOTIONAL_ARCS.length];
      const opening = CHAPTER_OPENINGS[i % CHAPTER_OPENINGS.length];
      const chapterTheme = i === 0 ? 'O Despertar' : i === chaptersCount - 1 ? 'A Síntese Final' : `Acto ${chNum}: ${arc.split(' → ')[1]}`;

      const paragraphs = Array.from({ length: Math.ceil(wordsPerChapter / 120) }, (_, p) => {
        const pIdx = (i * 13 + p * 7) % 8;
        const baseParas = [
          `${protagonist} sabia que aquele momento definiria tudo o que viria depois. A clareza chegou não como um raio, mas como água que penetra lentamente na rocha — inevitável, silenciosa, transformadora. O ${styleLabel} da cena era palpável: sombras longas projetadas por luzes de néon azul, reflexos distorcidos em superfícies de vidro que pareciam espelhos de outra realidade.`,
          `A metodologia que emergiu daquela noite não tinha nome ainda. Era um híbrido — parte intuição, parte sistema, parte coragem pura. No contexto do ${genreLabel}, a jornada de transformação raramente segue o caminho previsível. Ela ziguezagueia, tropeça, levanta-se com mais velocidade do que caiu.`,
          `"${theme}" — essa frase ecoava como um mantra entre as paredes daquele espaço que era simultaneamente arquivo e laboratório. Cada dado era uma pista. Cada falha, uma coordenada mais precisa em direção ao destino que ainda não tinha forma definida, mas que ${protagonist} sentia na pele como se fosse memória do futuro.`,
          `O arco emocional daquele capítulo — ${arc} — não era apenas retórico. Era a física da mudança real. Quem já passou por uma transformação genuína reconhece esse momento: quando a resistência interna se rende não à força, mas à evidência inegável de que o novo caminho é mais verdadeiro do que qualquer zona de conforto.`,
          `Os sistemas antigos começavam a ranger. Não de forma dramática — sem colapso súbito ou revelação cinematográfica. Mas com aquele som específico que precede toda renovação profunda: o farfalhar de estruturas que já cumpriram seu propósito e agora se dissolvem para liberar o espaço que o novo precisa para respirar.`,
          `A tecnologia era o instrumento, nunca o maestro. ${protagonist} havia aprendido isso da forma mais cara possível — meses dedicados às ferramentas certas aplicadas às perguntas erradas. A virada ocorreu quando a hierarquia se inverteu: primeiro a pergunta fundamental, depois o recurso mais adequado para respondê-la.`,
          `No vocabulário do ${genreLabel}, existem momentos que a câmera precisa parar de se mover. Que o espectador — ou o leitor — precisa simplesmente ficar com a cena, respirar dentro dela, sentir o peso do que está sendo dito nas entrelinhas. Este era um desses momentos. Silêncio editorial. Pausa intencional. A mais poderosa das ferramentas narrativas.`,
          `O que ${protagonist} descobriu naquele estágio da jornada não podia ser comprimido em frameworks ou bullet points. Era conhecimento do tipo que se instala no corpo antes de chegar à mente racional — uma certeza pré-verbal que só mais tarde encontra linguagem para se expressar com a precisão necessária.`
        ];
        return baseParas[pIdx];
      });

      const content = `${opening}\n\n${paragraphs.join('\n\n')}`;
      const wordCount = content.split(/\s+/).length;

      return {
        chapterNumber: chNum,
        title: `Capítulo ${chNum}: ${chapterTheme}`,
        emotionalArc: arc,
        content,
        wordCount,
        scenicNote: `[Estilo: ${styleLabel} · Paleta: tons de índigo, âmbar e prata metálica]`
      };
    });

    const fullMarkdown = `# ${ebookTitle}\n\n${synopsis}\n\n---\n\n${chapters.map(ch =>
      `## ${ch.title}\n*Arco: ${ch.emotionalArc}*\n\n${ch.content}\n\n> ${ch.scenicNote}`
    ).join('\n\n---\n\n')}`;

    const generatedEbook = {
      title: ebookTitle,
      synopsis: synopsis,
      genre: genreLabel,
      cinematicStyle: styleLabel,
      protagonist,
      chapters,
      fullMarkdown,
      totalWordCount: chapters.reduce((s, c) => s + c.wordCount, 0),
      pageCount: Math.ceil(chapters.reduce((s, c) => s + c.wordCount, 0) / 280),
      coverPrompt: `Cinematic book cover: "${ebookTitle}", ${styleLabel} aesthetic, ${genreLabel} genre, moody atmosphere, dramatic lighting, ultra-modern editorial design, high contrast, photorealistic`,
      model: modelUsed,
      createdAt: new Date().toISOString()
    };

    for (const outPort of node.outputs || []) {
      const payload = outPort.id === 'out-synopsis' ? synopsis : generatedEbook;
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload,
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens,
        processingTimeMs: Date.now() - startTime,
        creditsCost: credits
      });
    }
  } else {
    // Transform or Output
    for (const outPort of node.outputs || []) {
      outputs[outPort.id] = createDataPacket({
        type: outPort.type,
        payload: contextText || 'Ativo pronto para publicação',
        originNodeId: node.id,
        originPortId: outPort.id,
        tokens: 50,
        processingTimeMs: Date.now() - startTime,
        creditsCost: 0
      });
    }
  }

  return {
    outputs,
    tokens,
    credits,
    durationMs: Date.now() - startTime
  };
}

export class ExecutionEngine {
  /**
   * Executes a workflow plan stage by stage with parallel nodes and real DataBus routing.
   */
  public static async execute(options: ExecutionEngineOptions): Promise<WorkflowExecutionSummary> {
    const { workflow, plan, signal = new AbortController().signal, handler = defaultNodeHandler } = options;
    const startTime = Date.now();

    const summary: WorkflowExecutionSummary = {
      status: 'RUNNING',
      mode: plan.mode,
      totalNodes: plan.totalNodes,
      completedNodes: 0,
      failedNodes: 0,
      totalTokens: 0,
      totalCostCredits: 0,
      startTime,
      durationMs: 0
    };

    options.onSummaryUpdate?.(summary);

    const nodeMap = new Map<string, NodeDefinition>(workflow.nodes.map((n) => [n.id, n]));
    const portDataMap = new Map<string, DataPacket>();
    const completedNodeIds = new Set<string>();

    try {
      for (let stageIndex = 0; stageIndex < plan.levels.length; stageIndex++) {
        // Check abort before starting stage
        if (signal.aborted) {
          summary.status = 'STOPPED';
          summary.endTime = Date.now();
          summary.durationMs = summary.endTime - startTime;
          options.onSummaryUpdate?.(summary);
          return summary;
        }

        const stageNodeIds = plan.levels[stageIndex];
        const stageNodes = stageNodeIds
          .map((id) => nodeMap.get(id))
          .filter((n): n is NodeDefinition => n !== undefined);

        // Notify QUEUED for all nodes in stage
        for (const node of stageNodes) {
          options.onNodeEvent?.({
            type: 'NODE_QUEUED',
            nodeId: node.id,
            stageIndex
          });
        }

        // Execute stage nodes in parallel
        const nodePromises = stageNodes.map(async (node) => {
          if (signal.aborted) {
            throw new Error('Execução abortada');
          }

          // If RETRY mode and node was already COMPLETED, skip re-execution
          if (plan.mode === 'RETRY' && node.state === 'COMPLETED') {
            completedNodeIds.add(node.id);
            summary.completedNodes++;
            return;
          }

          // Notify STARTED
          options.onNodeEvent?.({
            type: 'NODE_STARTED',
            nodeId: node.id,
            stageIndex
          });

          // Collect inputs from incoming connections
          const incomingConnections = workflow.connections.filter(
            (c) => c.targetNodeId === node.id
          );

          const inputs: Record<string, DataPacket> = {};
          for (const conn of incomingConnections) {
            const key = `${conn.sourceNodeId}:${conn.sourcePortId}`;
            const packet = portDataMap.get(key) || globalDataBus.getPacket(conn.id);
            if (packet) {
              inputs[conn.targetPortId] = packet;
            }
          }

          try {
            const result = await handler(node, inputs, signal);

            // Store outputs in map and emit to globalDataBus
            for (const [portId, packet] of Object.entries(result.outputs)) {
              portDataMap.set(`${node.id}:${portId}`, packet);

              // Find outgoing connections to publish to DataBus
              const outgoingConns = workflow.connections.filter(
                (c) => c.sourceNodeId === node.id && c.sourcePortId === portId
              );
              for (const outConn of outgoingConns) {
                globalDataBus.publish(outConn.id, packet);
              }
            }

            completedNodeIds.add(node.id);
            summary.completedNodes++;
            summary.totalTokens += result.tokens || 0;
            summary.totalCostCredits += result.credits || 0;

            options.onNodeEvent?.({
              type: 'NODE_COMPLETED',
              nodeId: node.id,
              stageIndex,
              outputs: result.outputs,
              metrics: {
                durationMs: result.durationMs,
                tokens: result.tokens,
                credits: result.credits
              }
            });
          } catch (err: unknown) {
            summary.failedNodes++;
            const errorMsg = err instanceof Error ? err.message : 'Falha na execução do nó';

            options.onNodeEvent?.({
              type: 'NODE_FAILED',
              nodeId: node.id,
              stageIndex,
              error: errorMsg
            });

            throw err;
          }
        });

        // Await all parallel nodes in current stage
        const results = await Promise.allSettled(nodePromises);
        const stageFailed = results.some((r: PromiseSettledResult<void>) => r.status === 'rejected');

        if (stageFailed) {
          if (signal.aborted) {
            summary.status = 'STOPPED';
          } else {
            summary.status = 'FAILED';
            summary.error = 'Um ou mais nós do estágio falharam';
          }
          break;
        }

        options.onSummaryUpdate?.(summary);
      }

      if (summary.status === 'RUNNING') {
        summary.status = 'COMPLETED';
      }
    } catch (err: unknown) {
      if (signal.aborted) {
        summary.status = 'STOPPED';
      } else {
        summary.status = 'FAILED';
        summary.error = err instanceof Error ? err.message : 'Erro na execução do workflow';
      }
    } finally {
      summary.endTime = Date.now();
      summary.durationMs = summary.endTime - startTime;
      options.onSummaryUpdate?.(summary);
    }

    return summary;
  }
}
