// Billing entry point (user-JWT authenticated).
//
// POST { action: "checkout", plan: "pro" | "founder" }
// POST { action: "portal" }
// POST { action: "downgrade" }   (sandbox only)
//
// With STRIPE_SECRET_KEY configured this drives real Stripe TEST-mode
// Checkout/Portal. Without it, it runs in clearly-labeled SANDBOX mode:
// the same subscriptions rows are written, so server-side gating behaves
// identically. The account is ALWAYS derived from the caller's JWT —
// client-supplied account ids are never trusted.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

import { bearer, verifyClerkJwt } from "../_shared/clerk.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const PRICE_IDS: Record<string, string | undefined> = {
  pro: Deno.env.get("STRIPE_PRICE_PRO"),
  founder: Deno.env.get("STRIPE_PRICE_FOUNDER"),
};

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

async function callerAccount(req: Request) {
  const jwt = bearer(req);
  if (!jwt) return null;
  const claims = await verifyClerkJwt(jwt);
  if (!claims) return null;

  // Map the verified Clerk user → internal profile → account.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email")
    .eq("clerk_user_id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  const { data: membership } = await admin
    .from("account_members")
    .select("account_id")
    .eq("user_id", profile.id)
    .limit(1)
    .single();
  if (!membership) return null;

  return {
    userId: profile.id,
    email: claims.email ?? profile.email ?? "",
    accountId: membership.account_id,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: cors });

  const caller = await callerAccount(req);
  if (!caller) return new Response("unauthorized", { status: 401, headers: cors });

  const { action, plan } = (await req.json().catch(() => ({}))) as {
    action?: string;
    plan?: string;
  };
  const origin = req.headers.get("origin") ?? Deno.env.get("APP_URL") ?? "http://localhost:3000";

  try {
    // ---------- Real Stripe (TEST mode) ----------
    if (STRIPE_KEY) {
      const stripe = new Stripe(STRIPE_KEY, {
        apiVersion: "2024-06-20",
        httpClient: Stripe.createFetchHttpClient(),
      });

      const { data: sub } = await admin
        .from("subscriptions")
        .select("stripe_customer_id, stripe_subscription_id, status")
        .eq("account_id", caller.accountId)
        .single();

      const hasActiveSub =
        !!sub?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(sub.status);

      if (action === "checkout") {
        const priceId = plan ? PRICE_IDS[plan] : undefined;
        if (!priceId) return Response.json({ error: "unknown plan" }, { status: 400, headers: cors });

        // A customer with an existing subscription must CHANGE it, not open
        // a second concurrent one (which Stripe Checkout would create and
        // double-bill). Swap the price in place with proration.
        if (hasActiveSub) {
          const current = await stripe.subscriptions.retrieve(sub!.stripe_subscription_id!);
          await stripe.subscriptions.update(current.id, {
            items: [{ id: current.items.data[0].id, price: priceId }],
            proration_behavior: "create_prorations",
          });
          return Response.json({ changed: true, plan }, { headers: cors });
        }

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          client_reference_id: caller.accountId,
          customer: sub?.stripe_customer_id ?? undefined,
          customer_email: sub?.stripe_customer_id ? undefined : caller.email,
          success_url: `${origin}/app/billing?status=success`,
          cancel_url: `${origin}/app/billing?status=cancelled`,
        });
        return Response.json({ url: session.url }, { headers: cors });
      }

      // Downgrade in real-Stripe mode = cancel at period end via the Portal.
      if (action === "portal" || action === "downgrade") {
        if (!sub?.stripe_customer_id) {
          return Response.json({ error: "no stripe customer yet" }, { status: 400, headers: cors });
        }
        const portal = await stripe.billingPortal.sessions.create({
          customer: sub.stripe_customer_id,
          return_url: `${origin}/app/billing`,
        });
        return Response.json({ url: portal.url }, { headers: cors });
      }

      return Response.json({ error: "unknown action" }, { status: 400, headers: cors });
    }

    // ---------- Sandbox mode (no Stripe keys configured) ----------
    if (action === "checkout") {
      if (plan !== "pro" && plan !== "founder") {
        return Response.json({ error: "unknown plan" }, { status: 400, headers: cors });
      }
      const { error } = await admin
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          source: "sandbox",
          current_period_end: new Date(Date.now() + 30 * 864e5).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("account_id", caller.accountId);
      if (error) throw new Error(error.message);
      return Response.json({ sandbox: true, plan }, { headers: cors });
    }

    if (action === "downgrade") {
      const { error } = await admin
        .from("subscriptions")
        .update({
          plan: "free",
          status: "active",
          source: "sandbox",
          current_period_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq("account_id", caller.accountId);
      if (error) throw new Error(error.message);
      return Response.json({ sandbox: true, plan: "free" }, { headers: cors });
    }

    if (action === "portal") {
      return Response.json(
        { sandbox: true, message: "Stripe is not configured; sandbox subscriptions are managed on this page." },
        { headers: cors },
      );
    }

    return Response.json({ error: "unknown action" }, { status: 400, headers: cors });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500, headers: cors });
  }
});
