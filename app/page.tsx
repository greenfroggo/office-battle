"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  company_color: string;
};

const COMPANY_COLORS: Record<string, string> = {
  "McKinsey": "bg-blue-500",
  "BCG": "bg-green-500",
  "Bain": "bg-red-500",
  "Deloitte": "bg-yellow-500",
  "PwC": "bg-purple-500",
  "EY": "bg-orange-500",
  "KPMG": "bg-pink-500",
  "Other": "bg-slate-500",
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (!authUser) return;

      setUser(authUser);

      let { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (!prof) {
        const company = authUser.user_metadata?.company || "Other";
        const color = COMPANY_COLORS[company] || "bg-slate-500";

        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.full_name?.split(" ")[0] || "",
          last_name: authUser.user_metadata?.full_name?.split(" ")[1] || "",
          company,
          company_color: color,
        };

        await supabase.from("profiles").insert(newProfile);
        prof = newProfile;
      }

      setProfile(prof);
    };

    init();
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <button
          onClick={login}
          className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
        >
          Continua con Google
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto pt-10">

        {/* HEADER USER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p className="text-slate-400 text-sm">Welcome</p>
            <h1 className="text-xl font-bold">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-3 h-3 rounded-full ${profile?.company_color}`} />
              <p className="text-sm text-slate-300">{profile?.company}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-slate-400 hover:text-white">
              Profilo
            </Link>
            <button
              onClick={logout}
              className="text-sm text-slate-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {/* GAMES */}
        <p className="text-slate-400 text-xs uppercase mb-3 tracking-widest">
          Select Game
        </p>

        <div className="grid gap-4">
          <Link
            href="/games/click-battle"
            className="bg-blue-600 hover:bg-blue-500 p-6 rounded-2xl font-bold text-center"
          >
            ⚡ Click Battle
            <p className="text-xs text-blue-200 mt-1">
              10 second speed challenge
            </p>
          </Link>

          <Link
            href="/games/trivia"
            className="bg-purple-600 hover:bg-purple-500 p-6 rounded-2xl font-bold text-center"
          >
            🧠 Trivia Battle
            <p className="text-xs text-purple-200 mt-1">
              10 questions quiz
            </p>
          </Link>
        </div>

      </div>
    </main>
  );
}