import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { createNodeFromTemplate, NODE_TEMPLATES } from '../components/nodes/nodeRegistry.js';
import { UnionNode, UnionNodeData } from '../components/nodes/UnionNode.js';
import { EbookReaderModal } from '../components/modals/EbookReaderModal.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { ReactFlowProvider } from '@xyflow/react';

describe('Option 2: Autonomous E-book Forge Module in Canvas', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: []
    });
    vi.clearAllMocks();
  });

  it('verifies ai-ebook-forge template exists in NODE_TEMPLATES with valid configuration', () => {
    const template = NODE_TEMPLATES['ai-ebook-forge'];
    expect(template).toBeDefined();
    expect(template.label).toBe('Union E-book Forge');
    expect(template.category).toBe('AI');
    expect(template.inputs.some(i => i.name === 'topic')).toBe(true);
    expect(template.outputs.some(o => o.name === 'ebook')).toBe(true);
    expect(template.outputs.some(o => o.name === 'markdown')).toBe(true);

    const nodeInstance = createNodeFromTemplate('ai-ebook-forge', { x: 100, y: 100 });
    expect(nodeInstance.type).toBe('ai-ebook-forge');
    expect(nodeInstance.config.wordsPerChapter).toBe(1000);
    expect(nodeInstance.config.pageCount).toBe(10);
  });

  it('renders ai-ebook-forge node with compliance badge, inputs and execution trigger', () => {
    const nodeDef = createNodeFromTemplate('ai-ebook-forge', { x: 0, y: 0 });
    const data: UnionNodeData = {
      ...nodeDef,
      onConfigChange: vi.fn()
    };

    render(
      <ReactFlowProvider>
        <UnionNode
          id="test-ebook-node"
          data={data as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );

    expect(screen.getAllByText('Union E-book Forge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/> 1.000 pal\/cap/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Manual Estratégico de IA/i)).toBeInTheDocument();
    expect(screen.getByText(/⚡ Forjar E-book no Canvas/i)).toBeInTheDocument();
  });

  it('executes ebook generation via /api/chat/forge/create and renders stats and read actions', async () => {
    const mockEbookData = {
      title: 'Manual de Escala Digital com IA',
      targetNiche: 'Marketing de Performance',
      pageCount: 10,
      totalWords: 4650,
      totalWordCount: 4650,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Fundamentos da Automação Cognitiva',
          wordCount: 1150,
          pagesRange: '1-3',
          content: 'Conteúdo aprofundado do capítulo 1 com mais de mil palavras...'
        },
        {
          chapterNumber: 2,
          title: 'Arquitetura de Funis Autônomos',
          wordCount: 1200,
          pagesRange: '4-6',
          content: 'Conteúdo detalhado do capítulo 2 com mais de mil palavras...'
        },
        {
          chapterNumber: 3,
          title: 'Protocolos de Validação e Conversão',
          wordCount: 1100,
          pagesRange: '7-8',
          content: 'Conteúdo prático do capítulo 3 com mais de mil palavras...'
        },
        {
          chapterNumber: 4,
          title: 'Matriz de Escala e Sustentabilidade',
          wordCount: 1200,
          pagesRange: '9-10',
          content: 'Conteúdo final do capítulo 4 com mais de mil palavras...'
        }
      ],
      pages: [
        { pageNumber: 1, title: 'Capa & Introdução', content: 'Visão geral' }
      ],
      fullMarkdown: '# Manual de Escala Digital com IA\n\nCapítulo 1...'
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: mockEbookData
      })
    });

    const nodeDef = createNodeFromTemplate('ai-ebook-forge', { x: 0, y: 0 });
    const data: UnionNodeData = {
      ...nodeDef,
      config: {
        ...nodeDef.config,
        topic: 'Automação Cognitiva com IA',
        niche: 'Marketing de Performance'
      }
    };

    useCanvasStore.setState({
      nodes: [{
        id: 'ebook-node-1',
        type: 'unionNode',
        position: { x: 0, y: 0 },
        data: data as any
      }]
    });

    const { rerender } = render(
      <ReactFlowProvider>
        <UnionNode
          id="ebook-node-1"
          data={data as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
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
        body: expect.stringContaining('"type":"EBOOK"')
      }));
    });

    await waitFor(() => {
      expect(screen.getByText(/Obra Forjada no Canvas/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/4[,\.]?650/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ler Obra')).toBeInTheDocument();
    expect(screen.getByText('.MD')).toBeInTheDocument();
  });

  it('renders EbookReaderModal with chapters, word counts, and theme toggling', () => {
    const mockEbook = {
      title: 'Manual de Escala Digital com IA',
      targetNiche: 'Marketing de Performance',
      pageCount: 10,
      totalWords: 4650,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Fundamentos da Automação Cognitiva',
          wordCount: 1150,
          pagesRange: '1-3',
          content: 'Texto aprofundado do capítulo 1...'
        },
        {
          chapterNumber: 2,
          title: 'Arquitetura de Funis Autônomos',
          wordCount: 1200,
          pagesRange: '4-6',
          content: 'Texto detalhado do capítulo 2...'
        }
      ]
    };

    const onClose = vi.fn();
    render(<EbookReaderModal isOpen={true} onClose={onClose} ebook={mockEbook} />);

    expect(screen.getByText('Manual de Escala Digital com IA')).toBeInTheDocument();
    expect(screen.getByText(/> 1.000 pal\/cap/i)).toBeInTheDocument();
    expect(screen.getAllByText('Fundamentos da Automação Cognitiva').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1[,\.]?150/i).length).toBeGreaterThanOrEqual(1);

    // Switch to Raw Markdown view
    const markdownBtn = screen.getByRole('button', { name: 'Markdown' });
    fireEvent.click(markdownBtn);
    expect(screen.getByText(/## Capítulo 1: Fundamentos da Automação Cognitiva/i)).toBeInTheDocument();
  });
});
