"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

type ScoreEntry = {
  id?: number;
  name: string;
  score: number;
  company?: string;
  user_id?: string;
};

export default function ClickBattle() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);
  const [clickAnim, setClickAnim] = useState(false);

  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [view, setView] = useState<"global" | "company">("global");

  const scoreRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ---------------- AUTH ----------------
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

  // ---------------- BOARD ----------------
  const fetchBoard = async (mode: "global" | "company") => {
    let query = supabase
      .from("scores")
      .select("*")
      .not("user_id", "is", null)
      .order("score", { ascending: false })
      .limit(50);

    if (mode === "company") {
      const company = profile?.company;
      if (!company) {
        setBoard([]);
        return;
      }

      query = query.eq("company", company);
    }

    const { data } = await query;
    if (data) setBoard(data);
  };

  useEffect(() => {
    fetchBoard(view);
  }, [view, profile]);

  useEffect(() => {
    const channel = supabase
      .channel("scores-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        () => fetchBoard(view)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [view, profile]);

  // ---------------- AUTH ACTIONS ----------------
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

  // ---------------- GAME ----------------
  const startGame = () => {
    setStarted(true);
    setScore(0);
    setTime(10);
    scoreRef.current = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setStarted(false);
          saveScore(scoreRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const hit = () => {
    if (!started) return;

    scoreRef.current += 1;
    setScore(scoreRef.current);

    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 100);
  };

  const saveScore = async (finalScore: number) => {
    if (!user || !profile) return;

    await supabase.from("scores").insert([
      {
        name: `${profile.first_name} ${profile.last_name}`,
        score: finalScore,
        company: profile.company,
        user_id: user.id,
      },
    ]);

    fetchBoard(view);
  };

  const progress = (time / 10) * 100;

  // ---------------- LOGIN ----------------
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

  // ---------------- GAME ACTIVE ----------------
  if (started) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

        <Link
          href="/"
          className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm"
        >
          ← Home
        </Link>

        <div className="max-w-sm mx-auto pt-10 text-center">

          <p className="text-slate-400">Score</p>

          <p
            className={`text-7xl font-black transition-transform ${
              clickAnim ? "scale-125" : "scale-100"
            }`}
          >
            {score}
          </p>

          <div className="w-full bg-slate-800 h-2 rounded-full my-4">
            <div
              className="h-2 bg-blue-500 transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-slate-400 mb-6">{time}s remaining</p>

          <button
            onClick={hit}
            className="w-full py-12 text-2xl font-black rounded-3xl bg-blue-600 active:scale-95"
          >
            ⚡ CLICK ⚡
          </button>

        </div>
      </main>
    );
  }

  // ---------------- MAIN MENU ----------------
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

      <Link
        href="/"
        className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm"
      >
        ← Home
      </Link>

      <div className="max-w-sm mx-auto pt-10">

        {/* HEADER (SHARED STYLE CON TRIVIA) */}
        <div className="flex justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm">Player</p>
            <h1 className="font-bold">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-xs text-slate-400">{profile?.company}</p>
          </div>

          <button onClick={logout} className="text-sm text-slate-400">
            Logout
          </button>
        </div>

        {/* START */}
        <button
          onClick={startGame}
          className="w-full bg-blue-600 py-6 rounded-2xl font-bold mb-6"
        >
          ⚡ Start Click Battle
        </button>

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

        {/* LEADERBOARD (STANDARDIZZATA) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          {board.map((b, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3 border-b border-slate-800"
            >
              <div className="flex items-center gap-3 flex-1">

                <span className="text-slate-500 text-sm w-6">
                  {i + 1}.
                </span>

                {b.user_id ? (
                  <Link
                    href={`/user/${b.user_id}`}
                    className="text-slate-300 hover:text-white"
                  >
                    {b.name}
                  </Link>
                ) : (
                  <span className="text-slate-300">
                    {b.name}
                  </span>
                )}

              </div>

              <span className="text-xs text-slate-400 mr-4">
                {b.company}
              </span>

              <span className="font-bold">
                {b.score}
              </span>
            </div>
          ))}

        </div>

      </div>
    </main>
  );
}