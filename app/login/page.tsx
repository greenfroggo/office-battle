"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const COMPANIES = [
  "McKinsey & Company",
  "Boston Consulting Group (BCG)",
  "Bain & Company",
  "Deloitte",
  "PwC",
  "EY",
  "KPMG",
  "Accenture",
  "Capgemini Invent",
  "Oliver Wyman",
  "Roland Berger",
  "Strategy& (PwC)",
  "LEK Consulting",
  "AlixPartners",
  "Kearney",
  "FTI Consulting",
  "Grant Thornton",
  "Mazars",
  "BearingPoint",
  "Simon-Kucher & Partners",
  "PA Consulting",
  "ZS Associates",
  "Nexia",
  "BDO",
  "Deloitte Digital",
  "IBM Consulting",
  "EY-Parthenon",
  "PwC Advisory",
  "BCG Platinion",
  "Other",
];

export default function LoginPage() {
  const [company, setCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");

  const loginWithGoogle = async () => {
    if (!company) return;

    let finalCompany = company;

    if (company === "Other") {
      if (!customCompany.trim()) return;
      finalCompany = customCompany.trim();
    }

    localStorage.setItem("company", finalCompany);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h1 className="text-xl font-bold mb-6">
          ⚡ Office Battle
        </h1>

        <label className="text-xs text-slate-400 uppercase">
          Seleziona azienda
        </label>

        <select
          className="w-full mt-2 mb-4 bg-slate-800 p-3 rounded-xl"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        >
          <option value="">-- seleziona --</option>
          {COMPANIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {company === "Other" && (
          <input
            className="w-full mb-4 bg-slate-800 p-3 rounded-xl"
            placeholder="Scrivi la tua azienda"
            value={customCompany}
            onChange={(e) => setCustomCompany(e.target.value)}
          />
        )}

        <button
          onClick={loginWithGoogle}
          disabled={!company || (company === "Other" && !customCompany)}
          className={`w-full py-3 rounded-xl font-bold transition ${
            company && (company !== "Other" || customCompany)
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          }`}
        >
          Continua con Google
        </button>

      </div>
    </main>
  );
}