import type { ReactNode } from "react";

import Logo from "@/components/marketing/Logo";

const BACKGROUND_URL =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260611_133301_d5f2a94a-b22e-4e4a-a6b6-eacdddf1f5b0.png&w=1280&q=85";
const GRASS_URL =
  "https://res.cloudinary.com/dy5er7kv5/image/upload/q_auto/f_auto/v1781191264/grass_eam204.png";

/** Sky + grass backdrop shared by the Clerk auth pages, matching the hero. */
export default function AuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-[100svh] flex-col items-center justify-center gap-7 overflow-hidden bg-cover bg-center px-5 py-16"
      style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
    >
      <a href="/" className="relative z-20 flex items-center gap-2 text-ink">
        <Logo gradient className="h-7 w-7" />
        <span className="text-lg font-medium tracking-tight">Everdeck</span>
      </a>
      <div className="relative z-20">{children}</div>
      <img
        src={GRASS_URL}
        alt=""
        draggable={false}
        className="pointer-events-none absolute bottom-0 left-0 z-10 w-full select-none"
      />
    </main>
  );
}
