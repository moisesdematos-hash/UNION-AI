import { useState, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { 
  GripVertical,
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Grid3X3, 
  Magnet, 
  Undo2, 
  Redo2, 
  Trash2, 
  Copy,
  Eraser
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';

const STORAGE_KEY = 'union_canvas_controls_pos';

export function CanvasControls() {
  const { zoomIn, zoomOut, fitView, setCenter, getZoom } = useReactFlow();
  const {
    isGridVisible,
    isSnappingEnabled,
    historyPast,
    historyFuture,
    toggleGrid,
    toggleSnapping,
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    resetCanvas
  } = useCanvasStore();

  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startLeft: number;
    startTop: number;
    parentWidth: number;
    parentHeight: number;
    elemWidth: number;
    elemHeight: number;
  } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;

    // Ignore clicks on buttons or inside buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const elem = containerRef.current;
    if (!elem) return;

    e.stopPropagation();

    const parent = (elem.offsetParent as HTMLElement) || elem.parentElement || document.body;
    const parentRect = parent.getBoundingClientRect();
    const elemRect = elem.getBoundingClientRect();

    const currentLeft = elemRect.left - parentRect.left;
    const currentTop = elemRect.top - parentRect.top;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startLeft: currentLeft,
      startTop: currentTop,
      parentWidth: parentRect.width,
      parentHeight: parentRect.height,
      elemWidth: elemRect.width,
      elemHeight: elemRect.height
    };

    setIsDragging(true);

    if (elem.setPointerCapture) {
      try {
        elem.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    e.stopPropagation();

    const { pointerX, pointerY, startLeft, startTop, parentWidth, parentHeight, elemWidth, elemHeight } = dragStartRef.current;
    const deltaX = e.clientX - pointerX;
    const deltaY = e.clientY - pointerY;

    let nextX = startLeft + deltaX;
    let nextY = startTop + deltaY;

    const padding = 12;
    const maxX = Math.max(padding, parentWidth - elemWidth - padding);
    const maxY = Math.max(padding, parentHeight - elemHeight - padding);

    nextX = Math.max(padding, Math.min(nextX, maxX));
    nextY = Math.max(padding, Math.min(nextY, maxY));

    const newPos = { x: Math.round(nextX), y: Math.round(nextY) };
    lastPosRef.current = newPos;
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);

    const elem = containerRef.current;
    if (elem && elem.releasePointerCapture) {
      try {
        elem.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }

    if (lastPosRef.current) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lastPosRef.current));
      } catch {
        // ignore
      }
    }
    dragStartRef.current = null;
  };

  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(null);
    lastPosRef.current = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Adjust on window resize so it doesn't get clipped outside the viewport
  useEffect(() => {
    const handleResize = () => {
      if (!position || !containerRef.current) return;
      const elem = containerRef.current;
      const parent = (elem.offsetParent as HTMLElement) || elem.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const elemRect = elem.getBoundingClientRect();
      const padding = 12;
      const maxX = Math.max(padding, parentRect.width - elemRect.width - padding);
      const maxY = Math.max(padding, parentRect.height - elemRect.height - padding);

      if (position.x > maxX || position.y > maxY) {
        const clamped = {
          x: Math.max(padding, Math.min(position.x, maxX)),
          y: Math.max(padding, Math.min(position.y, maxY))
        };
        setPosition(clamped);
        lastPosRef.current = clamped;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  const handleCenter = () => {
    setCenter(0, 0, { duration: 400 });
  };

  const currentZoomPercent = Math.round((getZoom() || 1) * 100);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={
        position
          ? { left: `${position.x}px`, top: `${position.y}px` }
          : undefined
      }
      className={`absolute z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-union-surface/90 border border-union-border shadow-2xl backdrop-blur select-none nodrag nowheel touch-none ${
        position ? '' : 'bottom-6 left-1/2 -translate-x-1/2'
      } ${
        isDragging
          ? 'ring-2 ring-union-accent/50 shadow-indigo-500/30 cursor-grabbing'
          : 'cursor-default transition-shadow'
      }`}
    >
      {/* Drag Handle */}
      <div
        onDoubleClick={handleResetPosition}
        title="Arrastar barra de ferramentas (Duplo-clique para centrar)"
        className="flex items-center justify-center pl-1 pr-0.5 py-1 text-union-muted hover:text-white cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 pr-1.5 border-r border-union-border">
        <button
          onClick={undo}
          disabled={historyPast.length === 0}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-union-muted transition-colors"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={historyFuture.length === 0}
          title="Redo (Ctrl+Y)"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-union-muted transition-colors"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 px-1.5 border-r border-union-border">
        <button
          onClick={() => zoomOut({ duration: 200 })}
          title="Zoom Out"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card transition-colors"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="font-mono text-[11px] text-union-muted px-2 min-w-[44px] text-center">
          {currentZoomPercent}%
        </span>
        <button
          onClick={() => zoomIn({ duration: 200 })}
          title="Zoom In"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card transition-colors"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Viewport Alignment */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-union-border">
        <button
          onClick={() => fitView({ duration: 400, padding: 0.2 })}
          title="Fit Screen"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={handleCenter}
          title="Center View"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card transition-colors"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* Grid & Snapping */}
      <div className="flex items-center gap-0.5 px-1.5 border-r border-union-border">
        <button
          onClick={toggleGrid}
          title={isGridVisible ? 'Hide Grid' : 'Show Grid'}
          className={`p-2 rounded-xl transition-colors ${
            isGridVisible
              ? 'text-union-accent bg-union-accent/10 border border-union-accent/20'
              : 'text-union-muted hover:text-white hover:bg-union-card'
          }`}
        >
          <Grid3X3 className="h-4 w-4" />
        </button>
        <button
          onClick={toggleSnapping}
          title={isSnappingEnabled ? 'Disable Snapping' : 'Enable Snapping (16px)'}
          className={`p-2 rounded-xl transition-colors ${
            isSnappingEnabled
              ? 'text-union-accentCyan bg-union-accentCyan/10 border border-union-accentCyan/20'
              : 'text-union-muted hover:text-white hover:bg-union-card'
          }`}
        >
          <Magnet className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 pl-1.5">
        <button
          onClick={duplicateSelected}
          title="Duplicate Selected (Ctrl+D)"
          className="p-2 rounded-xl text-union-muted hover:text-white hover:bg-union-card transition-colors"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={deleteSelected}
          title="Delete Selected (Del)"
          className="p-2 rounded-xl text-union-muted hover:text-union-accentRose hover:bg-union-accentRose/10 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          onClick={resetCanvas}
          title="Limpar Tela (Remover Todos os Nós)"
          className="p-2 rounded-xl text-union-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Eraser className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
