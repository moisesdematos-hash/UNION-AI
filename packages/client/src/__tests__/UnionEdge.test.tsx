import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider, Position } from '@xyflow/react';
import { UnionEdge } from '../components/edges/UnionEdge.js';
import { useCanvasStore } from '../store/canvasStore.js';
import { NodeDefinition } from '@union/shared';
import { UnionNode } from '../components/nodes/UnionNode.js';

describe('UnionEdge Component', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
  });

  const renderUnionEdge = (edgeData = {}, edgeProps = {}) => {
    return render(
      <ReactFlowProvider>
        <svg>
          <UnionEdge
            id="edge-1"
            source="node-1"
            target="node-2"
            sourceX={50}
            sourceY={50}
            targetX={250}
            targetY={150}
            sourcePosition={Position.Right}
            targetPosition={Position.Left}
            data={edgeData}
            {...edgeProps}
          />
        </svg>
      </ReactFlowProvider>
    );
  };

  it('renders SVG Bezier path with DataType label', () => {
    renderUnionEdge({ dataType: 'TRANSCRIPT', state: 'connected' });

    expect(screen.getByText('TRANSCRIPT')).toBeInTheDocument();
  });

  it('renders processing, active, waiting and error states correctly', () => {
    const { rerender } = renderUnionEdge({ dataType: 'AI_RESPONSE', state: 'processing' });
    expect(screen.getByText('AI_RESPONSE')).toBeInTheDocument();

    rerender(
      <ReactFlowProvider>
        <svg>
          <UnionEdge
            id="edge-1"
            source="node-1"
            target="node-2"
            sourceX={50}
            sourceY={50}
            targetX={250}
            targetY={150}
            sourcePosition={Position.Right}
            targetPosition={Position.Left}
            data={{ dataType: 'TEXT', state: 'error' }}
          />
        </svg>
      </ReactFlowProvider>
    );
    expect(screen.getByText('TEXT')).toBeInTheDocument();
  });

  it('deletes connection when delete button is clicked on selected edge', () => {
    useCanvasStore.getState().setEdges([
      { id: 'edge-to-delete', source: 'node-1', target: 'node-2', type: 'unionEdge' }
    ]);

    render(
      <ReactFlowProvider>
        <svg>
          <UnionEdge
            id="edge-to-delete"
            source="node-1"
            target="node-2"
            sourceX={50}
            sourceY={50}
            targetX={250}
            targetY={150}
            sourcePosition={Position.Right}
            targetPosition={Position.Left}
            selected={true}
            data={{ dataType: 'URL' }}
          />
        </svg>
      </ReactFlowProvider>
    );

    const deleteBtn = screen.getByTitle('Delete Connection');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);

    expect(useCanvasStore.getState().edges.length).toBe(0);
  });

  it('displays dynamic multi-input connection counter on target node', () => {
    const multiInputNode: NodeDefinition = {
      id: 'node-ai-analyst',
      type: 'ai-analyst',
      label: 'AI Market Analyst',
      category: 'AI',
      position: { x: 300, y: 100 },
      inputs: [
        { id: 'in-sources', name: 'sources', label: 'Data Sources', type: 'TRANSCRIPT', isMulti: true, required: true }
      ],
      outputs: [
        { id: 'out-analysis', name: 'analysis', label: 'Analysis Report', type: 'AI_RESPONSE', isMulti: true, required: true }
      ],
      config: {},
      state: 'IDLE'
    };

    // 2 incoming connections targeting the multi-input port
    useCanvasStore.getState().setEdges([
      { id: 'edge-1', source: 'source-1', sourceHandle: 'out-transcript', target: 'node-ai-analyst', targetHandle: 'in-sources' },
      { id: 'edge-2', source: 'source-2', sourceHandle: 'out-transcript', target: 'node-ai-analyst', targetHandle: 'in-sources' }
    ]);

    render(
      <ReactFlowProvider>
        <UnionNode
          id={multiInputNode.id}
          data={multiInputNode as unknown as Record<string, unknown>}
          selected={false}
          type="unionNode"
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={300}
          positionAbsoluteY={100}
          dragging={false}
          deletable={true}
          selectable={true}
          draggable={true}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('2 INPUTS CONNECTED')).toBeInTheDocument();
  });

  it('enforces single-input rule by replacing existing edge on non-multi port in onConnect', () => {
    const singleInputNode = {
      id: 'node-target',
      type: 'unionNode',
      position: { x: 300, y: 100 },
      data: {
        inputs: [{ id: 'in-single', name: 'single', label: 'Single Target', type: 'URL', isMulti: false, required: true }],
        outputs: []
      }
    };

    const sourceNode1 = {
      id: 'node-src-1',
      type: 'unionNode',
      position: { x: 50, y: 50 },
      data: {
        inputs: [],
        outputs: [{ id: 'out-1', name: 'url', label: 'URL Out', type: 'URL', isMulti: true, required: true }]
      }
    };

    const sourceNode2 = {
      id: 'node-src-2',
      type: 'unionNode',
      position: { x: 50, y: 150 },
      data: {
        inputs: [],
        outputs: [{ id: 'out-2', name: 'url', label: 'URL Out', type: 'URL', isMulti: true, required: true }]
      }
    };

    useCanvasStore.getState().setNodes([singleInputNode, sourceNode1, sourceNode2]);

    // Connect source 1 to target
    useCanvasStore.getState().onConnect({
      source: 'node-src-1',
      sourceHandle: 'out-1',
      target: 'node-target',
      targetHandle: 'in-single'
    });

    expect(useCanvasStore.getState().edges.length).toBe(1);
    expect(useCanvasStore.getState().edges[0].source).toBe('node-src-1');

    // Connect source 2 to same target (should replace since isMulti is false)
    useCanvasStore.getState().onConnect({
      source: 'node-src-2',
      sourceHandle: 'out-2',
      target: 'node-target',
      targetHandle: 'in-single'
    });

    expect(useCanvasStore.getState().edges.length).toBe(1);
    expect(useCanvasStore.getState().edges[0].source).toBe('node-src-2');
  });
});
