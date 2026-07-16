"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { GATE_COOKIE, gateToken, sitePassword } from "@/lib/gate";

export async function unlock(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "");
  // Same-origin relative paths only.
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";

  if (password === sitePassword()) {
    (await cookies()).set(GATE_COOKIE, await gateToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    redirect(next);
  }

  redirect(`/unlock?error=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
}
