import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
  useStore
} from '@xyflow/react';
import { X, Activity, AlertCircle, Clock, CheckCircle2, Eye } from 'lucide-react';
import { ConnectionState, DataType } from '@union/shared';
import { getDataTypeStyle } from '../../utils/portColors.js';
import { useCanvasStore } from '../../store/canvasStore.js';

export interface UnionEdgeData {
  dataType?: DataType;
  state?: ConnectionState;
  errorMessage?: string;
  tokens?: number;
  dataPreview?: unknown;
}

export function UnionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setEdges, edges, recordHistory, openDataInspector } = useCanvasStore();

  const edgeData = (data || {}) as UnionEdgeData;
  const connectionState: ConnectionState = edgeData.state || 'connected';
  const dataType: DataType = edgeData.dataType || 'TEXT';

  const typeStyle = getDataTypeStyle(dataType);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordHistory();
    setEdges(edges.filter((edge) => edge.id !== id));
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    openDataInspector(id);
  };

  // Determine if React Flow has initialized the DOM portal container
  const hasLabelRenderer = useStore(
    (s) => Boolean(s.domNode?.querySelector('.react-flow__edgelabel-renderer'))
  );

  // Determine stroke and animation styles based on connection state
  let strokeColor = typeStyle.color;
  let strokeDasharray = 'none';
  let animationClass = '';

  switch (connectionState) {
    case 'processing':
      strokeDasharray = '5 5';
      animationClass = 'animate-[dash_1s_linear_infinite]';
      break;
    case 'active':
      strokeColor = '#6366f1'; // electric indigo glow
      break;
    case 'waiting':
      strokeColor = '#64748b'; // muted slate
      strokeDasharray = '4 4';
      break;
    case 'error':
      strokeColor = '#ef4444'; // rose red
      break;
    case 'connected':
    default:
      break;
  }

  const labelContent = (
    <div
      style={{
        transform: hasLabelRenderer
          ? `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`
          : undefined,
        pointerEvents: 'all'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute z-10 flex items-center gap-1.5"
    >
      <div
        onClick={handleInspect}
        title="Inspect Connection Data Packet"
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-lg backdrop-blur text-[10px] font-mono transition-all duration-200 cursor-pointer ${
          selected || isHovered
            ? 'bg-union-card border-union-borderHover scale-105 shadow-union-accent/20'
            : 'bg-union-surface/90 border-union-border'
        }`}
      >
        {/* State Icon */}
        {connectionState === 'processing' && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
        )}
        {connectionState === 'active' && (
          <Activity className="h-2.5 w-2.5 text-union-accent animate-pulse" />
        )}
        {connectionState === 'waiting' && (
          <Clock className="h-2.5 w-2.5 text-slate-400" />
        )}
        {connectionState === 'error' && (
          <AlertCircle className="h-2.5 w-2.5 text-rose-400" />
        )}
        {connectionState === 'connected' && (
          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
        )}

        {/* Type Indicator */}
        <span style={{ color: typeStyle.color }} className="font-semibold">
          {dataType}
        </span>

        {/* Quick Inspect & Delete buttons when hovered or selected */}
        {(isHovered || selected) && (
          <div className="flex items-center gap-0.5 ml-0.5">
            <button
              onClick={handleInspect}
              title="Inspect Data Packet"
              className="p-0.5 rounded hover:bg-union-accent/20 text-union-muted hover:text-union-accent transition-colors"
            >
              <Eye className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Connection"
              className="p-0.5 rounded hover:bg-rose-500/20 text-union-muted hover:text-rose-400 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Invisible thick path for hover and interaction area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleInspect}
      />

      {/* 2. Glow effect if selected or active */}
      {(selected || connectionState === 'active' || isHovered) && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeOpacity={0.25}
          className="pointer-events-none transition-all duration-300"
        />
      )}

      {/* 3. Base rendered SVG Bezier Curve */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected || isHovered ? 2.5 : 2,
          strokeDasharray,
          transition: 'stroke 0.2s, stroke-width 0.2s'
        }}
        className={`pointer-events-none ${animationClass}`}
      />

      {/* 4. Interactive Centered Badge */}
      {hasLabelRenderer ? (
        <EdgeLabelRenderer>{labelContent}</EdgeLabelRenderer>
      ) : (
        <foreignObject
          x={labelX - 100}
          y={labelY - 20}
          width={200}
          height={40}
          className="overflow-visible pointer-events-none"
        >
          {labelContent}
        </foreignObject>
      )}
    </>
  );
}
export default UnionEdge;
