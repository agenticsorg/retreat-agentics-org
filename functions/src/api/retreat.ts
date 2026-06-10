/**
 * Public API for retreat.agentics.org — Agentics AI Summit registration.
 * See ADR-026 for design.
 *
 * retreatInterest                — free email waitlist (Resend confirmation)
 * retreatCreateCheckoutSession   — Stripe Checkout for paid tiers
 * retreatWebhook                 — Stripe webhook: marks registration paid
 */

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

const db = admin.firestore();

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeRetreatWebhookSecret = defineSecret('STRIPE_RETREAT_WEBHOOK_SECRET');
const resendApiKey = defineSecret('RESEND_API_KEY');

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey.value(), {
      apiVersion: '2024-12-18.acacia' as Stripe.StripeConfig['apiVersion'],
    });
  }
  return stripeClient;
}

// ─── CORS ───

const RETREAT_ORIGINS = [
  'https://retreat.agentics.org',
  'http://localhost:8080',
  'http://localhost:5173',
];

function handleRetreatCors(req: any, res: any): boolean {
  const origin = req.headers.origin || '';
  const allowed =
    RETREAT_ORIGINS.includes(origin) ||
    /^https:\/\/retreat-agentics-org-.*\.run\.app$/.test(origin);
  const corsOrigin = allowed ? origin : RETREAT_ORIGINS[0];
  res.set('Access-Control-Allow-Origin', corsOrigin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
}

// ─── Helpers ───

function isEmail(s: unknown): s is string {
  return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;
}
function isStr(v: unknown, max = 256): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

// priceId = managed Stripe Price (so the AGENTICS500 coupon's product restriction matches).
// unitAmount must mirror the Stripe price; it is used only for Firestore records + emails.
const TIERS = {
  solo:   { label: 'Solo',   priceId: 'price_1TgpMYKr1IlsKQ5RmGya7mLd', unitAmount: 200000, description: 'Private 1-bedroom suite · All meals + activities · Sep 2026' },
  buddy:  { label: 'Buddy',  priceId: 'price_1TgpMZKr1IlsKQ5RYbn7h2Jw', unitAmount: 170000, description: 'Shared 2-bedroom suite (per person) · All meals + activities · Sep 2026' },
  family: { label: 'Family', priceId: 'price_1TgpMaKr1IlsKQ5Rf0XOsvdw', unitAmount: 230000, description: 'Exclusive 2-bedroom suite · All meals + activities · Sep 2026' },
  meals:  { label: 'Meals & Sessions', priceId: 'price_1TgpGOKr1IlsKQ5Ran3Ji0OK', unitAmount: 45000, description: 'Day pass — all meals & sessions, no overnight room · Sep 2026' },
  sponsor:{ label: 'Sponsor (Scholarship)', priceId: 'price_1TgpzLKr1IlsKQ5RwIPqkOk2', unitAmount: 600000, description: 'Sponsor: keynote slot, a Family suite, + room & meals for two Buddy-room scholarship participants · Sep 2026' },
} as const;

const ADDITIONAL_PERSON_PRICE_ID = 'price_1TgpMaKr1IlsKQ5R4wEjjlZD';
const ADDITIONAL_PERSON_AMOUNT = 45000; // $450 per additional person

type Tier = keyof typeof TIERS;

// Rooms each tier reserves from retreat_config/inventory. Sponsor takes a
// Family suite (the sponsor) + two Buddy rooms (the scholarship participants).
// meals takes none. The reservation is atomic and blocks if any field is short.
const ROOM_DEDUCTIONS: Record<Tier, Record<string, number>> = {
  solo:    { soloRemaining: 1 },
  buddy:   { buddyRemaining: 1 },
  family:  { familyRemaining: 1 },
  meals:   {},
  sponsor: { familyRemaining: 1, buddyRemaining: 2 },
};

// ─── 1. Early Interest (free waitlist) ───

export const retreatInterest = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 30, secrets: [resendApiKey] },
  async (req, res) => {
    if (handleRetreatCors(req, res)) return;
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

    const { email, name, source } = req.body || {};
    if (!isEmail(email)) { res.status(400).json({ error: 'valid email required' }); return; }

    const docRef = db.collection('retreat_interests').doc(email.toLowerCase());

    try {
      await docRef.set(
        {
          email: email.toLowerCase(),
          name: isStr(name) ? name.trim().slice(0, 128) : null,
          source: isStr(source, 64) ? source : 'retreat-site',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Send Resend welcome email (best-effort — don't fail the request if email fails)
      try {
        const greeting = isStr(name) ? name.trim().split(' ')[0] : 'there';
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey.value()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Agentics Summit <summit@agentics.org>',
            to: email.toLowerCase(),
            subject: "You're on the list — Agentics AI Summit 2026",
            html: `
              <p>Hi ${greeting},</p>
              <p>Thanks for your interest in the <strong>Agentics AI Summit 2026</strong> at RockyCrest Resort, Ontario.</p>
              <p>You're on our early-access list. When registration opens you'll hear from us first — before tickets go public.</p>
              <p>In the meantime, check out the event details at <a href="https://retreat.agentics.org">retreat.agentics.org</a>.</p>
              <p>See you in September!</p>
              <p>— The Agentics Team</p>
            `,
          }),
        });
      } catch (emailErr) {
        console.warn('retreatInterest Resend error (non-fatal):', emailErr);
      }

      res.json({ ok: true });
    } catch (e: any) {
      console.error('retreatInterest error:', e);
      res.status(500).json({ error: 'failed to save interest' });
    }
  }
);

