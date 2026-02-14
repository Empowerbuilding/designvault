# DesignVault API Service

Express + TypeScript backend for DesignVault. Handles plan queries, AI interactions via n8n webhooks, session tracking, and lead capture forwarding to builder CRMs.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | — | Supabase service role key |
| `PORT` | No | `3001` | Server port |
| `ALLOWED_ORIGINS` | No | `*` (all) | Comma-separated CORS origins |
| `N8N_BASE_URL` | No | `https://n8n.empowerbuilding.ai` | n8n instance URL |

```bash
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_KEY
```

## Running Locally

```bash
npm install
npm run dev    # starts tsx watch on localhost:3001
```

## Building

```bash
npm run build   # outputs to dist/index.js
npm start       # runs the production build
```

## Deploying on Coolify

1. Create a new service in Coolify, source: GitHub repo, build pack: Nixpacks or Dockerfile.
2. Set the **Base Directory** to `api-service`.
3. Set environment variables in the Coolify UI:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `ALLOWED_ORIGINS` (the builder website domains)
   - `N8N_BASE_URL` (if different from default)
4. Build command: `npm run build`
5. Start command: `npm start`
6. Health check path: `/health`
7. Deploy.

## Endpoints

### Plans

#### `GET /api/plans`

Returns all floor plans with optional filters.

| Query Param | Type | Description |
|---|---|---|
| `style` | string | Filter by style (modern, rustic, etc.) |
| `category` | string | Filter by category (barndominium, ranch, etc.) |
| `beds` | number | Filter by bedroom count |
| `baths` | number | Filter by bathroom count |
| `minArea` | number | Minimum square footage |
| `maxArea` | number | Maximum square footage |
| `featured` | boolean | Only featured plans |

Response: `FloorPlan[]` with `Cache-Control: public, max-age=300`.

#### `GET /api/plans/:id`

Returns a single plan by UUID.

#### `POST /api/plans/:id/click`

Increments the click counter. Returns `204 No Content`.

### AI Interactions

All AI endpoints are rate-limited to **10 requests/hour per IP**.

#### `POST /api/style-swap`

```json
{
  "planId": "uuid",
  "preset": "modern",
  "sessionId": "uuid"
}
```

Response:
```json
{
  "success": true,
  "resultUrl": "https://...",
  "cached": false,
  "remainingFree": 0
}
```

Checks `design_cache` first. On miss, calls n8n webhook, caches the result, updates the session.

#### `POST /api/floor-plan-edit`

```json
{
  "planId": "uuid",
  "prompt": "Add a 3-car garage",
  "sessionId": "uuid",
  "currentUrl": "https://..."
}
```

Response: same shape as style-swap.

#### `POST /api/enhance-prompt`

```json
{
  "prompt": "bigger garage",
  "imageUrl": "https://..."
}
```

Response:
```json
{
  "enhancedPrompt": "Expand the existing 2-car garage to a 3-car garage..."
}
```

### Sessions

#### `POST /api/sessions`

```json
{
  "planId": "uuid",
  "builderSlug": "barnhaus",
  "anonymousId": "uuid"
}
```

Response:
```json
{
  "sessionId": "uuid"
}
```

### Lead Capture

#### `POST /api/save-design`

```json
{
  "leadData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "5125551234",
    "favorites": ["uuid1"],
    "stylePref": "modern",
    "sessionDuration": 245,
    "plansViewed": ["uuid1", "uuid2"]
  },
  "sessionId": "uuid",
  "builderSlug": "barnhaus"
}
```

Forwards lead + metadata to the builder's CRM webhook. Marks the session as captured.

Response:
```json
{
  "success": true
}
```

### Health Check

#### `GET /health`

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Rate Limits

| Scope | Limit |
|---|---|
| Global (all endpoints) | 100 requests/min per IP |
| AI endpoints (style-swap, floor-plan-edit) | 10 requests/hr per IP |
| Per-session | 1 free interaction, then lead capture required. Hard cap at 4 total. |

## Builder Configuration

Add new builders in `src/config/builders.ts`:

```typescript
export const builders = {
  newbuilder: {
    name: "New Builder Co",
    webhookUrl: "https://crm.newbuilder.com/api/leads/webhook",
    brandColor: "#C8A962",
  },
};
```

Then add their domain to `ALLOWED_ORIGINS`.
