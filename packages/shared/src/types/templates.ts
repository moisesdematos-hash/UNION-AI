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
  },

  // 12. Vídeo para Livro Completo (E-book Forge 3x)
  {
    id: 'video-to-ebook-flow',
    name: 'Vídeo para Livro Completo (E-book Forge)',
    description: 'Transforma um vídeo do YouTube em e-book editorial profundo com 10+ páginas, capítulos > 1.000 palavras e visualizador quadrado no Canvas.',
    category: 'CONTENT',
    tags: ['youtube', 'ebook', 'leitor-3x', 'pdf-editorial'],
    icon: 'BookOpen',
    estimatedCredits: 0.18,
    nodes: [
      {
        id: 'tpl-vte-src',
        type: 'source-youtube',
        label: 'YouTube Source',
        category: 'SOURCE',
        position: { x: 60, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'Masterclass: Escala e IA Estratégica',
          duration: '18:30',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vte-forge',
        type: 'ai-ebook-forge',
        label: 'Union E-book Forge',
        category: 'AI',
        position: { x: 420, y: 150 },
        inputs: [
          { id: 'in-topic', name: 'topic', label: 'Tema / Briefing', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-context', name: 'context', label: 'Pesquisa / Dados', type: 'DOCUMENT', isMulti: true, required: false }
        ],
        outputs: [
          { id: 'out-ebook', name: 'ebook', label: 'Livro Digital (JSON)', type: 'DOCUMENT', isMulti: true, required: true },
          { id: 'out-markdown', name: 'markdown', label: 'Texto Completo (MD)', type: 'TEXT', isMulti: true, required: true },
          { id: 'out-chapters', name: 'chapters', label: 'Capítulos Estruturados', type: 'JSON', isMulti: true, required: true }
        ],
        config: {
          title: 'Manual de Escala Digital & IA',
          niche: 'Negócios Online & Automação',
          pageCount: 10,
          wordsPerChapter: 1000,
          tone: 'authoritative'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vte-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída (Quadrado 3x)',
        category: 'OUTPUT',
        position: { x: 920, y: 150 },
        inputs: [
          { id: 'in-ebook', name: 'ebook', label: 'E-book / Documento', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [],
        config: {
          title: 'Visualizador de Saída',
          format: 'markdown-bundle'
        },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-vte-conn-1',
        sourceNodeId: 'tpl-vte-src',
        sourcePortId: 'out-transcript',
        targetNodeId: 'tpl-vte-forge',
        targetPortId: 'in-topic',
        state: 'connected'
      },
      {
        id: 'tpl-vte-conn-2',
        sourceNodeId: 'tpl-vte-forge',
        sourcePortId: 'out-ebook',
        targetNodeId: 'tpl-vte-viewer',
        targetPortId: 'in-ebook',
        state: 'connected'
      }
    ]
  },

  // 13. Chat Inteligente com Vídeo (AI Chat 3x)
  {
    id: 'video-to-chat-flow',
    name: 'Chat Inteligente com Vídeo (AI Chat 3x)',
    description: 'Extrai a transcrição de um vídeo e conecta instantaneamente ao assistente conversacional quadrado 3x para análise e Q&A dinâmico.',
    category: 'CONTENT',
    tags: ['youtube', 'ai-chat', 'chat-3x', 'transcricao'],
    icon: 'MessageSquare',
    estimatedCredits: 0.08,
    nodes: [
      {
        id: 'tpl-vtc-src',
        type: 'source-youtube',
        label: 'YouTube Source',
        category: 'SOURCE',
        position: { x: 60, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'Análise de Estratégias & Crescimento',
          duration: '14:20',
          thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vtc-chat',
        type: 'ai-chat',
        label: 'AI Chat Assistant',
        category: 'AI',
        position: { x: 420, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Prompt', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-response', name: 'response', label: 'AI Response', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: {
          model: 'groq-llama-3',
          prompt: 'Analise esta transcrição e extraia os 5 principais insights estratégicos.'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vtc-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída',
        category: 'OUTPUT',
        position: { x: 1120, y: 150 },
        inputs: [
          { id: 'in-ebook', name: 'ebook', label: 'E-book / Documento', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [],
        config: {
          title: 'Visualizador de Saída'
        },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-vtc-conn-1',
        sourceNodeId: 'tpl-vtc-src',
        sourcePortId: 'out-transcript',
        targetNodeId: 'tpl-vtc-chat',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-vtc-conn-2',
        sourceNodeId: 'tpl-vtc-chat',
        sourcePortId: 'out-response',
        targetNodeId: 'tpl-vtc-viewer',
        targetPortId: 'in-markdown',
        state: 'connected'
      }
    ]
  },

  // 14. Estratégia & Copywriting de Conversão
  {
    id: 'strategy-copywriting-flow',
    name: 'Estratégia & Copywriting de Conversão',
    description: 'Pipeline completo de inteligência competitiva que analisa dados de mercado e gera copy persuasiva validada para campanhas digitais.',
    category: 'MARKETING',
    tags: ['marketing', 'copywriting', 'analyst', 'vsl'],
    icon: 'TrendingUp',
    estimatedCredits: 0.16,
    nodes: [
      {
        id: 'tpl-strat-site',
        type: 'source-website',
        label: 'Website Crawler',
        category: 'SOURCE',
        position: { x: 60, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Clean Text', type: 'TEXT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: { url: 'https://exemplo.com/produto' },
        state: 'IDLE'
      },
      {
        id: 'tpl-strat-analyst',
        type: 'ai-analyst',
        label: 'AI Market Analyst',
        category: 'AI',
        position: { x: 400, y: 150 },
        inputs: [
          { id: 'in-sources', name: 'sources', label: 'Data Sources', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-analysis', name: 'analysis', label: 'Analysis Report', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: { model: 'deepseek-r1' },
        state: 'IDLE'
      },
      {
        id: 'tpl-strat-writer',
        type: 'ai-writer',
        label: 'AI Creative Copywriter',
        category: 'AI',
        position: { x: 740, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Briefing', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-content', name: 'content', label: 'Content', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: {
          model: 'claude-3-7-sonnet',
          format: 'instagram-carousel'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-strat-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída',
        category: 'OUTPUT',
        position: { x: 1080, y: 150 },
        inputs: [
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [],
        config: { title: 'Campanha de Copywriting' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-strat-c1',
        sourceNodeId: 'tpl-strat-site',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-strat-analyst',
        targetPortId: 'in-sources',
        state: 'connected'
      },
      {
        id: 'tpl-strat-c2',
        sourceNodeId: 'tpl-strat-analyst',
        sourcePortId: 'out-analysis',
        targetNodeId: 'tpl-strat-writer',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-strat-c3',
        sourceNodeId: 'tpl-strat-writer',
        sourcePortId: 'out-content',
        targetNodeId: 'tpl-strat-viewer',
        targetPortId: 'in-markdown',
        state: 'connected'
      }
    ]
  },

  // 15. Cinema E-book Flow
  {
    id: 'cinematic-ebook-flow',
    name: '🎬 Cinema E-book Cinematográfico',
    description: 'Extrai transcrição de vídeo e gera um e-book cinematográfico ultramoderno com narrativa noir/sci-fi, arcos emocionais por capítulo e linguagem editorial de alto impacto.',
    category: 'CONTENT',
    tags: ['cinema', 'ebook', 'narrativa', 'ultramoderno', 'youtube', 'noir'],
    icon: 'Film',
    estimatedCredits: 0.20,
    nodes: [
      {
        id: 'tpl-cin-src',
        type: 'source-youtube',
        label: 'YouTube Source',
        category: 'SOURCE',
        position: { x: 60, y: 200 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'Conteúdo para E-book Cinematográfico',
          duration: '18:45'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-cin-agent',
        type: 'ai-cinema-agent',
        label: '🎬 Cinema E-book Agent',
        category: 'AI',
        position: { x: 420, y: 200 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexto / Transcrição', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Briefing / Instrução', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-ebook', name: 'ebook', label: 'E-book Cinematográfico', type: 'DOCUMENT', isMulti: true, required: true },
          { id: 'out-synopsis', name: 'synopsis', label: 'Sinopse & Pitch', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {
          genre: 'thriller-transformacao',
          cinematicStyle: 'noir-futurista',
          chapters: 7,
          wordsPerChapter: 1200,
          protagonist: 'O Visionário',
          model: 'groq-llama-3'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-cin-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída',
        category: 'OUTPUT',
        position: { x: 1100, y: 200 },
        inputs: [
          { id: 'in-ebook', name: 'ebook', label: 'E-book / Documento', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [],
        config: { title: 'E-book Cinematográfico' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-cin-c1',
        sourceNodeId: 'tpl-cin-src',
        sourcePortId: 'out-transcript',
        targetNodeId: 'tpl-cin-agent',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-cin-c2',
        sourceNodeId: 'tpl-cin-agent',
        sourcePortId: 'out-ebook',
        targetNodeId: 'tpl-cin-viewer',
        targetPortId: 'in-ebook',
        state: 'connected'
      }
    ]
  },

  // 16. Página de Vendas 14-Blocos & Auto-Cura CPS ➔ Visualizador
  {
    id: 'sales-page-simulation-flow',
    name: 'Página de Vendas 14-Blocos & Auto-Cura CPS',
    description: 'Gera copy completa em 14 blocos psicológicos de alta conversão, submete ao teste cego contra 5 personas sintéticas com cálculo de CPS e entrega a versão curada no Visualizador 3x.',
    category: 'MARKETING',
    tags: ['marketing', 'sales-page', 'cps-simulator', '14-blocos', 'auto-healing'],
    icon: 'Target',
    estimatedCredits: 0.18,
    nodes: [
      {
        id: 'tpl-sps-briefing',
        type: 'source-text',
        label: 'Briefing da Oferta',
        category: 'INPUT',
        position: { x: 60, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Briefing Estratégico', type: 'TEXT', isMulti: false, required: true }
        ],
        config: {
          text: 'Produto: Mentoria Elite de Escala com IA\nPúblico: Empreendedores e Consultores\nPreço: R$ 2.997\nPromessa: Construir e automatizar esteiras de aquisição com agentes de IA em 30 dias.'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-sps-copy',
        type: 'marketing-sales-page',
        label: 'Copywriter 14-Blocos',
        category: 'AI',
        position: { x: 400, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Offer Briefing', type: 'TEXT', isMulti: true, required: true },
          { id: 'in-avatar', name: 'avatar', label: 'Avatar / ICP', type: 'JSON', isMulti: false, required: false },
          { id: 'in-vsl', name: 'vslScript', label: 'VSL / Briefing', type: 'DOCUMENT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-copy', name: 'salesPageCopy', label: 'Full Sales Page Copy', type: 'DOCUMENT', isMulti: true, required: true },
          { id: 'out-json', name: 'blocksJson', label: '14-Block JSON', type: 'JSON', isMulti: true, required: true }
        ],
        config: {
          productName: 'Mentoria Elite de Escala com IA',
          targetAudience: 'Empreendedores e Consultores',
          offerPrice: 'R$ 2.997 à vista ou 12x de R$ 297',
          model: 'groq-llama-3'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-sps-sim',
        type: 'ai-conversion-simulator',
        label: 'Simulador CPS & Auto-Cura',
        category: 'AI',
        position: { x: 740, y: 150 },
        inputs: [
          { id: 'in-copy', name: 'copy', label: 'Copy / VSL Blocks', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-json', name: 'blocksJson', label: 'Blocks JSON', type: 'JSON', isMulti: false, required: false },
          { id: 'in-text', name: 'text', label: 'Raw Copy Text', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-simulation', name: 'simulationResult', label: 'Simulation & CPS Score', type: 'JSON', isMulti: true, required: true },
          { id: 'out-healed', name: 'healedCopy', label: 'Auto-Healed Copy', type: 'DOCUMENT', isMulti: true, required: false }
        ],
        config: {
          sourceType: 'SALES_PAGE',
          targetNiche: 'Marketing Digital e Consultoria',
          autoHealDropOffs: true
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-sps-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída',
        category: 'OUTPUT',
        position: { x: 1080, y: 150 },
        inputs: [
          { id: 'in-ebook', name: 'ebook', label: 'E-book / Documento', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false },
          { id: 'in-data', name: 'data', label: 'Dados Gerais', type: 'JSON', isMulti: false, required: false }
        ],
        outputs: [],
        config: { title: 'Página de Vendas Validada (CPS)' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-sps-c1',
        sourceNodeId: 'tpl-sps-briefing',
        sourcePortId: 'out-text',
        targetNodeId: 'tpl-sps-copy',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-sps-c2',
        sourceNodeId: 'tpl-sps-copy',
        sourcePortId: 'out-copy',
        targetNodeId: 'tpl-sps-sim',
        targetPortId: 'in-text',
        state: 'connected'
      },
      {
        id: 'tpl-sps-c3',
        sourceNodeId: 'tpl-sps-sim',
        sourcePortId: 'out-healed',
        targetNodeId: 'tpl-sps-viewer',
        targetPortId: 'in-ebook',
        state: 'connected'
      }
    ]
  },

  // 17. Repurposing Viral Omnichannel: Vídeo ➔ Roteiro Reels & Carrossel ➔ Chat 3x
  {
    id: 'viral-repurpose-omnichannel-flow',
    name: 'Repurposing Viral: Vídeo ➔ Carrossel & Reels ➔ Chat 3x',
    description: 'Transforma um vídeo longo em múltiplos ativos virais (carrossel de 10 slides, roteiro de alta retenção para Reels) e conecta ao AI Chat 3x para ajuste dinâmico com visualização instantânea.',
    category: 'CONTENT',
    tags: ['youtube', 'reels', 'carrossel', 'repurpose', 'ai-chat', 'viral'],
    icon: 'Share2',
    estimatedCredits: 0.15,
    nodes: [
      {
        id: 'tpl-vro-src',
        type: 'source-youtube',
        label: 'YouTube Source',
        category: 'SOURCE',
        position: { x: 60, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'Masterclass de Posicionamento & Vendas',
          duration: '22:15'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vro-writer',
        type: 'ai-writer',
        label: 'Transformador Viral',
        category: 'AI',
        position: { x: 400, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Briefing', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-content', name: 'content', label: 'Content', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: {
          model: 'groq-llama-3',
          format: 'instagram-carousel'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vro-chat',
        type: 'ai-chat',
        label: 'AI Chat Assistant',
        category: 'AI',
        position: { x: 740, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Prompt', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-response', name: 'response', label: 'AI Response', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: {
          model: 'groq-llama-3',
          prompt: 'Refine os ganchos do carrossel para maximizar cliques e compartilhamentos.'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-vro-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída',
        category: 'OUTPUT',
        position: { x: 1440, y: 150 },
        inputs: [
          { id: 'in-ebook', name: 'ebook', label: 'E-book / Documento', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [],
        config: { title: 'Ativos Virais Prontos' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-vro-c1',
        sourceNodeId: 'tpl-vro-src',
        sourcePortId: 'out-transcript',
        targetNodeId: 'tpl-vro-writer',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-vro-c2',
        sourceNodeId: 'tpl-vro-writer',
        sourcePortId: 'out-content',
        targetNodeId: 'tpl-vro-chat',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-vro-c3',
        sourceNodeId: 'tpl-vro-chat',
        sourcePortId: 'out-response',
        targetNodeId: 'tpl-vro-viewer',
        targetPortId: 'in-markdown',
        state: 'connected'
      }
    ]
  },

  // 18. 👑 Chave de Ouro: Império Autônomo de Conteúdo & Vendas
  {
    id: 'golden-key-master-flow',
    name: '👑 Chave de Ouro: Império Autônomo de Conteúdo & Vendas',
    description: 'O ápice da automação UNION.AI: transforma um único vídeo em um E-book Cinematográfico completo (>7.000 palavras), uma Página de Vendas de 14 Blocos validada pelo Simulador CPS com Auto-Cura, conectando tudo a um AI Chat 3x e ao Visualizador de Saída com download .MD e PDF.',
    category: 'MARKETING',
    tags: ['chave-de-ouro', 'imperio', 'cinema-ebook', 'sales-page', 'simulador-cps', 'ai-chat', 'groq'],
    icon: 'Crown',
    estimatedCredits: 0.35,
    nodes: [
      {
        id: 'tpl-gkm-src',
        type: 'source-youtube',
        label: 'YouTube Intelligence',
        category: 'SOURCE',
        position: { x: 60, y: 150 },
        inputs: [],
        outputs: [
          { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
          { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true }
        ],
        config: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          videoTitle: 'A Nova Ordem da Inteligência Artificial: Estratégias & Escala',
          duration: '28:40'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-gkm-cinema',
        type: 'ai-cinema-agent',
        label: '🎬 Cinema E-book Agent',
        category: 'AI',
        position: { x: 420, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexto / Transcrição', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Briefing / Instrução', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-ebook', name: 'ebook', label: 'E-book Cinematográfico', type: 'DOCUMENT', isMulti: true, required: true },
          { id: 'out-synopsis', name: 'synopsis', label: 'Sinopse & Pitch', type: 'TEXT', isMulti: true, required: true }
        ],
        config: {
          genre: 'thriller-transformacao',
          cinematicStyle: 'noir-futurista',
          chapters: 7,
          wordsPerChapter: 1200,
          protagonist: 'O Construtor do Futuro',
          model: 'groq-llama-3'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-gkm-copy',
        type: 'marketing-sales-page',
        label: 'Copywriter 14-Blocos',
        category: 'AI',
        position: { x: 1140, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Offer Briefing', type: 'TEXT', isMulti: true, required: true },
          { id: 'in-avatar', name: 'avatar', label: 'Avatar / ICP', type: 'JSON', isMulti: false, required: false },
          { id: 'in-vsl', name: 'vslScript', label: 'VSL / Briefing', type: 'DOCUMENT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-copy', name: 'salesPageCopy', label: 'Full Sales Page Copy', type: 'DOCUMENT', isMulti: true, required: true },
          { id: 'out-json', name: 'blocksJson', label: '14-Block JSON', type: 'JSON', isMulti: true, required: true }
        ],
        config: {
          productName: 'Protocolo UNION: O Império Autônomo',
          targetAudience: 'Infoprodutores, Agências de IA e Especialistas',
          offerPrice: '12x de R$ 197 ou R$ 1.997 à vista',
          model: 'groq-llama-3'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-gkm-sim',
        type: 'ai-conversion-simulator',
        label: 'Simulador CPS & Auto-Cura',
        category: 'AI',
        position: { x: 1480, y: 150 },
        inputs: [
          { id: 'in-copy', name: 'copy', label: 'Copy / VSL Blocks', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-json', name: 'blocksJson', label: 'Blocks JSON', type: 'JSON', isMulti: false, required: false },
          { id: 'in-text', name: 'text', label: 'Raw Copy Text', type: 'TEXT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-simulation', name: 'simulationResult', label: 'Simulation & CPS Score', type: 'JSON', isMulti: true, required: true },
          { id: 'out-healed', name: 'healedCopy', label: 'Auto-Healed Copy', type: 'DOCUMENT', isMulti: true, required: false }
        ],
        config: {
          sourceType: 'SALES_PAGE',
          targetNiche: 'Marketing de Alta Conversão',
          autoHealDropOffs: true
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-gkm-chat',
        type: 'ai-chat',
        label: 'AI Chat Assistant 3x',
        category: 'AI',
        position: { x: 1820, y: 150 },
        inputs: [
          { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT', isMulti: true, required: false },
          { id: 'in-prompt', name: 'prompt', label: 'Prompt', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [
          { id: 'out-response', name: 'response', label: 'AI Response', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: {
          model: 'groq-llama-3',
          prompt: 'Analise o e-book cinematográfico e a copy dos 14 blocos para sugerir 3 ângulos de tráfego pago.'
        },
        state: 'IDLE'
      },
      {
        id: 'tpl-gkm-viewer',
        type: 'output-modal-viewer',
        label: 'Visualizador de Saída 3x',
        category: 'OUTPUT',
        position: { x: 2540, y: 150 },
        inputs: [
          { id: 'in-ebook', name: 'ebook', label: 'E-book / Documento', type: 'DOCUMENT', isMulti: false, required: false },
          { id: 'in-markdown', name: 'markdown', label: 'Texto / Markdown', type: 'TEXT', isMulti: false, required: false }
        ],
        outputs: [],
        config: { title: 'Dossiê do Império: E-book & Copy Validada' },
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'tpl-gkm-c1',
        sourceNodeId: 'tpl-gkm-src',
        sourcePortId: 'out-transcript',
        targetNodeId: 'tpl-gkm-cinema',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-gkm-c2',
        sourceNodeId: 'tpl-gkm-cinema',
        sourcePortId: 'out-synopsis',
        targetNodeId: 'tpl-gkm-copy',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-gkm-c3',
        sourceNodeId: 'tpl-gkm-copy',
        sourcePortId: 'out-copy',
        targetNodeId: 'tpl-gkm-sim',
        targetPortId: 'in-text',
        state: 'connected'
      },
      {
        id: 'tpl-gkm-c4',
        sourceNodeId: 'tpl-gkm-sim',
        sourcePortId: 'out-healed',
        targetNodeId: 'tpl-gkm-chat',
        targetPortId: 'in-context',
        state: 'connected'
      },
      {
        id: 'tpl-gkm-c5',
        sourceNodeId: 'tpl-gkm-cinema',
        sourcePortId: 'out-ebook',
        targetNodeId: 'tpl-gkm-viewer',
        targetPortId: 'in-ebook',
        state: 'connected'
      },
      {
        id: 'tpl-gkm-c6',
        sourceNodeId: 'tpl-gkm-chat',
        sourcePortId: 'out-response',
        targetNodeId: 'tpl-gkm-viewer',
        targetPortId: 'in-markdown',
        state: 'connected'
      }
    ]
  }
];
