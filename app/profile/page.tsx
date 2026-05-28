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

const COMPANIES = [
  "McKinsey",
  "BCG",
  "Bain",
  "Deloitte",
  "PwC",
  "EY",
  "KPMG",
  "Accenture",
  "Capgemini",
  "BIP",
  "Roland Berger",
  "Oliver Wyman",
  "Kearney",
  "Strategy&",
  "Other",
];

const COMPANY_COLORS: Record<string, string> = {
  McKinsey: "bg-blue-500",
  BCG: "bg-green-500",
  Bain: "bg-red-500",
  Deloitte: "bg-yellow-500",
  PwC: "bg-purple-500",
  EY: "bg-orange-500",
  KPMG: "bg-pink-500",
  Other: "bg-slate-500",
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

      const { data: clicks } = await supabase
        .from("scores")
        .select("score, created_at")
        .eq("user_id", authUser.id)
        .order("score", { ascending: false })
        .limit(10);

      if (clicks) setClickScores(clicks);

      const { data: trivia } = await supabase
        .from("trivia_scores")
        .select("score, created_at")
        .eq("user_id", authUser.id)
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
      .update({
        bio,
        linkedin_url: linkedin,
      })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateCompany = async (company: string) => {
    if (!user) return;

    const color = COMPANY_COLORS[company] || "bg-slate-500";

    setProfile((prev) =>
      prev ? { ...prev, company, company_color: color } : prev
    );

    await supabase
      .from("profiles")
      .update({ company, company_color: color })
      .eq("id", user.id);
  };

  const bestClick = clickScores.length ? clickScores[0].score : null;
  const bestTrivia = triviaScores.length ? triviaScores[0].score : null;

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Caricamento...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto pt-8">

        <Link href="/" className="text-slate-400 text-sm mb-6 block hover:text-white">
          ← Torna alla home
        </Link>

        {/* HEADER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">

            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
              {profile?.first_name?.[0]}
              {profile?.last_name?.[0]}
            </div>

            <div className="flex-1">

              {/* NAME + LINKEDIN */}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {profile?.first_name} {profile?.last_name}
                </h1>

                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-blue-400 transition"
                  >
                    {/* LinkedIn SVG */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
              </div>

              <p className="text-slate-400 text-sm">{profile?.email}</p>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    COMPANY_COLORS[profile?.company || "Other"]
                  }`}
                />
                <span className="text-slate-300 text-sm">
                  {profile?.company}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COMPANY */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xs text-slate-400 uppercase mb-2">
            Azienda
          </h2>

          <select
            value={profile?.company || "Other"}
            onChange={(e) => updateCompany(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
          >
            {COMPANIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs">Best Click</p>
            <p className="text-4xl font-bold text-blue-400">
              {bestClick ?? "—"}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 text-xs">Best Trivia</p>
            <p className="text-4xl font-bold text-purple-400">
              {bestTrivia !== null ? `${bestTrivia}/10` : "—"}
            </p>
          </div>
        </div>

        {/* BIO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
          <h2 className="text-xs text-slate-400 uppercase mb-2">
            Bio
          </h2>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            rows={3}
          />
        </div>

        {/* LINKEDIN */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xs text-slate-400 uppercase mb-2">
            LinkedIn
          </h2>

          <input
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        {/* SAVE */}
        <button
          onClick={saveProfile}
          className="w-full bg-blue-600 py-4 rounded-2xl font-bold"
        >
          {saving ? "Salvataggio..." : saved ? "✓ Salvato!" : "Salva profilo"}
        </button>

      </div>
    </main>
  );
}