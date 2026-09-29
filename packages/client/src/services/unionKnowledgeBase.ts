/**
 * UNION.AI Local Comprehensive Knowledge Base & Offline Inference Engine
 * 
 * Este módulo embarca 100% do conhecimento da plataforma UNION.AI dentro do cliente.
 * Ele permite responder a qualquer dúvida técnica, operacional ou estratégica
 * com latência zero (0ms), custo zero de créditos e 100% OFFLINE (sem internet).
 */

export interface KnowledgeAction {
  type: 'ADD_NODE' | 'LOAD_TEMPLATE' | 'TEST_IN_SIMULATOR' | 'INJECT_COPY';
  label: string;
  nodeType?: string;
  templateId?: string;
  copyText?: string;
  payload?: any;
}

export interface KnowledgeItem {
  id: string;
  category: 
    | 'EBOOK' 
    | 'SALES_PAGE' 
    | 'YOUTUBE_REPURPOSING' 
    | 'SIMULATOR_CPS' 
    | 'DATA_BUS_CONEXOES' 
    | 'BOTOES_CONTROLES' 
    | 'TEMPLATES' 
    | 'COMPETITOR_RESEARCH' 
    | 'TROUBLESHOOTING' 
    | 'GERAL';
  title: string;
  keywords: string[];
  summary: string;
  detailedAnswer: string;
  suggestedFollowUps: string[];
  actions?: KnowledgeAction[];
}

