# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs client on :5173 and server on :3001 concurrently)
npm run dev

# Client only
npm run dev:client

# Server only
npm run dev:server

# Build frontend for production
npm run build

# Lint
npm run lint

# Database (Prisma)
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Sync schema to DB without migration history
npm run db:migrate    # Create and run migrations
```

No test suite is configured.

## Architecture

Viralzera is a Brazilian content creation and AI analysis platform. It is a full-stack SPA:

- **Frontend** (`src/`): React 18 SPA built with Vite. All routes are declared in `src/pages/index.jsx` and must also be registered in `src/pages.config.js`. The path alias `@/` maps to `./src/`.
- **Backend** (`server/`): Express server on port 3001. Three route groups: `/api/auth`, `/api/entities`, `/api/functions`.
- **Database**: PostgreSQL accessed via Prisma ORM. Schema is at `server/prisma/schema.prisma`. All models use UUID primary keys and snake_case column names.

### API Client Pattern

`src/api/neonClient.js` exports the `neon` object and `callFunction`. All frontend data access goes through:
- `neon.entities.<EntityName>.list/get/create/update/delete/filter()` → hits `/api/entities/<EntityName>/*`
- `callFunction('functionName', data)` → hits `/api/functions/<functionName>`
- `neon.auth.*` → hits `/api/auth/*`

JWT tokens are stored in `localStorage` and attached as `Authorization: Bearer` headers automatically.

### Authentication

`AuthContext` (`src/lib/AuthContext.jsx`) wraps the app and exposes `{ user, isAuthenticated, isLoadingAuth, login, register, logout }` via `useAuth()`. Auth state is initialized by calling `neon.auth.me()` on mount.

### Routing

Routes are defined explicitly in `src/pages/index.jsx` inside a `<Router>`. All authenticated routes are children of the `<Layout>` component. `/login` is the only public route. To add a new page: create the component in `src/pages/`, add its route in `src/pages/index.jsx`, and register it in `src/pages.config.js`.

### Server Functions

AI/LLM operations are implemented as POST handlers in `server/src/routes/functions.js`. Each function reads the user's OpenRouter API key from `UserConfig` in the database and calls `https://openrouter.ai/api/v1/chat/completions`. All function routes require authentication via the `authenticate` middleware.

### UI Components

The project uses shadcn/ui (New York style) with Radix UI primitives and Tailwind CSS. Pre-built components live in `src/components/ui/`. Theme uses CSS variables for dark/light mode support via `next-themes`.

### Key Dependencies for AI Features

- **OpenRouter**: All LLM calls go through OpenRouter. Users supply their own API key via `UserSettings` → stored in `UserConfig.openrouter_api_key`.
- **Recharts**: Analytics/usage charts.
- **React Hook Form + Zod**: Form validation throughout.
- **TanStack React Query**: Server state and caching.
- **Framer Motion**: Animations.
