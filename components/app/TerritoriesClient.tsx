"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, MapPin, Trash2 } from "lucide-react";

import { useSupabase } from "@/lib/supabase/browser";
import type { Territory } from "@/lib/types";

/** Same remembered-location key the hunt form uses, so a city carries across. */
const LAST_LOCATION_KEY = "everdeck:lastLocation";

/** High no-website-rate niches — one tap fills the type (mirrors StartHuntForm). */
const NICHE_PRESETS = [
  "Roofers",
  "Plumbers",
  "Landscapers",
  "HVAC",
  "Electricians",
  "Auto repair",
  "House cleaners",
  "Movers",
  "Fencing",
  "Painters",
  "Dentists",
  "Med spas",
  "Law firms",
] as const;

/** Turn a raw RPC error into a calm, human sentence. Returns JSX for the gate. */
function messageFor(raw: string): { text: string; upgrade: boolean } {
  if (raw.includes("plan_gate:engine")) {
    return { text: "Territories are a Pro feature — upgrade in Plan.", upgrade: true };
  }
  if (raw.includes("no_active_subscription")) {
    return { text: "Your plan isn't active — check Plan to continue.", upgrade: true };
  }
  if (raw.includes("inputs_required")) {
    return { text: "Enter a business type and a location.", upgrade: false };
  }
  return { text: "Couldn't save that territory. Try again in a moment.", upgrade: false };
}

export default function TerritoriesClient({
  initialTerritories,
  engineAllowed,
}: {
  initialTerritories: Territory[];
  engineAllowed: boolean;
}) {
  const supabase = useSupabase();
  const router = useRouter();

  const [territories, setTerritories] = useState<Territory[]>(initialTerritories);
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; upgrade: boolean } | null>(null);

  // Prefill the location with the last city hunted (matches the hunt form).
  useEffect(() => {
    try {
      const last = window.localStorage.getItem(LAST_LOCATION_KEY);
      if (last) setLocation(last);
    } catch {
      // localStorage can be unavailable (private mode) — skip the prefill.
    }
  }, []);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    const bt = businessType.trim();
    const loc = location.trim();
    if (bt.length < 2 || loc.length < 2) {
      setError(messageFor("inputs_required"));
      return;
    }

    try {
      window.localStorage.setItem(LAST_LOCATION_KEY, loc);
    } catch {
      // Non-fatal — claiming the territory doesn't depend on remembering the city.
    }

    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("create_territory", {
      p_business_type: bt,
      p_location: loc,
    });

    if (rpcError) {
      setError(messageFor(rpcError.message));
      setBusy(false);
      return;
    }

    // Optimistically add the new territory to the top of the list.
    const id = typeof data === "string" ? data : `${Date.now()}`;
    setTerritories((prev) => [
      {
        id,
        account_id: prev[0]?.account_id ?? "",
        business_type: bt,
        location: loc,
        active: true,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setBusinessType("");
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(t: Territory) {
    if (pendingId) return;
    setError(null);
    setPendingId(t.id);
    const next = !t.active;
    const { error: rpcError } = await supabase.rpc("set_territory_active", {
      p_id: t.id,
      p_active: next,
    });
    if (rpcError) {
      setError(messageFor(rpcError.message));
      setPendingId(null);
      return;
    }
    setTerritories((prev) => prev.map((x) => (x.id === t.id ? { ...x, active: next } : x)));
    setPendingId(null);
    router.refresh();
  }

  async function remove(t: Territory) {
    if (pendingId) return;
    setError(null);
    setPendingId(t.id);
    const { error: rpcError } = await supabase.rpc("delete_territory", { p_id: t.id });
    if (rpcError) {
      setError(messageFor(rpcError.message));
      setPendingId(null);
      return;
    }
    setTerritories((prev) => prev.filter((x) => x.id !== t.id));
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Claim form */}
      <div className="rounded-2xl bg-carbon-panel p-5 ring-1 ring-white/10">
        <form onSubmit={handleAdd} noValidate>
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
              Popular niches
            </p>
            <div className="flex flex-wrap gap-1.5">
              {NICHE_PRESETS.map((niche) => {
                const active = businessType.trim().toLowerCase() === niche.toLowerCase();
                return (
                  <button
                    key={niche}
                    type="button"
                    disabled={busy}
                    onClick={() => setBusinessType(niche)}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium ring-1 transition disabled:opacity-60 ${
                      active
                        ? "bg-white/10 text-white ring-white/25"
                        : "bg-white/[0.04] text-white/55 ring-white/10 hover:text-white/85"
                    }`}
                  >
                    {niche}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="territory-business-type"
                className="mb-1.5 block text-[12px] font-medium text-white/70"
              >
                Business type
              </label>
              <input
                id="territory-business-type"
                type="text"
                autoComplete="off"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={busy}
                placeholder="e.g. dentists, roofers, law firms"
                className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-white/30 disabled:opacity-60"
              />
            </div>
            <div>
              <label
                htmlFor="territory-location"
                className="mb-1.5 block text-[12px] font-medium text-white/70"
              >
                Location
              </label>
              <input
                id="territory-location"
                type="text"
                autoComplete="off"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={busy}
                placeholder="e.g. Austin, TX"
                className="w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:ring-white/30 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="bg-iridescent rounded-full px-5 py-2.5 text-sm font-medium text-ink transition disabled:opacity-60"
            >
              {busy ? "Claiming…" : "Claim territory"}
            </button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-[13px] text-blush">
            {error.text}
            {error.upgrade && (
              <>
                {" "}
                <Link href="/app/billing" className="text-lilac underline underline-offset-2">
                  Go to Plan
                </Link>
              </>
            )}
          </p>
        )}

        <p className="mt-3 text-[12px] leading-relaxed text-white/45">
          Every morning Everdeck runs a fresh hunt for each active territory — a new
          deck of leads waits for you without lifting a finger.
          {!engineAllowed && (
            <>
              {" "}
              Auto-hunting is a Pro feature —{" "}
              <Link href="/app/billing" className="text-lilac underline underline-offset-2">
                upgrade in Plan
              </Link>
              .
            </>
          )}
        </p>
      </div>

      {/* Claimed territories */}
      <section>
        <h2 className="text-[13px] font-medium uppercase tracking-wider text-white/45">
          Your territories
        </h2>

        {territories.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-carbon-panel p-10 text-center ring-1 ring-white/10">
            <MapPin className="mx-auto h-6 w-6 text-white/30" />
            <p className="mt-3 text-[13px] text-white/50">
              No territories yet — claim a niche and city above to put hunting on
              autopilot.
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {territories.map((t) => {
              const isPending = pendingId === t.id;
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-carbon-panel p-4 ring-1 ring-white/10"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                        t.active
                          ? "bg-mint/10 text-mint ring-mint/20"
                          : "bg-white/[0.04] text-white/40 ring-white/10"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium capitalize text-white">
                        {t.business_type}
                      </p>
                      <p className="truncate text-[12px] text-white/50">{t.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        t.active ? "bg-mint/15 text-mint" : "bg-white/10 text-white/45"
                      }`}
                    >
                      {t.active ? "Auto-hunting" : "Paused"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleActive(t)}
                      disabled={isPending}
                      className="rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/70 ring-1 ring-white/10 transition hover:text-white disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : t.active ? (
                        "Pause"
                      ) : (
                        "Resume"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(t)}
                      disabled={isPending}
                      aria-label={`Release ${t.business_type} in ${t.location}`}
                      className="rounded-full p-1.5 text-white/35 transition hover:bg-white/[0.06] hover:text-blush disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
