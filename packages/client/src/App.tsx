import { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  Layers, 
  Play, 
  Database,
  Cpu,
  Plus,
  Square,
  Loader2,
  Check,
  CloudOff,
  Save,
  AlertCircle,
  Coins
} from 'lucide-react';
import { UnionCanvas } from './components/canvas/UnionCanvas.js';
import { useCanvasStore } from './store/canvasStore.js';
import { NodeLibrarySidebar } from './components/nodes/NodeLibrarySidebar.js';
import { createNodeFromTemplate } from './components/nodes/nodeRegistry.js';
import { CompatibilityModal } from './components/modals/CompatibilityModal.js';
import { DataInspectorModal } from './components/inspector/DataInspectorModal.js';
import { ExecutionPlanModal } from './components/modals/ExecutionPlanModal.js';
import { ExecutionHistoryDrawer } from './components/history/ExecutionHistoryDrawer.js';
import { CreditsDrawer } from './components/credits/CreditsDrawer.js';
import { TemplateLibraryModal } from './components/modals/TemplateLibraryModal.js';

export function App() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const { 
    nodes, 
    edges, 
    addNode, 
    openExecutionPlanModal,
    isExecuting,
    executionSummary,
    executionProgress,
    stopWorkflow,
    workflowName,
    setWorkflowName,
    saveStatus,
    lastSavedAt,
    saveWorkflow,
    initFromLocalStorage,
    openHistoryDrawer,
    userCredits,
    openCreditsDrawer,
    fetchUserCredits
  } = useCanvasStore();

  useEffect(() => {
    initFromLocalStorage();
    fetchUserCredits();

    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Server not responding');
        return res.json();
      })
      .then(() => {
        setServerStatus('online');
      })
      .catch(() => {
        setServerStatus('offline');
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveWorkflow(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initFromLocalStorage, saveWorkflow, fetchUserCredits]);

  const handleQuickAddNode = () => {
    const templates = ['source-youtube', 'ai-writer', 'ai-analyst', 'extractor-transcript'];
    const chosen = templates[nodes.length % templates.length];
    const nodeDef = createNodeFromTemplate(chosen, {
      x: 100 + ((nodes.length * 40) % 400),
      y: 100 + ((nodes.length * 30) % 300)
    });
    addNode({
      id: nodeDef.id,
      type: 'unionNode',
      position: nodeDef.position,
      data: nodeDef as unknown as Record<string, unknown>
    });
  };

  const formatLastSaved = () => {
    if (!lastSavedAt) return 'Never saved';
    const d = new Date(lastSavedAt);
    return `Saved ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-union-bg text-union-text overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-union-border bg-union-surface/80 backdrop-blur px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-union-accent to-union-accentCyan flex items-center justify-center shadow-lg shadow-union-accent/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white">
                UNION.AI
              </h1>
              <span className="text-union-border">/</span>
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Workflow Name"
                aria-label="Workflow Name"
                className="bg-transparent text-xs font-semibold text-white px-1.5 py-0.5 rounded border border-transparent hover:border-union-border/80 focus:border-union-accent focus:bg-union-card outline-none w-36 md:w-44 transition-all truncate"
                title="Click to rename workflow"
              />
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-union-accent/10 text-union-accent border border-union-accent/20">
                Gate 18 Active (MVP Verified)
              </span>
            </div>
            <p className="text-[11px] text-union-muted">Visual AI Workspace & Real Data Bus Engine</p>
          </div>
        </div>

        {/* Status HUD & Canvas Metrics */}
        <div className="flex items-center space-x-3">
          {/* Gate 13: Credits & Quotas HUD Badge */}
          <button
            onClick={openCreditsDrawer}
            title="Abrir Carteira & Quotas de Créditos (Gate 13)"
            className="flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-xs font-mono transition-all group shadow-sm cursor-pointer"
          >
            <Coins className={`h-3.5 w-3.5 transition-transform group-hover:scale-110 ${
              (userCredits?.balance ?? 100) > 10
                ? 'text-amber-400'
                : (userCredits?.balance ?? 100) > 0
                ? 'text-amber-500'
                : 'text-rose-400'
            }`} />
            <span className="text-zinc-300 group-hover:text-white font-medium">
              {(userCredits?.balance ?? 100.0).toFixed(2)}
            </span>
            <span className="text-[10px] text-amber-400/80 font-sans font-bold">cr</span>
          </button>

          {/* Persistence & Autosave Status HUD */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-union-card border border-union-border text-xs font-mono">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-400" title={formatLastSaved()}>
                <Check className="h-3 w-3 text-emerald-400" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Unsaved changes</span>
              </span>
            )}
            {saveStatus === 'offline' && (
              <span className="flex items-center gap-1.5 text-cyan-400" title="Saved locally in browser storage">
                <CloudOff className="h-3 w-3" />
                <span>Saved locally</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-rose-400" title="Error syncing with server">
                <AlertCircle className="h-3 w-3" />
                <span>Sync error</span>
              </span>
            )}

            <button
              onClick={() => saveWorkflow(true)}
              title="Save now (Ctrl+S)"
              className="p-1 rounded text-union-muted hover:text-white hover:bg-union-surface transition-colors ml-1"
            >
              <Save className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center space-x-3 px-3 py-1 rounded-full bg-union-card border border-union-border text-xs font-mono">
            <span className="text-union-muted">
              Nodes: <strong className="text-white">{nodes.length}</strong>
            </span>
            <span className="text-union-border">|</span>
            <span className="text-union-muted">
              Links: <strong className="text-white">{edges.length}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-union-card border border-union-border text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                serverStatus === 'online'
                  ? 'bg-union-accentGreen animate-pulse'
                  : serverStatus === 'checking'
                  ? 'bg-union-accentAmber animate-ping'
                  : 'bg-union-accentRose'
              }`}
            />
            <span className="font-mono text-union-muted">
              Backend: {serverStatus.toUpperCase()}
            </span>
          </div>

          {/* Execution Telemetry / Control HUD */}
          {isExecuting ? (
            <div className="flex items-center space-x-3 px-3 py-1 rounded-lg bg-union-card border border-union-accent/40 text-xs">
              <div className="flex items-center gap-1.5 text-union-accent font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Running: {executionProgress.completed}/{executionProgress.total} ({executionProgress.percent}%)</span>
              </div>

              {/* Progress bar */}
              <div className="w-16 h-1.5 rounded-full bg-union-surface overflow-hidden border border-union-border/60">
                <div
                  className="h-full bg-gradient-to-r from-union-accent to-union-accentCyan transition-all duration-300"
                  style={{ width: `${executionProgress.percent}%` }}
                />
              </div>

              {executionSummary && (
                <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-union-muted">
                  <span>{executionSummary.totalTokens} tok</span>
                  <span>{executionSummary.totalCostCredits.toFixed(3)} cr</span>
                </div>
              )}

              <button
                onClick={stopWorkflow}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shadow-sm transition-colors"
                title="Stop Workflow Execution"
              >
                <Square className="h-3 w-3 fill-current" />
                <span>STOP</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                title="Abrir Biblioteca de Templates (Gate 18)"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-union-accent text-zinc-200 hover:text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Templates</span>
              </button>

              <button
                onClick={openExecutionPlanModal}
                disabled={nodes.length === 0}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-union-accent hover:bg-union-accent/90 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>RUN WORKFLOW</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <aside className="w-14 border-r border-union-border bg-union-surface flex flex-col items-center py-4 space-y-4 z-10">
          <button 
            onClick={handleQuickAddNode}
            title="Quick Add Node"
            className="p-2.5 rounded-lg bg-union-accent/10 border border-union-accent/20 text-union-accent hover:bg-union-accent hover:text-white transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            title="Nodes Library"
            className={`p-2.5 rounded-lg transition-colors ${
              isLibraryOpen
                ? 'bg-union-accent text-white'
                : 'text-union-muted hover:text-white hover:bg-union-card'
            }`}
          >
            <Layers className="h-5 w-5" />
          </button>
          <button title="Data Bus" className="p-2.5 rounded-lg text-union-muted hover:text-white hover:bg-union-card transition-colors">
            <Database className="h-5 w-5" />
          </button>
          <button title="AI Router" className="p-2.5 rounded-lg text-union-muted hover:text-white hover:bg-union-card transition-colors">
            <Cpu className="h-5 w-5" />
          </button>
          <button 
            onClick={openHistoryDrawer}
            title="Execution Telemetry & Versions" 
            className="p-2.5 rounded-lg text-union-muted hover:text-white hover:bg-union-card transition-colors"
          >
            <Activity className="h-5 w-5" />
          </button>
          <button 
            onClick={openCreditsDrawer}
            title="Carteira & Quotas de Créditos" 
            className="p-2.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            <Coins className="h-5 w-5" />
          </button>
        </aside>

        {/* Node Library Sidebar */}
        <NodeLibrarySidebar 
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
        />

        {/* Canvas Area */}
        <section className="flex-1 h-full w-full relative">
          <UnionCanvas />
        </section>

        {/* UNION Data Bus & Engine Modals */}
        <CompatibilityModal />
        <DataInspectorModal />
        <ExecutionPlanModal />
        <ExecutionHistoryDrawer />
        <CreditsDrawer />
        <TemplateLibraryModal 
          isOpen={isTemplateModalOpen} 
          onClose={() => setIsTemplateModalOpen(false)} 
        />
      </main>
    </div>
  );
}
export default App;
