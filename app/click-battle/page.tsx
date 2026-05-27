"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

type ScoreEntry = {
  id?: number;
  name: string;
  score: number;
};

export default function ClickBattle() {
  const [user, setUser] = useState<any>(null);

  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);

  const [heat, setHeat] = useState(0); // 🔥 new
  const [clickAnim, setClickAnim] = useState(false); // 💥 animation trigger

  const scoreRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [board, setBoard] = useState<ScoreEntry[]>([]);

  // AUTH
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    init();
    fetchBoard();
  }, []);

  // LEADERBOARD
  const fetchBoard = async () => {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);

    if (data) setBoard(data);
  };

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel("scores-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, fetchBoard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // LOGIN
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
  };

  // GAME START
  const startGame = () => {
    setStarted(true);
    setScore(0);
    setHeat(0);
    setTime(10);

    scoreRef.current = 0;

    intervalRef.current = setInterval(() => {
      setTime((t) => {
        const newTime = t - 1;

        // 🔥 heat increases as time goes down
        setHeat((h) => h + 10);

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

  // CLICK
  const hit = () => {
    if (!started) return;

    scoreRef.current += 1;
    setScore(scoreRef.current);

    // 💥 trigger animation
    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 120);
  };

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

  // COLOR SHIFT BASED ON HEAT
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

  // 🔐 LOGIN
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
    const progress = (time / 10) * 100;

    return (
      <main className={`min-h-screen flex items-center justify-center bg-slate-950 transition-all duration-300`}>
        <div className="w-full max-w-sm p-6">

          {/* SCORE */}
          <div className="text-center mb-6">
            <p className="text-slate-400">Score</p>
            <p
              className={`text-7xl font-black transition-transform duration-100 ${
                clickAnim ? "scale-125 text-white" : "scale-100"
              }`}
            >
              {score}
            </p>
          </div>

          {/* HEAT BAR */}
          <div className="w-full bg-slate-800 h-2 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-2 transition-all duration-300 ${heatColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* TIMER */}
          <p className="text-center text-slate-400 mb-6">
            Time: {time}s
          </p>

          {/* BUTTON */}
          <button
            onClick={hit}
            className={`w-full py-12 text-2xl font-black rounded-3xl text-white transition-all duration-150 active:scale-95 shadow-xl ${heatColor} ${glow}`}
          >
            ⚡ CLICK FASTER ⚡
          </button>

          {/* HEAT TEXT */}
          <p className="text-center mt-4 text-slate-500 text-sm">
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
              {user?.user_metadata?.full_name || user?.email}
            </h1>
          </div>

          <button onClick={logout} className="text-sm text-slate-400">
            Logout
          </button>
        </div>

        {/* START */}
        <button
          onClick={startGame}
          className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-bold mb-8 transition-all active:scale-95"
        >
          ⚡ Start Click Battle
        </button>

        {/* LEADERBOARD */}
        <div>
          <h2 className="text-slate-400 text-xs mb-3 uppercase">
            Leaderboard
          </h2>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {board.map((b, i) => (
              <div
                key={i}
                className="flex justify-between px-4 py-3 border-b border-slate-800 last:border-0"
              >
                <span>
                  {i + 1}. {b.name}
                </span>
                <span className="font-bold">{b.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}