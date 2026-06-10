# Backend functions (reference copy)

This directory holds a **tracked reference copy** of the retreat Cloud Functions
source. It is **not built or deployed from this repo** — the frontend repo
(`npm run build` → Docker → Cloud Run) is unrelated to these functions.

## What this is

`src/api/retreat.ts` is the source for the Firebase Functions v2 endpoints that
power retreat checkout, deployed in GCP project **`agenticsorg`**:

| Function | Purpose |
|----------|---------|
| `retreatInterest` | Free email waitlist |
| `retreatCreateCheckoutSession` | Stripe Checkout (paid tiers) |
| `retreatWebhook` | Stripe webhook → marks registration paid |
| `retreatContact` | Contact form → support@agentics.org |

There is no separate source repo for these functions; the source of truth is the
deployed package in GCS. This copy exists so the changes are version-controlled.

## Tiers / pricing (as deployed 2026-06-10)

Checkout uses **managed Stripe Price IDs** (so the `AGENTICS500` member coupon's
product restriction matches). Amounts: Solo $2,000, Buddy $1,700/person, Family
$2,300 + $450/additional, Meals & Sessions $450 (no room), Sponsor $6,000.
`meals` and `sponsor` skip the room-inventory gate. `allow_promotion_codes` is on.

## Deploy flow (requires `gcloud` auth with access to `agenticsorg`)

```bash
# 1. Pull the currently deployed source
gcloud storage cp \
  gs://gcf-v2-sources-173957745326-us-central1/retreatCreateCheckoutSession/function-source.zip .
unzip function-source.zip -d fnsrc && cd fnsrc

# 2. Edit src/api/retreat.ts, then rebuild lib/ (the runtime uses compiled lib/)
npm install && npm run build

# 3. Deploy (in-place update of the existing gen2 function)
gcloud functions deploy retreatCreateCheckoutSession --gen2 \
  --project=agenticsorg --region=us-central1 \
  --runtime=nodejs20 --entry-point=retreatCreateCheckoutSession \
  --trigger-http --source=.
```

Secrets (`STRIPE_SECRET_KEY`, `STRIPE_RETREAT_WEBHOOK_SECRET`, `RESEND_API_KEY`)
live in GCP Secret Manager and are bound to the function automatically.
