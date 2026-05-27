"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ScoreEntry = {
  id?: number;
  name: string;
  score: number;
  company?: string;
};

export default function ClickBattle() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);

  const [heat, setHeat] = useState(0);
  const [clickAnim, setClickAnim] = useState(false);

  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [view, setView] = useState<"global" | "company">("global");

  const scoreRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🔐 AUTH + PROFILE
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

  // 🏆 LEADERBOARD
  const fetchBoard = async () => {
    let query = supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);

    if (view === "company" && profile?.company) {
      query = query.eq("company", profile.company);
    }

    const { data } = await query;

    if (data) setBoard(data);
  };

  useEffect(() => {
    fetchBoard();
  }, [view, profile]);

  useEffect(() => {
    const channel = supabase
      .channel("scores-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        fetchBoard
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🔑 LOGIN
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

  // 🎮 START GAME
  const startGame = () => {
    setStarted(true);
    setScore(0);
    setHeat(0);
    setTime(10);

    scoreRef.current = 0;

    intervalRef.current = setInterval(() => {
      setTime((t) => {
        const newTime = t - 1;

        setHeat((h) => Math.min(h + 10, 100));

        if (newTime <= 0) {
          clearInterval(intervalRef.current!);
          setStarted(false);
          saveScore(scoreRef.current);
          return 0;
        }

        return newTime;
      });
    }, 1000);
  };

  // ⚡ CLICK
  const hit = () => {
    if (!started) return;

    scoreRef.current += 1;
    setScore(scoreRef.current);

    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 120);
  };

  // 💾 SAVE SCORE (WITH COMPANY)
  const saveScore = async (finalScore: number) => {
    if (!user || !profile) return;

    await supabase.from("scores").insert([
      {
        name: profile.first_name + " " + profile.last_name,
        score: finalScore,
        company: profile.company,
      },
    ]);

    fetchBoard();
  };

  // 🎨 HEAT COLORS
  const heatColor =
    heat < 30
      ? "bg-blue-600"
      : heat < 60
      ? "bg-purple-600"
      : heat < 90
      ? "bg-orange-500"
      : "bg-red-600";

  const glow =
    heat < 30
      ? "shadow-blue-500"
      : heat < 60
      ? "shadow-purple-500"
      : heat < 90
      ? "shadow-orange-500"
      : "shadow-red-500";

  // 🔐 LOGIN SCREEN
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <button
          onClick={login}
          className="bg-white text-black px-6 py-3 rounded-xl font-bold"
        >
          Login with Google
        </button>
      </main>
    );
  }

  // 🎮 GAME SCREEN
  if (started) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-sm p-6">

          <Link href="/" className="text-slate-400 text-sm mb-4 block">
            ← Esci ai giochi
          </Link>

          <div className="text-center mb-6">
            <p className="text-slate-400">Score</p>
            <p className="text-7xl font-black">{score}</p>
          </div>

          <div className={`w-full h-2 rounded-full mb-4 ${heatColor}`} />

          <button
            onClick={hit}
            className={`w-full py-12 text-2xl font-black rounded-3xl text-white transition-all active:scale-95 ${heatColor} ${glow}`}
          >
            ⚡ CLICK ⚡
          </button>

          <p className="text-center mt-4 text-slate-400">
            Heat: {heat}%
          </p>
        </div>
      </main>
    );
  }

  // 🏠 HOME
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-sm mx-auto pt-10">

        <div className="flex justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm">Player</p>
            <h1 className="font-bold">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-xs text-slate-400">
              {profile?.company}
            </p>
          </div>

          <button onClick={logout} className="text-sm text-slate-400">
            Logout
          </button>
        </div>

        <button
          onClick={startGame}
          className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-bold mb-6"
        >
          ⚡ Start Click Battle
        </button>

        {/* TOGGLE LEADERBOARD */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("global")}
            className={`flex-1 py-2 rounded-lg text-sm ${
              view === "global"
                ? "bg-blue-600"
                : "bg-slate-800"
            }`}
          >
            🌍 Global
          </button>

          <button
            onClick={() => setView("company")}
            className={`flex-1 py-2 rounded-lg text-sm ${
              view === "company"
                ? "bg-green-600"
                : "bg-slate-800"
            }`}
          >
            🏢 Company
          </button>
        </div>

        {/* LEADERBOARD */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {board.map((b, i) => (
            <div
              key={i}
              className="flex justify-between px-4 py-3 border-b border-slate-800 last:border-0"
            >
              <span>
                {i + 1}. {b.name}
              </span>

              <span className="text-xs text-slate-400">
                {b.company}
              </span>

              <span className="font-bold">{b.score}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}