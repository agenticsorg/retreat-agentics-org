# ADR-026: retreat.agentics.org — RockyCrest Summit Registration Site

**Status**: Accepted  
**Date**: 2026-05-05  
**Author**: Claude (AI-assisted), with rUv  
**Branch**: `feat/store-agentics-org`  
**Related**: ADR-013 (Public Storefront), ADR-025 (Google OAuth), ADR-027 (proposed: uid on retreat registrations)

---

## 1. Context

### 1.1 Event

**Agentics AI Summit at RockyCrest Resort** — September 2026, Ontario, Canada.

RockyCrest is a resort with a fixed room inventory:

| Room type | Count | Capacity |
|---|---|---|
| 1-bedroom | 10 | 1 person/room |
| 2+ bedroom | 25 | 2 persons/room (buddy) or exclusive group (suite) |

### 1.2 Pricing breakdown (USD, with 25 % markup)

| Tier | Resort fee | Food | Activities/misc | Subtotal | +25 % | **Retail** |
|---|---|---|---|---|---|---|
| Single (solo 1BR) | $860 | $400 | $375 | $1,635 | +$409 | **$1,995** |
| Buddy (2-share 2BR, per person) | $510 | $400 | $375 | $1,285 | +$321 | **$1,595** |
| Suite (exclusive 2BR, per person) | $1,020 | $400 | $375 | $1,795 | +$449 | **$2,249** |

Activities / misc uses the midpoint of the $250–$500 USD range ($375). The 25 % markup funds organisational costs and the early-registration waitlist comms workflow.

CAD reference rates (÷ 0.74):
- Single: ~$2,696 CAD  
- Buddy: ~$2,155 CAD  
- Suite: ~$3,040 CAD

### 1.3 Registration model

Two distinct registration tracks:

1. **Early Interest (free)**: email-only waitlist. Captures demand before room block is confirmed; sends a welcome email via Resend. No Stripe involved.
2. **Paid Registration**: full ticket purchase via Stripe Checkout. Three tiers (Single / Buddy / Suite). Stripe Checkout metadata carries tier + attendee info. A Stripe webhook handler marks the Firestore record `paid`.

### 1.4 Infrastructure constraints

- Must reuse `agenticsorg` Firebase project (Firestore + Auth) and `agentics-487016` GCP project (Cloud Run + Artifact Registry).
- Must not share Cloud Functions namespace with the merch store (prefix all functions `retreat*`).
- Rooms are scarce: Single (10 rooms → 10 slots); Buddy (25 × 2 = 50 slots); Suite (25 rooms, varies). Inventory counter in Firestore `retreat_config` document; registrations decrement atomically with a Firestore transaction.
- Google OAuth (ADR-025 pattern) optional — prefills name/email on the registration form. Not required.

---

## 2. Decision

Scaffold `retreat-agentics-org/` as a standalone Vite + React + TypeScript SPA, modelled on `store-agentics-org/` but with conference-specific pages and no cart/catalog. Deploy as a Cloud Run service at `retreat-agentics-org-667037737667.us-central1.run.app` (DNS CNAME → `retreat.agentics.org`).

### 2.1 New directory: `retreat-agentics-org/`

```
retreat-agentics-org/
├── Dockerfile
├── nginx.conf
├── package.json          (firebase, react-hook-form, zod, stripe-js, react-router-dom)
├── vite.config.ts
├── src/
│   ├── App.tsx           (routes: /, /register, /success, /agenda, /faq)
│   ├── lib/
│   │   ├── firebase.ts   (auth only — same public pattern as store, no domain restriction)
│   │   └── api.ts        (retreatInterest, retreatRegister → Cloud Functions)
│   ├── hooks/
│   │   └── useAuth.ts    (same as store)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── AccountMenu.tsx
│   │   └── SEO.tsx
│   └── pages/
│       ├── Home.tsx         (hero, venue, tiers, agenda preview, FAQ)
│       ├── Register.tsx     (early-interest form OR paid checkout by tier)
│       ├── Success.tsx      (post-Stripe redirect)
│       └── NotFound.tsx
```

### 2.2 New Cloud Functions (added to `crm/dashboard/functions/src/`)

| Function | Trigger | Purpose |
|---|---|---|
| `retreatInterest` | HTTPS | Validate email, write `retreat_interests/{email}`, send Resend welcome email, return `{ok: true}` |
| `retreatCreateCheckoutSession` | HTTPS | Validate tier + attendee info, decrement `retreat_config` slot count (Firestore transaction), create Stripe Checkout Session, return `{url}` |
| `retreatWebhook` | HTTPS (Stripe) | Verify Stripe signature, on `checkout.session.completed` set `retreat_registrations/{sessionId}.status = "paid"` |

### 2.3 Firestore collections

| Collection | Doc ID | Key fields |
|---|---|---|
| `retreat_interests` | `{email}` | `email`, `createdAt`, `source` |
| `retreat_registrations` | `{stripeSessionId}` | `tier`, `email`, `name`, `status` (`pending`/`paid`/`cancelled`), `createdAt` |
| `retreat_config` | `inventory` | `singleRemaining`, `buddyRemaining`, `suiteRemaining` |

### 2.4 Auth (optional)

