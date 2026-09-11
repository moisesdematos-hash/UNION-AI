import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCanvasStore, workflowDefinitionToCanvas, canvasToWorkflowDefinition } from '../store/canvasStore.js';
import { StorageService } from '../services/storageService.js';
import { WorkflowDefinition, NodeDefinition } from '@union/shared';

describe('Gate 11: Storage, Persistence & Autosave Engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    useCanvasStore.getState().resetCanvas();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('StorageService should save and load workflow definitions to/from LocalStorage', () => {
    const testWf: WorkflowDefinition = {
      id: 'wf-test-123',
      name: 'E-commerce Launch Pipeline',
      version: 1,
      createdAt: 1000,
      updatedAt: 2000,
      viewport: { x: 50, y: 100, zoom: 1.2 },
      nodes: [
        {
          id: 'node-src-1',
          type: 'source-youtube',
          label: 'YT Source',
          category: 'SOURCE',
          position: { x: 100, y: 200 },
          inputs: [],
          outputs: [{ id: 'out-1', name: 'out', label: 'Out', type: 'TEXT', isMulti: true, required: true }],
          config: { url: 'https://youtube.com/watch?v=123' },
          state: 'IDLE'
        }
      ],
      connections: []
    };

    StorageService.saveToLocalStorage(testWf);

    const stored = StorageService.loadFromLocalStorage();
    expect(stored).not.toBeNull();
    expect(stored?.id).toBe('wf-test-123');
    expect(stored?.name).toBe('E-commerce Launch Pipeline');
    expect(stored?.nodes.length).toBe(1);
    expect(stored?.viewport.zoom).toBe(1.2);
  });

  it('workflowDefinitionToCanvas and canvasToWorkflowDefinition should be bidirectional', () => {
    const originalNode: NodeDefinition = {
      id: 'node-test-1',
      type: 'ai-writer',
      label: 'Script Writer',
      category: 'AI',
      position: { x: 300, y: 400 },
      inputs: [{ id: 'in-1', name: 'in', label: 'In', type: 'TEXT', isMulti: false, required: true }],
      outputs: [{ id: 'out-1', name: 'out', label: 'Out', type: 'AI_RESPONSE', isMulti: true, required: true }],
      config: { tone: 'persuasive' },
      state: 'IDLE'
    };

    const wf: WorkflowDefinition = {
      id: 'wf-bidirectional',
      name: 'Bidirectional Test',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewport: { x: 10, y: 20, zoom: 1.5 },
      nodes: [originalNode],
      connections: []
    };

    const canvas = workflowDefinitionToCanvas(wf);
    expect(canvas.nodes.length).toBe(1);
    expect(canvas.nodes[0].id).toBe('node-test-1');
    expect(canvas.viewport.zoom).toBe(1.5);

    const reconstructedWf = canvasToWorkflowDefinition(canvas.nodes, canvas.edges, canvas.viewport);
    expect(reconstructedWf.nodes.length).toBe(1);
    expect(reconstructedWf.nodes[0].id).toBe('node-test-1');
    expect(reconstructedWf.nodes[0].label).toBe('Script Writer');
    expect(reconstructedWf.viewport.zoom).toBe(1.5);
  });

  it('should trigger scheduleAutosave with debounce when nodes or edges are modified', async () => {
    expect(useCanvasStore.getState().saveStatus).toBe('saved');

    // Add node triggers autosave
    useCanvasStore.getState().addNode({
      id: 'node-auto-1',
      type: 'unionNode',
      position: { x: 10, y: 10 },
      data: { label: 'Node 1' }
    });

    // Save status immediately becomes 'unsaved'
    expect(useCanvasStore.getState().saveStatus).toBe('unsaved');

    // Fast-forward debounce timer (1200ms)
    await vi.advanceTimersByTimeAsync(1300);

    // After timer runs, saveWorkflow completes and status becomes 'saved'
    expect(useCanvasStore.getState().saveStatus).toBe('saved');
    expect(useCanvasStore.getState().lastSavedAt).toBeGreaterThan(0);

    // Check LocalStorage has persisted the node
    const persisted = StorageService.loadFromLocalStorage();
    expect(persisted).not.toBeNull();
    expect(persisted?.nodes.some((n) => n.id === 'node-auto-1')).toBe(true);
  });

  it('setWorkflowName should update title and trigger autosave', async () => {
    useCanvasStore.getState().setWorkflowName('Automated Ad Campaign');
    expect(useCanvasStore.getState().workflowName).toBe('Automated Ad Campaign');
    expect(useCanvasStore.getState().saveStatus).toBe('unsaved');

    await vi.advanceTimersByTimeAsync(1300);
    expect(useCanvasStore.getState().saveStatus).toBe('saved');

    const persisted = StorageService.loadFromLocalStorage();
    expect(persisted?.name).toBe('Automated Ad Campaign');
  });

  it('loadWorkflow and initFromLocalStorage should restore persisted session', () => {
    const cachedWf: WorkflowDefinition = {
      id: 'wf-restored',
      name: 'Restored Pipeline',
      version: 1,
      createdAt: 500,
      updatedAt: 1000,
      viewport: { x: 15, y: 25, zoom: 0.8 },
      nodes: [
        {
          id: 'restored-node-1',
          type: 'source-text',
          label: 'Briefing',
          category: 'SOURCE',
          position: { x: 50, y: 50 },
          inputs: [],
          outputs: [],
          config: {},
          state: 'IDLE'
        }
      ],
      connections: []
    };

    StorageService.saveToLocalStorage(cachedWf);

    const loaded = useCanvasStore.getState().initFromLocalStorage();
    expect(loaded).toBe(true);

    const state = useCanvasStore.getState();
    expect(state.workflowName).toBe('Restored Pipeline');
    expect(state.activeWorkflowId).toBe('wf-restored');
    expect(state.nodes.length).toBe(1);
    expect(state.nodes[0].id).toBe('restored-node-1');
    expect(state.viewport.zoom).toBe(0.8);
    expect(state.saveStatus).toBe('saved');
  });

  it('manual saveWorkflow should save immediately without waiting for debounce', async () => {
    useCanvasStore.getState().addNode({
      id: 'node-manual-save',
      position: { x: 0, y: 0 },
      data: { label: 'Manual' }
    });
    expect(useCanvasStore.getState().saveStatus).toBe('unsaved');

    await useCanvasStore.getState().saveWorkflow(true);
    expect(useCanvasStore.getState().saveStatus).toBe('saved');
    expect(useCanvasStore.getState().lastSavedAt).toBeGreaterThan(0);
  });
});
