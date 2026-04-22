# PayLink MiniPay — Agent Rules

## File naming
- All file names use **kebab-case** (lowercase, words separated by `-`).
  - ✅ `invoice-header.tsx`, `use-invoices.ts`, `build-metadata-uri.ts`
  - ❌ `InvoiceHeader.tsx`, `useInvoices.ts`, `buildMetadataURI.ts`
- Exceptions: auto-generated files (`routeTree.gen.ts`), shadcn/ui components (`src/components/ui/`), and config files at root (`vite.config.ts`, `tsconfig.json`).

## Folder structure
```
src/
├── routes/           # Thin route files — only compose feature components.
│                     # Each file exports Route + a Page component that returns
│                     # <Parent1 /> <Parent2 /> <Parent3 />.
│                     # No business logic, no hooks, no data fetching here.
│
├── features/         # Feature modules, grouped by page/domain.
│   ├── home/         # Components for the Home page.
│   ├── activity/     # Components + hooks for the Activity page.
│   ├── create/       # Create invoice flow.
│   │   ├── forms/    # One file per tab form (push-form, split-form, pull-form, agent-form).
│   │   └── shared/   # Shared UI bits (token-select, due-picker, form-bits, validators, etc.)
│   ├── pay/          # Invoice detail + pay page components.
│   └── requests/     # Incoming/outgoing request components.
│
├── components/       # Shared UI components (not feature-specific).
│   ├── ui/           # shadcn/ui primitives (auto-generated, PascalCase allowed).
│   └── layout/       # App shell (bottom-navbar, mobile-layout).
│
├── hooks/            # Custom React hooks.
│   ├── graphql/      # Hooks that fetch from the Ponder subgraph via react-query.
│   │                 # Pattern: use-<entity>-by-<scope>.ts
│   ├── contract/     # Hooks that read from on-chain contracts via wagmi.
│   └── mutation/     # Hooks that perform write operations (POST to backend API).
│
├── lib/              # Non-React utilities and configs.
│   ├── abis/         # Contract ABI JSON-as-TS files.
│   ├── addresses/    # Chain-specific contract addresses.
│   ├── graphql/      # GraphQL client + query files.
│   │   ├── client.ts          # fetch-based GQL client wrapper.
│   │   ├── types.ts           # Shared GQL response types (SgInvoice, SgInvoiceRequest, etc.)
│   │   ├── invoice.query.ts   # Invoice queries (pure query strings, no fetching).
│   │   └── invoice-request.query.ts
│   ├── api.ts        # Typed REST client for the PayLink backend.
│   ├── backend.ts    # VITE_BACKEND_URL + hasBackend() + raw backendFetch().
│   ├── chains.ts     # Active chain config, explorer URL builders.
│   ├── format.ts     # formatAmount, truncateAddress, statusLabel, etc.
│   └── ...
│
├── providers/        # React context providers (wagmi, tanstack-query, etc.)
├── assets/           # Static assets imported by components.
└── public/           # Unprocessed static files served as-is (logos, favicon, etc.)
```

## GraphQL conventions
- **Queries** live in `lib/graphql/<entity>.query.ts`. Each file exports a function that returns a query string.
- **Types** live in `lib/graphql/types.ts`. Shared across queries and hooks.
- **Hooks** live in `hooks/graphql/use-<entity>-by-<scope>.ts`. Each hook uses `@tanstack/react-query` with a descriptive `queryKey`.
- Never put fetch logic inside a query file — queries are pure strings.

## Component conventions
- Export one main component per file. Small helper sub-components within the same file are fine if they are only used there.
- Use named exports, not default exports (except where required by framework, e.g. ChatDrawer default for lazy loading).
- Props types are defined inline or as a type in the same file — no separate `types.ts` unless shared across multiple files.

## Import ordering
1. React / framework
2. Third-party libraries
3. `@/lib/*` and `@/hooks/*`
4. `@/components/*`
5. Relative imports (`./ ../`)

## Routes
- Route files are kept as thin as possible. All feature logic lives in `features/`.
- Each route file pattern:
  ```tsx
  import { createFileRoute } from '@tanstack/react-router'
  import { FeatureA } from '@/features/...'
  import { FeatureB } from '@/features/...'

  export const Route = createFileRoute('/path')({ component: Page })

  function Page() {
    return (
      <div className="page-wrap ...">
        <FeatureA />
        <FeatureB />
      </div>
    )
  }
  ```

## Styling
- Tailwind v4 utility classes as the primary styling method.
- Custom CSS classes defined in `src/index.css` for design tokens and reusable patterns (`.island-shell`, `.btn-primary`, `.form-card`, etc.)
- shadcn/ui components live in `src/components/ui/` and follow their own conventions.

## Environment variables
- Frontend env vars must be prefixed with `VITE_` (e.g., `VITE_BACKEND_URL`).
- Never commit `.env` — it's in `.gitignore`. Use `.env.example` as a template.
