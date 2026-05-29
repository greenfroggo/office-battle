"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type ChatItem = {
  conversation_id: string;
  friend_id: string;
  name: string;
  avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread: number;
};

export default function ChatPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [userId, setUserId] = useState("");
  const router = useRouter();

  useEffect(() => {
    load();

    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    setUserId(user.id);

    // 1. conversazioni
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id");

    const myConversations =
      participants?.filter((p) => p.user_id === user.id) || [];

    const convoIds = myConversations.map(
      (c) => c.conversation_id
    );

    if (convoIds.length === 0) return;

    // 2. conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convoIds)
      .order("last_message_at", { ascending: false });

    // 3. messages (unread count)
    const { data: messages } = await supabase
      .from("messages")
      .select("conversation_id, sender_id, is_read");

    // 4. profiles
    const friendIds =
      participants
        ?.filter((p) => p.user_id !== user.id)
        .map((p) => p.user_id) || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar")
      .in("id", friendIds);

    const result: ChatItem[] = conversations.map((c) => {
      const participantsInChat =
        participants?.filter(
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
        friend_id: friendId || "",
        name:
          [profile?.first_name, profile?.last_name]
            .filter(Boolean)
            .join(" ") || "Unknown",
        avatar: profile?.avatar || null,
        last_message: c.last_message || "",
        last_message_at: c.last_message_at || "",
        unread,
      };
    });

    setChats(result);
  };

  const openChat = (id: string) => {
    router.push(`/chat/${id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-xl font-bold mb-4">Chat</h1>

      <div className="space-y-3">
        {chats.map((c) => (
          <div
            key={c.conversation_id}
            onClick={() => openChat(c.conversation_id)}
            className="flex items-center gap-3 p-3 bg-zinc-900 rounded-xl cursor-pointer"
          >
            <img
              src={
                c.avatar ||
                "https://placehold.co/100x100"
              }
              className="w-10 h-10 rounded-full"
            />

            <div className="flex-1">
              <div className="flex justify-between">
                <div className="font-semibold">
                  {c.name}
                </div>

                {c.unread > 0 && (
                  <div className="bg-blue-500 text-xs px-2 rounded-full">
                    {c.unread}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-400">
                {c.last_message || "Start chatting"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}