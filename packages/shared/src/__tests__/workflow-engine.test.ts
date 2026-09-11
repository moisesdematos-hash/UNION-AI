import { describe, it, expect } from 'vitest';
import { WorkflowEngine, WorkflowDefinition } from '../index.js';

describe('WorkflowEngine — DAG, Validation & Execution Planning', () => {
  const baseWorkflow: WorkflowDefinition = {
    id: 'wf-test-1',
    name: 'Marketing Funnel Pipeline',
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    connections: []
  };

  it('should reject empty workflows with EMPTY_WORKFLOW error', () => {
    const res = WorkflowEngine.validate({ ...baseWorkflow, nodes: [] });
    expect(res.isValid).toBe(false);
    expect(res.errors[0].code).toBe('EMPTY_WORKFLOW');
  });

  it('should detect cycles and return CYCLE_DETECTED error with cycle path', () => {
    const cyclicWorkflow: WorkflowDefinition = {
      ...baseWorkflow,
      nodes: [
        {
          id: 'node-a',
          type: 'ai-chat',
          label: 'Node A',
          category: 'AI',
          position: { x: 0, y: 0 },
          inputs: [{ id: 'in', name: 'in', type: 'TEXT', isMulti: false, required: false }],
          outputs: [{ id: 'out', name: 'out', type: 'TEXT', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        },
        {
          id: 'node-b',
          type: 'ai-chat',
          label: 'Node B',
          category: 'AI',
          position: { x: 200, y: 0 },
          inputs: [{ id: 'in', name: 'in', type: 'TEXT', isMulti: false, required: false }],
          outputs: [{ id: 'out', name: 'out', type: 'TEXT', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        }
      ],
      connections: [
        {
          id: 'c1',
          sourceNodeId: 'node-a',
          sourcePortId: 'out',
          targetNodeId: 'node-b',
          targetPortId: 'in',
          status: 'connected'
        },
        {
          id: 'c2',
          sourceNodeId: 'node-b',
          sourcePortId: 'out',
          targetNodeId: 'node-a',
          targetPortId: 'in',
          status: 'connected'
        }
      ]
    };

    const res = WorkflowEngine.validate(cyclicWorkflow);
    expect(res.isValid).toBe(false);
    const cycleErr = res.errors.find((e) => e.code === 'CYCLE_DETECTED');
    expect(cycleErr).toBeDefined();
    expect(cycleErr?.message).toContain('Ciclo fechado');

    // Should throw if planning is attempted on cyclic graph
    expect(() => WorkflowEngine.generateExecutionPlan(cyclicWorkflow)).toThrow(/Ciclo fechado/);
  });

  it('should detect missing required input ports', () => {
    const invalidWorkflow: WorkflowDefinition = {
      ...baseWorkflow,
      nodes: [
        {
          id: 'node-extractor',
          type: 'extractor-transcript',
          label: 'Transcript Extractor',
          category: 'EXTRACTOR',
          position: { x: 0, y: 0 },
          inputs: [
            { id: 'in-media', name: 'media', type: 'VIDEO', isMulti: false, required: true }
          ],
          outputs: [{ id: 'out', name: 'out', type: 'TRANSCRIPT', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        }
      ],
      connections: []
    };

    const res = WorkflowEngine.validate(invalidWorkflow);
    expect(res.isValid).toBe(false);
    const inputErr = res.errors.find((e) => e.code === 'MISSING_REQUIRED_INPUT');
    expect(inputErr).toBeDefined();
    expect(inputErr?.portId).toBe('in-media');
  });

  it('should detect missing mandatory configurations', () => {
    const invalidWorkflow: WorkflowDefinition = {
      ...baseWorkflow,
      nodes: [
        {
          id: 'node-yt',
          type: 'source-youtube',
          label: 'YouTube Source',
          category: 'SOURCE',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [{ id: 'out', name: 'out', type: 'VIDEO', isMulti: true, required: true }],
          config: { url: 'invalid-link' },
          state: 'IDLE'
        }
      ],
      connections: []
    };

    const res = WorkflowEngine.validate(invalidWorkflow);
    expect(res.isValid).toBe(false);
    const configErr = res.errors.find((e) => e.code === 'MISSING_REQUIRED_CONFIG');
    expect(configErr).toBeDefined();
    expect(configErr?.message).toContain('requer uma URL válida do YouTube');
  });

  it('should detect incompatible connection data types', () => {
    const invalidWorkflow: WorkflowDefinition = {
      ...baseWorkflow,
      nodes: [
        {
          id: 'node-vid',
          type: 'source-youtube',
          label: 'YouTube Source',
          category: 'SOURCE',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [{ id: 'out-vid', name: 'video', type: 'VIDEO', isMulti: true, required: true }],
          config: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          state: 'IDLE'
        },
        {
          id: 'node-writer',
          type: 'ai-writer',
          label: 'AI Content Writer',
          category: 'AI',
          position: { x: 300, y: 0 },
          inputs: [{ id: 'in-briefing', name: 'briefing', type: 'TEXT', isMulti: true, required: false }],
          outputs: [{ id: 'out-content', name: 'content', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: { format: 'youtube-script' },
          state: 'IDLE'
        }
      ],
      connections: [
        {
          id: 'conn-incompat',
          sourceNodeId: 'node-vid',
          sourcePortId: 'out-vid',
          targetNodeId: 'node-writer',
          targetPortId: 'in-briefing',
          status: 'connected'
        }
      ]
    };

    const res = WorkflowEngine.validate(invalidWorkflow);
    expect(res.isValid).toBe(false);
    const compatErr = res.errors.find((e) => e.code === 'INCOMPATIBLE_CONNECTION_TYPE');
    expect(compatErr).toBeDefined();
  });

  it('should generate valid multi-level execution plan with parallel batches for DAG', () => {
    // Pipeline:
    // Source 1 (YouTube) ───┐
    //                        ├──> AI Analyst ──> AI Writer
    // Source 2 (Website) ───┘
    const validDagWorkflow: WorkflowDefinition = {
      ...baseWorkflow,
      nodes: [
        {
          id: 'src-yt',
          type: 'source-youtube',
          label: 'YouTube Source',
          category: 'SOURCE',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [{ id: 'out-trans', name: 'transcript', type: 'TRANSCRIPT', isMulti: true, required: true }],
          config: { url: 'https://youtube.com/watch?v=test' },
          state: 'IDLE'
        },
        {
          id: 'src-web',
          type: 'source-website',
          label: 'Website Source',
          category: 'SOURCE',
          position: { x: 0, y: 200 },
          inputs: [],
          outputs: [{ id: 'out-text', name: 'text', type: 'TEXT', isMulti: true, required: true }],
          config: { url: 'https://example.com/marketing' },
          state: 'IDLE'
        },
        {
          id: 'ai-analyst',
          type: 'ai-analyst',
          label: 'AI Analyst',
          category: 'AI',
          position: { x: 300, y: 100 },
          inputs: [
            { id: 'in-sources', name: 'sources', type: 'TRANSCRIPT', isMulti: true, required: false }
          ],
          outputs: [{ id: 'out-res', name: 'analysis', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        },
        {
          id: 'ai-writer',
          type: 'ai-writer',
          label: 'AI Writer',
          category: 'AI',
          position: { x: 600, y: 100 },
          inputs: [{ id: 'in-briefing', name: 'briefing', type: 'AI_RESPONSE', isMulti: false, required: false }],
          outputs: [{ id: 'out-pack', name: 'content', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: { format: 'youtube-script' },
          state: 'IDLE'
        }
      ],
      connections: [
        {
          id: 'c1',
          sourceNodeId: 'src-yt',
          sourcePortId: 'out-trans',
          targetNodeId: 'ai-analyst',
          targetPortId: 'in-sources',
          status: 'connected'
        },
        {
          id: 'c2',
          sourceNodeId: 'ai-analyst',
          sourcePortId: 'out-res',
          targetNodeId: 'ai-writer',
          targetPortId: 'in-briefing',
          status: 'connected'
        }
      ]
    };

    const validation = WorkflowEngine.validate(validDagWorkflow);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);

    const plan = WorkflowEngine.generateExecutionPlan(validDagWorkflow, 'RUN');
    expect(plan.workflowId).toBe(validDagWorkflow.id);
    expect(plan.totalNodes).toBe(4);

    // Levels check:
    // Level 0 must contain independent sources ('src-yt', 'src-web')
    expect(plan.levels[0]).toContain('src-yt');
    expect(plan.levels[0]).toContain('src-web');

    // Level 1 must contain 'ai-analyst'
    expect(plan.levels[1]).toEqual(['ai-analyst']);

    // Level 2 must contain 'ai-writer'
    expect(plan.levels[2]).toEqual(['ai-writer']);

    // Total levels = 3
    expect(plan.levels.length).toBe(3);
    expect(plan.executionOrder.length).toBe(4);
  });

  it('should extract downstream subgraph for RUN_FROM_HERE mode', () => {
    // Pipeline: Source -> Extractor -> AI Analyst -> AI Writer
    const pipelineWorkflow: WorkflowDefinition = {
      ...baseWorkflow,
      nodes: [
        {
          id: 'n1',
          type: 'source-youtube',
          label: 'YT',
          category: 'SOURCE',
          position: { x: 0, y: 0 },
          inputs: [],
          outputs: [{ id: 'out', name: 'video', type: 'VIDEO', isMulti: true, required: true }],
          config: { url: 'https://youtube.com/watch?v=1' },
          state: 'IDLE'
        },
        {
          id: 'n2',
          type: 'extractor-transcript',
          label: 'Extractor',
          category: 'EXTRACTOR',
          position: { x: 200, y: 0 },
          inputs: [{ id: 'in', name: 'in', type: 'VIDEO', isMulti: false, required: true }],
          outputs: [{ id: 'out', name: 'transcript', type: 'TRANSCRIPT', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        },
        {
          id: 'n3',
          type: 'ai-analyst',
          label: 'Analyst',
          category: 'AI',
          position: { x: 400, y: 0 },
          inputs: [{ id: 'in', name: 'in', type: 'TRANSCRIPT', isMulti: true, required: true }],
          outputs: [{ id: 'out', name: 'out', type: 'AI_RESPONSE', isMulti: true, required: true }],
          config: {},
          state: 'IDLE'
        }
      ],
      connections: [
        { id: 'c1', sourceNodeId: 'n1', sourcePortId: 'out', targetNodeId: 'n2', targetPortId: 'in', status: 'connected' },
        { id: 'c2', sourceNodeId: 'n2', sourcePortId: 'out', targetNodeId: 'n3', targetPortId: 'in', status: 'connected' }
      ]
    };

    // Run only from 'n2' downwards (n2 and n3)
    const partialPlan = WorkflowEngine.generateExecutionPlan(pipelineWorkflow, 'RUN_FROM_HERE', 'n2');
    expect(partialPlan.mode).toBe('RUN_FROM_HERE');
    expect(partialPlan.targetNodeId).toBe('n2');
    expect(partialPlan.totalNodes).toBe(2);
    expect(partialPlan.executionOrder).toEqual(['n2', 'n3']);
    expect(partialPlan.levels[0]).toEqual(['n2']);
    expect(partialPlan.levels[1]).toEqual(['n3']);
  });
});
