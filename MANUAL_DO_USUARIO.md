# UNION.AI — MANUAL DE INSTRUÇÕES COMPLETO
## Guia Definitivo do Usuário, Operador e Engenheiro de Workflows

---

### BEM-VINDO AO UNION.AI

O **UNION.AI** é um **AI Workspace visual baseado em Canvas Infinito** projetado para permitir que criadores, engenheiros de IA, profissionais de marketing e equipes corporativas construam e executem ecossistemas autônomos de inteligência artificial.

Diferente de assistentes convencionais ou chatbots baseados apenas em janelas de conversa, o UNION.AI opera sob uma **Diretiva Suprema**:
> **"CADA CONEXÃO REPRESENTA UM FLUXO REAL DE DADOS. CADA NÓ EXECUTA UMA TAREFA TANGÍVEL."**

---

## 1. ACESSO RÁPIDO AO SISTEMA

| Componente | Endereço Local | Descrição |
| :--- | :--- | :--- |
| **Interface Visual (Canvas)** | [http://localhost:1590/](http://localhost:1590/) | Ambiente de trabalho visual interativo |
| **API Backend Core** | `http://localhost:4000/api` | API REST para execução, dados e inteligência |
| **Scraper Prometheus** | [http://localhost:4000/metrics](http://localhost:4000/metrics) | Métricas operacionais em formato aberto |
| **Health Check** | `http://localhost:1590/api/health` | Diagnóstico de integridade dos serviços |

---

## 2. ANATOMIA DA INTERFACE

```
+-----------------------------------------------------------------------------------------------+
| [Logo] UNION.AI / [Nome do Workflow] [Gate 18 Active]    (Créditos) [Salvo] [Templates] [RUN] |
+-----------------------------------------------------------------------------------------------+
| [Toolbar]  |                                                                                  |
|  [+] Add   |                               CANVAS INFINITO                                    |
|  [Layers]  |        [Source Node] ----(Fluxo Real de Dados)----> [AI Analyzer]                |
|  [Bus]     |                                                                                  |
|  [AI]      |                                                                                  |
|  [History] |                                                                    [Mini-Mapa]   |
|  [Credits] |                                                                    [Controles]   |
+-----------------------------------------------------------------------------------------------+
```

### 2.1 Top Header (Barra Superior)
- **Título & Renomeação:** Clique sobre o campo *"Workflow Name"* para renomear seu projeto a qualquer momento.
- **Badge de Status:** Exibe `Gate 18 Active (MVP Verified)`, garantindo conformidade com todos os 18 pilares da plataforma.
- **Carteira de Créditos:** Clique no botão com ícone de moeda para abrir a gaveta financeira, verificar saldo em tempo real e visualizar transações.
- **HUD de Persistência & Autosave:**
  - `Saving...`: Sincronização atômica em andamento.
  - `Saved`: Salvo com sucesso no banco de dados SQLite WAL.
  - `Saved locally`: Salvo em cache local do navegador caso a conexão caia.
- **Status do Servidor:** Indicador em tempo real (`Backend: ONLINE` em verde).
- **Botão Templates:** Abre a Biblioteca Oficial de Workflow Templates.
- **Botão RUN WORKFLOW:** Inicia a validação DAG e exibe o plano de execução. Durante a execução, transforma-se no botão vermelho **STOP**.

### 2.2 Left Toolbar (Barra Lateral Esquerda)
- **[+] Quick Add:** Adiciona um nó genérico na posição central visível do Canvas.
- **[Layers] Node Library:** Abre a gaveta com todo o catálogo de nós disponíveis agrupados por categoria.
- **[Database] Data Bus Inspector:** Permite inspecionar pacotes que trafegam entre portas.
- **[Activity] Telemetria & Histórico:** Visualiza runs anteriores e versões salvas para rollback imediato.
- **[Coins] Créditos:** Atalho para a gestão de quotas de IA.

---

## 3. NAVEGAÇÃO NO CANVAS INFINITO

- **Arrastar o Canvas (Pan):** Clique com o botão esquerdo em qualquer área vazia e arraste, ou use o botão do meio do mouse.
- **Zoom In / Out:** Use a roda do mouse (scroll) ou os controles `+` e `-` no canto inferior direito.
- **Mover Nós:** Clique no cabeçalho do nó e arraste para a posição desejada.
- **Conectar Nós:** Clique na bolinha da porta de saída (Output à direita) e arraste até a porta de entrada (Input à esquerda) do nó destino.
- **Atalho de Salvamento:** Pressione `Ctrl + S` a qualquer instante para forçar a persistência no servidor.

---

## 4. O SISTEMA DE DADOS: UNION DATA BUS

No UNION.AI, uma linha entre nós **nunca é uma mera seta gráfica**. Ela é um canal físico pelo qual trafegam **DataPackets** tipados e validados.

### Tipos de Dados Universais:
| Tipo | Significado | Exemplo de Uso |
| :--- | :--- | :--- |
| `TEXT` | Texto bruto ou processado | Artigos, prompts, roteiros |
| `URL` | Endereço web validado | Links do YouTube, páginas web |
| `TRANSCRIPT` | Transcrição de áudio/vídeo | Texto falado com timestamps |
| `AI_RESPONSE` | Resposta estruturada de modelo | Saídas geradas por OpenAI, Anthropic, Gemini |
| `JSON` / `TABLE` | Dados tabulares ou estruturados | Métricas de campanhas, matrizes SWOT |

### Proteção Contra Conexões Incompatíveis:
Se você tentar conectar uma saída incompatível (por exemplo, um link `URL` diretamente em uma entrada que exige `TRANSCRIPT`), o UNION.AI **bloqueia o erro na fonte** e abre o **Modal de Compatibilidade**, sugerindo nós intermediários (ex: extrator de transcrição) para resolver o fluxo automaticamente com um clique.

---

## 5. CATÁLOGO COMPLETO DE NÓS (NODE LIBRARY)

### 5.1 Categoria: SOURCE & INPUT
- **YouTube Source (`source-youtube`):** Recebe e valida URLs de vídeos do YouTube (`youtube.com/watch` ou `youtu.be`).
- **Website URL Source (`source-website`):** Entrada de links para raspagem de sites e portais.
- **Text Input (`source-text`):** Caixa de texto para briefing manual, descrição de produto ou instruções.
- **Webhook Trigger (`trigger-webhook`):** Cria um endpoint seguro para disparar o workflow via POST externo.

### 5.2 Categoria: EXTRACTOR
- **YouTube Transcript Extractor (`extractor-youtube`):** Extrai a transcrição completa e os metadados do vídeo.
- **Website Content Scraper (`extractor-website`):** Realiza a raspagem de páginas web, removendo scripts e tags HTML para gerar texto limpo.

### 5.3 Categoria: UNDERSTAND & AI ANALYSIS
- **AI Concept Analyzer (`ai-analyzer`):** Decompõe textos longos identificando ângulos psicológicos, conceitos centrais e ganchos de engajamento.
- **AI Classifier (`ai-classifier`):** Classifica conteúdos por intenção, sentimento ou categoria.
- **AI Summarizer (`ai-summarizer`):** Condensa relatórios extensos em resumos executivos objetivos.

### 5.4 Categoria: AI GENERATION & CONTENT
- **AI Content Writer (`ai-writer`):** Redator multi-formato para criação de artigos, e-mails, threads e posts para redes sociais.
- **AI Copywriter:** Redação persuasiva com técnicas avançadas de copywriting (AIDA, PAS, Storytelling).
- **Cinema E-book Agent (`ai-cinema-agent`):** Agente de elite para criação de e-books e narrativas cinematográficas de profundidade com mais de 1.000 palavras por capítulo. Suporta gêneros (Ficção Científica, Suspense, Negócios, Desenvolvimento Pessoal), estilos visuais cinematográficos (Noir, IMAX, Cyberpunk, Fotográfico) e arcos emocionais com tensão progressiva. Gera sinopses completas, metadados estruturados e capítulos detalhados. Dimensões estendidas no Canvas de 640×640 px (3x).
- **AI Interactive Chat (`ai-chat`):** Assistente conversacional imersivo de 640×640 px com histórico em tempo real, suporte a contexto RAG e exportação direta do histórico.

### 5.5 Categoria: MARKETING INTELLIGENCE ENGINE (Gate 14)
- **Target Avatar Generator (`marketing-avatar`):** Cria perfis psicológicos profundos do cliente ideal (dores viscerais, desejos ocultos, objeções e nível de consciência).
- **Competitor SWOT Analyst (`marketing-competitor`):** Mapeia forças, fraquezas, lacunas inexploradas e oportunidades de mercado dos concorrentes.
- **12-Step High-Converting VSL (`marketing-vsl`):** Elabora roteiros completos para Vídeos de Vendas seguindo a metodologia validada de 12 etapas.
- **Omnichannel Ads Matrix (`marketing-ads`):** Gera matriz completa de anúncios formatados para **Meta (Instagram/Facebook)**, **Google Ads** e **TikTok**.
- **14-Block Sales Page Copywriter (`marketing-sales-page`):** Estrutura cartas de vendas completas seguindo 14 blocos psicológicos comprovados de alta conversão.

### 5.6 Categoria: SIMULAÇÃO, AUDITORIA & VISUALIZAÇÃO
- **Simulador CPS & Auto-Healing (`simulator-cps`):** Avalia a copy com pontuação algorítmica de 0 a 100 em 5 eixos: Clareza, Persuasão, Conexão Emocional, Urgência e Oferta Irresistível. Possui **Auto-Cura em 1 Clique**, reescrevendo as fraquezas detectadas automaticamente.
- **Visualizador Universal 3x & Reader Mode (`output-modal-viewer`):** Nó expansível de 640×640 px para visualização de Markdown, E-books e JSON complexo, com botões nativos para leitura imersiva (Reader Modal), download em `.MD` e exportação formatada em `.PDF`.

---

## 6. MOTOR COGNITIVO PADRÃO: GROQ LLAMA 3.3 70B & MULTI-MODELO

O UNION.AI adota por padrão em todos os nós e serviços o modelo **Groq Llama 3.3 70B Versatile**, proporcionando:
- **Latência Ultra-Baixa:** Respostas quase instantâneas geradas na velocidade da inferência Groq LPU™.
- **Roteamento Cognitivo Híbrido:** Capacidade de alternar comutativamente por nó para Claude 3.7 Sonnet, DeepSeek R1, GPT-4o e Gemini 1.5 Pro.
- **Fallback Resiliente:** Em caso de oscilações ou esgotamento de quota de um provedor, o sistema realiza fallback automático determinístico sem interromper a esteira.

---

## 7. RECURSOS VISUAIS & PRODUTIVIDADE NO CANVAS

- **Nós de Grande Porte (Formato 3x — 640×640 px):** Os nós `output-modal-viewer`, `ai-chat` e `ai-cinema-agent` operam em formato expandido no canvas para leitura fluida, inspeção de código e conversação imersiva sem necessidade de abrir abas externas.
- **Auto-Layout BFS Inteligente:** O botão `⚡ AUTO LAYOUT` reordena automaticamente os nós da esquerda para a direita baseado em busca em largura (BFS) e detecção de dependências, garantindo espaçamento anti-colisão uniforme.
- **Execução em Cascata (`⚡ CASCATA`):** Executa o pipeline de forma visual e sequencial em tempo real, pulsando visualmente cada nó conforme o processamento avança pela esteira de dados.

---

## 8. BIBLIOTECA DE 16 TEMPLATES OFICIAIS

Para iniciar instantaneamente com esteiras prontas e testadas, clique no botão **"Templates"** no Top Header:

```
+-------------------------------------------------------------------------------------------------------+
|  [Templates] (16 Esteiras Oficiais)                                                                   |
|                                                                                                       |
|  👑 1. Chave de Ouro: Império Autônomo de Conteúdo & Vendas (O Fluxo Supremo)                         |
|     YouTube -> Cinema E-book Agent -> Copywriter 14-Blocos -> Simulador CPS -> AI Chat 3x -> Viewer 3x|
|                                                                                                       |
|  🎯 2. Página de Vendas 14-Blocos & Auto-Cura CPS                                                      |
|     Briefing -> Copywriter 14-Blocos -> Simulador CPS (Auditoria & Auto-Cura) -> Visualizador 3x       |
|                                                                                                       |
|  📱 3. Repurposing Viral Omnichannel                                                                   |
|     YouTube -> Viral Transformer -> AI Chat 3x -> Visualizador 3x                                     |
|                                                                                                       |
|  🎬 4. Cinema E-book Cinematográfico                                                                  |
|     YouTube Source -> Cinema E-book Agent (>1k pal/cap) -> Visualizador 3x (PDF/MD)                   |
+-------------------------------------------------------------------------------------------------------+
```

### Relação Completa dos 16 Templates Oficiais:
1. **👑 Chave de Ouro: Império Autônomo de Conteúdo & Vendas (`golden-key-master-flow`):** O ecossistema unificado definitivo. Converte um vídeo em E-book Cinematográfico de profundidade, Página de Vendas 14-Blocos, Auditoria CPS com Auto-Cura, Chat Interativo 3x e Visualizador 3x com exportação em PDF.
2. **Página de Vendas 14-Blocos & Auto-Cura CPS (`sales-page-simulation-flow`):** Pipeline com auditoria algorítmica de copy e regeneração automática dos blocos com menor pontuação.
3. **Repurposing Viral: Vídeo ➔ Carrossel & Reels ➔ Chat 3x (`viral-repurpose-omnichannel-flow`):** Extrai o melhor gancho de um vídeo para produzir carrosséis, scripts de Reels e alimentar o assistente conversacional.
4. **🎬 Cinema E-book Cinematográfico (`cinematic-ebook-flow`):** Criação de e-books cinematográficos completos com arcos dramáticos e capítulos substanciais (>1.000 palavras).
5. **YouTube Content Factory (`youtube-content-factory`):** YouTube Source -> Transcript -> Concept Analyzer -> Multi-Platform Content Pack.
6. **Competitor Intelligence Matrix (`competitor-intel-report`):** Website Scraper -> Competitor SWOT -> Executive Strategy Report.
7. **Autonomous Marketing VSL Engine (`marketing-vsl-engine`):** Offer Briefing -> Target Avatar -> 12-Step VSL Script -> Omnichannel Ads Matrix.
8. **Full Funnel Launch Machine (`full-funnel-launch-machine`):** Briefing -> Avatar -> VSL 12-Passos -> Sales Page -> Ads Matrix.
9. **Sales Page 14-Blocos & Simulador CPS (`sales-page-cps-machine`):** Briefing -> Avatar -> Sales Page -> CPS Simulator.
10. **Chat Inteligente com Documentos RAG (`document-rag-chat`):** PDF Document -> PDF Extractor -> AI Chat Assistant.
11. **Agente Autônomo Reflexivo ReAct (`autonomous-react-agent`):** Text Prompt -> Autonomous ReAct Agent -> CPS Simulator.
12. **Automação Recorrente Cron (`recurring-automation-pipeline`):** Cron Schedule Trigger -> Extractor -> AI Writer -> Results.
13. **Síntese Multi-Vídeo: 3 YouTube -> Conhecimento AI / E-book (`multi-video-knowledge-forge`):** Conecta 3 canais de YouTube simultâneos para síntese em e-book.
14. **Vídeo para Livro Completo E-book Forge (`video-to-ebook-flow`):** Transforma aula do YouTube em livro com capítulos e exportação de Markdown.
15. **Chat Inteligente com Vídeo AI Chat 3x (`video-to-chat-flow`):** YouTube -> AI Chat 3x imersivo com contexto total do vídeo.
16. **Estratégia & Copywriting de Conversão (`strategy-copywriting-flow`):** Research -> Market Analyst -> High-Conversion Copywriter -> Output.

---

## 9. COMO EXECUTAR UM WORKFLOW

1. **Montar ou Carregar o Grafo:** Certifique-se de que os nós necessários estejam conectados.
2. **Clicar em RUN WORKFLOW ou ⚡ CASCATA:**
   - O UNION.AI executa a **Validação DAG**: verifica que não existem ciclos infinitos e que todas as portas obrigatórias estão supridas.
   - O **ExecutionPlanModal** é exibido, mostrando os lotes de nós que serão executados sequencialmente ou em paralelo.
3. **Confirmar Execução:**
   - O sistema altera o estado dos nós em tempo real:
     - `QUEUED` (Amarelo): Aguardando término das dependências.
     - `PROCESSING` (Azul com pulso): IA ou extrator em processamento ativo.
     - `COMPLETED` (Verde): Concluído com sucesso, dados transmitidos ao próximo nó.
     - `FAILED` (Vermelho): Em caso de erro, a mensagem detalhada é registrada.
4. **Interrupção:** A qualquer momento, clique em **STOP** para cancelar a esteira imediatamente.

---

## 10. GESTÃO FINANCEIRA: CARTEIRA DE CRÉDITOS & QUOTAS

Para garantir governança e evitar custos descontrolados de API, o UNION.AI opera com um sistema contábil atômico:
- **Saldo Inicial:** Cada novo usuário recebe **100.00 créditos** de cortesia.
- **Deduções Automáticas:** Apenas operações bem-sucedidas de extração e geração por IA debitam frações de crédito proporcionais aos tokens utilizados.
- **Histórico & Extrato:** Clique no saldo no topo da tela para visualizar o extrato completo com `workflow_id`, carimbo de data/hora e saldo restante.

---

## 11. AUTOMAÇÕES EXTERNAS & WEBHOOKS (GATE 15)

Você pode integrar seus workflows a sistemas externos (Make, Zapier, Webhooks de CRM ou Stripe):
1. Adicione o nó **Webhook Trigger** ao Canvas.
2. Ative o gatilho: o sistema gera um `secret_token` e um endpoint exclusivo:
   `POST http://localhost:4000/api/webhooks/v1/trigger/:workflowId`
3. Ao enviar um payload JSON no corpo da requisição com o cabeçalho `x-union-secret`, o workflow é acionado automaticamente em segundo plano.
4. O motor possui **Proteção Anti-Loop Infinito** integrada.

---

## 12. EQUIPES & MULTI-TENANCY (RBAC — GATE 16)

O UNION.AI permite criar múltiplos Workspaces e Organizações compartilhadas:
- **OWNER:** Controle total, delegação financeira e gestão de membros.
- **ADMIN:** Criação de projetos, adição de membros e execução de workflows.
- **EDITOR:** Edição de grafos e execução de fluxos.
- **VIEWER:** Visualização e auditoria em modo somente leitura.

---

## 13. OBSERVABILIDADE & AUDITORIA CORPORATIVA (GATE 17)

Para monitoramento em ambientes corporativos e DevOps:
- **Métricas Prometheus:** Acesse `http://localhost:4000/metrics` para integrar com Grafana ou Datadog.
  - Métricas expostas: `union_uptime_seconds`, `union_workflows_executed_total`, `union_tokens_consumed_total`, `union_credits_deducted_total`, `union_workflow_duration_ms_avg`, `union_error_rate_percent`.
- **Trilha de Auditoria (Audit Trail):** Todas as ações críticas (login, criação de organização, disparo de webhooks, alteração de permissões) são gravadas imutavelmente na tabela `audit_logs` do SQLite WAL com IP e carimbo de data/hora.

---

## 14. FAQ & DICAS DE PRODUTIVIDADE

### P: Qual o modelo de IA padrão utilizado?
**R:** Por padrão, todos os nós utilizam **Groq Llama 3.3 70B**, garantindo altíssima velocidade e raciocínio afiado. Você pode alternar pontualmente para Claude 3.7 Sonnet, DeepSeek R1, GPT-4o ou Gemini nas configurações do nó.

### P: Como exportar o e-book ou copy gerada para PDF ou Markdown?
**R:** Conecte a saída do nó gerador a um nó **Visualizador 3x (`output-modal-viewer`)**. Nele, você conta com os botões rápidos **Baixar .MD**, **Exportar PDF** e **Modo Leitor**.

### P: Meus dados são perdidos se eu fechar a aba?
**R:** Não. O UNION.AI possui sistema duplo de autosave: salva em tempo real no SQLite WAL do backend e mantém uma cópia sincronizada no armazenamento local do navegador.

### P: Como organizar nós emaranhados no canvas?
**R:** Clique no botão **⚡ AUTO LAYOUT** na barra superior ou na barra de ferramentas. O algoritmo BFS reorganiza instantaneamente os blocos em cascata anti-colisão.

---

*Manual homologado para o UNION.AI Enterprise & MVP Verified — Versão 2.0 (2026).*

---

## 15. GUIA RÁPIDO DE CONEXÕES DE BLOCOS & OBJETIVOS

Para visualizar a matriz completa de conexões recomendadas, portas compatíveis e diagramas prontos para esteiras de marketing, criação de conteúdo e automação com IA, consulte o arquivo dedicado:
👉 **GUIA_CONEXOES_E_OBJETIVOS.md** (localizado na raiz do projeto).
