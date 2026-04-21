# Technical Architecture

## Guiding Principle
Build for a small household first. Design the data model and API contracts so they scale to multi-household and native mobile without rewrites.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data fetching**: TanStack Query (React Query)
- **Auth**: Supabase Auth (magic link to start)

### Backend
- **API**: Next.js API Routes (extract to Fastify when needed)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Email**: Resend (transactional + reminders)

### Infrastructure
- **Hosting**: Vercel
- **Database + Auth + Storage**: Supabase (free tier)
- **Push (Phase 3)**: Expo Push Notifications

### Mobile — Phase 3
- **Framework**: Expo (React Native)
- **Shared**: Types and lib utilities from this monorepo
- **Navigation**: Expo Router (mirrors Next.js file routing)

## Data Model

```prisma
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String?
  avatarUrl  String?
  createdAt  DateTime @default(now())
  memberships HouseholdMember[]
  checkins   Checkin[]
  reactions  Reaction[]
}

model Household {
  id          String   @id @default(uuid())
  name        String
  inviteCode  String   @unique
  createdAt   DateTime @default(now())
  members     HouseholdMember[]
  checkins    Checkin[]
}

model HouseholdMember {
  userId      String
  householdId String
  role        String   @default("member") // owner | member
  joinedAt    DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  household   Household @relation(fields: [householdId], references: [id])
  @@id([userId, householdId])
}

model Checkin {
  id            String   @id @default(uuid())
  userId        String
  householdId   String
  weekStart     DateTime // normalized to Monday of that week
  financialText String?
  fitnessText   String?
  funText       String?
  flirtText     String?
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  household     Household @relation(fields: [householdId], references: [id])
  reactions     Reaction[]
  @@unique([userId, householdId, weekStart])
}

model Reaction {
  id        String   @id @default(uuid())
  checkinId String
  userId    String
  emoji     String
  createdAt DateTime @default(now())
  checkin   Checkin  @relation(fields: [checkinId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}
```

## Key Decisions
- `weekStart` is a date (not timestamp) — makes weekly grouping trivial
- Supabase real-time for live feed updates without polling
- Invite codes not email invites — faster onboarding
- UUIDs everywhere — safe for eventual mobile offline sync
- Shared `types/` package between web and mobile from day one
- `@@unique([userId, householdId, weekStart])` — one check-in per person per week per household
