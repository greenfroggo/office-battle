"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
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
  const [time, setTime] = useState(15);
  const [board, setBoard] = useState<ScoreEntry[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    const channel = supabase
      .channel("trivia-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "trivia_scores" }, () => {
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
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setScore(0);
    setCurrent(0);
    setSelected(null);
    setFinished(false);
    setStarted(true);
    startTimer();
  };

  const startTimer = () => {
    setTime(15);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleNext(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleAnswer = (option: string) => {
    if (selected) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(option);
    const correct = option === questions[current].answer;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => handleNext(option), 1000);
  };

  const handleNext = (option: string | null) => {
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

  const saveScore = async () => {
    if (!user) return;
    await supabase.from("trivia_scores").insert([{ name: user, score: score + (selected === questions[current]?.answer ? 1 : 0) }]);
    fetchBoard();
  };

  // LOGIN
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 w-full max-w-sm shadow-2xl">
          <div className="mb-8 text-center">
            <span className="text-3xl">🧠</span>
            <h1 className="text-2xl font-bold text-white mt-2">Trivia Battle</h1>
            <p className="text-slate-400 text-sm mt-1">10 domande, 15 secondi ciascuna</p>
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
            Entra →
          </button>
        </div>
      </main>
    );
  }

  // GAME
  if (started && questions.length > 0) {
    const q = questions[current];
    const progress = ((current) / questions.length) * 100;
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="max-w-lg mx-auto pt-8">

          {/* Progress */}
          <div className="flex justify-between text-slate-400 text-sm mb-2">
            <span>Domanda {current + 1} di {questions.length}</span>
            <span className={`font-bold ${time <= 5 ? "text-red-400" : "text-white"}`}>⏱ {time}s</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
            <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Timer bar */}
          <div className="w-full bg-slate-800 rounded-full h-1 mb-8">
            <div
              className={`h-1 rounded-full transition-all duration-1000 ${time <= 5 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${(time / 15) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <p className="text-lg font-semibold leading-relaxed">{q.question}</p>
          </div>

          {/* Score */}
          <div className="text-center mb-4">
            <span className="text-slate-400 text-sm">Punteggio: </span>
            <span className="text-white font-bold">{score}</span>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {q.options.map((option) => {
              let style = "bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800";
              if (selected) {
                if (option === q.answer) style = "bg-green-900 border border-green-500";
                else if (option === selected) style = "bg-red-900 border border-red-500";
                else style = "bg-slate-900 border border-slate-700 opacity-50";
              }
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left px-5 py-4 rounded-xl font-medium transition-all ${style}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // HOME / FINISHED
  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-sm mx-auto pt-10">

        <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm mb-6 block">← Torna ai giochi</Link>

        <div className="mb-6 text-center">
          <span className="text-4xl">🧠</span>
          <h1 className="text-2xl font-bold mt-2">Trivia Battle</h1>
          <p className="text-slate-400 text-sm mt-1">Benvenuto, {user}</p>
        </div>

        {finished && (
          <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6 text-center">
            <p className="text-blue-300 text-sm">Hai risposto correttamente</p>
            <p className="text-4xl font-bold text-white">{score} / 10</p>
            {score >= 8 && <p className="text-yellow-400 text-sm mt-1">🏆 Ottimo risultato!</p>}
            {score >= 5 && score < 8 && <p className="text-green-400 text-sm mt-1">👍 Buon lavoro!</p>}
            {score < 5 && <p className="text-slate-400 text-sm mt-1">💪 Riprova!</p>}
          </div>
        )}

        <button onClick={startGame} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl text-lg transition-colors mb-8 shadow-lg shadow-blue-900">
          {finished ? "🔄 Gioca ancora" : "🧠 Inizia la Trivia"}
        </button>

        {/* Leaderboard */}
        <div>
          <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">Classifica Trivia</h2>
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
                  <span className="text-white font-bold">{b.score}/10</span>
                </div>
              ))
            )}
          </div>
        </div>

        <button onClick={() => { localStorage.removeItem("user"); setUser(null); }} className="w-full text-slate-600 hover:text-slate-400 text-sm mt-6 transition-colors">
          Cambia utente
        </button>
      </div>
    </main>
  );
}