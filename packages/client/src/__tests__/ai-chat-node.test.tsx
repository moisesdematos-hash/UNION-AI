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

describe('AI Chat Assistant Node (3x Square UI)', () => {
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

  it('verifies ai-chat template exists in NODE_TEMPLATES', () => {
    const template = NODE_TEMPLATES['ai-chat'];
    expect(template).toBeDefined();
    expect(template.label).toBe('AI Chat Assistant');
    expect(template.category).toBe('AI');
    expect(template.inputs.some(i => i.name === 'context')).toBe(true);
    expect(template.inputs.some(i => i.name === 'prompt')).toBe(true);
    expect(template.outputs.some(o => o.name === 'response')).toBe(true);
  });

  it('renders with 3x square dimensions (w-[640px] h-[640px]) and interactive chat interface', () => {
    const chatData = {
      id: 'chat-node-1',
      type: 'ai-chat',
      label: 'AI Chat Assistant',
      category: 'AI' as const,
      state: 'IDLE' as const,
      inputs: [
        { id: 'in-context', name: 'context', label: 'Contexts', type: 'TEXT' as const, isMulti: true, required: false },
        { id: 'in-prompt', name: 'prompt', label: 'Prompt', type: 'TEXT' as const, isMulti: false, required: true }
      ],
      outputs: [
        { id: 'out-response', name: 'response', label: 'AI Response', type: 'AI_RESPONSE' as const, isMulti: true, required: true }
      ],
      config: {
        model: 'gpt-4o',
        prompt: ''
      }
    };

    useCanvasStore.setState({
      nodes: [
        {
          id: 'chat-node-1',
          type: 'unionNode',
          position: { x: 100, y: 100 },
          data: chatData as any
        }
      ],
      edges: []
    });

    const { container } = render(
      <ReactFlowProvider>
        <UnionNode
          id="chat-node-1"
          data={chatData as any}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={100}
          positionAbsoluteY={100}
          dragging={false}
          deletable={true}
          selectable={true}
          draggable={true}
        />
      </ReactFlowProvider>
    );

    // Verify 3x square dimensions
    const nodeEl = container.querySelector('#union-node-chat-node-1');
    expect(nodeEl).toBeInTheDocument();
    expect(nodeEl?.className).toContain('w-[640px]');
    expect(nodeEl?.className).toContain('h-[640px]');
    expect(nodeEl?.className).toContain('border-indigo-500/50');

    // Verify chat assistant components
    expect(screen.getByText('Pronto para Conversar & Analisar')).toBeInTheDocument();
    expect(screen.getByText('Quadrado 3x')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite sua mensagem para o assistente/i)).toBeInTheDocument();

    // Verify quick prompt pills
    const insightPill = screen.getByText(/Extrair 5 principais insights/i);
    expect(insightPill).toBeInTheDocument();

    // Clicking quick prompt fills the textarea
    fireEvent.click(insightPill);
    const textarea = screen.getByPlaceholderText(/Digite sua mensagem para o assistente/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Extrair 5 principais insights');
  });

  it('renders chat message bubbles when conversation history exists', () => {
    const chatData = {
      id: 'chat-node-2',
      type: 'ai-chat',
      label: 'AI Chat Assistant',
      category: 'AI' as const,
      state: 'COMPLETED' as const,
      inputs: [],
      outputs: [],
      config: {
        model: 'claude-3-7-sonnet',
        messages: [
          { id: 'm1', role: 'user', text: 'Quais os 3 pilares da conversão?', timestamp: '17:30' },
          { id: 'm2', role: 'assistant', text: 'Os 3 pilares são: 1. Gancho magnético, 2. Mecanismo único, 3. Chamada clara.', timestamp: '17:31' }
        ]
      }
    };

    render(
      <ReactFlowProvider>
        <UnionNode
          id="chat-node-2"
          data={chatData as any}
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

    // Verify both user and assistant message bubbles are displayed
    expect(screen.getByText('Quais os 3 pilares da conversão?')).toBeInTheDocument();
    expect(screen.getByText(/Os 3 pilares são: 1. Gancho magnético/i)).toBeInTheDocument();
    expect(screen.getByTitle('Limpar Conversa')).toBeInTheDocument();
  });
});
