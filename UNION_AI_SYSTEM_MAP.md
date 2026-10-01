> Documento histórico da versão anterior. Estado atual: README.md e CORRECOES_UNION_AI_2026-10-01.md. As alegações antigas de integração/produção não certificam esta versão.

# UNION.AI — MAPA REAL DO SISTEMA (SYSTEM MAP)

## 1. Visão Geral Topológica da Arquitetura

O UNION.AI é uma plataforma de orquestração visual e automação inteligente concebida em arquitetura monorepo monolítico desacoplado, dividido em três pacotes essenciais:
- `@union/shared`: Contratos tipados, esquemas Zod, barramento de dados (`DataBus`), motor de resolução de DAGs (`WorkflowEngine`) e execução (`ExecutionEngine`).
- `@union/server`: Backend RESTful em Node.js/Express, responsável pela autorização RBAC, ledger financeiro de créditos, gateways de pagamentos, extração segura (SSRF guard), interface com provedores de IA e persistência de dados.
- `@union/client`: Single-Page Application (SPA) em React 18, React Flow (`@xyflow/react`), Zustand e Tailwind CSS, oferecendo tela interativa com nós inteligentes, simuladores de conversão e painéis operacionais.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (SPA)                           │
│  React 18 + React Flow + Zustand + Tailwind CSS (Porta 5173 / Vercel) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER (API)                            │
│           Node.js 20 ESM + Express 4.19 + Helmet + RateLimit          │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
       ┌────────────┴─────────────┐    ┌────────────┴─────────────┐
       ▼                          ▼    ▼                          ▼
┌──────────────┐          ┌──────────────┐   ┌──────────────┐  ┌──────────────┐
│  AUTH & RBAC │          │WORKFLOW ENGIN│   │CREDITS & PAY │  │  EXTRACTORS  │
│  JWT + Bcrypt│          │DAG Batch Run │   │Atomic Ledger │  │  SSRF Guard  │
└──────┬───────┘          └──────┬───────┘   └──────┬───────┘  └──────┬───────┘
       │                         │                  │                 │
       └─────────────────────────┼──────────────────┴─────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CAMADA DE DADOS E PERSISTÊNCIA                     │
│  Desenvolvimento / Teste: SQLite WAL (data/union.db)                   │
│  Produção: PostgreSQL / Supabase (@supabase/supabase-js)               │
│  22 Tabelas Sincronizadas: users, projects, workflows, credits, etc.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fluxo Ponta a Ponta de Execução e Serviços

### 2.1 Fluxo de Execução de Workflow (DAG Orchestration)
```text
Client Canvas (Zustand UI)
    │
    ▼ [Validação no Cliente via @union/shared]
POST /api/workflows/:id/execute
    │
    ▼ [Middleware: requireAuth + RateLimiter]
WorkflowEngine (Topological Sort & Dependency Resolution)
    │
    ▼ [Check de Quota Server-Side: creditsService.checkQuota]
ExecutionEngine (Parallel Batch Processing)
    ├── Node 1: Web Scraper (WebsiteScraper.scrape via SSRF Guard)
    ├── Node 2: Document / PDF Parser
    ├── Node 3: AI Engine (Groq / OpenAI API via AiEngine)
    └── Node 4: Data Transformer (DataBus Contract Mapping)
    │
    ▼ [Dedução de Créditos no Banco de Dados em Transação Atômica]
Audit & Runs Persistence (tabelas: workflow_runs, workflow_versions)
    │
    ▼
JSON Response { status: 'COMPLETED', runId, tokens, costCredits }
```

### 2.2 Fluxo de Autenticação e Autorização (RBAC & Multi-Tenancy)
```text
POST /api/auth/login  OU  POST /api/auth/google
    │
    ├── Local: bcrypt.compare(password, password_hash)
    └── Google: fetch(oauth2.googleapis.com/tokeninfo) [Validação Criptográfica]
    │
    ▼
JWT Generation (HMAC-SHA256, expiração 7 dias)
    │
    ▼ [Middleware: requireAuth injeta req.user]
Controle de Papéis:
    ├── ADMIN: Acesso a métricas Prometheus (/metrics), gestão de quotas e usuários.
    └── USER: Isolamento por tenant (user_id / organization_id).
```

