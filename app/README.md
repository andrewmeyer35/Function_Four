# Four Fs — App

## Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Zustand, TanStack Query
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Deployment**: Vercel

## Local Setup

```bash
# 1. Install dependencies
cd frontend && npm install

# 2. Set environment variables
cp .env.example .env.local
# Fill in your Supabase URL + anon key

# 3. Run database migrations
cd ../backend && npx prisma migrate dev

# 4. Start dev server
cd ../frontend && npm run dev
```

Open http://localhost:3000

## Project Layout

```
app/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ui/           # Reusable design system (Button, Card, Avatar...)
│       │   └── features/     # Feature-scoped components
│       │       ├── auth/
│       │       ├── checkin/
│       │       ├── feed/
│       │       └── events/
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Supabase client, utilities
│       ├── store/            # Zustand stores
│       └── types/            # TypeScript types (imported by mobile too)
├── backend/
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Auth, error handling
│   └── prisma/
│       └── schema.prisma
└── shared/                   # Types + utils shared with mobile
```
