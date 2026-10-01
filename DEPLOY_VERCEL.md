# Publicação — requisitos e limites atuais

Nenhum sistema externo foi publicado nesta correção. Consulte README e o relatório atual antes de publicar.

A API pode executar num ambiente serverless com PostgreSQL configurado por `DATABASE_URL`; SQLite é proibido em produção. Schema e migrações devem ser aplicados por um operador, com backup e aprovação. O frontend compila para `dist/`.

Canvas, ebooks e webhooks usam fila persistente. É necessário um worker contínuo numa infraestrutura separada, por exemplo o comando `node packages/server/dist/scripts/worker.js` num contentor Node 24. Funções Vercel efémeras não substituem este worker. Sem worker os jobs ficam enfileirados e a interface termina por timeout.

Antes de publicação: validar credenciais, origens CORS, HTTPS, TLS PostgreSQL, Google audience, envio Resend, Stripe/PIX em sandbox, backup/restauro, isolamento e carga em staging. As integrações e nós bloqueados não devem ser anunciados como operacionais.
