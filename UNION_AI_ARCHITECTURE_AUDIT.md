> Documento histórico da versão anterior. Estado atual: README.md e CORRECOES_UNION_AI_2026-10-01.md. As alegações antigas de integração/produção não certificam esta versão.

# UNION.AI — AUDITORIA DE ARQUITETURA DE SISTEMAS (ARCHITECTURE AUDIT)

## 1. Visão Executiva de Arquitetura

O UNION.AI foi concebido para resolver a orquestração visual e autônoma de inteligência artificial voltada a marketing digital, geração de conteúdo e inteligência competitiva. A presente auditoria avalia a robustez, desacoplamento, segurança e escalabilidade dos componentes centrais.

---

## 2. Auditoria da Camada de Dados (Database Layer)

### 2.1 Dual-Engine: SQLite (Dev) vs PostgreSQL/Supabase (Prod)
- **Diagnóstico Anterior**: Risco de execução de SQLite volátil (`/tmp/union.db`) em ambiente serverless/produção.
- **Implementação Forense**:
  - Em [`database.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/db/database.ts), foi estabelecido o guardião inegociável `[DATABASE_FATAL]`: qualquer tentativa de instanciar SQLite em `NODE_ENV=production` ou ambiente Vercel resulta em encerramento imediato do processo.
  - O banco de produção é obrigatoriamente PostgreSQL, provisionado via Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `DATABASE_URL`).
  - No desenvolvimento local, SQLite opera com modo WAL (`PRAGMA journal_mode = WAL;`) e integridade de chaves estrangeiras ativada (`PRAGMA foreign_keys = ON;`).

### 2.2 Sincronização de Schema e Migrações
- Criado o módulo [`migrations.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/db/migrations.ts), que gerencia a criação determinística das 22 tabelas em ambos os motores:
  1. `users`: Identidade e autenticação.
  2. `projects`: Agrupamento de workspaces.
  3. `workflows`: Grafos acíclicos dirigidos (DAGs) serializados.
  4. `workflow_runs`: Histórico de execução, métricas e custos.
  5. `workflow_versions`: Versionamento imutável de grafos.
  6. `user_credits`: Saldos consolidados.
  7. `credit_transactions`: Ledger financeiro com trilha de auditoria.
  8. `audit_logs`: Registro de ações sensíveis.
  9. `webhook_triggers`: Gatilhos autônomos externos.
  10. `webhook_logs`: Histórico de invocações.
  11. `organizations`: Entidades multi-tenant.
  12. `organization_members`: Vínculos RBAC.
  13. `workflow_templates`: Modelos oficiais da plataforma.
  14. `processed_payments`: Idempotência de gateways de pagamento.
  15. `password_resets`: Tokens com expiração para recuperação de senha.
  16. `published_sales_pages`: Páginas de vendas públicas com URLs amigáveis (`/p/:slug`).
  17. `user_storage_files`: Arquivos permanentes de usuários com isolamento e integridade.
  18-22. Tabelas de suporte a sessões, tags, nós personalizados e auditoria estendida.

---

## 3. Auditoria de Armazenamento (Storage Layer)

- **Problema de Arquitetura Serverless**: Sistemas baseados em funções serverless possuem sistemas de arquivos estritamente efêmeros (`/tmp`), reinicializados a cada ciclo de vida da instância. Depender de `fs.writeFile` em `/tmp` causa perda catastrófica de arquivos.
- **Solução Implementada**:
  - A tabela `user_storage_files` armazena o conteúdo textual ou binário codificado em Base64, tamanho em bytes, categoria (`projects`, `ebooks`, `assets`) e carimbo de data/hora no próprio PostgreSQL/Supabase.
  - No desenvolvimento local, o sistema mantém cópia espelho em disco para conveniência, mas a fonte da verdade para recuperação é o banco de dados.
  - Endurecimento contra ataques de *Path Traversal* através de validação estrita (`path.basename(fileName)` e rejeição de sequências `..`).

---

## 4. Auditoria de Execução de Workflows e Concorrência

- **Topologia do Grafo**: Os grafos são definidos através de nós e conexões compatíveis tipadas no `@union/shared`.
- **Motor de Resolução (DAG)**:
  - `WorkflowEngine.validateWorkflow()` inspeciona se há ciclos e dependências circulares.
  - `WorkflowEngine.generateExecutionPlan()` ordena topologicamente os nós em lotes paralelos (`ExecutionBatch[]`).
  - `ExecutionEngine.executePlan()` executa os lotes sequencialmente, processando os nós de cada lote em paralelo via `Promise.all`.
- **Cancelamento e Timeouts**:
  - Suporte a verificação de interrupção entre lotes de execução.
  - A camada de automações valida créditos antes do disparo e deduze tokens após conclusão com precisão contábil.

---

## 5. Auditoria de Pagamentos, Faturamento e Idempotência

- **Eliminação de Dados Sintéticos**:
  - Nenhuma referência bancária é gerada com `Math.random()`.
  - Nenhum código QR falso em SVG é apresentado como autêntico.
  - Provedores desprovidos de chaves de API válidas no arquivo `.env` retornam imediatamente erro HTTP 503 com código estruturado `PROVIDER_NOT_CONFIGURED`.
- **Máquina de Estados de Pagamentos**:
  - Transições formais: `CREATED` $\rightarrow$ `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `PAID` / `FAILED` / `CANCELLED` / `EXPIRED`.
  - Idempotência absoluta garantida por constraint `UNIQUE(provider_payment_id)` e verificação antes de qualquer crédito ao usuário.
  - Assinatura criptográfica obrigatória via HMAC-SHA256 (`stripe-signature` e headers de webhook).

---

## 6. Auditoria de Segurança de Aplicação (AppSec)

1. **SSRF Guard**:
   - Resolução de DNS assíncrona antes de requisições de extração.
   - Bloqueio completo de:
     - Loopback (`127.0.0.0/8`, `::1`);
     - Faixas privadas RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`);
     - Link-Local e Metadados de Nuvem (`169.254.169.254`, `fe80::/10`).
2. **CORS & Cabeçalhos HTTP**:
   - Regex restritiva impedindo que qualquer app de terceiro em `.vercel.app` acesse a API.
   - Helmet CSP ativado com diretiva `frameAncestors: ["'none'"]` e `frameguard: { action: 'deny' }` bloqueando clickjacking.
   - HSTS obrigatório de 1 ano em modo de produção.
3. **Autenticação**:
   - Validação criptográfica de tokens ID do Google via endpoint oficial da Google.
   - Encriptação de senhas com Bcrypt (salt 10).
   - Validação de complexidade do JWT Secret (mínimo 32 caracteres seguros em produção).

---

## 7. Recomendações e Próximos Passos de Engenharia

1. **Fila Persistente Externa (BullMQ + Redis)**:
   - Para workflows com nós de geração de vídeo ou múltiplos capítulos de e-books com duração superior a 60 segundos, desacoplar a execução da requisição HTTP através de uma fila gerenciada.
2. **Script de Testes de Carga Automatizado**:
   - Criação de uma suíte de benchmark com `autocannon` ou `k6` para mensurar throughput e latência p95/p99 sob 100 requisições simultâneas.
