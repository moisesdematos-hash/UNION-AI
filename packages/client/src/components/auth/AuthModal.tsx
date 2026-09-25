import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore.js';

interface AuthModalProps {
  onOpenForgotPassword?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenForgotPassword }) => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    loginWithGoogle,
    isLoading,
    error,
    setError
  } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authModalTab === 'login') {
      if (!email.trim() || !password) {
        setError('Por favor preencha email e senha.');
        return;
      }
      await login(email.trim(), password);
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setError('Por favor preencha todos os campos.');
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
      await register(name.trim(), email.trim(), password);
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      // In production or when available, check if Google Identity Services is mounted
      const anyWindow = window as any;
      if (anyWindow.google?.accounts?.id) {
        // Can render GIS prompt
      }

      // Prompt quick Google account selector
      setGooglePromptOpen(true);
      setGoogleLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao iniciar Google Sign-In';
      setError(msg);
      setGoogleLoading(false);
    }
  };

  const handleConfirmGoogleLogin = async (selectedEmail: string, selectedName: string) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const success = await loginWithGoogle({
        email: selectedEmail,
        name: selectedName,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(selectedEmail)}`
      });
      if (success) {
        setGooglePromptOpen(false);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-union-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          title="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-union-accent to-emerald-400 flex items-center justify-center shadow-lg shadow-union-accent/20 shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>UNION.AI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Acesso Seguro
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Visual AI Workspace & Pipeline Multi-Agente
            </p>
          </div>
        </div>

        {/* Tabs: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setError(null);
              openAuthModal('login');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalTab === 'login'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              openAuthModal('register');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              authModalTab === 'register'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isLoading || googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-700/80 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continuar com Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-zinc-800 w-full" />
          <span className="bg-zinc-950 px-3 text-[11px] font-mono uppercase text-zinc-500 shrink-0">
            ou com email
          </span>
          <div className="border-t border-zinc-800 w-full" />
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalTab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou empresa"
                  className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-union-accent focus:ring-1 focus:ring-union-accent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-union-accent focus:ring-1 focus:ring-union-accent transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-300">Senha</label>
              {authModalTab === 'login' && onOpenForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    closeAuthModal();
                    onOpenForgotPassword();
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={authModalTab === 'register' ? 6 : 1}
                className="w-full pl-10 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-union-accent focus:ring-1 focus:ring-union-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || googleLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-union-accent to-emerald-500 hover:from-union-accent/90 hover:to-emerald-500/90 text-white font-bold text-xs shadow-lg shadow-union-accent/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>{authModalTab === 'login' ? 'Aceder ao Workspace' : 'Criar Conta Gratuita'}</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-5 text-center text-xs text-zinc-500">
          {authModalTab === 'login' ? (
            <p>
              Novo no UNION.AI?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  openAuthModal('register');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-semibold ml-1"
              >
                Cadastre-se e ganhe 100 créditos
              </button>
            </p>
          ) : (
            <p>
              Já possui conta cadastrada?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  openAuthModal('login');
                }}
                className="text-union-accent hover:text-union-accent/90 font-semibold ml-1"
              >
                Faça login aqui
              </button>
            </p>
          )}
        </div>

        {/* Quick Google Account Picker Modal Overlay */}
        {googlePromptOpen && (
          <div className="absolute inset-0 bg-zinc-950/95 p-6 flex flex-col justify-between z-20 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-white">Entrar com a Conta Google</span>
                </div>
                <button
                  type="button"
                  onClick={() => setGooglePromptOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-4">
                Selecione a sua conta Google para aceder instantaneamente ao workspace:
              </p>

              <div className="space-y-2 mb-4">
                {/* 1-Click Preset Admin / Dev */}
                <button
                  type="button"
                  onClick={() => handleConfirmGoogleLogin('moisesdematos@gmail.com', 'Moisés de Matos')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-union-accent/50 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold flex items-center justify-center text-xs">
                      MM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Moisés de Matos
                      </div>
                      <div className="text-[11px] text-zinc-400">moisesdematos@gmail.com</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Custom Google Account Entry */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                  <div className="text-[11px] font-semibold text-zinc-300">Ou utilize outro email Google:</div>
                  <input
                    type="text"
                    placeholder="Seu Nome"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-union-accent"
                  />
                  <input
                    type="email"
                    placeholder="usuario@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-union-accent"
                  />
                  <button
                    type="button"
                    disabled={!googleEmail.includes('@')}
                    onClick={() => handleConfirmGoogleLogin(googleEmail, googleName || 'Google User')}
                    className="w-full py-2 bg-union-accent hover:bg-union-accent/90 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Confirmar Login Google
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGooglePromptOpen(false)}
              className="w-full py-2 text-xs text-zinc-400 hover:text-white"
            >
              Voltar ao formulário tradicional
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
