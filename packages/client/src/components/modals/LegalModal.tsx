import React, { useState } from 'react';
import {
  X,
  Shield,
  FileText,
  BookOpen,
  CheckCircle2,
  Lock,
  Database,
  Cpu
} from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms' | 'docs' | 'security';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#0d1017] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-union-accent/15 border border-union-accent/30 text-union-accent flex items-center justify-center">
              {activeTab === 'privacy' && <Shield className="h-5 w-5" />}
              {activeTab === 'terms' && <FileText className="h-5 w-5" />}
              {activeTab === 'docs' && <BookOpen className="h-5 w-5" />}
              {activeTab === 'security' && <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Central de Governança & Documentação</h3>
              <p className="text-xs text-zinc-400">UNION.AI 2.0 Enterprise Compliance & Architecture</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center px-6 border-b border-zinc-800/60 bg-zinc-950/40 space-x-1 text-xs font-medium py-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-union-accent text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Política de Privacidade</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-union-accent text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Termos de Uso</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'bg-union-accent text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Documentação Técnica</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-union-accent text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Segurança & LGPD/GDPR</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          
          {/* TAB: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-zinc-800">
                <h4 className="text-lg font-bold text-white">Política de Privacidade & Proteção de Dados</h4>
                <p className="text-xs text-zinc-400">Última atualização: Setembro de 2026 • Versão 2.0</p>
              </div>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">1. Coleta e Finalidade dos Dados</h5>
                <p>
                  O <strong>UNION.AI</strong> opera sob o princípio de minimização de dados. Coletamos exclusivamente informações necessárias para a execução e orquestração dos fluxos de trabalho do usuário, incluindo credenciais de acesso, metadados de nós, parâmetros de configuração e históricos de execução em lote.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">2. Não-Utilização de Dados para Treinamento de Modelos</h5>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Compromisso de Confidencialidade:</strong> Nenhum dado, transcrição, briefing ou conteúdo gerado através dos nós do UNION.AI é utilizado para treinar ou aprimorar modelos de linguagem públicos (OpenAI, Anthropic, DeepSeek). As requisições são transmitidas via APIs empresariais com cláusula de zero retenção (Zero Data Retention).
                  </span>
                </div>
              </section>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">3. Isolamento Criptográfico e Multi-Inquilino</h5>
                <p>
                  Cada organização e usuário opera em um espaço de dados isolado com criptografia em repouso (AES-256) e em trânsito (TLS 1.3). O controle de acesso baseado em papéis (RBAC) garante que apenas membros autorizados com permissões explícitas possam visualizar ou editar os pipelines.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">4. Seus Direitos (LGPD & GDPR)</h5>
                <p>
                  Você possui o direito inalienável de solicitar a exportação integral de seus workflows em JSON/YAML, a eliminação permanente de históricos de execução e a revogação de tokens de autenticação a qualquer instante diretamente pelo painel de configurações.
                </p>
              </section>
            </div>
          )}

          {/* TAB: TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-zinc-800">
                <h4 className="text-lg font-bold text-white">Termos de Uso do Serviço UNION.AI</h4>
                <p className="text-xs text-zinc-400">Vigência a partir de Setembro de 2026</p>
              </div>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">1. Aceitação dos Termos</h5>
                <p>
                  Ao acessar a plataforma UNION.AI ou utilizar qualquer um de seus nós, barramentos de dados ou APIs, você concorda expressamente com os presentes termos e com o cumprimento de todas as leis e regulamentos aplicáveis.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">2. Propriedade Intelectual do Conteúdo Gerado</h5>
                <p>
                  Todo o conteúdo gerado por meio das esteiras de inteligência artificial (roteiros de VSL, páginas de vendas, criativos de anúncios, relatórios de persona) pertence integral e exclusivamente ao usuário que operou o pipeline. O UNION.AI não reivindica quaisquer direitos autorais ou royalties sobre os ativos produzidos.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">3. Contabilização e Consumo de Créditos</h5>
                <p>
                  A execução dos nós de IA consome créditos calculados proporcionalmente ao volume de tokens de entrada e saída, conforme exibido de forma transparente no modal de planejamento de execução antes de cada disparo. Créditos consumidos em execuções concluídas com sucesso não são reembolsáveis.
                </p>
              </section>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">4. Limitações e Uso Aceitável</h5>
                <p>
                  É estritamente proibido utilizar a infraestrutura do UNION.AI para geração de conteúdos ilegais, difamatórios, maliciosos ou para violação de direitos autorais de terceiros. A detecção de abusos acarretará na suspensão imediata da organização.
                </p>
              </section>
            </div>
          )}

          {/* TAB: DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-zinc-800">
                <h4 className="text-lg font-bold text-white">Documentação Técnica & Endpoints</h4>
                <p className="text-xs text-zinc-400">Referência rápida de engenharia e barramento de dados</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                    <Database className="h-4 w-4" />
                    <span>UNION Data Bus</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    O barramento transporta pacotes estritamente tipados via <code>DataPacket&lt;T&gt;</code> garantindo validação em tempo real entre portas de entrada e saída.
                  </p>
                  <div className="text-[11px] font-mono bg-black/50 p-2 rounded border border-zinc-800 text-zinc-300">
                    Types: URL | TRANSCRIPT | TEXT | TABLE | AI_RESPONSE
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold">
                    <Cpu className="h-4 w-4" />
                    <span>Cognitive Router & Groq Default</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Motor padrão ultra-rápido <strong>Groq Llama 3.3 70B</strong> com chaveamento inteligente para Claude 3.7 Sonnet, DeepSeek R1, GPT-4o e Gemini 1.5.
                  </p>
                  <div className="text-[11px] font-mono bg-black/50 p-2 rounded border border-zinc-800 text-zinc-300">
                    Default: Groq Llama 3.3 70B | Toposort Paralelo | 16 Templates
                  </div>
                </div>
              </div>

              <section className="space-y-2">
                <h5 className="font-bold text-white text-sm">Endpoints REST Principais</h5>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-emerald-400">GET /api/health</span>
                    <span className="text-zinc-400">Status, uptime e sub-sistemas ativos</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-cyan-400">POST /api/extractors/youtube</span>
                    <span className="text-zinc-400">Extração de transcrição com timestamps</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-purple-400">POST /api/marketing/sales-page</span>
                    <span className="text-zinc-400">Motor de 14 blocos psicológicos & CPS</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-pink-400">POST /api/ai/cinema-ebook</span>
                    <span className="text-zinc-400">Agente Cinema E-book (&gt;1.000 pal/cap)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <span className="text-amber-400">GET /metrics</span>
                    <span className="text-zinc-400">Telemetria Prometheus nativa</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-zinc-800">
                <h4 className="text-lg font-bold text-white">Segurança Enterprise, Auditoria & LGPD</h4>
                <p className="text-xs text-zinc-400">Padrões de conformidade e governança corporativa</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <Lock className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <strong className="text-white text-xs block">Isolamento Multi-Inquilino e RBAC</strong>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Separação lógica rígida entre organizações. Usuários com perfil VIEWER possuem permissão somente de leitura, EDITORS constroem nós e OWNERS gerenciam faturas e equipes.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <strong className="text-white text-xs block">Trilha de Auditoria Imutável (Audit Trail)</strong>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Cada ação, alteração de nó, execução de webhook ou débito de créditos é registrada em log estruturado com carimbo de tempo, IP e identificador do operador.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <Database className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <strong className="text-white text-xs block">Armazenamento Transacional SQLite WAL</strong>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Persistência atômica local com Write-Ahead Logging para garantir resiliência contra falhas e suporte a rollbacks instantâneos de versão.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">UNION.AI 2.0 • Security & Trust Portal</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
