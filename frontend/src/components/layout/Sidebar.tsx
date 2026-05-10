"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  LayoutGrid,
  ClipboardList,
  TrendingUp,
  Target,
  BookOpen,
  FolderOpen,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Glasses,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon: React.ElementType;
  permission?: string | null;
  roles?: string[];
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    key: "assessments",
    label: "Assessments",
    icon: ClipboardList,
    children: [
      {
        key: "take-assessment",
        label: "Take Assessment",
        href: "/assessment",
        icon: TrendingUp,
        permission: "take-assessment",
        roles: ["Admin", "Staff"],
      },
      {
        key: "assessment-results",
        label: "Assessment Results",
        href: "/assessment/results",
        icon: Target,
        permission: "take-assessment",
        roles: ["Admin", "Staff"],
      },
    ],
    permission: "take-assessment",
    roles: ["Admin", "Staff"],
  },
  {
    key: "courses",
    label: "Courses",
    icon: BookOpen,
    children: [
      {
        key: "my-learning",
        label: "My Learning",
        href: "/courses/my-learning",
        icon: GraduationCap,
        permission: "take-assessment",
      },
      {
        key: "manage-courses",
        label: "Manage Courses",
        href: "/courses/list",
        icon: FolderOpen,
        permission: "course-management",
      },
      {
        key: "recommended-courses",
        label: "Recommended Courses",
        href: "/courses/recommended",
        icon: TrendingUp,
        permission: "take-assessment",
      },
    ],
  },
  {
    key: "user-report",
    label: "User Report",
    href: "/staff-analysis",
    icon: Users,
    permission: "user-reporting",
  },
  {
    key: "course-report",
    label: "Course Report",
    href: "/course-report/course-progress",
    icon: FileText,
    permission: "course-reporting",
  },
  {
    key: "user-management",
    label: "User Management",
    href: "/admin/users",
    icon: Users,
    roles: ["Admin"],
    permission: "user-management",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const permissions = session?.user?.permissions || [];
  const roles = session?.user?.roles || [];
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    assessments: pathname.startsWith("/assessment"),
    courses: pathname.startsWith("/courses"),
  });

  const hasRole = (itemRoles?: string[]) =>
    !itemRoles || itemRoles.length === 0 || itemRoles.some((r) => roles.includes(r));

  const hasPermission = (itemPermission?: string | null) =>
    !itemPermission || permissions.includes(itemPermission);

  const filterItems = (items: NavItem[]) =>
    items
      .filter((item) => {
        if (item.children) {
          const filtered = item.children.filter(
            (child) => hasPermission(child.permission) && hasRole(child.roles)
          );
          return filtered.length > 0;
        }
        return hasPermission(item.permission) && hasRole(item.roles);
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter(
              (child) => hasPermission(child.permission) && hasRole(child.roles)
            ),
          };
        }
        return item;
      });

  const filteredItems = filterItems(NAV_ITEMS);

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isGroupActive = (item: NavItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) return item.children.some((child) => isActive(child.href));
    return false;
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="flex sticky top-0 h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r">
      {/* Logo Header */}
      <div className="flex flex-col gap-2 p-2">
        <ul className="flex w-full min-w-0 flex-col gap-1">
          <li className="group/menu-item relative">
            <Link
              href="/dashboard"
              className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-purple-600">
                <Glasses className="w-4 h-4 text-white" />
              </div>
              <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                <span className="mb-0.5 font-semibold leading-none">DSRA</span>
                <span className="text-xs text-muted-foreground truncate">
                  Digital Skills Readiness
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        <ul className="flex w-full min-w-0 flex-col gap-1 p-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isGroupActive(item);

            if (item.children && item.children.length > 0) {
              const expanded = expandedGroups[item.key] ?? false;
              return (
                <li key={item.key} className="group/menu-item relative">
                  <div className="space-y-1">
                    <button
                      onClick={() => toggleGroup(item.key)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground group select-none",
                        active
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-colors",
                            active
                              ? "text-accent-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-all duration-200",
                          expanded && "rotate-180",
                          active
                            ? "text-accent-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                    </button>
                    {expanded && (
                      <div className="ml-6 space-y-1 border-l border-border pl-4 animate-in slide-in-from-top-1 duration-200">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);
                          return (
                            <Link
                              key={child.key}
                              href={child.href || "#"}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground group",
                                childActive
                                  ? "bg-accent text-accent-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <ChildIcon
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  childActive
                                    ? "text-accent-foreground"
                                    : "text-muted-foreground group-hover:text-foreground"
                                )}
                              />
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </li>
              );
            }

            return (
              <li key={item.key} className="group/menu-item relative">
                <Link
                  href={item.href || "#"}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground group",
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive(item.href)
                        ? "text-accent-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer / User Menu */}
      <div className="border-t p-2">
        {expandedGroups.userMenu && (
          <div className="mb-1 space-y-1 border-l border-border ml-4 pl-3 animate-in slide-in-from-bottom-1 duration-200">
            <Link
              href="/settings/profile"
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname.startsWith("/settings")
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log out</span>
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md p-2">
          <UserAvatar name={session?.user?.name || ""} size={32} />
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-medium">
              {session?.user?.name || "User"}
            </span>
            {session?.user?.email && (
              <span className="truncate text-xs text-muted-foreground">
                {session.user.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
