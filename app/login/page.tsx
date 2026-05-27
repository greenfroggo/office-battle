"use client";

import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <button
        onClick={loginWithGoogle}
        className="rounded-xl bg-black px-6 py-3 text-white"
      >
        Continua con Google
      </button>
    </main>
  );
}