export const UNION_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // 1. COMO CRIAR O E-BOOK
  {
    id: 'criar-ebook',
    category: 'EBOOK',
    title: 'Como Criar um E-book Completo no UNION.AI',
    keywords: [
      'ebook', 'e-book', 'criar ebook', 'como crio o ebook', 'gerar livro', 'cinema ebook', 
      'escrever livro', 'conteudo longo', 'paginas', 'capitulos', 'forjar'
    ],
    summary: 'Existem duas formas no UNION.AI: via 1-clique no Union Forge ou conectando nós no Canvas.',
    detailedAnswer: `### 📖 Como Criar um E-book no UNION.AI

Você tem **2 formas comprovadas** de criar um e-book completo com capa, sumário e capítulos estruturados:

---

#### 🌟 Método 1: Criação Direta em 1 Clique (Union Forge) — O Mais Rápido
1. No menu superior da tela, clique no botão dourado **\`✨ Union Forge\`**.
2. No campo **Tipo de Ativo**, selecione **\`EBOOK\`**.
3. Defina o **Tema** (ex: *"Manual Prático de Inteligência Artificial para Negócios"*).
4. Escolha o número de páginas desejado (**5 a 10+ páginas**) e o tom de voz (*Didático, Best-Seller ou Técnico*).
5. Clique em **\`Forjar E-book com IA\`**.
6. Em poucos segundos, o e-book é gerado e o leitor abre diretamente com capa, índice e diagramação.

---

#### 🎬 Método 2: Pipeline de Produção no Canvas (Vídeo ou Texto ➔ E-book)
Se você quer transformar um vídeo do YouTube ou documento em livro:
1. Adicione um nó **\`YouTube Source\`** (ou **\`Text Document\`**).
2. Cole a URL do vídeo desejado no campo correspondente.
3. Adicione o nó **\`Cinema E-book Agent\`**.
4. Conecte a saída do **YouTube Source** à entrada do **Cinema E-book Agent**.
5. Conecte a saída do **Cinema E-book Agent** ao nó **\`Visualizador de Saída\`** (Output Viewer).
6. Clique em **\`Executar Pipeline\`** (ou no botão Play do nó).
7. Assim que terminar, o nó exibirá a contagem de palavras e o botão **\`📖 Ler E-book\`**.`,
    suggestedFollowUps: [
      'Onde vejo o e-book pronto?',
      'Como exportar o e-book em PDF editorial?',
      'Qual a diferença entre o Cinema E-book e o E-book Generator?'
    ],
    actions: [
      {
        type: 'LOAD_TEMPLATE',
        label: '👑 Carregar Pipeline Chave de Ouro (YouTube ➔ E-book)',
        templateId: 'golden-key-master-flow'
      },
      {
        type: 'ADD_NODE',
        label: '➕ Adicionar Nó Cinema E-book ao Canvas',
        nodeType: 'agent-cinema-ebook'
      }
    ]
  },

  // 2. ONDE VEJO O E-BOOK PRONTO
  {
    id: 'onde-ver-ebook',
    category: 'EBOOK',
    title: 'Onde Vejo o E-book Pronto e Como Faço o Download',
    keywords: [
      'onde vejo', 'onde vejo o ebook', 'onde vijo', 'ebook pronto', 'abrir ebook', 
      'leitor', 'ler livro', 'download', 'baixar pdf', 'baixar md', 'resultado', 'ver resultado'
    ],
    summary: 'O e-book pronto pode ser lido no Leitor Modal Automático, no próprio Nó ou no Visualizador de Saída.',
    detailedAnswer: `### 👁️ Onde Ver o E-book Pronto

Assim que a geração é concluída, você tem **3 locais** para visualizar e ler a obra:

---

#### 1. No Leitor Modal Automático (Tela Cheia)
* Na versão atual do UNION.AI, assim que a criação do e-book é concluída com sucesso, **o Leitor de E-books abre automaticamente na tela**.
* Nele você tem:
  * Sumário lateral com índice dos capítulos.
  * Navegação página a página ou capítulo por capítulo.
  * Alternador de temas visuais (*Obsidian, Papel Editorial, Velvet, Esmeralda*).
  * Botões no topo para **Baixar em PDF Editorial** ou **Baixar em Markdown (.MD)**.

#### 2. No próprio Nó do Canvas (\`Cinema E-book Agent\`)
* Quando o nó fica com status verde **\`COMPLETED\`**, surgem as métricas de **Total de Palavras**, **Capítulos** e **Páginas**.
* Logo abaixo das métricas há um botão verde/esmeralda em destaque:
  * **\`📖 Ler E-book\`**: reabre o leitor imersivo na tela a qualquer momento.
  * **\`Baixar .MD\`**: faz download imediato do arquivo Markdown completo.

#### 3. No Nó \`Visualizador de Saída\` (Output Viewer)
* Se você ligou o nó a um **Visualizador de Saída**, o texto do livro é renderizado diretamente dentro do nó na tela do canvas.
* Você pode alternar entre as abas: \`Capítulo 1\`, \`Capítulo 2\`, etc., ou clicar no botão inferior **\`👁️ Abrir Resultado no Modal\`**.`,
    suggestedFollowUps: [
      'Como criar um e-book no UNION.AI?',
      'Como exportar em PDF Editorial com capa?',
      'Por que o nó ficou FAILED?'
    ],
    actions: [
      {
        type: 'ADD_NODE',
        label: '➕ Adicionar Visualizador de Saída ao Canvas',
        nodeType: 'output-modal-viewer'
      }
    ]
  },

  // 3. O QUE É E O QUE FAZ O BOTÃO CASCATA
  {
    id: 'botao-cascata',
    category: 'BOTOES_CONTROLES',
    title: 'O que é e o que Faz o Botão Cascata (Execução em Cadeia)',
    keywords: [
      'cascata', 'botao cascata', 'o botao cascata habilita o que', 'execucao em cascata', 
      'pipeline continuo', 'propagar dados', 'execucao sequencial', 'auto cascata'
    ],
    summary: 'O botão Cascata ativa a execução contínua e sequencial automática entre nós conectados no Data Bus.',
    detailedAnswer: `### 🌊 O que Faz o Botão Cascata?

O botão **Cascata** ativa o modo de **Execução Contínua em Cadeia (Continuous Cascade Execution)** do UNION.AI.

---

#### Como Funciona:
1. **Sem Cascata (Modo Manual):** Você clica em executar no primeiro nó (ex: *YouTube Source*), aguarda ele concluir, e depois precisa clicar manualmente no nó seguinte para ele processar.
2. **Com a Cascata Habilitada:**
   * O pipeline executa de forma **totalmente autônoma**.
   * Quando o Nó 1 (Fonte) termina de extrair os dados, ele **dispara automaticamente** o Nó 2 (IA / E-book).
   * Quando o Nó 2 termina, ele passa o resultado para o Nó 3 (Visualizador / Simulador) sem que você precise tocar no mouse!

#### Quando Usar:
* Use a Cascata sempre que tiver um pipeline montado com 2 ou mais nós conectados em sequência (ex: *YouTube ➔ E-book ➔ Visualizador* ou *Briefing ➔ Copy 14-Blocos ➔ Simulador CPS*).
* Garante que toda a esteira rode de ponta a ponta em um único comando.`,
    suggestedFollowUps: [
      'Como conectar nós no canvas?',
      'O que faz o botão Alinhar Fluxo (Auto-Layout)?',
      'O que é o Template Chave de Ouro?'
    ]
  },

  // 4. PÁGINAS DE VENDAS 14 BLOCOS E PREVIEW AO VIVO
  {
    id: 'pagina-vendas-14-blocos',
    category: 'SALES_PAGE',
    title: 'Como Criar Páginas de Vendas (14 Blocos) com Pré-visualização ao Vivo',
    keywords: [
      'pagina de vendas', 'sales page', '14 blocos', 'copy', 'copywriting', 'landing page', 
      'vsl', 'ver pagina ao vivo', 'preview pagina', 'checkout'
    ],
    summary: 'Cria páginas de alta conversão estruturadas em 14 blocos com visualização web ao vivo no modal.',
    detailedAnswer: `### 🚀 Como Criar Páginas de Vendas de Alta Conversão

O UNION.AI possui um dos motores mais avançados de **Direct Response Copywriting**, baseado na metodologia de **14 Blocos Estruturados**:

---

#### A Estrutura dos 14 Blocos:
1. **Gancho Hipnótico (3 Segundos)**: Quebra de padrão e curiosidade extrema.
2. **Identificação da Dor Invisível**: Ressonância emocional imediata com o público.
3. **História / Jornada do Herói**: Construção de autoridade e empatia.
4. **Revelação do Mecanismo Único**: Por que métodos anteriores falharam e por que este funciona.
5. **Apresentação do Produto / Solução**: O que é a oferta irresistível.
6. **Empilhamento de Benefícios**: Ganhos práticos e emocionais.
7. **Prova Social & Estudos de Caso**: Quebra de ceticismo.
8. **Bônus Exclusivos**: Aceleração de resultados.
9. **Ancoragem de Preço**: Justificativa lógica do valor real.
10. **A Oferta Final**: Chamada para ação com urgência legítima.
11. **Garantia Incondicional**: Inversão total de risco (7, 15 ou 30 dias).
12. **FAQ (Perguntas Frequentes)**: Aniquilação das últimas objeções.
13. **Fechamento de Duas Escolhas**: O custo de continuar igual vs transformar a vida.
14. **P.S. (Post Scriptum)**: Último lembrete da oportunidade e bônus.

---

#### Como Testar e Ver ao Vivo:
1. Adicione o nó **\`Sales Page Generator\`** ou carregue o template **\`Página de Vendas 14-Blocos\`**.
2. Preencha o nome do produto e o nicho.
3. Clique em **\`Gerar Copy de Vendas\`**.
4. Clique no botão **\`👁️ Ver Página ao Vivo\`**: abre um **site interativo real completo** dentro da aplicação, pronto com botões de checkout e design responsivo!`,
    suggestedFollowUps: [
      'Como testar a copy no Simulador CPS?',
      'O que é o Mecanismo Único?',
      'Como criar scripts de VSL?'
    ],
    actions: [
      {
        type: 'LOAD_TEMPLATE',
        label: '🚀 Carregar Template Página de Vendas 14-Blocos',
        templateId: 'sales-page-cps-flow'
      },
      {
        type: 'ADD_NODE',
        label: '➕ Adicionar Nó Sales Page Generator',
        nodeType: 'ai-sales-page'
      }
    ]
  },

  // 5. SIMULADOR DE CONVERSÃO CPS & AUTO-CURA
  {
    id: 'simulador-cps',
    category: 'SIMULATOR_CPS',
    title: 'Como Funciona o Simulador de Conversão CPS e a Auto-Cura',
    keywords: [
      'simulador', 'simulador cps', 'conversao', 'auto cura', 'auto-cura', 'nota copy', 
      'auditoria copy', 'personas sinteticas', 'cético', 'roberto meirelles', 'calor'
    ],
    summary: 'Audita textos com 5 personas sintéticas, gera mapa de calor de retenção e reescreve falhas automaticamente.',
    detailedAnswer: `### 🎯 Simulador de Conversão CPS (Conversion Probability Score)

O **Simulador CPS** é o laboratório de auditoria de conversão do UNION.AI que testa sua copy antes que você gaste um único centavo com tráfego pago.

---

#### O que ele faz:
1. **Sabatina com 5 Personas Sintéticas:**
   * **Dr. Roberto Meirelles (O Comprador Cético):** Procura falhas, exige garantias contratuais e ataca promessas frágeis.
   * **Ana Lívia Siqueira (Executiva C-Level):** Avalia se a mensagem prende a atenção nos primeiros 3 segundos.
   * **Estrategista de Direct Response:** Avalia o empilhamento de valor e oferta.
   * **Consumidor Impulsivo:** Analisa urgência e facilidade de compra.
   * **Analista de Risco:** Avalia clareza e credibilidade.
2. **Nota Geral de Conversão (0 a 100):** Mede a probabilidade real de venda.
3. **Mapa de Calor de Retenção:** Destaca trechos fortes (verde) e pontos fracos/tediosos (vermelho).
4. **Auto-Cura em 1 Clique:**
   * Se o simulador detectar uma objeção não respondida ou promessa fraca, ele clica em **Auto-Cura** e a IA reescreve o bloco problemático instantaneamente para aumentar a nota!

#### Como Abrir:
* Clique em **Ferramentas ➔ Simulador de Conversão** no topo, ou conecte a saída de qualquer nó de copy diretamente ao nó **\`Conversion Predictor\`**.`,
    suggestedFollowUps: [
      'O que são as 14 personas do simulador?',
      'Como funciona o botão Auto-Cura?',
      'Como injetar o resultado no Canvas?'
    ],
    actions: [
      {
        type: 'TEST_IN_SIMULATOR',
        label: '🧪 Abrir Simulador de Conversão CPS',
        copyText: 'Descubra como automatizar seu negócio digital com inteligência artificial sem precisar programar uma única linha de código.'
      }
    ]
  },

  // 6. YOUTUBE REPURPOSING (VIRAL CONTENT)
  {
    id: 'youtube-repurposing',
    category: 'YOUTUBE_REPURPOSING',
    title: 'Fábrica de Repurposing de Vídeos do YouTube (Carrosséis, Reels & Threads)',
    keywords: [
      'youtube', 'repurposing', 'transcricao', 'carrossel', 'reels', 'tiktok', 
      'threads', 'viral', 'podcast', 'transformar video'
    ],
    summary: 'Extrai transcrições de qualquer vídeo do YouTube e gera pacotes multicanal para redes sociais.',
    detailedAnswer: `### 📱 Fábrica de Repurposing Viral de Vídeos

Com o UNION.AI você pode pegar qualquer vídeo longo ou podcast do YouTube e multiplicá-lo em ativos de alta performance para redes sociais.

---

#### O que você pode gerar a partir de 1 link do YouTube:
1. **Carrossel de 10 Slides (Instagram & LinkedIn):**
   * Slide de Capa magnética com gancho de quebra de padrão.
   * Slides de desenvolvimento com dados reveladores e sínteses visuais.
   * Slide final com Chamada para Ação (CTA) para salvar e compartilhar.
2. **Roteiros para Reels / Shorts / TikTok:**
   * Gancho falado dos primeiros 3 segundos.
   * Indicação de cortes e efeitos visuais na tela.
3. **Threads Completas para o X (Twitter):**
   * Sequência de 5 a 8 tweets contando uma história com lições práticas.
4. **E-books & Artigos Aprofundados:**
   * Conectando a transcrição ao **Cinema E-book Agent**.

#### Como Configurar no Canvas:
\`[ YouTube Source ] ──► [ Viral Repurpose Agent ] ──► [ Visualizador de Saída ]\`

Ou clique no botão rápido **\`Viral Repurposing\`** no topo do canvas para carregar este fluxo pronto!`,
    suggestedFollowUps: [
      'Como criar o carrossel no Union Forge?',
      'O que fazer se o link do YouTube der erro?',
      'Como funciona a transcrição sem API key?'
    ],
    actions: [
      {
        type: 'LOAD_TEMPLATE',
        label: '⚡ Carregar Fluxo Repurposing Viral Completo',
        templateId: 'viral-repurpose-omnichannel-flow'
      },
      {
        type: 'ADD_NODE',
        label: '➕ Adicionar Nó YouTube Source',
        nodeType: 'source-youtube'
      }
    ]
  },

  // 7. CONEXÕES, DATA BUS E TIPOS DE PORTAS
  {
    id: 'data-bus-conexoes',
    category: 'DATA_BUS_CONEXOES',
    title: 'Como Conectar Nós e Regras de Portas do Data Bus',
    keywords: [
      'conectar', 'conexoes', 'data bus', 'portas', 'fios', 'ligar nos', 'cabo', 
      'compatibilidade', 'url', 'transcript', 'text', 'document', 'json'
    ],
    summary: 'Explica os tipos de portas do Data Bus, regras de cores e como arrastar conexões sem erro.',
    detailedAnswer: `### ⚡ Guia de Conexões e Tipos de Portas do Data Bus

O UNION.AI possui um barramento de dados estruturado (**Data Bus**) com tipagem forte para garantir que os dados fluam sem erros entre os nós.

---

#### Como Conectar Dois Nós:
1. Posicione o cursor sobre o **ponto circular da direita** do nó de origem (Saída/Output).
2. Clique, segure e arraste até o **ponto circular da esquerda** do nó de destino (Entrada/Input).
3. Solte o mouse. Uma linha conectora colorida surgirá unindo os dois blocos.

---

#### Tabela de Tipos de Portas e Cores:
* **\`URL\` (Ciano):** Links externos (YouTube, sites concorrentes, páginas web).
* **\`TRANSCRIPT\` (Verde-azulado):** Transcrições brutas ou pontuadas de vídeos/áudios.
* **\`TEXT\` (Verde Esmeralda):** Textos livres, resumos, briefings e prompts.
* **\`DOCUMENT\` (Âmbar/Dourado):** Livros, e-books completos e páginas de vendas estruturadas.
* **\`JSON\` (Violeta/Roxo):** Dados estruturados, personas e métricas de simulação.
* **\`AI_RESPONSE\` (Azul Elétrico):** Saídas geradas por assistentes e escritores de IA.

> 💡 **Dica de Ouro:** O sistema avisa visualmente se você tentar conectar portas incompatíveis. Use o botão **\`Padronizar Conexões\`** no menu Ferramentas para verificar a integridade do seu fluxo!`,
    suggestedFollowUps: [
      'O que faz o botão Cascata?',
      'O que fazer se o nó não processar os dados?',
      'Quais são os 16 templates oficiais?'
    ]
  },

  // 8. TEMPLATES OFICIAIS (16 FLUXOS PRONTOS)
  {
    id: 'templates-oficiais',
    category: 'TEMPLATES',
    title: 'Biblioteca de 16 Templates Oficiais Prontos para Usar',
    keywords: [
      'templates', 'biblioteca de templates', 'fluxos prontos', 'modelos', 'chave de ouro', 
      'exemplos', 'como comecar', 'workspaces prontos'
    ],
    summary: 'Apresenta os 16 workflows oficiais prontos com nós já posicionados e configurados.',
    detailedAnswer: `### 📚 Biblioteca de Templates Oficiais do UNION.AI

Para economizar seu tempo, a plataforma inclui **16 Templates Oficiais** testados de ponta a ponta:

---

#### Os 4 Principais Templates para Começar:
1. **👑 Chave de Ouro: Império Autônomo de Conteúdo & Vendas**
   * *Fluxo:* YouTube ➔ Cinema E-book ➔ Copy 14-Blocos ➔ Simulador CPS ➔ AI Chat ➔ Visualizador.
   * *Objetivo:* O pipeline mais completo do mundo digital, do vídeo à oferta final.
2. **⚡ Viral Repurposing: Vídeo ➔ Carrossel & Reels ➔ Chat 3x**
   * *Fluxo:* YouTube ➔ Extrator ➔ Carrossel de 10 Slides ➔ Visualizador.
   * *Objetivo:* Produção em massa de conteúdo para Instagram, LinkedIn e TikTok.
3. **🎯 Página de Vendas 14-Blocos & Auto-Cura CPS**
   * *Fluxo:* Briefing ➔ Gerador 14 Blocos ➔ Simulador com Personas ➔ Live Preview.
   * *Objetivo:* Criação de cartas de venda com taxa de conversão maximizada.
4. **🕵️ Competitor Intelligence Matrix**
   * *Fluxo:* Website Scraper ➔ Análise SWOT ➔ Relatório Tático de Oportunidades.
   * *Objetivo:* Mapear fraquezas de concorrentes e criar ofertas superiores.

#### Como Carregar um Template:
* Clique no botão **\`Templates\`** no topo do canvas, escolha o modelo desejado e clique em **\`Aplicar Template\`**!`,
    suggestedFollowUps: [
      'Como carregar o Template Chave de Ouro?',
      'O que faz o botão Alinhar Fluxo?',
      'Como funciona o Simulador CPS?'
    ],
    actions: [
      {
        type: 'LOAD_TEMPLATE',
        label: '👑 Carregar Template Chave de Ouro Agora',
        templateId: 'golden-key-master-flow'
      },
      {
        type: 'LOAD_TEMPLATE',
        label: '⚡ Carregar Template Repurposing Viral',
        templateId: 'viral-repurpose-omnichannel-flow'
      }
    ]
  },

  // 9. RESOLUÇÃO DE PROBLEMAS & TROUBLESHOOTING
  {
    id: 'troubleshooting-erros',
    category: 'TROUBLESHOOTING',
    title: 'Resolução de Problemas: Por que um nó falha e como resolver',
    keywords: [
      'erro', 'failed', 'falhou', 'por que falhou', 'nao funcionou', 'nao resultou', 
      'problema', 'ajuda', 'destravar', 'trava', 'status failed'
    ],
    summary: 'Guia de diagnóstico para destravar nós com status FAILED, URLs inválidas e conexões soltas.',
    detailedAnswer: `### 🛠️ Guia Rápido de Solução de Problemas

Se algum nó exibiu o banner vermelho **\`FAILED\`** ou o resultado não apareceu, confira este checklist de 3 passos:

---

#### 1. Verifique a URL de Entrada (Nós de YouTube / Website)
* Certifique-se de que a URL está completa (ex: \`https://www.youtube.com/watch?v=...\`).
* Em vídeos do YouTube, verifique se o vídeo possui áudio ou legendas em português ou inglês disponíveis.

#### 2. Verifique se o Nó Anterior Concluiu com Sucesso
* Um nó só consegue processar dados se o nó que envia dados para ele tiver o status verde **\`COMPLETED\`**.
* Se o nó anterior estiver \`IDLE\` (parado), execute o nó anterior primeiro ou clique em **\`Executar Pipeline\`** com o botão **Cascata** ativo.

#### 3. Nó Cinema E-book com Status Vermelho
* Se o nó gerou o conteúdo mas você não vê a tela:
  * Clique no botão verde **\`📖 Ler E-book\`** localizado no rodapé do nó.
  * O leitor abrirá imediatamente com os capítulos diagramados.

#### 4. Como Limpar e Reiniciar o Fluxo:
* Use o atalho **\`Alinhar Fluxo\`** para organizar os nós na tela.
* Se quiser recomeçar do zero com garantia total, carregue o template oficial **\`Chave de Ouro\`** com 1 clique!`,
    suggestedFollowUps: [
      'Onde vejo o e-book pronto?',
      'Como funciona o modo offline?',
      'Como falar com o Oráculo com voz?'
    ],
    actions: [
      {
        type: 'LOAD_TEMPLATE',
        label: '🔄 Restaurar para Template Oficial Homologado',
        templateId: 'golden-key-master-flow'
      }
    ]
  },

  // 10. MODO OFFLINE & ARQUITETURA LOCAL
  {
    id: 'modo-offline',
    category: 'GERAL',
    title: 'Como Funciona o Modo 100% Offline do UNION.AI',
    keywords: [
      'offline', 'modo offline', 'sem internet', 'sem conexao', 'local', 'funciona offline', 
      'como funciona offline', 'privacidade', 'latencia zero'
    ],
    summary: 'O assistente e os templates possuem motores locais que respondem sem precisar de internet ou servidor.',
    detailedAnswer: `### 🌐 Arquitetura 100% Offline do UNION.AI

O UNION.AI foi desenhado para ser resiliente e autônomo, mesmo em condições adversas de rede:

---

#### O que funciona 100% Offline:
1. **Chat Especialista do Projeto (Este Chat):**
   * Toda a base de conhecimento de 100% da plataforma está gravada no seu próprio navegador.
   * Você pode tirar dúvidas sobre qualquer nó, pedir roteiros de 14 blocos, consultar regras de conexões e resolver problemas sem consumir internet e sem gastar créditos.
2. **Editor de Canvas & Fluxo de Dados:**
   * Adicionar, conectar, reorganizar e testar nós e conexões funciona inteiramente no lado do cliente.
   * O salvamento automático local grava seu fluxo no navegador (LocalStorage).
3. **Leitor de E-books e Visualizadores:**
   * Qualquer documento ou e-book já gerado fica armazenado localmente para leitura e exportação imediata em Markdown.

#### Quando o sistema usa conexão Online:
* Quando você solicita a síntese de novos e-books com IA generativa em nuvem ou a transcrição de vídeos do YouTube em tempo real. Se a conexão cair, o sistema preserva todo o seu trabalho intacto.`,
    suggestedFollowUps: [
      'Como criar o e-book?',
      'Quais são os 16 templates?',
      'O que faz o botão Cascata?'
    ]
  }
];

