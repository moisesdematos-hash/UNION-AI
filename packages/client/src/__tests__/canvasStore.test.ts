import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store/canvasStore.js';
import { Node } from '@xyflow/react';

describe('Canvas Store (Zustand)', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
  });

  it('should initialize with empty nodes, edges and default viewport', () => {
    const state = useCanvasStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    expect(state.isGridVisible).toBe(true);
    expect(state.isSnappingEnabled).toBe(true);
  });

  it('should add nodes and record history', () => {
    const node: Node = {
      id: 'node-1',
      position: { x: 100, y: 200 },
      data: { label: 'AI Chat' }
    };

    useCanvasStore.getState().addNode(node);

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(1);
    expect(state.nodes[0].id).toBe('node-1');
    expect(state.historyPast.length).toBe(1);
  });

  it('should delete selected nodes and their connected edges', () => {
    const nodeA: Node = { id: 'node-a', position: { x: 0, y: 0 }, data: {}, selected: true };
    const nodeB: Node = { id: 'node-b', position: { x: 100, y: 100 }, data: {}, selected: false };

    useCanvasStore.getState().setNodes([nodeA, nodeB]);
    useCanvasStore.getState().setEdges([
      { id: 'edge-1', source: 'node-a', target: 'node-b' }
    ]);

    useCanvasStore.getState().deleteSelected();

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(1);
    expect(state.nodes[0].id).toBe('node-b');
    expect(state.edges.length).toBe(0); // Connected edge is also removed
  });

  it('should duplicate selected nodes with position offset', () => {
    const node: Node = {
      id: 'node-orig',
      position: { x: 50, y: 50 },
      data: { label: 'Original' },
      selected: true
    };

    useCanvasStore.getState().setNodes([node]);
    useCanvasStore.getState().duplicateSelected();

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(2);
    const duplicated = state.nodes[1];
    expect(duplicated.id).toContain('node-orig-copy');
    expect(duplicated.position.x).toBe(90); // 50 + 40
    expect(duplicated.position.y).toBe(90);
    expect(duplicated.selected).toBe(true);
  });

  it('should copy and paste nodes with offset and new IDs', () => {
    const node: Node = {
      id: 'node-copy-test',
      position: { x: 100, y: 100 },
      data: { label: 'Copyable' },
      selected: true
    };

    useCanvasStore.getState().setNodes([node]);
    useCanvasStore.getState().copySelected();

    expect(useCanvasStore.getState().clipboard?.nodes.length).toBe(1);

    useCanvasStore.getState().pasteSelected();

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBe(2);
    const pasted = state.nodes[1];
    expect(pasted.id).toContain('node-copy-test-pasted');
    expect(pasted.position.x).toBe(150); // 100 + 50
  });

  it('should support multi-level undo and redo', () => {
    const node1: Node = { id: 'n1', position: { x: 0, y: 0 }, data: {} };
    const node2: Node = { id: 'n2', position: { x: 10, y: 10 }, data: {} };

    useCanvasStore.getState().addNode(node1);
    useCanvasStore.getState().addNode(node2);

    expect(useCanvasStore.getState().nodes.length).toBe(2);

    // Undo adding node2
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().nodes.length).toBe(1);
    expect(useCanvasStore.getState().nodes[0].id).toBe('n1');

    // Undo adding node1
    useCanvasStore.getState().undo();
    expect(useCanvasStore.getState().nodes.length).toBe(0);

    // Redo adding node1
    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().nodes.length).toBe(1);
    expect(useCanvasStore.getState().nodes[0].id).toBe('n1');

    // Redo adding node2
    useCanvasStore.getState().redo();
    expect(useCanvasStore.getState().nodes.length).toBe(2);
  });

  it('should toggle grid and snapping', () => {
    expect(useCanvasStore.getState().isGridVisible).toBe(true);
    useCanvasStore.getState().toggleGrid();
    expect(useCanvasStore.getState().isGridVisible).toBe(false);

    expect(useCanvasStore.getState().isSnappingEnabled).toBe(true);
    useCanvasStore.getState().toggleSnapping();
    expect(useCanvasStore.getState().isSnappingEnabled).toBe(false);
  });

  it('should connect compatible ports directly', () => {
    const nodeSource: Node = {
      id: 'node-src',
      position: { x: 100, y: 100 },
      data: {
        label: 'Source Web',
        outputs: [{ id: 'out-text', type: 'TEXT' }]
      }
    };
    const nodeTarget: Node = {
      id: 'node-tgt',
      position: { x: 400, y: 100 },
      data: {
        label: 'AI Chat',
        inputs: [{ id: 'in-prompt', type: 'TEXT', isMulti: false }]
      }
    };

    useCanvasStore.getState().setNodes([nodeSource, nodeTarget]);
    useCanvasStore.getState().onConnect({
      source: 'node-src',
      sourceHandle: 'out-text',
      target: 'node-tgt',
      targetHandle: 'in-prompt'
    });

    const state = useCanvasStore.getState();
    expect(state.edges.length).toBe(1);
    expect(state.edges[0].data?.dataType).toBe('TEXT');
    expect(state.edges[0].data?.state).toBe('connected');
    expect(state.pendingIncompatibleConnection).toBeNull();
  });

  it('should intercept incompatible ports and provide smart transformer suggestions', () => {
    const nodeVideo: Node = {
      id: 'node-video-src',
      position: { x: 100, y: 100 },
      data: {
        label: 'YouTube Source',
        outputs: [{ id: 'out-vid', type: 'VIDEO' }]
      }
    };
    const nodeAi: Node = {
      id: 'node-ai-tgt',
      position: { x: 500, y: 100 },
      data: {
        label: 'AI Analyst',
        inputs: [{ id: 'in-src', type: 'TRANSCRIPT', isMulti: false }]
      }
    };

    useCanvasStore.getState().setNodes([nodeVideo, nodeAi]);
    useCanvasStore.getState().onConnect({
      source: 'node-video-src',
      sourceHandle: 'out-vid',
      target: 'node-ai-tgt',
      targetHandle: 'in-src'
    });

    const state = useCanvasStore.getState();
    expect(state.edges.length).toBe(0); // Did not connect directly
    expect(state.pendingIncompatibleConnection).not.toBeNull();
    expect(state.pendingIncompatibleConnection?.sourceType).toBe('VIDEO');
    expect(state.pendingIncompatibleConnection?.targetType).toBe('TRANSCRIPT');
    expect(state.pendingIncompatibleConnection?.suggestions.length).toBeGreaterThan(0);
    expect(state.pendingIncompatibleConnection?.suggestions[0].transformerNodeType).toBe('extractor-transcript');
  });

  it('should resolve incompatible connection by auto-inserting transformer node', () => {
    const nodeVideo: Node = {
      id: 'node-video-src',
      position: { x: 100, y: 100 },
      data: {
        label: 'YouTube Source',
        outputs: [{ id: 'out-vid', type: 'VIDEO' }]
      }
    };
    const nodeAi: Node = {
      id: 'node-ai-tgt',
      position: { x: 500, y: 100 },
      data: {
        label: 'AI Analyst',
        inputs: [{ id: 'in-src', type: 'TRANSCRIPT', isMulti: false }]
      }
    };

    useCanvasStore.getState().setNodes([nodeVideo, nodeAi]);
    useCanvasStore.getState().onConnect({
      source: 'node-video-src',
      sourceHandle: 'out-vid',
      target: 'node-ai-tgt',
      targetHandle: 'in-src'
    });

    // Auto-insert recommended transformer
    useCanvasStore.getState().resolveIncompatibleWithTransformer('extractor-transcript');

    const state = useCanvasStore.getState();
    expect(state.pendingIncompatibleConnection).toBeNull();
    expect(state.nodes.length).toBe(3); // Source + Transformer + Target
    expect(state.edges.length).toBe(2); // Edge 1 (Source -> Transformer) + Edge 2 (Transformer -> Target)

    const transformerNode = state.nodes.find((n) => n.id.includes('extractor-transcript'));
    expect(transformerNode).toBeDefined();
    expect(transformerNode?.position.x).toBe(300); // Midpoint: (100 + 500) / 2
  });

  it('should support force connecting incompatible ports marking edge as error', () => {
    const nodeVideo: Node = {
      id: 'node-video-src',
      position: { x: 100, y: 100 },
      data: {
        label: 'YouTube Source',
        outputs: [{ id: 'out-vid', type: 'VIDEO' }]
      }
    };
    const nodeAi: Node = {
      id: 'node-ai-tgt',
      position: { x: 500, y: 100 },
      data: {
        label: 'AI Analyst',
        inputs: [{ id: 'in-src', type: 'TRANSCRIPT', isMulti: false }]
      }
    };

    useCanvasStore.getState().setNodes([nodeVideo, nodeAi]);
    useCanvasStore.getState().onConnect({
      source: 'node-video-src',
      sourceHandle: 'out-vid',
      target: 'node-ai-tgt',
      targetHandle: 'in-src'
    });

    useCanvasStore.getState().resolveIncompatibleForceConnect();

    const state = useCanvasStore.getState();
    expect(state.edges.length).toBe(1);
    expect(state.edges[0].data?.state).toBe('error');
    expect(state.edges[0].data?.errorMessage).toContain('Incompatible data types');
    expect(state.pendingIncompatibleConnection).toBeNull();
  });

  it('should inject test data packets and manage inspector state', () => {
    useCanvasStore.getState().setEdges([
      {
        id: 'edge-test-1',
        source: 'node-a',
        target: 'node-b',
        data: { dataType: 'TEXT', state: 'connected' }
      }
    ]);

    expect(useCanvasStore.getState().inspectedConnectionId).toBeNull();
    useCanvasStore.getState().openDataInspector('edge-test-1');
    expect(useCanvasStore.getState().inspectedConnectionId).toBe('edge-test-1');

    useCanvasStore.getState().injectTestDataPacket('edge-test-1');

    const updatedEdge = useCanvasStore.getState().edges.find((e) => e.id === 'edge-test-1');
    expect(updatedEdge?.data?.state).toBe('completed');
    expect(updatedEdge?.data?.tokens).toBeGreaterThan(0);
    expect(updatedEdge?.data?.dataPreview).toBeDefined();

    useCanvasStore.getState().closeDataInspector();
    expect(useCanvasStore.getState().inspectedConnectionId).toBeNull();
  });

  it('should validate canvas workflow and generate execution plan with parallel batches', () => {
    // Pipeline: Source 1 & Source 2 -> AI Analyst
    const n1: Node = {
      id: 'src-1',
      position: { x: 0, y: 0 },
      data: {
        type: 'source-youtube',
        label: 'YT',
        category: 'SOURCE',
        inputs: [],
        outputs: [{ id: 'out-trans', name: 'transcript', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true }],
        config: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }
      }
    };
    const n2: Node = {
      id: 'src-2',
      position: { x: 0, y: 200 },
      data: {
        type: 'source-website',
        label: 'Web',
        category: 'SOURCE',
        inputs: [],
        outputs: [{ id: 'out-txt', name: 'text', label: 'Text', type: 'TEXT', isMulti: true, required: true }],
        config: { url: 'https://example.com' }
      }
    };
    const n3: Node = {
      id: 'ai-1',
      position: { x: 300, y: 100 },
      data: {
        type: 'ai-analyst',
        label: 'Analyst',
        category: 'AI',
        inputs: [
          { id: 'in-sources', name: 'sources', label: 'Sources', type: 'TRANSCRIPT', isMulti: true, required: false }
        ],
        outputs: [{ id: 'out-res', name: 'analysis', label: 'Analysis', type: 'AI_RESPONSE', isMulti: true, required: true }],
        config: {}
      }
    };

    useCanvasStore.getState().setNodes([n1, n2, n3]);
    useCanvasStore.getState().setEdges([
      {
        id: 'e1',
        source: 'src-1',
        sourceHandle: 'out-trans',
        target: 'ai-1',
        targetHandle: 'in-sources'
      }
    ]);

    const valResult = useCanvasStore.getState().validateCurrentWorkflow();
    expect(valResult.isValid).toBe(true);

    const plan = useCanvasStore.getState().generateCurrentExecutionPlan('RUN');
    expect(plan.totalNodes).toBe(3);
    expect(plan.levels.length).toBe(2);
    expect(plan.levels[0]).toContain('src-1');
    expect(plan.levels[0]).toContain('src-2');
    expect(plan.levels[1]).toEqual(['ai-1']);

    // Modal action
    useCanvasStore.getState().openExecutionPlanModal();
    expect(useCanvasStore.getState().isExecutionPlanModalOpen).toBe(true);
    useCanvasStore.getState().closeExecutionPlanModal();
    expect(useCanvasStore.getState().isExecutionPlanModalOpen).toBe(false);
  });

  it('should execute workflow through ExecutionEngine and update node states and progress', async () => {
    const n1: Node = {
      id: 'src-exec-1',
      position: { x: 0, y: 0 },
      data: {
        type: 'source-text',
        label: 'Source Text',
        category: 'SOURCE',
        inputs: [],
        outputs: [{ id: 'out-text', name: 'text', label: 'Text', type: 'TEXT', isMulti: true, required: true }],
        config: { text: 'Briefing estratégico de marketing para IA' }
      }
    };
    const n2: Node = {
      id: 'ai-exec-1',
      position: { x: 250, y: 0 },
      data: {
        type: 'ai-writer',
        label: 'AI Copywriter',
        category: 'AI',
        inputs: [{ id: 'in-text', name: 'input', label: 'Input', type: 'TEXT', isMulti: false, required: true }],
        outputs: [{ id: 'out-text', name: 'output', label: 'Output', type: 'TEXT', isMulti: true, required: true }],
        config: {}
      }
    };

    useCanvasStore.getState().setNodes([n1, n2]);
    useCanvasStore.getState().setEdges([
      {
        id: 'edge-exec-1',
        source: 'src-exec-1',
        sourceHandle: 'out-text',
        target: 'ai-exec-1',
        targetHandle: 'in-text'
      }
    ]);

    const summary = await useCanvasStore.getState().executeWorkflow('RUN');

    expect(summary.status).toBe('COMPLETED');
    expect(summary.totalNodes).toBe(2);
    expect(summary.completedNodes).toBe(2);
    expect(summary.failedNodes).toBe(0);
    expect(summary.totalTokens).toBeGreaterThan(0);

    const updatedNodes = useCanvasStore.getState().nodes;
    expect((updatedNodes[0].data as any).state).toBe('COMPLETED');
    expect((updatedNodes[1].data as any).state).toBe('COMPLETED');
    expect((updatedNodes[1].data as any).executionInfo.status).toBe('COMPLETED');
    expect(useCanvasStore.getState().isExecuting).toBe(false);
    expect(useCanvasStore.getState().executionProgress.percent).toBe(100);
  });

  it('should support stopWorkflow by aborting in-flight execution', async () => {
    const n1: Node = {
      id: 'src-stop-1',
      position: { x: 0, y: 0 },
      data: {
        type: 'source-text',
        label: 'Source Text',
        category: 'SOURCE',
        inputs: [],
        outputs: [{ id: 'out-text', name: 'text', label: 'Text', type: 'TEXT', isMulti: true, required: true }],
        config: { text: 'Test stop' }
      }
    };

    useCanvasStore.getState().setNodes([n1]);
    const execPromise = useCanvasStore.getState().executeWorkflow('RUN');
    useCanvasStore.getState().stopWorkflow();

    const summary = await execPromise;
    expect(useCanvasStore.getState().isExecuting).toBe(false);
    expect(summary.status === 'STOPPED' || summary.status === 'COMPLETED').toBe(true);
  });
});


