"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

type Question = {
  question: string;
  options: string[];
  answer: string;
};

type ScoreEntry = {
  name: string;
  score: number;
  user_id?: string;
  company?: string;
};

/* -----------------------------
   DOMANDE ITALIANE
------------------------------*/
const QUESTION_BANK: Question[] = [
  {
    question: "Qual è la capitale d'Italia?",
    options: ["Milano", "Roma", "Napoli", "Torino"],
    answer: "Roma",
  },
  {
    question: "Quanto fa 7 x 8?",
    options: ["54", "56", "58", "64"],
    answer: "56",
  },
  {
    question: "Chi ha dipinto la Gioconda?",
    options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
    answer: "Leonardo da Vinci",
  },
  {
    question: "Qual è il pianeta più grande del sistema solare?",
    options: ["Terra", "Marte", "Giove", "Saturno"],
    answer: "Giove",
  },
  {
    question: "Qual è la capitale della Francia?",
    options: ["Lione", "Parigi", "Marsiglia", "Nizza"],
    answer: "Parigi",
  },
  {
    question: "Quanti continenti ci sono?",
    options: ["5", "6", "7", "8"],
    answer: "7",
  },
  {
    question: "Qual è il risultato di 10 / 2?",
    options: ["2", "5", "10", "20"],
    answer: "5",
  },
  {
    question: "Quale linguaggio gira nei browser?",
    options: ["Python", "C++", "JavaScript", "Java"],
    answer: "JavaScript",
  },
  {
    question: "Chi ha creato React?",
    options: ["Google", "Meta", "Microsoft", "Amazon"],
    answer: "Meta",
  },
];

/* -----------------------------
   SHUFFLE
------------------------------*/
function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

/* -----------------------------
   COMPONENT
------------------------------*/
export default function Trivia() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);

  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const [view, setView] = useState<"global" | "company">("global");

  /* ---------------- AUTH ---------------- */
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

  /* ---------------- LEADERBOARD (ALLINEATA CLICK BATTLE) ---------------- */
  const fetchBoard = async (mode: "global" | "company") => {
    let query = supabase
      .from("trivia_scores")
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

    const { data, error } = await query;

    if (error) {
      console.error("Leaderboard error:", error);
      return;
    }

    if (data) setBoard(data);
  };

  useEffect(() => {
    if (!user) return;
    fetchBoard(view);
  }, [view, profile, user]);

  /* ---------------- AUTH ---------------- */
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

  /* ---------------- START GAME ---------------- */
  const startGame = () => {
    const selected = shuffle(QUESTION_BANK).slice(0, 10);

    setQuestions(selected);
    setIndex(0);
    setScore(0);
    setFinished(false);
    setSelected(null);
    setLocked(false);
  };

  /* ---------------- ANSWER ---------------- */
  const answer = (option: string) => {
    if (locked) return;

    const q = questions[index];

    setSelected(option);
    setLocked(true);

    const correct = option === q.answer;

    let newScore = score;
    if (correct) newScore++;

    setScore(newScore);

    setTimeout(() => {
      const next = index + 1;

      setSelected(null);
      setLocked(false);

      if (next >= questions.length) {
        setFinished(true);
        saveScore(newScore);
      } else {
        setIndex(next);
      }
    }, 900);
  };

  /* ---------------- SAVE SCORE (ALLINEATO CLICK BATTLE) ---------------- */
  const saveScore = async (finalScore: number) => {
    if (!user || !profile) return;

    const { error } = await supabase.from("trivia_scores").insert([
      {
        name: `${profile.first_name} ${profile.last_name}`,
        score: finalScore,
        user_id: user.id,
        company: profile.company,
      },
    ]);

    if (error) {
      console.error(error);
      return;
    }

    setTimeout(() => {
      fetchBoard(view);
    }, 300);
  };

  /* ---------------- UI ---------------- */
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

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

      <Link
        href="/"
        className="fixed top-4 left-4 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-sm"
      >
        ← Home
      </Link>

      <div className="max-w-sm mx-auto pt-10">

        {/* HEADER */}
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
        {!questions.length && !finished && (
          <button
            onClick={startGame}
            className="w-full bg-blue-600 py-6 rounded-2xl font-bold mb-6"
          >
            🧠 Start Trivia
          </button>
        )}

        {/* GAME */}
        {!finished && questions.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-sm mb-4">
              {questions[index]?.question}
            </p>

            <div className="space-y-2">
              {questions[index]?.options.map((o) => (
                <button
                  key={o}
                  onClick={() => answer(o)}
                  className={`w-full py-2 rounded-xl transition
                    ${
                      locked
                        ? o === questions[index]?.answer
                          ? "bg-green-600"
                          : o === selected
                          ? "bg-red-600"
                          : "bg-slate-800 opacity-60"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                >
                  {o}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-500 mt-4">
              Score: {score}
            </p>
          </div>
        )}

        {/* END */}
        {finished && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-slate-400 mb-2">Game finished</p>
            <p className="text-4xl font-bold mb-4">{score}</p>

            <button
              onClick={startGame}
              className="w-full bg-blue-600 py-3 rounded-xl font-bold"
            >
              🔁 Play again
            </button>
          </div>
        )}

        {/* TOGGLE */}
        <div className="flex gap-2 mt-6 mb-3">
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

        {/* LEADERBOARD (ALLINEATA CLICK BATTLE) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {board.map((b, i) => (
            <div
              key={i}
              className="flex justify-between px-4 py-3 border-b border-slate-800"
            >
              <span>{b.name}</span>
              <span className="font-bold">{b.score}</span>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}