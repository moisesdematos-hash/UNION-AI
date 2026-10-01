# UNION AI — versão corrigida 0.2.0, 01/10/2026

Esta versão corrige problemas encontrados na auditoria do ficheiro oficial de 30/09/2026. Consulte `CORRECOES_UNION_AI_2026-10-01.md` para resultados, limitações e estado de cada achado. Os relatórios anteriores representam a versão anterior.

## Desenvolvimento e verificação

Requer Node.js 24 e npm. A compilação de SQLite para testes pode exigir Python, make e compilador C++.

```sh
npm ci
cp .env.example .env
npm run build
npm run typecheck
npm test
```

Execute `npm run dev:server` e `npm run dev:client` em terminais separados. SQLite é exclusivo de desenvolvimento/testes. O modo offline é uma demonstração, gratuita e identificada; não representa IA operacional.

## Operação em produção

1. Configure `NODE_ENV=production`, `JWT_SECRET` aleatório, `DATABASE_URL`, TLS e origens públicas exatas. Credenciais de PostgreSQL ficam exclusivamente no servidor. Use uma ligação com privilégios suficientes para o schema; as funções públicas anon/authenticated não têm acesso às tabelas da aplicação.
2. Antes de executar migrações numa base existente, exporte e verifique uma cópia de segurança. O schema canónico é `supabase/schema.sql`; não existe conversão automática dos dados SQLite antigos. Uma base existente com schema divergente exige migração de dados/colunas específica e validação em staging.
3. Numa base aprovada para instalação: `npm run db:migrate -w packages/server`. O processo HTTP não altera automaticamente o schema.
4. Configure Groq, Google, Resend e gateways apenas para os serviços a disponibilizar. As tarifas de créditos são uma política configurável, não preços oficiais do fornecedor.
5. Execute API: `node packages/server/dist/index.js`. Execute também worker persistente: `node packages/server/dist/scripts/worker.js`. É obrigatório para canvas, ebooks e webhooks em produção. Não colocar o worker num processo serverless efémero.
6. Crie uma conta normal e promova o administrador pela consola privada: `node packages/server/dist/scripts/promote-admin.js EMAIL`. Nunca existe promoção pública por email ou primeiro registo.
7. Verifique `/api/health/live` e `/api/health/ready`. Sem ligação/schema operacional, ready devolve 503; live não certifica serviços externos.

`Dockerfile` inclui build e runtime sem SQLite de produção, mas a imagem não foi executada nesta auditoria. Para worker, use a mesma imagem com o comando compilado acima. A CI proposta executa build, tipos e testes; não foi executada num serviço externo.

## Limitações que impedem certificar produção

MCX/PayPay, agentes autónomos, visão/cinema, loops e outros nós sem handler real estão bloqueados. `RUN_FROM_HERE` e `RETRY` não têm retoma segura de checkpoints no servidor; API rejeita estes modos. A fila persiste trabalho e checkpoints, mas não repete chamadas ao fornecedor automaticamente após morte do worker. Reveja o checkpoint/consumo antes de repetir uma execução falhada. Cancelamento pode aguardar uma chamada já iniciada, limitada a 45 segundos.

Ebooks usam texto real de Groq e contagem de palavras; páginas são blocos editoriais estimados de 400 palavras, não paginação final de PDF. Não existem imagens geradas nesta integração. PDF binário tem leitura real de texto por página; não inclui OCR nem extração avançada de tabelas binárias. Upload persistente nesta versão destina-se a texto/JSON até 2 MB por ficheiro, não Object Storage genérico.

A interface não recupera automaticamente uma execução após reabrir o browser; o trabalho continua no worker e o ID pode ser consultado pela API. Testes de gateways, email, TLS remoto, restauro, worker distribuído e carga real devem ser feitos em staging com credenciais aprovadas. Nada foi publicado ou alterado em serviços externos.

Para carga autenticada de leitura: `LOAD_BASE_URL=URL LOAD_AUTH_TOKEN=TOKEN npm run load`. Não guardar o token no repositório. O script fornece percentis reais por pedido; nenhum resultado local substitui a medição em staging.
