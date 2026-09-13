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
});
