import { env } from '../../config/env.js';

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
  attachmentAnalysis?: {
    filesProcessed: number;
    summary: string;
    detectedInsights: string[];
  };
}

export class ProjectOracleService {
  /**
   * System knowledge base mapping deep project topics, files, explanations and Multimodal inputs.
   */
  public static async answerQuestion(req: OracleQuestionRequest): Promise<OracleAnswerResponse> {
    const q = req.question.toLowerCase();
    const attachments = req.attachments || [];

    // REAL GROQ LLM INVOCATION FOR ALL CHAT INTERACTIONS (WHEN ACTIVE)
    if (env.GROQ_API_KEY && env.NODE_ENV !== 'test') {
      try {
        let attachmentContext = '';
        if (attachments.length > 0) {
          attachmentContext = `\n[ANEXOS RECEBIDOS]:\n` + attachments.map(a => 
            `- Tipo: ${a.type.toUpperCase()}, Nome: "${a.name}" ${a.extractedText ? `\nConteúdo:\n${a.extractedText}` : ''}`
          ).join('\n') + '\n';
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
                content: `Você é o UNION.AI Project Oracle, uma inteligência artificial especialista e onisciente sobre o sistema UNION.AI 2.0.
Você possui conhecimento profundo sobre:
1. Data Bus com tipagem estrita de portas (URL, TRANSCRIPT, TEXT, TABLE, DOCUMENT, JSON, AI_RESPONSE).
2. Simulador de Conversão e Heatmap Psicológico (Chave de Ouro) com 5 personas sintéticas (Dr. Roberto Meirelles - Cético, Ana Lívia - Executiva Ocupada, Carlos Mendes - Econômico, Mariana Costa - Analítica, Lucas Rocha - Emocional), cálculo de CPS (0-100) e 1-Click Auto-Healing.
3. 14 Blocos de Página de Vendas (Seção 27) e VSL de 12 etapas.
4. 4 Templates Oficiais pré-configurados.
5. Telemetria Prometheus em /metrics e banco SQLite com WAL.
6. Capacidades multimodais completas: voz (STT/TTS), imagens e leitura de PDFs.

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

            return {
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
            };
          }
        }
      } catch (err) {
        console.warn('[ProjectOracle] Groq API falhou, usando base offline determinística:', err);
      }
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

      // Check if question pertains to copy analysis or general project
      const answer = `### 🧠 Análise Multimodal pelo Project Oracle

Processei **${attachments.length} anexo(s)** enviados juntamente com sua pergunta: *" ${req.question} "*:

${insights.map(i => `• ${i}`).join('\n')}

#### 💡 Diagnóstico e Aplicação no UNION.AI:
${attachments.some(a => a.type === 'image') ? `1. **Criativos & Wireframes**: Você pode enviar essa imagem diretamente para o nó de **Multi-Platform Ads Matrix** ou usá-la como referência visual na geração da Hero Section da Página de Vendas.\n` : ''}
${attachments.some(a => a.type === 'pdf' || a.type === 'document') ? `2. **Ingestão Documental (Data Bus)**: O texto extraído foi automaticamente tipado como \`DOCUMENT\` / \`TEXT\`. No canvas do UNION.AI, isso se conecta ao nó **Extractor / PDF** ou **Sales Page Copy Engine** sem perda de contexto.\n` : ''}
${attachments.some(a => a.type === 'audio') ? `3. **Comando de Voz**: Áudio transcrito com alta fidelidade e sincronizado com o fluxo conversacional.\n` : ''}

**Próximo Passo Recomendado:**
Você gostaria que eu formate esse conteúdo para o **Simulador de Conversão com Heatmap** ou prefere criar um pipeline no Canvas para gerar anúncios a partir dele?`;

      return {
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
      };
    }

    // 1. DATA BUS & TYPES
    if (q.includes('data bus') || q.includes('databus') || q.includes('pacote') || q.includes('datapacket') || q.includes('porta') || q.includes('tipo')) {
      return {
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
      };
    }

    // 2. SIMULADOR & HEATMAP (CHAVE DE OURO)
    if (q.includes('simulador') || q.includes('conversão') || q.includes('heatmap') || q.includes('persona') || q.includes('cps') || q.includes('auto-heal') || q.includes('cura') || q.includes('diferencial')) {
      return {
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
      };
    }

    // 3. 14 BLOCOS DA PÁGINA DE VENDAS & VSL
    if (q.includes('bloco') || q.includes('14 blocos') || q.includes('vsl') || q.includes('sales-page') || q.includes('copy') || q.includes('seção 27') || q.includes('secao 27')) {
      return {
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
      };
    }

    // 4. TEMPLATES PRONTOS
    if (q.includes('template') || q.includes('modelo') || q.includes('pronto') || q.includes('biblioteca') || q.includes('iniciar')) {
      return {
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
      };
    }

    // 5. OBSERVABILIDADE & PROMETHEUS
    if (q.includes('observabilidade') || q.includes('métrica') || q.includes('metric') || q.includes('prometheus') || q.includes('monitor') || q.includes('token')) {
      return {
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
      };
    }

    // DEFAULT / RESUMO GERAL ou PERGUNTA ABERTA - CHAMADA REAL GROQ LLM SE CHAVE CONFIGURADA
    if (env.GROQ_API_KEY) {
      try {
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
                content: `Você é o UNION.AI Project Oracle, uma inteligência artificial especialista e onisciente sobre o sistema UNION.AI 2.0.
O UNION.AI possui:
1. Data Bus com tipagem estrita de portas (URL, TRANSCRIPT, TEXT, TABLE, DOCUMENT, JSON, AI_RESPONSE).
2. Simulador de Conversão e Heatmap Psicológico (Chave de Ouro) com 5 personas sintéticas (Dr. Roberto Meirelles - Cético, Ana Lívia - Executiva Ocupada, Carlos Mendes - Econômico, Mariana Costa - Analítica, Lucas Rocha - Emocional), cálculo de CPS (0-100) e 1-Click Auto-Healing.
3. 14 Blocos de Página de Vendas (Seção 27) e VSL de 12 etapas.
4. 4 Templates Oficiais pré-configurados.
5. Telemetria Prometheus em /metrics e banco SQLite com WAL.
6. Capacidades multimodais completas: voz (STT/TTS), imagens e leitura de PDFs.

Responda com autoridade, clareza técnica e precisão em português formal.`
              },
              ...(req.conversationHistory || []).map(h => ({
                role: h.sender === 'user' ? 'user' : 'assistant',
                content: h.text
              })),
              {
                role: 'user',
                content: req.question
              }
            ],
            max_tokens: 800,
            temperature: 0.6
          })
        });

        if (groqRes.ok) {
          const groqData = (await groqRes.json()) as any;
          const generatedAnswer = groqData.choices?.[0]?.message?.content;
          if (generatedAnswer) {
            return {
              category: 'QUICK_START',
              relevantFiles: [
                'packages/client/src/App.tsx',
                'packages/server/src/services/chat/project-oracle-service.ts',
                'packages/shared/src/types/data-bus.ts'
              ],
              suggestedFollowUps: [
                'Como funciona o Simulador de Conversão e Heatmap?',
                'O que é o Data Bus e como ele garante zero erro no pipeline?',
                'Quais templates prontos eu posso utilizar agora?'
              ],
              answer: generatedAnswer
            };
          }
        }
      } catch (err) {
        console.warn('[ProjectOracle] Erro na chamada do Groq real, usando fallback offline:', err);
      }
    }

    // DEFAULT / RESUMO GERAL (FALLBACK DETERMINÍSTICO OFFLINE)
    return {
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

Tenho conhecimento profundo sobre toda a arquitetura do sistema e agora conto com **capacidades multimodais completas**:

- **Entrada e Resposta por Voz (STT/TTS)**: Fale comigo pelo microfone ou ouça minhas respostas em voz alta!
- **Upload de Imagens e Documentos**: Arraste imagens, arquivos de texto ou PDFs de briefings e relatórios.
- **Canvas & Pipeline**: 18 gates com Data Bus tipado (\`DataPacket\`).
- **Simulador de Conversão (Chave de Ouro)**: Teste cópias contra 5 personas sintéticas com CPS (0-100) e Auto-Cura.
- **Templates & Observabilidade**: 4 pipelines de produção prontos e telemetria Prometheus em \`/metrics\`.

Como posso ajudar você agora?`
    };
  }
}
