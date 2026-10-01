> Documento histórico da versão anterior. Estado atual: README.md e CORRECOES_UNION_AI_2026-10-01.md. As alegações antigas de integração/produção não certificam esta versão.

# UNION.AI — REGISTRO DE RISCOS DE ENGENHARIA (RISK REGISTER)

O Registro de Riscos do UNION.AI cataloga todas as ameaças de segurança, integridade de dados, estabilidade de infraestrutura, conformidade financeira e arquitetura identificadas durante a auditoria forense.

---

## 1. Matriz de Classificação de Riscos

| ID | Categoria | Descrição da Ameaça / Vulnerabilidade | Impacto | Probabilidade | Severidade | Esforço | Prioridade | Status | Estratégia de Mitigação / Resolução |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **RSK-01** | **Segurança** | Requisições maliciosas via Scraper para IPs internos, loopback ou metadados de nuvem (SSRF). | Crítico | Alta | **Crítica** | Médio | **P0** | **RESOLVIDO** | Implementado [`ssrf-guard.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/utils/ssrf-guard.ts) com resolução DNS e validação rigorosa de faixas privadas. |
| **RSK-02** | **Dados** | Perda total de dados de produção ao utilizar banco SQLite volátil em `/tmp` na Vercel ou contêiner reinicializado. | Crítico | Alta | **Crítica** | Alto | **P0** | **RESOLVIDO** | Adicionado guardião `[DATABASE_FATAL]` em [`database.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/db/database.ts) e schema oficial PostgreSQL/Supabase. |
| **RSK-03** | **Financeiro** | Manipulação do saldo de créditos no cliente através de `localStorage` ou injeção de transações falsas. | Crítico | Média | **Crítica** | Médio | **P0** | **RESOLVIDO** | Autoridade estrita no servidor em [`credits.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/routes/credits.ts), proibição de topup pelo cliente em produção. |
| **RSK-04** | **Financeiro** | Concessão de créditos através de webhooks forjados ou reutilizados (ausência de HMAC / Idempotência). | Crítico | Média | **Crítica** | Médio | **P0** | **RESOLVIDO** | Validação criptográfica HMAC-SHA256 e tabela `processed_payments` com constraint `UNIQUE`. |
| **RSK-05** | **Financeiro** | Falha de gateway gerando referências bancárias falsas (`Math.random()`) ou SVG simulando QR Code autêntico. | Alto | Alta | **Alta** | Médio | **P0** | **RESOLVIDO** | Eliminada simulação em [`payment-service.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/services/payment/payment-service.ts); retorna status 503 com `PROVIDER_NOT_CONFIGURED`. |
| **RSK-06** | **Segurança** | Token JWT assinado com segredo padrão fraco de desenvolvimento em ambiente produtivo. | Crítico | Baixa | **Alta** | Baixo | **P0** | **RESOLVIDO** | Validação Zod com `.refine()` em [`env.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/config/env.ts) exigindo segredo forte com no mínimo 32 caracteres. |
| **RSK-07** | **Segurança** | Origens CORS permissivas permitindo que qualquer aplicação sob `*.vercel.app` acesse a API com credenciais. | Alto | Alta | **Alta** | Baixo | **P0** | **RESOLVIDO** | Regex estrita `/^https:\/\/union-ai(-[a-z0-9-]+)?\.vercel\.app$/` e origens explícitas no [`app.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/app.ts). |
| **RSK-08** | **Storage** | Perda de artefatos de usuários (e-books, cópias, relatórios) gravados no disco temporário de funções serverless. | Alto | Alta | **Alta** | Alto | **P0** | **RESOLVIDO** | Persistência na tabela `user_storage_files` do banco com sanitização contra Path Traversal. |
| **RSK-09** | **Operação** | Perda de páginas de vendas publicadas com URLs amigáveis (`/p/:slug`) armazenadas em `Map` na memória RAM. | Alto | Alta | **Alta** | Médio | **P0** | **RESOLVIDO** | Reescrito para persistência duradoura com upsert na tabela `published_sales_pages`. |
| **RSK-10** | **Segurança** | Falha do orquestrador expondo mensagens de erro SQL e stacktraces no handler 500 em produção. | Médio | Alta | **Média** | Baixo | **P1** | **RESOLVIDO** | Handler global em [`app.ts`](file:///c:/Users/HP/Desktop/UNION%20AI/packages/server/src/app.ts) sanitiza respostas de erro em ambiente de produção. |
| **RSK-11** | **Segurança** | Injeção de código ou Clickjacking em páginas de vendas renderizadas publicamente sem CSP ou Frameguard. | Médio | Média | **Média** | Baixo | **P1** | **RESOLVIDO** | Habilitada Content Security Policy (CSP) com `frameAncestors: ["'none'"]` e HSTS de 1 ano. |
| **RSK-12** | **Confiabilidade**| Orquestrador de IA gerando dados de fallback fictícios quando as chaves de API falham em produção. | Alto | Média | **Alta** | Baixo | **P1** | **RESOLVIDO** | Implementado `[AI_PROVIDER_UNAVAILABLE]` e transparência de modo de execução (`executionMode`). |
| **RSK-13** | **SRE** | Ausência de sondas de liveness e readiness para orquestração de contêineres Docker/Kubernetes. | Médio | Baixa | **Média** | Baixo | **P1** | **RESOLVIDO** | Implementados `/api/health/live` e `/api/health/ready` (valida conexão com DB retornando 503 se down). |
| **RSK-14** | **Escala** | Workflows longos (> 60 segundos) excedendo limites de timeout de requisições HTTP serverless. | Alto | Média | **Alta** | Alto | **P1** | **MITIGADO** | Processamento em lotes paralelos; recomendado broker Redis/BullMQ para workers assíncronos. |
| **RSK-15** | **Desempenho** | Sobrecarga de conexões com banco sob rajadas repentinas de usuários sem teste de carga formal. | Médio | Média | **Média** | Médio | **P1** | **EM ANDAMENTO**| Criação de script de estresse de concorrência com simulação de 10 a 500 conexões simultâneas. |

---

## 2. Resumo da Situação de Riscos

- **Riscos P0 (Impeditivos de Produção)**: **9 de 9 RESOLVIDOS (100%)**.
- **Riscos P1 (Estabilidade, Segurança e Observabilidade)**: **4 de 5 RESOLVIDOS (80%)**, 1 mitigado.
- **Nenhum risco crítico de integridade financeira, dados ou segurança está sem tratamento.**