export const QUICK_KNOWLEDGE_QUESTIONS: string[] = [
  'Como crio o e-book?',
  'Onde vejo o e-book pronto?',
  'O que faz o botão cascata?',
  'Como criar página de vendas?',
  'Como funciona o Simulador CPS?',
  'Por que um nó fica FAILED?',
  'Como conectar nós no canvas?',
  'Quais são os 16 templates oficiais?'
];

/**
 * Normaliza texto para busca insensível a acentos, maiúsculas e pontuação.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchKnowledgeResult {
  item: KnowledgeItem;
  score: number;
  matchedKeywords: string[];
}

/**
 * Motor de busca semântica e de palavras-chave 100% local e determinístico.
 * Executa em 0ms no navegador, sem fazer requisições HTTP.
 */
export function searchUnionKnowledgeBase(query: string): {
  answer: string;
  category: string;
  relevantItem?: KnowledgeItem;
  suggestedFollowUps: string[];
  actions: KnowledgeAction[];
  isExactMatch: boolean;
} {
  const normQuery = normalizeText(query);
  if (!normQuery) {
    const defaultItem = UNION_KNOWLEDGE_BASE[0];
    return {
      answer: defaultItem.detailedAnswer,
      category: defaultItem.category,
      relevantItem: defaultItem,
      suggestedFollowUps: defaultItem.suggestedFollowUps,
      actions: defaultItem.actions || [],
      isExactMatch: false
    };
  }

  const queryTokens = normQuery.split(' ').filter(t => t.length > 2);

  // Calcula pontuação de cada item na base de conhecimento
  const scoredItems: SearchKnowledgeResult[] = UNION_KNOWLEDGE_BASE.map(item => {
    let score = 0;
    const matchedKeywords: string[] = [];

    const normTitle = normalizeText(item.title);
    const normSummary = normalizeText(item.summary);
    const normKeywords = item.keywords.map(normalizeText);

    // 1. Verificação de correspondência exata de frase nas keywords
    for (const kw of normKeywords) {
      if (normQuery.includes(kw) || kw.includes(normQuery)) {
        score += 50;
        matchedKeywords.push(kw);
      }
    }

    // 2. Verificação de correspondência no título
    if (normTitle.includes(normQuery)) {
      score += 40;
    }

    // 3. Verificação por tokens individuais
    for (const token of queryTokens) {
      if (normTitle.includes(token)) {
        score += 15;
      }
      if (normSummary.includes(token)) {
        score += 8;
      }
      for (const kw of normKeywords) {
        if (kw.includes(token)) {
          score += 10;
          if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
        }
      }
    }

    return { item, score, matchedKeywords };
  });

  // Ordena por pontuação decrescente
  scoredItems.sort((a, b) => b.score - a.score);
  const bestMatch = scoredItems[0];

  // Se a pontuação for satisfatória (> 15), retorna a resposta detalhada exata
  if (bestMatch && bestMatch.score >= 15) {
    return {
      answer: bestMatch.item.detailedAnswer,
      category: bestMatch.item.category,
      relevantItem: bestMatch.item,
      suggestedFollowUps: bestMatch.item.suggestedFollowUps,
      actions: bestMatch.item.actions || [],
      isExactMatch: true
    };
  }

  // Resposta inteligente contextual se a busca for muito genérica
  const topTopics = UNION_KNOWLEDGE_BASE.slice(0, 4);
  const fallbackAnswer = `Entendi sua dúvida sobre **"${query}"**.

Sou o **Assistente Especialista UNION.AI (100% Offline)**. Conheço toda a estrutura técnica e operacional da plataforma.

Aqui estão os tópicos mais procurados que podem te ajudar agora:

1. **📖 Como Criar um E-book:** Via *Union Forge* (1 clique) ou via nós no Canvas (*YouTube ➔ Cinema E-book ➔ Visualizador*).
2. **👁️ Onde Ver o E-book Pronto:** No *Leitor Modal Automático*, no botão verde *Ler E-book* do nó ou no *Visualizador de Saída*.
3. **🌊 Botão Cascata:** Ativa a execução contínua e autônoma nó a nó no Data Bus.
4. **🚀 Páginas de Vendas (14 Blocos):** Copy completa com pré-visualização ao vivo e simulador de conversão.
5. **🎯 Simulador CPS:** Análise de conversão com personas sintéticas e auto-cura.

*Você pode clicar em uma das sugestões abaixo ou me fazer uma pergunta direta!*`;

  return {
    answer: fallbackAnswer,
    category: 'GERAL',
    suggestedFollowUps: QUICK_KNOWLEDGE_QUESTIONS.slice(0, 4),
    actions: [
      {
        type: 'LOAD_TEMPLATE',
        label: '👑 Carregar Fluxo Supremo Chave de Ouro',
        templateId: 'golden-key-master-flow'
      }
    ],
    isExactMatch: false
  };
}
