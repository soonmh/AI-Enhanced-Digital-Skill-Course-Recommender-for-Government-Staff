"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import {
  LayoutGrid,
  TrendingUp,
  Target,
  FolderOpen,
  FileText,
  Users,
  Settings,
  Sun,
  Moon,
  Search,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  permission?: string | null;
  roles?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { setTheme } = useTheme();
  const permissions = session?.user?.permissions || [];
  const roles = session?.user?.roles || [];

  const hasPermission = (p?: string | null) => !p || permissions.includes(p);
  const hasRole = (r?: string[]) => !r || r.length === 0 || r.some((role) => roles.includes(role));

  const items: CommandItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
    { id: "take-assessment", label: "Take Assessment", icon: TrendingUp, href: "/assessment", permission: "take-assessment", roles: ["Admin", "Staff", "Trainer"] },
    { id: "assessment-results", label: "Assessment Results", icon: Target, href: "/assessment/results", permission: "take-assessment", roles: ["Admin", "Staff", "Trainer"] },
    { id: "manage-courses", label: "Manage Courses", icon: FolderOpen, href: "/courses/list", permission: "course-management" },
    { id: "recommended-courses", label: "Recommended Courses", icon: TrendingUp, href: "/courses/recommended", permission: "take-assessment" },
    { id: "user-report", label: "User Report", icon: Users, href: "/staff-analysis", permission: "user-reporting" },
    { id: "course-report", label: "Course Report", icon: FileText, href: "/course-report/course-progress", permission: "course-reporting" },
    { id: "user-management", label: "User Management", icon: Users, href: "/admin/users", permission: "user-management", roles: ["Admin"] },
    { id: "settings", label: "Settings", icon: Settings, href: "/settings/profile" },
    { id: "theme-light", label: "Switch to Light Mode", icon: Sun, action: () => setTheme("light") },
    { id: "theme-dark", label: "Switch to Dark Mode", icon: Moon, action: () => setTheme("dark") },
  ];

  const filtered = items.filter((item) => hasPermission(item.permission) && hasRole(item.roles));

  const runItem = useCallback((item: CommandItem) => {
    setOpen(false);
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  }, [router]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="fixed left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-xl border bg-popover text-popover-foreground shadow-2xl"
          label="Command palette"
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search pages and actions..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-64 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <Command.Item
                  key={item.id}
                  value={item.label}
                  onSelect={() => runItem(item)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-default data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{item.label}</span>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
