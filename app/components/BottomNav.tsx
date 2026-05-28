"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);

  const isActive = (path: string) => {
    if (path === "/games") return pathname.startsWith("/games");
    return pathname === path;
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const { count, error } = await supabase
        .from("friend_requests")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (!error) {
        setNotifCount(count || 0);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between px-6 py-3">

        {/* Notifiche */}
        <Link href="/notifications" className="flex-1 text-center">
          <span className={`text-xl ${isActive("/notifications") ? "text-blue-400" : "text-slate-400"}`}>
            🔔
          </span>
        </Link>

        {/* Classifica */}
        <Link href="/leaderboard" className="flex-1 text-center">
          <span className={`text-xl ${isActive("/leaderboard") ? "text-blue-400" : "text-slate-400"}`}>
            🏆
          </span>
        </Link>

        {/* HOME */}
        <Link href="/" className="flex-1 flex justify-center -mt-8">
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
              bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg border border-slate-700
              transition
              ${isActive("/") ? "scale-110" : ""}
            `}
          >
            🃏
          </div>
        </Link>

        {/* Giochi */}
        <Link href="/games" className="flex-1 text-center">
          <span className={`text-xl ${isActive("/games") ? "text-blue-400" : "text-slate-400"}`}>
            🎮
          </span>
        </Link>

        {/* Amici + badge */}
        <Link href="/network" className="flex-1 text-center relative">
          <div className="relative inline-block">
            <span className={`text-xl ${isActive("/network") ? "text-blue-400" : "text-slate-400"}`}>
              👥
            </span>

            {notifCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {notifCount}
              </span>
            )}
          </div>
        </Link>

      </div>
    </div>
  );
}