Same Firebase auth helper as `store-agentics-org/src/lib/firebase.ts` — copied verbatim, no domain restriction. Google OAuth prefills the registration form. Sign-in is never required.

### 2.5 nginx CSP

Identical to store nginx.conf (Firebase Auth + Stripe + GTM domains). No changes needed beyond the template copy.

---

## 3. Alternatives considered

| Option | Why rejected |
|---|---|
| **Add a `/summit` sub-route to store.agentics.org** | Couples two completely different UX flows in one bundle; confuses SEO; harder to sunset the summit site post-event. |
| **Waitlist-only (no paid checkout)** | Event has hard costs; we need committed registrations, not just interest signals. |
| **Third-party event platform (Eventbrite, Luma)** | Extra vendor fees on top of resort costs; no control over post-registration CRM flow or Firestore integration. |
| **Ticket NFT / crypto payment** | Unnecessary complexity; attendees expect familiar Stripe checkout. |

---

## 4. Consequences

### 4.1 Positive

- Separate subdomain + bundle keeps the store unaffected.
- Conference-specific UI — agenda, FAQ, venue photos — without polluting the merch store.
- Atomic slot-decrement transaction prevents overbooking.
- Two-phase funnel: early-interest email build-up before room block is confirmed; convert to paid once locked in.

### 4.2 Negative / risks

- **Inventory race**: if Stripe webhook is delayed, a second purchaser could attempt the same slot before the first is marked paid. Mitigation: the Firestore transaction on `retreat_config` at session-creation time is the authoritative gate; the webhook only flips status, not inventory.
- **Buddy tier coordination**: two attendees must each purchase the "Buddy" tier and indicate the same partner email. V1 does not validate pairing — that is left to manual confirmation email via Resend.
- **Room-type mismatch at resort**: if buddy slots sell more than 25 pairs, we oversell 2BR rooms. Mitigation: initial inventory set at conservative counts (`buddyRemaining: 50`, `singleRemaining: 10`, `suiteRemaining: 20`).

---

## 5. Deploy checklist

1. **Firestore — seed inventory document**:
   ```bash
   # Seed retreat_config/inventory via REST
   curl -s -X PATCH \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "Content-Type: application/json" \
     -H "x-goog-user-project: agenticsorg" \
     "https://firestore.googleapis.com/v1/projects/agenticsorg/databases/(default)/documents/retreat_config/inventory?updateMask.fieldPaths=singleRemaining&updateMask.fieldPaths=buddyRemaining&updateMask.fieldPaths=suiteRemaining" \
     -d '{"fields":{"singleRemaining":{"integerValue":"10"},"buddyRemaining":{"integerValue":"50"},"suiteRemaining":{"integerValue":"20"}}}'
   ```
2. **Firestore rules** — add `retreat_interests`, `retreat_registrations`, `retreat_config` (write-only for functions; public read for inventory count).
3. **Cloud Functions** — deploy retreat functions:
   ```bash
   GOOGLE_CLOUD_QUOTA_PROJECT=agenticsorg firebase deploy \
     --only functions:retreatInterest,functions:retreatCreateCheckoutSession,functions:retreatWebhook \
     --token "$(gcloud auth print-access-token)"
   ```
4. **Stripe** — create three Price objects (Single/Buddy/Suite) and set `STRIPE_RETREAT_SINGLE_PRICE_ID`, `STRIPE_RETREAT_BUDDY_PRICE_ID`, `STRIPE_RETREAT_SUITE_PRICE_ID` in Cloud Functions config. Register `retreatWebhook` URL in Stripe dashboard.
5. **Resend** — add `retreat.agentics.org` sending domain (or reuse `agentics.org`). Set `RESEND_API_KEY` in Cloud Functions environment (already set for store).
6. **Identity Toolkit authorized domains** — add `retreat.agentics.org` (and Cloud Run preview URL). GET → append → PATCH:
   ```bash
   curl -s -X PATCH \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "Content-Type: application/json" \
     -H "x-goog-user-project: agenticsorg" \
     "https://identitytoolkit.googleapis.com/admin/v2/projects/agenticsorg/config?updateMask=authorizedDomains" \
     -d '{"authorizedDomains":["localhost","agenticsorg.firebaseapp.com","agenticsorg.web.app","crm-management-667037737667.us-central1.run.app","manage.agentics.org","store.agentics.org","retreat.agentics.org"]}'
   ```
7. `npm run typecheck && npm run build` in `retreat-agentics-org/`.
8. Docker build → push → Cloud Run deploy (same flow as ADR-013 §10).
9. Add DNS CNAME `retreat.agentics.org → <cloud-run-url>` via Cloudflare (CF token in GCP Secret Manager `agentics-487016/CLOUDFLARE_API_TOKEN`).
10. Smoke test: early-interest email signup → Resend confirmation received; paid checkout for each tier → Stripe test-mode redirect → success page → Firestore `retreat_registrations` doc shows `status: paid`.

---

## 6. Follow-ups (out of scope here)

- **ADR-027 (proposed)**: Admin dashboard page in `manage.agentics.org` showing retreat registrations and interest list.
- Buddy pairing validation: check partner email at checkout time, emit a "waiting for partner" email if unmatched.
- Cancellation/refund flow: automated Stripe refund + inventory re-increment via webhook.
- Post-event: archive the site, redirect `retreat.agentics.org` to a recap page.