### 2.3 Fluxo de Pagamentos e Ledger de Créditos
```text
POST /api/payments/checkout { packageId, provider }
    │
    ├── Se provider sem credenciais válidas no .env:
    │   └── Retorna HTTP 503 com código "PROVIDER_NOT_CONFIGURED" (Simulação Zero)
    ├── Se configurado:
    │   ├── Stripe: Cria sessão na Stripe API e registra status 'PENDING'
    │   ├── Mercado Pago (PIX): Gera Copia-e-Cola e QR Code autêntico
    │   └── Multicaixa Express / PayPay: Dispara push / link bancário oficial
    │
POST /api/payments/webhook/:provider
    │
    ├── Verificação de Assinatura Criptográfica (HMAC-SHA256 / stripe-signature)
    ├── Verificação de Idempotência na tabela processed_payments (provider_payment_id)
    └── Transação Atômica no Banco:
        ├── UPDATE processed_payments SET status = 'PAID'
        └── INSERT INTO credit_transactions (+amount) & UPDATE user_credits
```

### 2.4 Fluxo de Armazenamento e Páginas de Vendas (Zero Ephemeral State)
```text
Upload / Salvar Artefato (E-books, JSON de Workflow, Imagens)
    │
    ▼
POST /api/projects/storage/save
    │
    ├── Sanitização estrita contra Path Traversal (path.basename)
    ├── Gravação no Banco de Dados: tabela user_storage_files (content_text/base64)
    └── Espelho em disco local para ambiente de desenvolvimento
    │
Publicação de Página de Vendas:
POST /api/marketing/publish/:projectId
    │
    ▼
Persistência na tabela published_sales_pages (com ON CONFLICT DO UPDATE)
    │
    ▼
GET /p/:slug  ──►  Busca no Banco de Dados (sem cache volátil em memória)
```

---

## 3. Inventário Detalhado dos Componentes do Sistema

| Camada | Arquivos Chave | Função Primária | Dependências Externas |
| :--- | :--- | :--- | :--- |
| **Server App** | `packages/server/src/app.ts` | Configuração do Express, Helmet CSP, CORS restrito, RateLimiter, Error Handling. | Express, Helmet, CORS |
| **Server Env** | `packages/server/src/config/env.ts` | Validação estrita de variáveis de ambiente com Zod e fail-fast em produção. | Zod, dotenv |
| **Database** | `packages/server/src/db/database.ts` | Inicialização SQLite com WAL em dev e bloqueio fatal em produção. | better-sqlite3 |
| **Supabase** | `packages/server/src/db/supabase-client.ts` | Cliente oficial Supabase PostgreSQL para ambiente de produção. | @supabase/supabase-js |
| **Migrations** | `packages/server/src/db/migrations.ts` | Motor de migrações e sincronização de 22 tabelas de produção. | SQLite / Postgres |
| **Auth Service** | `packages/server/src/services/auth.ts` | Cadastro, login, Google tokeninfo e gestão de tokens JWT. | jsonwebtoken, bcryptjs |
| **Credits Service** | `packages/server/src/services/credits-service.ts` | Ledger transacional de créditos e quotas por usuário. | DB / SQLite / Postgres |
| **Payments** | `packages/server/src/services/payment/payment-service.ts` | Orquestração Stripe, PIX, Multicaixa, PayPay com idempotência estrita. | crypto, fetch |
| **AI Engine** | `packages/server/src/services/ai/ai-engine.ts` | Integração Groq/OpenAI, cálculo de tokens e custos, transparência de execução. | fetch |
| **SSRF Guard** | `packages/server/src/utils/ssrf-guard.ts` | Bloqueio de DNS para IPs privados (RFC 1918), loopback e AWS/GCP metadata. | node:dns/promises |
| **Web Scraper** | `packages/server/src/services/extractors/website-scraper.ts` | Extração de páginas web com fail-fast [EXTRACTION_FAILED] e sanitização HTML. | SSRF Guard |
| **YouTube Extractor**| `packages/server/src/services/extractors/youtube-extractor.ts` | Extração de transcrições e metadados de vídeos do YouTube. | fetch |
| **Storage Service** | `packages/server/src/services/user-storage-service.ts` | Persistência permanente em `user_storage_files` com isolamento de usuário. | DB |
| **Client Canvas** | `packages/client/src/components/canvas/UnionCanvas.tsx` | Tela visual de nós, conexões, zoom e renderização de DAGs. | @xyflow/react |
| **Client Store** | `packages/client/src/store/canvasStore.ts` | Gerenciamento de estado global com Zustand e autoridade server-side. | Zustand |
