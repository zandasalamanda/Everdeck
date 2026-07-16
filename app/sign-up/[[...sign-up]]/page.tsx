import { SignUp } from "@clerk/nextjs";

import AuthBackdrop from "@/components/marketing/AuthBackdrop";

export default function SignUpPage() {
  return (
    <AuthBackdrop>
      <SignUp />
    </AuthBackdrop>
  );
}
