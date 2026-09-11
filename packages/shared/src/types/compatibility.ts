import { DataType } from './data-types.js';

export interface SuggestedTransformer {
  transformerNodeType: string;
  label: string;
  description: string;
}

/**
 * Matriz de compatibilidade direta entre tipos de dados.
 * Se source for igual a target, é 100% compatível diretamente.
 * Alguns tipos também possuem coerção direta sem necessidade de nó transformador intermediário.
 */
const DIRECT_COMPATIBILITY_MAP: Record<DataType, DataType[]> = {
  TEXT: ['TEXT', 'AI_RESPONSE'],
  AI_RESPONSE: ['AI_RESPONSE', 'TEXT'],
  URL: ['URL', 'TEXT'],
  TRANSCRIPT: ['TRANSCRIPT', 'TEXT', 'DOCUMENT'],
  JSON: ['JSON', 'TEXT'],
  TABLE: ['TABLE', 'JSON', 'TEXT'],
  DOCUMENT: ['DOCUMENT', 'TEXT'],
  METADATA: ['METADATA', 'JSON', 'TEXT'],
  VIDEO: ['VIDEO'],
  AUDIO: ['AUDIO'],
  IMAGE: ['IMAGE']
};

/**
 * Sugestões inteligentes de nós transformadores quando os tipos forem incompatíveis.
 */
const TRANSFORMER_SUGGESTIONS: Record<string, SuggestedTransformer[]> = {
  'VIDEO->TEXT': [
    {
      transformerNodeType: 'extractor-transcript',
      label: 'Extract Transcript',
      description: 'Extrair transcrição de áudio/vídeo em texto estruturado'
    }
  ],
  'VIDEO->TRANSCRIPT': [
    {
      transformerNodeType: 'extractor-transcript',
      label: 'Extract Transcript',
      description: 'Extrair transcrição completa com minutagens'
    }
  ],
  'IMAGE->TEXT': [
    {
      transformerNodeType: 'ai-vision',
      label: 'Vision AI',
      description: 'Análise e extração textual de imagem via IA Visual'
    }
  ],
  'AUDIO->TRANSCRIPT': [
    {
      transformerNodeType: 'extractor-audio-transcript',
      label: 'Audio Transcriber',
      description: 'Transcrever áudio para texto'
    }
  ],
  'AUDIO->TEXT': [
    {
      transformerNodeType: 'extractor-audio-transcript',
      label: 'Audio Transcriber',
      description: 'Transcrever áudio para texto'
    }
  ],
  'JSON->TABLE': [
    {
      transformerNodeType: 'transform-data-formatter',
      label: 'Data Formatter / Table Generator',
      description: 'Converter dados estruturados JSON em formato de tabela'
    }
  ],
  'DOCUMENT->TEXT': [
    {
      transformerNodeType: 'extractor-document-text',
      label: 'Document Text Extractor',
      description: 'Extrair texto de PDF ou documento DOCX'
    }
  ],
  'URL->TEXT': [
    {
      transformerNodeType: 'source-website',
      label: 'Web Scraper / Content Extractor',
      description: 'Fazer crawl e extrair conteúdo da página web'
    }
  ],
  'URL->TRANSCRIPT': [
    {
      transformerNodeType: 'source-youtube',
      label: 'YouTube Transcriber',
      description: 'Obter transcrição e metadados de vídeo no YouTube'
    }
  ]
};

export function isTypeCompatible(sourceType: DataType, targetType: DataType): boolean {
  if (sourceType === targetType) return true;
  const compatibleTargets = DIRECT_COMPATIBILITY_MAP[sourceType] || [];
  return compatibleTargets.includes(targetType);
}

export function getSuggestedTransformers(
  sourceType: DataType,
  targetType: DataType
): SuggestedTransformer[] {
  if (isTypeCompatible(sourceType, targetType)) {
    return [];
  }
  const key = `${sourceType}->${targetType}`;
  return TRANSFORMER_SUGGESTIONS[key] || [
    {
      transformerNodeType: 'ai-transform',
      label: 'AI Transformer / Formatter',
      description: `Converter dados de ${sourceType} para ${targetType} via IA`
    }
  ];
}
