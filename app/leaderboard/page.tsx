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
};

export default function Leaderboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [clickBoard, setClickBoard] = useState<ScoreEntry[]>([]);
  const [triviaBoard, setTriviaBoard] = useState<ScoreEntry[]>([]);

  const [game, setGame] = useState<"click" | "trivia">("click");
  const [view, setView] = useState<"global" | "company">("global");

  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

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
      await fetchFriendships(authUser.id);
    };

    init();
  }, []);

  const fetchFriendships = async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (!data) return;

    const connected = new Set<string>();
    const pending = new Set<string>();

    data.forEach((f) => {
      const otherId = f.sender_id === userId ? f.receiver_id : f.sender_id;
      if (f.status === "accepted") connected.add(otherId);
      else pending.add(otherId);
    });

    setConnectedIds(connected);
    setPendingIds(pending);
  };

  const fetchBoards = async (mode: "global" | "company") => {
    let clickQuery = supabase
      .from("scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(50);

    let triviaQuery = supabase
      .from("trivia_scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(50);

    if (mode === "company" && profile?.company) {
      clickQuery = clickQuery.eq("company", profile.company);
      triviaQuery = triviaQuery.eq("company", profile.company);
    }

    const [clickRes, triviaRes] = await Promise.all([clickQuery, triviaQuery]);

    setClickBoard(clickRes.data || []);
    setTriviaBoard(triviaRes.data || []);
  };

  useEffect(() => {
    fetchBoards(view);
  }, [view, profile]);

  const sendRequest = async (receiverId: string) => {
    if (!user) return;
    await supabase.from("friendships").insert([{
      sender_id: user.id,
      receiver_id: receiverId,
      status: "pending",
    }]);
    setPendingIds((prev) => new Set([...prev, receiverId]));
  };

  const board = game === "click" ? clickBoard : triviaBoard;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

      <Link href="/" className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm">
        ← Home
      </Link>

      <div className="max-w-md mx-auto pt-10">

        <h1 className="text-2xl font-bold mb-6">🏆 Leaderboard</h1>

        {/* GAME TAB */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setGame("click")}
            className={`flex-1 py-2 rounded-lg font-semibold ${game === "click" ? "bg-blue-600" : "bg-slate-800"}`}
          >
            ⚡ Click Battle
          </button>
          <button
            onClick={() => setGame("trivia")}
            className={`flex-1 py-2 rounded-lg font-semibold ${game === "trivia" ? "bg-purple-600" : "bg-slate-800"}`}
          >
            🧠 Trivia
          </button>
        </div>

        {/* VIEW TAB */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView("global")}
            className={`flex-1 py-2 rounded-lg text-sm ${view === "global" ? "bg-blue-600" : "bg-slate-800"}`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setView("company")}
            className={`flex-1 py-2 rounded-lg text-sm ${view === "company" ? "bg-green-600" : "bg-slate-800"}`}
          >
            🏢 Company
          </button>
        </div>

        {/* LIST */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {board.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Nessun punteggio ancora</p>
          ) : (
            board.map((s, i) => {
              const isMe = s.user_id === user?.id;
              const isConnected = s.user_id ? connectedIds.has(s.user_id) : false;
              const isPending = s.user_id ? pendingIds.has(s.user_id) : false;

              return (
                <div key={i} className={`flex justify-between items-center px-4 py-3 border-b border-slate-800 last:border-0 ${isMe ? "bg-blue-950" : ""}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm w-5">{i + 1}.</span>
                      {s.user_id ? (
                        <Link href={`/user/${s.user_id}`} className="text-slate-300 hover:text-white hover:underline">
                          {s.name}
                        </Link>
                      ) : (
                        <span className="text-slate-300">{s.name}</span>
                      )}
                    </div>
                    {s.company && (
                      <span className="text-xs text-slate-500 ml-7 block">{s.company}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {game === "trivia" ? `${s.score}/10` : s.score}
                    </span>

                    {s.user_id && !isMe && (
                      <>
                        {isConnected ? (
                          <span className="text-xs border border-green-700 text-green-400 px-3 py-1 rounded-lg">
                            ✓ Connessi
                          </span>
                        ) : isPending ? (
                          <span className="text-xs border border-slate-700 text-slate-400 px-3 py-1 rounded-lg">
                            In attesa...
                          </span>
                        ) : (
                          <button
                            onClick={() => sendRequest(s.user_id!)}
                            className="text-xs bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            + Connetti
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </main>
  );
}