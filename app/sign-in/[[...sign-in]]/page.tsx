import { SignIn } from "@clerk/nextjs";

import AuthBackdrop from "@/components/marketing/AuthBackdrop";

export default function SignInPage() {
  return (
    <AuthBackdrop>
      <SignIn />
    </AuthBackdrop>
  );
}
