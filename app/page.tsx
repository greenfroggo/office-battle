"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  // 🔐 AUTH CHECK
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    init();
  }, []);

  // 🔑 LOGIN GOOGLE
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // 🔐 LOGIN SCREEN
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-6">
            ⚡ Office Battle
          </h1>

          <button
            onClick={login}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
          >
            Continue with Google
          </button>
        </div>
      </main>
    );
  }

  // 🏠 HOME HUB (SOLO GIOCHI)
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto pt-10">

        {/* USER HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-slate-400 text-sm">Welcome</p>
            <h1 className="text-xl font-bold">
              {user.user_metadata?.full_name || user.email}
            </h1>
          </div>

          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </div>

        {/* GAMES GRID */}
        <p className="text-slate-400 text-xs uppercase mb-3 tracking-widest">
          Select Game
        </p>

        <div className="grid gap-4">

          <Link
            href="/click-battle"
            className="bg-blue-600 hover:bg-blue-500 p-6 rounded-2xl font-bold text-center"
          >
            ⚡ Click Battle
            <p className="text-xs text-blue-200 mt-1">10 seconds speed game</p>
          </Link>

          <Link
            href="/trivia"
            className="bg-purple-600 hover:bg-purple-500 p-6 rounded-2xl font-bold text-center"
          >
            🧠 Trivia Battle
            <p className="text-xs text-purple-200 mt-1">10 questions quiz</p>
          </Link>

        </div>
      </div>
    </main>
  );
}