export interface OracleQuestionRequest {
  question: string;
  context?: string;
  conversationHistory?: Array<{
    sender: 'user' | 'oracle';
    text: string;
  }>;
}

export interface OracleAnswerResponse {
  answer: string;
  category: 'ARCHITECTURE' | 'DATA_BUS' | 'MARKETING_ENGINES' | 'SIMULATOR' | 'TEMPLATES' | 'OBSERVABILITY' | 'QUICK_START';
  relevantFiles: string[];
  suggestedFollowUps: string[];
}

export class ProjectOracleService {
  /**
   * System knowledge base mapping deep project topics, files, and explanations.
   */
  public static async answerQuestion(req: OracleQuestionRequest): Promise<OracleAnswerResponse> {
    const q = req.question.toLowerCase();

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
   - Contém: \`id\`, \`type\` (\`URL\`, \`TRANSCRIPT\`, \`TEXT\`, \`TABLE\`, \`JSON\`, \`AI_RESPONSE\`, \`FILE\`), \`payload\`, \`originNodeId\`, \`originPortId\`, \`tokens\`, \`creditsCost\` e \`processingTimeMs\`.

2. **Compatibilidade Estrita de Portas**:
   - As portas dos nós possuem tipos declarativos (\`acceptedTypes\` e \`outputType\`).
   - Conexões incompatíveis (ex: ligar uma saída \`URL\` diretamente numa entrada que espera \`TABLE\`) são rejeitadas em tempo de conexão com visual feedback vermelho no Canvas.

3. **Auditoria & Inspeção em Tempo Real**:
   - O componente \`DataPacketInspectorModal.tsx\` permite inspecionar cada pacote que passou pela aresta, com tempo de trânsito, tokens consumidos e JSON bruto formatado.`
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

Este é o grande diferencial competitivo do **UNION.AI 2.0**, transformando a ferramenta de um simples "gerador de texto" em um **laboratório preditivo de conversão**:

1. **5 Personas Sintéticas Calibradas**:
   - **Dr. Roberto Meirelles (SKEPTIC)**: Exige garantias incondicionais, provas empíricas e auditoria.
   - **Ana Lívia Siqueira (BUSY_EXECUTIVE)**: Foco total em ROI rápido, objetividade e baixo tempo de leitura.
   - **Carlos Mendes (BUDGET_SAVER)**: Hipersensível a preço, parcelamento e retorno no 1º mês.
   - **Mariana Costa (ANALYTICAL)**: Avalia arquitetura técnica, fluxo lógico e segurança.
   - **Lucas Rocha (EMOTIONAL)**: Movido por storytelling de identificação e senso de comunidade.

2. **Termômetro Psicológico & Heatmap**:
   - Cada bloco de copy ou VSL é avaliado com status de temperatura: \`HOT\` (🔥), \`WARM\` (☀️), \`COLD\` (❄️) ou \`DROP_OFF\` (⚠️ Ponto Crítico de Abandono).
   - O **CPS (Conversion Probability Score)** pontua de 0 a 100 a probabilidade estatística de fechamento.

3. **1-Click Auto-Healing**:
   - Ao detectar um bloco \`DROP_OFF\` ou \`COLD\`, a IA reescreve cirurgicamente o bloco injetando reversão de risco, quebra de objeção e ancoragem de valor, elevando o score instantaneamente.`
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

Implementado com base nas maiores referências de direct response copywriting (Dan Kennedy, Stefan Georgi, Jon Benson):

- **Bloco 1 (Hero/Headline)**: Gancho magnético + promessa central ultra-específica.
- **Bloco 2 (Problema/Agitação)**: Diagnóstico visceral das dores ocultas do avatar.
- **Bloco 3 (Inimigo Comum)**: Remoção de culpa pessoal (o verdadeiro vilão).
- **Bloco 4 (História & Ponto de Virada)**: Descoberta do mecanismo único.
- **Bloco 5 (Apresentação da Solução)**: Revelação do produto/sistema.
- **Bloco 6 (Mecanismo Único)**: Por que funciona onde outros falharam.
- **Bloco 7 (Benefícios Transformacionais)**: Ganhos práticos no dia a dia.
- **Bloco 8 (Prova Social & Depoimentos)**: Prints, métricas e histórias reais.
- **Bloco 9 (A Oferta Completa)**: Entregáveis, bônus e valor ancorado.
- **Bloco 10 (Garantia Blindada)**: Incondicional de 30 dias (risco zero).
- **Bloco 11 (Preço & Condição Especial)**: Ancoragem de parcelamento flexível.
- **Bloco 12 (Urgência & Escassez)**: Motivo real para agir agora.
- **Bloco 13 (FAQ Quebra-Objeções)**: Respostas às maiores dúvidas.
- **Bloco 14 (CTA Final & Fechamento)**: A bifurcação dos dois caminhos.`
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

O sistema conta com 4 templates de nível de produção pré-configurados prontos para 1-clique:

1. **YouTube to Multi-Platform Ads & VSL**:
   - Inicia com extrator de transcrição do YouTube (\`youtube-transcript\`) -> Síntese de IA -> Matriz de Anúncios Meta/TikTok e Roteiro de VSL.
2. **Competitor Teardown & High-Converting Copy**:
   - Extrator Web/PDF -> Análise SWOT e Gaps de Mercado -> Gerador de 14 Blocos de Vendas.
3. **Omnichannel Content Engine**:
   - Transformação de vídeos e artigos em carrosséis, threads, e-mails de nutrição e posts sociais.
4. **Research Deep Dive & Market Avatar**:
   - Mineração profunda de avatar (dores, desejos, nível de consciência de Eugene Schwartz) a partir de transcrições e dados brutos.`
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

O UNION.AI possui instrumentação completa de telemetria:

- **Endpoint Prometheus**: \`GET /metrics\` com formato padrão OpenMetrics pronto para coleta no Grafana.
- **Painel no Frontend**: \`ObservabilityDrawer.tsx\` acessível no menu superior direito do Workspace, com gráficos de:
  - Total de Execuções e Taxa de Sucesso (%)
  - Consumo de Tokens (Prompt vs Completion)
  - Latência média por tipo de Nó (AI, Extrator, Marketing)
  - Custo em Créditos em tempo real.`
      };
    }

    // DEFAULT / RESUMO GERAL
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
        'Como funciona a geração de 14 blocos de página de vendas?'
      ],
      answer: `### 🤖 Olá! Eu sou o UNION.AI Project Oracle

Tenho conhecimento profundo e irrestrito sobre toda a engenharia, arquitetura e funcionalidades do projeto:

- **Canvas & Pipeline**: Grafo interativo construído com React Flow, 18 gates operacionais e validação estrita de portas.
- **Data Bus Central**: Trafega \`DataPacket\` tipado com payload, créditos, tempo e tokens.
- **Simulador de Conversão & Heatmap (Chave de Ouro)**: Teste cópias contra 5 personas sintéticas, avalie o CPS (0-100) e faça Auto-Cura em 1 clique.
- **Motores de Marketing (Seção 27)**: Geração de Avatar ICP, Concorrentes SWOT, VSL 12 Passos, Matriz de Anúncios e 14 Blocos de Página de Vendas.
- **Templates & Observabilidade**: 4 pipelines de produção prontos e telemetria Prometheus em \`/metrics\`.

Você pode me perguntar sobre qualquer código, endpoint, tipo de nó ou estratégia de marketing!`
    };
  }
}
