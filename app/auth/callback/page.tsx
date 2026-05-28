"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Auth callback error:", error.message);
      }

      router.push("/");
    };

    handleCallback();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950">
      <p className="text-white text-sm">Accesso in corso...</p>
    </main>
  );
}