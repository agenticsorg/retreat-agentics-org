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

    // Check inventory (the meals day-pass has no room cap → skip)
    const configRef = db.collection('retreat_config').doc('inventory');
    const inventoryField = tierKey === 'solo' ? 'soloRemaining'
      : tierKey === 'buddy' ? 'buddyRemaining'
      : tierKey === 'family' ? 'familyRemaining' : null;

    if (inventoryField !== null) {
      let hasSlot = false;
      try {
        hasSlot = await db.runTransaction(async (tx) => {
          const snap = await tx.get(configRef);
          const remaining = snap.exists ? ((snap.data() as any)[inventoryField] ?? 0) : 0;
          if (remaining <= 0) return false;
          tx.update(configRef, { [inventoryField]: remaining - 1 });
          return true;
        });
      } catch (e) {
        console.error('retreatCreateCheckoutSession inventory check error:', e);
        res.status(500).json({ error: 'inventory check failed' }); return;
      }

      if (!hasSlot) {
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
      // Refund the inventory slot on Stripe failure (skip for meals — no slot taken)
      if (inventoryField !== null) {
        try {
          await db.runTransaction(async (tx) => {
            const snap = await tx.get(configRef);
            const current = snap.exists ? ((snap.data() as any)[inventoryField] ?? 0) : 0;
            tx.update(configRef, { [inventoryField]: current + 1 });
          });
        } catch { /* best-effort */ }
      }
      console.error('retreatCreateCheckoutSession Stripe error:', e);
      res.status(500).json({ error: 'checkout session creation failed' });
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
