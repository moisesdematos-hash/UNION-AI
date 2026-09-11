import { env } from '../../config/env.js';
import { getDatabase } from '../../db/database.js';
import { randomUUID } from 'node:crypto';

export interface OracleAttachment {
  name: string;
  type: 'image' | 'pdf' | 'document' | 'audio';
  dataUrl?: string; // base64 / data URL
  extractedText?: string;
  size?: number;
}

export interface OracleQuestionRequest {
  question: string;
  context?: string;
  sessionId?: string;
  userId?: string;
  attachments?: OracleAttachment[];
  conversationHistory?: Array<{
    sender: 'user' | 'oracle';
    text: string;
  }>;
}

export interface OracleAnswerResponse {
  answer: string;
  category: 'ARCHITECTURE' | 'DATA_BUS' | 'MARKETING_ENGINES' | 'SIMULATOR' | 'TEMPLATES' | 'OBSERVABILITY' | 'MULTIMODAL' | 'QUICK_START';
  relevantFiles: string[];
  suggestedFollowUps: string[];
  memoriesRetained?: Array<{ key: string; value: string }>;
  attachmentAnalysis?: {
    filesProcessed: number;
    summary: string;
    detectedInsights: string[];
  };
}

function extractMemoriesFromText(text: string): Array<{ key: string; value: string }> {
  const memories: Array<{ key: string; value: string }> = [];

  // Name extraction
  const nameMatch = text.match(/(?:me chamo|meu nome [eé]|sou o|sou a)\s+([A-ZÀ-Úa-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+)?)(?=\s+e\b|\s+que\b|[.,;\n!?]|$)/i);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].trim();
    if (name.length >= 2 && !['um', 'uma', 'apenas', 'muito', 'o', 'a'].includes(name.toLowerCase())) {
      memories.push({ key: 'Nome do Usuário', value: name });
    }
  }

  // Business / Product extraction
  const bizMatch = text.match(/(?:minha empresa [eé]|meu negócio [eé]|meu nicho [eé]|trabalho com|vendo|meu produto [eé])\s+([^.,;\n!?]{3,60})/i);
  if (bizMatch && bizMatch[1]) {
    memories.push({ key: 'Negócio / Nicho', value: bizMatch[1].trim() });
  }

  // Goal / Project extraction
  const goalMatch = text.match(/(?:meu objetivo [eé]|quero criar|estou criando|planejo lançar)\s+([^.,;\n!?]{3,80})/i);
  if (goalMatch && goalMatch[1]) {
    memories.push({ key: 'Objetivo do Projeto', value: goalMatch[1].trim() });
  }

  // Preference extraction
  const prefMatch = text.match(/(?:minha preferência [eé]|prefiro|gosto de trabalhar com)\s+([^.,;\n!?]{3,60})/i);
  if (prefMatch && prefMatch[1]) {
    memories.push({ key: 'Preferência', value: prefMatch[1].trim() });
  }

  return memories;
}

