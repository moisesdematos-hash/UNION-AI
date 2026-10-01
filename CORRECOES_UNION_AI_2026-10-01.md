# UNION AI — correções e validação, 01/10/2026

## Resultado e âmbito

Foi produzida uma versão corrigida 0.2.0 a partir do ficheiro oficial `UNION_AI_projeto_completo(1).zip`, disponibilizado em 30/09/2026. SHA-256 da base: `cfea537828d410b9a7139693c172c2d3eca946126864e33a748bdcff89664bd5`.

As correções foram efetuadas numa cópia local. Não foram alteradas bases externas, contas, credenciais, serviços ou publicações. O pacote contém código, configurações de exemplo, instruções e evidência de validação. Não substitui automaticamente o projeto em utilização.

A versão elimina várias falhas críticas e torna explícitas as integrações incompletas. Ainda não pode ser certificada como pronta para produção: exige configuração e ensaio dos serviços reais, worker persistente e plano de migração dos dados existentes. Funcionalidades sem integração foram bloqueadas em vez de apresentarem sucesso fictício.

## Estado dos achados da auditoria

“Corrigido no código” refere-se ao comportamento local verificado; não certifica a infraestrutura externa. “Parcial” identifica requisitos que continuam abertos.

| ID / prioridade original | Estado | Alteração e limite relevante |
|---|---|---|
| A01 / P0 — arranque/persistência | Corrigido no código | Adaptador assíncrono PostgreSQL via `pg`, pool, transações e bloqueios; serviços/repositórios usam o adaptador operacional. SQLite carregado apenas em desenvolvimento/testes. Processo de produção arranca sem DB e informa 503 em readiness. Não houve migração de dados existentes. |
| A02 / P0 — IA anónima e quotas | Corrigido no código | Execução exige autenticação. Saldo reservado antes da chamada, ajustado ao usage real e devolvido em falha/uso inferior. Quotas e isolamento testados. Proteção contra abuso massivo de registos requer política operacional adicional. |
| A03 / P0 — execução simulada | Parcial, risco mitigado | Canvas autenticado executa por fila no servidor e handlers reais. IA, marketing e fontes suportadas usam integrações efetivas; nós sem handler devolvem erro. Modo offline é demonstrativo e sem consumo de créditos. Agentes/visão/cinema/loops continuam incompletos. |
| A04 / P0 — MCX/PayPay fictícios | Parcial, bloqueado | Removidas referências, QR e confirmações fictícias; gateways não integrados devolvem indisponibilidade. Stripe valida assinatura e estado pago; PIX consulta o pagamento no fornecedor e confere proprietário, pacote, moeda e montante. Homologação real de gateways continua pendente. |
| A05 / P0 — promoção pública a ADMIN | Corrigido no código | Todos os registos públicos recebem USER; promoção exclusivamente pela consola privada. Testes do primeiro registo e `admin@union.ai`. |
| A06 / P0 — injeção em checkout | Corrigido no código | URL HTTPS validada, atributos escapados, protocolos executáveis rejeitados; CSP sem scripts inline/eval inseguros. Testes com aspas e `javascript:`. Estilos inline e CDN Tailwind continuam permitidos. |
| A07 / P1 — readiness enganadora | Corrigido no código | Verifica adaptador ativo e tabelas obrigatórias; responde 503 em falha. `/live` apenas indica processo vivo. Compatibilidade de schemas existentes precisa de staging. |
| A08 / P1 — falso sucesso de storage | Parcial | Conteúdo textual/JSON persistido no DB operacional com confirmação de escrita e isolamento; erros propagados. Limite de 2 MB. Não equivale a Object Storage binário com URLs assinadas. |
| A09 / P1 — modelo/tokens fictícios | Corrigido no código | Apenas Groq operacional. Modelo e tokens obtidos da resposta real do fornecedor; modelos sem adaptador rejeitados. Tarifas de créditos internas configuráveis, não preços oficiais. Catálogo de recomendação não prova integração. |
| A10 / P1 — custo/histórico do cliente | Parcial | API rejeita histórico/custo postado pelo cliente. Worker gera runs e debita usage servidor; transações evitam saldos negativos. Não existe reconciliação durável completa de reservas/chamadas após crash. |
| A11 / P1 — jobs efémeros | Parcial | Fila PostgreSQL, worker separado, claim com SKIP LOCKED, heartbeat, checkpoints, timeout e cancelamento. Lease expirado falha sem repetir chamadas automaticamente. Retoma parcial/RETRY bloqueada; recuperação automática da interface após reabrir browser permanece pendente. |
| A12 / P1 — schema/RLS | Corrigido no schema fornecido | Schema canónico único com RLS e acesso revogado a anon/authenticated nas tabelas UNION. API com JWT próprio verifica proprietário. Ligação privada de backend necessita privilégios adequados. SQL com papel anon e dois utilizadores testados em PostgreSQL embutido. |
| A13 / P1 — SSRF/redirect/DNS | Corrigido no código | Validação de cada redirect, DNS validado e ligação ao IP fixado, IPv6 mapeado e ranges reservados bloqueados, timeout/limite de resposta. Regressão com redirect a rede privada. |
| A14 / P1 — Google audience | Corrigido no código | Valida audience configurado, issuer, expiração finita, subject e email_verified estrito. Rejeição de tokens inválidos e aceitação de fixture válida testadas. |
| A15 / P1 — recuperação/email | Parcial | Tokens de reset armazenados com hash, utilização única e sem logs do link. Falhas de envio explícitas em produção, timeout e resultado sem falsa entrega. Fila de email/retries e entrega real precisam de integração operacional. |
| A16 / P1 — PDF falso | Parcial | PDF.js lê PDF binário comprimido, texto e contagem real por página; limites de tamanho/páginas. Fixture PDF real testada. OCR e tabelas complexas de PDFs binários não implementados. |
| A17 / P1 — stack pública | Corrigido no código | Catch de arranque devolve resposta genérica sem stack. Logs técnicos permanecem no servidor. |
| A18 / P1 — validação enganadora | Parcial | PostgreSQL embutido PGlite, isolamento, rollback, schema e jobs testados. Script mede percentis individuais em pedidos autenticados. Carga e concorrência distribuída na infraestrutura real não certificadas. |
| A19 / P2 — bundle | Parcial | Chunks separados para React, canvas e ícones. Chunk principal passou de 1.132,65 kB para cerca de 693 kB. Bundle total continua elevado; alerta de chunk acima de 500 kB mantém-se. |

