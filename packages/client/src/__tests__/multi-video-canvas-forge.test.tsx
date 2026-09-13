/**
 * @vitest-environment jsdom
 */
import './setup.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import { UnionNode, extractYouTubeId } from '../components/nodes/UnionNode.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { ReactFlowProvider } from '@xyflow/react';
import { OFFICIAL_TEMPLATES } from '@union/shared';

describe('Visual Multi-Video Knowledge Canvas Forge', () => {
  beforeEach(() => {
    cleanup();
    useCanvasStore.setState({
      nodes: [],
      edges: []
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('extracts YouTube Video ID accurately from various URL formats', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractYouTubeId('https://youtu.be/aircAruvnKk')).toBe('aircAruvnKk');
    expect(extractYouTubeId('https://www.youtube.com/embed/kJQP7kiw5Fk')).toBe('kJQP7kiw5Fk');
    expect(extractYouTubeId('kJQP7kiw5Fk')).toBe('kJQP7kiw5Fk');
  });

  it('renders rich visual YouTube video card with thumbnail, play button, duration and badges', () => {
    const nodeData = {
      id: 'yt-test-node',
      type: 'source-youtube',
      label: 'YouTube Video Source',
      category: 'SOURCE' as const,
      state: 'IDLE' as const,
      inputs: [],
      outputs: [
        { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT' as const, isMulti: true, required: true }
      ],
      config: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        videoTitle: 'Como Começar no Tráfego Pago',
        channelTitle: 'Performance Masters',
        duration: '18:32',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
      }
    };

    render(
      <ReactFlowProvider>
        <UnionNode
          id="yt-test-node"
          data={nodeData as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
          deletable={true}
          selectable={true}
          draggable={true}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Como Começar no Tráfego Pago')).toBeInTheDocument();
    expect(screen.getByText('Performance Masters')).toBeInTheDocument();
    expect(screen.getByText('18:32')).toBeInTheDocument();
    expect(screen.getByTitle('Pré-visualizar Vídeo')).toBeInTheDocument();

    const img = screen.getByAltText('Como Começar no Tráfego Pago') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('dQw4w9WgXcQ');
  });

  it('aggregates insights from 3 connected YouTube videos into a unified e-book synthesis call', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        title: 'Síntese de 3 Vídeos: Tráfego, IA e Marketing',
        targetNiche: 'Marketing e IA',
        pageCount: 10,
        totalWords: 4320,
        totalWordCount: 4320,
        chapters: [
          {
            chapterNumber: 1,
            title: 'Princípios do Tráfego Pago',
            wordCount: 1080,
            pagesRange: '1-3',
            content: 'Texto consolidado capítulo 1...'
          },
          {
            chapterNumber: 2,
            title: 'Aceleradores de IA nos Negócios',
            wordCount: 1120,
            pagesRange: '4-6',
            content: 'Texto consolidado capítulo 2...'
          },
          {
            chapterNumber: 3,
            title: 'Escala em Marketing Digital',
            wordCount: 1060,
            pagesRange: '7-8',
            content: 'Texto consolidado capítulo 3...'
          },
          {
            chapterNumber: 4,
            title: 'Plano de Execução Prática',
            wordCount: 1060,
            pagesRange: '9-10',
            content: 'Texto consolidado capítulo 4...'
          }
        ],
        fullMarkdown: '# Síntese de 3 Vídeos\n\n## Capítulos...'
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const ebookNodeData = {
      id: 'central-forge',
      type: 'ai-ebook-forge',
      label: 'Conhecimento & E-book AI',
      category: 'AI' as const,
      state: 'IDLE' as const,
      inputs: [
        { id: 'in-topic', name: 'topic', label: 'Tema / Briefing', type: 'TEXT' as const, isMulti: true, required: false },
        { id: 'in-context', name: 'context', label: 'Pesquisa / Dados', type: 'DOCUMENT' as const, isMulti: true, required: false }
      ],
      outputs: [
        { id: 'out-ebook', name: 'ebook', label: 'Livro Digital', type: 'DOCUMENT' as const, isMulti: true, required: true }
      ],
      config: {
        topic: 'Masterclass de Negócios Digitais',
        niche: 'Marketing e IA',
        pageCount: 10,
        wordsPerChapter: 1000
      }
    };

    useCanvasStore.setState({
      nodes: [
        {
          id: 'v1',
          type: 'unionNode',
          position: { x: 0, y: 0 },
          data: {
            id: 'v1',
            label: 'Vídeo Tráfego',
            config: { videoTitle: 'Estratégia de Tráfego 2026', extractedSummary: 'Pixel e automação de campanhas' }
          } as any
        },
        {
          id: 'v2',
          type: 'unionNode',
          position: { x: 0, y: 100 },
          data: {
            id: 'v2',
            label: 'Vídeo IA',
            config: { videoTitle: 'Revolução Cognitiva', extractedSummary: 'Agentes autônomos e LLMs' }
          } as any
        },
        {
          id: 'v3',
          type: 'unionNode',
          position: { x: 0, y: 200 },
          data: {
            id: 'v3',
            label: 'Vídeo Marketing',
            config: { videoTitle: 'Funis de Alta Conversão', extractedSummary: 'Ofertas irresistíveis e retenção' }
          } as any
        },
        {
          id: 'central-forge',
          type: 'unionNode',
          position: { x: 400, y: 100 },
          data: ebookNodeData as any
        }
      ],
      edges: [
        { id: 'e1', source: 'v1', target: 'central-forge', targetHandle: 'in-topic' },
        { id: 'e2', source: 'v2', target: 'central-forge', targetHandle: 'in-topic' },
        { id: 'e3', source: 'v3', target: 'central-forge', targetHandle: 'in-context' }
      ]
    });

    render(
      <ReactFlowProvider>
        <UnionNode
          id="central-forge"
          data={ebookNodeData as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={400}
          positionAbsoluteY={100}
          dragging={false}
          deletable={true}
          selectable={true}
          draggable={true}
        />
      </ReactFlowProvider>
    );

    const forgeBtn = screen.getByText(/⚡ Forjar E-book no Canvas/i);
    await act(async () => {
      fireEvent.click(forgeBtn);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat/forge/create', expect.objectContaining({
        method: 'POST',
        body: expect.stringMatching(/Estratégia de Tráfego 2026.*Revolução Cognitiva.*Funis de Alta Conversão/s)
      }));
    });
  });

  it('verifies multi-video-knowledge-forge official template is registered in catalog', () => {
    const template = OFFICIAL_TEMPLATES.find(t => t.id === 'multi-video-knowledge-forge');
    expect(template).toBeDefined();
    expect(template?.nodes.filter(n => n.type === 'source-youtube').length).toBe(3);
    expect(template?.nodes.some(n => n.type === 'ai-ebook-forge')).toBe(true);
    expect(template?.connections.length).toBe(3);
  });
});
