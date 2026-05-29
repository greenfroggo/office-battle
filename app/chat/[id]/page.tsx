"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Message = {
  id: string | number;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
};

export default function ChatRoom() {
  const params = useParams();
  const router = useRouter();

  const conversationId = params?.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!conversationId) return;
    init();
  }, [conversationId]);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return;

    setUserId(user.id);

    // 📩 load messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);

    // 👀 mark as read
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id);
  };

  // 🔥 REALTIME (solo messaggi nuovi degli altri)
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            // evita duplicati (IMPORTANTISSIMO)
            const exists = prev.some(
              (m) => m.id === newMsg.id
            );

            if (exists) return prev;

            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // ✉️ SEND MESSAGE (OPTIMISTIC UI FIXED)
  const sendMessage = async () => {
    if (!text.trim() || !userId) return;

    const msgText = text;
    const tempId = crypto.randomUUID();

    // 1. UI immediata (WHATSAPP STYLE)
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversation_id: conversationId,
        sender_id: userId,
        text: msgText,
        created_at: new Date().toISOString(),
        is_read: true,
      },
    ]);

    setText("");

    // 2. salva su DB
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        text: msgText,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return;
    }

    // 3. sostituisci messaggio temporaneo con quello reale
    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId ? data : m
      )
    );

    // 4. aggiorna inbox (last message)
    await supabase
      .from("conversations")
      .update({
        last_message: msgText,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  };

  // ⌨️ ENTER TO SEND
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">

      {/* HEADER */}
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
        <button
          onClick={() => router.push("/chat")}
          className="text-blue-400"
        >
          ← Chat
        </button>

        <div className="text-sm text-gray-400">
          Chat
        </div>

        <div className="w-10" />
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-lg max-w-[70%]
              ${
                m.sender_id === userId
                  ? "ml-auto bg-blue-600"
                  : "bg-zinc-800"
              }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-3 flex gap-2 border-t border-zinc-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2 bg-zinc-900 rounded-lg"
          placeholder="Scrivi..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded-lg active:scale-95 transition"
        >
          Invia
        </button>
      </div>
    </div>
  );
}