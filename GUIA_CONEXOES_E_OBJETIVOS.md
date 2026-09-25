# ⚡ GUIA DEFINITIVO: CONEXÕES DE BLOCOS E OBJETIVOS NO UNION.AI

> **Documento de Referência Rápida para Engenharia de Workflows, Automação e Marketing com IA**

---

## 🧭 A LÓGICA DE DADOS DO UNION.AI
No UNION.AI, uma linha entre nós não é um desenho decorativo — ela é um **Data Bus físico** que transporta pacotes tipados (DataPackets). 
O pipeline segue a esteira universal de 4 fases:

1. ENTRADA (Fontes) -> 2. EXTRAÇÃO / INTELIGÊNCIA -> 3. GERAÇÃO (IA) -> 4. SIMULAÇÃO / EXPORTAÇÃO

---

## 🎨 TABELA UNIVERSAL DE TIPOS DE PORTA (CORES DOS FIOS)

| Tipo de Dado | O Que Transporta | Pode Conectar Em... | Cor da Porta / Fio |
| :--- | :--- | :--- | :--- |
| **TEXT** | Textos livres, briefings, instruções e resumos | Entradas de Contexts, Prompt, Briefing, Raw Text | Verde / Ciano Claro |
| **TRANSCRIPT** | Transcrições completas de áudio/vídeo com timestamps | Entradas de Sources, Contexts, Data Analyst | Verde Claro |
| **URL** | Links validados (YouTube, Websites, APIs) | Entradas de Video URL, Page URL | Ciano / Azul Elétrico |
| **DOCUMENT** | Documentos completos (PDFs, VSLs, Copy de Vendas) | Entradas de Document Extractor, Simulator Copy | Azul Escuro |
| **JSON / TABLE** | Estruturas de dados, perfis de Avatar, matrizes SWOT | Entradas de Avatar Profile, Data Formatter, Simulator JSON | Amarelo / Dourado |
| **AI_RESPONSE** | Respostas processadas geradas pelos modelos de IA | Entradas de Content Exporter, Data Formatter, Re-prompter | Roxo Neon |
| **VIDEO / AUDIO**| Referências a arquivos de mídia para transcrição | Entradas de Media Input dos extratores | Rosa / Magenta |

---

## 🚀 AS 8 GRANDES ESTEIRAS DE CONEXÃO & SEUS OBJETIVOS

### 1. Fábrica de Conteúdo do YouTube (YouTube Content Factory)
* **Objetivo:** Transformar qualquer vídeo longo de referência do YouTube em roteiros de Shorts/Reels, artigos de blog ou carrosséis em segundos.
* **Diagrama de Conexão:**
  YouTube Source -> AI Content Writer -> Content Pack Exporter
* **Portas Conectadas:**
  - YouTube Source [Transcript] -> Conecta em -> [Briefing] do AI Content Writer
  - AI Content Writer [Written Content] -> Conecta em -> [All Artifacts] do Content Pack Exporter

---

### 2. Máquina de Páginas de Vendas de Alta Conversão (14 Blocos)
* **Objetivo:** Descobrir as dores viscerais do ICP, estruturar uma carta de vendas de 14 blocos psicológicos de alta conversão e validar no simulador.
* **Diagrama de Conexão:**
  Text Prompt -> Marketing Avatar -> Sales Page Copywriter -> Simulador CPS
* **Portas Conectadas:**
  - Text Prompt [Text] -> Conecta em -> [Briefing / Research] do Marketing Avatar
  - Marketing Avatar [Avatar Profile] -> Conecta em -> [Avatar / ICP] do Sales Page Copywriter
  - Sales Page Copywriter [Full Sales Page Copy] -> Conecta em -> [Copy] do Simulador CPS

---

### 3. Esteira de VSL & Matriz Omnichannel de Anúncios
* **Objetivo:** Criar um roteiro de Video Sales Letter em 12 passos magnéticos e desdobrar automaticamente em dezenas de anúncios para Meta Ads, Google e TikTok.
* **Diagrama de Conexão:**
  Marketing Avatar -> VSL Scriptwriter (12 Passos) -> Multi-Platform Ad Matrix
* **Portas Conectadas:**
  - Marketing Avatar [Avatar Profile] -> Conecta em -> [Avatar Profile] do VSL Scriptwriter
  - VSL Scriptwriter [Full VSL Script] -> Conecta em -> [Source Copy] do Multi-Platform Ad Matrix
  - Multi-Platform Ad Matrix [Ad Copy Pack] -> Conecta em -> [All Artifacts] do Content Pack Exporter

