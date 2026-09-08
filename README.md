# launchapp

Ferramenta interna estilo ClickUp para planejar e executar o cronograma de
**lançamentos de produto digital** (padrão CPL / aquecimento / carrinho /
downsell) em tempo real, com equipe interna e clientes.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript** estrito
- **Tailwind CSS v4** + **shadcn/ui** (base-ui) — tema claro/escuro
- **Supabase** — Postgres + Auth + Realtime + Storage, **RLS em 100% das tabelas**
- **@dnd-kit** (Kanban), **Zod** (validação), **TanStack Query** (estado)
- **Vitest** (unit) + **Playwright** (E2E) · **GitHub Actions** (lint/typecheck/test)

> **Node:** o projeto roda no Node 20.10 do sistema. As ferramentas de teste
> estão fixadas em versões compatíveis (vitest 3 / vite 6 / jsdom 24). Instale
> com `npm ci --legacy-peer-deps` (ver `.npmrc`).

## Setup

```bash
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm ci --legacy-peer-deps
npm run db:apply             # aplica as migrations no Supabase (Management API)
npm run db:types             # regenera os tipos TypeScript do schema
npm run dev
```

## Scripts

| Script            | O quê                                                    |
| ----------------- | -------------------------------------------------------- |
| `npm run dev`     | Servidor de desenvolvimento                              |
| `npm run build`   | Build de produção                                        |
| `npm run lint`    | ESLint                                                   |
| `npm run typecheck` | `next typegen` + `tsc --noEmit`                        |
| `npm run test`    | Testes unitários (Vitest)                                |
| `npm run test:e2e`| Testes E2E (Playwright)                                  |
| `npm run db:apply`| Aplica as migrations SQL no Supabase                     |
| `npm run db:types`| Regenera `src/lib/supabase/database.types.ts`            |

## Motor de datas

`src/lib/date-engine.ts` — função **pura** que, a partir da data de início de
Vendas (sempre uma segunda-feira), calcula as datas de todas as etapas e tarefas.
A etapa **Vendas** é o marco zero (segunda→domingo); as demais são posicionadas
por âncora (`inicio_vendas` / `fim_vendas` / marcos como `data_cpl_1`) + regra
(`D-5`, `D+3`, `no_dia`). Nenhuma data é digitada à mão. Coberto por testes em
`src/lib/date-engine.test.ts`.

## Segurança (não-negociável)

- RLS ativa em **todas** as tabelas desde a primeira migration.
- Cliente é **allow-list** (`visivel_cliente = true`); nunca vê observações
  internas, sprints, custos ou tarefas de outros projetos.
- `service_role` **só** no servidor (`src/lib/supabase/admin.ts`, com `server-only`).
- Todo input validado com **Zod** nas Server Actions.
- Rode os advisors do Supabase antes de cada deploy.

## Modelo de dados

`template → projeto → etapa → tarefa`, com RLS escopado por `project_members`.
Migrations versionadas em `supabase/migrations/`.

## Estrutura

```
src/
  app/
    (auth)/login          # login (e-mail/senha + magic link)
    (app)/                # shell autenticado (sidebar)
      page.tsx            # dashboard
      projetos/[id]       # cronograma do lançamento
    auth/callback         # troca de code por sessão
  components/ui           # shadcn/ui
  components/app          # shell, sidebar, diálogos
  lib/
    supabase/             # clients (browser/server/admin) + tipos
    date-engine.ts        # motor de datas (puro, testado)
    actions/              # Server Actions (Zod)
  proxy.ts                # Next 16: sessão Supabase + proteção de rotas
```
