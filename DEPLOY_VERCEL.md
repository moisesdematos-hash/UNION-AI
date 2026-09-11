# Guia de Deploy de Produção: UNION.AI na Vercel & Nuvem

Este guia explica exatamente como colocar o **UNION.AI 2.0** no ar na **Vercel** com alta performance e sem erros de infraestrutura.

---

## 🏗️ 1. Entendendo a Arquitetura do Monorepo

O UNION.AI é composto por:
1. **Frontend (`@union/client`)**: Aplicação SPA React (Vite + React Flow + Tailwind CSS + Lucide Icons).
2. **Pacote Compartilhado (`@union/shared`)**: Schemas Zod, tipos do Data Bus, personas do Simulador e catálogo de modelos.
3. **Backend Core (`@union/server`)**: API Express com banco de dados **SQLite WAL**, telemetria Prometheus em `/metrics` e rotas de marketing/IA.

---

## ⚡ 2. Como a Vercel Funciona para Monorepos Fullstack

> [!IMPORTANT]
> **Vercel é uma plataforma Serverless / Edge.**  
> O frontend Vite compila para arquivos estáticos (`dist/`) e roda com **velocidade global na CDN da Vercel**.  
> Já o backend utiliza **SQLite em arquivo (`better-sqlite3`) com gravação contínua (WAL)**. Como as funções Serverless da Vercel são *stateless* (destruídas após cada requisição), o banco SQLite local seria resetado a cada nova invocação se rodasse dentro de uma Serverless Function.

### A Arquitetura Recomendada de Produção:
- **Frontend**: Hospedado na **Vercel** (URL pública rápida: `https://seu-projeto.vercel.app`).
- **Backend API & Banco SQLite**: Hospedado no **Railway**, **Render**, **Fly.io** ou **VPS DigitalOcean** (onde containers com volume persistente custam R$ 0 ou poucos dólares/mês).
- **Roteamento Automático (`vercel.json`)**: A Vercel encaminha automaticamente qualquer chamada para `/api/*` diretamente para o seu backend seguro.

---

## 🚀 3. Passo a Passo do Deploy na Vercel

Já deixamos o arquivo [`vercel.json`](file:///c:/Users/HP/Desktop/UNION%20AI/vercel.json) configurado na raiz do projeto:

```json
{
  "version": 2,
  "buildCommand": "npm run build --workspace=@union/shared && npm run build --workspace=@union/client",
  "outputDirectory": "packages/client/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api-union.seu-dominio.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Passo 1: Subir o Código para o GitHub
Se ainda não enviou seu repositório para o GitHub, rode no seu terminal:
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### Passo 2: Importar na Vercel
1. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**.
2. Selecione o repositório do **UNION.AI** no GitHub.
3. Nas configurações do projeto (**Project Settings**):
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (deixe a raiz)
   - **Build Command**: `npm run build --workspace=@union/shared && npm run build --workspace=@union/client`
   - **Output Directory**: `packages/client/dist`
   - **Install Command**: `npm install`
4. Clique em **Deploy**.

---

## 🐳 4. Onde Hospedar a API Express com SQLite (1-Clique Grátis)

Já criamos o [`Dockerfile`](file:///c:/Users/HP/Desktop/UNION%20AI/Dockerfile) multi-estágio de produção na raiz do projeto.

### Opção 1: Railway (Mais simples e recomendado)
1. Crie uma conta no [railway.app](https://railway.app).
2. Clique em **"New Project" -> "Deploy from GitHub repo"**.
3. Adicione um **Persistent Volume** mapeado para `/app/data` (garante que seu banco `union.db` nunca seja apagado).
4. O Railway gerará uma URL pública (ex: `https://union-production.up.railway.app`).
5. Atualize a URL de destino no seu `vercel.json`:
   ```json
   "destination": "https://union-production.up.railway.app/api/$1"
   ```

### Opção 2: Render.com
1. No [render.com](https://render.com), selecione **"Web Service" -> Docker**.
2. Conecte o repositório e adicione um disco persistente para `/app/data`.

---

## 🔑 5. Variáveis de Ambiente em Produção

No painel do Railway/Render onde o backend roda, adicione as variáveis de ambiente:
```env
NODE_ENV=production
PORT=4000
JWT_SECRET=sua-chave-super-secreta-de-producao
CORS_ORIGIN=https://seu-projeto.vercel.app
DB_PATH=/app/data/union.db
```

E quando for ativar as APIs reais de IA:
```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
DEEPSEEK_API_KEY=sk-...
GROQ_API_KEY=gsk_...
```