---

### 4. Espionagem & Inteligência de Concorrência
* **Objetivo:** Varrer sites de concorrentes, gerar matriz SWOT (forças, fraquezas, ameaças) e mapear brechas de mercado para diferenciar sua oferta.
* **Diagrama de Conexão:**
  Website Crawler -> Competitor Intelligence -> AI Market Analyst
* **Portas Conectadas:**
  - Website Crawler [Clean Text] -> Conecta em -> [Competitor URLs / Text] do Competitor Intelligence
  - Competitor Intelligence [Analysis Report] -> Conecta em -> [Data Sources] do AI Market Analyst
  - Competitor Intelligence [SWOT Matrix] -> Conecta em -> [JSON Data] do Data Formatter

---

### 5. Chat com Documentos e Livros (RAG Empresarial)
* **Objetivo:** Fazer o assistente ler relatórios financeiros, manuais, propostas ou e-books em PDF e responder perguntas técnicas sem alucinações.
* **Diagrama de Conexão:**
  PDF Document -> PDF Extractor -> AI Chat Assistant
* **Portas Conectadas:**
  - PDF Document [Document] -> Conecta em -> [Document Input] do PDF Extractor
  - PDF Extractor [Clean Text] -> Conecta em -> [Contexts] do AI Chat Assistant
  - Text Prompt [Text Output] -> Conecta em -> [Prompt] do AI Chat Assistant

---

### 6. Roteador Inteligente de Custo & Performance (Smart AI Router)
* **Objetivo:** Economizar tokens direcionando tarefas simples para modelos ultra-rápidos e tarefas complexas para modelos de raciocínio profundo.
* **Diagrama de Conexão:**
  Text Prompt -> Smart AI Router -> Fast Branch (Flash) / Deep Branch (Claude/Sonnet)
* **Portas Conectadas:**
  - Text Prompt [Text Output] -> Conecta em -> [Task Input] do Smart AI Router
  - Smart AI Router [Fast Branch] -> Conecta em nós de resumo rápido
  - Smart AI Router [Deep Branch] -> Conecta em nós de análise estratégica

---

### 7. Agente Autônomo com Raciocínio (ReAct Agent)
* **Objetivo:** O agente planeja sozinho, consulta fontes, reflete sobre erros e entrega a solução final sem intervenção humana.
* **Diagrama de Conexão:**
  Text Prompt (Objetivo / Meta) -> Autonomous Agent (ReAct) -> Simulador CPS
* **Portas Conectadas:**
  - Text Prompt [Text] -> Conecta em -> [Objective / Briefing] do Autonomous Agent
  - Autonomous Agent [Final Solution] -> Conecta em -> [Raw Copy Text] do Simulador CPS
  - Autonomous Agent [Thought Steps] -> Conecta em -> Data Formatter

---

### 8. Automação Recorrente no Piloto Automático
* **Objetivo:** Deixar o UNION.AI rodando sem intervenção humana, agendado via Cron diário ou acionado externamente pelo seu CRM ou Webhook.
* **Diagrama de Conexão:**
  Schedule Trigger ou Webhook Trigger -> YouTube / Website -> AI Content Writer -> Publish & Export Destination
* **Portas Conectadas:**
  - Schedule Trigger [Trigger Event] -> Dispara o workflow em intervalos (ex: todo dia às 09:00).
  - Webhook Trigger [Webhook Data] -> Recebe payload POST com dados novos.
  - Publish & Export Destination [Artifacts] -> Despacha via webhook para publicação.

---

### 9. Cinema E-book Cinematográfico (Narrativas de Alta Profundidade)
* **Objetivo:** Transformar transcrições ou temas em livros com arcos emocionais estruturados e capítulos substanciais (>1.000 palavras/capítulo) no visualizador 3x.
* **Diagrama de Conexão:**
  YouTube Source -> Transcript Extractor -> Cinema E-book Agent -> Visualizador Universal 3x
* **Portas Conectadas:**
  - YouTube Source [URL] -> Conecta em -> [YouTube URL] do Transcript Extractor
  - Transcript Extractor [Transcript] -> Conecta em -> [Context / Knowledge] do Cinema E-book Agent
  - Cinema E-book Agent [Complete E-book] -> Conecta em -> [E-book Data] do Visualizador Universal 3x (para leitura e exportação PDF)

