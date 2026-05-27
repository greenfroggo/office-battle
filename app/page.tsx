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
  const [name, setName] = useState("");
  const [user, setUser] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(10);
  const [score, setScore] = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const scoreRef = useRef(0);
  const [board, setBoard] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    const { data } = await supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);
    if (data) setBoard(data);
  };

  useEffect(() => {
    const channel = supabase
      .channel("scores-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "scores" }, () => {
        fetchBoard();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const login = () => {
    if (!name.trim()) return;
    localStorage.setItem("user", name);
    setUser(name);
  };

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

  const saveScore = async (finalScore: number) => {
    if (!user) return;
    await supabase.from("scores").insert([{ name: user, score: finalScore }]);
    fetchBoard();
  };

  // LOGIN SCREEN
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-sm shadow-2xl">
          <div className="mb-8 text-center">
            <span className="text-3xl">⚡</span>
            <h1 className="text-2xl font-bold text-white mt-2">Office Battle</h1>
            <p className="text-slate-400 text-sm mt-1">Sfida i tuoi colleghi in tempo reale</p>
          </div>
          <label className="block text-slate-400 text-xs font-semibold uppercase tracking-widest mb-2">Il tuo nome</label>
          <input
            placeholder="Es. Marco Rossi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
          />
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors">
            Entra nell'ufficio →
          </button>
        </div>
      </main>
    );
  }

  // GAME SCREEN
  if (started) {
    const progress = (time / 10) * 100;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex justify-between text-slate-400 text-sm mb-2">
              <span>Tempo rimasto</span>
              <span className={`font-bold ${time <= 3 ? "text-red-400" : "text-white"}`}>{time}s</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${time <= 3 ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="text-center mb-8">
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Punteggio</p>
            <p className="text-7xl font-bold text-white">{score}</p>
          </div>
          <button onClick={hit} className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 active:bg-blue-700 text-white font-bold py-10 rounded-2xl text-2xl transition-all shadow-lg shadow-blue-900">
            CLICK ⚡
          </button>
        </div>
      </main>
    );
  }

  // HOME SCREEN
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-sm mx-auto pt-10">

        <div className="mb-8">
          <p className="text-slate-400 text-sm">Benvenuto,</p>
          <h1 className="text-2xl font-bold">{user}</h1>
        </div>

        {lastScore !== null && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6 text-center">
            <p className="text-blue-300 text-sm">Ultimo punteggio Click Battle</p>
            <p className="text-4xl font-bold text-white">{lastScore}</p>
          </div>
        )}

        {/* SELEZIONE GIOCHI */}
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Scegli il gioco</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={startGame}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 rounded-2xl text-center transition-colors shadow-lg shadow-blue-900"
          >
            <div className="text-3xl mb-1">⚡</div>
            <div className="text-sm font-bold">Click Battle</div>
            <div className="text-xs text-blue-300 mt-1">10 secondi</div>
          </button>

          <Link href="/trivia" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-6 rounded-2xl text-center transition-colors block">
            <div className="text-3xl mb-1">🧠</div>
            <div className="text-sm font-bold">Trivia</div>
            <div className="text-xs text-slate-400 mt-1">10 domande</div>
          </Link>
        </div>

        {/* LEADERBOARD */}
        <div>
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Classifica Click Battle</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {board.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">Nessun punteggio ancora</p>
            ) : (
              board.map((b, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 border-b border-slate-800 last:border-0 ${b.name === user ? "bg-blue-950" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-5 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-600"}`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <span className={`text-sm ${b.name === user ? "text-blue-300 font-semibold" : "text-slate-300"}`}>{b.name}</span>
                  </div>
                  <span className="text-white font-bold">{b.score}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={() => { localStorage.removeItem("user"); setUser(null); }}
          className="w-full text-slate-600 hover:text-slate-400 text-sm mt-6 transition-colors"
        >
          Cambia utente
        </button>

      </div>
    </main>
  );
}