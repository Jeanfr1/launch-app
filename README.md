<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366F1,100:14B8A6&height=210&section=header&text=launchapp&fontSize=68&fontColor=ffffff&fontAlignY=40&desc=Gest%C3%A3o%20de%20lan%C3%A7amentos%20digitais%20em%20tempo%20real&descSize=18&descAlignY=62" width="100%" alt="launchapp" />

<p>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

<p>
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-FFB86A?style=flat-square" alt="status" />
  <img src="https://img.shields.io/badge/RLS-100%25%20das%20tabelas-3FCF8E?style=flat-square" alt="RLS" />
  <img src="https://img.shields.io/badge/testes-24%20passando-149ECA?style=flat-square" alt="testes" />
</p>

</div>

---

## ✨ Overview

<table>
<tr>
<td width="60%" valign="middle">

**launchapp** é uma ferramenta interna estilo **ClickUp** para planejar e
executar o cronograma de **lançamentos de produto digital** (padrão
CPL → aquecimento → carrinho → downsell) — com múltiplas visões, tempo real
para toda a equipe e clientes, e um **motor de datas automático** que calcula
o cronograma inteiro a partir de uma única semana de Vendas.

Construído com **Next.js 16**, **React 19**, **TypeScript** e **Supabase**,
com **RLS em 100% das tabelas** e interface 100% em **português do Brasil**.

</td>
<td width="40%" align="center">

<img src="https://capsule-render.vercel.app/api?type=soft&color=0:6366F1,100:14B8A6&height=150&section=header&text=%F0%9F%9A%80&fontSize=70&fontAlignY=55" width="100%" alt="logo" />

</td>
</tr>
</table>

---

## 🚀 Features

<table>
<tr>
<td width="50%" valign="top">

### 🗓️ Motor de Datas Automático

As datas nunca são digitadas: cada tarefa é calculada a partir de uma
**Data Âncora** + **Regra** (`D-5`, `D+3`, `no_dia`). Mudou a semana de
Vendas? Todo o cronograma recalcula.

</td>
<td width="50%" valign="top">

### 🔒 Segurança RLS por Papel

Row Level Security em **todas** as tabelas. Equipe interna (12 papéis) vê
tudo do seu projeto; **cliente é allow-list** e nunca vê observações
internas, custos ou outros projetos.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🧩 Visões estilo ClickUp

**Kanban**, **Lista/Tabela**, **Timeline/Gantt**, **Calendário**,
**Sprints** e **Dashboard** — todas lendo do mesmo estado, com
drag-and-drop acessível via `@dnd-kit`.

</td>
<td width="50%" valign="top">

### ⚡ Tempo Real

Alterações de tarefas, comentários e aprovações aparecem para todos os
usuários conectados **sem F5**, via Supabase Realtime, com presence por
projeto.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🔁 Template Reutilizável

O cronograma de 10 etapas vira um **template clonável**: informe a nova
semana de Vendas e o projeto inteiro nasce com as datas prontas.

</td>
<td width="50%" valign="top">

### 🌗 Tema, PT-BR e Responsivo

Tema claro/escuro com tokens centralizados, copy 100% em português do
Brasil, layout responsível do celular ao desktop e foco em acessibilidade AA.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<div align="center">

| Categoria | Tecnologias |
| :--- | :--- |
| **Framework** | ![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-19.2-149ECA?logo=react&logoColor=white) |
| **Linguagem** | ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white) |
| **Estilo** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white) ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?logo=shadcnui&logoColor=white) |
| **Backend** | ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white) ![Postgres](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white) |
| **Interação** | ![dnd-kit](https://img.shields.io/badge/dnd--kit-6366F1?logoColor=white) ![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery&logoColor=white) |
| **Validação** | ![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white) |
| **Testes** | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white) ![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white) |
| **CI / Deploy** | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white) ![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white) |

</div>

---

## 📊 Paleta (tema escuro)

<div align="center">

