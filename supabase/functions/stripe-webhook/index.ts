// Stripe webhook receiver (TEST mode).
//
// verify_jwt is disabled; authentication is the Stripe SIGNATURE — every
// request must carry a stripe-signature header that verifies against
// STRIPE_WEBHOOK_SECRET. Events sync subscription state into Supabase.
// Without Stripe secrets configured this endpoint answers 501 (sandbox
// billing writes subscriptions directly via the billing function).

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function planFromPrice(priceId: string | null | undefined): string {
  if (priceId && priceId === Deno.env.get("STRIPE_PRICE_FOUNDER")) return "founder";
  if (priceId && priceId === Deno.env.get("STRIPE_PRICE_PRO")) return "pro";
  return "free";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  if (!STRIPE_KEY || !WEBHOOK_SECRET) {
    return new Response("stripe not configured", { status: 501 });
  }

  const stripe = new Stripe(STRIPE_KEY, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const accountId = session.client_reference_id;
        if (!accountId) break;

        const subscription = session.subscription
          ? await stripe.subscriptions.retrieve(session.subscription as string)
          : null;
        const priceId = subscription?.items.data[0]?.price.id;

        await admin
          .from("subscriptions")
          .update({
            plan: planFromPrice(priceId),
            status: subscription?.status ?? "active",
            source: "stripe",
            stripe_customer_id: (session.customer as string) ?? null,
            stripe_subscription_id: (session.subscription as string) ?? null,
            price_id: priceId ?? null,
            current_period_end: subscription
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("account_id", accountId);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const deleted = event.type === "customer.subscription.deleted";
        const priceId = subscription.items.data[0]?.price.id;

        await admin
          .from("subscriptions")
          .update({
            plan: deleted ? "free" : planFromPrice(priceId),
            status: deleted ? "active" : subscription.status,
            source: "stripe",
            price_id: deleted ? null : (priceId ?? null),
            current_period_end: deleted
              ? null
              : new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", invoice.subscription as string);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`handler error: ${message}`, { status: 500 });
  }

  return Response.json({ received: true });
});
