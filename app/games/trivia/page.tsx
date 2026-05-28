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

const QUESTION_BANK: Question[] = [
  { question: "Cosa significa IPO?", options: ["Initial Public Offering", "International Payment Order", "Internal Profit Operation", "Indexed Portfolio Option"], answer: "Initial Public Offering" },
  { question: "Qual è la valuta ufficiale del Giappone?", options: ["Yuan", "Won", "Yen", "Baht"], answer: "Yen" },
  { question: "Cosa misura il PIL?", options: ["La popolazione attiva", "Il valore totale di beni e servizi prodotti", "Il debito pubblico", "Il tasso di inflazione"], answer: "Il valore totale di beni e servizi prodotti" },
  { question: "Cosa significa ROI?", options: ["Return on Investment", "Rate of Inflation", "Risk of Insolvency", "Revenue over Income"], answer: "Return on Investment" },
  { question: "Chi è il fondatore di Amazon?", options: ["Elon Musk", "Bill Gates", "Jeff Bezos", "Mark Zuckerberg"], answer: "Jeff Bezos" },
  { question: "Cosa fa la Banca Centrale Europea?", options: ["Finanzia le startup", "Gestisce la politica monetaria dell'eurozona", "Regola le borse europee", "Raccoglie tasse"], answer: "Gestisce la politica monetaria dell'eurozona" },
  { question: "Cosa si intende per 'bear market'?", options: ["Mercato in forte crescita", "Mercato stabile", "Mercato in declino prolungato", "Mercato ad alta volatilità"], answer: "Mercato in declino prolungato" },
  { question: "Cos'è un ETF?", options: ["Un tipo di obbligazione", "Un fondo negoziato in borsa", "Un indice azionario", "Una valuta digitale"], answer: "Un fondo negoziato in borsa" },
  { question: "Cosa significa EBITDA?", options: ["Earnings Before Interest, Taxes, Depreciation and Amortization", "Estimated Budget In Total Dollar Amount", "Equity Backed Investment and Tax Deduction Agreement", "Expected Business Income Tax and Depreciation Analysis"], answer: "Earnings Before Interest, Taxes, Depreciation and Amortization" },
  { question: "Quale indice rappresenta le 500 maggiori aziende quotate negli USA?", options: ["Dow Jones", "NASDAQ", "S&P 500", "Russell 2000"], answer: "S&P 500" },
  { question: "Cosa significa 'short selling'?", options: ["Vendere azioni rapidamente", "Vendere azioni prese in prestito scommettendo sul ribasso", "Acquistare azioni a breve termine", "Liquidare un portafoglio"], answer: "Vendere azioni prese in prestito scommettendo sul ribasso" },
  { question: "Cos'è il WACC?", options: ["Weighted Average Cost of Capital", "Weekly Adjusted Cash Conversion", "Working Asset Capital Calculation", "Wide Area Cost Controller"], answer: "Weighted Average Cost of Capital" },
  { question: "Quale azienda ha la maggiore capitalizzazione di mercato al mondo (2024)?", options: ["Apple", "Microsoft", "NVIDIA", "Amazon"], answer: "NVIDIA" },
  { question: "Cosa si intende per 'hedge fund'?", options: ["Un fondo pensionistico pubblico", "Un fondo comune standard", "Un fondo d'investimento speculativo con strategie avanzate", "Un ETF obbligazionario"], answer: "Un fondo d'investimento speculativo con strategie avanzate" },
  { question: "Cosa indica un P/E ratio elevato?", options: ["L'azienda è sottovalutata", "Gli investitori si aspettano alta crescita futura", "L'azienda ha molti debiti", "Il dividendo è alto"], answer: "Gli investitori si aspettano alta crescita futura" },
  { question: "Cosa significa 'liquidità' in finanza?", options: ["Il patrimonio immobiliare", "La facilità di convertire un asset in denaro", "Il capitale sociale", "Il fatturato annuo"], answer: "La facilità di convertire un asset in denaro" },
  { question: "Cosa fa un venture capitalist?", options: ["Investe in obbligazioni governative", "Finanzia startup ad alto potenziale in cambio di equity", "Gestisce fondi pensionistici", "Analizza mercati valutari"], answer: "Finanzia startup ad alto potenziale in cambio di equity" },
  { question: "Cos'è il 'burn rate'?", options: ["Il tasso di crescita mensile", "La velocità con cui una startup consuma il capitale", "Il margine operativo netto", "Il costo di acquisizione clienti"], answer: "La velocità con cui una startup consuma il capitale" },
  { question: "Cosa significa 'valuation' di una startup?", options: ["Il fatturato annuo", "Il numero di dipendenti", "La stima del valore totale dell'azienda", "Il patrimonio netto contabile"], answer: "La stima del valore totale dell'azienda" },
  { question: "Cosa si intende per 'Series A'?", options: ["Il primo round di finanziamento istituzionale", "La quotazione in borsa", "Un prestito bancario", "Il seed round iniziale"], answer: "Il primo round di finanziamento istituzionale" },
  { question: "Cos'è il 'churn rate'?", options: ["Il tasso di acquisizione clienti", "La percentuale di clienti che abbandonano il servizio", "Il margine lordo", "Il tasso di conversione"], answer: "La percentuale di clienti che abbandonano il servizio" },
  { question: "Cosa significa ARR in ambito SaaS?", options: ["Annual Recurring Revenue", "Average Return Rate", "Asset Revaluation Reserve", "Adjusted Revenue Report"], answer: "Annual Recurring Revenue" },
  { question: "Cosa fa la Federal Reserve?", options: ["Gestisce il bilancio federale USA", "È la banca centrale degli Stati Uniti", "Regola le borse americane", "Supervisiona le banche commerciali europee"], answer: "È la banca centrale degli Stati Uniti" },
  { question: "Cosa si intende per 'dividendo'?", options: ["Un tipo di obbligazione", "La quota di utili distribuita agli azionisti", "Il prezzo di emissione delle azioni", "Il valore nominale di un titolo"], answer: "La quota di utili distribuita agli azionisti" },
  { question: "Cosa indica il termine 'unicorno' nel mondo startup?", options: ["Una startup quotata in borsa", "Una startup con valuation superiore a 1 miliardo di dollari", "Una startup acquisita da una big tech", "Una startup con più di 1000 dipendenti"], answer: "Una startup con valuation superiore a 1 miliardo di dollari" },
  { question: "Cos'è il 'product-market fit'?", options: ["La strategia di pricing", "Il momento in cui un prodotto soddisfa pienamente un bisogno di mercato", "Il piano di marketing", "La fase di lancio del prodotto"], answer: "Il momento in cui un prodotto soddisfa pienamente un bisogno di mercato" },
  { question: "Cosa significa 'equity' in una startup?", options: ["Il debito totale", "La quota di proprietà dell'azienda", "Il fatturato mensile", "Il capitale circolante"], answer: "La quota di proprietà dell'azienda" },
  { question: "Cosa fa un CFO?", options: ["Gestisce il reparto IT", "Supervisiona le finanze aziendali", "Coordina le vendite", "Dirige il marketing"], answer: "Supervisiona le finanze aziendali" },
  { question: "Cosa significa NPS?", options: ["Net Profit Score", "Net Promoter Score", "New Product Strategy", "Net Payment System"], answer: "Net Promoter Score" },
  { question: "Cos'è il 'bootstrapping' in una startup?", options: ["Finanziamento tramite venture capital", "Crescita autofinanziata senza investitori esterni", "Quotazione diretta in borsa", "Acquisizione da parte di un'altra azienda"], answer: "Crescita autofinanziata senza investitori esterni" },
  { question: "Cosa indica il termine 'runway'?", options: ["Il piano di espansione internazionale", "I mesi di autonomia finanziaria rimasti con il capitale attuale", "Il tasso di crescita annuo", "Il numero di clienti attivi"], answer: "I mesi di autonomia finanziaria rimasti con il capitale attuale" },
  { question: "Cosa significa CAC?", options: ["Customer Acquisition Cost", "Capital Asset Calculation", "Cash Allocation Coefficient", "Core Activity Cost"], answer: "Customer Acquisition Cost" },
  { question: "Cosa si intende per 'pivot' in una startup?", options: ["Il lancio di un nuovo prodotto", "Un cambio strategico del modello di business", "L'espansione in nuovi mercati", "La fusione con un competitor"], answer: "Un cambio strategico del modello di business" },
  { question: "Cosa fa un angel investor?", options: ["Investe in obbligazioni corporate", "Finanzia startup nelle fasi iniziali con capitale proprio", "Gestisce fondi istituzionali", "Acquista partecipazioni in aziende quotate"], answer: "Finanzia startup nelle fasi iniziali con capitale proprio" },
  { question: "Cos'è il MRR?", options: ["Monthly Recurring Revenue", "Market Risk Rate", "Minimum Required Return", "Marginal Revenue Ratio"], answer: "Monthly Recurring Revenue" },
  { question: "Cosa significa 'due diligence'?", options: ["Una strategia di pricing", "L'analisi approfondita prima di un investimento o acquisizione", "Un tipo di contratto finanziario", "La valutazione del rischio di credito"], answer: "L'analisi approfondita prima di un investimento o acquisizione" },
  { question: "Cosa indica il termine 'cap table'?", options: ["Il limite massimo di investimento", "La tabella delle quote azionarie dei soci", "Il budget annuale", "Il piano di rimborso del debito"], answer: "La tabella delle quote azionarie dei soci" },
  { question: "Cosa significa LTV in ambito SaaS?", options: ["Long Term Value", "Lifetime Value", "Leverage Tax Variable", "Liquidity Transfer Value"], answer: "Lifetime Value" },
  { question: "Cosa fa un market maker?", options: ["Crea nuovi prodotti finanziari", "Fornisce liquidità al mercato quotando prezzi bid e ask", "Gestisce i fondi pensionistici", "Analizza i bilanci aziendali"], answer: "Fornisce liquidità al mercato quotando prezzi bid e ask" },
  { question: "Cosa si intende per 'scalabilità' in un business?", options: ["La capacità di ridurre i costi fissi", "La possibilità di crescere senza aumentare proporzionalmente i costi", "La diversificazione del portafoglio prodotti", "L'espansione geografica"], answer: "La possibilità di crescere senza aumentare proporzionalmente i costi" },
];

