import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Database,
  Cpu,
  Globe,
  TrendingUp,
  Check,
  ChevronDown,
  Play,
  MousePointerClick,
  Calculator,
  Shield,
  Mail,
  CheckCircle2,
  ExternalLink,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { OFFICIAL_TEMPLATES, WorkflowTemplate } from '@union/shared';
import { useCanvasStore } from '../../store/canvasStore.js';
import { LegalModal, LegalDocType } from '../modals/LegalModal.js';

interface LandingPageProps {
  onEnterWorkspace: () => void;
  serverStatus: 'checking' | 'online' | 'offline';
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterWorkspace,
  serverStatus
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('full-funnel-launch-machine');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // ROI Calculator Interactive States
  const [weeklyCampaigns, setWeeklyCampaigns] = useState<number>(4);
  const [hoursPerCampaign, setHoursPerCampaign] = useState<number>(6);

  // Legal Modal & Cookie Banner States
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalDocType>('privacy');
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('union_cookies_accepted') !== 'true';
  });

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterSuccess, setNewsletterSuccess] = useState<boolean>(false);

  const loadWorkflow = useCanvasStore((state) => state.loadWorkflow);

  const selectedTemplate = OFFICIAL_TEMPLATES.find((t) => t.id === selectedTemplateId) || OFFICIAL_TEMPLATES[0];

  const handleLaunchTemplate = (template: WorkflowTemplate) => {
    loadWorkflow({
      id: `wf-landing-${Date.now()}`,
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
    onEnterWorkspace();
  };

  const openLegal = (tab: LegalDocType) => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('union_cookies_accepted', 'true');
    setShowCookieBanner(false);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      setNewsletterSuccess(true);
      setNewsletterEmail('');
    }
  };

  // Calculations for ROI
  const totalManualHoursPerMonth = weeklyCampaigns * hoursPerCampaign * 4;
  const automatedHoursPerMonth = weeklyCampaigns * 0.5 * 4;
  const hoursSavedPerMonth = Math.max(0, totalManualHoursPerMonth - automatedHoursPerMonth);
  const estimatedCostSavingReal = hoursSavedPerMonth * 75; // R$75/hora média de copywriter/gestor

  const faqs = [
    {
      q: 'O que diferencia o UNION.AI de usar o ChatGPT ou Claude diretamente?',
      a: 'Nos chats convencionais, o trabalho é linear e isolado: você precisa copiar manualmente textos de uma aba para outra, gerando perda contínua de contexto. No UNION.AI 2.0, você orquestra um Grafo Acíclico Direcionado (DAG) com o UNION Data Bus tipado, conectando YouTube, Web Scraping e PDFs diretamente a múltiplos modelos (Claude 3.7, DeepSeek R1, GPT-4o) em uma única esteira automatizada com persistência atômica.'
    },
    {
      q: 'Como funciona o barramento de dados tipado (UNION Data Bus)?',
      a: 'Cada nó possui portas de entrada e saída com tipos estritos (URL, TRANSCRIPT, TEXT, TABLE, AI_RESPONSE). O sistema valida conexões em tempo real no canvas e, caso tipos diferentes sejam ligados, sugere automaticamente nós transformadores sem que o pipeline quebre.'
    },
    {
      q: 'Posso usar meus próprios prompts e regras de negócio?',
      a: 'Sim, absolutamente. Além dos templates oficiais validados, você pode customizar cada nó individualmente (temperatura, prompts de sistema, personas, tom de voz) ou criar seus próprios nós e fluxos a partir de um canvas em branco.'
    },
    {
      q: 'Como funciona a cobrança e o consumo de créditos?',
      a: 'A cobrança é 100% transparente e baseada no consumo real de tokens por nó executado. Antes de rodar qualquer fluxo, o Execution Plan Modal calcula o custo estimado exato em créditos. Novos usuários já começam com 100 créditos gratuitos de teste.'
    },
    {
      q: 'Os dados da minha empresa e briefings são seguros?',
      a: 'Sim. O UNION.AI possui arquitetura multi-inquilino com controle de acesso baseado em papéis (RBAC - Owner, Editor, Viewer), isolamento criptográfico por organização e logs de auditoria em conformidade com as melhores práticas enterprise.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 selection:bg-union-accent selection:text-white font-sans overflow-x-hidden">
      
      {/* Background Decorative Gradients & Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-union-accentCyan/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[600px] -left-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[128px]" />
        <div className="absolute top-[1200px] -right-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[128px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#161922_1px,transparent_1px),linear-gradient(to_bottom,#161922_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      {/* Floating Navbar */}
      <header className="sticky top-4 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/75 backdrop-blur-xl px-5 py-3 flex items-center justify-between shadow-2xl shadow-black/50">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-union-accent via-indigo-500 to-union-accentCyan flex items-center justify-center shadow-lg shadow-union-accent/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white">UNION.AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-union-accent/15 text-union-accent border border-union-accent/30 font-semibold">
                  v2.0 Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#roi" className="hover:text-white transition-colors">Calculadora ROI</a>
            <a href="#comparativo" className="hover:text-white transition-colors">Comparativo</a>
            <a href="#pricing" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <button
              onClick={() => openLegal('docs')}
              className="hover:text-white transition-colors cursor-pointer text-cyan-400 font-semibold"
            >
              Documentação
            </button>
            <button
              onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
              className="hover:text-white transition-colors cursor-pointer text-zinc-400 flex items-center gap-1"
              title="Rolar diretamente até o final da página"
            >
              <span>Fim</span>
              <ArrowDown className="h-3 w-3" />
            </button>
          </nav>

          {/* Action Buttons & Backend Status */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
              <span className={`h-2 w-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-zinc-400">{serverStatus === 'online' ? 'Core Online' : 'Conectando'}</span>
            </div>

            <button
              onClick={onEnterWorkspace}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-union-accent to-indigo-600 hover:from-union-accent/90 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-union-accent/25 transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Abrir Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-8">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-union-accent/30 text-xs font-medium text-zinc-300 shadow-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-zinc-400">Novo Lançamento:</span>
          <span className="text-white font-semibold flex items-center gap-1">
            Motor de Marketing Visual & Data Bus
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
          </span>
        </div>

        {/* Main Magnetic Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
          Engenharia de Marketing & IA Visual em Escala.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
            Sem Copiar e Colar.
          </span>
        </h1>

        {/* Persuasive Sub-headline */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Transforme transcrições do YouTube, sites de concorrentes e PDFs em 
          <strong className="text-zinc-200"> roteiros de VSL em 12 passos</strong>, 
          <strong className="text-zinc-200"> páginas de vendas de 14 blocos</strong> e 
          <strong className="text-zinc-200"> anúncios omnichannel</strong> em menos de 3 minutos.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => handleLaunchTemplate(OFFICIAL_TEMPLATES[0])}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-union-accent via-indigo-600 to-union-accentCyan hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-union-accent/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Começar Agora com 100 Créditos Grátis</span>
          </button>

          <a
            href="#templates"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/80 text-zinc-200 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver Templates Prontos</span>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </a>
        </div>

        {/* Social Proof & Metrics Strip */}
        <div className="pt-6 border-t border-zinc-800/60 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-white font-mono">235+</div>
            <div className="text-xs text-zinc-400">Testes Homologados</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-cyan-400 font-mono">&lt; 3s</div>
            <div className="text-xs text-zinc-400">Tempo de Planejamento</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-purple-400 font-mono">85%</div>
            <div className="text-xs text-zinc-400">Redução de Custos</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
            <div className="text-xs text-zinc-400">Tipado em Grafo</div>
          </div>
        </div>

        {/* LIVE CANVAS MOCKUP SHOWCASE */}
        <div className="relative pt-6 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2 sm:p-4 shadow-2xl shadow-indigo-950/30 overflow-hidden relative">
            
            {/* Window bar */}
            <div className="flex items-center justify-between pb-3 px-3 border-b border-zinc-800/80 text-xs">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono text-zinc-400 ml-2">union-canvas // Full Funnel Launch Machine</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                  ● PIPELINE DETERMINÍSTICO
                </span>
              </div>
            </div>

            {/* Visual Node Flow Simulation */}
            <div className="py-8 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
              
              {/* Node 1 */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700/80 space-y-2 text-left relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">INPUT</span>
                  <Globe className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-xs font-bold text-white">YouTube / Web Source</div>
                <div className="text-[11px] text-zinc-400">Ingestão de dados brutos & transcrição automática</div>
                <div className="pt-2 border-t border-zinc-800 flex justify-end">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" title="Porta Transcript" />
                </div>
              </div>

              {/* Node 2 */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700/80 space-y-2 text-left relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">AI AGENT</span>
                  <Cpu className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-xs font-bold text-white">Target Avatar Analyst</div>
                <div className="text-[11px] text-zinc-400">Dores viscerais, objeções e perfil psicográfico</div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-purple-300">Claude 3.7</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                </div>
              </div>

              {/* Node 3 */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700/80 space-y-2 text-left relative shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">COPY ENGINE</span>
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs font-bold text-white">12-Step VSL Script</div>
                <div className="text-[11px] text-zinc-400">Roteiro persuasivo completo com ganchos e CTA</div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-amber-300">DeepSeek R1</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Node 4 */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-emerald-500/40 space-y-2 text-left relative shadow-lg bg-emerald-950/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">OUTPUT</span>
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">Omnichannel Ads Matrix</div>
                <div className="text-[11px] text-zinc-400">Criativos para Meta, Google e TikTok formatados</div>
                <div className="pt-2 border-t border-emerald-900/40 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-emerald-400">GPT-4o Ready</span>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </div>
              </div>

            </div>

            {/* Callout inside Mockup */}
            <div className="bg-zinc-900/90 rounded-xl p-3 border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400 flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-union-accent" />
                <span>Interaja visualmente ligando qualquer porta de dados pelo mouse.</span>
              </span>
              <button
                onClick={onEnterWorkspace}
                className="text-xs text-union-accent font-semibold hover:underline flex items-center gap-1"
              >
                <span>Experimentar no Canvas</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>

      </section>

      {/* TICKER DE MODELOS & PROVEDORES SUPORTADOS */}
      <section className="relative z-10 py-10 border-y border-zinc-800/80 bg-zinc-950/50">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Orquestração Unificada com os Principais Provedores de Inteligência do Mundo
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-80">
            <span className="text-sm font-semibold font-mono text-zinc-300">Anthropic Claude 3.7</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm font-semibold font-mono text-zinc-300">DeepSeek R1</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm font-semibold font-mono text-zinc-300">OpenAI GPT-4o</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm font-semibold font-mono text-zinc-300">Google Gemini 1.5</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm font-semibold font-mono text-zinc-300">YouTube Data API</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm font-semibold font-mono text-zinc-300">Meta & Google Ads</span>
          </div>
        </div>
      </section>

      {/* BENTO GRID DE RECURSOS (SUPERPOWERS) */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-union-accent">
            Arquitetura de Nova Geração
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            As 4 Superpotências da Engenharia UNION.AI
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Elimine o gargalo manual na produção de copys e ativos de marketing com uma esteira automatizada de dados reais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Bento Card 1: Data Bus */}
          <div className="md:col-span-2 p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-union-accent/50 transition-all space-y-4 relative overflow-hidden group">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">UNION Data Bus Tipado com Validação em Tempo Real</h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Diferente de ferramentas de automação genéricas que quebram silenciosamente com formatos desconhecidos, o UNION.AI valida cada pacote de dados na porta de conexão (`DOCUMENT`, `TRANSCRIPT`, `TABLE`, `AI_RESPONSE`), sugerindo auto-transformadores sem interrupções no pipeline.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">Type-Safe</span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-purple-300 border border-zinc-700">Zero Context Loss</span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-emerald-300 border border-zinc-700">Auto-Transformer</span>
            </div>
          </div>

          {/* Bento Card 2: Multi Model */}
          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-union-accent/50 transition-all space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Orquestração Multi-Modelos</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Combine Claude 3.7 para persuasão profunda, DeepSeek R1 para raciocínio analítico e GPT-4o para criativos de anúncios no mesmo fluxo.
              </p>
            </div>
          </div>

          {/* Bento Card 3: Extratores */}
          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-union-accent/50 transition-all space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Extratores de Dados Nativos</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ingestão em tempo real de vídeos do YouTube com pontuação temporal, raspagem web limpa e extração tabular de arquivos PDF.
              </p>
            </div>
          </div>

          {/* Bento Card 4: Motores de Copy */}
          <div className="md:col-span-2 p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-union-accent/50 transition-all space-y-4">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">Motores Persuasivos de Alta Conversão 360°</h4>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Arquitetura de marketing pronta para produção: Roteirizador VSL em 12 etapas, redator de Página de Vendas estruturada em 14 blocos psicológicos comprovados, Dossiê de Persona e Matriz de Anúncios para Meta, TikTok e Google.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2 font-mono text-[10px]">
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-amber-300 border border-zinc-700">14 Blocos Sales Page</span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-amber-300 border border-zinc-700">12 Passos VSL</span>
              <span className="px-2.5 py-1 rounded bg-zinc-800 text-amber-300 border border-zinc-700">Matriz Omnichannel</span>
            </div>
          </div>

        </div>
      </section>

      {/* SHOWCASE INTERATIVO DE TEMPLATES (1-CLICK TRY) */}
      <section id="templates" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            Pronto para Produção
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Templates Oficiais de Escala Imediata
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Selecione uma esteira de marketing validada e carregue diretamente na sua bancada com apenas um clique.
          </p>
        </div>

        {/* Template Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {OFFICIAL_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplateId(tpl.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                selectedTemplateId === tpl.id
                  ? 'bg-zinc-800/90 border-union-accent shadow-lg shadow-union-accent/15'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white uppercase">
                  {tpl.category}
                </span>
                <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  ~{tpl.estimatedCredits} cr
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{tpl.name}</h4>
              <p className="text-[11px] text-zinc-400 line-clamp-2">{tpl.description}</p>
            </button>
          ))}
        </div>

        {/* Selected Template Preview Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold text-white">{selectedTemplate.name}</h4>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {selectedTemplate.nodes.length} Nós Ativos
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                {selectedTemplate.description}
              </p>
            </div>

            <button
              data-testid="landing-launch-template"
              onClick={() => handleLaunchTemplate(selectedTemplate)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-union-accent to-union-accentCyan hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-union-accent/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Carregar Este Template no Workspace</span>
            </button>
          </div>

          {/* Node sequence preview */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Fluxo Topológico de Execução:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {selectedTemplate.nodes.map((node, i) => (
                <div key={node.id} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>Etapa 0{i + 1}</span>
                    <span className="text-union-accent">{node.category}</span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{node.label}</div>
                  <div className="text-[10px] text-zinc-400 truncate font-mono">Tipo: {node.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* CALCULADORA DE ROI & ECONOMIA INTERATIVA */}
      <section id="roi" className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
            <Calculator className="h-3.5 w-3.5" />
            <span>Calculadora de Retorno (ROI)</span>
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Quanto Tempo e Dinheiro Sua Equipe Economiza?
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Simule o impacto de substituir o trabalho manual de cópia e escrita avulsa pela esteira determinística do UNION.AI 2.0.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Sliders Input */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold">Campanhas / Funis produzidos por semana:</span>
                <span className="font-mono text-sm font-bold text-union-accent px-2 py-0.5 rounded bg-union-accent/15 border border-union-accent/30">
                  {weeklyCampaigns} campanhas
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={weeklyCampaigns}
                onChange={(e) => setWeeklyCampaigns(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>1/sem</span>
                <span>10/sem</span>
                <span>20/sem</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold">Tempo manual gasto por campanha (pesquisa + cópia):</span>
                <span className="font-mono text-sm font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                  {hoursPerCampaign} horas
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                value={hoursPerCampaign}
                onChange={(e) => setHoursPerCampaign(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>2 horas</span>
                <span>8 horas</span>
                <span>16 horas</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-gradient-to-br from-zinc-900 to-[#121626] border border-union-accent/40 space-y-4 text-center">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Economia Estimada por Mês:
              </span>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                {hoursSavedPerMonth.toFixed(0)} Horas
              </div>
              <p className="text-xs text-zinc-400">
                Redução de ~90% no tempo operacional de redação e montagem.
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-1">
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Economia Financeira Estimada:</span>
              <div className="text-2xl font-bold text-white font-mono">
                R$ {estimatedCostSavingReal.toLocaleString('pt-BR')} /mês
              </div>
            </div>

            <button
              onClick={onEnterWorkspace}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Liberar Meu Tempo Agora
            </button>
          </div>

        </div>
      </section>

      {/* COMPARATIVO DEFINITIVO */}
      <section id="comparativo" className="relative z-10 py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            Comparativo de Eficiência
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            UNION.AI vs Métodos Antigos
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Veja por que agências e operadores de dados abandonaram chats isolados para construir em esteira visual.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="p-4 font-semibold text-zinc-300">Critério Operacional</th>
                <th className="p-4 font-bold text-white bg-union-accent/15 border-x border-union-accent/30 text-center">
                  UNION.AI 2.0
                </th>
                <th className="p-4 font-semibold text-zinc-400 text-center">Chats Avulsos (ChatGPT/Claude)</th>
                <th className="p-4 font-semibold text-zinc-400 text-center">Automações Convencionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              <tr>
                <td className="p-4 font-medium text-white">Barramento de Dados Tipado</td>
                <td className="p-4 text-center bg-union-accent/10 border-x border-union-accent/30 text-emerald-400 font-bold">
                  ✓ Sim (Type-Safe Bus)
                </td>
                <td className="p-4 text-center text-zinc-400">✗ Texto plano sem validação</td>
                <td className="p-4 text-center text-zinc-400">✗ JSON solto com erros em runtime</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Roteamento Multi-Modelos Dinâmico</td>
                <td className="p-4 text-center bg-union-accent/10 border-x border-union-accent/30 text-emerald-400 font-bold">
                  ✓ Sim (Claude + DeepSeek + GPT)
                </td>
                <td className="p-4 text-center text-zinc-400">✗ Preso a um único provedor</td>
                <td className="p-4 text-center text-zinc-400">△ Complexo de configurar</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Extratores de Dados em Tempo Real</td>
                <td className="p-4 text-center bg-union-accent/10 border-x border-union-accent/30 text-emerald-400 font-bold">
                  ✓ YouTube, Sites & PDFs Nativos
                </td>
                <td className="p-4 text-center text-zinc-400">✗ Cópia e cola manual constante</td>
                <td className="p-4 text-center text-zinc-400">△ Requer webhooks e integrações externas</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Histórico de Versões & Rollback Atômico</td>
                <td className="p-4 text-center bg-union-accent/10 border-x border-union-accent/30 text-emerald-400 font-bold">
                  ✓ Snapshots instantâneos 1-Click
                </td>
                <td className="p-4 text-center text-zinc-400">✗ Histórico linear e difícil de auditar</td>
                <td className="p-4 text-center text-zinc-400">△ Apenas logs brutos</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Previsão e Auditoria de Créditos</td>
                <td className="p-4 text-center bg-union-accent/10 border-x border-union-accent/30 text-emerald-400 font-bold">
                  ✓ Cálculo exato antes de rodar
                </td>
                <td className="p-4 text-center text-zinc-400">✗ Assinatura fixa ou surpresa na fatura</td>
                <td className="p-4 text-center text-zinc-400">✗ Consumo opaco</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING PLANS */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Preços Transparentes
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Escolha o Plano Ideal para a Sua Operação
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Pague pelo que usar com créditos pré-pagos ou planos mensais escaláveis com faturamento empresarial.
          </p>

          {/* Toggle Monthly / Annual */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 mt-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'monthly' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-union-accent text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Plan 1: Starter */}
          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Starter Creator</h4>
                <p className="text-xs text-zinc-400">Para criadores individuais e pequenos canais.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  {billingCycle === 'annual' ? 'R$ 79' : 'R$ 99'}
                </span>
                <span className="text-xs text-zinc-400">/mês</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span><strong>150 créditos</strong> mensais inclusos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Extrator de YouTube & Web Scraper</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Acesso aos 4 Templates Oficiais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Modelos OpenAI & Anthropic</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterWorkspace}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Começar com Starter
            </button>
          </div>

          {/* Plan 2: Pro Agency (Highlight) */}
          <div className="p-7 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-[#121626] border-2 border-union-accent space-y-6 flex flex-col justify-between shadow-xl shadow-union-accent/15 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-union-accent text-white text-[10px] font-mono font-bold uppercase tracking-wider">
              Mais Recomendado
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Pro & Agências</h4>
                <p className="text-xs text-zinc-400">Para operadores de escala e equipes de alta performance.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">
                  {billingCycle === 'annual' ? 'R$ 199' : 'R$ 249'}
                </span>
                <span className="text-xs text-zinc-400">/mês</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span><strong>600 créditos</strong> mensais inclusos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>DeepSeek R1 + Claude 3.7 + GPT-4o</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Extrator de Tabelas de PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Webhooks Externos (Gate 15)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Snapshots & Histórico Ilimitados</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterWorkspace}
              className="w-full py-2.5 rounded-xl bg-union-accent hover:bg-union-accent/90 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.01]"
            >
              Garantir Plano Pro
            </button>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="p-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Enterprise</h4>
                <p className="text-xs text-zinc-400">Para grandes empresas com necessidade de governança.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">Personalizado</span>
              </div>
              <ul className="space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Créditos customizados em lote</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>RBAC & Múltiplas Organizações</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Telemetria Prometheus Dedicada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>SLA 99.9% & Suporte Prioritário</span>
                </li>
              </ul>
            </div>
            <button
              onClick={onEnterWorkspace}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Falar com Especialista
            </button>
          </div>

        </div>
      </section>

      {/* FAQ SECTION (ACCORDION) */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Dúvidas Frequentes</h2>
          <h3 className="text-3xl font-extrabold text-white">Perguntas & Respostas</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 transition-transform text-zinc-400 ${openFaqIndex === idx ? 'rotate-180 text-union-accent' : ''}`} />
              </button>
              {openFaqIndex === idx && (
                <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER LEAD CAPTURE STRIP */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base font-bold text-white flex items-center justify-center md:justify-start gap-2">
              <Mail className="h-4 w-4 text-union-accent" />
              <span>Receba Novos Templates & Insights de Engenharia IA</span>
            </h4>
            <p className="text-xs text-zinc-400">
              Junte-se a +3.000 profissionais de dados e copywriters de alta performance. Sem spam.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="flex w-full md:w-auto items-center gap-2">
            {newsletterSuccess ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <CheckCircle2 className="h-4 w-4" />
                <span>Inscrição confirmada com sucesso!</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Seu melhor e-mail..."
                  required
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 outline-none focus:border-union-accent w-full md:w-64"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-union-accent hover:bg-union-accent/90 text-white font-semibold text-xs shadow-md transition-colors shrink-0 cursor-pointer"
                >
                  Inscrever
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      {/* FINAL BOTTOM CTA */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-indigo-950/60 via-zinc-900 to-cyan-950/40 border border-indigo-500/30 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Pronto para Escalar Suas Campanhas com Inteligência Visual?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">
              Abra agora o Workspace do UNION.AI 2.0 e teste seu primeiro pipeline em menos de 3 minutos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnterWorkspace}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-union-accent to-union-accentCyan text-white font-bold text-sm shadow-xl shadow-union-accent/25 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Acessar Workspace Grátis</span>
            </button>
          </div>
        </div>
      </section>

      {/* RICH MULTI-COLUMN FOOTER */}
      <footer className="relative z-10 pt-16 pb-12 border-t border-zinc-900 bg-black/80 text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-zinc-900">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="h-7 w-7 rounded-lg bg-union-accent flex items-center justify-center text-white shadow-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-sm tracking-wide text-white">UNION.AI 2.0</span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
              Plataforma de Engenharia Visual de IA, Orquestração em Grafo e Barramento de Dados para Operações de Marketing de Alto Impacto.
            </p>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-emerald-400 pt-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SLA 99.9% • Infraestrutura WAL Multi-Inquilino</span>
            </div>
          </div>

          {/* Col 2: Produto */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Produto</h5>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <button onClick={onEnterWorkspace} className="hover:text-white transition-colors cursor-pointer">
                  Canvas Workspace
                </button>
              </li>
              <li>
                <a href="#templates" className="hover:text-white transition-colors">
                  Templates Oficiais
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  UNION Data Bus
                </a>
              </li>
              <li>
                <a href="#roi" className="hover:text-white transition-colors">
                  Calculadora ROI
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Engenharia & Docs */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Engenharia</h5>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <button onClick={() => openLegal('docs')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Documentação Técnica
                </button>
              </li>
              <li>
                <a href="/api/health" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>API Healthcheck</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="/metrics" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Métricas Prometheus</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Governança & Legal */}
          <div className="space-y-2.5">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider">Legal & Compliance</h5>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button onClick={() => openLegal('terms')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Termos de Uso
                </button>
              </li>
              <li>
                <button onClick={() => openLegal('security')} className="hover:text-white transition-colors cursor-pointer text-left">
                  Segurança & LGPD
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px] gap-3">
          <div>
            © 2026 UNION.AI Technologies. Todos os direitos reservados.
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => openLegal('privacy')} className="hover:text-zinc-300">Privacidade</button>
            <span>•</span>
            <button onClick={() => openLegal('terms')} className="hover:text-zinc-300">Termos</button>
            <span>•</span>
            <button onClick={() => openLegal('security')} className="hover:text-zinc-300">Conformidade</button>
          </div>
        </div>
      </footer>

      {/* FLOATING QUICK SCROLL CONTROLS (TO BOTTOM & TO TOP) */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col space-y-2">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="h-9 w-9 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105"
          title="Rolar para o Topo da Página"
          aria-label="Rolar para o topo"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="h-9 w-9 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105"
          title="Rolar até a Última Página / Rodapé"
          aria-label="Rolar até o final"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>

      {/* FLOATING COOKIE & PRIVACY BANNER */}
      {showCookieBanner && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-md flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <strong className="text-white font-semibold">Privacidade & Cookies Estritamente Necessários</strong>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Utilizamos cookies e armazenamento local exclusivamente para manter sua sessão, preferências e integridade de execução de workflows em conformidade com a LGPD e GDPR.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 pt-1 border-t border-zinc-800/80">
            <button
              onClick={() => openLegal('privacy')}
              className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 transition-colors"
            >
              Ler Política
            </button>
            <button
              onClick={handleAcceptCookies}
              className="px-3.5 py-1.5 rounded-lg bg-union-accent hover:bg-union-accent/90 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Concordar & Fechar
            </button>
          </div>
        </div>
      )}

      {/* LEGAL & DOCUMENTATION MODAL */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

    </div>
  );
};