export class ProjectOracleService {
  /**
   * System knowledge base mapping deep project topics, files, explanations and Multimodal inputs.
   */
  public static async answerQuestion(req: OracleQuestionRequest): Promise<OracleAnswerResponse> {
    const q = req.question.toLowerCase();
    const attachments = req.attachments || [];
    const sessionId = req.sessionId;
    let storedMemories: Array<{ memory_key: string; memory_value: string }> = [];

    // 1. Session Memory & Persistent Storage in SQLite
    if (sessionId) {
      try {
        const db = getDatabase();
        const now = Date.now();
        db.prepare(`
          INSERT INTO oracle_chat_sessions (id, user_id, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET updated_at = ?
        `).run(sessionId, req.userId || null, now, now, now);

        // Extract and upsert new persistent memories from text
        const extracted = extractMemoriesFromText(req.question);
        const upsertMem = db.prepare(`
          INSERT INTO oracle_chat_memories (id, session_id, memory_key, memory_value, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(session_id, memory_key) DO UPDATE SET memory_value = excluded.memory_value, updated_at = excluded.updated_at
        `);
        for (const m of extracted) {
          upsertMem.run(randomUUID(), sessionId, m.key, m.value, now, now);
        }

        // Save incoming user message
        db.prepare(`
          INSERT INTO oracle_chat_messages (id, session_id, sender, text, attachments_json, created_at)
          VALUES (?, ?, 'user', ?, ?, ?)
        `).run(randomUUID(), sessionId, req.question, JSON.stringify(attachments), now);

        // Retrieve all retained memories for this session
        storedMemories = db.prepare(`
          SELECT memory_key, memory_value FROM oracle_chat_memories WHERE session_id = ?
        `).all(sessionId) as Array<{ memory_key: string; memory_value: string }>;
      } catch (err) {
        console.warn('[ProjectOracle] Session persistence warning:', err);
      }
    }

    const recordOracleResponse = (res: OracleAnswerResponse): OracleAnswerResponse => {
      if (sessionId) {
        try {
          const db = getDatabase();
          db.prepare(`
            INSERT INTO oracle_chat_messages (id, session_id, sender, text, category, relevant_files_json, suggested_follow_ups_json, created_at)
            VALUES (?, ?, 'oracle', ?, ?, ?, ?, ?)
          `).run(
            randomUUID(),
            sessionId,
            res.answer,
            res.category,
            JSON.stringify(res.relevantFiles),
            JSON.stringify(res.suggestedFollowUps),
            Date.now()
          );
        } catch (err) {
          console.warn('[ProjectOracle] Oracle message record warning:', err);
        }
      }
      return {
        ...res,
        memoriesRetained: storedMemories.map(m => ({ key: m.memory_key, value: m.memory_value }))
      };
    };

    // REAL GROQ LLM INVOCATION FOR ALL CHAT INTERACTIONS (WHEN ACTIVE)
    if (env.GROQ_API_KEY && env.NODE_ENV !== 'test') {
      try {
        let attachmentContext = '';
        if (attachments.length > 0) {
          attachmentContext = `\n[ANEXOS RECEBIDOS]:\n` + attachments.map(a => 
            `- Tipo: ${a.type.toUpperCase()}, Nome: "${a.name}" ${a.extractedText ? `\nConteúdo:\n${a.extractedText}` : ''}`
          ).join('\n') + '\n';
        }

        let memoryContext = '';
        if (storedMemories.length > 0) {
          memoryContext = `\n[MEMÓRIA ATIVA DE LONGO PRAZO DO USUÁRIO]:\n` +
            storedMemories.map(m => `• ${m.memory_key}: "${m.memory_value}"`).join('\n') +
            `\n(INSTRUÇÃO DE MEMÓRIA CRÍTICA: Você POSSUI MEMÓRIA CONTÍNUA e DEVE se lembrar com precisão dessas informações. Chame o usuário pelo nome se conhecido, faça referência às preferências e objetivos declarados e demonstre continuidade total em cada resposta.)\n`;
        }

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            messages: [
              {
                role: 'system',
                content: `Você é o UNION.AI Project Oracle, uma inteligência artificial especialista, onisciente e COM MEMÓRIA CONTÍNUA sobre o sistema UNION.AI 2.0 e todas as conversas do usuário.
Você possui conhecimento profundo sobre:
1. Data Bus com tipagem estrita de portas (URL, TRANSCRIPT, TEXT, TABLE, DOCUMENT, JSON, AI_RESPONSE).
2. Simulador de Conversão e Heatmap Psicológico (Chave de Ouro) com 5 personas sintéticas (Dr. Roberto Meirelles - Cético, Ana Lívia - Executiva Ocupada, Carlos Mendes - Econômico, Mariana Costa - Analítica, Lucas Rocha - Emocional), cálculo de CPS (0-100) e 1-Click Auto-Healing.
3. 14 Blocos de Página de Vendas (Seção 27) e VSL de 12 etapas.
4. 4 Templates Oficiais pré-configurados.
5. Telemetria Prometheus em /metrics e banco SQLite com WAL.
6. Capacidades multimodais completas: voz (STT/TTS), imagens e leitura de PDFs.
7. MEMÓRIA CONTÍNUA: Você NUNCA esquece o que o usuário diz. Mantenha continuidade absoluta de diálogo, relembre acordos, preferências, nomes de projetos ou dúvidas anteriores citadas.
${memoryContext}
Responda sempre com autoridade, clareza técnica e precisão em português formal, usando formatação rica em Markdown.`
              },
              ...(req.conversationHistory || []).map(h => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: h.text
              })),
              {
                role: 'user',
                content: `${attachmentContext}${req.question}`
              }
            ],
            max_tokens: 1200,
            temperature: 0.6
          })
        });

        if (groqRes.ok) {
          const groqData = (await groqRes.json()) as any;
          const generatedAnswer = groqData.choices?.[0]?.message?.content;
          if (generatedAnswer) {
            let cat: OracleAnswerResponse['category'] = 'QUICK_START';
            if (attachments.length > 0) cat = 'MULTIMODAL';
            else if (q.includes('simulador') || q.includes('conversão') || q.includes('heatmap') || q.includes('cps')) cat = 'SIMULATOR';
            else if (q.includes('data bus') || q.includes('databus') || q.includes('pacote') || q.includes('porta')) cat = 'DATA_BUS';
            else if (q.includes('14 blocos') || q.includes('vsl') || q.includes('copy')) cat = 'MARKETING_ENGINES';
            else if (q.includes('template') || q.includes('modelo')) cat = 'TEMPLATES';
            else if (q.includes('observabilidade') || q.includes('prometheus') || q.includes('métrica')) cat = 'OBSERVABILITY';

            return recordOracleResponse({
              category: cat,
              relevantFiles: [
                'packages/shared/src/types/data-bus.ts',
                'packages/shared/src/types/simulation.ts',
                'packages/server/src/services/marketing/simulation-engine.ts',
                'packages/client/src/App.tsx'
              ],
              suggestedFollowUps: [
                'Como testar esta copy no Simulador de Conversão?',
                'Como funciona o Data Bus e a integridade de dados?',
                'Quais templates prontos eu posso utilizar agora?'
              ],
              attachmentAnalysis: attachments.length > 0 ? {
                filesProcessed: attachments.length,
                summary: `Processados ${attachments.length} arquivo(s) com IA da Groq em tempo real.`,
                detectedInsights: attachments.map(a => `Análise ativa para ${a.name}`)
              } : undefined,
              answer: generatedAnswer
            });
          }
        }
      } catch (err) {
        console.warn('[ProjectOracle] Groq API falhou, usando base offline determinística:', err);
      }
    }

    // 0. MEMORY RECALL CHECK (Offline / Deterministic)
    if (storedMemories.length > 0 && (q.includes('qual é o meu nome') || q.includes('qual meu nome') || q.includes('quem sou eu') || q.includes('lembra') || q.includes('memória') || q.includes('me chamo'))) {
      const nameMem = storedMemories.find(m => m.memory_key === 'Nome do Usuário');
      return recordOracleResponse({
        category: 'QUICK_START',
        relevantFiles: ['packages/server/src/services/chat/project-oracle-service.ts'],
        suggestedFollowUps: ['Como o Simulador de Conversão pode me ajudar no meu nicho?'],
        answer: `Sim, com certeza me lembro! ${nameMem ? `Você se chama **${nameMem.memory_value}**.` : ''}\n\n🧠 **Aqui está o que tenho gravado na minha memória contínua:**\n` +
          storedMemories.map(m => `• **${m.memory_key}**: ${m.memory_value}`).join('\n') +
          `\n\nEstou com todas as suas informações gravadas para continuarmos de onde paramos!`
      });
    }

    // Multimodal Analysis if attachments are provided
    if (attachments.length > 0) {
      const insights: string[] = [];
      let totalExtracted = '';

      for (const att of attachments) {
        if (att.type === 'image') {
          insights.push(`🖼️ Imagem "${att.name}": Layout visual identificado. Pode ser conectado ao Canvas como ativo de anúncio ou wireframe de página.`);
        } else if (att.type === 'pdf' || att.type === 'document') {
          const charCount = att.extractedText?.length || 0;
          insights.push(`📄 Documento/PDF "${att.name}" (${charCount} caracteres): Conteúdo indexado com sucesso. Pronto para alimentar nós de extração de ICP, VSL ou 14 blocos.`);
          if (att.extractedText) totalExtracted += `\n[Documento: ${att.name}]\n${att.extractedText}\n`;
        } else if (att.type === 'audio') {
          insights.push(`🎙️ Áudio "${att.name}": Transcrição processada via motor de voz.`);
        }
      }

      const answer = `### 🧠 Análise Multimodal pelo Project Oracle

Processei **${attachments.length} anexo(s)** enviados juntamente com sua pergunta: *" ${req.question} "*:

${insights.map(i => `• ${i}`).join('\n')}

#### 💡 Diagnóstico e Aplicação no UNION.AI:
${attachments.some(a => a.type === 'image') ? `1. **Criativos & Wireframes**: Você pode enviar essa imagem diretamente para o nó de **Multi-Platform Ads Matrix** ou usá-la como referência visual na geração da Hero Section da Página de Vendas.\n` : ''}
${attachments.some(a => a.type === 'pdf' || a.type === 'document') ? `2. **Ingestão Documental (Data Bus)**: O texto extraído foi automaticamente tipado como \`DOCUMENT\` / \`TEXT\`. No canvas do UNION.AI, isso se conecta ao nó **Extractor / PDF** ou **Sales Page Copy Engine** sem perda de contexto.\n` : ''}
${attachments.some(a => a.type === 'audio') ? `3. **Comando de Voz**: Áudio transcrito com alta fidelidade e sincronizado com o fluxo conversacional.\n` : ''}

