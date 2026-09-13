import { z } from 'zod';
import { NodeDefinitionSchema } from './nodes.js';
import { ConnectionDefinitionSchema } from './connections.js';

export const TemplateCategoryEnum = z.enum([
  'MARKETING',
  'CONTENT',
  'RESEARCH',
  'AUTOMATION'
]);

export type TemplateCategory = z.infer<typeof TemplateCategoryEnum>;

export const WorkflowTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: TemplateCategoryEnum,
  tags: z.array(z.string()).default([]),
  icon: z.string().default('Sparkles'),
  estimatedCredits: z.number().nonnegative().default(0.05),
  nodes: z.array(NodeDefinitionSchema),
  connections: z.array(ConnectionDefinitionSchema)
});

export type WorkflowTemplate = z.infer<typeof WorkflowTemplateSchema>;

export const OFFICIAL_TEMPLATES: WorkflowTemplate[] = [
  // 1. YouTube Content Factory
  {
    id: 'youtube-content-factory',
    name: 'YouTube Content Factory',
    description: 'Transforma qualquer vídeo ou podcast do YouTube em pacote completo de conteúdo com análise viral e scripts.',
    category: 'CONTENT',
    tags: ['youtube', 'transcription', 'viral-hooks', 'content-repurposing'],
    icon: 'Video',
    estimatedCredits: 0.12,
    nodes: [
      {
        id: 'tpl-yt-src',
        type: 'source-youtube',
        label: 'YouTube Video Source',
        category: 'SOURCE',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-url', name: 'url', label: 'YouTube URL', type: 'URL', isMulti: false, required: true }
        ],
        config: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        state: 'IDLE'
      },
      {
        id: 'tpl-yt-ext',
        type: 'extractor-youtube',
        label: 'Transcript Extractor',
        category: 'EXTRACTOR',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-url', name: 'url', label: 'YouTube URL', type: 'URL', isMulti: false, required: true }
        ],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: false, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-yt-ana',
        type: 'ai-analyzer',
        label: 'Viral Concept Analyzer',
        category: 'UNDERSTAND',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-data', name: 'data', label: 'Content Data', type: 'TRANSCRIPT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-analysis', name: 'analysis', label: 'Analysis Insights', type: 'TEXT', isMulti: true, required: true }
        ],
        config: { prompt: 'Extraia os 3 conceitos mais virais e os ganchos emocionais deste conteúdo.' },
        state: 'IDLE'
      },
      {
        id: 'tpl-yt-wri',
        type: 'ai-writer',
        label: 'Multi-Platform Content Pack',
        category: 'AI',
        position: { x: 980, y: 150 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'Briefing & Insights', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-content', name: 'content', label: 'Content Pack', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: { tone: 'authoritative', format: 'threads-and-carousel' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-yt-1',
        sourceNodeId: 'tpl-yt-src',
        sourcePortId: 'out-url',
        targetNodeId: 'tpl-yt-ext',
        targetPortId: 'in-url',
        state: 'connected'
      },
      {
        id: 'tpl-conn-yt-2',
        sourceNodeId: 'tpl-yt-ext',
        sourcePortId: 'out-transcript',
        targetNodeId: 'tpl-yt-ana',
        targetPortId: 'in-data',
        state: 'connected'
      },
      {
        id: 'tpl-conn-yt-3',
        sourceNodeId: 'tpl-yt-ana',
        sourcePortId: 'out-analysis',
        targetNodeId: 'tpl-yt-wri',
        targetPortId: 'in-briefing',
        state: 'connected'
      }
    ]
  },

  // 2. Competitor Intelligence Matrix
  {
    id: 'competitor-intel-report',
    name: 'Competitor Intelligence Matrix',
    description: 'Raspa sites de concorrentes, sintetiza proposta de valor, analisa forças/fraquezas e gera relatório tático.',
    category: 'RESEARCH',
    tags: ['competitor', 'swot', 'scraper', 'intelligence'],
    icon: 'Search',
    estimatedCredits: 0.15,
    nodes: [
      {
        id: 'tpl-web-src',
        type: 'source-website',
        label: 'Competitor URL Source',
        category: 'SOURCE',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-url', name: 'url', label: 'Website URL', type: 'URL', isMulti: false, required: true }
        ],
        config: { url: 'https://news.ycombinator.com' },
        state: 'IDLE'
      },
      {
        id: 'tpl-web-ext',
        type: 'extractor-website',
        label: 'Web Content Scraper',
        category: 'EXTRACTOR',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-url', name: 'url', label: 'Website URL', type: 'URL', isMulti: false, required: true }
        ],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Clean Text', type: 'TEXT', isMulti: false, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-comp-swot',
        type: 'marketing-competitor',
        label: 'Competitor SWOT Analyst',
        category: 'AI',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-data', name: 'data', label: 'Competitor Website Text', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-analysis', name: 'analysis', label: 'SWOT Intelligence', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-rep-wri',
        type: 'ai-writer',
        label: 'Executive Strategy Report',
        category: 'AI',
        position: { x: 980, y: 150 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'SWOT Insights', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-content', name: 'content', label: 'Strategic Report', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: { format: 'executive-summary' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-web-1',
        sourceNodeId: 'tpl-web-src',
        sourcePortId: 'out-url',
        targetNodeId: 'tpl-web-ext',
        targetPortId: 'in-url',
        state: 'connected'
      },
      {
        id: 'tpl-conn-web-2',
        sourceNodeId: 'tpl-web-ext',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-comp-swot',
        targetPortId: 'in-data',
        state: 'connected'
      },
      {
        id: 'tpl-conn-web-3',
        sourceNodeId: 'tpl-comp-swot',
        sourcePortId: 'out-analysis',
        targetNodeId: 'tpl-rep-wri',
        targetPortId: 'in-briefing',
        state: 'connected'
      }
    ]
  },

  // 3. Autonomous Marketing VSL Engine
  {
    id: 'marketing-vsl-engine',
    name: 'Autonomous Marketing VSL Engine',
    description: 'Gera Avatar de Alta Conversão, Roteiro VSL em 12 Etapas e Matriz de Anúncios para Meta, Google e TikTok.',
    category: 'MARKETING',
    tags: ['avatar', 'vsl', 'copywriting', 'paid-media'],
    icon: 'TrendingUp',
    estimatedCredits: 0.18,
    nodes: [
      {
        id: 'tpl-mkt-src',
        type: 'source-text',
        label: 'Product Offer Briefing',
        category: 'INPUT',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Offer Briefing', type: 'TEXT', isMulti: false, required: true }
        ],
        config: { text: 'Software SaaS para automação visual de marketing com Inteligência Artificial' },
        state: 'IDLE'
      },
      {
        id: 'tpl-mkt-ava',
        type: 'marketing-avatar',
        label: 'Target Avatar Generator',
        category: 'AI',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'Offer Briefing', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-avatar', name: 'avatar', label: 'Avatar Profile', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-mkt-vsl',
        type: 'marketing-vsl',
        label: '12-Step High-Converting VSL',
        category: 'AI',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-avatar', name: 'avatar', label: 'Avatar Insights', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-vsl', name: 'vsl', label: 'VSL Script', type: 'TEXT', isMulti: true, required: true }
        ],
        config: { targetDurationMinutes: 15 },
        state: 'IDLE'
      },
      {
        id: 'tpl-mkt-ads',
        type: 'marketing-ads',
        label: 'Omnichannel Ads Matrix',
        category: 'AI',
        position: { x: 980, y: 150 },
        inputs: [
          { id: 'in-vsl', name: 'vsl', label: 'VSL Hook & Core Angle', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-ads', name: 'ads', label: 'Ad Copy Matrix', type: 'TEXT', isMulti: true, required: true }
        ],
        config: { platforms: ['META', 'GOOGLE', 'TIKTOK'] },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-mkt-1',
        sourceNodeId: 'tpl-mkt-src',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-mkt-ava',
        targetPortId: 'in-briefing',
        state: 'connected'
      },
      {
        id: 'tpl-conn-mkt-2',
        sourceNodeId: 'tpl-mkt-ava',
        sourcePortId: 'out-avatar',
        targetNodeId: 'tpl-mkt-vsl',
        targetPortId: 'in-avatar',
        state: 'connected'
      },
      {
        id: 'tpl-conn-mkt-3',
        sourceNodeId: 'tpl-mkt-vsl',
        sourcePortId: 'out-vsl',
        targetNodeId: 'tpl-mkt-ads',
        targetPortId: 'in-vsl',
        state: 'connected'
      }
    ]
  },

  // 4. Full Funnel Launch Machine
  {
    id: 'full-funnel-launch-machine',
    name: 'Full Funnel Launch Machine',
    description: 'Esteira completa de ponta a ponta: Briefing, Avatar, Roteiro VSL em 12 Etapas, Copy de Página de Vendas de 14 Blocos e Anúncios Omnichannel.',
    category: 'MARKETING',
    tags: ['full-funnel', 'sales-page', 'vsl', 'avatar', 'ads-matrix'],
    icon: 'Sparkles',
    estimatedCredits: 0.25,
    nodes: [
      {
        id: 'tpl-ff-brief',
        type: 'source-text',
        label: 'Product Launch Briefing',
        category: 'INPUT',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Briefing Text', type: 'TEXT', isMulti: false, required: true }
        ],
        config: { text: 'Plataforma SaaS para orquestração visual de Inteligência Artificial' },
        state: 'IDLE'
      },
      {
        id: 'tpl-ff-ava',
        type: 'marketing-avatar',
        label: 'Target Avatar Profile',
        category: 'AI',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'Briefing', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-avatar', name: 'avatar', label: 'Avatar Insights', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-ff-vsl',
        type: 'marketing-vsl',
        label: '12-Step Video Sales Letter',
        category: 'AI',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-avatar', name: 'avatar', label: 'Avatar Insights', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-vsl', name: 'vsl', label: 'VSL Script', type: 'TEXT', isMulti: true, required: true }
        ],
        config: { targetDurationMinutes: 15 },
        state: 'IDLE'
      },
      {
        id: 'tpl-ff-sp',
        type: 'marketing-sales-page',
        label: '14-Block Sales Page Copy',
        category: 'AI',
        position: { x: 980, y: 150 },
        inputs: [
          { id: 'in-vsl', name: 'vsl', label: 'Core VSL Angle', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-sales-page', name: 'salesPage', label: 'Sales Page Copy', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-ff-ads',
        type: 'marketing-ads',
        label: 'Omnichannel Ads Matrix',
        category: 'AI',
        position: { x: 1280, y: 150 },
        inputs: [
          { id: 'in-vsl', name: 'vsl', label: 'Ad Angles & Hook', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-ads', name: 'ads', label: 'Ad Creatives', type: 'TEXT', isMulti: true, required: true }
        ],
        config: { platforms: ['META', 'GOOGLE', 'TIKTOK'] },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-ff-1',
        sourceNodeId: 'tpl-ff-brief',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-ff-ava',
        targetPortId: 'in-briefing',
        state: 'connected'
      },
      {
        id: 'tpl-conn-ff-2',
        sourceNodeId: 'tpl-ff-ava',
        sourcePortId: 'out-avatar',
        targetNodeId: 'tpl-ff-vsl',
        targetPortId: 'in-avatar',
        state: 'connected'
      },
      {
        id: 'tpl-conn-ff-3',
        sourceNodeId: 'tpl-ff-vsl',
        sourcePortId: 'out-vsl',
        targetNodeId: 'tpl-ff-sp',
        targetPortId: 'in-vsl',
        state: 'connected'
      },
      {
        id: 'tpl-conn-ff-4',
        sourceNodeId: 'tpl-ff-vsl',
        sourcePortId: 'out-vsl',
        targetNodeId: 'tpl-ff-ads',
        targetPortId: 'in-vsl',
        state: 'connected'
      }
    ]
  },

  // 5. Máquina de Páginas de Vendas (14 Blocos + Simulador CPS)
  {
    id: 'sales-page-cps-machine',
    name: 'Sales Page 14-Blocos & Simulador CPS',
    description: 'Esteira padronizada para geração de copy de 14 blocos psicológicos conectada diretamente ao Simulador Preditivo de Conversão.',
    category: 'MARKETING',
    tags: ['sales-page', '14-blocos', 'cps', 'simulador', 'conversao'],
    icon: 'TrendingUp',
    estimatedCredits: 0.20,
    nodes: [
      {
        id: 'tpl-sp-src',
        type: 'source-text',
        label: 'Briefing da Oferta',
        category: 'INPUT',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Briefing Text', type: 'TEXT', isMulti: false, required: true }
        ],
        config: { text: 'Curso online de alta conversão para criação de infoprodutos com IA' },
        state: 'IDLE'
      },
      {
        id: 'tpl-sp-ava',
        type: 'marketing-avatar',
        label: 'Avatar & Dores Viscerais',
        category: 'AI',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'Briefing', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-avatar', name: 'avatar', label: 'Perfil do Avatar', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-sp-copy',
        type: 'marketing-sales-page',
        label: 'Página de Vendas 14-Blocos',
        category: 'AI',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-vsl', name: 'vsl', label: 'Avatar / Ângulo', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-sales-page', name: 'salesPage', label: 'Copy 14-Blocos', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-sp-sim',
        type: 'ai-conversion-simulator',
        label: 'Simulador CPS & Heatmap',
        category: 'AI',
        position: { x: 980, y: 150 },
        inputs: [
          { id: 'in-text', name: 'text', label: 'Texto da Copy', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-simulation', name: 'simulationResult', label: 'Resultado CPS', type: 'JSON', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-sp-1',
        sourceNodeId: 'tpl-sp-src',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-sp-ava',
        targetPortId: 'in-briefing',
        state: 'connected'
      },
      {
        id: 'tpl-conn-sp-2',
        sourceNodeId: 'tpl-sp-ava',
        sourcePortId: 'out-avatar',
        targetNodeId: 'tpl-sp-copy',
        targetPortId: 'in-vsl',
        state: 'connected'
      },
      {
        id: 'tpl-conn-sp-3',
        sourceNodeId: 'tpl-sp-copy',
        sourcePortId: 'out-sales-page',
        targetNodeId: 'tpl-sp-sim',
        targetPortId: 'in-text',
        state: 'connected'
      }
    ]
  },

  // 6. Chat Inteligente com Documentos & RAG
  {
    id: 'document-rag-chat',
    name: 'Chat Inteligente com Documentos (RAG)',
    description: 'Extração estruturada de documentos e PDFs conectada a assistente conversacional inteligente com zero alucinação.',
    category: 'RESEARCH',
    tags: ['pdf', 'documentos', 'rag', 'chat-assistant'],
    icon: 'Search',
    estimatedCredits: 0.10,
    nodes: [
      {
        id: 'tpl-doc-src',
        type: 'source-pdf',
        label: 'Documento / E-book PDF',
        category: 'SOURCE',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-doc', name: 'document', label: 'Arquivo PDF', type: 'DOCUMENT', isMulti: false, required: true }
        ],
        config: { fileName: 'relatorio-mercado.pdf' },
        state: 'IDLE'
      },
      {
        id: 'tpl-doc-ext',
        type: 'extractor-document-text',
        label: 'Extrator de Texto Puro',
        category: 'EXTRACTOR',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-doc', name: 'doc', label: 'Documento', type: 'DOCUMENT', isMulti: false, required: true }
        ],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Texto Extraído', type: 'TEXT', isMulti: false, required: true }
        ],
        config: {},
        state: 'IDLE'
      },
      {
        id: 'tpl-doc-prompt',
        type: 'source-text',
        label: 'Pergunta / Briefing',
        category: 'INPUT',
        position: { x: 380, y: 350 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Pergunta', type: 'TEXT', isMulti: false, required: true }
        ],
        config: { text: 'Quais são as 3 conclusões e dados mais importantes deste documento?' },
        state: 'IDLE'
      },
      {
        id: 'tpl-doc-chat',
        type: 'ai-chat',
        label: 'Assistente Especialista (RAG)',
        category: 'AI',
        position: { x: 680, y: 220 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexto do Arquivo', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Pergunta', type: 'TEXT', isMulti: false, required: true }
        ],
        outputs: [
          { id: 'out-response', name: 'response', label: 'Resposta Estruturada', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: { model: 'auto' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-doc-1',
        sourceNodeId: 'tpl-doc-src',
        sourcePortId: 'out-doc',
        targetNodeId: 'tpl-doc-ext',
        targetPortId: 'in-doc',
        state: 'connected'
      },
      {
        id: 'tpl-conn-doc-2',
        sourceNodeId: 'tpl-doc-ext',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-doc-chat',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-conn-doc-3',
        sourceNodeId: 'tpl-doc-prompt',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-doc-chat',
        targetPortId: 'in-prompt',
        state: 'connected'
      }
    ]
  },

  // 7. Agente Autônomo com Raciocínio (ReAct)
  {
    id: 'autonomous-react-agent',
    name: 'Agente Autônomo Reflexivo (ReAct)',
    description: 'Agente inteligente com ciclo de pensamento, execução com ferramentas e critério de parada autônomo.',
    category: 'AUTOMATION',
    tags: ['react', 'agente', 'autonomo', 'raciocinio'],
    icon: 'Sparkles',
    estimatedCredits: 0.16,
    nodes: [
      {
        id: 'tpl-agt-goal',
        type: 'source-text',
        label: 'Objetivo / Meta Estratégica',
        category: 'INPUT',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Meta', type: 'TEXT', isMulti: false, required: true }
        ],
        config: { text: 'Analisar tendências de infoprodutos de IA e gerar proposta irresistível de mentoria' },
        state: 'IDLE'
      },
      {
        id: 'tpl-agt-react',
        type: 'ai-agent-autonomous',
        label: 'Agente Autônomo (ReAct)',
        category: 'AI',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-goal', name: 'goal', label: 'Meta', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-result', name: 'result', label: 'Solução Final', type: 'AI_RESPONSE', isMulti: true, required: true },
          { id: 'out-logs', name: 'steps', label: 'Passos de Raciocínio', type: 'JSON', isMulti: true, required: false }
        ],
        config: { maxSteps: 5 },
        state: 'IDLE'
      },
      {
        id: 'tpl-agt-sim',
        type: 'ai-conversion-simulator',
        label: 'Simulador CPS de Conversão',
        category: 'AI',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-text', name: 'text', label: 'Solução da IA', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-simulation', name: 'simulationResult', label: 'Nota CPS & Feedback', type: 'JSON', isMulti: true, required: true }
        ],
        config: {},
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-agt-1',
        sourceNodeId: 'tpl-agt-goal',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-agt-react',
        targetPortId: 'in-goal',
        state: 'connected'
      },
      {
        id: 'tpl-conn-agt-2',
        sourceNodeId: 'tpl-agt-react',
        sourcePortId: 'out-result',
        targetNodeId: 'tpl-agt-sim',
        targetPortId: 'in-text',
        state: 'connected'
      }
    ]
  },

  // 8. Automação Recorrente no Piloto Automático (Schedule Trigger)
  {
    id: 'recurring-automation-pipeline',
    name: 'Automação Recorrente (Cron Schedule)',
    description: 'Pipeline acionado automaticamente em intervalos regulares para raspar dados, sintetizar com IA e exportar ativos.',
    category: 'AUTOMATION',
    tags: ['cron', 'schedule', 'automacao', 'recorrente'],
    icon: 'Sparkles',
    estimatedCredits: 0.14,
    nodes: [
      {
        id: 'tpl-auto-cron',
        type: 'trigger-schedule',
        label: 'Agendador Recorrente (Cron)',
        category: 'SOURCE',
        position: { x: 80, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-tick', name: 'tick', label: 'Disparo Programado', type: 'METADATA', isMulti: true, required: true }
        ],
        config: { cronExpression: '0 9 * * *' },
        state: 'IDLE'
      },
      {
        id: 'tpl-auto-src',
        type: 'source-website',
        label: 'Rastreador de Notícias / Mercado',
        category: 'SOURCE',
        position: { x: 380, y: 150 },
        inputs: [
          { id: 'in-url', name: 'url', label: 'Disparo ou URL', type: 'METADATA', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Conteúdo Atualizado', type: 'TEXT', isMulti: true, required: true }
        ],
        config: { url: 'https://news.ycombinator.com' },
        state: 'IDLE'
      },
      {
        id: 'tpl-auto-wri',
        type: 'ai-writer',
        label: 'Redator de Newsletter Diária',
        category: 'AI',
        position: { x: 680, y: 150 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'Notícias do Dia', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-content', name: 'content', label: 'Newsletter Pronta', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: { format: 'executive-summary' },
        state: 'IDLE'
      },
      {
        id: 'tpl-auto-exp',
        type: 'output-content',
        label: 'Exportador de Pacote',
        category: 'OUTPUT',
        position: { x: 980, y: 150 },
        inputs: [
          { id: 'in-results', name: 'results', label: 'Conteúdo Final', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        outputs: [],
        config: { exportFormat: 'markdown-pack' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-conn-auto-1',
        sourceNodeId: 'tpl-auto-cron',
        sourcePortId: 'out-tick',
        targetNodeId: 'tpl-auto-src',
        targetPortId: 'in-url',
        state: 'connected'
      },
      {
        id: 'tpl-conn-auto-2',
        sourceNodeId: 'tpl-auto-src',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-auto-wri',
        targetPortId: 'in-briefing',
        state: 'connected'
      },
      {
        id: 'tpl-conn-auto-3',
        sourceNodeId: 'tpl-auto-wri',
        sourcePortId: 'out-content',
        targetNodeId: 'tpl-auto-exp',
        targetPortId: 'in-results',
        state: 'connected'
      }
    ]
  },
  // 9. Multi-Video Knowledge Forge (3 YouTube -> Conhecimento AI / E-book)
  {
    id: 'multi-video-knowledge-forge',
    name: 'Síntese Multi-Vídeo: 3 YouTube -> Conhecimento AI / E-book',
    description: 'Conecta 3 vídeos do YouTube simultaneamente num nó central de IA para consolidar pontos-chave e forjar um e-book completo com > 1.000 palavras por capítulo.',
    category: 'CONTENT',
    tags: ['youtube', 'multi-video', 'ebook', 'knowledge-synthesis', 'canvas-forge'],
    icon: 'Video',
    estimatedCredits: 0.15,
    nodes: [
      {
        id: 'yt-vid-1',
        type: 'source-youtube',
        label: 'YouTube: Tráfego Pago',
        category: 'SOURCE',
        position: { x: 60, y: 50 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoId: 'dQw4w9WgXcQ',
          videoTitle: 'Como Começar no Tráfego Pago',
          channelTitle: 'Performance Masters',
          duration: '18:32',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        },
        state: 'IDLE'
      },
      {
        id: 'yt-vid-2',
        type: 'source-youtube',
        label: 'YouTube: Revolução da IA',
        category: 'SOURCE',
        position: { x: 60, y: 320 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=aircAruvnKk',
          videoId: 'aircAruvnKk',
          videoTitle: 'A Revolução da Inteligência Artificial',
          channelTitle: 'Tech Visionary',
          duration: '22:15',
          thumbnailUrl: 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg'
        },
        state: 'IDLE'
      },
      {
        id: 'yt-vid-3',
        type: 'source-youtube',
        label: 'YouTube: Marketing Digital',
        category: 'SOURCE',
        position: { x: 60, y: 590 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
          videoId: 'kJQP7kiw5Fk',
          videoTitle: 'Como Começar no Marketing Digital',
          channelTitle: 'Growth Playbook',
          duration: '15:40',
          thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg'
        },
        state: 'IDLE'
      },
      {
        id: 'ai-knowledge-forge',
        type: 'ai-ebook-forge',
        label: 'Conhecimento & E-book AI (Síntese)',
        category: 'AI',
        position: { x: 560, y: 220 },
        inputs: [
          { id: 'in-topic', name: 'topic', label: 'Tema / Briefing', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-context', name: 'context', label: 'Pesquisa / Dados', type: 'DOCUMENT', isMulti: true, required: false },
          { id: 'in-avatar', name: 'avatar', label: 'Avatar ICP', type: 'JSON', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-ebook', name: 'ebook', label: 'Livro Digital (JSON)', type: 'DOCUMENT', isMulti: true, required: true },
          { id: 'out-markdown', name: 'markdown', label: 'Texto Completo (MD)', type: 'TEXT', isMulti: true, required: true },
          { id: 'out-chapters', name: 'chapters', label: 'Capítulos Estruturados', type: 'JSON', isMulti: true, required: true }
        ],
        config: {
          title: 'Manual de Escala Digital & IA: Síntese de 3 Vídeos',
          niche: 'Marketing de Performance & Negócios com IA',
          pageCount: 10,
          wordsPerChapter: 1000,
          tone: 'authoritative'
        },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'conn-vid-1',
        sourceNodeId: 'yt-vid-1',
        sourcePortId: 'out-transcript',
        targetNodeId: 'ai-knowledge-forge',
        targetPortId: 'in-topic',
        state: 'connected'
      },
      {
        id: 'conn-vid-2',
        sourceNodeId: 'yt-vid-2',
        sourcePortId: 'out-transcript',
        targetNodeId: 'ai-knowledge-forge',
        targetPortId: 'in-topic',
        state: 'connected'
      },
      {
        id: 'conn-vid-3',
        sourceNodeId: 'yt-vid-3',
        sourcePortId: 'out-transcript',
        targetNodeId: 'ai-knowledge-forge',
        targetPortId: 'in-context',
        state: 'connected'
      }
    ]
  }
];
