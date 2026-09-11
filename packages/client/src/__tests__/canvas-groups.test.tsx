import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore, canvasToWorkflowDefinition, workflowDefinitionToCanvas } from '../store/canvasStore.js';
import { NODE_TEMPLATES, createNodeFromTemplate } from '../components/nodes/nodeRegistry.js';
import { Node, Edge } from '@xyflow/react';

describe('UNION.AI 2.0: Canvas Groups & New Node Templates', () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      groups: [],
      activeWorkflowId: 'test-wf-2',
      workflowName: 'Test 2.0 Pipeline'
    });
  });

  describe('Node Registry Expansion', () => {
    it('should register extractor-pdf with Document & Text outputs', () => {
      const template = NODE_TEMPLATES['extractor-pdf'];
      expect(template).toBeDefined();
      expect(template.category).toBe('EXTRACTOR');
      expect(template.outputs.some(o => o.type === 'DOCUMENT')).toBe(true);
      expect(template.outputs.some(o => o.type === 'TEXT')).toBe(true);

      const node = createNodeFromTemplate('extractor-pdf');
      expect(node.type).toBe('extractor-pdf');
      expect(node.inputs).toBeDefined();
    });

    it('should register marketing-sales-page with 14-block outputs', () => {
      const template = NODE_TEMPLATES['marketing-sales-page'];
      expect(template).toBeDefined();
      expect(template.category).toBe('AI');
      expect(template.outputs.some(o => o.id === 'out-copy')).toBe(true);
      expect(template.outputs.some(o => o.id === 'out-json')).toBe(true);

      const node = createNodeFromTemplate('marketing-sales-page');
      expect(node.type).toBe('marketing-sales-page');
      expect(node.config.productName).toBeDefined();
    });

    it('should register output-export node destination', () => {
      const template = NODE_TEMPLATES['output-export'];
      expect(template).toBeDefined();
      expect(template.category).toBe('OUTPUT');

      const node = createNodeFromTemplate('output-export');
      expect(node.type).toBe('output-export');
    });
  });

  describe('Workflow Groups State & Serialization', () => {
    it('should create, update, toggle collapse, and delete a visual group', () => {
      const store = useCanvasStore.getState();

      store.createGroup('Copywriting Engine', ['node-1', 'node-2'], '#10b981');
      let currentGroups = useCanvasStore.getState().groups;
      expect(currentGroups).toHaveLength(1);
      expect(currentGroups[0].name).toBe('Copywriting Engine');
      expect(currentGroups[0].color).toBe('#10b981');
      expect(currentGroups[0].nodeIds).toEqual(['node-1', 'node-2']);
      expect(currentGroups[0].isCollapsed).toBe(false);

      const groupId = currentGroups[0].id;

      // Toggle collapse
      useCanvasStore.getState().toggleGroupCollapse(groupId);
      expect(useCanvasStore.getState().groups[0].isCollapsed).toBe(true);

      // Update group
      useCanvasStore.getState().updateGroup(groupId, { name: 'Refined Engine' });
      expect(useCanvasStore.getState().groups[0].name).toBe('Refined Engine');

      // Delete group
      useCanvasStore.getState().deleteGroup(groupId);
      expect(useCanvasStore.getState().groups).toHaveLength(0);
    });

    it('should serialize groups in canvasToWorkflowDefinition and restore them in workflowDefinitionToCanvas', () => {
      const dummyNodes: Node[] = [
        { id: 'node-1', position: { x: 50, y: 50 }, data: { label: 'Node 1', type: 'source-text' } }
      ];
      const dummyEdges: Edge[] = [];
      const dummyViewport = { x: 0, y: 0, zoom: 1 };
      const groups = [
        { id: 'grp-1', name: 'Funnel Step 1', color: '#6366f1', nodeIds: ['node-1'], isCollapsed: false }
      ];

      const wfDef = canvasToWorkflowDefinition(dummyNodes, dummyEdges, dummyViewport, groups);
      expect(wfDef.groups).toHaveLength(1);
      expect(wfDef.groups?.[0].name).toBe('Funnel Step 1');

      const restored = workflowDefinitionToCanvas(wfDef);
      expect(restored.groups).toHaveLength(1);
      expect(restored.groups[0].id).toBe('grp-1');
      expect(restored.groups[0].nodeIds).toContain('node-1');
    });
  });
});
