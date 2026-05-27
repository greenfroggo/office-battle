"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type ScoreEntry = {
  id?: number;
  name: string;
  score: number;
  created_at?: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);

  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const scoreRef = useRef(0);
  const [board, setBoard] = useState<ScoreEntry[]>([]);

  // 🔐 AUTH CHECK
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    init();
    fetchBoard();
  }, []);

  // 📊 LEADERBOARD
  const fetchBoard = async () => {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);

    if (data) setBoard(data);
  };

  // realtime leaderboard
  useEffect(() => {
    const channel = supabase
      .channel("scores-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scores" },
        () => fetchBoard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // 🎮 GAME
  const startGame = () => {
    setStarted(true);
    setScore(0);
    setLastScore(null);
    scoreRef.current = 0;
    setTime(10);

    const interval = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setStarted(false);
          setLastScore(scoreRef.current);
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
  };

  // 💾 SAVE SCORE (Supabase user)
  const saveScore = async (finalScore: number) => {
    if (!user) return;

    await supabase.from("scores").insert([
      {
        name: user.user_metadata?.full_name || user.email,
        score: finalScore,
      },
    ]);

    fetchBoard();
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

  // 🎮 GAME SCREEN
  if (started) {
    const progress = (time / 10) * 100;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <p className="text-slate-400">Score</p>
            <p className="text-6xl font-bold text-white">{score}</p>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full mb-6">
            <div
              className="h-2 bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={hit}
            className="w-full bg-blue-600 text-white py-10 text-2xl font-bold rounded-2xl"
          >
            CLICK ⚡
          </button>
        </div>
      </main>
    );
  }

  // 🏠 HOME
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-sm mx-auto pt-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-slate-400 text-sm">Welcome</p>
            <h1 className="text-xl font-bold">
              {user?.user_metadata?.full_name || user?.email}
            </h1>
          </div>

          <button
            onClick={logout}
            className="text-sm text-slate-400 hover:text-white"
          >
            Logout
          </button>
        </div>

        {lastScore !== null && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6 text-center">
            <p className="text-blue-300 text-sm">Last score</p>
            <p className="text-4xl font-bold">{lastScore}</p>
          </div>
        )}

        {/* GAME BUTTON */}
        <button
          onClick={startGame}
          className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-bold mb-8"
        >
          ⚡ Start Click Battle
        </button>

        {/* LEADERBOARD */}
        <div>
          <h2 className="text-slate-400 text-xs mb-3 uppercase">
            Leaderboard
          </h2>

          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
            {board.map((b, i) => (
              <div
                key={i}
                className="flex justify-between px-4 py-3 border-b border-slate-800 last:border-0"
              >
                <span className="text-slate-300">
                  {i + 1}. {b.name}
                </span>
                <span className="font-bold">{b.score}</span>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/trivia"
          className="block mt-6 text-center text-slate-500"
        >
          Go to Trivia →
        </Link>
      </div>
    </main>
  );
}