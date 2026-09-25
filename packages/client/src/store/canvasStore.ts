import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  addEdge,
  Viewport
} from '@xyflow/react';
import {
  DataType,
  isTypeCompatible,
  getSuggestedTransformers,
  SuggestedTransformer,
  DataPacket,
  createDataPacket,
  globalDataBus,
  WorkflowEngine,
  WorkflowDefinition,
  WorkflowValidationResult,
  ExecutionPlan,
  ExecutionMode,
  NodeDefinition,
  ConnectionDefinition,
  ExecutionEngine,
  WorkflowExecutionSummary,
  WorkflowRun,
  WorkflowRunStatus,
  WorkflowVersion,
  UserCredits,
  CreditTransaction,
  WorkflowGroup
} from '@union/shared';
import { createNodeFromTemplate } from '../components/nodes/nodeRegistry.js';
import { StorageService, AUTH_TOKEN_KEY } from '../services/storageService.js';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'offline' | 'error';

export interface CanvasHistoryState {
  nodes: Node[];
  edges: Edge[];
}

export interface PendingIncompatibleConnection {
  connection: Connection;
  sourceType: DataType;
  targetType: DataType;
  sourceNodeLabel: string;
  targetNodeLabel: string;
  suggestions: SuggestedTransformer[];
}

export interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  isGridVisible: boolean;
  isSnappingEnabled: boolean;
  clipboard: { nodes: Node[]; edges: Edge[] } | null;
  historyPast: CanvasHistoryState[];
  historyFuture: CanvasHistoryState[];
  pendingIncompatibleConnection: PendingIncompatibleConnection | null;
  inspectedConnectionId: string | null;
  validationResult: WorkflowValidationResult | null;
  executionPlan: ExecutionPlan | null;
  isExecutionPlanModalOpen: boolean;
  isExecuting: boolean;
  executionSummary: WorkflowExecutionSummary | null;
  executionProgress: { total: number; completed: number; percent: number };
  abortController: AbortController | null;

  // Persistence, Storage & Autosave (Gate 11)
  activeWorkflowId: string;
  workflowName: string;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  autosaveTimer: ReturnType<typeof setTimeout> | null;

  // Gate 12: Runs History & Versions
  runsHistory: WorkflowRun[];
  versionsList: WorkflowVersion[];
  isHistoryDrawerOpen: boolean;

  // UNION.AI 2.0: Workflow Visual Groups & Collapse
  groups: WorkflowGroup[];
  createGroup: (name: string, nodeIds: string[], color?: string) => void;
  deleteGroup: (groupId: string) => void;
  toggleGroupCollapse: (groupId: string) => void;
  updateGroup: (groupId: string, partial: Partial<WorkflowGroup>) => void;

  // Actions
  executeWorkflow: (mode?: ExecutionMode, targetNodeId?: string) => Promise<WorkflowExecutionSummary>;
  stopWorkflow: () => void;
  updateNodeData: (nodeId: string, partialData: Record<string, unknown>) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteSelected: () => void;
  undo: () => void;
  redo: () => void;
  toggleGrid: () => void;
  toggleSnapping: () => void;
  setViewport: (viewport: Viewport) => void;
  recordHistory: () => void;
  resetCanvas: () => void;

  // Persistence Actions (Gate 11)
  setWorkflowName: (name: string) => void;
  saveWorkflow: (forceServerSync?: boolean) => Promise<void>;
  scheduleAutosave: () => void;
  loadWorkflow: (workflowDef: WorkflowDefinition) => void;
  initFromLocalStorage: () => boolean;

  // Gate 12 Actions: Runs History & Versions
  openHistoryDrawer: () => void;
  closeHistoryDrawer: () => void;
  recordExecutionRun: (summary: WorkflowExecutionSummary) => Promise<WorkflowRun | null>;
  fetchRunsHistory: () => Promise<WorkflowRun[]>;
  createVersionSnapshot: (name: string, description?: string) => Promise<WorkflowVersion | null>;
  fetchWorkflowVersions: () => Promise<WorkflowVersion[]>;
  rollbackToVersion: (versionId: string) => Promise<void>;

  // Gate 13: Credits, Quotas & Token Accounting
  userCredits: UserCredits | null;
  creditTransactions: CreditTransaction[];
  isCreditsDrawerOpen: boolean;
  openCreditsDrawer: () => void;
  closeCreditsDrawer: () => void;
  fetchUserCredits: () => Promise<UserCredits | null>;
  fetchCreditTransactions: () => Promise<CreditTransaction[]>;
  topupCredits: (amount: number, packageId?: string) => Promise<UserCredits | null>;

  // Data Bus & Compatibility Actions
  resolveIncompatibleWithTransformer: (transformerType: string) => void;
  resolveIncompatibleForceConnect: () => void;
  cancelIncompatibleConnection: () => void;
  openDataInspector: (connectionId: string) => void;
  closeDataInspector: () => void;
  publishDataPacket: (connectionId: string, packet: DataPacket) => void;
  injectTestDataPacket: (connectionId: string) => void;

  // Workflow Engine (DAG, Validation & Planning)
  validateCurrentWorkflow: () => WorkflowValidationResult;
  generateCurrentExecutionPlan: (mode?: ExecutionMode, targetNodeId?: string) => ExecutionPlan;
  openExecutionPlanModal: () => void;
  closeExecutionPlanModal: () => void;
  autoLayoutWorkflow: () => void;
  executeCascadeWorkflow: () => Promise<WorkflowExecutionSummary>;
}

