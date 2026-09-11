import { useState } from 'react';
import { 
  X, 
  Clock, 
  History, 
  GitBranch, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle, 
  Loader2, 
  Plus, 
  Zap, 
  Coins
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';
import { WorkflowRunStatus } from '@union/shared';

export function ExecutionHistoryDrawer() {
  const { 
    isHistoryDrawerOpen, 
    closeHistoryDrawer, 
    runsHistory, 
    versionsList, 
    createVersionSnapshot, 
    rollbackToVersion 
  } = useCanvasStore();

  const [activeTab, setActiveTab] = useState<'runs' | 'versions'>('runs');
  const [newVersionName, setNewVersionName] = useState('');
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [rollbackSuccessMsg, setRollbackSuccessMsg] = useState<string | null>(null);

  if (!isHistoryDrawerOpen) return null;

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;
    setIsCreatingVersion(true);
    try {
      await createVersionSnapshot(newVersionName.trim());
      setNewVersionName('');
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleRollback = async (versionId: string, versionName: string) => {
    if (window.confirm(`Tem certeza que deseja restaurar o canvas para a versão "${versionName}"? O estado atual do canvas será substituído.`)) {
      await rollbackToVersion(versionId);
      setRollbackSuccessMsg(`Canvas restaurado com sucesso para "${versionName}".`);
      setTimeout(() => setRollbackSuccessMsg(null), 3000);
    }
  };

  const renderStatusBadge = (status: WorkflowRunStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-2.5 w-2.5" /> COMPLETED
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="h-2.5 w-2.5" /> FAILED
          </span>
        );
      case 'STOPPED':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <PauseCircle className="h-2.5 w-2.5" /> STOPPED
          </span>
        );
      case 'RUNNING':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> RUNNING
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-union-card border-l border-union-border flex flex-col shadow-2xl text-union-text">
        {/* Header */}
        <div className="p-4 border-b border-union-border flex items-center justify-between bg-union-surface/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-union-accent/15 border border-union-accent/30 text-union-accent">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Execution Telemetry & Versions</h2>
              <p className="text-[11px] text-union-muted">Audit logs, execution snapshots & rollback</p>
            </div>
          </div>
          <button
            onClick={closeHistoryDrawer}
            className="p-1.5 rounded-lg text-union-muted hover:text-white hover:bg-union-surface transition-colors"
            title="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Alert */}
        {rollbackSuccessMsg && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{rollbackSuccessMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-union-border px-4 bg-union-surface/30">
          <button
            onClick={() => setActiveTab('runs')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'runs'
                ? 'border-union-accent text-white'
                : 'border-transparent text-union-muted hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Execution Runs ({runsHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'versions'
                ? 'border-union-accent text-white'
                : 'border-transparent text-union-muted hover:text-white'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Versions & Snapshots ({versionsList.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'runs' ? (
            runsHistory.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-union-muted">
                <Clock className="h-8 w-8 text-union-border mb-2" />
                <p className="text-xs font-medium text-white">No execution runs yet</p>
                <p className="text-[11px] text-union-muted mt-1">
                  Click "RUN WORKFLOW" to execute the pipeline and generate telemetry logs.
                </p>
              </div>
            ) : (
              runsHistory.map((run) => (
                <div
                  key={run.id}
                  className="p-3.5 rounded-xl border border-union-border bg-union-surface/50 hover:border-union-borderHover transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(run.status)}
                      <span className="text-[10px] font-mono text-union-muted bg-union-card px-1.5 py-0.5 rounded border border-union-border">
                        {run.mode}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-union-muted">
                      {new Date(run.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-union-border/40 font-mono text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-union-muted uppercase">Duration</span>
                      <span className="text-white font-semibold">{run.durationMs}ms</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-union-muted uppercase flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 text-cyan-400" /> Tokens
                      </span>
                      <span className="text-cyan-400 font-semibold">{run.totalTokens}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-union-muted uppercase flex items-center gap-1">
                        <Coins className="h-2.5 w-2.5 text-amber-400" /> Credits
                      </span>
                      <span className="text-amber-400 font-semibold">{run.totalCostCredits.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-union-muted flex justify-between items-center pt-1 border-t border-union-border/20">
                    <span>Nodes: {run.completedNodes}/{run.totalNodes} completed</span>
                    <span className="font-mono text-[9px] text-union-muted/70">{run.id}</span>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-4">
              {/* Create Snapshot Form */}
              <form onSubmit={handleCreateVersion} className="p-3.5 rounded-xl border border-union-accent/30 bg-union-accent/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-union-accent" /> Create Snapshot
                  </span>
                  <span className="text-[10px] text-union-muted font-mono">Current Canvas</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="e.g., Campaign Milestone 1"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-union-card border border-union-border focus:border-union-accent outline-none text-white placeholder:text-union-muted"
                  />
                  <button
                    type="submit"
                    disabled={!newVersionName.trim() || isCreatingVersion}
                    className="px-3 py-1.5 rounded-lg bg-union-accent hover:bg-union-accent/90 text-white text-xs font-bold disabled:opacity-50 transition-colors shrink-0"
                  >
                    Save
                  </button>
                </div>
              </form>

              {/* Versions List */}
              {versionsList.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-union-muted">
                  <GitBranch className="h-8 w-8 text-union-border mb-2" />
                  <p className="text-xs font-medium text-white">No snapshots saved yet</p>
                  <p className="text-[11px] text-union-muted mt-1">
                    Save named versions above to rollback to previous workflow architectures at any time.
                  </p>
                </div>
              ) : (
                versionsList.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3.5 rounded-xl border border-union-border bg-union-surface/50 hover:border-union-borderHover transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-union-accent/20 border border-union-accent/40 text-union-accent font-mono text-[10px] font-bold">
                          v{ver.versionNumber}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-[180px]">{ver.name}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-union-muted">
                        {new Date(ver.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {ver.description && (
                      <p className="text-[11px] text-union-muted line-clamp-2">{ver.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-union-border/40 text-xs">
                      <span className="text-[11px] text-union-muted font-mono">
                        {ver.snapshot.nodes?.length || 0} nodes · {ver.snapshot.connections?.length || 0} links
                      </span>
                      <button
                        onClick={() => handleRollback(ver.id, ver.name)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-union-card border border-union-border hover:border-union-accent hover:text-white text-union-muted text-[11px] font-semibold transition-colors"
                        title="Rollback canvas to this version"
                      >
                        <RotateCcw className="h-3 w-3 text-union-accent" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExecutionHistoryDrawer;
