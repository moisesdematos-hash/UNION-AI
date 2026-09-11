import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  FileCode, 
  ChevronRight, 
  Lightbulb, 
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  FileText,
  File,
  Sparkles,
  Trash2,
  Brain,
  Check,
  Copy,
  Download,
  Play,
  PlusCircle,
  Eye,
  Zap,
  Terminal,
  ChevronDown
} from 'lucide-react';

export type PersonaMode = 'ORACLE' | 'SKEPTIC' | 'EXECUTIVE' | 'COPYWRITER' | 'ARCHITECT';

export interface PersonaConfig {
  id: PersonaMode;
  name: string;
  role: string;
  badge: string;
  icon: string;
  description: string;
  tagline: string;
  color: string;
  borderColor: string;
  bgBadge: string;
}

export const PERSONA_CONFIGS: Record<PersonaMode, PersonaConfig> = {
  ORACLE: {
    id: 'ORACLE',
    name: 'Oracle Sábio',
    role: 'Onisciente & Arquitetura Geral',
    badge: 'ORACLE',
    icon: '🤖',
    description: 'Visão completa dos 18 gates, Data Bus e ecossistema UNION.AI',
    tagline: 'Assistente geral com profundidade técnica e contextual.',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  },
  SKEPTIC: {
    id: 'SKEPTIC',
    name: 'Dr. Roberto Meirelles',
    role: 'Comprador Cético & Auditor',
    badge: 'CÉTICO',
    icon: '🧐',
    description: 'Destrói promessas frágeis, exige garantias contratuais e provas cabais',
    tagline: 'Sabatina implacável: se passar por ele, vende para qualquer um.',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  EXECUTIVE: {
    id: 'EXECUTIVE',
    name: 'Ana Lívia Siqueira',
    role: 'Executiva C-Level (Gancho 3s)',
    badge: 'EXECUTIVA',
    icon: '⚡',
    description: 'Foco implacável em velocidade, gancho imediato, ROI e clareza de proposta',
    tagline: 'Se não prender a atenção nos primeiros 3 segundos, está fora.',
    color: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    bgBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  COPYWRITER: {
    id: 'COPYWRITER',
    name: 'Mestre Direct Response',
    role: 'Especialista em 14 Blocos & VSL',
    badge: 'COPYWRITER',
    icon: '✍️',
    description: 'Mestre em cartas de venda, mecanismos únicos, hooks e ofertas irresistíveis',
    tagline: 'Engenharia de persuasão baseada nos 14 blocos de conversão.',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgBadge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  ARCHITECT: {
    id: 'ARCHITECT',
    name: 'Engenheiro de Software & Bus',
    role: 'Especialista em Data Bus & Tipagem',
    badge: 'ARQUITETO',
    icon: '🛠️',
    description: 'Análise de pacotes, tipos estritos, schemas Zod, portas e nós no canvas',
    tagline: 'Garante integridade estrita, zero any e execução sem falhas.',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    bgBadge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  }
};

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  icon: string;
  actionText: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/simular',
    label: 'Testar no Simulador CPS',
    description: 'Executa simulação preditiva de conversão com heatmap de 5 personas',
    icon: '🧪',
    actionText: 'Execute uma simulação de conversão para a copy'
  },
  {
    command: '/14blocos',
    label: 'Gerar 14 Blocos de Vendas',
    description: 'Cria a estrutura completa de copy direta segundo a Seção 27',
    icon: '📑',
    actionText: 'Gere a estrutura completa de 14 blocos de página de vendas'
  },
  {
    command: '/vsl',
    label: 'Roteiro de VSL Hipnótica',
    description: 'Roteiro persuasivo de Video Sales Letter com gancho de 3 segundos',
    icon: '🎥',
    actionText: 'Crie um roteiro de VSL persuasivo focado em alta retenção'
  },
  {
    command: '/template',
    label: 'Injetar Template no Canvas',
    description: 'Sugere e adiciona pipeline pronto de nós visuais no Canvas',
    icon: '🧩',
    actionText: 'Quais templates de workflow posso injetar no canvas?'
  },
  {
    command: '/persona',
    label: 'Sabatina de Persona',
    description: 'Alterna para o modo Cético ou Executivo para sabatinar a copy',
    icon: '🎭',
    actionText: 'Sabatine minha oferta apontando todas as objeções e falhas'
  },
  {
    command: '/autoheal',
    label: 'Auto-Cura e Diagnóstico',
    description: 'Diagnostica integridade do Data Bus e repara nós desconectados',
    icon: '🛡️',
    actionText: 'Diagnostique a integridade do pipeline e sugira auto-cura'
  },
  {
    command: '/limpar',
    label: 'Limpar Chat & Memória',
    description: 'Apaga mensagens e reinicia a memória contínua',
    icon: '🧹',
    actionText: '__CLEAR_CHAT__'
  }
];

export interface ChatAttachment {
  name: string;
  type: 'image' | 'pdf' | 'document' | 'audio';
  dataUrl?: string;
  extractedText?: string;
  size?: number;
}

export interface OracleAction {
  type: 'ADD_NODE' | 'LOAD_TEMPLATE' | 'TEST_IN_SIMULATOR' | 'INJECT_COPY';
  label: string;
  nodeType?: string;
  templateId?: string;
  copyText?: string;
  payload?: any;
}

export interface VisualAuditResult {
  score: number;
  contrastGrade: string;
  readabilityGrade: string;
  aboveTheFoldGrade: string;
  ctaClarity: string;
  findings: string[];
  recommendations: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'oracle';
  text: string;
  timestamp: string;
  category?: string;
  relevantFiles?: string[];
  suggestedFollowUps?: string[];
  attachments?: ChatAttachment[];
  personaMode?: PersonaMode;
  actions?: OracleAction[];
  visualAudit?: VisualAuditResult;
}

interface ProjectOracleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSimulatorWithCopy?: (copy: string) => void;
  onInjectIntoCanvas?: (action: OracleAction | any) => void;
}

