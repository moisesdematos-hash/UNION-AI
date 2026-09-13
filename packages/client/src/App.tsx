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
  Coins,
  BookOpen,
  Compass
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
import { WelcomeModal } from './components/welcome/WelcomeModal.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { ConversionSimulatorModal } from './components/marketing/ConversionSimulatorModal.js';
import { ProjectOracleDrawer } from './components/chat/ProjectOracleDrawer.js';
import { ConnectionStandardsModal } from './components/modals/ConnectionStandardsModal.js';
import { UnionForgeModal } from './components/modals/UnionForgeModal.js';
import { UserStorageManagerModal } from './components/modals/UserStorageManagerModal.js';
import { Target, Bot, Workflow, Zap, FolderOpen, ChevronDown } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'workspace' | 'landing'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#landing') {
      return 'landing';
    }
    return 'workspace';
  });
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isConnectionStandardsOpen, setIsConnectionStandardsOpen] = useState(false);
  const [isUnionForgeOpen, setIsUnionForgeOpen] = useState(false);
  const [isStorageManagerOpen, setIsStorageManagerOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('union_welcome_dismissed') !== 'true';
  });
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

    const handleHashChange = () => {
      if (window.location.hash === '#landing') {
        setCurrentView('landing');
      } else if (window.location.hash === '#workspace') {
        setCurrentView('workspace');
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    const handleWindowClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('#tools-dropdown-container')) {
        setIsToolsMenuOpen(false);
      }
    };
    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('click', handleWindowClick);
    };
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

  const [simulatorCopy, setSimulatorCopy] = useState<string | null>(null);

  const handleOpenSimulatorWithCopy = (copy: string) => {
    setSimulatorCopy(copy);
    setIsSimulatorOpen(true);
  };

  const handleInjectIntoCanvas = (action: any) => {
    if (action?.type === 'LOAD_TEMPLATE' && action?.payload?.templateId) {
      const templateId = action.payload.templateId;
      import('@union/shared').then(({ OFFICIAL_TEMPLATES }) => {
        const found = OFFICIAL_TEMPLATES.find(t => t.id === templateId);
        if (found) {
          useCanvasStore.getState().loadWorkflow({
            id: `wf-${Date.now()}`,
            name: found.name,
            description: found.description,
            nodes: found.nodes,
            connections: found.connections,
            viewport: { x: 0, y: 0, zoom: 1 },
            groups: [],
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          useCanvasStore.getState().scheduleAutosave();
        }
      });
      return;
    }

    const templateName = action?.nodeType || 'ai-writer';
    const nodeDef = createNodeFromTemplate(templateName, {
      x: 120 + ((nodes.length * 40) % 400),
      y: 120 + ((nodes.length * 30) % 300)
    });
    if (action?.copyText) {
      (nodeDef as any).config = {
        ...((nodeDef as any).config || {}),
        prompt: action.copyText,
        output: action.copyText
      };
    }
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

  if (currentView === 'landing') {
    return (
      <LandingPage
        serverStatus={serverStatus}
        onEnterWorkspace={() => {
          window.location.hash = '#workspace';
          setCurrentView('workspace');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-union-bg text-union-text overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-union-border bg-union-surface/80 backdrop-blur px-6 flex items-center justify-between z-20 select-none">
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
                Gate 18 Active (UNION.AI 2.0)
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

          <div className="hidden xl:flex items-center space-x-3 px-3 py-1 rounded-full bg-union-card border border-union-border text-xs font-mono">
            <span className="text-union-muted">
              Nodes: <strong className="text-white">{nodes.length}</strong>
            </span>
            <span className="text-union-border">|</span>
            <span className="text-union-muted">
              Links: <strong className="text-white">{edges.length}</strong>
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-union-card border border-union-border text-xs">
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
              {/* Botão de Destaque 1: Union Forge */}
              <button
                onClick={() => setIsUnionForgeOpen(true)}
                title="Union Forge: Criação Direta de E-books, Imagens e Copys"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>⚡ Union Forge</span>
              </button>

              {/* Botão de Destaque 2: Simulador CPS */}
              <button
                onClick={() => setIsSimulatorOpen(true)}
                title="AI Conversion Simulator & Heatmap (Chave de Ouro)"
                className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Target className="h-3.5 w-3.5 text-amber-400" />
                <span>Simulador CPS</span>
              </button>

              {/* Botão de Destaque 3: Minhas Pastas */}
              <button
                onClick={() => setIsStorageManagerOpen(true)}
                title="Minhas Pastas: Projetos, E-books e Arquivos em Disco"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Minhas Pastas</span>
              </button>

              {/* Menu Colapsável / Dropdown Agrupado: Mais Ferramentas & Modais */}
              <div className="relative" id="tools-dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsToolsMenuOpen(!isToolsMenuOpen);
                  }}
                  title="Mais Ferramentas e Opções da Plataforma"
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm cursor-pointer ${
                    isToolsMenuOpen
                      ? 'bg-zinc-800 border-union-accent text-white shadow-md shadow-union-accent/10'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Ferramentas</span>
                  <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                {/* Painel Dropdown Flutuante */}
                {isToolsMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-950/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md p-1.5 z-50 animate-fadeIn space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-zinc-400 font-semibold tracking-wider border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                      <span>Ferramentas do Workspace</span>
                      <span className="text-zinc-500">6 Ações</span>
                    </div>

                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsTemplateModalOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/90 text-left transition-colors text-xs text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Biblioteca de Templates</div>
                        <div className="text-[10px] text-zinc-400">Pipelines prontos de alta conversão</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsConnectionStandardsOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/90 text-left transition-colors text-xs text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <Workflow className="h-4 w-4 text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Padronizar Conexões</div>
                        <div className="text-[10px] text-zinc-400">8 Esteiras oficiais e validação em 1-clique</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsOracleOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/90 text-left transition-colors text-xs text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <Bot className="h-4 w-4 text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Chat do Projeto (Oráculo)</div>
                        <div className="text-[10px] text-zinc-400">Estrategista de campanha em tempo real</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsSimulatorOpen(true);
                      }}
                      className="md:hidden w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/90 text-left transition-colors text-xs text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <Target className="h-4 w-4 text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Simulador CPS & Heatmap</div>
                        <div className="text-[10px] text-zinc-400">Teste de conversão com 5 personas</div>
                      </div>
                    </button>

                    <div className="border-t border-zinc-800/80 my-1 pt-1"></div>

                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsWelcomeOpen(true);
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/90 text-left transition-colors text-xs text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4 text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Guia & Apresentação</div>
                        <div className="text-[10px] text-zinc-400">Visão geral do UNION.AI e gates</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        window.location.hash = '#landing';
                        setCurrentView('landing');
                      }}
                      className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-800/90 text-left transition-colors text-xs text-zinc-200 hover:text-white group cursor-pointer"
                    >
                      <Compass className="h-4 w-4 text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Página Inicial</div>
                        <div className="text-[10px] text-zinc-400">Visão da landing page institucional</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Botão de Execução Principal */}
              <button
                onClick={openExecutionPlanModal}
                disabled={nodes.length === 0}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-union-accent hover:bg-union-accent/90 text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-union-accent/20 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span className="font-bold">EXECUTAR</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <aside className="w-14 border-r border-union-border bg-union-surface flex flex-col items-center py-4 space-y-4 z-10 select-none">
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
        <section className="flex-1 h-full w-full relative select-none">
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
        <ConnectionStandardsModal
          isOpen={isConnectionStandardsOpen}
          onClose={() => setIsConnectionStandardsOpen(false)}
          onOpenSimulator={(copy) => {
            setIsConnectionStandardsOpen(false);
            if (copy) setSimulatorCopy(copy);
            setIsSimulatorOpen(true);
          }}
          onOpenForge={() => {
            setIsConnectionStandardsOpen(false);
            setIsUnionForgeOpen(true);
          }}
        />
        <UnionForgeModal
          isOpen={isUnionForgeOpen}
          onClose={() => setIsUnionForgeOpen(false)}
          onOpenSimulator={(copy) => {
            setIsUnionForgeOpen(false);
            if (copy) setSimulatorCopy(copy);
            setIsSimulatorOpen(true);
          }}
          onOpenStandards={() => {
            setIsUnionForgeOpen(false);
            setIsConnectionStandardsOpen(true);
          }}
        />
        <WelcomeModal
          isOpen={isWelcomeOpen}
          onClose={() => setIsWelcomeOpen(false)}
          onOpenTemplates={() => {
            setIsWelcomeOpen(false);
            setIsTemplateModalOpen(true);
          }}
        />
        <ConversionSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          initialCopy={simulatorCopy}
        />
        <UserStorageManagerModal
          isOpen={isStorageManagerOpen}
          onClose={() => setIsStorageManagerOpen(false)}
        />
        <ProjectOracleDrawer
          isOpen={isOracleOpen}
          onClose={() => setIsOracleOpen(false)}
          onOpenSimulatorWithCopy={handleOpenSimulatorWithCopy}
          onInjectIntoCanvas={handleInjectIntoCanvas}
        />
      </main>
    </div>
  );
}
export default App;
