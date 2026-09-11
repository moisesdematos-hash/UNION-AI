import { useState } from 'react';
import { 
  X, 
  Coins, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingDown, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';

interface TopupPackage {
  id: string;
  amount: number;
  label: string;
  price: string;
  popular?: boolean;
}

const TOPUP_PACKAGES: TopupPackage[] = [
  { id: 'pack-25', amount: 25, label: 'Starter', price: 'R$ 15,00' },
  { id: 'pack-50', amount: 50, label: 'Creator', price: 'R$ 29,00' },
  { id: 'pack-100', amount: 100, label: 'Pro Scale', price: 'R$ 49,00', popular: true },
  { id: 'pack-250', amount: 250, label: 'Agency', price: 'R$ 99,00' }
];

export function CreditsDrawer() {
  const {
    isCreditsDrawerOpen,
    closeCreditsDrawer,
    userCredits,
    creditTransactions,
    topupCredits
  } = useCanvasStore();

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isCreditsDrawerOpen) return null;

  const balance = userCredits?.balance ?? 100.0;
  const totalConsumed = userCredits?.totalConsumed ?? 0.0;

  const handleTopup = async (pkg: TopupPackage) => {
    setIsProcessing(pkg.id);
    try {
      await topupCredits(pkg.amount, pkg.id);
      setSuccessNotice(`Recarga de +${pkg.amount} créditos confirmada com sucesso!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } finally {
      setIsProcessing(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  Carteira & Contabilidade
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    GATE 13
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">Controle de créditos, tokens e quotas de IA</p>
              </div>
            </div>
            <button
              onClick={closeCreditsDrawer}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Banner */}
          {successNotice && (
            <div className="mx-4 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Balance Hero Card */}
          <div className="p-4">
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Coins className="w-24 h-24 text-amber-400" />
              </div>
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">
                Saldo Disponível
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-white">
                  {balance.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-amber-400">créditos</span>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Total consumido:</span>
                  <span className="font-mono text-zinc-200 font-medium">
                    {totalConsumed.toFixed(2)} cr
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Quota Ativa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Topup Packages */}
          <div className="px-4 pb-3">
            <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Recarga Instantânea de Créditos
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TOPUP_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => handleTopup(pkg)}
                  disabled={isProcessing !== null}
                  className={`p-2.5 rounded-lg border text-left transition-all relative cursor-pointer ${
                    pkg.popular
                      ? 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/15'
                      : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-zinc-950">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">{pkg.label}</span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      +{pkg.amount} cr
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-400">
                    <span>{pkg.price}</span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                      <Plus className="w-2.5 h-2.5" /> Adicionar
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Audit History Header */}
          <div className="px-4 pt-3 pb-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Extrato de Transações
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {creditTransactions.length} registros
            </span>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {creditTransactions.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Nenhuma transação registrada ainda.
                <p className="text-[11px] text-zinc-600 mt-1">
                  Execuções de IA e recargas de carteira aparecerão aqui.
                </p>
              </div>
            ) : (
              creditTransactions.map((tx) => {
                const isConsumption = tx.type === 'CONSUMPTION';
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-xs flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-1.5 rounded-md mt-0.5 ${
                          isConsumption
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isConsumption ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200 line-clamp-1">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span>{formatDate(tx.createdAt)}</span>
                          <span>•</span>
                          <span>Saldo: {tx.balanceAfter.toFixed(2)} cr</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono font-semibold text-right ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} cr
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
