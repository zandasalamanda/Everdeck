import { SignIn } from "@clerk/nextjs";

import Logo from "@/components/marketing/Logo";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-carbon px-5">
      <a href="/" className="flex items-center gap-2 text-cloud">
        <Logo gradient className="h-7 w-7" />
        <span className="text-lg font-medium tracking-tight">Everdeck</span>
      </a>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-carbon-panel ring-1 ring-white/10 shadow-lift",
          },
        }}
      />
    </main>
  );
}