## Alterações adicionais

- Marketing e Oracle em produção usam Groq com cobrança centralizada; erros não são substituídos por respostas fictícias. Auditoria visual sem chamada de visão foi removida. Forge de imagem/produto/avatar permanece bloqueada em modo real.
- Ebook real é gerado por capítulos, verifica mínimo de palavras, contabiliza tokens reais e não inventa imagens. Há um único pedido limitado de expansão quando o capítulo é curto; se continuar insuficiente, falha. Conteúdo editorial continua a requerer revisão humana. As páginas são blocos estimados de 400 palavras, não paginação final de publicação.
- Workflows importados remapeiam IDs para evitar colisões entre utilizadores. Erros de autosave não mostram “guardado”. Autorização incluída nas chamadas de Oracle/Forge/simulador.
- Pagamentos confirmados e ajustes de créditos usam bloqueios/transações. Confirmação manual usa comprovativo estável para impedir duplicação. Métricas financeiras consideram apenas pagamentos PAID e tratam Stripe/PIX como BRL nesta integração.
- Fila limita 50 nós e três jobs pendentes por utilizador. Consultas de jobs têm quota própria para não esgotar o limite geral da API durante execuções longas.
- Schema duplicado foi substituído por apontador de compatibilidade. Relatórios antigos receberam indicação de documento histórico. README, guia de PostgreSQL, guia de publicação e `.env.example` foram atualizados.
- Dockerfile, CI e script de carga foram preparados. Docker/CI externos não foram executados. O shutdown da API fecha o pool de DB.

