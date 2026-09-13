import { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { 
  Youtube, 
  Globe, 
  FileText, 
  FileCode, 
  Scissors, 
  MessageSquare, 
  BarChart3, 
  PenTool, 
  Cpu, 
  Table as TableIcon, 
  Download, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  Play,
  Loader2,
  BookOpen,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { EbookReaderModal } from '../modals/EbookReaderModal.js';
import { NodeDefinition, NodeCategory, NodeState } from '@union/shared';
import { getDataTypeStyle } from '../../utils/portColors.js';
import { useCanvasStore } from '../../store/canvasStore.js';

export interface UnionNodeData extends NodeDefinition {
  onConfigChange?: (key: string, value: unknown) => void;
}

const CATEGORY_COLORS: Record<NodeCategory, { border: string; headerBg: string; badge: string; iconColor: string }> = {
  SOURCE: {
    border: 'border-blue-500/40 hover:border-blue-500/80',
    headerBg: 'bg-blue-500/10',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    iconColor: 'text-blue-400'
  },
  EXTRACTOR: {
    border: 'border-amber-500/40 hover:border-amber-500/80',
    headerBg: 'bg-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    iconColor: 'text-amber-400'
  },
  AI: {
    border: 'border-indigo-500/40 hover:border-indigo-500/80 shadow-lg shadow-indigo-500/10',
    headerBg: 'bg-indigo-500/10',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    iconColor: 'text-indigo-400'
  },
  TRANSFORM: {
    border: 'border-cyan-500/40 hover:border-cyan-500/80',
    headerBg: 'bg-cyan-500/10',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    iconColor: 'text-cyan-400'
  },
  OUTPUT: {
    border: 'border-emerald-500/40 hover:border-emerald-500/80',
    headerBg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    iconColor: 'text-emerald-400'
  },
  INPUT: {
    border: 'border-slate-500/40 hover:border-slate-500/80',
    headerBg: 'bg-slate-500/10',
    badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    iconColor: 'text-slate-400'
  },
  UNDERSTAND: {
    border: 'border-purple-500/40 hover:border-purple-500/80',
    headerBg: 'bg-purple-500/10',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    iconColor: 'text-purple-400'
  }
};

function getNodeIcon(type: string, category: NodeCategory) {
  switch (type) {
    case 'source-youtube':
      return <Youtube className="h-4 w-4" />;
    case 'source-website':
      return <Globe className="h-4 w-4" />;
    case 'source-pdf':
      return <FileText className="h-4 w-4" />;
    case 'source-text':
      return <FileCode className="h-4 w-4" />;
    case 'extractor-transcript':
      return <Scissors className="h-4 w-4" />;
    case 'ai-chat':
      return <MessageSquare className="h-4 w-4" />;
    case 'ai-analyst':
      return <BarChart3 className="h-4 w-4" />;
    case 'ai-writer':
      return <PenTool className="h-4 w-4" />;
    case 'ai-ebook-forge':
      return <BookOpen className="h-4 w-4 text-amber-400" />;
    case 'ai-router':
      return <Cpu className="h-4 w-4" />;
    case 'transform-formatter':
      return <TableIcon className="h-4 w-4" />;
    case 'output-content':
      return <Download className="h-4 w-4" />;
    default:
      return category === 'AI' ? <Sparkles className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  }
}

function renderStateBadge(state: NodeState) {
  switch (state) {
    case 'QUEUED':
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Clock className="h-2.5 w-2.5 animate-pulse" />
          QUEUED
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          PROCESSING
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-2.5 w-2.5" />
          COMPLETED
        </span>
      );
    case 'FAILED':
      return (
        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-2.5 w-2.5" />
          FAILED
        </span>
      );
    case 'IDLE':
    default:
      return (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          IDLE
        </span>
      );
  }
}

export function UnionNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as UnionNodeData;
  const { duplicateSelected, deleteSelected, edges, updateNodeData, executeWorkflow } = useCanvasStore();
  const [showMenu, setShowMenu] = useState(false);
  const [config, setConfig] = useState(nodeData.config || {});
  const [isExtracting, setIsExtracting] = useState(false);
  const [showReaderModal, setShowReaderModal] = useState(false);
  const [showChaptersList, setShowChaptersList] = useState(false);

  useEffect(() => {
    if (nodeData.config) {
      setConfig(nodeData.config);
    }
  }, [nodeData.config]);

  const categoryStyle = CATEGORY_COLORS[nodeData.category] || CATEGORY_COLORS.AI;

  const handleConfigUpdate = (key: string, value: unknown) => {
    const updated = { ...config, [key]: value };
    setConfig(updated);
    if (nodeData.onConfigChange) {
      nodeData.onConfigChange(key, value);
    }
  };

  const handleExecuteExtractor = async () => {
    setIsExtracting(true);
    updateNodeData(id, { state: 'PROCESSING' });
    const startTime = Date.now();

    try {
      let endpoint = '';
      let body: Record<string, unknown> = {};

      if (nodeData.type === 'source-youtube') {
        endpoint = '/api/extractors/youtube';
        body = {
          url: config.url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          originNodeId: id
        };
      } else if (nodeData.type === 'source-website') {
        endpoint = '/api/extractors/website';
        body = {
          url: config.url || 'https://example.com',
          originNodeId: id
        };
      } else if (nodeData.type === 'source-pdf') {
        endpoint = '/api/extractors/pdf';
        body = {
          content: config.content || 'Executive Summary\n\nUNION.AI is an autonomous marketing operating system.',
          fileName: config.fileName || 'document.pdf',
          originNodeId: id
        };
      } else if (nodeData.type === 'source-text') {
        endpoint = '/api/extractors/text';
        body = {
          text: config.text || 'UNION.AI transforms ideas into high-converting digital assets.',
          originNodeId: id
        };
      }

      if (!endpoint) return;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Falha ao executar extrator');
      }

      const durationMs = Date.now() - startTime;
      const raw = json.data.raw;
      const tokens = raw.wordCount || raw.estimatedTokens || 100;
      const credits = 0.01;

      updateNodeData(id, {
        state: 'COMPLETED',
        executionInfo: {
          durationMs,
          tokens,
          credits
        },
        config: {
          ...config,
          extractedSummary: raw.title || raw.cleanText?.slice(0, 60) || 'Extração concluída'
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro na extração';
      updateNodeData(id, {
        state: 'FAILED',
        executionInfo: {
          durationMs: Date.now() - startTime,
          error: message
        }
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExecuteEbookForge = async () => {
    setIsExtracting(true);
    updateNodeData(id, { state: 'PROCESSING' });
    const startTime = Date.now();

    try {
      const incomingTopicEdges = edges.filter(e => e.target === id && e.targetHandle === 'in-topic');
      const incomingContextEdges = edges.filter(e => e.target === id && e.targetHandle === 'in-context');
      const incomingAvatarEdges = edges.filter(e => e.target === id && e.targetHandle === 'in-avatar');

      let dynamicPrompt = String(config.topic || '').trim();
      let dynamicNiche = String(config.niche || '').trim();

      const { nodes } = useCanvasStore.getState();
      if (incomingTopicEdges.length > 0) {
        const sourceNode = nodes.find(n => n.id === incomingTopicEdges[0].source);
        if (sourceNode?.data) {
          const sData = sourceNode.data as Record<string, any>;
          const sourceText = sData.config?.extractedSummary || sData.config?.aiSummary || sData.config?.fullOutput || sData.config?.text;
          if (sourceText) {
            dynamicPrompt = dynamicPrompt ? dynamicPrompt + ' - ' + sourceText.slice(0, 150) : sourceText.slice(0, 150);
          }
        }
      }

      if (incomingContextEdges.length > 0) {
        const sourceNode = nodes.find(n => n.id === incomingContextEdges[0].source);
        if (sourceNode?.data) {
          const sData = sourceNode.data as Record<string, any>;
          const contextText = sData.config?.content || sData.config?.fullOutput || sData.config?.extractedSummary;
          if (contextText) {
            dynamicPrompt += '\n[Contexto/Pesquisa]: ' + contextText.slice(0, 300);
          }
        }
      }

      if (incomingAvatarEdges.length > 0) {
        const sourceNode = nodes.find(n => n.id === incomingAvatarEdges[0].source);
        if (sourceNode?.data) {
          const sData = sourceNode.data as Record<string, any>;
          const avatarTarget = sData.config?.targetAudience || sData.config?.demographics || sData.config?.prompt;
          if (avatarTarget && !dynamicNiche) {
            dynamicNiche = String(avatarTarget);
          }
        }
      }

      const effectivePrompt = dynamicPrompt || 'Estratégia e Execução Prática com Inteligência Artificial';
      const effectiveNiche = dynamicNiche || 'Negócios e Marketing Digital';
      const effectiveTitle = String(config.title || '').trim() || ('Manual Estratégico de ' + effectivePrompt.slice(0, 35));
      const effectivePages = Number(config.pageCount || 10);
      const effectiveWords = Number(config.wordsPerChapter || 1000);

      const res = await fetch('/api/chat/forge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EBOOK',
          prompt: effectivePrompt,
          title: effectiveTitle,
          targetNiche: effectiveNiche,
          pageCount: effectivePages,
          wordsPerChapter: effectiveWords,
          tone: config.tone || 'didactic',
          audienceLevel: config.audienceLevel || 'beginner'
        })
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Falha ao forjar E-book no Canvas');
      }

      const ebookData = json.data;
      const durationMs = Date.now() - startTime;
      const totalWords = ebookData.totalWords || ebookData.totalWordCount || ebookData.chapters?.reduce((acc: number, c: any) => acc + (c.wordCount || 0), 0) || 4200;

      const updatedConfig = {
        ...config,
        generatedEbook: ebookData,
        aiSummary: ebookData.title + ' (' + totalWords.toLocaleString() + ' palavras, ' + (ebookData.chapters?.length || 4) + ' capítulos > 1.000 pal/cap)',
        fullOutput: ebookData.fullMarkdown || ''
      };

      setConfig(updatedConfig);

      updateNodeData(id, {
        state: 'COMPLETED',
        executionInfo: {
          durationMs,
          tokens: totalWords,
          credits: 0.05
        },
        config: updatedConfig
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar e-book';
      updateNodeData(id, {
        state: 'FAILED',
        executionInfo: {
          durationMs: Date.now() - startTime,
          error: message
        }
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExecuteAiNode = async () => {
    setIsExtracting(true);
    updateNodeData(id, { state: 'PROCESSING' });
    const startTime = Date.now();

    try {
      if (nodeData.type === 'ai-router') {
        const res = await fetch('/api/ai/router/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: id,
            text: config.prompt || 'Classificar e rotear tarefa com eficiência máxima',
            optimizeFor: config.optimizeFor || 'balanced'
          })
        });

        const json = await res.json();
        if (!res.ok || json.status !== 'success') {
          throw new Error(json.message || 'Falha ao executar AI Router');
        }

        const raw = json.data.raw;
        const routing = json.data.routing;
        updateNodeData(id, {
          state: 'COMPLETED',
          executionInfo: {
            durationMs: raw.durationMs,
            tokens: raw.tokens.totalTokens,
            credits: raw.creditsCost
          },
          config: {
            ...config,
            routerInfo: routing,
            aiSummary: `Roteado para ${routing.recommendation.recommendedModel} (${routing.recommendation.benchmarkComparison.savingsPercent}% economia)`,
            fullOutput: raw.content
          }
        });
        return;
      }

      const res = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: id,
          role: nodeData.type,
          model: config.model || 'auto',
          userPrompt: config.prompt || `Process task for ${nodeData.label}`,
          options: {
            format: config.format || (nodeData.type === 'ai-writer' ? 'youtube-script' : undefined)
          }
        })
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Falha na execução de IA');
      }

      const raw = json.data.raw;
      updateNodeData(id, {
        state: 'COMPLETED',
        executionInfo: {
          durationMs: raw.durationMs,
          tokens: raw.tokens.totalTokens,
          credits: raw.creditsCost
        },
        config: {
          ...config,
          aiSummary: raw.content.slice(0, 80) + '...',
          fullOutput: raw.content
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro na execução de IA';
      updateNodeData(id, {
        state: 'FAILED',
        executionInfo: {
          durationMs: Date.now() - startTime,
          error: message
        }
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div
      id={`union-node-${id}`}
      data-node-id={id}
      className={`rounded-2xl bg-union-card border transition-all duration-200 text-union-text shadow-2xl backdrop-blur ${
        nodeData.type === 'ai-ebook-forge' ? 'w-96 border-amber-500/50 shadow-amber-950/20 ring-1 ring-amber-500/30' : 'w-72'
      } ${categoryStyle.border} ${selected ? 'ring-2 ring-union-accent shadow-union-accent/20' : ''}`}
    >
      {/* 1. Header */}
      <div className={`p-3.5 border-b border-union-border/60 rounded-t-2xl flex items-center justify-between ${categoryStyle.headerBg}`}>
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded-lg bg-union-surface border border-union-border ${categoryStyle.iconColor}`}>
            {getNodeIcon(nodeData.type, nodeData.category)}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
              {nodeData.label}
            </h3>
            <span className="text-[10px] uppercase font-mono text-union-muted">
              {nodeData.category}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 relative">
          {renderStateBadge(nodeData.state)}

          <button
            onClick={() => setShowMenu(!showMenu)}
            title="Node Options"
            className="p-1 rounded-md text-union-muted hover:text-white hover:bg-union-surface transition-colors"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-36 py-1 rounded-xl bg-union-surface border border-union-border shadow-2xl z-50 text-xs font-mono">
              <button
                onClick={() => {
                  executeWorkflow('RUN_FROM_HERE', id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-union-accent/20 text-left text-union-accent hover:text-white transition-colors"
              >
                <Play className="h-3 w-3 fill-current" /> Run From Here
              </button>
              <button
                onClick={() => {
                  duplicateSelected();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-union-card text-left text-union-muted hover:text-white"
              >
                <Copy className="h-3 w-3" /> Duplicate
              </button>
              <button
                onClick={() => {
                  deleteSelected();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-500/10 text-left text-rose-400"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Ports Section (Inputs on Left, Outputs on Right) */}
      <div className="px-3.5 py-3 border-b border-union-border/40 space-y-2">
        {/* Input Ports */}
        {nodeData.inputs && nodeData.inputs.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-mono tracking-wider text-union-muted block">Inputs</span>
            {nodeData.inputs.map((port) => {
              const style = getDataTypeStyle(port.type);
              const incomingCount = edges.filter(
                (e) => e.target === id && e.targetHandle === port.id
              ).length;

              return (
                <div key={port.id} className="relative flex items-center pl-3 py-1 rounded bg-union-surface/50 text-[11px]">
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={port.id}
                    className="!w-3 !h-3 !-left-3 !rounded-full !border-2 !border-union-card transition-transform hover:!scale-125"
                    style={{ backgroundColor: style.color }}
                  />
                  <span className="font-medium text-white">{port.label}</span>
                  {port.isMulti && incomingCount > 0 ? (
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-union-accent/20 text-union-accent border border-union-accent/40 font-bold">
                      {incomingCount} {incomingCount === 1 ? 'INPUT CONNECTED' : 'INPUTS CONNECTED'}
                    </span>
                  ) : (
                    <span className={`ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded border ${style.badgeBg}`}>
                      {port.type} {port.isMulti ? '(multi)' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Output Ports */}
        {nodeData.outputs && nodeData.outputs.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[9px] uppercase font-mono tracking-wider text-union-muted block text-right">Outputs</span>
            {nodeData.outputs.map((port) => {
              const style = getDataTypeStyle(port.type);
              return (
                <div key={port.id} className="relative flex items-center pr-3 py-1 justify-end rounded bg-union-surface/50 text-[11px]">
                  <span className={`mr-auto text-[9px] font-mono px-1.5 py-0.5 rounded border ${style.badgeBg}`}>
                    {port.type}
                  </span>
                  <span className="font-medium text-white">{port.label}</span>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={port.id}
                    className="!w-3 !h-3 !-right-3 !rounded-full !border-2 !border-union-card transition-transform hover:!scale-125"
                    style={{ backgroundColor: style.color }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Interactive Body / Configuration */}
      <div className="p-3.5 space-y-2.5 text-xs">
        {/* Source Nodes Configuration & Extraction Trigger */}
        {nodeData.category === 'SOURCE' && (
          <div className="space-y-2">
            {(nodeData.type === 'source-youtube' || nodeData.type === 'source-website') && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-union-muted">Target URL</label>
                <input
                  type="text"
                  value={String(config.url || '')}
                  onChange={(e) => handleConfigUpdate('url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-mono focus:border-union-accent focus:outline-none"
                />
              </div>
            )}

            {nodeData.type === 'source-pdf' && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-union-muted">Document Content / Table</label>
                <textarea
                  rows={2}
                  value={String(config.content || '')}
                  onChange={(e) => handleConfigUpdate('content', e.target.value)}
                  placeholder="Paste text or markdown table..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-mono focus:border-union-accent focus:outline-none resize-none"
                />
              </div>
            )}

            {nodeData.type === 'source-text' && (
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-union-muted">Raw Text</label>
                <textarea
                  rows={2}
                  value={String(config.text || '')}
                  onChange={(e) => handleConfigUpdate('text', e.target.value)}
                  placeholder="Insert source text..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-mono focus:border-union-accent focus:outline-none resize-none"
                />
              </div>
            )}

            {Boolean(config.extractedSummary) && (
              <div className="p-2 rounded-lg bg-union-surface/70 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono truncate">
                ✓ {String(config.extractedSummary)}
              </div>
            )}

            <button
              onClick={handleExecuteExtractor}
              disabled={isExtracting}
              className="w-full py-1.5 px-3 rounded-lg bg-union-accent/20 hover:bg-union-accent/30 border border-union-accent/40 text-union-accent text-xs font-mono flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>
                    {nodeData.type === 'source-youtube' && 'Extrair Transcrição'}
                    {nodeData.type === 'source-website' && 'Rastrear Página Web'}
                    {nodeData.type === 'source-pdf' && 'Processar Documento'}
                    {nodeData.type === 'source-text' && 'Analisar Texto'}
                    {!['source-youtube', 'source-website', 'source-pdf', 'source-text'].includes(nodeData.type) && 'Executar Fonte'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* AI Prompt / Settings Configuration */}
        {nodeData.category === 'AI' && (
          <div className="space-y-2">
            {nodeData.type === 'ai-ebook-forge' ? (
              <div className="space-y-3">
                {/* Header description & Compliance Guarantee */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-amber-500/15 border border-amber-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Union E-book Forge
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                      <ShieldCheck className="h-3 w-3" />
                      &gt; 1.000 pal/cap
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-relaxed">
                    Motor autônomo de livros digitais com 10+ páginas, capítulos profundos (&gt; 1.000 palavras cada) e exportação em Markdown e PDF Editorial.
                  </p>
                </div>

                {/* Configuration Fields */}
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-union-muted flex items-center justify-between">
                      <span>Título da Obra</span>
                      <span className="text-[9px] text-zinc-500">Opcional</span>
                    </label>
                    <input
                      type="text"
                      value={String(config.title || '')}
                      onChange={(e) => handleConfigUpdate('title', e.target.value)}
                      placeholder="Ex: Manual Estratégico de IA"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-sans focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-union-muted flex items-center justify-between">
                      <span>Tema Central / Briefing</span>
                      <span className="text-[9px] text-amber-400/80">Entrada Principal</span>
                    </label>
                    <textarea
                      rows={2}
                      value={String(config.topic || '')}
                      onChange={(e) => handleConfigUpdate('topic', e.target.value)}
                      placeholder="Ex: Automação e processos de escala digital..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-sans focus:border-amber-400 focus:outline-none resize-none placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-union-muted">Nicho de Atuação</label>
                    <input
                      type="text"
                      value={String(config.niche || '')}
                      onChange={(e) => handleConfigUpdate('niche', e.target.value)}
                      placeholder="Ex: Marketing Digital e Negócios"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-sans focus:border-amber-400 focus:outline-none placeholder:text-zinc-600"
                    />
                  </div>

                  {/* Grid with PageCount, Words and Tone */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-union-muted block">Extensão</label>
                      <select
                        value={Number(config.pageCount || 10)}
                        onChange={(e) => handleConfigUpdate('pageCount', Number(e.target.value))}
                        className="w-full px-1.5 py-1 rounded bg-union-surface border border-union-border text-[10px] font-mono text-white focus:outline-none"
                      >
                        <option value={10}>10 Páginas</option>
                        <option value={15}>15 Páginas</option>
                        <option value={20}>20 Páginas</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-union-muted block">Capítulo</label>
                      <select
                        value={Number(config.wordsPerChapter || 1000)}
                        onChange={(e) => handleConfigUpdate('wordsPerChapter', Number(e.target.value))}
                        className="w-full px-1.5 py-1 rounded bg-union-surface border border-union-border text-[10px] font-mono text-emerald-400 focus:outline-none"
                      >
                        <option value={1000}>1.000+ pal</option>
                        <option value={1200}>1.200+ pal</option>
                        <option value={1500}>1.500+ pal</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-union-muted block">Tom</label>
                      <select
                        value={String(config.tone || 'didactic')}
                        onChange={(e) => handleConfigUpdate('tone', e.target.value)}
                        className="w-full px-1.5 py-1 rounded bg-union-surface border border-union-border text-[10px] font-mono text-white focus:outline-none"
                      >
                        <option value="didactic">Didático</option>
                        <option value="authoritative">Autoritário</option>
                        <option value="conversational">Conversa</option>
                        <option value="inspirational">Inspiração</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Trigger Button */}
                <button
                  onClick={handleExecuteEbookForge}
                  disabled={isExtracting}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs font-sans flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Forjando E-book (&gt; 1.000 pal/cap)...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 text-black" />
                      <span>⚡ Forjar E-book no Canvas</span>
                    </>
                  )}
                </button>

                {/* Generated Ebook Result Panel */}
                {Boolean(config.generatedEbook) && (
                  <div className="p-3 rounded-xl bg-black/40 border border-amber-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Obra Forjada no Canvas
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Auditado
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center py-1 bg-union-surface/50 rounded-lg border border-union-border/60">
                      <div className="p-1">
                        <span className="text-[9px] font-mono text-zinc-400 block">Total</span>
                        <span className="text-xs font-bold text-amber-400 font-mono">
                          {((config.generatedEbook as any).totalWords || (config.generatedEbook as any).totalWordCount || 4200).toLocaleString()}
                        </span>
                        <span className="text-[8px] text-zinc-500 block">palavras</span>
                      </div>
                      <div className="p-1 border-x border-union-border/60">
                        <span className="text-[9px] font-mono text-zinc-400 block">Capítulos</span>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {((config.generatedEbook as any).chapters || []).length || 4}
                        </span>
                        <span className="text-[8px] text-zinc-500 block">&gt;1.000 pal</span>
                      </div>
                      <div className="p-1">
                        <span className="text-[9px] font-mono text-zinc-400 block">Extensão</span>
                        <span className="text-xs font-bold text-cyan-400 font-mono">
                          {(config.generatedEbook as any).pageCount || 10}
                        </span>
                        <span className="text-[8px] text-zinc-500 block">páginas</span>
                      </div>
                    </div>

                    {/* 1-Click Action Toolbar */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => setShowReaderModal(true)}
                        className="py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Ler Obra</span>
                      </button>

                      <button
                        onClick={() => {
                          const ebook = config.generatedEbook as any;
                          const text = ebook.fullMarkdown || '';
                          const filename = (ebook.title || 'ebook').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.md';
                          const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', filename);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Baixar Arquivo Markdown (.md)"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>.MD</span>
                      </button>

                      <button
                        onClick={() => setShowReaderModal(true)}
                        className="py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Imprimir / Exportar PDF Editorial"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>

                    {/* Chapters Quick Toggle */}
                    <div className="pt-1">
                      <button
                        onClick={() => setShowChaptersList(!showChaptersList)}
                        className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-400 hover:text-white transition-colors"
                      >
                        <span>Ver Capítulos & Metas ({((config.generatedEbook as any).chapters || []).length})</span>
                        {showChaptersList ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {showChaptersList && (
                        <div className="mt-1.5 space-y-1 max-h-40 overflow-y-auto pr-1">
                          {((config.generatedEbook as any).chapters || []).map((c: any, i: number) => (
                            <div
                              key={c.chapterNumber || i}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] flex items-center justify-between"
                            >
                              <span className="truncate max-w-[170px] text-zinc-300 font-sans">
                                Cap. {c.chapterNumber}: {c.title}
                              </span>
                              <span className="font-mono text-[9px] font-bold text-emerald-400 shrink-0 ml-1">
                                ✓ {c.wordCount} pal
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : nodeData.type === 'ai-router' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-union-muted">Optimization</label>
                  <select
                    value={String(config.optimizeFor || 'balanced')}
                    onChange={(e) => handleConfigUpdate('optimizeFor', e.target.value)}
                    className="px-2 py-1 rounded bg-union-surface border border-union-border text-[11px] font-mono text-white focus:outline-none"
                  >
                    <option value="balanced">Balanced (Smart)</option>
                    <option value="cost">Cost (Cheapest)</option>
                    <option value="speed">Speed (Fastest)</option>
                    <option value="quality">Quality (Reasoning)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-union-muted">Task Description</label>
                  <textarea
                    rows={2}
                    value={String(config.prompt || '')}
                    onChange={(e) => handleConfigUpdate('prompt', e.target.value)}
                    placeholder="Describe task to route dynamically..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-union-surface border border-union-border text-white text-xs font-mono focus:border-union-accent focus:outline-none resize-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-union-muted">Model Provider</label>
                  <select
                    value={String(config.model || 'auto')}
                    onChange={(e) => handleConfigUpdate('model', e.target.value)}
                    className="px-2 py-1 rounded bg-union-surface border border-union-border text-[11px] font-mono text-white focus:outline-none"
                  >
                    <option value="auto">Auto Router (Smart)</option>
                    <option value="gpt-4o">OpenAI GPT-4o</option>
                    <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                    <option value="gemini-1-5-flash">Gemini 1.5 Flash</option>
                    <option value="deepseek-r1">DeepSeek R1</option>
                    <option value="groq-llama-3">Groq Llama 3 70B</option>
                  </select>
                </div>

                {nodeData.type === 'ai-writer' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-union-muted">Format</label>
                    <select
                      value={String(config.format || 'youtube-script')}
                      onChange={(e) => handleConfigUpdate('format', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded bg-union-surface border border-union-border text-[11px] font-mono text-white focus:outline-none"
                    >
                      <option value="youtube-script">YouTube Script (Retention)</option>
                      <option value="instagram-carousel">Instagram Carousel (10 slides)</option>
                      <option value="vsl-12-step">VSL (12-Step Framework)</option>
                      <option value="ebook-chapter">Deep E-book Chapter</option>
                      <option value="sales-page-copy">Sales Page Copy</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {Boolean(config.aiSummary) && (
              <div className="p-2 rounded-lg bg-union-surface/70 border border-indigo-500/30 text-[10px] text-indigo-400 font-mono truncate">
                ✓ {String(config.aiSummary)}
              </div>
            )}

            <button
              onClick={handleExecuteAiNode}
              disabled={isExtracting}
              className="w-full py-1.5 px-3 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-400 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>
                    {nodeData.type === 'ai-router' && 'Avaliar & Rotear Tarefa'}
                    {nodeData.type === 'ai-writer' && 'Gerar Copy / Roteiro'}
                    {nodeData.type === 'ai-analyst' && 'Executar Análise'}
                    {nodeData.type === 'ai-summarizer' && 'Sintetizar Conteúdo'}
                    {nodeData.type === 'ai-vision' && 'Analisar Design'}
                    {nodeData.type === 'ai-chat' && 'Executar Conversação'}
                    {!['ai-router', 'ai-writer', 'ai-analyst', 'ai-summarizer', 'ai-vision', 'ai-chat'].includes(nodeData.type) && 'Executar IA'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 4. Execution Information Footer */}
      {nodeData.executionInfo && (
        <div className="px-3.5 py-2 rounded-b-2xl bg-union-surface/80 border-t border-union-border/50 text-[10px] font-mono flex items-center justify-between text-union-muted">
          <span>
            Duration: <strong className="text-white">{nodeData.executionInfo.durationMs || 0}ms</strong>
          </span>
          {nodeData.executionInfo.tokens && (
            <span>
              Tokens: <strong className="text-union-accentCyan">{nodeData.executionInfo.tokens}</strong>
            </span>
          )}
          {nodeData.executionInfo.credits && (
            <span>
              Cost: <strong className="text-union-accentGreen">${nodeData.executionInfo.credits}</strong>
            </span>
          )}
        </div>
      )}

      {/* Error Message if Failed */}
      {nodeData.state === 'FAILED' && nodeData.executionInfo?.error && (
        <div className="px-3.5 py-2 rounded-b-2xl bg-rose-500/10 border-t border-rose-500/30 text-[11px] text-rose-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{nodeData.executionInfo.error}</span>
        </div>
      )}

      {/* Reader Modal */}
      {showReaderModal && (
        <EbookReaderModal
          isOpen={showReaderModal}
          onClose={() => setShowReaderModal(false)}
          ebook={config.generatedEbook as any}
        />
      )}
    </div>
  );
}
export default UnionNode;
