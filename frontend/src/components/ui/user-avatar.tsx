"use client";

import Avatar from "boring-avatars";
import { cn } from "@/lib/utils";

const PALETTE = ["#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4", "#14b8a6", "#f59e0b", "#ef4444", "#ec4899"];

export function UserAvatar({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-full overflow-hidden shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Avatar
        size={size}
        name={name || "?"}
        variant="beam"
        colors={PALETTE}
      />
    </div>
  );
}
