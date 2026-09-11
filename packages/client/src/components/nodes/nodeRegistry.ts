import { NodeDefinition, NodeCategory } from '@union/shared';

export interface NodeTemplate {
  type: string;
  label: string;
  category: NodeCategory;
  description: string;
  inputs: NodeDefinition['inputs'];
  outputs: NodeDefinition['outputs'];
  defaultConfig: Record<string, unknown>;
}

export const NODE_TEMPLATES: Record<string, NodeTemplate> = {
  // --- AUTOMATION & TRIGGER NODES ---
  'trigger-webhook': {
    type: 'trigger-webhook',
    label: 'Webhook Trigger',
    category: 'SOURCE',
    description: 'Dispara o workflow automaticamente via requisição HTTP externa com autenticação por token',
    inputs: [],
    outputs: [
      { id: 'out-data', name: 'data', label: 'Webhook Data', type: 'JSON', isMulti: true, required: true },
      { id: 'out-text', name: 'text', label: 'Payload Raw Text', type: 'TEXT', isMulti: true, required: false }
    ],
    defaultConfig: {
      secretToken: 'whk_auto_token',
      expectedMethod: 'POST'
    }
  },

  'trigger-schedule': {
    type: 'trigger-schedule',
    label: 'Schedule Trigger (Cron)',
    category: 'SOURCE',
    description: 'Executa o grafo em horários recorrentes ou intervalos programados (expressão Cron)',
    inputs: [],
    outputs: [
      { id: 'out-tick', name: 'tick', label: 'Trigger Event', type: 'METADATA', isMulti: true, required: true }
    ],
    defaultConfig: {
      cronExpression: '0 9 * * *',
      timezone: 'America/Sao_Paulo'
    }
  },

  'flow-loop': {
    type: 'flow-loop',
    label: 'Loop & List Iterator',
    category: 'TRANSFORM',
    description: 'Itera sobre elementos de uma lista ou array de dados com limite de segurança anti-infinito',
    inputs: [
      { id: 'in-items', name: 'items', label: 'Items List', type: 'JSON', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-item', name: 'item', label: 'Current Item', type: 'JSON', isMulti: true, required: true },
      { id: 'out-accumulated', name: 'accumulated', label: 'All Results', type: 'JSON', isMulti: true, required: true }
    ],
    defaultConfig: {
      maxIterations: 10,
      accumulateOutput: true
    }
  },

  'ai-agent-autonomous': {
    type: 'ai-agent-autonomous',
    label: 'Autonomous Agent (ReAct)',
    category: 'AI',
    description: 'Agente reflexivo com ciclo de pensamento, ação com ferramentas e critério de parada autônomo',
    inputs: [
      { id: 'in-goal', name: 'goal', label: 'Objective / Briefing', type: 'TEXT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-result', name: 'result', label: 'Final Solution', type: 'AI_RESPONSE', isMulti: true, required: true },
      { id: 'out-logs', name: 'steps', label: 'Thought Steps', type: 'JSON', isMulti: true, required: false }
    ],
    defaultConfig: {
      agentGoal: 'Analisar tendências e gerar ativos otimizados',
      maxSteps: 5,
      reflectionEnabled: true
    }
  },

  // --- UNDERSTAND & MARKETING INTELLIGENCE NODES ---
  'marketing-avatar': {
    type: 'marketing-avatar',
    label: 'Marketing Avatar / Persona',
    category: 'UNDERSTAND',
    description: 'Constrói o perfil profundo do ICP, dores viscerais, desejos, objeções e os 5 níveis de consciência de Schwartz',
    inputs: [
      { id: 'in-context', name: 'context', label: 'Briefing / Research', type: 'TEXT', isMulti: true, required: false }
    ],
    outputs: [
      { id: 'out-avatar', name: 'avatar', label: 'Avatar Profile', type: 'JSON', isMulti: true, required: true },
      { id: 'out-dossier', name: 'dossier', label: 'Persona Dossier', type: 'DOCUMENT', isMulti: true, required: true }
    ],
    defaultConfig: {
      niche: 'Infoprodutos / Educação Online',
      targetAudience: 'Empreendedores e Produtores Digitais',
      awarenessLevel: 'PROBLEM_AWARE',
      primaryPain: 'Sobrecarga operacional e lentidão na criação de funis de vendas'
    }
  },

  'marketing-competitor': {
    type: 'marketing-competitor',
    label: 'Competitor Intelligence',
    category: 'UNDERSTAND',
    description: 'Mapeia concorrentes diretos e indiretos, matriz SWOT, promessas, vulnerabilidades e brechas de mercado',
    inputs: [
      { id: 'in-competitor-data', name: 'competitorData', label: 'Competitor URLs / Text', type: 'TEXT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-analysis', name: 'analysis', label: 'Analysis Report', type: 'JSON', isMulti: true, required: true },
      { id: 'out-swot', name: 'swot', label: 'SWOT Matrix', type: 'TABLE', isMulti: true, required: true }
    ],
    defaultConfig: {
      competitorName: 'Concorrente Alpha',
      marketSegment: 'Automação de Marketing com IA',
      focusArea: 'differentiators'
    }
  },

  // --- AI HIGH-CONVERTING COPYWRITING NODES ---
  'marketing-vsl': {
    type: 'marketing-vsl',
    label: 'VSL 12-Step Scriptwriter',
    category: 'AI',
    description: 'Gera roteiro completo de Video Sales Letter em 12 passos com gancho magnético, mecanismo único e oferta irresistível',
    inputs: [
      { id: 'in-avatar', name: 'avatar', label: 'Avatar Profile', type: 'JSON', isMulti: false, required: false },
      { id: 'in-context', name: 'context', label: 'Product Briefing', type: 'TEXT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-vsl', name: 'vslScript', label: 'Full VSL Script', type: 'DOCUMENT', isMulti: true, required: true },
      { id: 'out-hook', name: 'hook', label: 'Golden Hook', type: 'TEXT', isMulti: true, required: true },
      { id: 'out-steps', name: 'steps', label: '12-Step Breakdown', type: 'JSON', isMulti: true, required: false }
    ],
    defaultConfig: {
      productName: 'UNION.AI Marketing Suite',
      targetDurationMinutes: 15,
      urgencyLevel: 'high',
      uniqueMechanism: 'Grafo Visual de Execução Multi-Modelo em Tempo Real'
    }
  },

  'marketing-ads': {
    type: 'marketing-ads',
    label: 'Multi-Platform Ad Matrix',
    category: 'AI',
    description: 'Matriz de criativos de alta conversão para Meta Ads (Feed/Stories), Google Search e TikTok/Reels com ganchos variados',
    inputs: [
      { id: 'in-vsl-or-avatar', name: 'sourceCopy', label: 'Copy / Avatar Input', type: 'TEXT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-ads', name: 'adsMatrix', label: 'Ad Matrix JSON', type: 'JSON', isMulti: true, required: true },
      { id: 'out-copy', name: 'adCopies', label: 'Ad Copy Pack', type: 'DOCUMENT', isMulti: true, required: true }
    ],
    defaultConfig: {
      platforms: ['meta', 'google', 'tiktok'],
      numberOfVariants: 3,
      callToAction: 'COMEÇAR TESTE GRÁTIS'
    }
  },

  // --- SOURCE NODES ---
  'source-youtube': {
    type: 'source-youtube',
    label: 'YouTube Source',
    category: 'SOURCE',
    description: 'Extrai transcrição, metadados, título e capítulos de vídeo do YouTube',
    inputs: [
      { id: 'in-url', name: 'url', label: 'Video URL', type: 'URL', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
      { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true },
      { id: 'out-video', name: 'video', label: 'Video Ref', type: 'VIDEO', isMulti: true, required: false }
    ],
    defaultConfig: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      extractChapters: true
    }
  },

  'source-website': {
    type: 'source-website',
    label: 'Website Crawler',
    category: 'SOURCE',
    description: 'Rastreia páginas web e extrai corpo do texto limpo, títulos e links',
    inputs: [
      { id: 'in-url', name: 'url', label: 'Page URL', type: 'URL', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-text', name: 'text', label: 'Clean Text', type: 'TEXT', isMulti: true, required: true },
      { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: true },
      { id: 'out-document', name: 'document', label: 'Full Page', type: 'DOCUMENT', isMulti: true, required: false }
    ],
    defaultConfig: {
      url: 'https://example.com',
      depth: 1
    }
  },

  'source-pdf': {
    type: 'source-pdf',
    label: 'PDF Document',
    category: 'SOURCE',
    description: 'Extração estruturada de arquivos PDF, páginas, tabelas e textos',
    inputs: [],
    outputs: [
      { id: 'out-text', name: 'text', label: 'Extracted Text', type: 'TEXT', isMulti: true, required: true },
      { id: 'out-doc', name: 'document', label: 'PDF Doc', type: 'DOCUMENT', isMulti: true, required: true },
      { id: 'out-tables', name: 'tables', label: 'Tables', type: 'TABLE', isMulti: true, required: false }
    ],
    defaultConfig: {
      fileName: 'relatorio_mercado.pdf',
      pageRange: 'all'
    }
  },

  'source-text': {
    type: 'source-text',
    label: 'Text Prompt / Briefing',
    category: 'SOURCE',
    description: 'Entrada direta de texto, notas, insights ou instruções de briefing',
    inputs: [],
    outputs: [
      { id: 'out-text', name: 'text', label: 'Text Output', type: 'TEXT', isMulti: true, required: true }
    ],
    defaultConfig: {
      text: 'Descreva aqui o briefing ou tema central do workflow...'
    }
  },

  // --- EXTRACTOR NODES ---
  'extractor-transcript': {
    type: 'extractor-transcript',
    label: 'Transcript Extractor',
    category: 'EXTRACTOR',
    description: 'Processa vídeos e áudios gerando transcrições pontuadas com timestamps',
    inputs: [
      { id: 'in-media', name: 'media', label: 'Media Input', type: 'VIDEO', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
      { id: 'out-text', name: 'text', label: 'Raw Text', type: 'TEXT', isMulti: true, required: true }
    ],
    defaultConfig: {
      includeTimestamps: true,
      language: 'auto'
    }
  },

  'extractor-audio-transcript': {
    type: 'extractor-audio-transcript',
    label: 'Audio Transcriber',
    category: 'EXTRACTOR',
    description: 'Transcrever áudio para texto estruturado',
    inputs: [
      { id: 'in-audio', name: 'audio', label: 'Audio File', type: 'AUDIO', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
      { id: 'out-text', name: 'text', label: 'Raw Text', type: 'TEXT', isMulti: true, required: true }
    ],
    defaultConfig: {
      language: 'pt'
    }
  },

  'extractor-document-text': {
    type: 'extractor-document-text',
    label: 'Document Text Extractor',
    category: 'EXTRACTOR',
    description: 'Extrair texto de PDF ou documento DOCX',
    inputs: [
      { id: 'in-doc', name: 'doc', label: 'Document', type: 'DOCUMENT', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-text', name: 'text', label: 'Extracted Text', type: 'TEXT', isMulti: true, required: true }
    ],
    defaultConfig: {
      cleanArtifacts: true
    }
  },

  // --- GENERAL AI NODES ---
  'ai-chat': {
    type: 'ai-chat',
    label: 'AI Chat Assistant',
    category: 'AI',
    description: 'Agente conversacional de propósito geral com multi-contexto',
    inputs: [
      { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT', isMulti: true, required: false },
      { id: 'in-prompt', name: 'prompt', label: 'Prompt', type: 'TEXT', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-response', name: 'response', label: 'AI Response', type: 'AI_RESPONSE', isMulti: true, required: true }
    ],
    defaultConfig: {
      model: 'auto',
      systemPrompt: 'Você é um assistente de inteligência artificial altamente capacitado.',
      temperature: 0.7
    }
  },

  'ai-analyst': {
    type: 'ai-analyst',
    label: 'AI Market Analyst',
    category: 'AI',
    description: 'Analisa dados de mercado, concorrência, dores, desejos e mecanismos de vendas',
    inputs: [
      { id: 'in-sources', name: 'sources', label: 'Data Sources', type: 'TRANSCRIPT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-analysis', name: 'analysis', label: 'Analysis Report', type: 'AI_RESPONSE', isMulti: true, required: true },
      { id: 'out-json', name: 'insights', label: 'Structured JSON', type: 'JSON', isMulti: true, required: false }
    ],
    defaultConfig: {
      model: 'auto',
      focusArea: 'competitor-intelligence',
      temperature: 0.4
    }
  },

  'ai-writer': {
    type: 'ai-writer',
    label: 'AI Content Writer',
    category: 'AI',
    description: 'Gera roteiros, artigos, newsletters, carrosséis e posts de alta retenção',
    inputs: [
      { id: 'in-briefing', name: 'briefing', label: 'Briefing / Insights', type: 'TEXT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-content', name: 'content', label: 'Written Content', type: 'AI_RESPONSE', isMulti: true, required: true }
    ],
    defaultConfig: {
      model: 'auto',
      format: 'youtube-script',
      tone: 'persuasive',
      creativity: 0.7
    }
  },

  'ai-router': {
    type: 'ai-router',
    label: 'Smart AI Router',
    category: 'AI',
    description: 'Roteia dinamicamente a requisição para o melhor modelo (qualidade, custo ou velocidade)',
    inputs: [
      { id: 'in-task', name: 'task', label: 'Task Input', type: 'TEXT', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-routed', name: 'result', label: 'Routed Result', type: 'AI_RESPONSE', isMulti: true, required: true },
      { id: 'out-fast', name: 'fastBranch', label: 'Fast Branch', type: 'TEXT', isMulti: true, required: false },
      { id: 'out-deep', name: 'deepBranch', label: 'Deep Branch', type: 'TEXT', isMulti: true, required: false }
    ],
    defaultConfig: {
      mode: 'AUTO',
      optimizeFor: 'balanced',
      maxCost: 0.10
    }
  },

  'ai-vision': {
    type: 'ai-vision',
    label: 'Vision AI',
    category: 'AI',
    description: 'Análise e extração textual de imagem via IA Visual',
    inputs: [
      { id: 'in-image', name: 'image', label: 'Image Input', type: 'IMAGE', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-text', name: 'text', label: 'Extracted Text', type: 'TEXT', isMulti: true, required: true }
    ],
    defaultConfig: {
      model: 'gemini-1.5-pro',
      prompt: 'Descreva detalhadamente o conteúdo desta imagem e extraia todo texto visível.'
    }
  },

  'ai-transform': {
    type: 'ai-transform',
    label: 'AI Transformer / Formatter',
    category: 'AI',
    description: 'Converter dados entre diferentes formatos via IA',
    inputs: [
      { id: 'in-data', name: 'data', label: 'Input Data', type: 'TEXT', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-data', name: 'data', label: 'Transformed Data', type: 'TEXT', isMulti: true, required: true }
    ],
    defaultConfig: {
      instruction: 'Transforme o formato de entrada para o formato de saída desejado.'
    }
  },

  // --- TRANSFORM & OUTPUT NODES ---
  'transform-formatter': {
    type: 'transform-formatter',
    label: 'Data Formatter',
    category: 'TRANSFORM',
    description: 'Transforma estruturas JSON em tabelas legíveis ou listas sumarizadas',
    inputs: [
      { id: 'in-data', name: 'data', label: 'JSON Data', type: 'JSON', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-table', name: 'table', label: 'Formatted Table', type: 'TABLE', isMulti: true, required: true }
    ],
    defaultConfig: {
      outputFormat: 'markdown-table'
    }
  },

  'transform-data-formatter': {
    type: 'transform-data-formatter',
    label: 'Data Formatter / Table Generator',
    category: 'TRANSFORM',
    description: 'Converter dados estruturados JSON em formato de tabela',
    inputs: [
      { id: 'in-data', name: 'data', label: 'JSON Data', type: 'JSON', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-table', name: 'table', label: 'Formatted Table', type: 'TABLE', isMulti: true, required: true }
    ],
    defaultConfig: {
      outputFormat: 'markdown-table'
    }
  },

  'output-content': {
    type: 'output-content',
    label: 'Content Pack Exporter',
    category: 'OUTPUT',
    description: 'Empacota e exporta todo o resultado do workflow para download ou compartilhamento',
    inputs: [
      { id: 'in-results', name: 'results', label: 'All Artifacts', type: 'AI_RESPONSE', isMulti: true, required: true }
    ],
    outputs: [],
    defaultConfig: {
      exportFormat: 'markdown-pack'
    }
  },

  'extractor-pdf': {
    type: 'extractor-pdf',
    label: 'PDF & Document Extractor',
    category: 'EXTRACTOR',
    description: 'Extrai texto limpo, páginas individuais, metadados e tabelas estruturadas de documentos PDF',
    inputs: [
      { id: 'in-document', name: 'document', label: 'Document Input', type: 'DOCUMENT', isMulti: false, required: false },
      { id: 'in-text', name: 'rawText', label: 'Document Text', type: 'TEXT', isMulti: true, required: false }
    ],
    outputs: [
      { id: 'out-text', name: 'cleanText', label: 'Clean Text', type: 'TEXT', isMulti: true, required: true },
      { id: 'out-doc', name: 'document', label: 'Parsed Document', type: 'DOCUMENT', isMulti: true, required: true },
      { id: 'out-tables', name: 'tables', label: 'Extracted Tables', type: 'TABLE', isMulti: true, required: false }
    ],
    defaultConfig: {
      fileName: 'proposta-comercial.pdf',
      extractTables: true,
      splitPages: true
    }
  },

  'marketing-sales-page': {
    type: 'marketing-sales-page',
    label: '14-Block Sales Page Copywriter',
    category: 'AI',
    description: 'Gera copy completa de página de vendas em 14 blocos psicológicos de altíssima conversão',
    inputs: [
      { id: 'in-avatar', name: 'avatar', label: 'Avatar / ICP', type: 'JSON', isMulti: false, required: false },
      { id: 'in-vsl', name: 'vslScript', label: 'VSL / Briefing', type: 'DOCUMENT', isMulti: false, required: false },
      { id: 'in-context', name: 'context', label: 'Offer Briefing', type: 'TEXT', isMulti: true, required: true }
    ],
    outputs: [
      { id: 'out-copy', name: 'salesPageCopy', label: 'Full Sales Page Copy', type: 'DOCUMENT', isMulti: true, required: true },
      { id: 'out-json', name: 'blocksJson', label: '14-Block JSON', type: 'JSON', isMulti: true, required: true }
    ],
    defaultConfig: {
      productName: 'UNION.AI Enterprise Workspace',
      targetAudience: 'Infoprodutores e Agências de Performance',
      offerPrice: '12x de R$ 97,00 ou R$ 997 à vista'
    }
  },

  'output-export': {
    type: 'output-export',
    label: 'Publish & Export Destination',
    category: 'OUTPUT',
    description: 'Exporta ativos consolidados em Markdown, JSON ou publicação direta via Webhook/API',
    inputs: [
      { id: 'in-artifacts', name: 'artifacts', label: 'Marketing Artifacts', type: 'DOCUMENT', isMulti: true, required: true },
      { id: 'in-metadata', name: 'metadata', label: 'Run Metadata', type: 'JSON', isMulti: false, required: false }
    ],
    outputs: [],
    defaultConfig: {
      format: 'markdown-bundle',
      includeMetadata: true
    }
  }
};

export function createNodeFromTemplate(templateType: string, position = { x: 250, y: 150 }): NodeDefinition {
  const template = NODE_TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Template not found: ${templateType}`);
  }

  const id = `node-${templateType}-${Date.now()}`;
  return {
    id,
    type: template.type,
    label: template.label,
    category: template.category,
    position,
    inputs: JSON.parse(JSON.stringify(template.inputs)),
    outputs: JSON.parse(JSON.stringify(template.outputs)),
    config: JSON.parse(JSON.stringify(template.defaultConfig)),
    state: 'IDLE'
  };
}
