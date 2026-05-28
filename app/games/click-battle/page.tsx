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

type Particle = {
  id: number;
  x: number;
  y: number;
};

export default function ClickBattle() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);
  const [clickAnim, setClickAnim] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Particle[]>([]);
  const particleId = useRef(0);

  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [view, setView] = useState<"global" | "company">("global");

  const scoreRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchBoard = async (mode: "global" | "company") => {
    let query = supabase
      .from("scores")
      .select("*")
      .not("user_id", "is", null)
      .order("score", { ascending: false })
      .limit(50);

    if (mode === "company") {
      const company = profile?.company;
      if (!company) { setBoard([]); return; }
      query = query.eq("company", company);
    }

    const { data } = await query;
    if (data) setBoard(data);
  };

  useEffect(() => { fetchBoard(view); }, [view, profile]);

  useEffect(() => {
    const channel = supabase
      .channel("scores-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => fetchBoard(view))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [view, profile]);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const startGame = () => {
    setStarted(true);
    setScore(0);
    setTime(10);
    scoreRef.current = 0;
    setParticles([]);
    setRipples([]);

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

  const hit = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!started) return;

    scoreRef.current += 1;
    setScore(scoreRef.current);

    // click animation
    setClickAnim(true);
    setTimeout(() => setClickAnim(false), 120);

    // ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = particleId.current++;

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);

    // floating +1 particles
    setParticles((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 800);
  };

  const saveScore = async (finalScore: number) => {
    if (!user || !profile) return;

    await supabase.from("scores").insert([{
      name: `${profile.first_name} ${profile.last_name}`,
      score: finalScore,
      company: profile.company,
      user_id: user.id,
    }]);

    fetchBoard(view);
  };

  const progress = (time / 10) * 100;
  const isUrgent = time <= 3;

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <button onClick={login} className="bg-white text-black px-6 py-3 rounded-xl font-bold">
          Login with Google
        </button>
      </main>
    );
  }

  // GAME ACTIVE
  if (started) {
    return (
      <main className="min-h-screen bg-slate-950 text-white overflow-hidden relative">

        {/* BACKGROUND PULSE WAVES */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`absolute rounded-full border transition-all duration-1000 ${
              isUrgent ? "border-red-500/20" : "border-blue-500/10"
            }`}
            style={{
              width: `${200 + (10 - time) * 40}px`,
              height: `${200 + (10 - time) * 40}px`,
            }}
          />
          <div
            className={`absolute rounded-full border transition-all duration-1000 ${
              isUrgent ? "border-red-500/10" : "border-blue-500/5"
            }`}
            style={{
              width: `${350 + (10 - time) * 50}px`,
              height: `${350 + (10 - time) * 50}px`,
            }}
          />
          <div
            className={`absolute rounded-full transition-all duration-1000 ${
              isUrgent ? "bg-red-500/5" : "bg-blue-500/5"
            }`}
            style={{
              width: `${500 + (10 - time) * 30}px`,
              height: `${500 + (10 - time) * 30}px`,
            }}
          />
        </div>

        <Link href="/" className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm z-10">
          ← Home
        </Link>

        <div className="max-w-sm mx-auto pt-16 px-6 text-center relative z-10">

          {/* TIMER BAR */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Tempo</span>
              <span className={`font-bold transition-colors ${isUrgent ? "text-red-400" : "text-white"}`}>
                {time}s
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* SCORE */}
          <div className="mb-10">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Score</p>
            <p
              className={`font-black transition-all duration-100 ${
                clickAnim ? "scale-125 text-blue-300" : "scale-100 text-white"
              }`}
              style={{ fontSize: "5rem", lineHeight: 1 }}
            >
              {score}
            </p>
          </div>

          {/* CLICK BUTTON */}
          <div className="relative">
            {/* ripple effects */}
            {ripples.map((r) => (
              <span
                key={r.id}
                className="absolute rounded-full bg-white/20 animate-ping pointer-events-none"
                style={{
                  left: r.x - 20,
                  top: r.y - 20,
                  width: 40,
                  height: 40,
                }}
              />
            ))}

            {/* floating +1 */}
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute text-blue-300 font-bold text-lg pointer-events-none select-none"
                style={{
                  left: p.x,
                  top: p.y,
                  animation: "floatUp 0.8s ease-out forwards",
                }}
              >
                +1
              </span>
            ))}

            <button
              onClick={hit}
              className={`w-full py-14 text-3xl font-black rounded-3xl transition-all duration-75 relative overflow-hidden ${
                clickAnim
                  ? isUrgent
                    ? "bg-red-500 scale-95"
                    : "bg-blue-400 scale-95"
                  : isUrgent
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              ⚡ CLICK ⚡
            </button>
          </div>

        </div>

        {/* CSS ANIMATION */}
        <style jsx>{`
          @keyframes floatUp {
            0% { opacity: 1; transform: translateY(0) scale(1); }
            100% { opacity: 0; transform: translateY(-60px) scale(1.5); }
          }
        `}</style>
      </main>
    );
  }

  // MAIN MENU
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

      <Link href="/" className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm">
        ← Home
      </Link>

      <div className="max-w-sm mx-auto pt-10">

        <div className="flex justify-between mb-6">
          <div>
            <p className="text-slate-400 text-sm">Player</p>
            <h1 className="font-bold">{profile?.first_name} {profile?.last_name}</h1>
            <p className="text-xs text-slate-400">{profile?.company}</p>
          </div>
          <button onClick={logout} className="text-sm text-slate-400">Logout</button>
        </div>

        <button onClick={startGame} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-bold mb-6 transition-colors">
          ⚡ Start Click Battle
        </button>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("global")}
            className={`flex-1 py-2 rounded-lg ${view === "global" ? "bg-blue-600" : "bg-slate-800"}`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setView("company")}
            className={`flex-1 py-2 rounded-lg ${view === "company" ? "bg-green-600" : "bg-slate-800"}`}
          >
            🏢 Company
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {board.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Nessun punteggio ancora</p>
          ) : (
            board.map((b, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-slate-500 text-sm w-6">{i + 1}.</span>
                  {b.user_id ? (
                    <Link href={`/user/${b.user_id}`} className="text-slate-300 hover:text-white">
                      {b.name}
                    </Link>
                  ) : (
                    <span className="text-slate-300">{b.name}</span>
                  )}
                </div>
                <span className="text-xs text-slate-400 mr-4">{b.company}</span>
                <span className="font-bold">{b.score}</span>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}