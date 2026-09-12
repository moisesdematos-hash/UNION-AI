import React, { useState } from 'react';
import { 
  Workflow, 
  X, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Play, 
  Layers, 
  Bot,
  Target
} from 'lucide-react';
import { OFFICIAL_TEMPLATES, WorkflowTemplate } from '@union/shared';
import { useCanvasStore } from '../../store/canvasStore.js';

interface ConnectionStandardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulator?: (copy?: string) => void;
  onOpenForge?: () => void;
}

export const ConnectionStandardsModal: React.FC<ConnectionStandardsModalProps> = ({
  isOpen,
  onClose,
  onOpenSimulator,
  onOpenForge
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'MARKETING' | 'CONTENT' | 'RESEARCH' | 'AUTOMATION'>('ALL');
  const [activeTab, setActiveTab] = useState<'esteiras' | 'portas' | 'arquitetura'>('esteiras');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const loadWorkflow = useCanvasStore((state) => state.loadWorkflow);
  const scheduleAutosave = useCanvasStore((state) => state.scheduleAutosave);

  if (!isOpen) return null;

  const filteredTemplates = selectedCategory === 'ALL'
    ? OFFICIAL_TEMPLATES
    : OFFICIAL_TEMPLATES.filter(t => t.category.toUpperCase() === selectedCategory);

  const handleApplyPipeline = (template: WorkflowTemplate) => {
    setAppliedId(template.id);
    loadWorkflow({
      id: 'wf-std-' + Date.now(),
      name: template.name,
      description: template.description,
      nodes: template.nodes,
      connections: template.connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      groups: [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    scheduleAutosave();

    setTimeout(() => {
      setAppliedId(null);
      onClose();
    }, 600);
  };

  const portRules = [
    { type: 'TEXT', label: 'Texto / Prompt / Briefing', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', accepts: 'Contexts, Prompt, Briefing, Raw Text', desc: 'Transporta textos limpos, briefings de produtos e instruções de escrita.' },
    { type: 'TRANSCRIPT', label: 'Transcrição de Áudio/Vídeo', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40', accepts: 'Data Sources, Contexts, AI Market Analyst', desc: 'Texto falado extraído de vídeos com pontuação e timestamps.' },
    { type: 'URL', label: 'Link de Vídeo ou Página Web', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', accepts: 'Video URL, Page URL', desc: 'Validação de URLs com teste de formato e segurança.' },
    { type: 'DOCUMENT', label: 'Documento / Copy Estruturada', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', accepts: 'Document Input, Simulator Copy', desc: 'Arquivos PDF completos, roteiros de VSL ou cartas de vendas.' },
    { type: 'JSON / TABLE', label: 'Dados Estruturados & SWOT', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', accepts: 'Avatar Profile, Items List, Simulator JSON', desc: 'Perfis de clientes, dores, métricas de campanhas e tabelas.' },
    { type: 'AI_RESPONSE', label: 'Resposta Gerada por IA', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', accepts: 'Content Exporter, Data Formatter, Re-prompter', desc: 'Saída processada dos modelos (Gemini, Claude, GPT-4o).' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      data-testid="connection-standards-modal"
    >
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#0c0e14] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#10131d]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Workflow className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-wide">
                  Padronização de Conexões & Esteiras
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  8 Esteiras Prontas (1-Click)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Padrões arquiteturais pré-conectados e compatíveis com o UNION Data Bus para produção em escala.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-zinc-800/80 bg-[#0e1017]">
          <button
            onClick={() => setActiveTab('esteiras')}
            className={activeTab === 'esteiras' ? 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-cyan-500 text-white shadow-md shadow-cyan-500/25' : 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800'}
          >
            <Workflow className="h-3.5 w-3.5" />
            <span>As 8 Esteiras Padronizadas</span>
          </button>

          <button
            onClick={() => setActiveTab('portas')}
            className={activeTab === 'portas' ? 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-cyan-500 text-white shadow-md shadow-cyan-500/25' : 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800'}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Regras de Portas & Cores dos Fios</span>
          </button>

          <button
            onClick={() => setActiveTab('arquitetura')}
            className={activeTab === 'arquitetura' ? 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer bg-cyan-500 text-white shadow-md shadow-cyan-500/25' : 'px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800'}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Diretriz Universal (4 Fases)</span>
          </button>

          {onOpenForge && (
            <button
              onClick={() => {
                onClose();
                onOpenForge();
              }}
              className="ml-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Abrir Union Forge & Aceleradores"
            >
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Abrir Union Forge ⚡</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0b0d13] to-[#07080b]">
          {/* TAB 1: AS 8 ESTEIRAS */}
          {activeTab === 'esteiras' && (
            <div className="space-y-5">
              {/* Category Filters */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'MARKETING', 'CONTENT', 'RESEARCH', 'AUTOMATION'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={selectedCategory === cat ? 'px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer bg-zinc-700 text-white border border-cyan-500/40' : 'px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800'}
                    >
                      {cat === 'ALL' ? 'Todas (8)' : cat}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Clique em "Montar no Canvas" para carregar o fluxo completo</span>
                </div>
              </div>

              {/* Grid of 8 Standardized Pipelines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((tpl, idx) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3 group hover:shadow-lg hover:shadow-cyan-950/20"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase">
                          Esteira {idx + 1}: {tpl.category}
                        </span>
                        <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          ~{tpl.estimatedCredits} cr
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tpl.name}
                      </h4>

                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>

                      {/* Visual Flow Representation */}
                      <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-zinc-300">
                        {tpl.nodes.map((n, i) => (
                          <React.Fragment key={n.id}>
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-200 shrink-0 font-medium">
                              {n.label}
                            </span>
                            {i < tpl.nodes.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-cyan-400 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-zinc-400 font-mono">
                        <span>{tpl.nodes.length} nós</span> | <span>{tpl.connections.length} fios tipados</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenSimulator && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenSimulator(`Esteira: ${tpl.name}\n${tpl.description}`);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                            title="Testar promessa desta esteira no Simulador CPS"
                          >
                            <Target className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleApplyPipeline(tpl)}
                          className={appliedId === tpl.id ? 'px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-emerald-600 text-white' : 'px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/20 hover:scale-[1.02]'}
                        >
                          {appliedId === tpl.id ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Aplicado!</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Montar no Canvas</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: REGRAS DE PORTAS E CORES */}
          {activeTab === 'portas' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400 leading-relaxed">
                Cada porta possui uma assinatura estrita de tipo. Conectar tipos incompatíveis é prevenido na fonte pelo Data Bus com sugestão de transformadores automáticos.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {portRules.map((rule) => (
                  <div 
                    key={rule.type} 
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${rule.color}`}>
                        {rule.type}
                      </span>
                      <span className="text-xs font-semibold text-zinc-200">{rule.label}</span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {rule.desc}
                    </p>

                    <div className="text-[11px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/80">
                      <span className="text-zinc-400 font-semibold">Conecta em:</span> {rule.accepts}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DIRETRIZ UNIVERSAL (4 FASES) */}
          {activeTab === 'arquitetura' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-cyan-950/30 to-zinc-900 border border-cyan-500/20 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  A Fórmula Universal de 4 Fases do UNION.AI
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Todo ecossistema autônomo opera sob este ciclo de dados estrito. Cada estágio executa uma transformação real e tangível.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-cyan-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">1. ENTRADA (FONTES)</div>
                  <h5 className="text-xs font-bold text-white">Ingestão Bruta</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Vídeos do YouTube, PDFs, páginas web ou briefing direto por texto.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-teal-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-teal-400 font-bold">2. EXTRAÇÃO / PESQUISA</div>
                  <h5 className="text-xs font-bold text-white">Inteligência Estruturada</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Transcrições limpas com timestamps, matriz SWOT e perfil profundo do Avatar/ICP.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-indigo-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-indigo-400 font-bold">3. GERAÇÃO (IA)</div>
                  <h5 className="text-xs font-bold text-white">Engenharia Persuasiva</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    VSLs em 12 passos, Páginas de Vendas em 14 blocos e Matriz de Anúncios.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/30 space-y-2">
                  <div className="text-[10px] font-mono text-amber-400 font-bold">4. SIMULAÇÃO & EXPORT</div>
                  <h5 className="text-xs font-bold text-white">Previsão & Ativos</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Simulador CPS com 5 personas, Auto-Heal de pontos fracos e exportação em Markdown/JSON.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-[#0e1017] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Bot className="h-4 w-4 text-cyan-400" />
            <span>Também disponível via comando <strong>/esteira</strong> no Chat do Projeto</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold transition cursor-pointer border border-zinc-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
