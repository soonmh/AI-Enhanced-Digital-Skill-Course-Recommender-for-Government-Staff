"use client";

import { useState } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Sun,
  Moon,
  Bell,
  Settings,
  LogOut,
  Check,
  CheckCheck,
} from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";
import { useUnreadCount, useNotifications, markNotificationRead, markAllNotificationsRead } from "@/hooks/useApi";

function BreadcrumbItem({ label, href, isLast }: { label: string; href?: string; isLast: boolean }) {
  if (isLast) {
    return <span className="font-normal text-foreground">{label}</span>;
  }
  return (
    <Link href={href || "#"} className="transition-colors hover:text-foreground text-muted-foreground">
      {label}
    </Link>
  );
}

function Breadcrumbs() {
  const pathname = usePathname();

  const breadcrumbMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/assessment": "Assessments",
    "/assessment/start": "Take Assessment",
    "/assessment/results": "Results",
    "/courses": "Courses",
    "/courses/list": "Manage Courses",
    "/courses/recommended": "Recommended",
    "/courses/my-learning": "My Learning",
    "/courses/create": "Create Course",
    "/admin/users": "User Management",
    "/staff-analysis": "Staff Analysis",
    "/course-report": "Course Report",
    "/course-report/course-progress": "Course Progress",
    "/settings/profile": "Profile",
    "/settings/password": "Password",
    "/settings/appearance": "Appearance",
  };

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { title: string; href: string }[] = [];

  // Build breadcrumb trail
  let currentPath = "";
  for (const segment of segments) {
    currentPath += "/" + segment;
    const title = breadcrumbMap[currentPath];
    if (title) {
      breadcrumbs.push({ title, href: currentPath });
    }
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
        {breadcrumbs.map((crumb, idx) => (
          <li key={crumb.href} className="inline-flex items-center gap-1.5">
            <BreadcrumbItem
              label={crumb.title}
              href={crumb.href}
              isLast={idx === breadcrumbs.length - 1}
            />
            {idx < breadcrumbs.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      <CommandPalette />
      <Toaster richColors position="top-right" />
    </SessionProvider>
  );
}

function TopBar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize realtime connection
  useRealtime();
  const { count: unreadCount, mutate: mutateCount } = useUnreadCount();
  const { notifications, mutate: mutateNotifs } = useNotifications();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push("/dashboard");
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(String(id));
    mutateNotifs();
    mutateCount();
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    mutateNotifs();
    mutateCount();
  };

  const notifList = (notifications as any)?.data || [];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/70 px-6">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <Breadcrumbs />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search bar */}
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              className="w-48 h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border bg-popover shadow-lg animate-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <span className="text-sm font-semibold">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifList.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifList.slice(0, 15).map((n: any) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.read_at) handleMarkRead(n.id);
                          if (n.data?.course_id) {
                            setNotifOpen(false);
                            router.push(`/courses/${n.data.course_id}`);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-b-0 ${!n.read_at ? "bg-blue-50/50" : ""}`}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read_at && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                          )}
                          <div className={!n.read_at ? "" : "ml-4"}>
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            {n.body && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile button */}
        <div className="relative ml-1">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 rounded-md p-1 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0 overflow-hidden">
              <UserAvatar name={session?.user?.name || ""} size={32} />
            </div>
            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", profileOpen && "rotate-180")} />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border bg-popover p-1 shadow-lg animate-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 border-b mb-1">
                  <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                </div>
                <Link
                  href="/settings/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => { setProfileOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