// ─── 2. Create Stripe Checkout Session ───

export const retreatCreateCheckoutSession = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 30, secrets: [stripeSecretKey] },
  async (req, res) => {
    if (handleRetreatCors(req, res)) return;
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

    const { tier, email, name, partner, additionalPersons, dietaryReqs, emergencyContact } = req.body || {};

    if (!isStr(tier) || !(tier in TIERS)) {
      res.status(400).json({ error: 'tier must be solo | buddy | family | meals | sponsor' }); return;
    }
    if (!isEmail(email)) { res.status(400).json({ error: 'valid email required' }); return; }
    if (!isStr(name)) { res.status(400).json({ error: 'name required' }); return; }

    const tierKey = tier as Tier;
    const tierInfo = TIERS[tierKey];
    const extraPeople = tierKey === 'family' ? Math.max(0, Math.min(10, parseInt(additionalPersons) || 0)) : 0;
    const totalAmountUsd = tierInfo.unitAmount / 100 + extraPeople * (ADDITIONAL_PERSON_AMOUNT / 100);

    // Reserve rooms atomically. meals takes none; sponsor takes 1 family + 2 buddy.
    // Blocks (409) if ANY required room is short, so we never oversell.
    const configRef = db.collection('retreat_config').doc('inventory');
    const deductions = ROOM_DEDUCTIONS[tierKey];
    const needsRooms = Object.keys(deductions).length > 0;

    if (needsRooms) {
      let reserved = false;
      try {
        reserved = await db.runTransaction(async (tx) => {
          const snap = await tx.get(configRef);
          const data = (snap.exists ? snap.data() : {}) as Record<string, number>;
          for (const [field, qty] of Object.entries(deductions)) {
            if ((data[field] ?? 0) < qty) return false;
          }
          const update: Record<string, number> = {};
          for (const [field, qty] of Object.entries(deductions)) {
            update[field] = (data[field] ?? 0) - qty;
          }
          tx.update(configRef, update);
          return true;
        });
      } catch (e) {
        console.error('retreatCreateCheckoutSession inventory check error:', e);
        res.status(500).json({ error: 'inventory check failed' }); return;
      }

      if (!reserved) {
        res.status(409).json({ error: `No ${tierKey} spots remaining` }); return;
      }
    }

    const origin = req.headers.origin || 'https://retreat.agentics.org';
    const successUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/register`;

    // Use managed Stripe Price IDs so the member coupon (restricted to these
    // products) applies, and pricing stays in one place (Stripe).
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: tierInfo.priceId, quantity: 1 },
    ];
    if (extraPeople > 0) {
      lineItems.push({ price: ADDITIONAL_PERSON_PRICE_ID, quantity: extraPeople });
    }

    try {
      const session = await getStripe().checkout.sessions.create({
        mode: 'payment',
        // Expire in 1h so an abandoned checkout releases its reserved rooms
        // promptly (via the checkout.session.expired webhook) instead of holding
        // them for Stripe's 24h default.
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        customer_email: email.toLowerCase(),
        line_items: lineItems,
        allow_promotion_codes: true,
        metadata: {
          tier: tierKey,
          attendeeName: name.trim().slice(0, 128),
          attendeeEmail: email.toLowerCase(),
          partnerEmail: isEmail(partner) ? partner.toLowerCase() : '',
          additionalPersons: String(extraPeople),
          dietaryReqs: isStr(dietaryReqs, 512) ? dietaryReqs.trim() : '',
          emergencyContact: isStr(emergencyContact, 256) ? emergencyContact.trim() : '',
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // Write pending registration
      await db.collection('retreat_registrations').doc(session.id).set({
        stripeSessionId: session.id,
        tier: tierKey,
        email: email.toLowerCase(),
        name: name.trim().slice(0, 128),
        partnerEmail: isEmail(partner) ? partner.toLowerCase() : null,
        additionalPersons: extraPeople,
        dietaryReqs: isStr(dietaryReqs, 512) ? dietaryReqs.trim() : null,
        emergencyContact: isStr(emergencyContact, 256) ? emergencyContact.trim() : null,
        status: 'pending',
        amountUsd: totalAmountUsd,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ url: session.url });
    } catch (e: any) {
      // Release reserved rooms on Stripe failure (skip for meals — none taken)
      if (needsRooms) {
        try {
          await db.runTransaction(async (tx) => {
            const snap = await tx.get(configRef);
            const data = (snap.exists ? snap.data() : {}) as Record<string, number>;
            const update: Record<string, number> = {};
            for (const [field, qty] of Object.entries(deductions)) {
              update[field] = (data[field] ?? 0) + qty;
            }
            tx.update(configRef, update);
          });
        } catch { /* best-effort */ }
      }
      console.error('retreatCreateCheckoutSession Stripe error:', e);
      res.status(500).json({ error: 'checkout session creation failed' });
    }
  }
);

// ─── 2b. Public inventory (drives "SOLD OUT" UI) ───

export const retreatInventory = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 30 },
  async (req, res) => {
    if (handleRetreatCors(req, res)) return;
    if (req.method !== 'GET') { res.status(405).json({ error: 'GET only' }); return; }

    try {
      const snap = await db.collection('retreat_config').doc('inventory').get();
      const d = (snap.exists ? snap.data() : {}) as Record<string, number>;
      const solo = d.soloRemaining ?? 0;
      const buddy = d.buddyRemaining ?? 0;
      const family = d.familyRemaining ?? 0;
      res.set('Cache-Control', 'no-store');
      res.json({
        soloRemaining: solo,
        buddyRemaining: buddy,
        familyRemaining: family,
        // A sponsor needs 1 family suite + 2 buddy rooms; sold out if either is short.
        sponsorAvailable: family >= 1 && buddy >= 2,
      });
    } catch (e) {
      console.error('retreatInventory error:', e);
      res.status(500).json({ error: 'failed to read inventory' });
    }
  }
);

// ─── 3. Stripe Webhook ───

export const retreatWebhook = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 30, secrets: [stripeSecretKey, stripeRetreatWebhookSecret, resendApiKey] },
  async (req, res) => {
    if (req.method !== 'POST') { res.status(405).send('POST only'); return; }

    const sig = req.headers['stripe-signature'];
    if (!sig) { res.status(400).send('Missing stripe-signature'); return; }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        stripeRetreatWebhookSecret.value()
      );
    } catch (e: any) {
      console.error('retreatWebhook signature error:', e.message);
      res.status(400).send(`Webhook Error: ${e.message}`);
      return;
    }

    // Abandoned/expired checkout → release the rooms we reserved at creation.
    // Idempotent: only acts while the registration is still 'pending'.
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const tierKey = session.metadata?.tier as Tier | undefined;
      const deductions = tierKey ? ROOM_DEDUCTIONS[tierKey] : undefined;
      const regRef = db.collection('retreat_registrations').doc(session.id);
      const configRef = db.collection('retreat_config').doc('inventory');
      try {
        await db.runTransaction(async (tx) => {
          const regSnap = await tx.get(regRef);
          if (!regSnap.exists || (regSnap.data() as any).status !== 'pending') return; // already handled/paid
          if (deductions && Object.keys(deductions).length > 0) {
            const invSnap = await tx.get(configRef);
            const data = (invSnap.exists ? invSnap.data() : {}) as Record<string, number>;
            const update: Record<string, number> = {};
            for (const [field, qty] of Object.entries(deductions)) {
              update[field] = (data[field] ?? 0) + qty;
            }
            tx.update(configRef, update);
          }
          tx.update(regRef, {
            status: 'expired',
            expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
      } catch (e) {
        console.error('retreatWebhook expired-release error:', e);
        res.status(500).send('release error'); return;
      }
      res.json({ received: true });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};
      const attendeeEmail = session.customer_email ?? meta.attendeeEmail ?? '';
      const attendeeName = meta.attendeeName ?? '';
      const tierKey = meta.tier as Tier | undefined;
      const tierInfo = tierKey ? TIERS[tierKey] : null;
      const amountTotal = (session.amount_total ?? 0) / 100;
      const extraPeopleCount = parseInt(meta.additionalPersons || '0') || 0;
      const totalPeople = 1 + extraPeopleCount;

      try {
        await db.collection('retreat_registrations').doc(session.id).set(
          {
            status: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            stripePaymentIntent: session.payment_intent,
            amountTotal,
          },
          { merge: true }
        );
      } catch (e) {
        console.error('retreatWebhook Firestore update error:', e);
        res.status(500).send('Firestore error'); return;
      }

      // Confirmation email to attendee
      if (attendeeEmail) {
        const firstName = attendeeName.split(' ')[0] || 'there';
        const tierLabel = tierInfo?.label ?? tierKey ?? 'retreat';
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey.value()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Agentics Summit <summit@agentics.org>',
            to: attendeeEmail,
            reply_to: 'support@agentics.org',
            subject: 'Your Agentics AI Summit 2026 booking is confirmed!',
            html: `
              <p>Hi ${firstName},</p>
              <p>Your registration for the <strong>Agentics AI Summit 2026</strong> is confirmed.</p>
              <ul>
                <li><strong>Tier:</strong> ${tierLabel}</li>
                ${extraPeopleCount > 0 ? `<li><strong>Attendees:</strong> ${totalPeople} people (you + ${extraPeopleCount} additional)</li>` : ''}
                <li><strong>Amount paid:</strong> $${amountTotal.toFixed(2)} USD</li>
                <li><strong>Dates:</strong> September 18–21, 2026</li>
                <li><strong>Venue:</strong> Rocky Crest Golf Resort, MacTier, Muskoka, Ontario</li>
              </ul>
              <p>We'll be in touch with logistics, shuttle details, and agenda updates as we get closer to the event.</p>
              <p>Questions? Reply to this email or reach us at <a href="mailto:support@agentics.org">support@agentics.org</a>.</p>
              <p>See you in Muskoka!</p>
              <p>— The Agentics Team</p>
            `,
          }),
        }).catch((e) => console.warn('retreatWebhook attendee email error (non-fatal):', e));
      }

      // Internal notification to support@agentics.org
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendApiKey.value()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Agentics Summit <summit@agentics.org>',
          to: ['support@agentics.org'],
          subject: `[Retreat booking] ${attendeeName || attendeeEmail} — ${tierKey ?? 'unknown tier'}`,
          html: `
            <p><strong>New paid registration</strong></p>
            <ul>
              <li><strong>Name:</strong> ${attendeeName}</li>
              <li><strong>Email:</strong> ${attendeeEmail}</li>
              <li><strong>Tier:</strong> ${tierKey}</li>
              <li><strong>Amount:</strong> $${amountTotal.toFixed(2)} USD</li>
              <li><strong>Stripe session:</strong> ${session.id}</li>
            </ul>
          `,
        }),
      }).catch((e) => console.warn('retreatWebhook internal notification error (non-fatal):', e));
    }

    res.json({ received: true });
  }
);

// ─── 4. Contact Form → support@agentics.org ───

export const retreatContact = onRequest(
  { region: 'us-central1', memory: '256MiB', timeoutSeconds: 30, secrets: [resendApiKey] },
  async (req, res) => {
    if (handleRetreatCors(req, res)) return;
    if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

    const { name, email, message } = req.body || {};
    if (!isStr(name, 128)) { res.status(400).json({ error: 'name required' }); return; }
    if (!isEmail(email)) { res.status(400).json({ error: 'valid email required' }); return; }
    if (!isStr(message, 5000)) { res.status(400).json({ error: 'message required' }); return; }

    const safeName = name.trim().slice(0, 128);
    const safeEmail = email.toLowerCase();
    const safeMessage = message.trim().slice(0, 5000);

    try {
      await db.collection('retreat_contact_messages').add({
        name: safeName,
        email: safeEmail,
        message: safeMessage,
        status: 'new',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.value()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Agentics Retreat <summit@agentics.org>',
          to: ['support@agentics.org'],
          reply_to: safeEmail,
          subject: `[Retreat enquiry] ${safeName}`,
          html: `<p><strong>Name:</strong> ${safeName}</p>
<p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
<p><strong>Message:</strong></p>
<p style="white-space:pre-wrap">${safeMessage}</p>`,
        }),
      });

      // Best-effort confirmation to sender
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.value()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Agentics Retreat <summit@agentics.org>',
          to: [safeEmail],
          reply_to: 'support@agentics.org',
          subject: "We received your message — Agentics Fall Retreat 2026",
          html: `<p>Hi ${safeName.split(' ')[0]},</p>
<p>Thanks for reaching out. We'll get back to you within one business day.</p>
<p>— The Agentics Team</p>`,
        }),
      }).catch(() => { /* non-fatal */ });

      res.json({ ok: true });
    } catch (e: any) {
      console.error('retreatContact error:', e);
      res.status(500).json({ error: 'failed to send message' });
    }
  }
);
