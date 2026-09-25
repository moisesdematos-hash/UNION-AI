import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Users,
  CreditCard,
  Activity,
  Layers,
  Search,
  RefreshCw,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Server,
  Zap,
  Check,
  UserCheck,
  PlusCircle,
  Database,
  Cpu
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { AUTH_TOKEN_KEY } from '../../services/storageService.js';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'telemetry'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [logsData, setLogsData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Credit adjustment submodal state
  const [adjustingUser, setAdjustingUser] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Manual payment modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState('');
  const [manualPackageId, setManualPackageId] = useState('pack-50');
  const [manualRef, setManualRef] = useState('');
  const [manualNote, setManualNote] = useState('');

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics', { headers: getHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar métricas');
      const json = await res.json();
      setMetrics(json.data);
    } catch (e: any) {
      console.warn('Erro ao carregar métricas:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const q = encodeURIComponent(searchQuery);
      const res = await fetch(`/api/admin/users?q=${q}`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar usuários');
      const json = await res.json();
      setUsersList(json.data.users || []);
    } catch (e: any) {
      console.warn('Erro ao carregar utilizadores:', e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/admin/transactions', { headers: getHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar transações');
      const json = await res.json();
      setTransactionsList(json.data || []);
    } catch (e: any) {
      console.warn('Erro ao carregar transações:', e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', { headers: getHeaders() });
      if (!res.ok) throw new Error('Falha ao carregar logs');
      const json = await res.json();
      setLogsData(json.data);
    } catch (e: any) {
      console.warn('Erro ao carregar logs:', e);
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    await Promise.all([fetchMetrics(), fetchUsers(), fetchTransactions(), fetchLogs()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadAll();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'users') {
      const delay = setTimeout(() => {
        fetchUsers();
      }, 250);
      return () => clearTimeout(delay);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleToggleRole = async (targetUser: any) => {
    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmText = `Deseja realmente alterar o cargo de ${targetUser.email} para ${newRole}?`;
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao alterar cargo');
      setStatusMessage({ type: 'success', text: json.message });
      fetchUsers();
      fetchMetrics();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleAdjustCreditsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${adjustingUser.id}/credits`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          amount: Number(adjustAmount),
          mode: adjustMode,
          reason: adjustReason || 'Ajuste administrativo'
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao ajustar créditos');

      setStatusMessage({ type: 'success', text: json.message });
      setAdjustingUser(null);
      setAdjustReason('');
      fetchUsers();
      fetchMetrics();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleManualCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUserId) {
      alert('Selecione um utilizador');
      return;
    }

    try {
      const res = await fetch('/api/admin/transactions/manual-credit', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          userId: manualUserId,
          packageId: manualPackageId,
          provider: 'multicaixa_ref',
          receiptReference: manualRef,
          note: manualNote
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao conceder crédito');

      setStatusMessage({ type: 'success', text: json.message });
      setIsManualModalOpen(false);
      setManualRef('');
      setManualNote('');
      fetchTransactions();
      fetchMetrics();
      fetchUsers();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="relative w-full max-w-6xl h-[92vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="h-16 border-b border-zinc-800 bg-zinc-900/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-950 font-black shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Painel de Administração UNION.AI 2.0
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gestão Global de Utilizadores, Pagamentos Angola (AOA) e Telemetria
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* System Status Indicators */}
            <div className="hidden lg:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-zinc-300">
                  DB: {metrics?.system?.dbProvider === 'supabase' ? 'Supabase Cloud' : 'SQLite'}
                </span>
              </div>
              <span className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-zinc-300">LLM: Groq (120b)</span>
              </div>
            </div>

            <button
              onClick={loadAll}
              disabled={isLoading}
              title="Recarregar Dados"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-zinc-800 bg-zinc-950 px-6 flex items-center justify-between shrink-0">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Visão Geral & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Gestão de Utilizadores</span>
              {usersList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
                  {metrics?.users?.total || usersList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Transações & Pagamentos</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'telemetry'
                  ? 'border-amber-400 text-amber-300 bg-amber-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Telemetria & Logs</span>
            </button>
          </div>

          {activeTab === 'transactions' && (
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Aprovar Recarga Manual</span>
            </button>
          )}
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-b border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/60">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Hero KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* KPI 1: Utilizadores */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400">Total de Utilizadores</span>
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {metrics?.users?.total ?? 0}
                  </div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <span>+{metrics?.users?.last7Days ?? 0}</span>
                    <span className="text-zinc-500">nos últimos 7 dias</span>
                  </div>
                </div>

                {/* KPI 2: Faturamento Angola & Global */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400">Volume Faturado (Angola)</span>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Coins className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white mb-1 truncate">
                    {metrics?.financial?.totalAoaFormatted ?? '0 Kz'}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span>{metrics?.financial?.totalTransactions ?? 0} pagamentos processados</span>
                  </div>
                </div>

                {/* KPI 3: Saldo de Créditos */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400">Créditos em Circulação</span>
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Coins className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {metrics?.credits?.totalBalance ?? 0} <span className="text-xs text-amber-400 font-sans">cr</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Consumidos em IA: <strong className="text-zinc-300">{metrics?.credits?.totalConsumed ?? 0} cr</strong>
                  </div>
                </div>

                {/* KPI 4: Workflows & IA */}
                <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-zinc-400">Pipelines & Execuções</span>
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Layers className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white mb-1">
                    {metrics?.activity?.runs ?? 0}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Total Workflows: <strong className="text-zinc-300">{metrics?.activity?.workflows ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Status dos Gateways e Infraestrutura */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gateways Angola & Globais */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <h3 className="text-xs font-mono uppercase font-bold text-zinc-400 tracking-wider">
                    Gateways de Pagamento Ativos
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Multicaixa Express (MCX)</div>
                          <div className="text-[10px] text-zinc-400">Angola • Notificação Push no Telemóvel</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        ATIVO
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Referência Multicaixa (00142)</div>
                          <div className="text-[10px] text-zinc-400">Angola • Pagamento por ATM / Internet Banking</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        ATIVO
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">PayPay AO</div>
                          <div className="text-[10px] text-zinc-400">Angola • Carteira Digital PayPay QR Code</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        ATIVO
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Stripe & PIX Brasil</div>
                          <div className="text-[10px] text-zinc-400">Internacional • Cartões e PIX Instantâneo</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                        ATIVO
                      </span>
                    </div>
                  </div>
                </div>

                {/* Infraestrutura do Servidor */}
                <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <h3 className="text-xs font-mono uppercase font-bold text-zinc-400 tracking-wider">
                    Infraestrutura & Inteligência Artificial
                  </h3>
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Banco de Dados Cloud</div>
                          <div className="text-[10px] text-zinc-400">Supabase PostgreSQL 15 (AWS High Availability)</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold">CONECTADO</span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Cpu className="h-4 w-4 text-cyan-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Motor de Inferência LLM</div>
                          <div className="text-[10px] text-zinc-400">Groq High-Speed LPU • {metrics?.system?.groqModel}</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">PRONTO</span>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Server className="h-4 w-4 text-purple-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Ambiente de Execução</div>
                          <div className="text-[10px] text-zinc-400">Node.js Serverless • Uptime: {metrics?.system?.uptimeSeconds}s</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-400 font-bold">ONLINE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar por nome ou email..."
                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="text-xs text-zinc-400">
                  Mostrando <strong className="text-white">{usersList.length}</strong> utilizadores
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Utilizador</th>
                        <th className="py-3 px-4">Provedor</th>
                        <th className="py-3 px-4">Cargo (Role)</th>
                        <th className="py-3 px-4">Saldo Créditos</th>
                        <th className="py-3 px-4">Consumo IA</th>
                        <th className="py-3 px-4">Data Registo</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="h-7 w-7 rounded-full object-cover border border-zinc-700"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-zinc-800 text-zinc-200 font-bold flex items-center justify-center text-[10px] border border-zinc-700">
                                  {u.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {u.id === user?.id && (
                                    <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 font-mono">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-400">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {u.authProvider === 'google' ? 'Google' : 'Email'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleRole(u)}
                              title="Clique para alternar entre ADMIN e USER"
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                                u.role === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                              }`}
                            >
                              {u.role === 'ADMIN' ? '🛡️ ADMIN' : 'USER'}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-amber-400">
                            {Number(u.credits?.balance || 0).toFixed(2)} cr
                          </td>

                          <td className="py-3 px-4 font-mono text-zinc-400">
                            {Number(u.credits?.totalConsumed || 0).toFixed(2)} cr
                          </td>

                          <td className="py-3 px-4 text-zinc-400 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('pt-AO')}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setAdjustingUser(u);
                                setAdjustAmount(50);
                                setAdjustMode('add');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                            >
                              Ajustar Créditos
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTIONS & PAYMENTS */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                  Total de pagamentos registados: <strong className="text-white">{transactionsList.length}</strong>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Provedor</th>
                        <th className="py-3 px-4">Utilizador</th>
                        <th className="py-3 px-4">Pacote</th>
                        <th className="py-3 px-4">Valor Pago</th>
                        <th className="py-3 px-4">Créditos</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {transactionsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-zinc-500">
                            Nenhum pagamento registrado ainda.
                          </td>
                        </tr>
                      ) : (
                        transactionsList.map((tx) => (
                          <tr key={tx.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                              {new Date(tx.createdAt).toLocaleString('pt-AO')}
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700">
                                {tx.provider.toUpperCase()}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-white">{tx.userName}</div>
                              <div className="text-[11px] text-zinc-400">{tx.userEmail}</div>
                            </td>

                            <td className="py-3 px-4 font-mono text-zinc-300">
                              {tx.packageId}
                            </td>

                            <td className="py-3 px-4 font-bold text-emerald-400 font-mono">
                              {tx.provider.includes('multicaixa') || tx.provider === 'paypay'
                                ? `${tx.amountPaid.toLocaleString('pt-AO')} Kz`
                                : `R$ ${tx.amountPaid.toFixed(2)}`}
                            </td>

                            <td className="py-3 px-4 font-bold text-amber-400 font-mono">
                              +{tx.creditsAmount} cr
                            </td>

                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEMETRY & LOGS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Recent Runs */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase font-bold text-zinc-400 tracking-wider">
                  Últimas Execuções de Pipelines de IA
                </h3>
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">ID Run</th>
                        <th className="py-3 px-4">Utilizador</th>
                        <th className="py-3 px-4">Nós</th>
                        <th className="py-3 px-4">Tokens</th>
                        <th className="py-3 px-4">Custo</th>
                        <th className="py-3 px-4">Duração</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {(logsData?.recentRuns || []).map((run: any) => (
                        <tr key={run.id} className="hover:bg-zinc-800/40">
                          <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                            {run.id.slice(0, 10)}...
                          </td>
                          <td className="py-3 px-4 text-zinc-300">{run.user_email || 'Anônimo'}</td>
                          <td className="py-3 px-4 font-mono text-zinc-300">
                            {run.completed_nodes}/{run.total_nodes}
                          </td>
                          <td className="py-3 px-4 font-mono text-cyan-400">{run.total_tokens} tok</td>
                          <td className="py-3 px-4 font-mono text-amber-400">
                            {Number(run.total_cost_credits || 0).toFixed(3)} cr
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400">{run.duration_ms}ms</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                run.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {run.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: AJUSTAR CRÉDITOS */}
        {adjustingUser && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Ajustar Saldo de Créditos</h3>
                </div>
                <button
                  onClick={() => setAdjustingUser(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <div className="font-bold text-white">{adjustingUser.name}</div>
                <div className="text-zinc-400">{adjustingUser.email}</div>
                <div className="mt-2 text-amber-400 font-mono font-bold">
                  Saldo atual: {Number(adjustingUser.credits?.balance || 0).toFixed(2)} cr
                </div>
              </div>

              <form onSubmit={handleAdjustCreditsSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustMode('add')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      adjustMode === 'add'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Adicionar Saldo (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustMode('set')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      adjustMode === 'set'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    Definir Valor Exato
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Quantidade de Créditos
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Justificativa / Motivo (Para o Extrato)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bônus de parceria, suporte técnico"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingUser(null)}
                    className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirmar Ajuste
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: APROVAÇÃO MANUAL DE COMPROVATIVO */}
        {isManualModalOpen && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Aprovar Recarga por Comprovativo</h3>
                </div>
                <button
                  onClick={() => setIsManualModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleManualCreditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Selecionar Utilizador
                  </label>
                  <select
                    required
                    value={manualUserId}
                    onChange={(e) => setManualUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione o cliente...</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Pacote de Créditos
                  </label>
                  <select
                    value={manualPackageId}
                    onChange={(e) => setManualPackageId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pack-25">Starter (+25 créditos - 2.500 Kz)</option>
                    <option value="pack-50">Creator (+50 créditos - 5.000 Kz)</option>
                    <option value="pack-100">Pro Scale (+100 créditos - 9.500 Kz)</option>
                    <option value="pack-250">Agency (+250 créditos - 19.000 Kz)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Nº do Comprovativo / Referência
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MCX-TRANS-123456"
                    value={manualRef}
                    onChange={(e) => setManualRef(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Comprovativo validado via WhatsApp"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirmar e Creditar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