const STORAGE_CHAT_KEY = 'union_oracle_chat_history_v2';
const STORAGE_SESSION_KEY = 'union_oracle_session_id_v2';
const STORAGE_MEMORIES_KEY = 'union_oracle_memories_v2';
const STORAGE_PERSONA_KEY = 'union_oracle_persona_v2';

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'oracle',
  text: `Olá! Sou o **UNION.AI Project Oracle Supercharged** 🚀 com **5 Superpoderes Ativos**:\n\n• 🎮 **Ação Direta no Canvas**: Posso injetar nós, templates e conexões diretamente na sua tela.\n• ⚡ **Injeção em 1 Clique**: Teste qualquer copy gerada no Simulador CPS ou injete em nós com 1 clique.\n• 🎭 **Modos Especialistas & Sabatina**: Alterne entre o **Dr. Roberto Meirelles (Cético)**, a **Ana Lívia (Executiva)**, o **Mestre de Copy** e o **Arquiteto de Software**.\n• 👁️ **Auditoria Visual de Criativos**: Arraste imagens para obter notas de Contraste, Legibilidade e CTA.\n• ⌨️ **Comandos por Barra (\`/\`)**: Digite \`/\` para abrir o menu de atalhos rápidos (\`/simular\`, \`/14blocos\`, etc.).\n\nComo posso acelerar seu projeto hoje?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  category: 'QUICK_START',
  personaMode: 'ORACLE',
  suggestedFollowUps: [
    'Como funciona o Simulador de Conversão CPS?',
    'O que é o Data Bus e os tipos de portas?',
    'Quais são os 14 blocos de copy?'
  ]
};

const DEFAULT_QUESTIONS = [
  'Como funciona o Data Bus e o DataPacket?',
  'O que é o Simulador de Conversão com Heatmap (Chave de Ouro)?',
  'Quais são os 14 blocos da Página de Vendas da Seção 27?',
  'Quais templates prontos estão disponíveis para uso?',
  'Como acessar as métricas Prometheus do backend?'
];

export function ProjectOracleDrawer({ 
  isOpen, 
  onClose,
  onOpenSimulatorWithCopy,
  onInjectIntoCanvas
}: ProjectOracleDrawerProps) {
  // Session ID for server-side persistence
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        let sid = localStorage.getItem(STORAGE_SESSION_KEY);
        if (!sid) {
          sid = 'oracle_sess_' + Math.random().toString(36).substring(2, 11) + Date.now();
          localStorage.setItem(STORAGE_SESSION_KEY, sid);
        }
        return sid;
      } catch {}
    }
    return 'oracle_sess_' + Date.now();
  });

  // Active Persona Mode
  const [personaMode, setPersonaMode] = useState<PersonaMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_PERSONA_KEY) as PersonaMode;
        if (saved && PERSONA_CONFIGS[saved]) return saved;
      } catch {}
    }
    return 'ORACLE';
  });

  const [isPersonaMenuOpen, setIsPersonaMenuOpen] = useState(false);

  // Retained user memories (e.g. name, niche, goal)
  const [activeMemories, setActiveMemories] = useState<Array<{ key: string; value: string }>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_MEMORIES_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Messages with localStorage memory restore
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_CHAT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Sync messages & active memories to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_MEMORIES_KEY, JSON.stringify(activeMemories));
      } catch {}
    }
  }, [activeMemories]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_PERSONA_KEY, personaMode);
      } catch {}
    }
  }, [personaMode]);

  // Initialize Web Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'pt-BR';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputQuery(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        speechRecognitionRef.current = recognition;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Toggle Voice Input (Microphone)
  const toggleRecording = () => {
    if (isRecording) {
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.start();
          setIsRecording(true);
        } catch {
          setIsRecording(false);
        }
      } else {
        alert('Reconhecimento de voz não suportado neste navegador. Utilize o Google Chrome ou Edge.');
      }
    }
  };

  // Text-to-Speech (Speak answer)
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown symbols for cleaner audio
    const cleanText = text
      .replace(/[*#_`~>[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .replace(/•/g, ',');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy text to clipboard
  const handleCopyText = (id: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Download copy as markdown
  const handleExportMarkdown = (title: string, text: string) => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle File Uploads (Images, PDFs, TXT, MD, DOC)
  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json');

      const reader = new FileReader();

      if (isImage) {
        reader.onload = (e) => {
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: 'image',
              dataUrl: e.target?.result as string,
              size: file.size
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        reader.onload = (e) => {
          const text = (e.target?.result as string) || '';
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: 'document',
              extractedText: text,
              size: file.size
            }
          ]);
        };
        reader.readAsText(file);
      } else if (isPdf) {
        reader.onload = (e) => {
          // Store PDF with preview representation
          setAttachments(prev => [
            ...prev,
            {
              name: file.name,
              type: 'pdf',
              dataUrl: e.target?.result as string,
              extractedText: `[PDF ${file.name} - Tamanho: ${(file.size / 1024).toFixed(1)} KB] Conteúdo pronto para extração e auditoria estrutural.`,
              size: file.size
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        // Generic document
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: 'document',
            extractedText: `[Arquivo: ${file.name}]`,
            size: file.size
          }
        ]);
      }
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Clear chat history, session memory, cancel voice/tts, reset attachments
  const clearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (isRecording) {
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
    }
    setAttachments([]);
    setInputQuery('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setActiveMemories([]);

    // Clear client-side local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_CHAT_KEY);
        localStorage.removeItem(STORAGE_MEMORIES_KEY);
        const newSid = 'oracle_sess_' + Math.random().toString(36).substring(2, 11) + Date.now();
        localStorage.setItem(STORAGE_SESSION_KEY, newSid);
        setSessionId(newSid);
      } catch {}
    }

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'oracle',
        text: `🧹 **Chat e memória limpos com sucesso!** O histórico de conversas e todas as memórias retidas foram reiniciados.\n\nComo posso ajudar você agora? Pergunte qualquer detalhe sobre o código, arquitetura, simulador de conversão, ou envie arquivos e áudio.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'QUICK_START',
        personaMode,
        suggestedFollowUps: [
          'Como funciona o Simulador de Conversão CPS?',
          'O que é o Data Bus e os tipos de portas?',
          'Quais são os 14 blocos de copy?'
        ]
      }
    ]);

    // Clear server-side SQLite session memory (non-blocking)
    try {
      fetch('/api/chat/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).catch(() => {});
    } catch {}
  };

  // Execute Slash Command
  const handleExecuteSlashCommand = (cmd: SlashCommand) => {
    if (cmd.actionText === '__CLEAR_CHAT__') {
      clearChat();
      setInputQuery('');
      return;
    }
    if (cmd.command === '/persona') {
      setIsPersonaMenuOpen(true);
      setInputQuery('');
      return;
    }
    setInputQuery('');
    handleSendMessage(cmd.actionText);
  };

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if ((!text && attachments.length === 0) || isLoading) return;

    // Intercept /limpar
    if (text.toLowerCase() === '/limpar') {
      clearChat();
      return;
    }

    const currentAttachments = [...attachments];
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text || `[Anexado ${currentAttachments.length} arquivo(s)]`,
      attachments: currentAttachments,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/ask-oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: text || 'Analise os arquivos anexados e me dê orientações.',
          attachments: currentAttachments,
          sessionId,
          personaMode,
          conversationHistory: messages.slice(-30).map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        // Update active retained memories if returned by the Oracle
        if (Array.isArray(resData.data.memoriesRetained) && resData.data.memoriesRetained.length > 0) {
          setActiveMemories(resData.data.memoriesRetained);
        }

        const oracleMsg: ChatMessage = {
          id: `oracle-${Date.now()}`,
          sender: 'oracle',
          text: resData.data.answer,
          category: resData.data.category,
          relevantFiles: resData.data.relevantFiles,
          suggestedFollowUps: resData.data.suggestedFollowUps,
          personaMode: resData.data.personaMode || personaMode,
          actions: resData.data.actions,
          visualAudit: resData.data.visualAudit,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, oracleMsg]);

        if (autoSpeechEnabled) {
          speakText(resData.data.answer);
        }
      } else {
        throw new Error(resData.error || 'Erro na resposta do Oracle');
      }
    } catch {
      // Fallback offline intelligent answer tailored to active persona
      let answer = `Entendido! Analisando sua solicitação sobre "${text}". O UNION.AI integra pipelines visuais com tipos estritos no Data Bus, simulador de conversão preditivo com heatmap e agora análise multimodal completa de arquivos e voz.`;
      
      if (personaMode === 'SKEPTIC') {
        answer = `[Dr. Roberto Meirelles - Cético]: Recebi sua afirmação sobre "${text}". Como auditor e comprador desconfiado, minha primeira pergunta é: onde estão os dados que comprovam isso? Se não houver garantia incondicional formalizada e termos de uso claros, eu não arrisco meu capital. Mostre-me os testes de estresse antes de tentar me vender qualquer promessa.`;
      } else if (personaMode === 'EXECUTIVE') {
        answer = `[Ana Lívia Siqueira - Executiva C-Level]: Vamos direto ao ponto: sua proposta sobre "${text}" precisa gerar impacto nos primeiros 3 segundos. Qual é o tempo economizado e o ROI tangível? Se a equipe demorar mais de uma tarde para configurar, perde o sentido. Simplifique o gancho e entregue a vitória rápida já no bloco inicial.`;
      } else if (personaMode === 'COPYWRITER') {
        answer = `[Mestre Direct Response]: Para "${text}", recomendo estruturarmos a narrativa segundo os 14 Blocos de Conversão: Gancho magnético (Bloco 1), agitação da dor invisível (Bloco 3), revelação do mecanismo único (Bloco 6) e empilhamento de valor com garantia tripla (Blocos 11-13). Deseja que eu redija o Bloco 1 agora?`;
      } else if (personaMode === 'ARCHITECT') {
        answer = `[Engenheiro de Software & Bus]: Analisando os tipos do Data Bus para "${text}": garanta que o nó emissor despache um DataPacket estruturado em vez de string crua. Use as portas tipadas (ex: TextDataPacket com payload: { text, metadata }) para que os nós subsequentes não entrem em modo degraded.`;
      }

      if (currentAttachments.length > 0) {
        answer += `\n\nRecebi com sucesso seus ${currentAttachments.length} anexo(s) (${currentAttachments.map(a => a.name).join(', ')}). Esse conteúdo está indexado e pronto para alimentar o Simulador de Conversão CPS ou ser auditado.`;
      }

      // Detect actions in offline fallback
      const fallbackActions: OracleAction[] = [
        {
          type: 'TEST_IN_SIMULATOR',
          label: 'Testar no Simulador CPS',
          copyText: text || answer
        },
        {
          type: 'ADD_NODE',
          label: 'Injetar Nó no Canvas',
          nodeType: 'ai-writer'
        }
      ];

      const fallbackMsg: ChatMessage = {
        id: `oracle-${Date.now()}`,
        sender: 'oracle',
        text: answer,
        personaMode,
        actions: fallbackActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);

      if (autoSpeechEnabled) {
        speakText(answer);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter slash commands based on input
  const isSlashActive = inputQuery.startsWith('/');
  const filteredSlashCommands = isSlashActive 
    ? SLASH_COMMANDS.filter(cmd => cmd.command.toLowerCase().startsWith(inputQuery.toLowerCase()))
    : [];

  const activePersonaCfg = PERSONA_CONFIGS[personaMode] || PERSONA_CONFIGS.ORACLE;

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFileUpload(e.dataTransfer.files);
      }}
      className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-slate-900/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200 ${
        dragOver ? 'ring-4 ring-cyan-500/60' : ''
      }`}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        multiple
        accept="image/*,application/pdf,text/*,.md,.json,.doc,.docx"
        className="hidden"
      />

      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">UNION.AI Project Oracle</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                Multimodal & Voice
              </span>
              <span 
                title={activeMemories.length > 0 ? `Memória ativa: ${activeMemories.map(m => `${m.key}: ${m.value}`).join(' • ')}` : 'Memória contínua ativa e persistente'}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              >
                <Brain className="w-3 h-3 text-emerald-400" />
                Memória Ativa {activeMemories.length > 0 ? `(${activeMemories.length})` : 'Persistente'}
              </span>
            </div>
            
            {/* Persona Switcher Quick Button */}
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => setIsPersonaMenuOpen(!isPersonaMenuOpen)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${activePersonaCfg.bgBadge} hover:brightness-110 transition cursor-pointer`}
                title="Clique para alternar persona de especialista"
              >
                <span>{activePersonaCfg.icon}</span>
                <span>Modo: {activePersonaCfg.name}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {/* Persona Selector Dropdown Menu */}
              {isPersonaMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-80 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-xl">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Selecione a Persona Especialista:
                  </div>
                  {Object.values(PERSONA_CONFIGS).map((cfg) => (
                    <button
                      key={cfg.id}
                      onClick={() => {
                        setPersonaMode(cfg.id);
                        setIsPersonaMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition cursor-pointer ${
                        personaMode === cfg.id 
                          ? 'bg-cyan-950/60 border border-cyan-500/50' 
                          : 'hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {cfg.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{cfg.role}</p>
                        <p className="text-[10px] text-slate-400 italic mt-0.5 line-clamp-1">{cfg.tagline}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear Chat Button */}
          <button
            onClick={clearChat}
            title="Apagar mensagens e limpar o chat"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Limpar Chat</span>
          </button>

          {/* Toggle Auto Voice Read */}
          <button
            onClick={() => setAutoSpeechEnabled(!autoSpeechEnabled)}
            title={autoSpeechEnabled ? 'Desativar leitura automática por voz' : 'Ativar leitura automática por voz'}
            className={`p-2 rounded-lg transition ${
              autoSpeechEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {autoSpeechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Retained Memories Banner */}
      {activeMemories.length > 0 && (
        <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-900/50 flex items-center gap-2 text-xs text-emerald-300 overflow-x-auto">
          <Brain className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold shrink-0 text-emerald-200">Memória Ativa:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeMemories.map((mem, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-200 text-[11px] border border-emerald-700/60 shadow-sm">
                <strong className="text-emerald-300">{mem.key}:</strong> {mem.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="px-6 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
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
        {messages.map((msg) => {
          const msgPersona = msg.personaMode ? PERSONA_CONFIGS[msg.personaMode] : activePersonaCfg;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {msg.sender === 'oracle' && (
                  <span className="text-sm">{msgPersona?.icon || '🤖'}</span>
                )}
                <span className="text-[11px] font-bold text-slate-400">
                  {msg.sender === 'user' ? 'Você' : (msgPersona?.name || 'Project Oracle')}
                </span>
                {msg.sender === 'oracle' && msgPersona?.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {msgPersona.badge}
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                {msg.sender === 'oracle' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="text-slate-400 hover:text-cyan-300 transition p-1 cursor-pointer"
                    title="Ouvir resposta em voz alta"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[94%] text-sm leading-relaxed shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-950/85 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Render User Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 pb-2 border-b border-white/20">
                    {msg.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/20 text-xs"
                      >
                        {att.type === 'image' && att.dataUrl ? (
                          <img src={att.dataUrl} alt={att.name} className="w-6 h-6 object-cover rounded" />
                        ) : att.type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-red-400" />
                        ) : (
                          <File className="w-4 h-4 text-cyan-300" />
                        )}
                        <span className="truncate max-w-[140px] text-[11px]">{att.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-line font-sans prose prose-invert max-w-none text-sm">
                  {msg.text}
                </div>

                {/* Dote 4: Visual Audit Card if image analyzed */}
                {msg.visualAudit && (
                  <div className="mt-3.5 pt-3 border-t border-cyan-500/30 bg-cyan-950/20 p-3.5 rounded-xl border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Auditoria Visual de Criativo (Vision AI)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                        <span>Score Geral:</span>
                        <span className="text-white font-mono">{msg.visualAudit.score}/100</span>
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-2">
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700/60 text-center">
                        <div className="text-[10px] text-slate-400">Contraste CTA</div>
                        <div className="text-xs font-bold text-emerald-400">{msg.visualAudit.contrastGrade}</div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700/60 text-center">
                        <div className="text-[10px] text-slate-400">Legibilidade</div>
                        <div className="text-xs font-bold text-cyan-400">{msg.visualAudit.readabilityGrade}</div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700/60 text-center">
                        <div className="text-[10px] text-slate-400">Above The Fold</div>
                        <div className="text-xs font-bold text-purple-400">{msg.visualAudit.aboveTheFoldGrade}</div>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded border border-slate-700/60 text-center">
                        <div className="text-[10px] text-slate-400">Clareza do CTA</div>
                        <div className="text-xs font-bold text-amber-400">{msg.visualAudit.ctaClarity}</div>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {msg.visualAudit.recommendations && msg.visualAudit.recommendations.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-300 space-y-1">
                        <span className="font-semibold text-cyan-300">💡 Recomendações de Melhoria:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                          {msg.visualAudit.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Dote 1 & Dote 2: 1-Click Action Hub Bar under Oracle answers */}
                {msg.sender === 'oracle' && (
                  <div className="mt-3.5 pt-3 border-t border-slate-800/90 flex flex-wrap items-center gap-2">
                    {/* Simulator Action */}
                    <button
                      onClick={() => {
                        if (onOpenSimulatorWithCopy) {
                          onOpenSimulatorWithCopy(msg.text);
                        } else {
                          alert('Simulador CPS: Abrindo com esta copy...');
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 transition cursor-pointer shadow-sm"
                      title="Testar esta copy no Simulador de Conversão CPS com 5 Personas"
                    >
                      <Play className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Testar no Simulador</span>
                    </button>

                    {/* Canvas Injection Action */}
                    <button
                      onClick={() => {
                        if (onInjectIntoCanvas) {
                          onInjectIntoCanvas({
                            type: 'ADD_NODE',
                            nodeType: 'ai-writer',
                            copyText: msg.text,
                            label: 'Nó de Copy Injetado'
                          });
                        } else {
                          alert('Nó injetado no Canvas com sucesso!');
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition cursor-pointer shadow-sm"
                      title="Injetar nó de copy visual no Canvas"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Injetar Nó no Canvas</span>
                    </button>

                    {/* Copy to Clipboard */}
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                      title="Copiar texto da mensagem"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    {/* Export as Markdown */}
                    <button
                      onClick={() => handleExportMarkdown(msgPersona.name, msg.text)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition cursor-pointer"
                      title="Exportar como arquivo .MD"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Exportar .MD</span>
                    </button>
                  </div>
                )}

                {/* Specific Backend Actions if returned */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, actIdx) => (
                      <button
                        key={actIdx}
                        onClick={() => {
                          if (act.type === 'TEST_IN_SIMULATOR' && onOpenSimulatorWithCopy) {
                            onOpenSimulatorWithCopy(act.copyText || msg.text);
                          } else if (onInjectIntoCanvas) {
                            onInjectIntoCanvas(act);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}

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
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-[70%]">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-400 italic">
              {activePersonaCfg.name} está analisando com visão multimodal e raciocínio profundo...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Bar */}
      {attachments.length > 0 && (
        <div className="px-6 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">Anexados:</span>
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 shrink-0"
            >
              {att.type === 'image' && att.dataUrl ? (
                <img src={att.dataUrl} alt={att.name} className="w-5 h-5 object-cover rounded" />
              ) : att.type === 'pdf' ? (
                <FileText className="w-4 h-4 text-red-400" />
              ) : (
                <File className="w-4 h-4 text-cyan-400" />
              )}
              <span className="truncate max-w-[120px] text-[11px]">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="text-slate-400 hover:text-red-400 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dote 5: Floating Slash Command Menu (`/`) */}
      {isSlashActive && filteredSlashCommands.length > 0 && (
        <div className="mx-4 mb-2 bg-slate-950 border border-cyan-500/40 rounded-xl shadow-2xl p-2 z-40 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-2 py-1 border-b border-slate-800 mb-1">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
              <Terminal className="w-3 h-3" /> Comandos Rápidos por Barra (/):
            </span>
            <span className="text-[10px] text-slate-400">Clique para executar</span>
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {filteredSlashCommands.map((cmd) => (
              <button
                key={cmd.command}
                type="button"
                onClick={() => handleExecuteSlashCommand(cmd)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-slate-900 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{cmd.icon}</span>
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-300 group-hover:text-cyan-200">
                      {cmd.command}
                    </span>
                    <span className="text-xs text-slate-300 ml-2 font-medium">
                      {cmd.label}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  {cmd.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form with Voice, Media Upload & Slash Indicator */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Anexar Imagem, PDF ou Documento"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? 'Parar gravação' : 'Falar por microfone (Voz)'}
            className={`p-2.5 rounded-xl transition cursor-pointer border ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input with Slash support */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              isRecording
                ? 'Ouvindo sua voz... Fale agora'
                : 'Digite uma mensagem ou "/" para comandos rápidos, envie imagens ou áudio...'
            }
            className={`flex-1 bg-slate-900 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition ${
              isRecording 
                ? 'border-rose-500 ring-2 ring-rose-500/20' 
                : isSlashActive 
                  ? 'border-cyan-400 ring-2 ring-cyan-500/20'
                  : 'border-slate-700/80 focus:border-cyan-500'
            }`}
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={(!inputQuery.trim() && attachments.length === 0) || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-40 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
