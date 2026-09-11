import {
  AlertTriangle,
  Sparkles,
  X,
  PlusCircle,
  Unlink
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';
import { getDataTypeStyle } from '../../utils/portColors.js';

export function CompatibilityModal() {
  const {
    pendingIncompatibleConnection,
    resolveIncompatibleWithTransformer,
    resolveIncompatibleForceConnect,
    cancelIncompatibleConnection
  } = useCanvasStore();

  if (!pendingIncompatibleConnection) return null;

  const {
    sourceType,
    targetType,
    sourceNodeLabel,
    targetNodeLabel,
    suggestions
  } = pendingIncompatibleConnection;

  const sourceStyle = getDataTypeStyle(sourceType);
  const targetStyle = getDataTypeStyle(targetType);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compat-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-union-border bg-union-card/95 shadow-2xl shadow-union-accent/10 overflow-hidden text-union-text">
        {/* Top Glow Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-union-accent to-rose-500" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-union-border/60 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 id="compat-modal-title" className="text-base font-bold text-white tracking-wide">
                Incompatible Data Types
              </h2>
              <p className="text-xs text-union-muted mt-0.5">
                The UNION Data Bus cannot directly pipe <span className="font-semibold text-white">{sourceType}</span> into <span className="font-semibold text-white">{targetType}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={cancelIncompatibleConnection}
            className="p-1.5 rounded-lg text-union-muted hover:text-white hover:bg-union-surface transition-colors"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Visual Flow Comparison */}
        <div className="px-6 py-4 bg-union-surface/40 border-b border-union-border/40">
          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Source Port Box */}
            <div className="flex-1 p-3 rounded-xl border border-union-border/80 bg-union-surface/80 flex flex-col items-center text-center">
              <span className="text-[11px] font-medium text-union-muted truncate max-w-[120px]">
                {sourceNodeLabel}
              </span>
              <div
                style={{
                  backgroundColor: `${sourceStyle.color}15`,
                  borderColor: `${sourceStyle.color}40`,
                  color: sourceStyle.color
                }}
                className="mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold"
              >
                {sourceType}
              </div>
            </div>

            {/* Incompatible Wire Indicator */}
            <div className="flex flex-col items-center px-1">
              <div className="flex items-center text-rose-400 gap-1 font-mono text-[10px] font-semibold">
                <Unlink className="h-3.5 w-3.5" />
                <span>BLOCKED</span>
              </div>
              <div className="h-0.5 w-12 bg-rose-500/40 my-1 relative">
                <div className="absolute inset-0 bg-rose-500 animate-pulse" />
              </div>
            </div>

            {/* Target Port Box */}
            <div className="flex-1 p-3 rounded-xl border border-union-border/80 bg-union-surface/80 flex flex-col items-center text-center">
              <span className="text-[11px] font-medium text-union-muted truncate max-w-[120px]">
                {targetNodeLabel}
              </span>
              <div
                style={{
                  backgroundColor: `${targetStyle.color}15`,
                  borderColor: `${targetStyle.color}40`,
                  color: targetStyle.color
                }}
                className="mt-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold"
              >
                {targetType}
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Transformers Section */}
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-union-accent tracking-wider uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Recommended Transformers</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {suggestions.map((transformer, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-union-border hover:border-union-accent/50 bg-union-surface/60 hover:bg-union-surface transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white group-hover:text-union-accent transition-colors">
                      {transformer.label}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-union-bg text-union-muted border border-union-border">
                      {transformer.transformerNodeType}
                    </span>
                  </div>
                  <p className="text-[11px] text-union-muted mt-0.5 line-clamp-1">
                    {transformer.description}
                  </p>
                </div>

                <button
                  onClick={() => resolveIncompatibleWithTransformer(transformer.transformerNodeType)}
                  className="px-3 py-1.5 rounded-lg bg-union-accent hover:bg-union-accentHover text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-union-accent/20 shrink-0 transition-all hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Auto-Insert</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-union-surface/40 border-t border-union-border flex items-center justify-between text-xs">
          <button
            onClick={resolveIncompatibleForceConnect}
            className="text-union-muted hover:text-rose-400 transition-colors underline decoration-dotted"
          >
            Force Connect (Mark as Error)
          </button>

          <button
            onClick={cancelIncompatibleConnection}
            className="px-4 py-1.5 rounded-lg bg-union-surface border border-union-border hover:border-union-borderHover text-white transition-all font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompatibilityModal;
