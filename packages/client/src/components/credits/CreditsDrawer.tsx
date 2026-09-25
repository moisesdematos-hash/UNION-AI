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
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Receipt,
  Wallet,
  Globe
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore.js';

export interface TopupPackage {
  id: string;
  amount: number;
  label: string;
  priceBrl: string;
  priceAoa: string;
  priceUsd: string;
  popular?: boolean;
}

export const TOPUP_PACKAGES: TopupPackage[] = [
  { id: 'pack-25', amount: 25, label: 'Starter', priceBrl: 'R$ 15,00', priceAoa: '2.500 Kz', priceUsd: '$ 3.00' },
  { id: 'pack-50', amount: 50, label: 'Creator', priceBrl: 'R$ 29,00', priceAoa: '5.000 Kz', priceUsd: '$ 6.00' },
  { id: 'pack-100', amount: 100, label: 'Pro Scale', priceBrl: 'R$ 49,00', priceAoa: '9.500 Kz', priceUsd: '$ 10.00', popular: true },
  { id: 'pack-250', amount: 250, label: 'Agency', priceBrl: 'R$ 99,00', priceAoa: '19.000 Kz', priceUsd: '$ 20.00' }
];

type Region = 'AO' | 'BR' | 'GLOBAL';
type PaymentProvider = 'multicaixa_express' | 'multicaixa_ref' | 'paypay' | 'pix' | 'stripe';

