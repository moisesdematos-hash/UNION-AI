import React, { useState } from 'react';
import { X, Mail, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialToken = ''
}) => {
  const [step, setStep] = useState<'request' | 'reset'>(initialToken ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();
      if (res.ok) {
        setNotice({
          type: 'success',
          message: data.message || 'Se o email for cadastrado, você receberá o link para redefinir sua senha.'
        });
      } else {
        setNotice({
          type: 'error',
          message: data.message || 'Erro ao processar solicitação.'
        });
      }
    } catch {
      setNotice({
        type: 'error',
        message: 'Falha na conexão com o servidor. Verifique sua rede.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setNotice({ type: 'error', message: 'A nova senha deve conter pelo menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'As senhas digitadas não coincidem.' });
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotice({
          type: 'success',
          message: 'Senha redefinida com sucesso! Você já pode entrar com a nova credencial.'
        });
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setNotice({
          type: 'error',
          message: data.message || 'Token inválido ou expirado.'
        });
      }
    } catch {
      setNotice({
        type: 'error',
        message: 'Falha na conexão com o servidor.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Recuperação de Acesso</h2>
              <p className="text-xs text-zinc-400">Segurança de contas e credenciais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 my-4 p-1 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => { setStep('request'); setNotice(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              step === 'request' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. Solicitar Link
          </button>
          <button
            type="button"
            onClick={() => { setStep('reset'); setNotice(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              step === 'reset' ? 'bg-zinc-800 text-white font-semibold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Digitar Token
          </button>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            )}
            <span>{notice.message}</span>
          </div>
        )}

        {/* Step 1: Request Link */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                E-mail cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5">
                Enviaremos um link de uso único válido por 60 minutos para redefinir sua senha.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando instruções...</span>
                </>
              ) : (
                <>
                  <span>Enviar Link de Recuperação</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Reset with Token */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Token de Recuperação
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Cole aqui o token recebido por e-mail"
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nova Senha (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirmação da Nova Senha
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token || !newPassword}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <>
                  <span>Salvar Nova Senha</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
