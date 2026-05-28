"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

type ScoreEntry = {
  id?: number;
  name: string;
  score: number;
  user_id?: string;
  company?: string;
  game?: "click" | "trivia";
};

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [view, setView] = useState<"global" | "company">("global");

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!authUser) return;

      setUser(authUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setProfile(prof);
    };

    init();
  }, []);

  /* ---------------- FETCH LEADERBOARD ---------------- */
  const fetchScores = async (mode: "global" | "company") => {
    const [clickRes, triviaRes] = await Promise.all([
      supabase.from("scores").select("*"),
      supabase.from("trivia_scores").select("*"),
    ]);

    let combined: ScoreEntry[] = [
      ...(clickRes.data || []).map((s) => ({
        ...s,
        game: "click" as const,
      })),
      ...(triviaRes.data || []).map((s) => ({
        ...s,
        game: "trivia" as const,
      })),
    ];

    if (mode === "company" && profile?.company) {
      combined = combined.filter(
        (s) => s.company === profile.company
      );
    }

    combined.sort((a, b) => b.score - a.score);

    setScores(combined.slice(0, 50));
  };

  useEffect(() => {
    fetchScores(view);
  }, [view, profile]);

  /* ---------------- UI ---------------- */
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

      {/* BACK */}
      <Link
        href="/"
        className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm"
      >
        ← Home
      </Link>

      <div className="max-w-md mx-auto pt-10">

        {/* TITLE */}
        <h1 className="text-2xl font-bold mb-4">🏆 Leaderboard</h1>

        {/* TOGGLE */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("global")}
            className={`flex-1 py-2 rounded-lg ${
              view === "global" ? "bg-blue-600" : "bg-slate-800"
            }`}
          >
            🌍 Global
          </button>

          <button
            onClick={() => setView("company")}
            className={`flex-1 py-2 rounded-lg ${
              view === "company" ? "bg-green-600" : "bg-slate-800"
            }`}
          >
            🏢 Company
          </button>
        </div>

        {/* LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {scores.map((s, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3 border-b border-slate-800"
            >

              {/* LEFT SIDE */}
              <div className="flex flex-col">

                <div className="flex items-center gap-2">

                  <span className="text-slate-500 text-sm w-6">
                    {i + 1}.
                  </span>

                  {/* USER CLICKABLE */}
                  {(s as any).user_id ? (
                    <Link
                      href={`/user/${(s as any).user_id}`}
                      className="text-slate-300 hover:text-white"
                    >
                      {s.name}
                    </Link>
                  ) : (
                    <span className="text-slate-300">{s.name}</span>
                  )}

                  {/* GAME BADGE */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      s.game === "click"
                        ? "bg-blue-600/30 text-blue-300"
                        : "bg-purple-600/30 text-purple-300"
                    }`}
                  >
                    {s.game === "click" ? "⚡ Click" : "🧠 Trivia"}
                  </span>

                </div>

                {/* COMPANY */}
                {s.company && (
                  <span className="text-xs text-slate-500 ml-6">
                    🏢 {s.company}
                  </span>
                )}

              </div>

              {/* SCORE */}
              <span className="font-bold">{s.score}</span>

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}