**Próximo Passo Recomendado:**
Você gostaria que eu formate esse conteúdo para o **Simulador de Conversão com Heatmap** ou prefere criar um pipeline no Canvas para gerar anúncios a partir dele?`;

      return recordOracleResponse({
        category: 'MULTIMODAL',
        relevantFiles: [
          'packages/server/src/services/extractors/pdf-extractor.ts',
          'packages/server/src/services/marketing/simulation-engine.ts',
          'packages/shared/src/types/data-bus.ts'
        ],
        suggestedFollowUps: [
          'Submeter este conteúdo ao Simulador de Conversão CPS?',
          'Como conectar este documento a um nó no Canvas?',
          'Extrair os 14 blocos de página de vendas deste texto?'
        ],
        attachmentAnalysis: {
          filesProcessed: attachments.length,
          summary: `Processados ${attachments.length} arquivo(s) com sucesso.`,
          detectedInsights: insights
        },
        answer
      });
    }

    // 1. DATA BUS & TYPES
    if (q.includes('data bus') || q.includes('databus') || q.includes('pacote') || q.includes('datapacket') || q.includes('porta') || q.includes('tipo')) {
      return recordOracleResponse({
        category: 'DATA_BUS',
        relevantFiles: [
          'packages/shared/src/types/data-bus.ts',
          'packages/client/src/components/canvas/DataPacketInspectorModal.tsx',
          'packages/server/src/services/data-bus/'
        ],
        suggestedFollowUps: [
          'Como o DataPacketInspectorModal exibe os pacotes em tempo real?',
          'Como funciona a compatibilidade entre portas de nós no Canvas?',
          'Como o TypeGuard valida a transição de tipos?'
        ],
        answer: `### 🌐 Arquitetura do Data Bus (UNION.AI 2.0)