---

### 10. Máquina de Páginas de Vendas (14 Blocos) & Auto-Cura CPS
* **Objetivo:** Estruturar copy de alta conversão em 14 blocos psicológicos, auditar os 5 eixos algorítmicos no simulador CPS e reescrever pontos fracos em 1 clique.
* **Diagrama de Conexão:**
  Text Briefing -> 14-Block Sales Page Copywriter -> Simulador CPS & Auto-Healing -> Visualizador Universal 3x
* **Portas Conectadas:**
  - Text Briefing [Text] -> Conecta em -> [Context / Research] do 14-Block Sales Page Copywriter
  - 14-Block Sales Page Copywriter [Sales Page Copy] -> Conecta em -> [Copy Text] do Simulador CPS
  - 14-Block Sales Page Copywriter [Blocks JSON] -> Conecta em -> [Blocks Data] do Simulador CPS
  - Simulador CPS [Healed Copy / E-book Data] -> Conecta em -> [Input Data] do Visualizador Universal 3x

---

### 11. Repurposing Viral Omnichannel (Vídeo ➔ Carrossel & Reels ➔ Chat 3x)
* **Objetivo:** Converter qualquer vídeo longo em carrosséis para Instagram/LinkedIn, roteiros dinâmicos de Reels/Shorts e carregar o contexto num assistente interativo 3x.
* **Diagrama de Conexão:**
  YouTube Source -> Transcript Extractor -> AI Content Writer (Viral) -> AI Chat 3x -> Visualizador Universal 3x
* **Portas Conectadas:**
  - YouTube Source [URL] -> Conecta em -> [YouTube URL] do Transcript Extractor
  - Transcript Extractor [Transcript] -> Conecta em -> [Context] do AI Content Writer
  - Transcript Extractor [Transcript] -> Conecta em -> [Knowledge Context] do AI Chat 3x
  - AI Content Writer [Content] -> Conecta em -> [Markdown / Copy] do Visualizador Universal 3x

---

### 12. 👑 Chave de Ouro: Império Autônomo de Conteúdo & Vendas (O Fluxo Supremo)
* **Objetivo:** O ecossistema autônomo total. Pega 1 vídeo ou tema bruto e gera simultaneamente: E-book Cinematográfico completo (>1k pal/cap), Página de Vendas de 14 Blocos Psicológicos, Auditoria CPS com Auto-Cura, Chat Conversacional 3x e Visualizador 3x com download em PDF.
* **Diagrama de Conexão:**
  YouTube Source -> Transcript Extractor -> Cinema E-book Agent ➔ Copywriter 14-Blocos ➔ Simulador CPS ➔ AI Chat 3x ➔ Visualizador Universal 3x
* **Portas Conectadas:**
  - YouTube Source [URL] -> [YouTube URL] do Transcript Extractor
  - Transcript Extractor [Transcript] -> [Context] do Cinema E-book Agent
  - Cinema E-book Agent [Synopsis / Core Narrative] -> [Briefing] do Copywriter 14-Blocos
  - Copywriter 14-Blocos [Sales Page Copy] -> [Copy Text] do Simulador CPS
  - Transcript Extractor [Transcript] -> [Knowledge Base] do AI Chat 3x
  - Cinema E-book Agent [Complete E-book] + Simulador CPS [Healed Copy] -> [Data Input] do Visualizador Universal 3x

---

## 🛠️ DICAS DE OURO PARA OPERAÇÃO
1. **Comando no Chat do Projeto**: Se não quiser arrastar bloco a bloco manualmente, abra o **Chat do Projeto** (topo direito) e peça em português: *"Crie o fluxo Chave de Ouro com YouTube, Cinema E-book e Simulador CPS"*.
2. **Auto-Layout BFS (`⚡ AUTO LAYOUT`)**: Sempre que o canvas tiver muitos blocos, clique em Auto-Layout para ordenar toda a esteira sem colisões.
3. **Data Inspector**: Dê um clique em qualquer fio de conexão para abrir o **Inspetor de Pacotes** e ver os dados trafegando em tempo real.
4. **Motor Padrão Groq**: Toda a geração opera com **Groq Llama 3.3 70B** por padrão para velocidade extrema, permitindo fallback instantâneo nas configurações de cada nó.
5. **Templates Prontos**: No menu superior, o botão **Templates** carrega qualquer uma dessas 16 esteiras oficiais com apenas 1 clique!
