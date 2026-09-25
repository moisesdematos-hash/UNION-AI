import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReactFlowProvider, NodeProps } from '@xyflow/react';
import { UnionNode } from '../components/nodes/UnionNode.js';
import { NodeDefinition } from '@union/shared';

describe('UnionNode Component', () => {
  const baseNodeData: NodeDefinition = {
    id: 'node-youtube-test',
    type: 'source-youtube',
    label: 'YouTube Source',
    category: 'SOURCE',
    position: { x: 100, y: 100 },
    inputs: [
      { id: 'in-url', name: 'url', label: 'Video URL', type: 'URL', isMulti: false, required: true }
    ],
    outputs: [
      { id: 'out-transcript', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true },
      { id: 'out-metadata', name: 'metadata', label: 'Metadata', type: 'METADATA', isMulti: true, required: false }
    ],
    config: { url: 'https://youtube.com/watch?v=abc123xyz' },
    state: 'IDLE'
  };

  const createMockNodeProps = (nodeData: NodeDefinition): NodeProps => ({
    id: nodeData.id,
    data: nodeData as unknown as Record<string, unknown>,
    selected: false,
    type: 'unionNode',
    zIndex: 1,
    isConnectable: true,
    positionAbsoluteX: 100,
    positionAbsoluteY: 100,
    dragging: false,
    deletable: true,
    selectable: true,
    draggable: true
  });

  const renderUnionNode = (data: Partial<NodeDefinition> = {}) => {
    const mergedData = { ...baseNodeData, ...data };
    const props = createMockNodeProps(mergedData);
    return render(
      <ReactFlowProvider>
        <UnionNode {...props} />
      </ReactFlowProvider>
    );
  };

  it('renders header with node label, category, and IDLE state badge', () => {
    renderUnionNode();

    expect(screen.getByText('YouTube Source')).toBeInTheDocument();
    expect(screen.getByText('SOURCE')).toBeInTheDocument();
    expect(screen.getByText('IDLE')).toBeInTheDocument();
  });

  it('renders input and output ports with their labels and type badges', () => {
    renderUnionNode();

    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('Video URL')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();

    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText('TRANSCRIPT')).toBeInTheDocument();
  });

  it('renders PROCESSING, COMPLETED, and FAILED state badges properly', () => {
    const { rerender } = renderUnionNode({ state: 'PROCESSING' });
    expect(screen.getByText('PROCESSING')).toBeInTheDocument();

    const completedProps = createMockNodeProps({ ...baseNodeData, state: 'COMPLETED' });
    rerender(
      <ReactFlowProvider>
        <UnionNode {...completedProps} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();

    const failedProps = createMockNodeProps({
      ...baseNodeData,
      state: 'FAILED',
      executionInfo: { error: 'Network connection timeout' }
    });
    rerender(
      <ReactFlowProvider>
        <UnionNode {...failedProps} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('FAILED')).toBeInTheDocument();
    expect(screen.getByText(/Network connection timeout/i)).toBeInTheDocument();
  });

  it('renders execution information (duration, tokens, cost) when available', () => {
    renderUnionNode({
      executionInfo: {
        durationMs: 420,
        tokens: 1850,
        credits: 0.08
      }
    });

    expect(screen.getByText(/420ms/i)).toBeInTheDocument();
    expect(screen.getByText('1850')).toBeInTheDocument();
    expect(screen.getByText('$0.08')).toBeInTheDocument();
  });

  it('allows editing input config fields', () => {
    const onConfigChange = vi.fn();
    const configProps = createMockNodeProps({
      ...baseNodeData,
      config: { ...baseNodeData.config }
    });
    configProps.data.onConfigChange = onConfigChange;

    render(
      <ReactFlowProvider>
        <UnionNode {...configProps} />
      </ReactFlowProvider>
    );

    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...') as HTMLInputElement;
    expect(input.value).toBe('https://youtube.com/watch?v=abc123xyz');

    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=newVideo' } });
    expect(input.value).toBe('https://youtube.com/watch?v=newVideo');
    expect(onConfigChange).toHaveBeenCalledWith('url', 'https://youtube.com/watch?v=newVideo');
  });

  it('renders extraction action button for source node and triggers fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          raw: {
            videoId: 'abc123xyz',
            title: 'Sample Extracted Video',
            wordCount: 1500,
            fullText: 'Sample full transcript text'
          }
        }
      })
    });
    global.fetch = fetchMock as any;

    renderUnionNode();

    const extractBtn = screen.getByRole('button', { name: /extrair transcrição/i });
    expect(extractBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(extractBtn);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/extractors/youtube',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('renders execution action button for AI writer node and triggers /api/ai/execute', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          raw: {
            content: 'Hook de alta conversão gerado pelo modelo Claude 3.7 Sonnet',
            tokens: { totalTokens: 420 },
            creditsCost: 0.005,
            durationMs: 380
          }
        }
      })
    });
    global.fetch = fetchMock as any;

    renderUnionNode({
      type: 'ai-writer',
      label: 'AI Writer',
      category: 'AI',
      config: { model: 'claude-3-7-sonnet', format: 'youtube-script' }
    });

    const generateBtn = screen.getByRole('button', { name: /gerar copy \/ roteiro/i });
    expect(generateBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/execute',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"role":"ai-writer"')
      })
    );
  });

  it('renders router action button for Smart AI Router node and triggers /api/ai/router/execute', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: {
          raw: {
            content: 'Task successfully evaluated and routed',
            tokens: { totalTokens: 150 },
            creditsCost: 0.0008,
            durationMs: 95
          },
          routing: {
            classification: { branch: 'fast', category: 'summarization' },
            recommendation: {
              recommendedModel: 'gemini-1-5-flash',
              benchmarkComparison: { savingsPercent: 94 }
            }
          }
        }
      })
    });
    global.fetch = fetchMock as any;

    renderUnionNode({
      type: 'ai-router',
      label: 'Smart AI Router',
      category: 'AI',
      config: { optimizeFor: 'cost' }
    });

    const routeBtnSpan = screen.getByText(/avaliar & rotear tarefa/i);
    const routeBtn = routeBtnSpan.closest('button')!;
    expect(routeBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(routeBtn);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ai/router/execute',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"optimizeFor":"cost"')
      })
    );
  });
});