const MAX_HISTORY = 30;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  isGridVisible: true,
  isSnappingEnabled: true,
  clipboard: null,
  historyPast: [],
  historyFuture: [],
  pendingIncompatibleConnection: null,
  inspectedConnectionId: null,
  validationResult: null,
  executionPlan: null,
  isExecutionPlanModalOpen: false,
  isExecuting: false,
  executionSummary: null,
  executionProgress: { total: 0, completed: 0, percent: 0 },
  abortController: null,

  activeWorkflowId: 'active-canvas-workflow',
  workflowName: 'Marketing Pipeline',
  saveStatus: 'saved',
  lastSavedAt: null,
  autosaveTimer: null,
  runsHistory: [],
  versionsList: [],
  isHistoryDrawerOpen: false,
  userCredits: null,
  creditTransactions: [],
  isCreditsDrawerOpen: false,

  groups: [],
  createGroup: (name: string, nodeIds: string[], color = '#6366f1') => {
    const newGroup: WorkflowGroup = {
      id: `group-${Date.now()}`,
      name: name.trim() || 'Visual Group',
      color,
      nodeIds,
      isCollapsed: false
    };
    set((state) => ({ groups: [...state.groups, newGroup] }));
    get().scheduleAutosave();
  },
  deleteGroup: (groupId: string) => {
    set((state) => ({ groups: state.groups.filter((g) => g.id !== groupId) }));
    get().scheduleAutosave();
  },
  toggleGroupCollapse: (groupId: string) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
      )
    }));
    get().scheduleAutosave();
  },
  updateGroup: (groupId: string, partial: Partial<WorkflowGroup>) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...partial } : g
      )
    }));
    get().scheduleAutosave();
  },

  updateNodeData: (nodeId, partialData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...(node.data as Record<string, unknown>),
              ...partialData
            }
          };
        }
        return node;
      })
    }));
    get().scheduleAutosave();
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  recordHistory: () => {
    const { nodes, edges, historyPast } = get();
    const snapshot: CanvasHistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    set({
      historyPast: [...historyPast.slice(-MAX_HISTORY + 1), snapshot],
      historyFuture: []
    });
  },

  onNodesChange: (changes) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: nextNodes });
    get().scheduleAutosave();
  },

  onEdgesChange: (changes) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: nextEdges });
    get().scheduleAutosave();
  },

  onConnect: (connection) => {
    // 1. Prevent connecting node to itself
    if (connection.source === connection.target) {
      return;
    }

    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    // 2. Identify DataType from source port
    let sourceType: DataType = 'TEXT';
    if (sourceNode?.data && typeof sourceNode.data === 'object' && 'outputs' in sourceNode.data) {
      const outputs = (sourceNode.data as { outputs?: Array<{ id: string; type: DataType }> }).outputs;
      const port = outputs?.find((p) => p.id === connection.sourceHandle);
      if (port) {
        sourceType = port.type;
      }
    }

    // 3. Identify DataType from target port
    let targetType: DataType = 'TEXT';
    let isMulti = true;
    if (targetNode?.data && typeof targetNode.data === 'object' && 'inputs' in targetNode.data) {
      const inputs = (targetNode.data as { inputs?: Array<{ id: string; type?: DataType; isMulti?: boolean }> }).inputs;
      const targetPort = inputs?.find((p) => p.id === connection.targetHandle);
      if (targetPort) {
        if (targetPort.type) targetType = targetPort.type;
        if (targetPort.isMulti !== undefined) isMulti = targetPort.isMulti;
      }
    }

    // 4. Validate Compatibility
    if (!isTypeCompatible(sourceType, targetType)) {
      const suggestions = getSuggestedTransformers(sourceType, targetType);
      const sourceNodeLabel = (sourceNode?.data as any)?.label || sourceNode?.id || 'Source';
      const targetNodeLabel = (targetNode?.data as any)?.label || targetNode?.id || 'Target';

      set({
        pendingIncompatibleConnection: {
          connection,
          sourceType,
          targetType,
          sourceNodeLabel,
          targetNodeLabel,
          suggestions
        }
      });
      return;
    }

    // 5. Check target port multi-input rule
    let currentEdges = edges;
    if (!isMulti) {
      // Remove existing edge to this single-input port
      currentEdges = edges.filter(
        (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle)
      );
    }

    get().recordHistory();
    const newEdges = addEdge(
      {
        ...connection,
        type: 'unionEdge',
        animated: true,
        data: {
          dataType: sourceType,
          state: 'connected'
        }
      },
      currentEdges
    );
    set({ edges: newEdges });
    get().scheduleAutosave();
  },

  resolveIncompatibleWithTransformer: (transformerType: string) => {
    const { pendingIncompatibleConnection, nodes, edges, recordHistory } = get();
    if (!pendingIncompatibleConnection) return;

    const { connection, sourceType, targetType } = pendingIncompatibleConnection;
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      set({ pendingIncompatibleConnection: null });
      return;
    }

    recordHistory();

    // 1. Calculate midpoint position
    const midX = Math.round((sourceNode.position.x + targetNode.position.x) / 2);
    const midY = Math.round((sourceNode.position.y + targetNode.position.y) / 2);

    // 2. Instantiate transformer node
    const transformerNodeDef = createNodeFromTemplate(transformerType, { x: midX, y: midY });
    const transformerNode: Node = {
      id: transformerNodeDef.id,
      type: 'unionNode',
      position: transformerNodeDef.position,
      data: transformerNodeDef as unknown as Record<string, unknown>
    };

    // 3. Find matching input and output ports on transformer
    const transformerInput = transformerNodeDef.inputs.find((i) => i.type === sourceType) || transformerNodeDef.inputs[0];
    const transformerOutput = transformerNodeDef.outputs.find((o) => o.type === targetType) || transformerNodeDef.outputs[0];

    const timestamp = Date.now();
    const edge1Id = `edge-${connection.source}-${transformerNode.id}-${timestamp}`;
    const edge2Id = `edge-${transformerNode.id}-${connection.target}-${timestamp + 1}`;

    const edge1: Edge = {
      id: edge1Id,
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: transformerNode.id,
      targetHandle: transformerInput ? transformerInput.id : null,
      type: 'unionEdge',
      animated: true,
      data: {
        dataType: sourceType,
        state: 'connected'
      }
    };

    const edge2: Edge = {
      id: edge2Id,
      source: transformerNode.id,
      sourceHandle: transformerOutput ? transformerOutput.id : null,
      target: connection.target,
      targetHandle: connection.targetHandle,
      type: 'unionEdge',
      animated: true,
      data: {
        dataType: transformerOutput ? transformerOutput.type : targetType,
        state: 'connected'
      }
    };

    set({
      nodes: [...nodes, transformerNode],
      edges: [...edges, edge1, edge2],
      pendingIncompatibleConnection: null
    });
    get().scheduleAutosave();
  },

  resolveIncompatibleForceConnect: () => {
    const { pendingIncompatibleConnection, edges, recordHistory } = get();
    if (!pendingIncompatibleConnection) return;

    const { connection, sourceType, targetType } = pendingIncompatibleConnection;
    recordHistory();

    const newEdge: Edge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'unionEdge',
      animated: false,
      data: {
        dataType: sourceType,
        state: 'error',
        errorMessage: `Incompatible data types: ${sourceType} -> ${targetType}`
      }
    };

    set({
      edges: [...edges, newEdge],
      pendingIncompatibleConnection: null
    });
    get().scheduleAutosave();
  },

  cancelIncompatibleConnection: () => {
    set({ pendingIncompatibleConnection: null });
  },

  openDataInspector: (connectionId: string) => {
    set({ inspectedConnectionId: connectionId });
  },

  closeDataInspector: () => {
    set({ inspectedConnectionId: null });
  },

  publishDataPacket: (connectionId: string, packet: DataPacket) => {
    globalDataBus.publish(connectionId, packet);
    const { edges } = get();
    const updatedEdges = edges.map((e) => {
      if (e.id === connectionId) {
        return {
          ...e,
          data: {
            ...e.data,
            dataType: packet.type,
            state: 'completed' as const,
            tokens: packet.metadata.tokens,
            dataPreview: packet.payload
          }
        };
      }
      return e;
    });
    set({ edges: updatedEdges });
  },

  injectTestDataPacket: (connectionId: string) => {
    const { edges } = get();
    const edge = edges.find((e) => e.id === connectionId);
    if (!edge) return;

    const dataType = (edge.data?.dataType as DataType) || 'TEXT';
    let payload: unknown;
    let tokens = 120;
    let processingTimeMs = 150;
    let creditsCost = 0.01;
    let model = 'gpt-4o';

    switch (dataType) {
      case 'URL':
        payload = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        tokens = 0;
        processingTimeMs = 12;
        creditsCost = 0;
        break;
      case 'VIDEO':
        payload = { url: 'https://cdn.union.ai/sample.mp4', durationSec: 360, resolution: '1080p' };
        tokens = 0;
        processingTimeMs = 45;
        creditsCost = 0;
        break;
      case 'TRANSCRIPT':
        payload = [
          { timestamp: '00:00:05', text: 'Bem-vindo ao UNION.AI, a plataforma definitiva de automação com inteligência artificial.' },
          { timestamp: '00:00:25', text: 'Neste módulo, aprenderemos a orquestrar fluxos visuais complexos orientados a dados.' }
        ];
        tokens = 450;
        processingTimeMs = 780;
        creditsCost = 0.04;
        break;
      case 'JSON':
        payload = {
          niche: 'Marketing Digital B2B',
          pains: ['CAC elevado', 'Baixa taxa de conversão em landing pages'],
          opportunities: ['IA Generativa para automação de criativos']
        };
        tokens = 210;
        processingTimeMs = 190;
        creditsCost = 0.02;
        break;
      case 'TABLE':
        payload = [
          { Canal: 'YouTube Ads', Conversao: '3.8%', CAC: 'R$ 42,00' },
          { Canal: 'Meta Ads', Conversao: '2.4%', CAC: 'R$ 68,00' },
          { Canal: 'Google Search', Conversao: '5.1%', CAC: 'R$ 31,50' }
        ];
        tokens = 180;
        processingTimeMs = 110;
        creditsCost = 0.015;
        break;
      case 'AI_RESPONSE':
        payload = '### Análise Estratégica de Posicionamento\n\n1. **Diferencial Competitivo**: Fluxo de dados real em tempo real sem caixas pretas.\n2. **Engajamento**: Aumento de 300% na velocidade de prototipagem de campanhas.';
        tokens = 680;
        processingTimeMs = 1150;
        creditsCost = 0.07;
        model = 'claude-3-7-sonnet';
        break;
      case 'TEXT':
      default:
        payload = 'Exemplo de payload real transportado com sucesso pelo UNION Data Bus.';
        tokens = 150;
        processingTimeMs = 85;
        creditsCost = 0.01;
        break;
    }

    const packet = createDataPacket({
      type: dataType,
      payload,
      originNodeId: edge.source,
      originPortId: edge.sourceHandle || undefined,
      tokens,
      processingTimeMs,
      creditsCost,
      model
    });

    get().publishDataPacket(connectionId, packet);
  },

  addNode: (node) => {
    get().recordHistory();
    set({ nodes: [...get().nodes, node] });
    get().scheduleAutosave();
  },

  deleteSelected: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

    get().recordHistory();
    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    const remainingNodes = nodes.filter((n) => !n.selected);
    const remainingEdges = edges.filter(
      (e) => !e.selected && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    );

    set({ nodes: remainingNodes, edges: remainingEdges });
    get().scheduleAutosave();
  },

  duplicateSelected: () => {
    const { nodes } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    get().recordHistory();
    const timestamp = Date.now();
    const duplicatedNodes: Node[] = selectedNodes.map((node, index) => ({
      ...node,
      id: `${node.id}-copy-${timestamp}-${index}`,
      position: {
        x: node.position.x + 40,
        y: node.position.y + 40
      },
      selected: true
    }));

    // Deselect original nodes and append duplicates
    const updatedOriginals = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));
    set({ nodes: [...updatedOriginals, ...duplicatedNodes] });
    get().scheduleAutosave();
  },

  copySelected: () => {
    const { nodes, edges } = get();
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const selectedEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    set({
      clipboard: {
        nodes: JSON.parse(JSON.stringify(selectedNodes)),
        edges: JSON.parse(JSON.stringify(selectedEdges))
      }
    });
  },

  pasteSelected: () => {
    const { clipboard, nodes, edges } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;

    get().recordHistory();
    const idMap = new Map<string, string>();
    const timestamp = Date.now();

    const newNodes: Node[] = clipboard.nodes.map((n, i) => {
      const newId = `${n.id}-pasted-${timestamp}-${i}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: {
          x: n.position.x + 50,
          y: n.position.y + 50
        },
        selected: true
      };
    });

    const newEdges: Edge[] = clipboard.edges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e, i) => ({
        ...e,
        id: `edge-pasted-${timestamp}-${i}`,
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        selected: false
      }));

    // Unselect currently selected nodes
    const unselectedNodes = nodes.map((n) => (n.selected ? { ...n, selected: false } : n));

    set({
      nodes: [...unselectedNodes, ...newNodes],
      edges: [...edges, ...newEdges]
    });
    get().scheduleAutosave();
  },

  undo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyPast.length === 0) return;

    const previous = historyPast[historyPast.length - 1];
    const newPast = historyPast.slice(0, historyPast.length - 1);

    const currentSnapshot: CanvasHistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      historyPast: newPast,
      historyFuture: [currentSnapshot, ...historyFuture]
    });
    get().scheduleAutosave();
  },

  redo: () => {
    const { historyPast, historyFuture, nodes, edges } = get();
    if (historyFuture.length === 0) return;

    const next = historyFuture[0];
    const newFuture = historyFuture.slice(1);

    const currentSnapshot: CanvasHistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges))
    };

    set({
      nodes: next.nodes,
      edges: next.edges,
      historyPast: [...historyPast, currentSnapshot],
      historyFuture: newFuture
    });
    get().scheduleAutosave();
  },

  toggleGrid: () => set((state) => ({ isGridVisible: !state.isGridVisible })),
  toggleSnapping: () => set((state) => ({ isSnappingEnabled: !state.isSnappingEnabled })),
  setViewport: (viewport) => {
    set({ viewport });
    get().scheduleAutosave();
  },



  validateCurrentWorkflow: () => {
    const { nodes, edges, viewport } = get();
    const wf = canvasToWorkflowDefinition(nodes, edges, viewport);
    const result = WorkflowEngine.validate(wf);
    set({ validationResult: result });
    return result;
  },

  generateCurrentExecutionPlan: (mode: ExecutionMode = 'RUN', targetNodeId?: string) => {
    const { nodes, edges, viewport } = get();
    const wf = canvasToWorkflowDefinition(nodes, edges, viewport);
    const validation = WorkflowEngine.validate(wf);
    set({ validationResult: validation });

    if (!validation.isValid && validation.errors.some((e) => e.code === 'CYCLE_DETECTED')) {
      set({ executionPlan: null });
      throw new Error('Não é possível gerar plano de execução: Ciclo detectado no workflow.');
    }

    const plan = WorkflowEngine.generateExecutionPlan(wf, mode, targetNodeId);
    set({ executionPlan: plan });
    return plan;
  },

  openExecutionPlanModal: () => {
    get().validateCurrentWorkflow();
    try {
      get().generateCurrentExecutionPlan();
    } catch {
      // Keep executionPlan as null if cycle detected
    }
    set({ isExecutionPlanModalOpen: true });
  },

  closeExecutionPlanModal: () => {
    set({ isExecutionPlanModalOpen: false });
  },

  executeWorkflow: async (mode: ExecutionMode = 'RUN', targetNodeId?: string) => {
    const { nodes, edges, viewport } = get();
    const wf = canvasToWorkflowDefinition(nodes, edges, viewport);
    const plan = WorkflowEngine.generateExecutionPlan(wf, mode, targetNodeId);

    const abortController = new AbortController();
    set({
      isExecuting: true,
      abortController,
      executionPlan: plan,
      executionProgress: { total: plan.totalNodes, completed: 0, percent: 0 }
    });

    try {
      const summary = await ExecutionEngine.execute({
        workflow: wf,
        plan,
        signal: abortController.signal,
        onNodeEvent: (event) => {
          const { nodeId, type } = event;
          let nodeState = 'IDLE';
          if (type === 'NODE_QUEUED') nodeState = 'QUEUED';
          else if (type === 'NODE_STARTED') nodeState = 'PROCESSING';
          else if (type === 'NODE_COMPLETED') nodeState = 'COMPLETED';
          else if (type === 'NODE_FAILED') nodeState = 'FAILED';

          set((state) => {
            const outputs = (event as any).outputs;
            const updatedNodes = state.nodes.map((n) => {
              if (n.id === nodeId) {
                const prevData = (n.data || {}) as any;
                const nextConfig = { ...(prevData.config || {}) };

                if (type === 'NODE_COMPLETED' && outputs) {
                  if (outputs['out-ebook']?.payload) {
                    nextConfig.generatedEbook = outputs['out-ebook'].payload;
                  }
                  if (outputs['out-synopsis']?.payload) {
                    nextConfig.synopsis = outputs['out-synopsis'].payload;
                    nextConfig.fullOutput = outputs['out-synopsis'].payload;
                  }
                  if (outputs['out-markdown']?.payload) {
                    nextConfig.fullOutput = outputs['out-markdown'].payload;
                  }
                  if (outputs['out-response']?.payload) {
                    nextConfig.fullOutput = outputs['out-response'].payload;
                    nextConfig.lastResponse = outputs['out-response'].payload;
                    if (prevData.type === 'ai-chat') {
                      const prevMessages = Array.isArray(nextConfig.messages) ? nextConfig.messages : [];
                      const responseText = String(outputs['out-response'].payload);
                      nextConfig.messages = [
                        ...prevMessages,
                        {
                          id: `msg-assistant-${Date.now()}`,
                          role: 'assistant',
                          text: responseText,
                          timestamp: 'Executado'
                        }
                      ];
                    }
                  }
                  if (outputs['out-transcript']?.payload) {
                    nextConfig.transcript = outputs['out-transcript'].payload;
                    if (!nextConfig.fullOutput) {
                      nextConfig.fullOutput = outputs['out-transcript'].payload;
                    }
                  }
                }

                return {
                  ...n,
                  data: {
                    ...prevData,
                    state: nodeState,
                    config: nextConfig,
                    executionInfo: {
                      ...(prevData.executionInfo || {}),
                      status: nodeState,
                      tokens: (event as any).metrics?.tokens ?? prevData.executionInfo?.tokens,
                      cost: (event as any).metrics?.credits ?? prevData.executionInfo?.cost,
                      durationMs: (event as any).metrics?.durationMs ?? prevData.executionInfo?.durationMs,
                      error: (event as any).error
                    }
                  }
                };
              }
              return n;
            });

            // If node completed and produced outputs, propagate downstream along edges
            if (type === 'NODE_COMPLETED' && outputs) {
              const outgoingEdges = state.edges.filter((e) => e.source === nodeId);
              const targetNodeIds = new Set(outgoingEdges.map((e) => e.target));

              for (let i = 0; i < updatedNodes.length; i++) {
                const node = updatedNodes[i];
                if (targetNodeIds.has(node.id)) {
                  const nodeType = (node.data as any)?.type;
                  const targetConfig = { ...((node.data as any)?.config || {}) };
                  let mutated = false;

                  if (nodeType === 'output-modal-viewer') {
                    if (outputs['out-ebook']?.payload) {
                      targetConfig.generatedEbook = outputs['out-ebook'].payload;
                      mutated = true;
                    }
                    if (outputs['out-markdown']?.payload) {
                      targetConfig.fullOutput = outputs['out-markdown'].payload;
                      mutated = true;
                    }
                    // Cinema agent output
                    if (outputs['out-synopsis']?.payload) {
                      targetConfig.fullOutput = outputs['out-synopsis'].payload;
                      mutated = true;
                    }
                  } else if (nodeType === 'ai-chat') {
                    if (outputs['out-transcript']?.payload) {
                      targetConfig.transcript = outputs['out-transcript'].payload;
                      mutated = true;
                    }
                    if (outputs['out-markdown']?.payload) {
                      targetConfig.context = outputs['out-markdown'].payload;
                      mutated = true;
                    }
                  } else if (nodeType === 'ai-cinema-agent') {
                    // Forward context/transcript into the cinema agent
                    if (outputs['out-transcript']?.payload) {
                      targetConfig.theme = String(outputs['out-transcript'].payload).slice(0, 200);
                      mutated = true;
                    }
                    if (outputs['out-text']?.payload) {
                      targetConfig.theme = String(outputs['out-text'].payload).slice(0, 200);
                      mutated = true;
                    }
                  }

                  if (mutated) {
                    updatedNodes[i] = {
                      ...node,
                      data: {
                        ...(node.data as any),
                        config: targetConfig
                      }
                    };
                  }
                }
              }
            }

            return { nodes: updatedNodes };
          });
        },
        onSummaryUpdate: (summary) => {
          const percent = summary.totalNodes > 0
            ? Math.round((summary.completedNodes / summary.totalNodes) * 100)
            : 0;
          set({
            executionSummary: summary,
            executionProgress: {
              total: summary.totalNodes,
              completed: summary.completedNodes,
              percent
            }
          });
        }
      });

      set({
        isExecuting: false,
        abortController: null,
        executionSummary: summary
      });
      get().recordExecutionRun(summary);
      return summary;
    } catch (err: any) {
      set({
        isExecuting: false,
        abortController: null
      });
      throw err;
    }
  },

  executeCascadeWorkflow: async () => {
    return get().executeWorkflow('RUN');
  },

  autoLayoutWorkflow: () => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;

    get().recordHistory();

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const validEdges = edges.filter(
      (e) => nodeMap.has(e.source) && nodeMap.has(e.target)
    );

    // Build DAG adjacency and in-degree
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of validEdges) {
      adjacency.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    // Longest-path topological level assignment
    const levels = new Map<string, number>();
    const queue: string[] = [];

    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        levels.set(id, 0);
        queue.push(id);
      }
    }

    // BFS with cycle-safety
    const visitedCount = new Map<string, number>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;
      const count = (visitedCount.get(current) || 0) + 1;
      visitedCount.set(current, count);

      if (count > nodes.length * 2) continue; // Cycle guard

      const neighbors = adjacency.get(current) || [];
      for (const next of neighbors) {
        const nextLevel = Math.max(levels.get(next) || 0, currentLevel + 1);
        levels.set(next, nextLevel);
        queue.push(next);
      }
    }

    // Fallback for any unassigned nodes
    for (const node of nodes) {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    }

    // Group nodes by level (columns)
    const columns = new Map<number, Node[]>();
    for (const node of nodes) {
      const lvl = levels.get(node.id) || 0;
      if (!columns.has(lvl)) {
        columns.set(lvl, []);
      }
      columns.get(lvl)!.push(node);
    }

    const sortedLevels = Array.from(columns.keys()).sort((a, b) => a - b);

    // Helper to estimate node dimensions
    const getNodeDims = (node: Node) => {
      const type = (node.data as any)?.type || node.type;
      if (type === 'output-modal-viewer' || type === 'ai-chat' || type === 'ai-cinema-agent') {
        return { width: 640, height: 640 };
      }
      if (type === 'ai-ebook-forge') {
        return { width: 384, height: 520 };
      }
      return { width: 288, height: 320 };
    };

    let currentX = 80;
    const updatedPositions = new Map<string, { x: number; y: number }>();

    for (const lvl of sortedLevels) {
      const colNodes = columns.get(lvl)!;
      let maxColWidth = 288;
      for (const n of colNodes) {
        const dims = getNodeDims(n);
        if (dims.width > maxColWidth) maxColWidth = dims.width;
      }

      let currentY = 80;
      for (const n of colNodes) {
        updatedPositions.set(n.id, { x: currentX, y: currentY });
        const dims = getNodeDims(n);
        currentY += dims.height + 60; // 60px vertical margin
      }

      currentX += maxColWidth + 100; // 100px column margin
    }

    const nextNodes = nodes.map((n) => {
      const pos = updatedPositions.get(n.id);
      return pos ? { ...n, position: pos } : n;
    });

    set({ nodes: nextNodes });
    get().scheduleAutosave();
  },

  stopWorkflow: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isExecuting: false, abortController: null });
  },

  setWorkflowName: (name: string) => {
    set({ workflowName: name.trim() || 'Untitled Workflow' });
    get().scheduleAutosave();
  },

  scheduleAutosave: () => {
    const { autosaveTimer } = get();
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }
    set({ saveStatus: 'unsaved' });
    const timer = setTimeout(() => {
      get().saveWorkflow(false);
    }, 1200);
    set({ autosaveTimer: timer });
  },

  saveWorkflow: async (_forceServerSync = false) => {
    const { nodes, edges, groups, viewport, activeWorkflowId, workflowName, autosaveTimer } = get();
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
    }
    set({ saveStatus: 'saving' });

    const wf = canvasToWorkflowDefinition(nodes, edges, viewport, groups);
    wf.id = activeWorkflowId;
    wf.name = workflowName;

    try {
      const result = await StorageService.syncToServer(wf);
      set({
        saveStatus: result.isLocalOnly ? 'saved' : 'saved',
        lastSavedAt: result.savedAt,
        autosaveTimer: null
      });
    } catch {
      set({
        saveStatus: 'offline',
        lastSavedAt: Date.now(),
        autosaveTimer: null
      });
    }
  },

  loadWorkflow: (workflowDef: WorkflowDefinition) => {
    const { nodes, edges, viewport, groups } = workflowDefinitionToCanvas(workflowDef);
    set({
      nodes,
      edges,
      viewport,
      groups,
      activeWorkflowId: workflowDef.id,
      workflowName: workflowDef.name || 'Untitled Workflow',
      saveStatus: 'saved',
      lastSavedAt: Date.now(),
      historyPast: [],
      historyFuture: [],
      autosaveTimer: null
    });
  },

  initFromLocalStorage: () => {
    const saved = StorageService.loadFromLocalStorage();
    if (saved && saved.nodes && saved.nodes.length > 0) {
      get().loadWorkflow(saved);
      return true;
    }
    return false;
  },

  openHistoryDrawer: () => {
    get().fetchRunsHistory();
    get().fetchWorkflowVersions();
    set({ isHistoryDrawerOpen: true });
  },

  closeHistoryDrawer: () => set({ isHistoryDrawerOpen: false }),

  recordExecutionRun: async (summary: WorkflowExecutionSummary) => {
    const { activeWorkflowId } = get();
    const runId = `run-${Date.now()}`;
    let runStatus: WorkflowRunStatus = 'COMPLETED';
    if (summary.status === 'FAILED') runStatus = 'FAILED';
    else if (summary.status === 'STOPPED') runStatus = 'STOPPED';
    else if (summary.status === 'RUNNING') runStatus = 'RUNNING';
    else runStatus = 'COMPLETED';

    const run: WorkflowRun = {
      id: runId,
      workflowId: activeWorkflowId,
      userId: 'active-user',
      status: runStatus,
      mode: summary.mode,
      totalNodes: summary.totalNodes,
      completedNodes: summary.completedNodes,
      failedNodes: summary.failedNodes,
      totalTokens: summary.totalTokens,
      totalCostCredits: summary.totalCostCredits,
      durationMs: summary.durationMs,
      summary: {
        completedNodes: summary.completedNodes,
        totalNodes: summary.totalNodes,
        totalTokens: summary.totalTokens,
        totalCostCredits: summary.totalCostCredits
      },
      createdAt: summary.startTime,
      completedAt: summary.endTime || Date.now()
    };

    StorageService.saveRunLocally(run);
    set((state) => ({
      runsHistory: [run, ...state.runsHistory.filter((r) => r.id !== run.id)]
    }));

    // Local credit deduction if active
    const currentCredits = get().userCredits;
    if (currentCredits && run.totalCostCredits > 0) {
      const newBal = Math.max(0, Math.round((currentCredits.balance - run.totalCostCredits) * 100000) / 100000);
      const updatedCredits = {
        ...currentCredits,
        balance: newBal,
        totalConsumed: Math.round((currentCredits.totalConsumed + run.totalCostCredits) * 100000) / 100000,
        updatedAt: Date.now()
      };
      StorageService.saveCreditsLocally(updatedCredits);
      set({ userCredits: updatedCredits });
    }

    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch(`/api/workflows/${activeWorkflowId}/runs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            status: run.status,
            mode: run.mode,
            totalNodes: run.totalNodes,
            completedNodes: run.completedNodes,
            failedNodes: run.failedNodes,
            totalTokens: run.totalTokens,
            totalCostCredits: run.totalCostCredits,
            durationMs: run.durationMs,
            summary: run.summary
          })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.creditsRemaining !== undefined) {
            get().fetchUserCredits();
          }
        }
      } catch {
        // local copy preserved
      }
    }

    return run;
  },

  fetchRunsHistory: async () => {
    const { activeWorkflowId } = get();
    const local = StorageService.loadRunsLocally(activeWorkflowId);
    set({ runsHistory: local });

    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch(`/api/workflows/${activeWorkflowId}/runs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.runs) {
            set({ runsHistory: json.data.runs });
            return json.data.runs;
          }
        }
      } catch {
        // keep local
      }
    }
    return local;
  },

  createVersionSnapshot: async (name: string, description?: string) => {
    const { nodes, edges, groups, viewport, activeWorkflowId, workflowName } = get();
    const wf = canvasToWorkflowDefinition(nodes, edges, viewport, groups);
    wf.id = activeWorkflowId;
    wf.name = workflowName;

    const versionId = `ver-${Date.now()}`;
    const versionNumber = (get().versionsList.length > 0 ? get().versionsList[0].versionNumber : 0) + 1;
    const version: WorkflowVersion = {
      id: versionId,
      workflowId: activeWorkflowId,
      versionNumber,
      name: name.trim() || `Snapshot v${versionNumber}`,
      description,
      snapshot: {
        ...wf,
        groups: wf.groups || []
      },
      createdAt: Date.now()
    };

    StorageService.saveVersionLocally(version);
    set((state) => ({
      versionsList: [version, ...state.versionsList]
    }));

    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch(`/api/workflows/${activeWorkflowId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: version.name, description: version.description })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.version) {
            set((state) => ({
              versionsList: [json.data.version, ...state.versionsList.filter((v) => v.id !== versionId)]
            }));
            return json.data.version;
          }
        }
      } catch {
        // keep local
      }
    }
    return version;
  },

  fetchWorkflowVersions: async () => {
    const { activeWorkflowId } = get();
    const local = StorageService.loadVersionsLocally(activeWorkflowId);
    set({ versionsList: local });

    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch(`/api/workflows/${activeWorkflowId}/versions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.versions) {
            set({ versionsList: json.data.versions });
            return json.data.versions;
          }
        }
      } catch {
        // keep local
      }
    }
    return local;
  },

  rollbackToVersion: async (versionId: string) => {
    const { versionsList } = get();
    const ver = versionsList.find((v) => v.id === versionId);
    if (!ver) throw new Error('Versão não encontrada para restauração');

    get().recordHistory();
    get().loadWorkflow(ver.snapshot);
    await get().saveWorkflow(true);
  },

  openCreditsDrawer: () => {
    get().fetchUserCredits();
    get().fetchCreditTransactions();
    set({ isCreditsDrawerOpen: true });
  },

  closeCreditsDrawer: () => set({ isCreditsDrawerOpen: false }),

  fetchUserCredits: async () => {
    const local = StorageService.loadCreditsLocally();
    if (local && !get().userCredits) {
      set({ userCredits: local });
    }

    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch('/api/credits/balance', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            StorageService.saveCreditsLocally(json.data);
            set({ userCredits: json.data });
            return json.data;
          }
        }
      } catch {
        // keep local
      }
    }

    if (!local) {
      const fallback: UserCredits = {
        id: 'local-credits',
        userId: 'active-user',
        balance: 100.0,
        totalConsumed: 0.0,
        updatedAt: Date.now()
      };
      StorageService.saveCreditsLocally(fallback);
      set({ userCredits: fallback });
      return fallback;
    }

    return local;
  },

  fetchCreditTransactions: async () => {
    const local = StorageService.loadCreditTransactionsLocally();
    if (local.length > 0) {
      set({ creditTransactions: local });
    }

    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch('/api/credits/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            StorageService.saveCreditTransactionsLocally(json.data);
            set({ creditTransactions: json.data });
            return json.data;
          }
        }
      } catch {
        // keep local
      }
    }
    return local;
  },

  topupCredits: async (amount: number, packageId?: string) => {
    const token = typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      try {
        const res = await fetch('/api/credits/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount, packageId })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            StorageService.saveCreditsLocally(json.data);
            set({ userCredits: json.data });
            await get().fetchCreditTransactions();
            return json.data;
          }
        }
      } catch {
        // fall through to local
      }
    }

    // Local simulation fallback
    const current = get().userCredits || {
      id: 'local-credits',
      userId: 'active-user',
      balance: 100.0,
      totalConsumed: 0.0,
      updatedAt: Date.now()
    };
    const updated: UserCredits = {
      ...current,
      balance: Math.round((current.balance + amount) * 100000) / 100000,
      updatedAt: Date.now()
    };
    StorageService.saveCreditsLocally(updated);

    const newTx: CreditTransaction = {
      id: `tx-local-${Date.now()}`,
      userId: current.userId,
      amount,
      type: 'TOPUP',
      description: packageId ? `Credit Refill (${packageId})` : `Credit Refill (+${amount} cr)`,
      balanceAfter: updated.balance,
      createdAt: Date.now()
    };
    const txs = [newTx, ...get().creditTransactions];
    StorageService.saveCreditTransactionsLocally(txs);

    set({ userCredits: updated, creditTransactions: txs });
    return updated;
  },

  resetCanvas: () => {
    const { autosaveTimer } = get();
    if (autosaveTimer) clearTimeout(autosaveTimer);
    set({
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      historyPast: [],
      historyFuture: [],
      clipboard: null,
      pendingIncompatibleConnection: null,
      inspectedConnectionId: null,
      validationResult: null,
      executionPlan: null,
      isExecutionPlanModalOpen: false,
      isExecuting: false,
      executionSummary: null,
      executionProgress: { total: 0, completed: 0, percent: 0 },
      abortController: null,
      saveStatus: 'saved',
      lastSavedAt: null,
      autosaveTimer: null,
      isHistoryDrawerOpen: false
    });
  }
}));

/**
 * Converts React Flow Canvas nodes & edges to a typed WorkflowDefinition.
 */
export function canvasToWorkflowDefinition(
  nodes: Node[],
  edges: Edge[],
  viewport: Viewport,
  groups: WorkflowGroup[] = []
): WorkflowDefinition {
  const workflowNodes: NodeDefinition[] = nodes.map((n) => {
    const data = (n.data || {}) as Record<string, unknown>;
    return {
      id: n.id,
      type: (data.type as string) || n.type || 'unknown',
      label: (data.label as string) || n.id,
      category: (data.category as any) || 'SOURCE',
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      inputs: (data.inputs as any) || [],
      outputs: (data.outputs as any) || [],
      config: (data.config as any) || {},
      state: (data.state as any) || 'IDLE',
      executionInfo: data.executionInfo as any
    };
  });

  const workflowConnections: ConnectionDefinition[] = edges.map((e) => {
    return {
      id: e.id,
      sourceNodeId: e.source,
      sourcePortId: e.sourceHandle || 'output',
      targetNodeId: e.target,
      targetPortId: e.targetHandle || 'input',
      state: ((e.data as any)?.state as any) || 'connected'
    };
  });

  return {
    id: 'active-canvas-workflow',
    name: 'Current Workspace Workflow',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewport,
    nodes: workflowNodes,
    connections: workflowConnections,
    groups
  };
}

/**
 * Converts a typed WorkflowDefinition back into React Flow nodes, edges, viewport, and groups.
 */
export function workflowDefinitionToCanvas(wf: WorkflowDefinition): {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  groups: WorkflowGroup[];
} {
  const nodes: Node[] = (wf.nodes || []).map((n) => ({
    id: n.id,
    type: 'unionNode',
    position: n.position || { x: 100, y: 100 },
    data: n as unknown as Record<string, unknown>
  }));

  const edges: Edge[] = (wf.connections || []).map((c) => ({
    id: c.id,
    source: c.sourceNodeId,
    sourceHandle: c.sourcePortId,
    target: c.targetNodeId,
    targetHandle: c.targetPortId,
    type: 'unionEdge',
    animated: true,
    data: {
      state: c.state || 'connected'
    }
  }));

  return {
    nodes,
    edges,
    viewport: wf.viewport || { x: 0, y: 0, zoom: 1 },
    groups: wf.groups || []
  };
}
