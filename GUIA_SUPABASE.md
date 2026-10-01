# PostgreSQL / Supabase — configuração corrigida

O servidor usa `DATABASE_URL` através de `pg`, com TLS verificado por padrão. `SUPABASE_URL` e API keys não constituem persistência operacional nesta versão.

Siga os passos de operação no README. O único schema canónico é `supabase/schema.sql`; `SUPABASE_SCHEMA.sql` é um apontador de compatibilidade. Aplique com `npm run db:migrate -w packages/server` apenas numa base autorizada, após backup e ensaio em staging. Não foi aplicada qualquer alteração a uma base externa nesta correção.

As tabelas da aplicação têm RLS e acesso revogado a anon/authenticated. Como a autenticação utiliza JWT próprio, as operações passam pela API que verifica o proprietário. A ligação de backend deve usar um papel privado compatível; nunca fornecer esta ligação ao browser. A integração foi ensaiada com PostgreSQL embutido PGlite, não com a sua instância Supabase.

O migrador mantém hash do schema e bloqueio transacional. `CREATE TABLE IF NOT EXISTS` não converte automaticamente tabelas antigas nem resolve divergências. A migração de dados do SQLite ou de um schema anterior exige plano específico, teste de reconciliação e aprovação para a base de destino.