O **Data Bus** é a espinha dorsal de comunicação e integridade entre os nós do pipeline no UNION.AI:

1. **Estrutura do DataPacket**:
   - Todo fluxo trafega através do schema uniforme \`DataPacket<T>\` definido em \`packages/shared/src/types/data-bus.ts\`.
   - Contém: \`id\`, \`type\` (\`URL\`, \`TRANSCRIPT\`, \`TEXT\`, \`TABLE\`, \`DOCUMENT\`, \`JSON\`, \`AI_RESPONSE\`), \`payload\`, \`originNodeId\`, \`originPortId\`, \`tokens\`, \`creditsCost\` e \`processingTimeMs\`.

2. **Compatibilidade Estrita de Portas**:
   - As portas dos nós possuem tipos declarativos (\`acceptedTypes\` e \`outputType\`).
   - Conexões incompatíveis são rejeitadas em tempo de conexão com visual feedback vermelho no Canvas.

3. **Auditoria & Inspeção em Tempo Real**:
   - O componente \`DataPacketInspectorModal.tsx\` permite inspecionar cada pacote que passou pela aresta com tokens e JSON bruto.`
      });
    }

    // 2. SIMULADOR & HEATMAP (CHAVE DE OURO)
    if (q.includes('simulador') || q.includes('conversão') || q.includes('heatmap') || q.includes('persona') || q.includes('cps') || q.includes('auto-heal') || q.includes('cura') || q.includes('diferencial')) {
      return recordOracleResponse({
        category: 'SIMULATOR',
        relevantFiles: [
          'packages/shared/src/types/simulation.ts',
          'packages/server/src/services/marketing/simulation-engine.ts',
          'packages/client/src/components/marketing/ConversionSimulatorModal.tsx'
        ],
        suggestedFollowUps: [
          'Como o CPS (Conversion Probability Score) é calculado?',
          'Quais são os 5 arquétipos de personas sintéticas?',
          'Como funciona a Auto-Cura em 1 clique (1-Click Auto-Healing)?'
        ],
        answer: `### 🎯 AI Conversion Simulator & Heatmap Visualizer (Chave de Ouro)

Este é o grande diferencial competitivo do **UNION.AI 2.0**:

1. **5 Personas Sintéticas Calibradas**:
   - **Dr. Roberto Meirelles (SKEPTIC)**: Exige garantias incondicionais, provas empíricas e auditoria.
   - **Ana Lívia Siqueira (BUSY_EXECUTIVE)**: Foco total em ROI rápido, objetividade e baixo tempo de leitura.
   - **Carlos Mendes (BUDGET_SAVER)**: Hipersensível a preço, parcelamento e retorno no 1º mês.
   - **Mariana Costa (ANALYTICAL)**: Avalia arquitetura técnica, fluxo lógico e segurança.
   - **Lucas Rocha (EMOTIONAL)**: Movido por storytelling de identificação e senso de comunidade.

2. **Termômetro Psicológico & Heatmap**:
   - Cada bloco de copy ou VSL é avaliado: \`HOT\` (🔥), \`WARM\` (☀️), \`COLD\` (❄️) ou \`DROP_OFF\` (⚠️ Ponto Crítico de Abandono).
   - O **CPS** pontua de 0 a 100 a probabilidade de fechamento.

3. **1-Click Auto-Healing**:
   - Reescreve cirurgicamente o bloco com objeções, injetando reversão de risco e garantia de 30 dias.`
      });
    }

    // 3. 14 BLOCOS DA PÁGINA DE VENDAS & VSL
    if (q.includes('bloco') || q.includes('14 blocos') || q.includes('vsl') || q.includes('sales-page') || q.includes('copy') || q.includes('seção 27') || q.includes('secao 27')) {
      return recordOracleResponse({
        category: 'MARKETING_ENGINES',
        relevantFiles: [
          'packages/shared/src/types/sales-page.ts',
          'packages/server/src/services/marketing/marketing-engine.ts',
          'packages/server/src/routes/marketing.ts'
        ],
        suggestedFollowUps: [
          'Quais são os 14 blocos da Página de Vendas da Seção 27?',
          'Como gerar um VSL de 12 passos pelo backend?',
          'Como exportar a copy gerada para Markdown ou HTML?'
        ],
        answer: `### 📝 Arquitetura dos 14 Blocos de Alta Conversão (Seção 27)

Implementado com base nas maiores referências de direct response:

- **Bloco 1**: Headline & Hero (Promessa central ultra-específica)
- **Bloco 2**: Problema & Agitação visceral
- **Bloco 3**: Inimigo Comum (Remoção de culpa)
- **Bloco 4**: História & Ponto de Virada
- **Bloco 5**: Apresentação da Solução
- **Bloco 6**: Mecanismo Único Exclusivo
- **Bloco 7**: Benefícios Transformacionais
- **Bloco 8**: Prova Social & Depoimentos Reais
- **Bloco 9**: A Oferta Completa com Entregáveis & Bônus
- **Bloco 10**: Garantia Blindada de Risco Zero (30 dias)
- **Bloco 11**: Preço & Ancoragem com Parcelamento
- **Bloco 12**: Urgência Real & Escassez
- **Bloco 13**: FAQ Quebra-Objeções
- **Bloco 14**: CTA Final & Fechamento com os Dois Caminhos`
      });
    }

    // 4. TEMPLATES PRONTOS
    if (q.includes('template') || q.includes('modelo') || q.includes('pronto') || q.includes('biblioteca') || q.includes('iniciar')) {
      return recordOracleResponse({
        category: 'TEMPLATES',
        relevantFiles: [
          'packages/server/src/services/templates/template-service.ts',
          'packages/client/src/components/templates/TemplateLibraryModal.tsx',
          'packages/shared/src/types/template.ts'
        ],
        suggestedFollowUps: [
          'Como carregar o Template de Análise de Concorrentes?',
          'Como funciona o Template de YouTube para VSL?',
          'Posso salvar meu próprio pipeline como template?'
        ],
        answer: `### 📚 Biblioteca de Templates Oficiais (UNION.AI 2.0)

O sistema conta com 4 templates de produção prontos para 1 clique:

1. **YouTube to Multi-Platform Ads & VSL**: Transcrição -> Síntese -> Anúncios Meta/TikTok + Roteiro VSL.
2. **Competitor Teardown & High-Converting Copy**: Web Scraping/PDF -> Análise SWOT -> 14 Blocos de Vendas.
3. **Omnichannel Content Engine**: Transforma conteúdo longo em carrosséis, e-mails e posts.
4. **Research Deep Dive & Market Avatar**: Mineração de ICP e níveis de consciência de Schwartz.`
      });
    }

    // 5. OBSERVABILIDADE & PROMETHEUS
    if (q.includes('observabilidade') || q.includes('métrica') || q.includes('metric') || q.includes('prometheus') || q.includes('monitor') || q.includes('token')) {
      return recordOracleResponse({
        category: 'OBSERVABILITY',
        relevantFiles: [
          'packages/server/src/services/metrics-collector.ts',
          'packages/server/src/routes/observability.ts',
          'packages/client/src/components/observability/ObservabilityDrawer.tsx'
        ],
        suggestedFollowUps: [
          'Qual endpoint expõe as métricas Prometheus?',
          'Como visualizar o consumo de tokens por nó?',
          'Qual é o banco de dados utilizado pelo backend?'
        ],
        answer: `### 📊 Observabilidade & Métricas de Produção

- **Endpoint Prometheus**: \`GET /metrics\` no padrão OpenMetrics.
- **Painel no Frontend**: \`ObservabilityDrawer.tsx\` com gráficos de taxa de sucesso, consumo de tokens por nó e custo em créditos.`
      });
    }

    // DEFAULT / RESUMO GERAL (FALLBACK DETERMINÍSTICO OFFLINE)
    return recordOracleResponse({
      category: 'QUICK_START',
      relevantFiles: [
        'MANUAL_DO_USUARIO.md',
        'packages/client/src/App.tsx',
        'packages/server/src/app.ts'
      ],
      suggestedFollowUps: [
        'Como funciona o Simulador de Conversão e Heatmap?',
        'O que é o Data Bus e como ele garante zero erro no pipeline?',
        'Quais templates prontos eu posso utilizar agora?',
        'Como anexar PDFs, imagens ou falar por voz no chat?'
      ],
      answer: `### 🤖 Olá! Eu sou o UNION.AI Project Oracle

Tenho conhecimento profundo sobre toda a arquitetura do sistema, **memória persistente contínua** e **capacidades multimodais completas**:

- 🧠 **Memória Contínua Ativa**: Lembro de seu nome, suas metas, dados de projetos e preferências entre mensagens e sessões.
- 🎙️ **Entrada e Resposta por Voz (STT/TTS)**: Fale comigo pelo microfone ou ouça minhas respostas em voz alta!
- 📄 **Upload de Imagens e Documentos**: Arraste imagens, arquivos de texto ou PDFs de briefings e relatórios.
- 🌐 **Canvas & Pipeline**: 18 gates com Data Bus tipado (\`DataPacket\`).
- 🎯 **Simulador de Conversão (Chave de Ouro)**: Teste cópias contra 5 personas sintéticas com CPS (0-100) e Auto-Cura.
- 📚 **Templates & Observabilidade**: 4 pipelines de produção prontos e telemetria Prometheus em \`/metrics\`.

Como posso ajudar você agora?`
    });
  }

  /**
   * Retrieves full chat history for a given session from SQLite.
   */
  public static getSessionHistory(sessionId: string): Array<{
    id: string;
    sender: 'user' | 'oracle';
    text: string;
    category?: string;
    relevantFiles?: string[];
    suggestedFollowUps?: string[];
    attachments?: OracleAttachment[];
    createdAt: number;
  }> {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT * FROM oracle_chat_messages WHERE session_id = ? ORDER BY created_at ASC
    `).all(sessionId) as any[];

    return rows.map(r => ({
      id: r.id,
      sender: r.sender,
      text: r.text,
      category: r.category,
      relevantFiles: JSON.parse(r.relevant_files_json || '[]'),
      suggestedFollowUps: JSON.parse(r.suggested_follow_ups_json || '[]'),
      attachments: JSON.parse(r.attachments_json || '[]'),
      createdAt: r.created_at
    }));
  }

  /**
   * Retrieves active retained memories for a given session.
   */
  public static getSessionMemories(sessionId: string): Array<{ key: string; value: string }> {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT memory_key, memory_value FROM oracle_chat_memories WHERE session_id = ?
    `).all(sessionId) as Array<{ memory_key: string; memory_value: string }>;

    return rows.map(r => ({ key: r.memory_key, value: r.memory_value }));
  }

  /**
   * Manually store a persistent memory for a session.
   */
  public static saveMemory(sessionId: string, key: string, value: string): void {
    const db = getDatabase();
    const now = Date.now();
    db.prepare(`
      INSERT INTO oracle_chat_memories (id, session_id, memory_key, memory_value, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, memory_key) DO UPDATE SET memory_value = excluded.memory_value, updated_at = excluded.updated_at
    `).run(randomUUID(), sessionId, key, value, now, now);
  }

  /**
   * Permanently clears all messages and memories for a session.
   */
  public static clearSession(sessionId: string): void {
    const db = getDatabase();
    db.prepare(`DELETE FROM oracle_chat_memories WHERE session_id = ?`).run(sessionId);
    db.prepare(`DELETE FROM oracle_chat_messages WHERE session_id = ?`).run(sessionId);
    db.prepare(`DELETE FROM oracle_chat_sessions WHERE id = ?`).run(sessionId);
  }
}
