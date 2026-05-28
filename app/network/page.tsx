"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";

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
      .select("id, first_name, last_name")
      .in("id", ids);

    if (!data) return;

    const map: Record<string, Profile> = {};
    data.forEach((p) => {
      map[p.id] = p;
    });

    setProfiles(map);
  };

  const fetchData = async (userId: string) => {
    // REQUESTS (in arrivo)
    const { data: req } = await supabase
      .from("friendships")
      .select("*")
      .eq("receiver_id", userId)
      .eq("status", "pending");

    // FRIENDS (accepted)
    const { data: fr } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    setRequests(req || []);
    setFriends(fr || []);

    // prendo tutti gli id da profilare
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
    await supabase
      .from("friendships")
      .delete()
      .eq("id", id);

    fetchData(userId);
  };

  if (!user) return <div className="p-6 text-white">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 pb-24">

      <Link href="/" className="text-slate-400 text-sm">
        ← Home
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">Network</h1>

      {/* REQUESTS */}
      <div className="mb-8">
        <h2 className="text-slate-400 text-sm mb-3">
          📩 Richieste
        </h2>

        {requests.length === 0 ? (
          <p className="text-slate-500 text-sm">Nessuna richiesta</p>
        ) : (
          requests.map((r) => {
            const p = profiles[r.sender_id];

            return (
              <div
                key={r.id}
                className="flex justify-between items-center bg-slate-900 p-3 rounded-xl mb-2"
              >
                <span>
                  {p ? `${p.first_name} ${p.last_name}` : r.sender_id}
                </span>

                <button
                  onClick={() => accept(r.id, user.id)}
                  className="bg-green-600 px-3 py-1 rounded-lg text-sm"
                >
                  Accetta
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* FRIENDS */}
      <div>
        <h2 className="text-slate-400 text-sm mb-3">
          👥 Amici
        </h2>

        {friends.length === 0 ? (
          <p className="text-slate-500 text-sm">Nessun amico</p>
        ) : (
          friends.map((f) => {
            const friendId =
              f.sender_id === user.id ? f.receiver_id : f.sender_id;

            const p = profiles[friendId];

            return (
              <div
                key={f.id}
                className="flex justify-between items-center bg-slate-900 p-3 rounded-xl mb-2"
              >
                <span>
                  {p ? `${p.first_name} ${p.last_name}` : friendId}
                </span>

                <button
                  onClick={() => remove(f.id, user.id)}
                  className="bg-red-600 px-3 py-1 rounded-lg text-sm"
                >
                  Rimuovi
                </button>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}