"use client";

import { useOnlineUsers } from "@/components/providers/RealtimeProvider";

export function OnlineIndicator({ userId }: { userId: number }) {
  const onlineUsers = useOnlineUsers();
  if (!onlineUsers.has(userId)) return null;
  return (
    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
  );
}
