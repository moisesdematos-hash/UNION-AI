import { describe, it, expect, vi } from 'vitest';
import { WorkflowDefinition } from '../types/workflow.js';
import { WorkflowEngine } from '../engine/WorkflowEngine.js';
import { ExecutionEngine, NodeExecutionEvent } from '../engine/ExecutionEngine.js';
import { globalDataBus } from '../data-bus/DataBus.js';

describe('Shared ExecutionEngine — Real-Time Flow & DataBus Orchestration', () => {
  const sampleWorkflow: WorkflowDefinition = {
    id: 'wf-exec-1',
    name: 'End-to-End Content Engine',
    description: 'Pipeline completo de extração até copy final',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      {
        id: 'node-source',
        type: 'source-youtube',
        label: 'YouTube Video',
        category: 'SOURCE',
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: [
          { id: 'out-text', name: 'text', label: 'Transcript', type: 'TRANSCRIPT', isMulti: true, required: true }
        ],
        config: { url: 'https://youtube.com/watch?v=abc123xyz' },
        state: 'IDLE'
      },
      {
        id: 'node-writer',
        type: 'ai-writer',
        label: 'Retention Copywriter',
        category: 'AI',
        position: { x: 300, y: 0 },
        inputs: [
          { id: 'in-briefing', name: 'briefing', label: 'Briefing', type: 'TRANSCRIPT', isMulti: true, required: true }
        ],
        outputs: [
          { id: 'out-content', name: 'content', label: 'Copy Content', type: 'AI_RESPONSE', isMulti: true, required: true }
        ],
        config: { model: 'claude-3-7-sonnet', format: 'youtube-script' },
        state: 'IDLE'
      },
      {
        id: 'node-output',
        type: 'output-content',
        label: 'Final Asset Output',
        category: 'OUTPUT',
        position: { x: 600, y: 0 },
        inputs: [
          { id: 'in-data', name: 'data', label: 'Ready Content', type: 'AI_RESPONSE', isMulti: false, required: true }
        ],
        outputs: [],
        config: {},
        state: 'IDLE'
      }
    ],
    connections: [
      {
        id: 'conn-1',
        sourceNodeId: 'node-source',
        sourcePortId: 'out-text',
        targetNodeId: 'node-writer',
        targetPortId: 'in-briefing',
        state: 'connected'
      },
      {
        id: 'conn-2',
        sourceNodeId: 'node-writer',
        sourcePortId: 'out-content',
        targetNodeId: 'node-output',
        targetPortId: 'in-data',
        state: 'connected'
      }
    ]
  };

  it('should execute full workflow stage-by-stage and propagate DataPackets through DataBus', async () => {
    const plan = WorkflowEngine.generateExecutionPlan(sampleWorkflow, 'RUN');
    expect(plan.levels.length).toBe(3);

    const nodeEvents: NodeExecutionEvent[] = [];
    const summary = await ExecutionEngine.execute({
      workflow: sampleWorkflow,
      plan,
      onNodeEvent: (event) => nodeEvents.push(event)
    });

    expect(summary.status).toBe('COMPLETED');
    expect(summary.totalNodes).toBe(3);
    expect(summary.completedNodes).toBe(3);
    expect(summary.failedNodes).toBe(0);
    expect(summary.totalTokens).toBeGreaterThan(0);
    expect(summary.totalCostCredits).toBeGreaterThan(0);
    expect(summary.durationMs).toBeGreaterThanOrEqual(0);

    // Verify events sequence
    const completedNodeIds = nodeEvents
      .filter((e) => e.type === 'NODE_COMPLETED')
      .map((e) => e.nodeId);
    expect(completedNodeIds).toEqual(['node-source', 'node-writer', 'node-output']);

    // Verify packet propagation in DataBus
    const packetOnConn1 = globalDataBus.getPacket('conn-1');
    const packetOnConn2 = globalDataBus.getPacket('conn-2');

    expect(packetOnConn1).toBeDefined();
    expect(packetOnConn1?.type).toBe('TRANSCRIPT');
    expect(packetOnConn2).toBeDefined();
    expect(packetOnConn2?.type).toBe('AI_RESPONSE');
  });

  it('should execute parallel branch nodes concurrently', async () => {
    const parallelWorkflow: WorkflowDefinition = {
      id: 'wf-parallel',
      name: 'Parallel Analysis & Writing',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        {
          id: 'src',
          type: 'source-text',
          label: 'Input Source',
          category: 'SOURCE',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [{ id: 'out-t', name: 't', label: 'T', type: 'TEXT', isMulti: true, required: true }],
          config: { text: 'Mercado de IA' },
          state: 'IDLE'
        },
        {
          id: 'ai-a',
          type: 'ai-writer',
          label: 'Writer Node',
          category: 'AI',
          position: { x: 300, y: -100 },
          inputs: [{ id: 'in-a', name: 'a', label: 'A', type: 'TEXT', isMulti: true, required: true }],
          outputs: [{ id: 'out-a', name: 'resA', label: 'ResA', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        },
        {
          id: 'ai-b',
          type: 'ai-analyst',
          label: 'Analyst Node',
          category: 'AI',
          position: { x: 300, y: 100 },
          inputs: [{ id: 'in-b', name: 'b', label: 'B', type: 'TEXT', isMulti: true, required: true }],
          outputs: [{ id: 'out-b', name: 'resB', label: 'ResB', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        }
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'src', sourcePortId: 'out-t', targetNodeId: 'ai-a', targetPortId: 'in-a', state: 'connected' },
        { id: 'c2', sourceNodeId: 'src', sourcePortId: 'out-t', targetNodeId: 'ai-b', targetPortId: 'in-b', state: 'connected' }
      ]
    };

    const plan = WorkflowEngine.generateExecutionPlan(parallelWorkflow, 'RUN');
    expect(plan.levels.length).toBe(2);
    expect(plan.levels[1].length).toBe(2); // ai-a and ai-b in parallel

    const summary = await ExecutionEngine.execute({
      workflow: parallelWorkflow,
      plan
    });

    expect(summary.status).toBe('COMPLETED');
    expect(summary.completedNodes).toBe(3);
  });

  it('should cleanly abort midway when AbortSignal triggers STOP', async () => {
    const plan = WorkflowEngine.generateExecutionPlan(sampleWorkflow, 'RUN');
    const controller = new AbortController();

    // Abort after node-source finishes
    const summaryPromise = ExecutionEngine.execute({
      workflow: sampleWorkflow,
      plan,
      signal: controller.signal,
      onNodeEvent: (event) => {
        if (event.nodeId === 'node-source' && event.type === 'NODE_COMPLETED') {
          controller.abort();
        }
      }
    });

    const summary = await summaryPromise;
    expect(summary.status).toBe('STOPPED');
    expect(summary.completedNodes).toBeLessThan(3);
  });

  it('should execute only reachable subgraph in RUN_FROM_HERE mode', async () => {
    const plan = WorkflowEngine.generateExecutionPlan(sampleWorkflow, 'RUN_FROM_HERE', 'node-writer');
    expect(plan.mode).toBe('RUN_FROM_HERE');
    expect(plan.totalNodes).toBe(2); // only node-writer and node-output

    const summary = await ExecutionEngine.execute({
      workflow: sampleWorkflow,
      plan
    });

    expect(summary.status).toBe('COMPLETED');
    expect(summary.totalNodes).toBe(2);
    expect(summary.completedNodes).toBe(2);
  });

  it('should handle node failure and allow RETRY to resume', async () => {
    const plan = WorkflowEngine.generateExecutionPlan(sampleWorkflow, 'RUN');

    let failWriter = true;
    const customHandler = vi.fn(async (node, inputs, signal) => {
      if (node.id === 'node-writer' && failWriter) {
        throw new Error('API Rate Limit Exceeded');
      }
      return {
        outputs: {},
        tokens: 100,
        credits: 0.005,
        durationMs: 50
      };
    });

    const failedSummary = await ExecutionEngine.execute({
      workflow: sampleWorkflow,
      plan,
      handler: customHandler
    });

    expect(failedSummary.status).toBe('FAILED');
    expect(failedSummary.failedNodes).toBe(1);

    // Now RETRY with failure fixed
    failWriter = false;
    // Mark node-source as completed
    const retryWorkflow = {
      ...sampleWorkflow,
      nodes: sampleWorkflow.nodes.map((n) =>
        n.id === 'node-source' ? { ...n, state: 'COMPLETED' as const } : n
      )
    };
    const retryPlan = WorkflowEngine.generateExecutionPlan(retryWorkflow, 'RETRY');

    const retrySummary = await ExecutionEngine.execute({
      workflow: retryWorkflow,
      plan: retryPlan,
      handler: customHandler
    });

    expect(retrySummary.status).toBe('COMPLETED');
    expect(retrySummary.completedNodes).toBe(3);
  });
});