function shuffle<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}

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
      .from("trivia_scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(50);

    if (mode === "company") {
      if (!profile?.company) { setBoard([]); return; }
      query = query.eq("company", profile.company);
    }

    const { data, error } = await query;
    if (error) { console.error("Leaderboard error:", error); return; }
    setBoard(data || []);
  };

  useEffect(() => {
    if (!user) return;
    fetchBoard(view);
  }, [view, profile, user]);

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
    setQuestions(shuffle(QUESTION_BANK).slice(0, 10));
    setIndex(0);
    setScore(0);
    setFinished(false);
    setSelected(null);
    setLocked(false);
  };

  const answer = (option: string) => {
    if (locked) return;

    const q = questions[index];
    setSelected(option);
    setLocked(true);

    const correct = option === q.answer;
    const newScore = correct ? score + 1 : score;
    setScore(newScore);

    setTimeout(() => {
      const next = index + 1;
      setSelected(null);
      setLocked(false);

      if (next >= questions.length) {
        setFinished(true);
        setTimeout(() => saveScore(newScore), 200);
      } else {
        setIndex(next);
      }
    }, 900);
  };

  const saveScore = async (finalScore: number) => {
    const { data: session } = await supabase.auth.getUser();
    const currentUser = session.user;
    if (!currentUser) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (!prof) return;

    await supabase.from("trivia_scores").insert([{
      name: `${prof.first_name} ${prof.last_name}`,
      score: finalScore,
      user_id: currentUser.id,
      company: prof.company,
    }]);

    fetchBoard(view);
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <button onClick={login} className="bg-white text-black px-6 py-3 rounded-xl font-bold">
          Login with Google
        </button>
      </main>
    );
  }

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

        {!questions.length && !finished && (
          <button onClick={startGame} className="w-full bg-purple-600 hover:bg-purple-500 py-6 rounded-2xl font-bold mb-6 transition-colors">
            🧠 Start Finance Trivia
          </button>
        )}

        {!finished && questions.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
            <div className="flex justify-between text-xs text-slate-400 mb-3">
              <span>Domanda {index + 1}/{questions.length}</span>
              <span className="font-bold text-white">{score} ✓</span>
            </div>

            <div className="w-full bg-slate-800 h-1 rounded-full mb-4">
              <div
                className="h-1 bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${((index) / questions.length) * 100}%` }}
              />
            </div>

            <p className="text-white text-sm mb-4 font-medium leading-relaxed">
              {questions[index]?.question}
            </p>

            <div className="space-y-2">
              {questions[index]?.options.map((o) => (
                <button
                  key={o}
                  onClick={() => answer(o)}
                  disabled={locked}
                  className={`w-full py-3 px-4 rounded-xl text-left text-sm transition-all ${
                    locked
                      ? o === questions[index]?.answer
                        ? "bg-green-600 font-bold"
                        : o === selected
                        ? "bg-red-600"
                        : "bg-slate-800 opacity-40"
                      : "bg-slate-800 hover:bg-slate-700 active:scale-98"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {finished && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center mb-6">
            <p className="text-slate-400 mb-1">Risultato finale</p>
            <p className="text-5xl font-bold mb-1">{score}</p>
            <p className="text-slate-400 text-sm mb-2">su {questions.length} domande</p>
            {score >= 8 && <p className="text-yellow-400 text-sm mb-4">🏆 Eccellente!</p>}
            {score >= 5 && score < 8 && <p className="text-green-400 text-sm mb-4">👍 Buon lavoro!</p>}
            {score < 5 && <p className="text-slate-400 text-sm mb-4">💪 Riprova!</p>}
            <button onClick={startGame} className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold transition-colors">
              🔁 Gioca ancora
            </button>
          </div>
        )}

        <div className="flex gap-2 mt-6 mb-3">
          <button
            onClick={() => setView("global")}
            className={`flex-1 py-2 rounded-lg ${view === "global" ? "bg-purple-600" : "bg-slate-800"}`}
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
              <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm w-5">{i + 1}.</span>
                  <div>
                    {b.user_id ? (
                      <Link href={`/user/${b.user_id}`} className="text-slate-300 hover:text-white hover:underline block">
                        {b.name}
                      </Link>
                    ) : (
                      <span className="text-slate-300">{b.name}</span>
                    )}
                    {b.company && (
                      <span className="text-xs text-slate-500 block">{b.company}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{b.score}/10</span>
                  {b.user_id && b.user_id !== user?.id && (
                    <Link
                      href={`/user/${b.user_id}`}
                      className="text-xs bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      + Connetti
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}