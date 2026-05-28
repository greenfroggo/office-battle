"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

type Request = {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_company: string;
  sender_color: string;
  created_at: string;
};

export default function Notifications() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data?.user;
      if (!authUser) return;
      setUser(authUser);
      await fetchRequests(authUser.id);
      setLoading(false);
    };
    init();
  }, []);

  const fetchRequests = async (userId: string) => {
    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, sender_id, created_at")
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (!friendships || friendships.length === 0) {
      setRequests([]);
      return;
    }

    const senderIds = friendships.map((f) => f.sender_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, company, company_color")
      .in("id", senderIds);

    const merged = friendships.map((f) => {
      const prof = profiles?.find((p) => p.id === f.sender_id);
      return {
        id: f.id,
        sender_id: f.sender_id,
        sender_name: prof ? `${prof.first_name} ${prof.last_name}` : "Utente",
        sender_company: prof?.company || "",
        sender_color: prof?.company_color || "bg-slate-500",
        created_at: f.created_at,
      };
    });

    setRequests(merged);
  };

  const accept = async (friendshipId: number, senderId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const decline = async (friendshipId: number) => {
    await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white text-sm">Caricamento...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-md mx-auto pt-8">

        <Link href="/" className="text-slate-400 text-sm mb-6 block hover:text-white">
          ← Torna alla home
        </Link>

        <h1 className="text-2xl font-bold mb-2">Notifiche</h1>
        <p className="text-slate-400 text-sm mb-8">Richieste di connessione ricevute</p>

        {requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-slate-400 text-sm">Nessuna richiesta in attesa</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {requests.map((r) => (
              <div key={r.id} className="p-5 border-b border-slate-800 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link href={`/user/${r.sender_id}`}>
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                        {r.sender_name[0]}
                      </div>
                    </Link>
                    <div>
                      <Link href={`/user/${r.sender_id}`} className="font-semibold hover:text-blue-400">
                        {r.sender_name}
                      </Link>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${r.sender_color}`} />
                        <span className="text-slate-400 text-xs">{r.sender_company}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => accept(r.id, r.sender_id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      Accetta
                    </button>
                    <button
                      onClick={() => decline(r.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm px-4 py-2 rounded-xl transition-colors"
                    >
                      Rifiuta
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}