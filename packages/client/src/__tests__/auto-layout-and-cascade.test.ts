import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store/canvasStore.js';
import { OFFICIAL_TEMPLATES } from '@union/shared';
import { Node, Edge } from '@xyflow/react';

describe('Workflow Auto-Layout, Official Templates & Cascade Execution', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
  });

  it('should auto-layout nodes into non-overlapping columns based on DAG dependencies', () => {
    const nodes: Node[] = [
      {
        id: 'node-youtube',
        type: 'unionNode',
        position: { x: 500, y: 500 },
        data: {
          id: 'node-youtube',
          type: 'source-youtube',
          label: 'YouTube Source',
          category: 'SOURCE',
          inputs: [],
          outputs: [{ id: 'out-transcript', name: 'transcript', type: 'TEXT' }],
          config: {}
        }
      },
      {
        id: 'node-ebook',
        type: 'unionNode',
        position: { x: 100, y: 100 },
        data: {
          id: 'node-ebook',
          type: 'ai-ebook-forge',
          label: 'Union E-book Forge',
          category: 'AI',
          inputs: [{ id: 'in-text', name: 'sourceText', type: 'TEXT' }],
          outputs: [{ id: 'out-ebook', name: 'ebook', type: 'STRUCTURED' }],
          config: {}
        }
      },
      {
        id: 'node-viewer',
        type: 'unionNode',
        position: { x: 200, y: 200 },
        data: {
          id: 'node-viewer',
          type: 'output-modal-viewer',
          label: 'Visualizador de Saida',
          category: 'OUTPUT',
          inputs: [{ id: 'in-data', name: 'data', type: 'ANY' }],
          outputs: [],
          config: {}
        }
      }
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'node-youtube', target: 'node-ebook', sourceHandle: 'out-transcript', targetHandle: 'in-text' },
      { id: 'e2', source: 'node-ebook', target: 'node-viewer', sourceHandle: 'out-ebook', targetHandle: 'in-data' }
    ];

    useCanvasStore.getState().setNodes(nodes);
    useCanvasStore.getState().setEdges(edges);

    useCanvasStore.getState().autoLayoutWorkflow();

    const arrangedNodes = useCanvasStore.getState().nodes;
    const youtube = arrangedNodes.find((n) => n.id === 'node-youtube')!;
    const ebook = arrangedNodes.find((n) => n.id === 'node-ebook')!;
    const viewer = arrangedNodes.find((n) => n.id === 'node-viewer')!;

    expect(youtube.position.x).toBe(80);
    expect(ebook.position.x).toBeGreaterThan(youtube.position.x + 200);
    expect(viewer.position.x).toBeGreaterThan(ebook.position.x + 300);
    expect(useCanvasStore.getState().historyPast.length).toBeGreaterThan(0);
  });

  it('should load official template "video-to-ebook-flow" and format nodes cleanly', () => {
    const template = OFFICIAL_TEMPLATES.find((t) => t.id === 'video-to-ebook-flow');
    expect(template).toBeDefined();
    expect(template!.nodes.length).toBe(3);

    useCanvasStore.getState().loadWorkflow({
      id: 'test-video-to-ebook',
      name: template!.name,
      description: template!.description,
      nodes: template!.nodes,
      connections: template!.connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      groups: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(3);
    expect(state.edges.length).toBe(2);

    useCanvasStore.getState().autoLayoutWorkflow();
    const laidOut = useCanvasStore.getState().nodes;
    expect(laidOut[0].position.x).toBeLessThan(laidOut[1].position.x);
    expect(laidOut[1].position.x).toBeLessThan(laidOut[2].position.x);
  });

  it('should load official template "video-to-chat-flow"', () => {
    const template = OFFICIAL_TEMPLATES.find((t) => t.id === 'video-to-chat-flow');
    expect(template).toBeDefined();
    expect(template!.nodes.length).toBe(3);

    useCanvasStore.getState().loadWorkflow({
      id: 'test-video-to-chat',
      name: template!.name,
      description: template!.description,
      nodes: template!.nodes,
      connections: template!.connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      groups: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(3);
    expect(state.edges.length).toBe(2);

    const chatNode = state.nodes.find((n) => (n.data as any).type === 'ai-chat');
    expect(chatNode).toBeDefined();
  });

  it('should load official template "strategy-copywriting-flow"', () => {
    const template = OFFICIAL_TEMPLATES.find((t) => t.id === 'strategy-copywriting-flow');
    expect(template).toBeDefined();
    expect(template!.nodes.length).toBe(4);

    useCanvasStore.getState().loadWorkflow({
      id: 'test-strategy-copy',
      name: template!.name,
      description: template!.description,
      nodes: template!.nodes,
      connections: template!.connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      groups: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(4);
    expect(state.edges.length).toBe(3);
  });

  it('should execute cascade workflow end-to-end and propagate outputs to nodes and configs', async () => {
    const template = OFFICIAL_TEMPLATES.find((t) => t.id === 'video-to-ebook-flow')!;

    useCanvasStore.getState().loadWorkflow({
      id: 'exec-video-to-ebook',
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      connections: template.connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      groups: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    const summary = await useCanvasStore.getState().executeCascadeWorkflow();

    expect(summary.status).toBe('COMPLETED');
    expect(summary.completedNodes).toBe(3);
    expect(summary.failedNodes).toBe(0);

    const finalNodes = useCanvasStore.getState().nodes;

    for (const node of finalNodes) {
      expect((node.data as any).state).toBe('COMPLETED');
    }

    const ebookNode = finalNodes.find((n) => (n.data as any).type === 'ai-ebook-forge')!;
    const ebookCfg = (ebookNode.data as any).config;
    expect(ebookCfg.generatedEbook).toBeDefined();
    expect(ebookCfg.generatedEbook.chapters.length).toBeGreaterThanOrEqual(4);

    for (const chapter of ebookCfg.generatedEbook.chapters) {
      expect(chapter.wordCount).toBeGreaterThanOrEqual(1000);
    }

    const viewerNode = finalNodes.find((n) => (n.data as any).type === 'output-modal-viewer')!;
    const viewerCfg = (viewerNode.data as any).config;
    expect(viewerCfg.generatedEbook).toBeDefined();
  });
});
