# DesignVault

An npm package that exports React components for an AI-powered floor plan archive. Builders install it on their websites so visitors can browse plans, swap architectural styles with AI, edit floor plans, and save their custom designs — capturing leads in the process. Ships as ESM + CJS with a standalone CSS file and a separate Express API service.

## Quick Start

```bash
npm install github:Empowerbuilding/designvault
```

```tsx
import { DesignVault } from "designvault";
import "designvault/styles.css";

function App() {
  return (
    <DesignVault
      config={{
        builderSlug: "barnhaus",
        brandColor: "#B8860B",
        apiBaseUrl: "https://api.designvault.io",
        ctaText: "Save My Design",
        enableStyleSwap: true,
        enableFloorPlanEdit: true,
      }}
    />
  );
}
```

## Config Options

| Option | Type | Default | Description |
|---|---|---|---|
| `builderSlug` | `string` | **required** | Unique builder identifier (e.g. `"barnhaus"`) |
| `brandColor` | `string` | **required** | Primary brand hex color (e.g. `"#B8860B"`) |
| `apiBaseUrl` | `string` | **required** | URL of the DesignVault API service |
| `brandColorLight` | `string` | auto | Lighter variant — auto-computed if omitted |
| `ctaText` | `string` | `"Save My Design"` | Lead capture button text |
| `metaPixelId` | `string` | — | Meta/Facebook pixel ID for conversion tracking |
| `trackingEndpoint` | `string` | — | Server-side event tracking URL |
| `maxFreeInteractions` | `number` | `1` | Free AI interactions before lead capture required |
| `enableStyleSwap` | `boolean` | `true` | Show AI style swap buttons |
| `enableFloorPlanEdit` | `boolean` | `true` | Show AI floor plan editor |
| `enableFavorites` | `boolean` | `true` | Allow favoriting plans |
| `enableSimilarPlans` | `boolean` | `true` | Show similar plans on detail view |
| `crmWebhookUrl` | `string` | — | Direct CRM webhook (overrides builder config) |
| `attribution.show` | `boolean` | `false` | Show "Designed by" footer |
| `attribution.text` | `string` | — | Attribution display text |
| `attribution.url` | `string` | — | Attribution link URL |

## Exported Components

| Component | Description |
|---|---|
| `DesignVault` | Main wrapper — renders the full experience |
| `ArchiveGrid` | Filterable plan grid with category tiles |
| `PlanCard` | Individual plan card with image, specs, tags |
| `PlanDetail` | Full-screen overlay with AI tools sidebar |
| `AIToolsPanel` | Style swap + floor plan editor + save |
| `StyleSwapButtons` | 2x3 grid of architectural style presets |
| `FloorPlanEditor` | AI prompt editor for floor plan modifications |
| `LeadCaptureModal` | Animated lead capture form with validation |
| `SimilarPlans` | Weighted similarity recommendations |
| `CategoryTiles` | Category browsing tiles |
| `FilterBar` | Beds/baths/sqft/style filter selects |
| `FeaturedRow` | Horizontal scrollable featured plans |
| `FavoriteButton` | Heart toggle button |

## Exported Hooks

| Hook | Description |
|---|---|
| `useDesignVaultContext()` | Access shared context (config, API, session state) |
| `usePlans()` | Plans data, filtering, loading state |
| `useAIInteractions()` | AI operations with rate limiting |
| `useSession()` | Session tracking and plan view history |
| `useLeadCapture()` | Lead form submission state |
| `useFavorites()` | localStorage-backed favorites |

## API Service Setup

The API service is in `api-service/`. See [api-service/README.md](./api-service/README.md) for full docs.

```bash
cd api-service
cp .env.example .env    # fill in Supabase credentials
npm install
npm run dev             # starts on localhost:3001
```

## Database Migrations

Run the SQL migrations against your Supabase project in order:

```bash
# Via Supabase dashboard: SQL Editor → paste each file
# Or via psql:
psql $DATABASE_URL -f api-service/supabase/migrations/001_extend_website_floor_plans.sql
psql $DATABASE_URL -f api-service/supabase/migrations/002_create_design_sessions.sql
psql $DATABASE_URL -f api-service/supabase/migrations/003_create_design_cache.sql
psql $DATABASE_URL -f api-service/supabase/migrations/004_create_design_analytics_view.sql
```

| Migration | What it does |
|---|---|
| `001` | Adds style/category/tags/click_count/etc to `website_floor_plans` |
| `002` | Creates `design_sessions` table with RLS |
| `003` | Creates `design_cache` table for AI result caching |
| `004` | Creates `design_analytics` and `popular_plans` views |

## Builder Onboarding Checklist

- [ ] Add builder to `api-service/src/config/builders.ts`
- [ ] Run all 4 SQL migrations on the Supabase project
- [ ] Populate `website_floor_plans` with the builder's plans
- [ ] Set `ALLOWED_ORIGINS` in the API service to include the builder's domain
- [ ] Configure CRM webhook URL in builder config (or set to `null`)
- [ ] Set Meta Pixel ID in the frontend config if the builder uses Facebook ads
- [ ] Install the package on the builder's site:
  ```bash
  npm install github:Empowerbuilding/designvault
  ```
- [ ] Add `<DesignVault config={...} />` and `import "designvault/styles.css"`
- [ ] Test end-to-end: browse plans, AI swap, lead capture, CRM webhook delivery
- [ ] Deploy API service on Coolify

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Builder Website (Next.js / Vite)                       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <DesignVault config={...} />                     │  │
│  │                                                   │  │
│  │  DesignVaultProvider (context)                     │  │
│  │    ├── ArchiveGrid                                │  │
│  │    │     ├── CategoryTiles                        │  │
│  │    │     ├── FilterBar                            │  │
│  │    │     ├── FeaturedRow                          │  │
│  │    │     └── PlanCard[]                           │  │
│  │    └── PlanDetail (overlay)                       │  │
│  │          ├── AIToolsPanel                         │  │
│  │          │     ├── StyleSwapButtons               │  │
│  │          │     ├── FloorPlanEditor                │  │
│  │          │     └── LeadCaptureModal               │  │
│  │          └── SimilarPlans                         │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ fetch
                         ▼
┌─────────────────────────────────────────────────────────┐
│  API Service (Express + TypeScript)  — Coolify          │
│                                                         │
│  GET  /api/plans          — filtered plan list          │
│  GET  /api/plans/:id      — single plan                 │
│  POST /api/plans/:id/click — increment click count      │
│  POST /api/style-swap     — AI style swap via n8n       │
│  POST /api/floor-plan-edit — AI floor plan edit via n8n │
│  POST /api/enhance-prompt — AI prompt enhancement       │
│  POST /api/save-design    — lead capture + CRM forward  │
│  POST /api/sessions       — create design session       │
└────────────┬──────────────────────┬─────────────────────┘
             │                      │
             ▼                      ▼
┌────────────────────┐   ┌────────────────────┐
│  Supabase          │   │  n8n               │
│                    │   │  (AI workflows)    │
│  website_floor_    │   │                    │
│    plans           │   │  /webhook/style-   │
│  design_sessions   │   │    swap            │
│  design_cache      │   │  /webhook/floor-   │
│                    │   │    plan-edit       │
└────────────────────┘   │  /webhook/enhance- │
                         │    prompt          │
                         └────────────────────┘
```

## Local Development

```bash
# Terminal 1: watch & rebuild the package
npm run dev

# Terminal 2: run the API service
cd api-service && npm run dev

# Terminal 3: run the example app
cd examples/vite-app && npm install && npm run dev
```

The example app proxies `/api` requests to `localhost:3001`.
