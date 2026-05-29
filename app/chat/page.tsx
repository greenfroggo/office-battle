"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type ChatItem = {
  conversation_id: string;
  friend_name: string;
  friend_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread: number;
};

export default function ChatPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    // 1. prendi conversazioni dell’utente
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id");

    const myConvos =
      participants?.filter((p) => p.user_id === user.id) || [];

    const convoIds = myConvos.map((c) => c.conversation_id);

    if (!convoIds.length) return;

    // 2. conversazioni
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convoIds)
      .order("last_message_at", { ascending: false });

    // 3. messages per unread
    const { data: messages } = await supabase
      .from("messages")
      .select("*");

    // 4. TUTTI i participants per trovare amici
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id");

    // 5. profiles
    const friendIds =
      allParticipants
        ?.filter((p) => p.user_id !== user.id)
        .map((p) => p.user_id) || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar")
      .in("id", friendIds);

    // 🔥 MAP FINALE CORRETTA
    const result: ChatItem[] =
      conversations?.map((c) => {
        const participantsInChat =
          allParticipants?.filter(
            (p) => p.conversation_id === c.id
          ) || [];

        const friendId = participantsInChat.find(
          (p) => p.user_id !== user.id
        )?.user_id;

        const profile = profiles?.find(
          (p) => p.id === friendId
        );

        const unread =
          messages?.filter(
            (m) =>
              m.conversation_id === c.id &&
              m.sender_id !== user.id &&
              m.is_read === false
          ).length || 0;

        return {
          conversation_id: c.id,
          friend_name:
            profile
              ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
              : "Unknown",
          friend_avatar: profile?.avatar || null,
          last_message: c.last_message || "",
          last_message_at: c.last_message_at || "",
          unread,
        };
      }) || [];

    setChats(result);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-xl font-bold mb-4">Chat</h1>

      <div className="space-y-3">
        {chats.map((c) => (
          <div
            key={c.conversation_id}
            onClick={() =>
              router.push(`/chat/${c.conversation_id}`)
            }
            className="p-3 bg-zinc-900 rounded-xl flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">
                {c.friend_name}
              </div>

              <div className="text-sm text-gray-400">
                {c.last_message}
              </div>
            </div>

            {c.unread > 0 && (
              <div className="bg-blue-500 px-2 rounded-full text-xs">
                {c.unread}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}