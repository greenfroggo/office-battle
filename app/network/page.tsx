"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";
import UserAvatar from "@/app/components/userAvatar";

type FriendRequest = {
  id: number;
  sender_id: string;
  receiver_id: string;
  status: string;
};

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  avatar?: string;
};

export default function NetworkPage() {
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (!u) return;
    setUser(u);
    await fetchData(u.id);
  };

  const fetchProfiles = async (ids: string[]) => {
    if (!ids.length) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar")
      .in("id", ids);

    if (!data) return;

    const map: Record<string, Profile> = {};
    data.forEach((p) => {
      map[p.id] = p;
    });

    setProfiles(map);
  };

  const fetchData = async (userId: string) => {
    const { data: req } = await supabase
      .from("friendships")
      .select("*")
      .eq("receiver_id", userId)
      .eq("status", "pending");

    const { data: fr } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    setRequests(req || []);
    setFriends(fr || []);

    const ids = [
      ...(req || []).map((r) => r.sender_id),
      ...(fr || []).map((f) =>
        f.sender_id === userId ? f.receiver_id : f.sender_id
      ),
    ];

    await fetchProfiles([...new Set(ids)]);
  };

  const accept = async (id: number, userId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", id);

    fetchData(userId);
  };

  const remove = async (id: number, userId: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    fetchData(userId);
  };

  if (!user)
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-white text-sm">Caricamento...</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <Link href="/" className="text-slate-400 text-sm hover:text-white">
        ← Home
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-8">Network</h1>

      {/* RICHIESTE */}
      <div className="mb-8">
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
          📩 Richieste in arrivo
        </h2>

        {requests.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-sm">Nessuna richiesta in attesa</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {requests.map((r) => {
              const p = profiles[r.sender_id];

              return (
                <div
                  key={r.id}
                  className="flex justify-between items-center px-5 py-4 border-b border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar avatarId={p?.avatar} size={36} />

                    <Link
                      href={`/user/${r.sender_id}`}
                      className="font-semibold hover:text-blue-400 transition-colors"
                    >
                      {p
                        ? `${p.first_name} ${p.last_name}`
                        : "Utente"}
                    </Link>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => accept(r.id, user.id)}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      Accetta
                    </button>

                    <button
                      onClick={() => remove(r.id, user.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm"
                    >
                      Rifiuta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AMICI */}
      <div>
        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
          👥 Connessioni
        </h2>

        {friends.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-sm">Nessuna connessione ancora</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {friends.map((f) => {
              const friendId =
                f.sender_id === user.id ? f.receiver_id : f.sender_id;

              const p = profiles[friendId];

              return (
                <div
                  key={f.id}
                  className="flex justify-between items-center px-5 py-4 border-b border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar avatarId={p?.avatar} size={36} />

                    <Link
                      href={`/user/${friendId}`}
                      className="font-semibold hover:text-green-400 transition-colors"
                    >
                      {p
                        ? `${p.first_name} ${p.last_name}`
                        : friendId}
                    </Link>
                  </div>

                  <button
                    onClick={() => remove(f.id, user.id)}
                    className="text-slate-500 hover:text-red-400 text-sm"
                  >
                    Rimuovi
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}