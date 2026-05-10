"use client";

import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

export function PermissionGate({ permission, children }: { permission: string; children: ReactNode }) {
  const { data: session, status } = useSession();

  if (status !== "authenticated") return null;
  if (!session?.user?.permissions?.includes(permission)) return null;

  return <>{children}</>;
}
