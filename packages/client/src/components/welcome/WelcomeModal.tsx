import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Globe,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  X,
  Play,
  Workflow,
  Clock,
  Compass,
  Lock,
  ChevronRight
} from 'lucide-react';
import { OFFICIAL_TEMPLATES, WorkflowTemplate } from '@union/shared';
import { useCanvasStore } from '../../store/canvasStore.js';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplates?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenTemplates
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'superpowers' | 'templates' | 'architecture' | 'quickstart'>('overview');
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('union_welcome_dismissed') === 'true';
  });

  const loadWorkflow = useCanvasStore((state) => state.loadWorkflow);

  if (!isOpen) return null;

  const handleDismissToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDontShowAgain(checked);
    if (checked) {
      localStorage.setItem('union_welcome_dismissed', 'true');
    } else {
      localStorage.removeItem('union_welcome_dismissed');
    }
  };

  const handleLaunchTemplate = (template: WorkflowTemplate) => {
    loadWorkflow({
      id: `wf-welcome-${Date.now()}`,
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
    onClose();
  };

  const superpowers = [
    {
      icon: Database,
      color: 'from-cyan-500 to-blue-600',
      title: 'UNION Data Bus Tipado',
      badge: 'Zero Perda de Contexto',
      description: 'Chega de copiar e colar textos soltos. O barramento de dados transporta pacotes tipados (DOCUMENT, TRANSCRIPT, TABLE, AI_RESPONSE) entre portas visuais com autoverificação e compatibilidade instantânea.'
    },
    {
      icon: Cpu,
      color: 'from-purple-500 to-indigo-600',
      title: 'Orquestração Multi-Modelos',
      badge: 'Custo & Qualidade Ótimos',
      description: 'Combine inteligências sem ficar preso a um único provedor. Execute Claude 3.7 Sonnet para copys viscerais, DeepSeek R1 para raciocínio profundo, GPT-4o para criativos de anúncios e Gemini 1.5 Flash para resumos instantâneos.'
    },
    {
      icon: Globe,
      color: 'from-emerald-500 to-teal-600',
      title: 'Extratores de Dados Reais',
      badge: 'YouTube, Web & PDFs',
      description: 'Ingestão nativa de fontes brutas: transcrições de vídeos com timestamps, páginas web higienizadas sem anúncios ou poluição HTML, e extrator de documentos PDF com parsing de tabelas estruturadas.'
    },
    {
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      title: 'Motores de Alta Conversão',
      badge: '14 Blocos & VSL 12 Passos',
      description: 'Máquinas de marketing comprovadas: Roteirizador de VSL em 12 etapas, Redator de Página de Vendas estruturada em 14 blocos psicológicos, Dossiê de Persona/Avatar e Matriz Omnichannel de Anúncios (Meta, Google e TikTok).'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0e1118] border border-union-border/80 rounded-2xl shadow-2xl shadow-union-accent/10 flex flex-col max-h-[92vh] overflow-hidden text-zinc-100">
        
        {/* Top Glow & Header */}
        <div className="relative px-6 py-5 border-b border-union-border/70 flex items-center justify-between bg-gradient-to-r from-union-card/90 via-union-surface to-union-card/90">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-union-accent via-indigo-500 to-union-accentCyan flex items-center justify-center shadow-lg shadow-union-accent/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  BEM-VINDO AO <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent font-extrabold">UNION.AI 2.0</span>
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SISTEMA CERTIFICADO
                </span>
              </div>
              <p className="text-xs text-union-muted">
                A Bancada Visual de Inteligência Artificial & Engenharia de Dados para Operações de Alta Escala
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Fechar apresentação"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-union-border/60 bg-[#0a0c12] space-x-1 overflow-x-auto text-xs font-medium py-1.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-union-accent text-white font-semibold shadow-md shadow-union-accent/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Visão Geral & Quebra de Padrão</span>
          </button>
          <button
            onClick={() => setActiveTab('superpowers')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'superpowers'
                ? 'bg-union-accent text-white font-semibold shadow-md shadow-union-accent/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>As 4 Superpotências</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-union-accent text-white font-semibold shadow-md shadow-union-accent/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Workflow className="h-3.5 w-3.5 text-emerald-400" />
            <span>Templates de Escala Imediata (1-Click)</span>
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-union-accent text-white font-semibold shadow-md shadow-union-accent/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Arquitetura do Fluxo</span>
          </button>
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quickstart'
                ? 'bg-union-accent text-white font-semibold shadow-md shadow-union-accent/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-purple-400" />
            <span>Início em 3 Passos</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-gradient-to-b from-[#0e1118] to-[#0a0b0e]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Hero Banner */}
              <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-cyan-950/30 border border-indigo-500/20 p-6 md:p-8 overflow-hidden">
                <div className="absolute -right-12 -top-12 w-64 h-64 bg-union-accent/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-union-accent/10 border border-union-accent/25 text-xs text-union-accent font-mono">
                    <Zap className="h-3 w-3" />
                    <span>O Fim dos Prompts Lineares e Isolados</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    Transforme Dados Reais em Funis Completos de Vendas em Menos de 3 Minutos.
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    A maioria das equipes perde até 80% do tempo copiando transcrições de vídeos para abas de chat avulsas. No <strong>UNION.AI</strong>, você constrói pipelines visuais onde cada nó executa uma etapa real de inteligência: extração, raciocínio, redação persuasiva e geração de criativos.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('templates')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-union-accent to-indigo-600 hover:from-union-accent/90 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-union-accent/25 cursor-pointer transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Explorar Templates Oficiais</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-union-border text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span>Abrir Canvas em Branco</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparison Matrix: Why UNION.AI vs Conventional Chats */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-union-muted">
                  Comparativo de Produtividade & Eficiência Operacional
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-rose-950/10 border border-rose-900/30 space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                      <X className="h-4 w-4" />
                      <span>Ferramentas Convencionais de Chat (ChatGPT, Claude Web)</span>
                    </div>
                    <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                      <li>Conversas lineares sem barramento de dados estruturado.</li>
                      <li>Cópia manual constante de textos longos entre várias abas.</li>
                      <li>Perda frequente de contexto psicológico entre avatar, VSL e anúncios.</li>
                      <li>Sem histórico determinístico ou restauração de versões em 1 clique.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-800/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>A Estação Visual UNION.AI 2.0</span>
                    </div>
                    <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                      <li>Canvas infinito em grafo acíclico direcionado (DAG).</li>
                      <li>Barramento tipado que conecta YouTube, Sites e PDFs diretamente a nós de IA.</li>
                      <li>Roteador dinâmico: Claude 3.7 + DeepSeek R1 + GPT-4o operando em conjunto.</li>
                      <li>Snapshots de versão com rollback atômico e persistência segura em SQLite WAL.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Key Platform Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-union-card/70 border border-union-border/60 text-center space-y-1">
                  <span className="text-[11px] font-mono text-union-muted uppercase">Confiabilidade</span>
                  <div className="text-lg font-extrabold text-emerald-400">235 Testes</div>
                  <span className="text-[10px] text-zinc-400">100% Homologados</span>
                </div>
                <div className="p-3.5 rounded-xl bg-union-card/70 border border-union-border/60 text-center space-y-1">
                  <span className="text-[11px] font-mono text-union-muted uppercase">Velocidade Média</span>
                  <div className="text-lg font-extrabold text-cyan-400">&lt; 3 Segundos</div>
                  <span className="text-[10px] text-zinc-400">Tempo de Planejamento</span>
                </div>
                <div className="p-3.5 rounded-xl bg-union-card/70 border border-union-border/60 text-center space-y-1">
                  <span className="text-[11px] font-mono text-union-muted uppercase">Redução de Custos</span>
                  <div className="text-lg font-extrabold text-purple-400">Até 85%</div>
                  <span className="text-[10px] text-zinc-400">Roteamento Cognitivo</span>
                </div>
                <div className="p-3.5 rounded-xl bg-union-card/70 border border-union-border/60 text-center space-y-1">
                  <span className="text-[11px] font-mono text-union-muted uppercase">Modelos Nativos</span>
                  <div className="text-lg font-extrabold text-amber-400">Multi-Provedor</div>
                  <span className="text-[10px] text-zinc-400">OpenAI, Claude, DeepSeek</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THE 4 SUPERPOWERS */}
          {activeTab === 'superpowers' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-left space-y-1">
                <h3 className="text-base font-bold text-white">As 4 Superpotências da Engenharia UNION.AI</h3>
                <p className="text-xs text-union-muted">Projetadas especificamente para eliminar o trabalho manual repetitivo na criação de campanhas.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {superpowers.map((sp, idx) => {
                  const Icon = sp.icon;
                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-union-card/70 border border-union-border/70 hover:border-union-accent/50 transition-all space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`h-9 w-9 rounded-lg bg-gradient-to-tr ${sp.color} flex items-center justify-center text-white shadow-md`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 text-zinc-300 border border-white/10">
                          {sp.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-union-accent transition-colors">
                        {sp.title}
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {sp.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-white">Auditoria & Isolamento Multi-Inquilino (RBAC):</span>
                    <span className="text-zinc-400 ml-1">Cada execução, crédito e dado é estritamente isolado entre usuários e organizações.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OFFICIAL TEMPLATES (1-CLICK LAUNCH) */}
          {activeTab === 'templates' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Templates Oficiais de Produção (1-Click Launch)</h3>
                  <p className="text-xs text-union-muted">Selecione um fluxo validado para carregar instantaneamente na sua bancada de trabalho.</p>
                </div>
                {onOpenTemplates && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenTemplates();
                    }}
                    className="text-xs text-union-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Ver Catálogo Completo</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OFFICIAL_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-5 rounded-xl bg-union-card border border-union-border hover:border-union-accent/70 transition-all flex flex-col justify-between space-y-4 group hover:shadow-xl hover:shadow-union-accent/5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-union-accent/15 text-union-accent uppercase">
                          {tpl.category}
                        </span>
                        <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          ~{tpl.estimatedCredits} cr
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-union-accent transition-colors">
                        {tpl.name}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-union-border/40">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                        <span className="text-zinc-500">Nós:</span>
                        <strong className="text-zinc-200">{tpl.nodes.length}</strong>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-500">Links:</span>
                        <strong className="text-zinc-200">{tpl.connections.length}</strong>
                      </div>

                      <button
                        data-testid={`template-launch-${tpl.id}`}
                        onClick={() => handleLaunchTemplate(tpl)}
                        className="w-full py-2 px-3 rounded-lg bg-union-surface hover:bg-union-accent text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-union-border hover:border-union-accent"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Carregar no Canvas e Começar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE DIAGRAM */}
          {activeTab === 'architecture' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="text-left space-y-1">
                <h3 className="text-base font-bold text-white">Como Funciona o Ciclo de Execução em Grafo</h3>
                <p className="text-xs text-union-muted">Entenda como o UNION.AI processa do briefing bruto até a campanha final de vendas.</p>
              </div>

              {/* Step-by-Step Architecture Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-union-card border border-union-border space-y-2">
                  <div className="text-[10px] font-mono text-cyan-400 font-bold">FASE 1: INGESTÃO</div>
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Globe className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Fontes de Dados</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Vídeos do YouTube, URLs web, PDFs e documentos são convertidos em texto puro e metadados estruturados.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-union-card border border-union-border space-y-2">
                  <div className="text-[10px] font-mono text-purple-400 font-bold">FASE 2: CONEXÃO</div>
                  <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Database className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">UNION Data Bus</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Portas tipadas validam o fluxo. Se os tipos forem distintos, auto-transformadores são sugeridos sem erros de execução.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-union-card border border-union-border space-y-2">
                  <div className="text-[10px] font-mono text-indigo-400 font-bold">FASE 3: INTELIGÊNCIA</div>
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Multi-Model Routing</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Claude para persuasão, DeepSeek para análise profunda e GPT-4o para criativos, orquestrados em paralelismo topológico.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-union-card border border-union-border space-y-2">
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">FASE 4: ENTREGA</div>
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Ativos Prontos</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Página de vendas em 14 blocos, roteiro de VSL em 12 passos e anúncios exportados em Markdown e JSON direto.
                  </p>
                </div>
              </div>

              {/* Technical Guarantees */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 to-[#12151e] border border-union-border/80 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-union-accent" />
                    <span>Garantias de Execução Enterprise</span>
                  </h5>
                  <p className="text-zinc-400 text-[11px]">
                    Grafo validado contra ciclos infinitos, execução transacional atômica e métricas em tempo real expostas no endpoint Prometheus <code>/metrics</code>.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="px-4 py-2 rounded-lg bg-union-accent text-white text-xs font-semibold shrink-0 cursor-pointer hover:bg-union-accent/90 transition-colors"
                >
                  Experimentar um Fluxo
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: QUICK START IN 3 STEPS */}
          {activeTab === 'quickstart' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="text-left space-y-1">
                <h3 className="text-base font-bold text-white">Como Iniciar seu Primeiro Fluxo em 60 Segundos</h3>
                <p className="text-xs text-union-muted">Guia prático para você dominar a interface e produzir resultados imediatamente.</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-union-card border border-union-border flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-union-accent/20 text-union-accent flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-white">Adicione seus Nós de Entrada</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Clique no botão <strong>"+"</strong> na barra lateral esquerda ou na barra de ferramentas para adicionar uma fonte: <em>YouTube Source</em>, <em>Website Crawler</em> ou <em>PDF Document</em>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-union-card border border-union-border flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-white">Conecte as Portas Coloridas com o Mouse</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      Arraste o conector de saída da fonte (ex: porta <em>Transcript</em> ou <em>Text</em>) até a porta de entrada de um nó de IA (ex: <em>VSL Scriptwriter</em> ou <em>Sales Page Copywriter</em>). O barramento valida os tipos automaticamente.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-union-card border border-union-border flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    3
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-white">Clique em "RUN WORKFLOW"</h4>
                    <p className="text-zinc-400 leading-relaxed">
                      O motor compila a ordem topológica de execução, calcula o consumo de créditos antecipadamente e processa todos os nós em paralelo determinístico.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-union-accent to-union-accentCyan text-white font-bold text-xs shadow-lg shadow-union-accent/25 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>ENTENDIDO! ENTRAR NO WORKSPACE AGORA</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-union-border/70 bg-[#0a0c12] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={handleDismissToggle}
              className="rounded border-union-border bg-union-surface text-union-accent focus:ring-union-accent/40 h-3.5 w-3.5 cursor-pointer"
            />
            <span className="text-[11px]">Não exibir esta introdução automaticamente ao iniciar</span>
          </label>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setActiveTab('templates')}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer border border-zinc-700"
            >
              Ver Templates
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-union-accent hover:bg-union-accent/90 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Ir para o Canvas
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
