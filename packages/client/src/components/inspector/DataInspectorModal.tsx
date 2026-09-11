import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Zap,
  Activity,
  Clock,
  Coins,
  FileCode,
  Download,
  SendHorizontal,
  HardDrive
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';
import { globalDataBus, DataType } from '@union/shared';
import { getDataTypeStyle } from '../../utils/portColors.js';

export function DataInspectorModal() {
  const {
    inspectedConnectionId,
    closeDataInspector,
    edges,
    nodes,
    injectTestDataPacket
  } = useCanvasStore();

  const [copied, setCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDataInspector();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDataInspector]);

  if (!inspectedConnectionId) return null;

  const edge = edges.find((e) => e.id === inspectedConnectionId);
  if (!edge) return null;

  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const sourceLabel = (sourceNode?.data as any)?.label || edge.source;
  const targetLabel = (targetNode?.data as any)?.label || edge.target;

  const inspection = globalDataBus.inspectConnection(
    {
      connectionId: edge.id,
      sourceNodeId: edge.source,
      sourcePortId: edge.sourceHandle || 'output',
      targetNodeId: edge.target,
      targetPortId: edge.targetHandle || 'input',
      status: (edge.data as any)?.state || 'connected'
    },
    ((edge.data as any)?.dataType as DataType) || 'TEXT'
  );

  const { inputSummary, outputSummary, fullPacket } = inspection;
  const typeStyle = getDataTypeStyle(inputSummary.type);

  // Format bytes into human readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const payloadString = outputSummary.dataPreview !== undefined && outputSummary.dataPreview !== null
    ? typeof outputSummary.dataPreview === 'string'
      ? outputSummary.dataPreview
      : JSON.stringify(outputSummary.dataPreview, null, 2)
    : 'No data packet transported yet.\nClick "Inject Test Packet" below to send a live payload through this wire.';

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([payloadString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `union-packet-${edge.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspector-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-union-border bg-union-card/95 shadow-2xl shadow-union-accent/15 flex flex-col overflow-hidden text-union-text">
        {/* Accent strip */}
        <div
          style={{ backgroundColor: typeStyle.color }}
          className="h-1 w-full"
        />

        {/* Modal Header */}
        <div className="p-5 border-b border-union-border flex items-center justify-between bg-union-surface/50">
          <div className="flex items-center space-x-3">
            <div
              style={{
                backgroundColor: `${typeStyle.color}15`,
                borderColor: `${typeStyle.color}40`,
                color: typeStyle.color
              }}
              className="p-2 rounded-xl border"
            >
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="inspector-modal-title" className="text-base font-bold text-white tracking-wide">
                  Data Bus Inspector
                </h2>
                <span
                  style={{
                    backgroundColor: `${typeStyle.color}20`,
                    color: typeStyle.color
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase"
                >
                  {inputSummary.type}
                </span>
              </div>
              <p className="text-xs text-union-muted font-mono mt-0.5">
                {sourceLabel} <span className="text-white">→</span> {targetLabel} ({edge.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => injectTestDataPacket(edge.id)}
              className="px-3 py-1.5 rounded-lg bg-union-accent/20 border border-union-accent/40 text-union-accent hover:bg-union-accent hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              title="Simulate live data packet through this connection"
            >
              <SendHorizontal className="h-3.5 w-3.5" />
              <span>Inject Test Packet</span>
            </button>
            <button
              onClick={closeDataInspector}
              className="p-1.5 rounded-lg text-union-muted hover:text-white hover:bg-union-surface transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Telemetry & Summary Cards Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-union-border bg-union-surface/20">
          {/* Input Summary Card */}
          <div className="p-4 rounded-xl border border-union-border/70 bg-union-surface/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-union-accent">
                <HardDrive className="h-3.5 w-3.5" />
                Input Summary
              </span>
              <span className="font-mono text-[10px] text-union-muted">
                Origin: {edge.sourceHandle || 'output'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-union-bg/60 border border-union-border/50">
                <span className="text-[10px] text-union-muted block">Payload Size</span>
                <span className="font-mono font-bold text-white">
                  {formatBytes(inputSummary.sizeBytes)}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-union-bg/60 border border-union-border/50">
                <span className="text-[10px] text-union-muted block">Emitted At</span>
                <span className="font-mono text-[11px] text-white">
                  {new Date(inputSummary.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Output / Execution Telemetry Card */}
          <div className="p-4 rounded-xl border border-union-border/70 bg-union-surface/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Activity className="h-3.5 w-3.5" />
                Execution Telemetry
              </span>
              <span className={`font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border ${
                outputSummary.status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : outputSummary.status === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              }`}>
                {outputSummary.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-union-bg/60 border border-union-border/50">
                <span className="text-[10px] text-union-muted flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> Time
                </span>
                <span className="font-mono font-bold text-white">
                  {outputSummary.processingTimeMs !== undefined ? `${outputSummary.processingTimeMs}ms` : '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-union-bg/60 border border-union-border/50">
                <span className="text-[10px] text-union-muted flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" /> Tokens
                </span>
                <span className="font-mono font-bold text-white">
                  {outputSummary.tokens !== undefined ? outputSummary.tokens : '0'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-union-bg/60 border border-union-border/50">
                <span className="text-[10px] text-union-muted flex items-center gap-1">
                  <Coins className="h-2.5 w-2.5" /> Credits
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {outputSummary.credits !== undefined ? outputSummary.credits.toFixed(3) : '0.000'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payload Viewer Body */}
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <FileCode className="h-4 w-4 text-union-accent" />
              Data Packet Payload
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-union-surface hover:bg-union-border border border-union-border text-xs text-union-muted hover:text-white transition-all flex items-center gap-1"
                title="Copy raw payload"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 rounded-lg bg-union-surface hover:bg-union-border border border-union-border text-xs text-union-muted hover:text-white transition-all flex items-center gap-1"
                title="Download JSON packet"
              >
                <Download className="h-3 w-3" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="flex-1 bg-union-bg border border-union-border rounded-xl p-4 overflow-auto font-mono text-xs text-slate-300 max-h-72 leading-relaxed selection:bg-union-accent/30 selection:text-white">
            <pre className="whitespace-pre-wrap break-words">{payloadString}</pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-union-surface/50 border-t border-union-border flex items-center justify-between text-xs text-union-muted">
          <span>Packet ID: <span className="font-mono text-white">{fullPacket?.id || 'none'}</span></span>
          <button
            onClick={closeDataInspector}
            className="px-4 py-1.5 rounded-lg bg-union-surface border border-union-border hover:border-union-borderHover text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataInspectorModal;
