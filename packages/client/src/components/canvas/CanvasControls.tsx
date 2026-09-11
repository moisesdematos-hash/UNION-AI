import { useReactFlow } from '@xyflow/react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Grid3X3, 
  Magnet, 
  Undo2, 
  Redo2, 
  Trash2, 
  Copy 
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';

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
    duplicateSelected
  } = useCanvasStore();

  const handleCenter = () => {
    setCenter(0, 0, { duration: 400 });
  };

  const currentZoomPercent = Math.round((getZoom() || 1) * 100);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-union-surface/90 border border-union-border shadow-2xl backdrop-blur select-none">
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
      </div>
    </div>
  );
}
