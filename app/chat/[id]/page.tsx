"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

type Message = {
  id: string;
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
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    init();
  }, [conversationId]);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user) return;

    setUserId(user.id);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);

    // mark seen
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id);
  };

  // REALTIME MESSAGES
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          setMessages((prev) => {
            const exists = prev.some(
              (m) => m.id === payload.new.id
            );
            if (exists) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [conversationId]);

  // TYPING (simple broadcast)
  useEffect(() => {
    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on("broadcast", { event: "typing" }, () => {
        setTyping(true);
        setTimeout(() => setTyping(false), 1000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendTyping = () => {
    const channel = supabase.channel(`typing:${conversationId}`);
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: {},
    });
  };

  const sendMessage = async () => {
    if (!text.trim() || !userId) return;

    const msg = text;
    setText("");

    const tempId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversation_id: conversationId,
        sender_id: userId,
        text: msg,
        created_at: new Date().toISOString(),
        is_read: true,
      },
    ]);

    const { data } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        text: msg,
        is_read: false,
      })
      .select()
      .single();

    setMessages((prev) =>
      prev.map((m) =>
        m.id === tempId ? data : m
      )
    );

    await supabase
      .from("conversations")
      .update({
        last_message: msg,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversationId);
  };

  // AUTO SCROLL
  useEffect(() => {
    const el = document.getElementById("bottom");
    el?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKey = (e: any) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">

      {/* HEADER */}
      <div className="p-3 border-b border-zinc-800 flex justify-between">
        <button
          onClick={() => router.push("/chat")}
          className="text-blue-400"
        >
          ← Chat
        </button>
        <div>Chat</div>
        <div />
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

            {m.sender_id === userId && (
              <div className="text-[10px] text-blue-200 mt-1">
                {m.is_read ? "✔✔ Seen" : "✔ Sent"}
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="text-xs text-gray-400">
            sta scrivendo...
          </div>
        )}

        <div id="bottom" />
      </div>

      {/* INPUT */}
      <div className="p-3 flex gap-2 border-t border-zinc-800">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            sendTyping();
          }}
          onKeyDown={handleKey}
          className="flex-1 p-2 bg-zinc-900 rounded-lg"
          placeholder="Scrivi..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded-lg"
        >
          Invia
        </button>
      </div>
    </div>
  );
}