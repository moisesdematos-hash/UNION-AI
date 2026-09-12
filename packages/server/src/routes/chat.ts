import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProjectOracleService } from '../services/chat/project-oracle-service.js';
import { generateThematicEbook } from '../services/ai/thematic-ebook-engine.js';

export const chatRouter = Router();

const OracleQuestionSchema = z.object({
  question: z.string().min(1),
  context: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  personaMode: z.enum(['ORACLE', 'SKEPTIC', 'EXECUTIVE', 'COPYWRITER', 'ARCHITECT']).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.enum(['image', 'pdf', 'document', 'audio']),
    dataUrl: z.string().optional(),
    extractedText: z.string().optional(),
    size: z.number().optional()
  })).optional(),
  conversationHistory: z.array(z.object({
    sender: z.enum(['user', 'oracle']),
    text: z.string()
  })).optional()
});

/**
 * POST /api/chat/ask-oracle
 * Interacts with the Project Oracle knowledgeable about the entire UNION.AI system.
 */
chatRouter.post('/ask-oracle', async (req: Request, res: Response) => {
  try {
    const data = OracleQuestionSchema.parse(req.body);
    const answer = await ProjectOracleService.answerQuestion(data);

    res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query Project Oracle'
    });
  }
});

/**
 * GET /api/chat/history/:sessionId
 * Retrieves chat history and active memories for a session.
 */
chatRouter.get('/history/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const history = ProjectOracleService.getSessionHistory(sessionId);
    const memories = ProjectOracleService.getSessionMemories(sessionId);

    res.status(200).json({
      success: true,
      data: {
        messages: history,
        memories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve chat history'
    });
  }
});

/**
 * GET /api/chat/memories/:sessionId
 * Retrieves stored persistent memories for a session.
 */
chatRouter.get('/memories/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const memories = ProjectOracleService.getSessionMemories(sessionId);

    res.status(200).json({
      success: true,
      data: memories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve memories'
    });
  }
});

/**
 * POST /api/chat/clear-history
 * Wipes out all conversation history and retained memories for a session.
 */
chatRouter.post('/clear-history', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      ProjectOracleService.clearSession(sessionId);
    }

    res.status(200).json({
      success: true,
      message: 'Chat history and session memory cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear chat history'
    });
  }
});

// --- UNION FORGE (MAGIC BOX) & ACELERADORES (BOOSTERS) ---
const ForgeCreateSchema = z.object({
  type: z.enum(['EBOOK', 'IMAGE', 'PRODUCT', 'AVATAR']),
  prompt: z.string().min(1),
  title: z.string().optional(),
  targetNiche: z.string().optional(),
  tone: z.string().optional(),
  pageCount: z.union([z.number(), z.string()]).optional(),
  wordsPerChapter: z.union([z.number(), z.string()]).optional(),
  includeImages: z.boolean().optional()
});

const AcceleratorRunSchema = z.object({
  acceleratorId: z.string().min(1),
  input: z.string().min(1),
  options: z.record(z.unknown()).optional()
});

export const ACCELERATORS_CATALOG = [
  {
    id: 'acc-viral-hook',
    name: 'Fábrica de Ganchos Hipnóticos (3 Segundos)',
    category: 'VIRAL_CONTENT',
    icon: 'Zap',
    badge: 'Retenção 80%+',
    description: '10 variações de ganchos visuais e falados projetados para travar a rolagem nos primeiros 3s.',
    actionPrompt: 'Gere 10 ganchos hipnóticos para vídeos curtos sobre: '
  },
  {
    id: 'acc-viral-carousel',
    name: 'Carrossel Viral de 10 Slides',
    category: 'VIRAL_CONTENT',
    icon: 'Layers',
    badge: '10 Slides Prontos',
    description: 'Slide a slide com capa magnética, dados reveladores e CTA de salvamento.',
    actionPrompt: 'Crie o conteúdo completo de um carrossel de 10 slides para: '
  },
  {
    id: 'acc-viral-thread',
    name: 'Thread Viral de Alto Engajamento',
    category: 'VIRAL_CONTENT',
    icon: 'Sparkles',
    badge: 'Efeito Bola de Neve',
    description: 'Sequência de 7 tweets/posts com abertura polêmica, storytelling e fechamento memorável.',
    actionPrompt: 'Escreva uma thread viral irresistível sobre: '
  },
  {
    id: 'acc-viral-yt-script',
    name: 'Roteiro de YouTube de Alta Retenção',
    category: 'VIRAL_CONTENT',
    icon: 'Video',
    badge: 'Retenção 70%+',
    description: 'Cria gancho de 3s, abertura magnética, 3 pontos de conflito e CTA irresistível.',
    actionPrompt: 'Gere um roteiro completo de YouTube com gancho magnético para: '
  },
  {
    id: 'acc-viral-shorts-reels',
    name: 'Pack de 5 Reels / Shorts / TikToks',
    category: 'VIRAL_CONTENT',
    icon: 'Zap',
    badge: 'Viral Hooks',
    description: '5 roteiros dinâmicos com quebra de padrão visual e legendas magnéticas.',
    actionPrompt: 'Gere 5 roteiros curtos de alta viralidade (Reels/Shorts) para: '
  },
  {
    id: 'acc-mkt-vsl-beast',
    name: 'VSL Beast Mode (12 Passos)',
    category: 'MARKETING',
    icon: 'Play',
    badge: 'Direct Response',
    description: 'Roteiro de Video Sales Letter estruturado com Mecanismo Único e prova inquestionável.',
    actionPrompt: 'Escreva um roteiro de VSL persuasivo em modo Beast Mode para: '
  },
  {
    id: 'acc-mkt-ad-matrix',
    name: 'Matriz Omnichannel de Anúncios (Meta, Google, TikTok)',
    category: 'MARKETING',
    icon: 'Target',
    badge: '9 Criativos',
    description: 'Ganchos focados em Dor, Desejo e Curiosidade para Stories, Feed e Pesquisa.',
    actionPrompt: 'Crie uma matriz completa de anúncios para Meta, Google e TikTok sobre: '
  },
  {
    id: 'acc-mkt-usp-beast',
    name: 'Proposta Única de Vendas (USP) Imbatível',
    category: 'MARKETING',
    icon: 'Sparkles',
    badge: 'Diferenciação',
    description: 'Formula a promessa central que torna a concorrência irrelevante.',
    actionPrompt: 'Desenvolva a USP e o Mecanismo Único imbatível para: '
  },
  {
    id: 'acc-ext-clone-voice',
    name: 'Clonagem de Tom de Voz & DNA de Influencer',
    category: 'EXTRACTION',
    icon: 'Bot',
    badge: 'DNA Vocal',
    description: 'Extrai o padrão sintático, cadência e estilo de um autor para replicar.',
    actionPrompt: 'Analise e extraia o DNA de tom de voz para clonagem deste estilo: '
  },
  {
    id: 'acc-ext-vsl-teardown',
    name: 'Engenharia Reversa de VSL Vencedora',
    category: 'EXTRACTION',
    icon: 'Search',
    badge: 'Desmontagem',
    description: 'Desmonta qualquer vídeo de vendas em suas micro-etapas psicológicas.',
    actionPrompt: 'Faça a engenharia reversa das etapas psicológicas desta oferta: '
  }
];

