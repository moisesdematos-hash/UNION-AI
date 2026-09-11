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
  }
];
