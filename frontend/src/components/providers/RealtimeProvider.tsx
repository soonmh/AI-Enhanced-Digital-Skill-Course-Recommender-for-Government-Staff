"use client";

import { createContext, useContext } from "react";
import { useRealtime } from "@/hooks/useRealtime";

const OnlineContext = createContext<Set<number>>(new Set());

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { onlineUsers } = useRealtime();
  return <OnlineContext.Provider value={onlineUsers}>{children}</OnlineContext.Provider>;
}

export function useOnlineUsers() {
  return useContext(OnlineContext);
}
