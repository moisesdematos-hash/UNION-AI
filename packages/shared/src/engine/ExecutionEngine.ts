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
