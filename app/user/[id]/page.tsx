"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  company_color: string;
  bio?: string;
  linkedin_url?: string;
};

export default function UserProfile() {
  const { id } = useParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clickScores, setClickScores] = useState<any[]>([]);
  const [triviaScores, setTriviaScores] = useState<any[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<"none" | "pending" | "accepted">("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user;
      if (authUser) setCurrentUser(authUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (prof) {
        setProfile(prof);

        const { data: clicks } = await supabase
          .from("scores")
          .select("score, created_at")
          .eq("name", `${prof.first_name} ${prof.last_name}`)
          .order("score", { ascending: false })
          .limit(5);
        if (clicks) setClickScores(clicks);

        const { data: trivia } = await supabase
          .from("trivia_scores")
          .select("score, created_at")
          .eq("name", prof.first_name)
          .order("score", { ascending: false })
          .limit(5);
        if (trivia) setTriviaScores(trivia);
      }

      if (authUser) {
        const { data: friendship } = await supabase
          .from("friendships")
          .select("*")
          .or(`and(sender_id.eq.${authUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${authUser.id})`)
          .maybeSingle();

        if (friendship) {
          setFriendshipStatus(friendship.status === "accepted" ? "accepted" : "pending");
        }
      }

      setLoading(false);
    };

    init();
  }, [id]);

  const sendFriendRequest = async () => {
    if (!currentUser) return;
    await supabase.from("friendships").insert([{
      sender_id: currentUser.id,
      receiver_id: id,
      status: "pending",
    }]);
    setFriendshipStatus("pending");
  };

  const bestClick = clickScores.length > 0 ? clickScores[0].score : null;
  const bestTrivia = triviaScores.length > 0 ? triviaScores[0].score : null;
  const isOwnProfile = currentUser?.id === id;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white text-sm">Caricamento...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white text-sm">Profilo non trovato</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto pt-8">

        <Link href="/" className="text-slate-400 text-sm mb-6 block hover:text-white">
          Torna alla home
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  {profile.first_name} {profile.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${profile.company_color}`} />
                  <span className="text-slate-300 text-sm">{profile.company}</span>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div>
                {friendshipStatus === "none" && (
                  <button
                    onClick={sendFriendRequest}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    + Connetti
                  </button>
                )}
                {friendshipStatus === "pending" && (
                  <span className="text-slate-400 text-sm border border-slate-700 px-4 py-2 rounded-xl">
                    In attesa...
                  </span>
                )}
                {friendshipStatus === "accepted" && (
                  <span className="text-green-400 text-sm border border-green-800 px-4 py-2 rounded-xl">
                    Connessi
                  </span>
                )}
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-slate-300 text-sm mt-4 leading-relaxed">{profile.bio}</p>
          )}

          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-blue-400 text-sm hover:text-blue-300">
              LinkedIn
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Best Click</p>
            <p className="text-4xl font-bold text-blue-400">{bestClick ?? "—"}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Best Trivia</p>
            <p className="text-4xl font-bold text-purple-400">
              {bestTrivia !== null ? `${bestTrivia}/10` : "—"}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Click Battle</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {clickScores.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nessuna partita ancora</p>
            ) : (
              clickScores.map((s, i) => (
                <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{new Date(s.created_at).toLocaleDateString("it-IT")}</span>
                  <span className="font-bold text-blue-400">{s.score}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Trivia</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {triviaScores.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nessuna partita ancora</p>
            ) : (
              triviaScores.map((s, i) => (
                <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{new Date(s.created_at).toLocaleDateString("it-IT")}</span>
                  <span className="font-bold text-purple-400">{s.score}/10</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