## Validação

Os logs e resultados detalhados ficam na pasta `validation/` do pacote. Não contêm credenciais reais nem resultados de chamadas comerciais.

| Verificação | Resultado e alcance |
|---|---|
| Build | Aprovado para shared, servidor e cliente. Mantém alerta de bundle > 500 kB e import estático/dinâmico de shared. |
| Typecheck | Aprovado nos três workspaces. |
| Testes automatizados | 375 aprovados: 147 cliente, 157 servidor, 71 shared; 71 ficheiros de teste. |
| PostgreSQL | Schema canónico, roles/RLS, auth, storage, isolamento, reservas concorrentes, rollback, jobs concluídos/falhados/cancelados. PGlite usa um adaptador de ligação serializado; não demonstra múltiplas sessões remotas ou workers distribuídos. |
| Arranque compilado de produção | Processo real Node com NODE_ENV=production e sem DATABASE_URL: live 200 e ready 503, sem fallback SQLite. Não prova ligação TLS a Supabase. |
| Carga local autenticada | 100 leituras de projetos, concorrência 10, zero erros; percentis por pedido em `validation/runtime.json`. Usa SQLite de desenvolvimento e não caracteriza produção. |
| Fornecedores externos | Contratos de transporte, falhas, usage e assinaturas ensaiados com fixtures/mocks. Sem compra, envio de email, pedido Groq real ou login Google real. |
| PDF | Fixture binária comprimida efetivamente interpretada. |
| Dependências | Express/qs atualizados dentro das versões compatíveis. `npm audit --omit=dev`: zero advisories reportados (0 críticos/altos/moderados/baixos). Resultado em `validation/dependencies.json`; isto não prova ausência de vulnerabilidades. |

As expectativas dos testes antigos foram ajustadas quando dependiam de promoção pública a ADMIN, cobrança de demonstração, pagamentos sem integração ou métricas inventadas. Foram adicionadas regressões independentes para as novas proteções. O pacote contém inventário de ficheiros alterados e hashes para revisão.

## Próximos passos priorizados

1. **P0 operacional:** preparar staging com DATABASE_URL/TLS, worker contínuo, credenciais reais e origens corretas. Ensaiar migração numa cópia da base atual e comparar utilizadores, saldos, ficheiros e histórico. Fazer backup/restauro verificável antes de qualquer alteração externa.
2. **P1 financeiro:** implementar reservas duráveis por execução/chamada, reconciliação de interrupções, idempotência do fornecedor e revisão de jobs com lease expirado. Homologar Stripe/PIX e integrar MCX/PayPay contratados antes de disponibilização comercial.
3. **P1 produto:** implementar agentes, visão, cinema, loops e retoma parcial real; identificar esses nós como indisponíveis também na interface. Recuperar jobs pela interface após reabrir sessão. Completar Object Storage/OCR conforme os requisitos originais.
4. **P1 infraestrutura:** ensaiar múltiplas ligações PostgreSQL, workers concorrentes, falha/reinício de processos, latência externa e carga autenticada representativa. Rever rate limiting distribuído, política de novos registos e observabilidade/retenção de filas e conteúdos.
5. **P2:** separar funcionalidades pesadas por carregamento dinâmico e medir a experiência em redes móveis. Completar paginação/publicação editorial e revisão dos conteúdos gerados.

## Utilização do pacote

Leia `README.md`. Requer Node 24; execute `npm ci`, build, tipos e testes. Configure `.env` com os serviços a usar. Aplique o schema apenas num destino aprovado; dados SQLite antigos não são migrados automaticamente. Execute API e worker separadamente. Nunca disponibilize credenciais privadas no cliente.

Esta entrega constitui código corrigido e verificável. Qualquer migração, ativação de fornecedor ou publicação externa continua sujeita à aprovação do utilizador.
