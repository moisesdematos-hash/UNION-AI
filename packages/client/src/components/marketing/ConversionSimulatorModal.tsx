import { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Sun, 
  Snowflake, 
  AlertTriangle, 
  Wand2, 
  CheckCircle2, 
  X, 
  TrendingUp, 
  Users, 
  Copy, 
  Check, 
  RefreshCw,
  Target,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ConversionSimulationResult, BlockEvaluation, SyntheticPersona } from '@union/shared';

interface ConversionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationResult?: ConversionSimulationResult | null;
  onAutoHeal?: (blockIndex: number, healedContent: string) => void;
}

export function ConversionSimulatorModal({
  isOpen,
  onClose,
  simulationResult,
  onAutoHeal
}: ConversionSimulatorModalProps) {
  const [selectedPersona, setSelectedPersona] = useState<SyntheticPersona | null>(null);
  const [healingBlockIndex, setHealingBlockIndex] = useState<number | null>(null);
  const [copiedBlockId, setCopiedBlockId] = useState<number | null>(null);
  const [healedBlocks, setHealedBlocks] = useState<Record<number, string>>({});
  const [isHealingLoading, setIsHealingLoading] = useState(false);

  if (!isOpen) return null;

  // Mock sample simulation if none provided
  const sim: ConversionSimulationResult = simulationResult || {
    id: 'sim-default',
    campaignName: 'Simulação Preditiva de Conversão (14 Blocos)',
    conversionProbabilityScore: 78,
    estimatedConversionRate: '4.8% - 7.2%',
    retentionIndex: 82,
    summaryVerdict: 'Copy com forte apelo emocional e abertura magnética. Identificamos 1 ponto crítico de desistência no bloco de preço que pode ser sanado com a Auto-Cura de Garantia Blindada.',
    topStrengths: [
      'Gancho de alta curiosidade no Bloco 1 com retenção >85%',
      'Storytelling que ressoa fortemente com o arquétipo Emocional',
      'Clareza técnica consistente no mecanismo único'
    ],
    topFatalFlaws: [
      'Seção de preço sem garantia incondicional visível (Fricção crítica para Céticos e Econômicos).'
    ],
    autoHealingAvailable: true,
    timestamp: Date.now(),
    personas: [
      {
        id: 'persona-skeptic',
        name: 'Dr. Roberto Meirelles',
        archetype: 'SKEPTIC',
        description: 'Empresário tradicional focado em contratos e auditoria.',
        skepticismLevel: 9,
        decisionDriver: 'Garantias blindadas e métricas auditáveis.',
        verdict: 'CONSIDER',
        primaryObjection: 'Promessa ousada sem termo formal de garantia.',
        quote: 'Se tiver garantia de reembolso em contrato, eu testo agora.'
      },
      {
        id: 'persona-busy-exec',
        name: 'Ana Lívia Siqueira',
        archetype: 'BUSY_EXECUTIVE',
        description: 'CMO com foco total em velocidade de implantação.',
        skepticismLevel: 7,
        decisionDriver: 'Tempo economizado e facilidade de uso.',
        verdict: 'BUY',
        primaryObjection: 'Quero ver os primeiros resultados na primeira semana.',
        quote: 'Direto ao ponto. Resolve nosso gargalo operacional.'
      },
      {
        id: 'persona-budget-saver',
        name: 'Carlos Mendes',
        archetype: 'BUDGET_SAVER',
        description: 'Produtor com fluxo de caixa inicial apertado.',
        skepticismLevel: 8,
        decisionDriver: 'Parcelamento em 12x e risco zero.',
        verdict: 'CONSIDER',
        primaryObjection: 'Preciso recuperar o investimento rápido.',
        quote: 'Com o parcelamento flexível fica viável começar.'
      },
      {
        id: 'persona-analytical',
        name: 'Mariana Costa',
        archetype: 'ANALYTICAL',
        description: 'Engenheira de dados que analisa integridade.',
        skepticismLevel: 8,
        decisionDriver: 'Arquitetura técnica e automação estável.',
        verdict: 'BUY',
        primaryObjection: 'Como funciona o barramento de dados?',
        quote: 'Excelente estrutura de pacotes e tipos estritos.'
      },
      {
        id: 'persona-emotional',
        name: 'Lucas Rocha',
        archetype: 'EMOTIONAL',
        description: 'Criador em busca de validação e liberdade.',
        skepticismLevel: 5,
        decisionDriver: 'Histórias reais e senso de comunidade.',
        verdict: 'BUY',
        primaryObjection: 'Será que eu também consigo?',
        quote: 'Me identifiquei muito com a dor descrita no início!'
      }
    ],
    heatmap: [
      {
        blockIndex: 0,
        blockName: 'Bloco 1: Headline & Hero',
        originalSnippet: 'Como Multiplicar seu Faturamento com IA Autônoma sem Aumentar sua Folha de Pagamento em 14 Dias.',
        rating: 'HOT',
        score: 9.5,
        persuasionStrength: 'Gancho magnético com alto CTR e ancoragem de benefício tangível.',
        frictionPoints: [],
        suggestedImprovement: 'Mantenha a autoridade logo na linha de apoio.'
      },
      {
        blockIndex: 1,
        blockName: 'Bloco 2: Problema & Agitação',
        originalSnippet: 'Você passa 80% do dia formatando criativos e brigando com freelancers atrasados enquanto seus concorrentes aceleram.',
        rating: 'WARM',
        score: 8.2,
        persuasionStrength: 'Diagnóstico visceral que gera identificação imediata.',
        frictionPoints: ['Pode soar agressivo para iniciantes.'],
        suggestedImprovement: 'Conecte suavemente com o vilão comum no próximo bloco.'
      },
      {
        blockIndex: 2,
        blockName: 'Bloco 11: Preço & Oferta',
        originalSnippet: 'Apenas 12x de R$ 97,00 ou R$ 997,00 à vista para acesso anual completo.',
        rating: 'DROP_OFF',
        score: 3.8,
        persuasionStrength: 'Apresentação fria de preço sem reversão de risco.',
        frictionPoints: [
          'Ausência de garantia de 30 dias com reembolso total',
          'Sensação de risco imediato para perfis Céticos'
        ],
        suggestedImprovement: 'Injete Garantia Incondicional Blindada de 30 dias com Risco Zero.'
      }
    ]
  };

  const activePersona = selectedPersona || sim.personas[0];

  const handleAutoHeal = async (block: BlockEvaluation) => {
    setIsHealingLoading(true);
    setHealingBlockIndex(block.blockIndex);

    try {
      const response = await fetch('/api/marketing/auto-heal-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: `block-${block.blockIndex}`,
          blockName: block.blockName,
          originalContent: block.originalSnippet,
          personaArchetype: activePersona.archetype,
          frictionPoint: block.frictionPoints.join('; ') || 'Falta de garantia ou clareza',
          suggestedAction: block.suggestedImprovement
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data?.healedContent) {
        setHealedBlocks(prev => ({
          ...prev,
          [block.blockIndex]: resData.data.healedContent
        }));
        if (onAutoHeal) {
          onAutoHeal(block.blockIndex, resData.data.healedContent);
        }
      }
    } catch {
      // Fallback local heal
      const localHeal = `${block.originalSnippet}\n\n🛡️ **GARANTIA BLINDADA DE RISCO ZERO (30 DIAS)**:\nTeste por 30 dias. Se não comprovar o retorno financeiro, 1 clique e devolvemos 100% do seu dinheiro.`;
      setHealedBlocks(prev => ({
        ...prev,
        [block.blockIndex]: localHeal
      }));
      if (onAutoHeal) {
        onAutoHeal(block.blockIndex, localHeal);
      }
    } finally {
      setIsHealingLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockId(index);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  const getTemperatureBadge = (rating: 'HOT' | 'WARM' | 'COLD' | 'DROP_OFF') => {
    switch (rating) {
      case 'HOT':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="w-3.5 h-3.5 fill-amber-400" /> HOT (Alta Conversão)
          </span>
        );
      case 'WARM':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Sun className="w-3.5 h-3.5" /> WARM (Engajamento)
          </span>
        );
      case 'COLD':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <Snowflake className="w-3.5 h-3.5" /> COLD (Risco de Dispersão)
          </span>
        );
      case 'DROP_OFF':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 fill-red-400" /> DROP-OFF (Abandono Crítico)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  AI Conversion Simulator & Heatmap Visualizer
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Chave de Ouro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoria preditiva com 5 Personas Sintéticas • Cálculo de CPS • Auto-Cura de Fricção em 1 Clique
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Metric Bar */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          {/* CPS Gauge */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Conversion Probability Score (CPS)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-cyan-400">{sim.conversionProbabilityScore}</span>
                <span className="text-xs text-slate-500 font-bold">/ 100</span>
              </div>
              <span className="text-[10px] text-cyan-300/80 font-medium">Classificação: Alta Persuasão</span>
            </div>
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div className="w-full h-full rounded-full border-4 border-slate-800 border-t-cyan-400 border-r-indigo-500 animate-spin-slow" />
              <TrendingUp className="w-5 h-5 text-cyan-400 absolute" />
            </div>
          </div>

          {/* Taxa de Conversão Estimada */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Conversão Estimada
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {sim.estimatedConversionRate}
              </div>
              <span className="text-[10px] text-emerald-300/80 font-medium">Acima do benchmark da indústria</span>
            </div>
            <Sparkles className="w-6 h-6 text-emerald-400/80" />
          </div>

          {/* Índice de Retenção */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Retenção no Funil
              </span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {sim.retentionIndex}%
              </div>
              <span className="text-[10px] text-indigo-300/80 font-medium">Chegam até o Bloco de Oferta</span>
            </div>
            <Zap className="w-6 h-6 text-indigo-400/80" />
          </div>

          {/* Personas em Alinhamento */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Auditoria de Personas
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {sim.personas.filter(p => p.verdict === 'BUY').length} de {sim.personas.length}
              </div>
              <span className="text-[10px] text-amber-300/80 font-medium">Decisão de compra imediata</span>
            </div>
            <Users className="w-6 h-6 text-amber-400/80" />
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
          {/* Left Column: 5 Synthetic Personas (4 Cols) */}
          <div className="col-span-4 border-r border-slate-800 p-5 overflow-y-auto bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> 5 Personas Sintéticas Calibradas
              </h3>
              <span className="text-[10px] text-slate-500">Selecione para inspecionar</span>
            </div>

            <div className="space-y-3">
              {sim.personas.map((persona) => {
                const isSelected = activePersona.id === persona.id;
                return (
                  <div
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          persona.verdict === 'BUY' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <span className="font-bold text-sm text-slate-200">{persona.name}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        persona.verdict === 'BUY' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {persona.verdict}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {persona.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Ceticismo: {persona.skepticismLevel}/10</span>
                      <span className="text-cyan-400/90 font-medium">{persona.archetype}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Persona Deep View */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 mt-4 space-y-2.5">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Veredito de {activePersona.name}
              </h4>
              <p className="text-xs italic text-slate-300 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                "{activePersona.quote}"
              </p>
              <div className="text-[11px] text-slate-400">
                <strong className="text-slate-300">Gatilho de Compra:</strong> {activePersona.decisionDriver}
              </div>
              {activePersona.primaryObjection && (
                <div className="text-[11px] text-amber-300/90">
                  <strong className="text-amber-400">Principal Objeção:</strong> {activePersona.primaryObjection}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Heatmap & 1-Click Auto-Healing (8 Cols) */}
          <div className="col-span-8 p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" /> Mapa de Calor Psicológico dos Blocos (Heatmap)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Termômetro de persuasão bloco a bloco com diagnóstico de atrito e auto-cura assistida
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Legenda:</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Hot" />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" title="Warm" />
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" title="Drop-off" />
              </div>
            </div>

            {/* Blocks List */}
            <div className="space-y-4">
              {sim.heatmap.map((block) => {
                const isHealed = !!healedBlocks[block.blockIndex];
                const contentToDisplay = healedBlocks[block.blockIndex] || block.originalSnippet;

                return (
                  <div
                    key={block.blockIndex}
                    className={`rounded-xl border p-5 transition-all ${
                      block.rating === 'DROP_OFF' && !isHealed
                        ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/30'
                        : isHealed
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-slate-500">
                            #{block.blockIndex + 1}
                          </span>
                          <h4 className="text-base font-bold text-white">
                            {block.blockName}
                          </h4>
                          {isHealed ? (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <ShieldCheck className="w-3.5 h-3.5" /> AUTO-CURADO (Score 9.8)
                            </span>
                          ) : (
                            getTemperatureBadge(block.rating)
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {block.persuasionStrength}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(contentToDisplay, block.blockIndex)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Copiar texto do bloco"
                        >
                          {copiedBlockId === block.blockIndex ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {(block.rating === 'DROP_OFF' || block.rating === 'COLD') && !isHealed && (
                          <button
                            onClick={() => handleAutoHeal(block)}
                            disabled={isHealingLoading && healingBlockIndex === block.blockIndex}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-white shadow-lg shadow-amber-500/20 transition disabled:opacity-50 cursor-pointer"
                          >
                            {isHealingLoading && healingBlockIndex === block.blockIndex ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Auto-Curando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-3.5 h-3.5" /> 1-Click Auto-Heal
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Block Text Preview */}
                    <div className="mt-4 p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs leading-relaxed text-slate-300 whitespace-pre-line font-mono">
                      {contentToDisplay}
                    </div>

                    {/* Friction Points & Suggestion */}
                    {block.frictionPoints.length > 0 && !isHealed && (
                      <div className="mt-3 p-3 rounded-lg bg-red-950/30 border border-red-900/50 space-y-1">
                        <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Pontos de Atrito Detectados:
                        </div>
                        <ul className="text-xs text-red-200/90 list-disc list-inside space-y-0.5">
                          {block.frictionPoints.map((fp, i) => (
                            <li key={i}>{fp}</li>
                          ))}
                        </ul>
                        <div className="text-[11px] text-amber-300 mt-2">
                          <strong>Ação Recomendada:</strong> {block.suggestedImprovement}
                        </div>
                      </div>
                    )}

                    {isHealed && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Objeção eliminada! Injetada garantia de 30 dias com reversão de risco zero.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