export function CreditsDrawer() {
  const {
    isCreditsDrawerOpen,
    closeCreditsDrawer,
    userCredits,
    creditTransactions,
    topupCredits
  } = useCanvasStore();

  const [selectedRegion, setSelectedRegion] = useState<Region>('AO');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('multicaixa_express');
  const [mcxPhone, setMcxPhone] = useState('923 000 000');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals for payment data
  const [pixModalData, setPixModalData] = useState<{ code: string; pkg: TopupPackage } | null>(null);
  const [mcxModalData, setMcxModalData] = useState<{ phone: string; amountAoa: string; pkg: TopupPackage; sessionId: string } | null>(null);
  const [refModalData, setRefModalData] = useState<{ entity: string; reference: string; amountAoa: string; pkg: TopupPackage } | null>(null);
  const [paypayModalData, setPaypayModalData] = useState<{ account: string; qrCode: string; amountAoa: string; pkg: TopupPackage } | null>(null);

  if (!isCreditsDrawerOpen) return null;

  const balance = userCredits?.balance ?? 100.0;
  const totalConsumed = userCredits?.totalConsumed ?? 0.0;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegionChange = (region: Region) => {
    setSelectedRegion(region);
    if (region === 'AO') {
      setSelectedProvider('multicaixa_express');
    } else if (region === 'BR') {
      setSelectedProvider('pix');
    } else {
      setSelectedProvider('stripe');
    }
  };

  const handleTopup = async (pkg: TopupPackage) => {
    setIsProcessing(pkg.id);
    try {
      const token = typeof window !== 'undefined' && localStorage.getItem('union_auth_token');
      
      // Real API checkout call if token exists
      if (token) {
        try {
          const res = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ 
              packageId: pkg.id, 
              provider: selectedProvider,
              phone: mcxPhone.replace(/\D/g, '')
            })
          });

          if (res.ok) {
            const data = await res.json();
            const session = data.data;

            if (selectedProvider === 'pix' && session?.pixCopiaECola) {
              setPixModalData({ code: session.pixCopiaECola, pkg });
              return;
            }

            if (selectedProvider === 'multicaixa_express') {
              setMcxModalData({
                phone: session?.multicaixaPhone || mcxPhone,
                amountAoa: pkg.priceAoa,
                pkg,
                sessionId: session?.sessionId || 'mcx_sim'
              });
              return;
            }

            if (selectedProvider === 'multicaixa_ref') {
              setRefModalData({
                entity: session?.multicaixaEntity || '00142',
                reference: session?.multicaixaReference || '123 456 789',
                amountAoa: pkg.priceAoa,
                pkg
              });
              return;
            }

            if (selectedProvider === 'paypay') {
              setPaypayModalData({
                account: session?.paypayAccount || '+244 924 112 233',
                qrCode: session?.paypayQrCode || '',
                amountAoa: pkg.priceAoa,
                pkg
              });
              return;
            }

            if (selectedProvider === 'stripe' && session?.checkoutUrl) {
              if (session.checkoutUrl.includes('simulated')) {
                // fall through to topup credits
              } else {
                window.location.href = session.checkoutUrl;
                return;
              }
            }
          }
        } catch {
          // fallback to modal simulation
        }
      }

      // Offline / Local Simulation fallback
      if (selectedProvider === 'pix') {
        setPixModalData({
          code: `00020126580014br.gov.bcb.pix0136union-pix-${pkg.id}5204000053039865405${pkg.priceBrl}5802BR5908UNION AI6009SAO PAULO62070503***6304ABCD`,
          pkg
        });
        return;
      }

      if (selectedProvider === 'multicaixa_express') {
        setMcxModalData({
          phone: `+244 ${mcxPhone}`,
          amountAoa: pkg.priceAoa,
          pkg,
          sessionId: `mcx_${Date.now()}`
        });
        return;
      }

      if (selectedProvider === 'multicaixa_ref') {
        const randRef = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
        setRefModalData({
          entity: '00142',
          reference: randRef,
          amountAoa: pkg.priceAoa,
          pkg
        });
        return;
      }

      if (selectedProvider === 'paypay') {
        setPaypayModalData({
          account: '+244 924 112 233',
          qrCode: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-28 h-28 mx-auto"><rect width="100" height="100" fill="#000"/><rect x="10" y="10" width="30" height="30" fill="#fff"/><rect x="60" y="10" width="30" height="30" fill="#fff"/><rect x="10" y="60" width="30" height="30" fill="#fff"/><rect x="18" y="18" width="14" height="14" fill="#000"/><rect x="68" y="18" width="14" height="14" fill="#000"/><rect x="18" y="68" width="14" height="14" fill="#000"/><rect x="45" y="45" width="10" height="10" fill="#10b981"/></svg>`,
          amountAoa: pkg.priceAoa,
          pkg
        });
        return;
      }

      // Default Stripe direct
      await topupCredits(pkg.amount, pkg.id);
      setSuccessNotice(`Recarga de +${pkg.amount} créditos confirmada com sucesso!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmGenericPayment = async (pkg: TopupPackage, providerName: string) => {
    setIsProcessing(pkg.id);
    try {
      await topupCredits(pkg.amount, pkg.id);
      setSuccessNotice(`Pagamento ${providerName} confirmado! +${pkg.amount} créditos adicionados à sua conta.`);
      setPixModalData(null);
      setMcxModalData(null);
      setRefModalData(null);
      setPaypayModalData(null);
      setTimeout(() => setSuccessNotice(null), 4000);
    } finally {
      setIsProcessing(null);
    }
  };

  const getPackagePrice = (pkg: TopupPackage) => {
    if (selectedRegion === 'AO') return pkg.priceAoa;
    if (selectedRegion === 'GLOBAL') return pkg.priceUsd;
    return pkg.priceBrl;
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
                <p className="text-xs text-zinc-400">Controle de créditos, quotas e pagamentos multimoeda</p>
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
          <div className="p-4 pb-2">
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

          {/* Region / Currency Selector Tabs */}
          <div className="px-4 py-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Região & Moeda</span>
              <span className="text-[10px] text-amber-400 font-mono">
                {selectedRegion === 'AO' ? 'Kwanza (AOA)' : selectedRegion === 'BR' ? 'Real (BRL)' : 'Dólar (USD)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleRegionChange('AO')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  selectedRegion === 'AO'
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🇦🇴 Angola</span>
              </button>
              <button
                type="button"
                onClick={() => handleRegionChange('BR')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  selectedRegion === 'BR'
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🇧🇷 Brasil</span>
              </button>
              <button
                type="button"
                onClick={() => handleRegionChange('GLOBAL')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  selectedRegion === 'GLOBAL'
                    ? 'bg-amber-500 text-black shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🌐 Global</span>
              </button>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="px-4 pb-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Gateway de Pagamento</span>
              <span className="text-[10px] text-emerald-400 font-mono">Integrado</span>
            </div>

            {selectedRegion === 'AO' && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('multicaixa_express')}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center ${
                      selectedProvider === 'multicaixa_express'
                        ? 'bg-emerald-500 text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>MCX Express</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('multicaixa_ref')}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center ${
                      selectedProvider === 'multicaixa_ref'
                        ? 'bg-emerald-500 text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Referência</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('paypay')}
                    className={`py-1.5 px-1.5 rounded-lg text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer text-center ${
                      selectedProvider === 'paypay'
                        ? 'bg-emerald-500 text-black font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>PayPay AO</span>
                  </button>
                </div>

                {/* MCX Phone Input if multicaixa_express is active */}
                {selectedProvider === 'multicaixa_express' && (
                  <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-2">
                    <label className="text-[11px] text-zinc-400 shrink-0">Nº Telemóvel MCX:</label>
                    <div className="flex items-center gap-1 w-full max-w-[190px]">
                      <span className="text-xs font-mono text-zinc-400">+244</span>
                      <input
                        type="text"
                        value={mcxPhone}
                        onChange={(e) => setMcxPhone(e.target.value)}
                        placeholder="923 000 000"
                        className="w-full bg-black/60 border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedRegion === 'BR' && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('pix')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    selectedProvider === 'pix'
                      ? 'bg-emerald-500 text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>PIX Instantâneo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProvider('stripe')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    selectedProvider === 'stripe'
                      ? 'bg-emerald-500 text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Cartão (Stripe)</span>
                </button>
              </div>
            )}

            {selectedRegion === 'GLOBAL' && (
              <div className="grid grid-cols-1 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedProvider('stripe')}
                  className="py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-500 text-black shadow-sm font-bold cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Cartão Internacional (Stripe Checkout)</span>
                </button>
              </div>
            )}
          </div>

          {/* MODAL: Multicaixa Express (MCX) */}
          {mcxModalData && (
            <div className="mx-4 mb-3 p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/40 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Multicaixa Express: {mcxModalData.amountAoa}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMcxModalData(null)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-black/50 p-2.5 rounded-lg border border-zinc-800 space-y-1 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>Destino de Débito:</span>
                  <span className="font-mono text-zinc-100 font-bold">{mcxModalData.phone}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Montante a Pagar:</span>
                  <span className="font-mono text-amber-400 font-bold">{mcxModalData.amountAoa}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Créditos a Receber:</span>
                  <span className="font-mono text-emerald-400 font-bold">+{mcxModalData.pkg.amount} cr</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-tight">
                Uma notificação de autorização foi enviada ao seu telemóvel. Abra o seu aplicativo <strong className="text-zinc-200">Multicaixa Express</strong> e valide a transação com o seu PIN de 6 dígitos.
              </p>

              <button
                type="button"
                onClick={() => handleConfirmGenericPayment(mcxModalData.pkg, 'Multicaixa Express')}
                disabled={isProcessing !== null}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simular Confirmação com PIN MCX</span>
              </button>
            </div>
          )}

          {/* MODAL: Referência Multicaixa */}
          {refModalData && (
            <div className="mx-4 mb-3 p-3.5 rounded-xl bg-zinc-900 border border-amber-500/40 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-500/20 text-amber-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Pagamento por Referência Multicaixa</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefModalData(null)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-black/60 p-3 rounded-lg border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Entidade:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white font-bold text-sm tracking-wider">{refModalData.entity}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(refModalData.entity, 'entity')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      title="Copiar Entidade"
                    >
                      {copiedKey === 'entity' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Referência:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-bold text-sm tracking-wider">{refModalData.reference}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(refModalData.reference.replace(/\s+/g, ''), 'ref')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                      title="Copiar Referência"
                    >
                      {copiedKey === 'ref' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Montante:</span>
                  <span className="font-mono text-emerald-400 font-bold">{refModalData.amountAoa}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/80">
                  <span>Validade:</span>
                  <span>48 Horas (ATM / Homebanking)</span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 leading-tight">
                Pague em qualquer Caixa Multicaixa (Opção: <em>Pagamentos &gt; Pagamento por Referência</em>) ou pelo Internet Banking do seu banco angolano (BFA, BAI, Millennium, BIC, etc.).
              </p>

              <button
                type="button"
                onClick={() => handleConfirmGenericPayment(refModalData.pkg, 'Referência Multicaixa')}
                disabled={isProcessing !== null}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simular Compensação de Referência</span>
              </button>
            </div>
          )}

          {/* MODAL: PayPay AO */}
          {paypayModalData && (
            <div className="mx-4 mb-3 p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/40 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">PayPay África (PayPay AO)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaypayModalData(null)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-black/60 p-3 rounded-lg border border-zinc-800 flex flex-col items-center gap-2 text-xs">
                {paypayModalData.qrCode ? (
                  <div 
                    className="p-1 bg-black rounded"
                    dangerouslySetInnerHTML={{ __html: paypayModalData.qrCode }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-zinc-800 rounded flex items-center justify-center text-zinc-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
                
                <div className="w-full space-y-1 text-center mt-1">
                  <div className="text-[11px] text-zinc-400">Número da Carteira PayPay:</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold text-xs">{paypayModalData.account}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paypayModalData.account, 'paypay')}
                      className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      {copiedKey === 'paypay' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-zinc-300 font-bold mt-1">
                    Montante: <span className="text-amber-400">{paypayModalData.amountAoa}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmGenericPayment(paypayModalData.pkg, 'PayPay AO')}
                disabled={isProcessing !== null}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simular Transferência PayPay</span>
              </button>
            </div>
          )}

          {/* MODAL: PIX */}
          {pixModalData && (
            <div className="mx-4 mb-3 p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/40 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Pagamento PIX: {pixModalData.pkg.priceBrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPixModalData(null)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Copie o código PIX Copia-e-Cola abaixo e conclua no seu banco:
              </p>

              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={pixModalData.code}
                  className="w-full pl-2.5 pr-20 py-1.5 bg-black/60 border border-zinc-800 rounded-lg text-[10px] font-mono text-zinc-300 select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(pixModalData.code, 'pix')}
                  className="absolute right-1 top-1 py-1 px-2 bg-emerald-500 text-black rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'pix' ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                  <span>{copiedKey === 'pix' ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleConfirmGenericPayment(pixModalData.pkg, 'PIX')}
                disabled={isProcessing !== null}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simular Confirmação Bancária PIX</span>
              </button>
            </div>
          )}

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
                    <span className="font-mono font-medium text-zinc-300">{getPackagePrice(pkg)}</span>
                    <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                      <Plus className="w-2.5 h-2.5" /> Recarregar
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
