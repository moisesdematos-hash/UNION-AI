import { useEffect } from 'react';
import {
  X,
  Play,
  Layers,
  ArrowDown,
  AlertTriangle,
  Zap,
  Clock,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';

export function ExecutionPlanModal() {
  const {
    isExecutionPlanModalOpen,
    closeExecutionPlanModal,
    validationResult,
    executionPlan,
    nodes,
    executeWorkflow
  } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeExecutionPlanModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeExecutionPlanModal]);

  if (!isExecutionPlanModalOpen) return null;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const isValid = validationResult?.isValid ?? false;
  const errors = validationResult?.errors ?? [];
  const warnings = validationResult?.warnings ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-union-border bg-union-card/95 shadow-2xl shadow-union-accent/20 flex flex-col overflow-hidden text-union-text">
        {/* Top Accent Strip */}
        <div
          className={`h-1 w-full ${
            isValid ? 'bg-gradient-to-r from-emerald-500 via-union-accent to-cyan-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'
          }`}
        />

        {/* Header */}
        <div className="p-5 border-b border-union-border flex items-center justify-between bg-union-surface/50">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isValid
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {isValid ? <Layers className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div>
              <h2 id="plan-modal-title" className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Workflow DAG Execution Plan
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                    isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {isValid ? 'DAG Verified' : 'Validation Failed'}
                </span>
              </h2>
              <p className="text-xs text-union-muted mt-0.5">
                {isValid
                  ? 'Dependency order resolved via Kahn topological sort with concurrent batching.'
                  : 'Workflow dependencies or configurations require attention before execution.'}
              </p>
            </div>
          </div>

          <button
            onClick={closeExecutionPlanModal}
            className="p-1.5 rounded-lg text-union-muted hover:text-white hover:bg-union-surface transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {/* Validation Issues if invalid */}
          {!isValid && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                <AlertTriangle className="h-4 w-4" />
                <span>Blocking Issues ({errors.length})</span>
              </div>

              <div className="space-y-2">
                {errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-start gap-3"
                  >
                    <span className="p-1 rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                      {err.code}
                    </span>
                    <div className="flex-1 text-xs">
                      <p className="text-white font-medium">{err.message}</p>
                      {err.nodeId && (
                        <p className="text-[11px] text-rose-300/80 font-mono mt-0.5">
                          Node: {String((nodeMap.get(err.nodeId)?.data as any)?.label || err.nodeId)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings list if any */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" />
                <span>Warnings ({warnings.length})</span>
              </div>
              <div className="space-y-1.5">
                {warnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 flex items-center justify-between"
                  >
                    <span>{warn.message}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10">
                      {warn.code}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parallel Execution Stages */}
          {isValid && executionPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-union-accent uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-4 w-4" />
                  Execution Stages ({executionPlan.levels.length} Stages • {executionPlan.totalNodes} Nodes)
                </span>
                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  0 Cycles Detected
                </span>
              </div>

              <div className="space-y-3">
                {executionPlan.levels.map((level: string[], lvlIdx: number) => (
                  <div key={lvlIdx} className="space-y-2">
                    <div className="p-4 rounded-xl border border-union-border bg-union-surface/70 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-union-accent/20 border border-union-accent/40 text-union-accent flex items-center justify-center text-[10px] font-mono">
                            {lvlIdx + 1}
                          </span>
                          Stage {lvlIdx + 1}
                        </span>

                        {level.length > 1 ? (
                          <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                            <Zap className="h-3 w-3" />
                            {level.length} Nodes Running in Parallel
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-union-muted">
                            1 Sequential Node
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {level.map((nodeId: string) => {
                          const n = nodeMap.get(nodeId);
                          const label = String((n?.data as any)?.label || nodeId);
                          const category = String((n?.data as any)?.category || 'NODE');
                          return (
                            <div
                              key={nodeId}
                              className="px-3 py-1.5 rounded-lg border border-union-borderHover bg-union-card flex items-center gap-2 text-xs shadow-sm"
                            >
                              <span className="h-2 w-2 rounded-full bg-union-accent" />
                              <span className="font-semibold text-white">{label}</span>
                              <span className="font-mono text-[9px] text-union-muted px-1.5 py-0.5 rounded bg-union-surface">
                                {category}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step Arrow Down */}
                    {lvlIdx < executionPlan.levels.length - 1 && (
                      <div className="flex justify-center">
                        <ArrowDown className="h-4 w-4 text-union-muted/50 animate-bounce" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-union-surface/50 border-t border-union-border flex items-center justify-between">
          <button
            onClick={closeExecutionPlanModal}
            className="px-4 py-2 rounded-lg bg-union-surface border border-union-border hover:border-union-borderHover text-xs text-white transition-colors"
          >
            Close
          </button>

          {isValid && (
            <button
              onClick={() => {
                closeExecutionPlanModal();
                executeWorkflow('RUN');
              }}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-union-accent to-union-accentCyan text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-union-accent/25 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Execute Workflow Plan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutionPlanModal;
