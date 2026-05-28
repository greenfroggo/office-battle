"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

type ScoreEntry = {
  id?: number;
  name: string;
  score: number;
};

const QUESTIONS = [
  { question: "Qual è la capitale dell'Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra" },
  { question: "Quanti elementi ha la tavola periodica?", options: ["108", "118", "128", "98"], answer: "118" },
  { question: "Chi ha fondato Apple?", options: ["Bill Gates", "Steve Jobs", "Elon Musk", "Jeff Bezos"], answer: "Steve Jobs" },
  { question: "In che anno è caduto il muro di Berlino?", options: ["1987", "1991", "1989", "1993"], answer: "1989" },
  { question: "Qual è il paese più grande del mondo?", options: ["Canada", "Cina", "USA", "Russia"], answer: "Russia" },
  { question: "Quante corde ha una chitarra standard?", options: ["4", "5", "6", "7"], answer: "6" },
  { question: "Chi ha scritto 'La Divina Commedia'?", options: ["Petrarca", "Boccaccio", "Dante", "Leopardi"], answer: "Dante" },
  { question: "Qual è il pianeta più grande del sistema solare?", options: ["Saturno", "Giove", "Urano", "Nettuno"], answer: "Giove" },
  { question: "Cosa significa 'CEO'?", options: ["Chief Execution Order", "Chief Executive Officer", "Central Executive Operator", "Corporate Executive Officer"], answer: "Chief Executive Officer" },
  { question: "In che anno è stato fondato Google?", options: ["1996", "1998", "2000", "2002"], answer: "1998" },
  { question: "Qual è la valuta del Giappone?", options: ["Yuan", "Won", "Yen", "Baht"], answer: "Yen" },
  { question: "Quanti continenti ci sono sulla Terra?", options: ["5", "6", "7", "8"], answer: "7" },
  { question: "Chi ha dipinto la Gioconda?", options: ["Michelangelo", "Raffaello", "Leonardo da Vinci", "Caravaggio"], answer: "Leonardo da Vinci" },
  { question: "Qual è il linguaggio di programmazione più usato nel 2024?", options: ["Java", "Python", "JavaScript", "C++"], answer: "JavaScript" },
  { question: "Quanti giocatori ci sono in una squadra di calcio?", options: ["10", "11", "12", "9"], answer: "11" },
];

export default function Trivia() {
  const [user, setUser] = useState<string | null>(null);
  const [name, setName] = useState("");

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const [questions, setQuestions] = useState<typeof QUESTIONS>([]);
  const [current, setCurrent] = useState(0);

  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const [time, setTime] = useState(15);

  const [board, setBoard] = useState<ScoreEntry[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // LOAD USER
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(savedUser);
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    const { data } = await supabase
      .from("trivia_scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(10);

    if (data) setBoard(data);
  };

  // LOGIN
  const login = () => {
    if (!name.trim()) return;
    localStorage.setItem("user", name);
    setUser(name);
  };

  // START GAME
  const startGame = () => {
    const shuffled = [...QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    setQuestions(shuffled);
    setScore(0);
    setCurrent(0);
    setSelected(null);
    setLocked(false);
    setFinished(false);
    setStarted(true);

    startTimer();
  };

  // TIMER
  const startTimer = () => {
    setTime(15);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleNext();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // ANSWER
  const handleAnswer = (option: string) => {
    if (selected || locked) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const correctAnswer = questions[current]?.answer;

    setSelected(option);
    setLocked(true);

    if (option === correctAnswer) {
      setScore((s) => s + 1);
    }

    setTimeout(() => handleNext(), 800);
  };

  // NEXT QUESTION
  const handleNext = () => {
    setLocked(false);

    if (current + 1 >= questions.length) {
      setStarted(false);
      setFinished(true);
      saveScore();
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      startTimer();
    }
  };

  // SAVE SCORE
  const saveScore = async () => {
    if (!user) return;

    await supabase.from("trivia_scores").insert([
      {
        name: user,
        score,
      },
    ]);

    fetchBoard();
  };

  // SAFE PROGRESS
  const progress =
    questions.length > 0 ? (current / questions.length) * 100 : 0;

  const q = questions[current];

  // LOGIN SCREEN
  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-sm">
          <h1 className="text-white text-2xl font-bold mb-6 text-center">
            🧠 Trivia Battle
          </h1>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Inserisci nome"
            className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white mb-4"
          />

          <button
            onClick={login}
            className="w-full bg-blue-600 py-3 rounded-xl font-bold"
          >
            Entra →
          </button>

          <Link href="/" className="block text-center mt-4 text-slate-400 text-sm">
            ← Torna ai giochi
          </Link>
        </div>
      </main>
    );
  }

  // GAME SCREEN
  if (started && q) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-lg mx-auto pt-6">

          <Link href="/" className="text-slate-400 text-sm mb-4 block">
            ← Home
          </Link>

          {/* SCORE */}
          <div className="text-center mb-4">
            <div className="text-slate-400 text-sm">Score</div>
            <div className="text-2xl font-bold">
              {score} / {questions.length}
            </div>
          </div>

          {/* TIMER */}
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Domanda {current + 1}/10</span>
            <span>{time}s</span>
          </div>

          <div className="w-full bg-slate-800 h-1 mb-6">
            <div
              className="h-1 bg-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* QUESTION */}
          <div className="bg-slate-900 p-6 rounded-2xl mb-4">
            {q.question}
          </div>

          {/* OPTIONS */}
          <div className="grid gap-3">
            {q.options.map((opt) => {
              const correct = q.answer;
              const isCorrect = opt === correct;
              const isSelected = opt === selected;

              let style = "bg-slate-800 p-4 rounded-xl";

              if (locked) {
                if (isCorrect) {
                  style = "bg-green-600 p-4 rounded-xl font-bold";
                } else if (isSelected && !isCorrect) {
                  style = "bg-red-600 p-4 rounded-xl font-bold";
                } else {
                  style = "bg-slate-800 p-4 rounded-xl opacity-50";
                }
              }

              return (
                <button
                  key={opt}
                  onClick={() => handleAnswer(opt)}
                  disabled={locked}
                  className={style}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // HOME / RESULT
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-sm mx-auto pt-10">

        <Link href="/" className="text-slate-400 text-sm mb-4 block">
          ← Torna ai giochi
        </Link>

        <h1 className="text-2xl font-bold mb-2">🧠 Trivia Battle</h1>
        <p className="text-slate-400 mb-6">Giocatore: {user}</p>

        {finished && (
          <div className="bg-blue-900 p-4 rounded-xl mb-6">
            Score: {score}/{questions.length || 10}
          </div>
        )}

        <button
          onClick={startGame}
          className="w-full bg-blue-600 py-5 rounded-2xl font-bold mb-6"
        >
          {finished ? "Gioca ancora" : "Inizia"}
        </button>

        <div className="bg-slate-900 rounded-2xl p-4">
          {board.map((b, i) => (
            <div key={i} className="flex justify-between py-2">
              <span>
                {i + 1}. {b.name}
              </span>
              <span>{b.score}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}