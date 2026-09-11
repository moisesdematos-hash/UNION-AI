import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  FileCode, 
  ChevronRight, 
  Lightbulb, 
  Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: string;
  category?: string;
  relevantFiles?: string[];
  suggestedFollowUps?: string[];
}

interface ProjectOracleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_QUESTIONS = [
  'Como funciona o Data Bus e o DataPacket?',
  'O que é o Simulador de Conversão com Heatmap (Chave de Ouro)?',
  'Quais são os 14 blocos da Página de Vendas da Seção 27?',
  'Quais templates prontos estão disponíveis para uso?',
  'Como acessar as métricas Prometheus do backend?'
];

export function ProjectOracleDrawer({ isOpen, onClose }: ProjectOracleDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'oracle',
      text: `Olá! Sou o **UNION.AI Project Oracle**.\n\nFui treinado com o conhecimento completo e irrestrito de todo o código-fonte, arquitetura de Data Bus, motores de marketing, 18 gates do Canvas, 4 templates de produção e o novo **Simulador de Conversão com Heatmap**.\n\nComo posso orientar você ou tirar dúvidas sobre o sistema hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'QUICK_START',
      suggestedFollowUps: [
        'Como funciona o Simulador de Conversão?',
        'O que é o Data Bus e os tipos de portas?',
        'Quais são os 14 blocos de copy?'
      ]
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/ask-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const oracleMsg: ChatMessage = {
          id: `oracle-${Date.now()}`,
          sender: 'oracle',
          text: resData.data.answer,
          category: resData.data.category,
          relevantFiles: resData.data.relevantFiles,
          suggestedFollowUps: resData.data.suggestedFollowUps,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, oracleMsg]);
      } else {
        throw new Error(resData.error || 'Erro na resposta do Oracle');
      }
    } catch {
      // Fallback offline intelligent answer
      let answer = `Entendido! Analisando sua dúvida sobre "${text}". O UNION.AI integra pipelines visuais com tipos estritos de dados no Data Bus, 4 templates de produção, e agora o exclusivo AI Conversion Simulator com 5 personas sintéticas.`;
      if (text.toLowerCase().includes('simulador') || text.toLowerCase().includes('conversão')) {
        answer = `O **AI Conversion Simulator** avalia a copy com 5 personas sintéticas (Dr. Roberto Meirelles, Ana Lívia, Carlos Mendes, Mariana Costa, Lucas Rocha), calcula o CPS de 0 a 100 e permite Auto-Cura de blocos em 1 clique.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `oracle-${Date.now()}`,
          sender: 'oracle',
          text: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">UNION.AI Project Oracle</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Deep Knowledge
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Assistente técnico especialista em cada arquivo, schema e funcionalidade
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

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5" /> Dúvidas Frequentes:
        </span>
        {DEFAULT_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-cyan-950/50 border border-slate-700/60 hover:border-cyan-500/40 px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-bold text-slate-400">
                {msg.sender === 'user' ? 'Você' : 'Project Oracle'}
              </span>
              <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
            </div>

            <div
              className={`p-4 rounded-2xl max-w-[90%] text-sm leading-relaxed shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line font-sans prose prose-invert max-w-none text-sm">
                {msg.text}
              </div>

              {/* Relevant Files Box */}
              {msg.relevantFiles && msg.relevantFiles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 mb-1.5">
                    <FileCode className="w-3.5 h-3.5" /> Arquivos Relevantes no Código:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.relevantFiles.map((file, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-mono"
                      >
                        {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up suggestions */}
              {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/60 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Perguntas Sugeridas:
                  </span>
                  <div className="flex flex-col gap-1">
                    {msg.suggestedFollowUps.map((su, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(su)}
                        className="text-left text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 py-0.5 hover:underline cursor-pointer"
                      >
                        <ChevronRight className="w-3 h-3 text-cyan-400" />
                        {su}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-[70%]">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400 italic">Consultando base de conhecimento do projeto...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Pergunte qualquer coisa sobre o UNION.AI (arquitetura, rotas, telas, testes)..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
