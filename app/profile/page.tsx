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
  bio?: string;
  linkedin_url?: string;
};

type ScoreEntry = {
  score: number;
  created_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [clickScores, setClickScores] = useState<ScoreEntry[]>([]);
  const [triviaScores, setTriviaScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user;
      if (!authUser) return;
      setUser(authUser);

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (prof) {
        setProfile(prof);
        setBio(prof.bio || "");
        setLinkedin(prof.linkedin_url || "");
      }

      // fetch click battle scores
      const { data: clicks } = await supabase
        .from("scores")
        .select("score, created_at")
        .eq("name", `${prof?.first_name} ${prof?.last_name}`)
        .order("score", { ascending: false })
        .limit(10);

      if (clicks) setClickScores(clicks);

      // fetch trivia scores
      const { data: trivia } = await supabase
        .from("trivia_scores")
        .select("score, created_at")
        .eq("name", `${prof?.first_name} ${prof?.last_name}`)
        .order("score", { ascending: false })
        .limit(10);

      if (trivia) setTriviaScores(trivia);
    };

    init();
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    await supabase
      .from("profiles")
      .update({ bio, linkedin_url: linkedin })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bestClick = clickScores.length > 0 ? clickScores[0].score : null;
  const bestTrivia = triviaScores.length > 0 ? triviaScores[0].score : null;

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white">Caricamento...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto pt-8">

        {/* BACK */}
        <Link href="/" className="text-slate-400 text-sm mb-6 block hover:text-white">
          ← Torna alla home
        </Link>

        {/* HEADER PROFILO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-slate-400 text-sm">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${profile?.company_color}`} />
                <span className="text-slate-300 text-sm">{profile?.company}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Best Click</p>
            <p className="text-4xl font-bold text-blue-400">
              {bestClick ?? "—"}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Best Trivia</p>
            <p className="text-4xl font-bold text-purple-400">
              {bestTrivia !== null ? `${bestTrivia}/10` : "—"}
            </p>
          </div>
        </div>

        {/* BIO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">Bio</h2>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Scrivi qualcosa su di te..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
          />
        </div>

        {/* LINKEDIN */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">LinkedIn</h2>
          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/tuonome"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>

        {/* SAVE */}
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-colors mb-8"
        >
          {saving ? "Salvataggio..." : saved ? "✓ Salvato!" : "Salva profilo"}
        </button>

        {/* STORICO PARTITE */}
        <div className="mb-6">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
            ⚡ Storico Click Battle
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {clickScores.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nessuna partita ancora</p>
            ) : (
              clickScores.map((s, i) => (
                <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">
                    {new Date(s.created_at).toLocaleDateString("it-IT")}
                  </span>
                  <span className="font-bold text-blue-400">{s.score}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
            🧠 Storico Trivia
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {triviaScores.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Nessuna partita ancora</p>
            ) : (
              triviaScores.map((s, i) => (
                <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">
                    {new Date(s.created_at).toLocaleDateString("it-IT")}
                  </span>
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