# 🚀 Guia de Conexão do UNION.AI com o Supabase (Nuvem 24/7)

Este guia ensina como conectar o **UNION.AI** ao **Supabase** em 3 passos simples, eliminando a necessidade de gerenciar servidores Linux ou deixar o computador de casa ligado.

---

## 📌 Vantagens da Conexão com o Supabase

* **Banco 100% na Nuvem 24/7:** O site fica no ar mesmo com o seu computador pessoal desligado.
* **Painel Gráfico Web no Navegador:** Visualize utilizadores, carteiras de créditos, páginas de vendas e pagamentos em tempo real pelo telemóvel ou computador.
* **Zero Manutenção de Servidor:** Backups automáticos diários sem precisar mexer em terminal Linux ou Docker.
* **Compatibilidade Total:** Todas as 21 tabelas e 44 índices do UNION.AI rodam nativamente no PostgreSQL do Supabase.

---

## 📋 Passo a Passo de Configuração

### Passo 1: Criar um Projeto Gratuito no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita (ou faça login com o GitHub).
2. Clique no botão **"New Project"**.
3. Defina um nome para o projeto (ex.: `union-ai-prod`).
4. Crie uma senha forte para o banco de dados (guarde essa senha em um local seguro).
5. Escolha a região mais próxima dos seus clientes (ex.: `São Paulo (sa-east-1)` para América do Sul ou `Frankfurt / London` para Europa/África).
6. Clique em **"Create new project"** e aguarde cerca de 1 a 2 minutos até o painel inicial carregar.

---

### Passo 2: Criar as 21 Tabelas no SQL Editor
1. No menu lateral esquerdo do painel do Supabase, clique no ícone **SQL Editor** (ou pressione a tecla de atalho `S`).
2. Clique em **"New Query"**.
3. Abra o arquivo [`SUPABASE_SCHEMA.sql`](./SUPABASE_SCHEMA.sql) deste projeto, copie todo o seu conteúdo e cole no editor do Supabase.
4. Clique no botão verde **"Run"** (no canto inferior direito) ou use `Ctrl + Enter`.
5. Você verá a mensagem **`Success. No rows returned`**.
6. Clique em **"Table Editor"** no menu lateral: todas as 21 tabelas (`users`, `user_credits`, `credit_transactions`, `workflows`, `processed_payments`, etc.) estarão criadas e prontas para uso!

---

### Passo 3: Configurar as Chaves no arquivo `.env`
1. No menu lateral esquerdo do Supabase, clique no ícone de engrenagem **Project Settings** > **API**.
2. Você encontrará duas informações essenciais:
   * **Project URL:** Exemplo: `https://xyzprojectid.supabase.co`
   * **Project API Keys:**
     * `anon` / `public`: Chave pública.
     * `service_role` / `secret`: Chave administrativa (clique em *Reveal* para copiar).
3. Abra o arquivo `.env` na raiz do seu projeto UNION.AI e preencha as variáveis:

```env
# ==========================================
# CONFIGURAÇÃO SUPABASE CLOUD (POSTGRESQL)
# ==========================================
SUPABASE_URL="https://seu-projeto-id.supabase.co"
SUPABASE_ANON_KEY="sua-chave-anon-aqui"
SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role-secreta-aqui"

# Opcional (String de conexão direta PostgreSQL):
DATABASE_URL="postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJETO_ID].supabase.co:5432/postgres"
```

4. Reinicie o servidor:
```bash
npm run dev:server
```

---

## 🔄 Migrar os Dados Locais para o Supabase (Opcional)

Se você já tiver dados salvos no SQLite local (`data/union.db`) e quiser enviá-los para o Supabase automaticamente, basta rodar o comando:

```bash
npx tsx packages/server/src/db/migrate-to-supabase.ts
```

O script fará a leitura ordenada de todas as tabelas e fará o upload dos dados para o Supabase sem perder relacionamentos ou chaves estrangeiras.

---

## 🩺 Como Testar a Conexão com o Supabase

Você pode verificar a saúde da conexão a qualquer momento acessando a URL de diagnóstico:

* `GET http://localhost:4000/api/health/db`

Retorno esperado com o Supabase conectado:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "provider": "supabase",
    "url": "https://seu-projeto-id.supabase.co"
  }
}
```

---

## 🛡️ Fallback Automático e Segurança

* Se as variáveis do Supabase não forem preenchidas no `.env`, o UNION.AI continua funcionando normalmente com o **SQLite local**.
* Durante os testes automatizados (`npm test`), o sistema roda em memória RAM isolada, garantindo que os seus dados de produção no Supabase nunca sejam poluídos por testes.
