/**
 * @vitest-environment jsdom
 */
import './setup.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { UnionNode } from '../components/nodes/UnionNode.js';
import { NODE_TEMPLATES } from '../components/nodes/nodeRegistry.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { ReactFlowProvider } from '@xyflow/react';

describe('Output Modal Viewer Node', () => {
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

  it('verifies output-modal-viewer template is registered in NODE_TEMPLATES', () => {
    const template = NODE_TEMPLATES['output-modal-viewer'];
    expect(template).toBeDefined();
    expect(template.label).toContain('Visualizador de Saída');
    expect(template.category).toBe('OUTPUT');
    expect(template.inputs.some(i => i.name === 'ebook')).toBe(true);
    expect(template.inputs.some(i => i.name === 'markdown')).toBe(true);
  });

  it('renders waiting state when not connected to an upstream source', () => {
    const viewerData = {
      id: 'viewer-1',
      type: 'output-modal-viewer',
      label: 'Visualizador de Saída',
      category: 'OUTPUT' as const,
      state: 'IDLE' as const,
      inputs: [{ id: 'in-ebook', name: 'ebook', label: 'E-book', type: 'DOCUMENT' as const, isMulti: false, required: false }],
      outputs: [],
      config: {}
    };

    render(
      <ReactFlowProvider>
        <UnionNode
          id="viewer-1"
          data={viewerData as any}
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

    expect(screen.getByText('Aguardando Conexão')).toBeInTheDocument();
  });

  it('receives generated e-book from connected upstream node and opens EbookReaderModal', () => {
    const mockEbook = {
      title: 'Manual de Escala Digital com IA',
      targetNiche: 'Marketing',
      pageCount: 10,
      totalWords: 4650,
      totalWordCount: 4650,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Fundamentos da Automação Cognitiva',
          wordCount: 1150,
          pagesRange: '1-3',
          content: 'Conteúdo detalhado do capítulo 1...'
        }
      ],
      fullMarkdown: '# Manual de Escala Digital com IA\n\n## Capítulos...'
    };

    const viewerData = {
      id: 'viewer-node',
      type: 'output-modal-viewer',
      label: 'Visualizador de Saída',
      category: 'OUTPUT' as const,
      state: 'IDLE' as const,
      inputs: [{ id: 'in-ebook', name: 'ebook', label: 'E-book', type: 'DOCUMENT' as const, isMulti: false, required: false }],
      outputs: [],
      config: {}
    };

    useCanvasStore.setState({
      nodes: [
        {
          id: 'source-ebook-node',
          type: 'unionNode',
          position: { x: 0, y: 0 },
          data: {
            id: 'source-ebook-node',
            label: 'Union E-book Forge',
            config: {
              generatedEbook: mockEbook
            }
          } as any
        },
        {
          id: 'viewer-node',
          type: 'unionNode',
          position: { x: 300, y: 0 },
          data: viewerData as any
        }
      ],
      edges: [
        { id: 'edge-1', source: 'source-ebook-node', target: 'viewer-node', sourceHandle: 'out-ebook', targetHandle: 'in-ebook' }
      ]
    });

    render(
      <ReactFlowProvider>
        <UnionNode
          id="viewer-node"
          data={viewerData as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={300}
          positionAbsoluteY={0}
          dragging={false}
          deletable={true}
          selectable={true}
          draggable={true}
        />
      </ReactFlowProvider>
    );

    // Verify source label and e-book title are displayed
    expect(screen.getByText(/Origem: Union E-book Forge/i)).toBeInTheDocument();
    expect(screen.getByText('Manual de Escala Digital com IA')).toBeInTheDocument();
    expect(screen.getByText(/4[,.]?650 palavras/i)).toBeInTheDocument();

    // Click "Abrir Resultado no Modal"
    const openBtn = screen.getByText(/👁️ Abrir Resultado no Modal/i);
    expect(openBtn).toBeInTheDocument();
    fireEvent.click(openBtn);

    // Modal is opened displaying the chapter title in sidebar and content
    expect(screen.getAllByText('Fundamentos da Automação Cognitiva').length).toBeGreaterThanOrEqual(1);
  });

  it('renders with 3x square dimensions (w-[640px] h-[640px]) and supports live chapter tabs preview', () => {
    const multiChapterEbook = {
      title: 'Guia Definitivo do Canvas com IA',
      targetNiche: 'Tecnologia',
      totalWords: 5200,
      totalWordCount: 5200,
      chapters: [
        {
          chapterNumber: 1,
          title: 'Arquitetura de Nós Reativos',
          wordCount: 1300,
          pagesRange: '1-3',
          content: 'No capítulo 1 desvendamos a conexão de nós reativos no Canvas.'
        },
        {
          chapterNumber: 2,
          title: 'Geração Dinâmica de Conteúdo',
          wordCount: 1450,
          pagesRange: '4-6',
          content: 'No capítulo 2 explicamos os prompts encadeados de alta fidelidade.'
        }
      ],
      fullMarkdown: '# Guia Definitivo do Canvas com IA\n\nCapítulo 1...\nCapítulo 2...'
    };

    const viewerData = {
      id: 'viewer-square',
      type: 'output-modal-viewer',
      label: 'Visualizador de Saída',
      category: 'OUTPUT' as const,
      state: 'IDLE' as const,
      inputs: [{ id: 'in-ebook', name: 'ebook', label: 'E-book', type: 'DOCUMENT' as const, isMulti: false, required: false }],
      outputs: [],
      config: {}
    };

    useCanvasStore.setState({
      nodes: [
        {
          id: 'ebook-source',
          type: 'unionNode',
          position: { x: 0, y: 0 },
          data: {
            id: 'ebook-source',
            label: 'Union E-book Forge',
            config: {
              generatedEbook: multiChapterEbook
            }
          } as any
        },
        {
          id: 'viewer-square',
          type: 'unionNode',
          position: { x: 400, y: 0 },
          data: viewerData as any
        }
      ],
      edges: [
        { id: 'edge-sq', source: 'ebook-source', target: 'viewer-square', sourceHandle: 'out-ebook', targetHandle: 'in-ebook' }
      ]
    });

    const { container } = render(
      <ReactFlowProvider>
        <UnionNode
          id="viewer-square"
          data={viewerData as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={400}
          positionAbsoluteY={0}
          dragging={false}
          deletable={true}
          selectable={true}
          draggable={true}
        />
      </ReactFlowProvider>
    );

    // Verify 3x square classes
    const nodeEl = container.querySelector('#union-node-viewer-square');
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl?.className).toContain('w-[640px]');
    expect(nodeEl?.className).toContain('h-[640px]');

    // Verify chapter 1 is rendered initially
    expect(screen.getByText('Arquitetura de Nós Reativos')).toBeInTheDocument();
    expect(screen.getByText(/No capítulo 1 desvendamos a conexão/i)).toBeInTheDocument();

    // Verify chapter tabs exist
    const ch2Tab = screen.getByText('Capítulo 2');
    expect(ch2Tab).toBeInTheDocument();

    // Click chapter 2 tab
    fireEvent.click(ch2Tab);

    // Verify chapter 2 is now displayed in the live reader pane
    expect(screen.getByText('Geração Dinâmica de Conteúdo')).toBeInTheDocument();
    expect(screen.getByText(/No capítulo 2 explicamos os prompts encadeados/i)).toBeInTheDocument();
  });
});
