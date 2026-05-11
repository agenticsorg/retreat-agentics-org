# retreat.agentics.org — Claude Code Configuration

## Project

Agentics AI Summit 2026 registration site. React + Vite + TypeScript SPA served via nginx on Cloud Run. Backend is Firebase Cloud Functions (deployed from the `crm/` monorepo at [agenticsorg/agentics](https://github.com/agenticsorg/agentics)).

**Live URL**: https://retreat.agentics.org  
**Cloud Run**: `retreat-agentics-org` in `agentics-487016 / us-central1`  
**Firebase project**: `agenticsorg` (Firestore + Auth)

## Rules

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary — prefer editing existing files
- NEVER create documentation unless explicitly requested
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- Keep files under 500 lines

## Structure

```
packages/agentics-shared/src/   shared UI components (@shared alias)
src/
  App.tsx                        routes: /, /register, /agenda, /faq, /success
  lib/api.ts                     Cloud Function callers
  lib/firebase.ts                Google OAuth (optional sign-in)
  pages/                         Home, Register, Agenda, FAQ, Success, NotFound
  components/                    Header, Footer, SEO
docs/                            ADRs
scripts/                         deploy.sh, seed-inventory.sh
Dockerfile                       multi-stage: node build → nginx serve
nginx.conf                       CSP headers, SPA fallback
```

## Development

```bash
npm install
npm run dev          # http://localhost:8080

# type-check
npm run typecheck

# production build
npm run build
```

Set `VITE_FUNCTIONS_URL` to point at local emulators during development:

```bash
VITE_FUNCTIONS_URL=http://localhost:5001/agenticsorg/us-central1 npm run dev
```

## Cloud Function endpoints

All deployed to `https://us-central1-agenticsorg.cloudfunctions.net/`

| Function | Method | Purpose |
|----------|--------|---------|
| `retreatInterest` | POST | Free email waitlist |
| `retreatCreateCheckoutSession` | POST | Stripe Checkout (paid tiers) |
| `retreatWebhook` | POST | Stripe webhook — marks registration paid |
| `retreatContact` | POST | Contact form → support@agentics.org |

Functions source: `crm/dashboard/functions/src/api/retreat.ts` in the monorepo.

**Tier names** (must match exactly): `single` | `buddy` | `suite`

## Deployment

```bash
./scripts/deploy.sh
```

Or manually:

```bash
# 1. Build
npm run build

# 2. Docker
docker build -t us-central1-docker.pkg.dev/agentics-487016/cloud-run-source-deploy/retreat-agentics-org:latest .
docker push us-central1-docker.pkg.dev/agentics-487016/cloud-run-source-deploy/retreat-agentics-org:latest

# 3. Cloud Run
gcloud run deploy retreat-agentics-org \
  --image us-central1-docker.pkg.dev/agentics-487016/cloud-run-source-deploy/retreat-agentics-org:latest \
  --project=agentics-487016 \
  --region=us-central1 \
  --allow-unauthenticated
```

## Firestore inventory seeding (first deploy only)

```bash
./scripts/seed-inventory.sh
```

Sets `retreat_config/inventory`: `singleRemaining=10`, `buddyRemaining=50`, `suiteRemaining=20`.

## Secrets (GCP Secret Manager — project: agenticsorg)

| Secret | Used by |
|--------|---------|
| `STRIPE_SECRET_KEY` | retreatCreateCheckoutSession |
| `STRIPE_RETREAT_WEBHOOK_SECRET` | retreatWebhook |
| `RESEND_API_KEY` | retreatInterest, retreatContact |

GitHub PAT is in `agenticsorg` Secret Manager as `GITHUB_TOKEN`.

## Design

See `docs/ADR-026-retreat-agentics-org-summit-site.md` for full design decisions, pricing breakdown, and inventory model.