| | Token | Hex | | Token | Hex |
| :-: | :--- | :--- | :-: | :--- | :--- |
| ![](https://placehold.co/20x20/0A0A0A/0A0A0A.png) | **Background** | `#0A0A0A` | ![](https://placehold.co/20x20/FAFAFA/FAFAFA.png) | **Foreground** | `#FAFAFA` |
| ![](https://placehold.co/20x20/171717/171717.png) | **Surface** | `#171717` | ![](https://placehold.co/20x20/262626/262626.png) | **Border** | `#262626` |
| ![](https://placehold.co/20x20/6366F1/6366F1.png) | **Accent Indigo** | `#6366F1` | ![](https://placehold.co/20x20/14B8A6/14B8A6.png) | **Accent Teal** | `#14B8A6` |

</div>

---

## 💻 Installation

```bash
# Clone o repositório
git clone https://github.com/Jeanfr1/launch-app.git

# Entre na pasta
cd launch-app

# Instale as dependências (o .npmrc já fixa legacy-peer-deps)
npm ci --legacy-peer-deps

# Configure o ambiente
cp .env.example .env.local   # preencha com as chaves do seu Supabase

# Aplique o schema + RLS no Supabase e gere os tipos
npm run db:apply
npm run db:types

# Suba o servidor de desenvolvimento
npm run dev
```

---

## 🔧 Usage

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run db:apply` | Aplica as migrations SQL no Supabase |
| `npm run db:types` | Regenera os tipos TypeScript do schema |

---

## 📁 Project Structure

```text
launchapp/
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # login (e-mail/senha + magic link)
│   │   ├── (app)/                # shell autenticado (sidebar)
│   │   │   ├── page.tsx          # dashboard
│   │   │   └── projetos/[id]/    # cronograma do lançamento
│   │   ├── auth/callback/        # troca de code por sessão
│   │   └── layout.tsx            # root layout (pt-BR, providers)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   ├── app/                  # shell, sidebar, diálogos
│   │   └── auth/                 # formulário de login
│   ├── lib/
│   │   ├── supabase/             # clients (browser/server/admin) + tipos
│   │   ├── date-engine.ts        # motor de datas (puro, testado)
│   │   ├── auth.ts               # helpers de sessão
│   │   └── actions/              # Server Actions (Zod)
│   └── proxy.ts                  # Next 16: sessão Supabase + proteção de rotas
├── supabase/migrations/          # schema + RLS + realtime (versionado)
├── scripts/                      # db:apply / db:types
└── .github/workflows/ci.yml      # lint · typecheck · test
```

---

## 🔮 Destaques

<table>
<tr>
<td width="50%" valign="top">

### 🗓️ Motor de datas

A etapa **Vendas** é o marco zero (segunda → domingo). As outras 10 etapas
são posicionadas por âncora + offset:

- Onboarding `-49` · Conteúdo `-46` · Leads `-28`
- Aquecimento `-21` · Evento `-7` · **Vendas** `0`
- Reabertura `+1` · Debriefing `+5` · Downsell `+10`

Função pura em `src/lib/date-engine.ts`, coberta por **24 testes**.

</td>
<td width="50%" valign="top">

### 🔒 Portal do cliente

O cliente entra no mesmo app com visão restrita:

- Vê só tarefas marcadas `visivel_cliente`
- Comenta e aprova quando é o Aprovador
- Nunca vê observações internas, sprints ou custos

Tudo validado no **servidor** (RLS + Server Actions), nunca só escondido
no client.

</td>
</tr>
</table>

---

## 🗺️ Roadmap

| Status | Fase | Descrição |
| :-: | :--- | :--- |
| ✅ | **0 · Setup** | Next 16 + TS + Tailwind + shadcn, CI, Supabase, migrations |
| ✅ | **1 · Auth** | Login e-mail/senha + magic link, proxy, trigger de profiles |
| ✅ | **2 · Modelo + RLS** | Schema completo, RLS em 100% das tabelas, advisors |
| ✅ | **4 · Motor de datas** | Função pura + 24 testes; geração automática de etapas |
| 🚧 | **3 · CRUD + Kanban + Lista** | Tarefas, drag-and-drop, filtros, edição inline |
| ⏳ | **5 · Tempo real** | Realtime em tasks/comentários/aprovações + presence |
| ⏳ | **6 · Sprints + Dashboard** | Backlog, board de sprint, burndown, métricas |
| ⏳ | **7 · Portal do cliente** | Visão restrita por `visivel_cliente` |
| ⏳ | **8 · Import do template** | Seed das 432 tarefas reais via CSV |
| ⏳ | **9 · Polimento + E2E** | Responsividade, PT-BR, testes E2E dos fluxos críticos |
| ⏳ | **10 · Deploy** | Produção na Vercel seguindo o checklist de segurança |

---

## 🌟 Behind the Scenes

Decisões de projeto que moldam o launchapp:

- **Motor de datas como função pura** — testável sem banco/UI; a planilha
  "Mapa da Lógica de Datas" virou código verificável.
- **Segurança primeiro** — RLS ativa desde a primeira migration, cliente
  sempre allow-list, `service_role` só no servidor (`server-only`).
- **Next.js 16** — `middleware` renomeado para `proxy`; `cookies()`/`params`
  assíncronos; docs version-matched lidas antes de codar.
- **Compatibilidade de runtime** — roda no Node 20.10 do sistema; o tooling
  de teste é fixado em versões compatíveis (vitest 3 / vite 6 / jsdom 24).

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:14B8A6,100:6366F1&height=120&section=footer" width="100%" alt="" />

</div>

### Equipe por projeto

O botão **Equipe** na página do projeto permite ao proprietário e aos gestores
adicionar pessoas por e-mail, escolher a função, remover membros e cancelar
acessos pendentes. Todas as funções de equipe podem atualizar tarefas; gestores
podem também administrar a equipe. O proprietário não pode ser removido.

Contas com e-mail confirmado recebem acesso imediatamente. Para pessoas ainda
sem cadastro confirmado, o acesso fica pendente e é ativado no próximo acesso
com o mesmo e-mail confirmado. O app não envia e-mail de convite: use **Copiar
link do projeto** para compartilhar o endereço. O quadro busca atualizações a
cada 30 segundos enquanto visível e ao retornar à janela.

Para ativar em um banco existente, aplique somente a nova migração com uma
credencial `SUPABASE_ACCESS_TOKEN` válida em `.env.local`:

```sh
npm run db:apply -- 20260910120000_project_team.sql
npm run db:types
```

A migração de equipe deve ser aplicada uma única vez. Até sua aplicação, os
projetos existentes continuam acessíveis e o diálogo informa a indisponibilidade.
