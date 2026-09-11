import { useEffect, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  SelectionMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '../../store/canvasStore.js';
import { CanvasControls } from './CanvasControls.js';
import { UnionNode } from '../nodes/UnionNode.js';
import { UnionEdge } from '../edges/UnionEdge.js';

const nodeTypes = {
  unionNode: UnionNode,
  default: UnionNode
};

const edgeTypes = {
  unionEdge: UnionEdge,
  default: UnionEdge
};

function CanvasInternal() {
  const {
    nodes,
    edges,
    isGridVisible,
    isSnappingEnabled,
    onNodesChange,
    onEdgesChange,
    onConnect,
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteSelected,
    setViewport
  } = useCanvasStore();

  const { getViewport } = useReactFlow();

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (isModifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (isModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (isModifier && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
      } else if (isModifier && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteSelected();
      } else if (isModifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
    },
    [undo, redo, copySelected, pasteSelected, duplicateSelected, deleteSelected]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-union-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'unionEdge' }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={() => setViewport(getViewport())}
        snapToGrid={isSnappingEnabled}
        snapGrid={[16, 16]}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
        selectionOnDrag
        panOnScroll
        panOnDrag={[1, 2]} // Middle click or right click or space+left click
        selectionMode={SelectionMode.Partial}
        className="touch-none"
      >
        {isGridVisible && (
          <Background
            id="union-dots-grid"
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1.5}
            color="#222836"
            className="bg-union-bg"
          />
        )}

        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bottom-6 !right-6 !bg-union-surface/90 !border !border-union-border !rounded-2xl !overflow-hidden !shadow-2xl backdrop-blur"
          nodeColor={() => '#6366f1'}
          maskColor="rgba(10, 11, 14, 0.75)"
        />

        <CanvasControls />
      </ReactFlow>
    </div>
  );
}

export function UnionCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInternal />
    </ReactFlowProvider>
  );
}
export default UnionCanvas;