chatRouter.post('/forge/create', (req: Request, res: Response) => {
  try {
    const data = ForgeCreateSchema.parse(req.body);
    const { type, prompt, title, targetNiche } = data;

    let resultPayload: any = {};

    if (type === 'EBOOK') {
      resultPayload = generateThematicEbook({
        prompt,
        title,
        targetNiche,
        pageCount: data.pageCount,
        wordsPerChapter: data.wordsPerChapter,
        tone: data.tone,
        audienceLevel: (req.body as any).audienceLevel
      });
    } else if (type === 'IMAGE') {
      const mockVisualUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`;
      resultPayload = {
        type: 'IMAGE',
        prompt,
        aspectRatio: '16:9',
        imageUrl: mockVisualUrl,
        promptExpanded: `High conversion ad creative, subject: ${prompt}, ultra detailed, studio lighting, hyperrealistic 8k.`
      };
    } else if (type === 'PRODUCT') {
      resultPayload = {
        type: 'PRODUCT',
        name: title || `Solução de Elite: ${prompt.slice(0, 30)}`,
        corePromise: `Como dominar ${prompt} e multiplicar seus resultados em tempo recorde com previsibilidade.`,
        targetAudience: targetNiche || 'Empreendedores e Profissionais Digitais',
        pricePoint: '12x de R$ 97,00 ou R$ 997,00 à vista',
        deliverables: [
          'Acesso completo ao método passo a passo em vídeo',
          'Templates e esteiras pré-configuradas no UNION.AI',
          'Sessões de mentoria e tira-dúvidas',
          'Comunidade exclusiva de operadores de alta performance'
        ],
        bonuses: [
          'Bônus 1: Pack de Aceleradores Virais (Valor: R$ 497)',
          'Bônus 2: Checklist de Auditoria Visual de Criativos (Valor: R$ 297)'
        ],
        guarantee: 'Garantia Incondicional de 7 Dias: 100% de reembolso se não gostar.'
      };
    } else if (type === 'AVATAR') {
      resultPayload = {
        type: 'AVATAR',
        name: `Persona Ideal para ${prompt.slice(0, 30)}`,
        demographics: 'Homens e Mulheres de 25 a 45 anos',
        primaryPain: `Sobrecarga e falta de tempo ao tentar executar ${prompt} manualmente sem processos claros.`,
        deepDesire: `Automação, previsibilidade de receita e liberdade de escala.`,
        biggestFear: 'Gastar tempo e dinheiro sem retorno tangível.',
        awarenessLevel: 'PROBLEM_AWARE'
      };
    }

    res.status(200).json({
      success: true,
      data: resultPayload
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Falha na Union Forge'
    });
  }
});

chatRouter.get('/forge/accelerators', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: ACCELERATORS_CATALOG
  });
});

chatRouter.post('/forge/run-accelerator', (req: Request, res: Response) => {
  try {
    const { acceleratorId, input } = AcceleratorRunSchema.parse(req.body);
    const accelerator = ACCELERATORS_CATALOG.find(a => a.id === acceleratorId);

    if (!accelerator) {
      return res.status(404).json({
        success: false,
        error: `Acelerador não encontrado: ${acceleratorId}`
      });
    }

    const outputContent = `# ⚡ ${accelerator.name}\n\n**Tema/Entrada:** ${input}\n\n---\n\n### 1. Gancho Inicial Magnético (0-3s)\n"Se você ainda tenta resolver ${input} sem um mecanismo único, você está competindo no nível mais difícil."\n\n### 2. Desenvolvimento com Alto Valor Percebido\nEm vez de entregar mais do mesmo, nós agredimos a causa-raiz invisível. Isso gera contraste imediato com todos os outros anúncios e conteúdos do seu nicho.\n\n### 3. Chamada para Ação Estratégica (CTA)\nClique no botão abaixo, teste no **Simulador CPS do UNION.AI** e comprove a nota de conversão!`;

    res.status(200).json({
      success: true,
      data: {
        acceleratorId: accelerator.id,
        acceleratorName: accelerator.name,
        category: accelerator.category,
        outputContent,
        input
      }
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'Falha ao rodar acelerador'
    });
  }
});
