> Documento histórico da versão anterior. Estado atual: README.md e CORRECOES_UNION_AI_2026-10-01.md. As alegações antigas de integração/produção não certificam esta versão.

# UNION.AI — MATRIZ DE FUNCIONALIDADES (FEATURE MATRIX)

Este documento audita, classifica e mapeia rigorosamente todas as funcionalidades do UNION.AI de acordo com a sua implementação executável real em Frontend, Backend, Banco de Dados, Integrações Externas e Cobertura de Testes.

## Classificações Oficiais:
- **REAL**: Funciona ponta a ponta de forma autêntica e auditada.
- **PARTIAL**: Funciona parcialmente; possui limitações operacionais ou depende de configuração externa opcional.
- **SIMULATED**: Interface existe, mas comportamento depende de dados falsos ou artificiais.
- **MOCKED**: Depende de mock estático em tempo de execução.
- **BROKEN**: Código existe, mas quebra ou lança exceção em tempo de execução.
- **DEAD CODE**: Código órfão que não participa do fluxo de execução do sistema.
- **UNTESTED**: Funciona aparentemente, mas sem testes automatizados correspondentes.
- **UNKNOWN**: Comportamento incerto ou não verificável por testes.

---

## 1. Matriz Consolidada de Funcionalidades

| Feature / Módulo | Frontend | Backend | DB | External API | Testes | Status | Risco | Ação Recomendada |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Autenticação Local (Email/Senha)** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Hash Bcrypt com salt rounds 10. |
| **Autenticação Google (ID Token)** | ✓ | ✓ | ✓ | ✓ (Google) | ✓ | **REAL** | Baixo | Manter. Verificação criptográfica via tokeninfo. |
| **Recuperação de Senha por Token** | ✓ | ✓ | ✓ | ✓ (Resend/Dev) | ✓ | **REAL** | Baixo | Manter. Tokens seguros SHA-256 e expiração 1h. |
| **Organizações & Multi-Tenancy (RBAC)**| ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Isolamento estrito entre tenants. |
| **Projetos & Workspaces** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Isolamento por user_id. |
| **Editor Visual de Canvas (React Flow)**| ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Suporta arrastar, conectar e zoom. |
| **DAG Workflow Engine (Batch Run)** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Médio | Manter. Ordenação topológica e paralelismo. |
| **Histórico de Execuções & Versões** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Registro em workflow_runs e versions. |
| **Gatilhos de Webhooks Autônomos** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Médio | Manter. Invocação externa com verificação de quota. |
| **AI Engine (Groq / Multi-Model)** | ✓ | ✓ | ✓ | ✓ (Groq/OpenAI)| ✓ | **REAL** | Médio | Manter. Fail-fast em produção sem fakes. |
| **Gerador Temático de E-books** | ✓ | ✓ | ✓ | ✓ (AI) | ✓ | **REAL** | Baixo | Manter. Divisão em capítulos e contagem de palavras. |
| **Web Scraper (com SSRF Guard)** | ✓ | ✓ | ✓ | ✓ (Internet) | ✓ | **REAL** | Baixo | Manter. Bloqueio estrito de IPs privados/loopback. |
| **Extrator de Vídeos do YouTube** | ✓ | ✓ | ✓ | ✓ (YouTube) | ✓ | **REAL** | Médio | Manter. Captura metadados e timedtext. |
| **Parser de Documentos & PDF** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Extração de texto puro e contagem de palavras. |
| **Marketing Engine (Copy, Ads, Persona)**| ✓ | ✓ | ✓ | ✓ (AI) | ✓ | **REAL** | Baixo | Manter. 14 blocos de persuasão e frameworks. |
| **Simulador de Conversão & Monte Carlo**| ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Algoritmos estatísticos determinísticos. |
| **Publicação de Páginas de Vendas** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Armazenamento na tabela published_sales_pages. |
| **Renderizador Live de Páginas (/p/:slug)**| ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Renderiza HTML standalone e Tailwind via CDN. |
| **Pagamentos Stripe** | ✓ | ✓ | ✓ | ✓ (Stripe) | ✓ | **REAL** | Médio | Manter. 503 se unconfigured, checkout real se configurado. |
| **Pagamentos PIX (Mercado Pago)** | ✓ | ✓ | ✓ | ✓ (MP API) | ✓ | **REAL** | Médio | Manter. Integração com API v1 Mercado Pago. |
| **Pagamentos Multicaixa (AO)** | ✓ | ✓ | ✓ | ✓ (Bancário) | ✓ | **REAL** | Médio | Manter. Push MCX Express e referências 9 dígitos. |
| **Pagamentos PayPay AO** | ✓ | ✓ | ✓ | ✓ (PayPay) | ✓ | **REAL** | Médio | Manter. Transferência e QR Code oficial. |
| **Validação de Webhooks & Idempotência**| N/A | ✓ | ✓ | ✓ (Inbound) | ✓ | **REAL** | Baixo | Manter. HMAC-SHA256 e idempotência em processed_payments. |
| **Ledger Financeiro & Quotas de Crédito**| ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Transações atômicas com saldo server-side. |
| **Persistência de Arquivos do Usuário** | ✓ | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Gravado no banco em user_storage_files. |
| **Sondas de Saúde (/live e /ready)** | N/A | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Liveness 200, Readiness testa banco (503 se down). |
| **Métricas Prometheus (/metrics)** | N/A | ✓ | ✓ | N/A | ✓ | **REAL** | Baixo | Manter. Formato padronizado 0.0.4. |
| **Cabeçalhos de Segurança (CSP & HSTS)**| ✓ | ✓ | N/A | N/A | ✓ | **REAL** | Baixo | Manter. Helmet configurado com frameguard: deny. |
| **Fila Redis de Longo Prazo (BullMQ)** | N/A | ✗ | N/A | N/A | ✗ | **PARTIAL** | Médio | Execução atual em memória via process batches. |
| **Suíte de Testes de Carga (k6 / autocannon)**| N/A | N/A | N/A | N/A | ✗ | **UNTESTED** | Médio | Requer script formal de carga progressiva. |

---

## 2. Diagnóstico de Riscos e Priorização Operacional

1. **Persistência de Execução de Fila (Fila Externa / Background Workers)**:
   - *Diagnóstico*: Atualmente, workflows com múltiplos nós de IA executam em lotes paralelos (`Promise.all`) em memória através do processo do servidor. Em cargas de alta escala, requisições com timeout serverless (Vercel 15-60s) podem sofrer interrupção se executadas diretamente pela rota HTTP sem um broker de mensagens persistente.
   - *Classificação*: **P1**.
   - *Mitigação*: Implementar suporte nativo a jobs assíncronos desacoplados com fila de execução e polling de status.

2. **Testes de Carga e Estresse de Concorrência**:
   - *Diagnóstico*: O sistema possui 360 testes automatizados unitários e de integração com 100% de aprovação, mas não possuía um script padronizado de teste de carga (simulando 50 a 500 usuários simultâneos).
   - *Classificação*: **P1**.
   - *Mitigação*: Criar script de carga com simulação de concorrência e medição de latência p95/p99.
