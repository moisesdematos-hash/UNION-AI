import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store/canvasStore.js';
import { StorageService } from '../services/storageService.js';
import { WorkflowRun, WorkflowVersion, WorkflowExecutionSummary } from '@union/shared';

describe('Gate 12: Execution History & Workflow Versioning Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    useCanvasStore.getState().resetCanvas();
  });

  it('StorageService should save and load runs and versions locally', () => {
    const mockRun: WorkflowRun = {
      id: 'run-local-1',
      workflowId: 'wf-test-1',
      userId: 'user-1',
      status: 'COMPLETED',
      mode: 'RUN',
      totalNodes: 3,
      completedNodes: 3,
      failedNodes: 0,
      totalTokens: 1450,
      totalCostCredits: 0.029,
      durationMs: 1240,
      summary: {},
      createdAt: Date.now() - 1240,
      completedAt: Date.now()
    };

    StorageService.saveRunLocally(mockRun);
    const loadedRuns = StorageService.loadRunsLocally('wf-test-1');
    expect(loadedRuns).toHaveLength(1);
    expect(loadedRuns[0].id).toBe('run-local-1');
    expect(loadedRuns[0].status).toBe('COMPLETED');
    expect(loadedRuns[0].totalTokens).toBe(1450);

    const mockVersion: WorkflowVersion = {
      id: 'ver-local-1',
      workflowId: 'wf-test-1',
      versionNumber: 1,
      name: 'Initial Working Draft',
      snapshot: {
        id: 'wf-test-1',
        name: 'My Workflow',
        version: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        viewport: { x: 0, y: 0, zoom: 1 },
        nodes: [],
        connections: []
      },
      createdAt: Date.now()
    };

    StorageService.saveVersionLocally(mockVersion);
    const loadedVersions = StorageService.loadVersionsLocally('wf-test-1');
    expect(loadedVersions).toHaveLength(1);
    expect(loadedVersions[0].versionNumber).toBe(1);
    expect(loadedVersions[0].name).toBe('Initial Working Draft');
  });

  it('useCanvasStore should toggle history drawer', () => {
    const store = useCanvasStore.getState();
    expect(store.isHistoryDrawerOpen).toBe(false);

    store.openHistoryDrawer();
    expect(useCanvasStore.getState().isHistoryDrawerOpen).toBe(true);

    store.closeHistoryDrawer();
    expect(useCanvasStore.getState().isHistoryDrawerOpen).toBe(false);
  });

  it('useCanvasStore should record execution run and add to history', async () => {
    const store = useCanvasStore.getState();
    
    // Seed initial nodes
    store.addNode({
      id: 'node-1',
      type: 'unionNode',
      position: { x: 100, y: 100 },
      data: {
        id: 'node-1',
        type: 'source-youtube',
        label: 'YouTube Source',
        category: 'SOURCE',
        inputs: [],
        outputs: [{ id: 'out-1', name: 'out', label: 'Output', type: 'TEXT', isMulti: true, required: true }],
        config: { url: 'https://youtube.com/watch?v=abc' },
        state: 'IDLE'
      }
    });

    const summary: WorkflowExecutionSummary = {
      status: 'COMPLETED',
      totalNodes: 1,
      completedNodes: 1,
      failedNodes: 0,
      totalTokens: 500,
      totalCostCredits: 0.01,
      startTime: Date.now() - 850,
      endTime: Date.now(),
      durationMs: 850,
      mode: 'RUN'
    };

    const recorded = await store.recordExecutionRun(summary);
    expect(recorded).not.toBeNull();
    expect(recorded?.status).toBe('COMPLETED');

    const updated = useCanvasStore.getState();
    expect(updated.runsHistory.length).toBeGreaterThanOrEqual(1);
    const latestRun = updated.runsHistory[0];
    expect(latestRun.status).toBe('COMPLETED');
    expect(latestRun.mode).toBe('RUN');
    expect(latestRun.durationMs).toBe(850);
  });

  it('useCanvasStore should create snapshot version and rollback to it', async () => {
    const store = useCanvasStore.getState();

    // 1. Setup Canvas state V1
    store.setWorkflowName('Version 1 Pipeline');
    store.addNode({
      id: 'node-v1',
      type: 'unionNode',
      position: { x: 50, y: 50 },
      data: {
        id: 'node-v1',
        type: 'source-youtube',
        label: 'Original V1 Source',
        category: 'SOURCE',
        inputs: [],
        outputs: [{ id: 'out-1', name: 'out', label: 'Output', type: 'TEXT', isMulti: true, required: true }],
        config: {},
        state: 'IDLE'
      }
    });

    // 2. Snapshot V1
    const v1 = await store.createVersionSnapshot('Checkpoint V1 Stable');
    expect(v1).not.toBeNull();
    expect(v1?.versionNumber).toBe(1);
    expect(v1?.name).toBe('Checkpoint V1 Stable');

    // 3. Mutate canvas to V2 (add node, change name)
    store.setWorkflowName('Version 2 Pipeline Disruptive');
    store.addNode({
      id: 'node-v2',
      type: 'unionNode',
      position: { x: 300, y: 300 },
      data: {
        id: 'node-v2',
        type: 'ai-writer',
        label: 'Disruptive Writer',
        category: 'AI',
        inputs: [],
        outputs: [],
        config: {},
        state: 'IDLE'
      }
    });

    expect(useCanvasStore.getState().nodes).toHaveLength(2);
    expect(useCanvasStore.getState().workflowName).toBe('Version 2 Pipeline Disruptive');

    // 4. Rollback to V1
    await store.rollbackToVersion(v1!.id);

    const reverted = useCanvasStore.getState();
    expect(reverted.workflowName).toBe('Version 1 Pipeline');
    expect(reverted.nodes).toHaveLength(1);
    expect(reverted.nodes[0].id).toBe('node-v1');
    expect((reverted.nodes[0].data as any).label).toBe('Original V1 Source');
  });
});
