# Segunda Pele — Melhorias Integradas ao Projeto Original (Next.js App Router)

Este pacote adiciona:
- **Landing** com formulário de cadastro e CTA WhatsApp (app/page.tsx)
- **Login** (app/login/page.tsx)
- **Dashboard Admin** (app/admin/page.tsx)
- **API Routes** com Prisma: criação/listagem de leads, aprovar/reprovar, envio a promotor, eventos
- **Prisma** (schema + client) e **docker-compose** para Postgres/Redis
- **.env.example** com variáveis necessárias

## Como usar
```bash
pnpm i
cp .env.example .env
docker compose up -d
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Acesse: `http://localhost:3000`
