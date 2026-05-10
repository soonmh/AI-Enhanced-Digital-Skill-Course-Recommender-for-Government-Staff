"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { updateLanguage } from "@/hooks/useApi";
import { User, Lock, Sun, Moon } from "lucide-react";

export default function AppearancePage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const currentLocale = session?.user?.locale || "en";

  const handleLanguageChange = async (locale: string) => {
    try {
      await updateLanguage(locale);
      window.location.reload();
    } catch {}
  };

  return (
    <div className="px-4 py-6">
      <Heading title="Settings" description="Manage your profile and account settings" />
      <div className="flex flex-col space-y-8 md:space-y-0 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="w-full max-w-xl lg:w-48">
          <nav className="flex flex-col space-x-0 space-y-1">
            <NavLink href="/settings/profile" icon={User} title="Profile" />
            <NavLink href="/settings/password" icon={Lock} title="Password" />
          </nav>
        </aside>
        <div className="flex-1 md:max-w-2xl">
          <section className="max-w-xl space-y-12">
            <header>
              <h3 className="mb-0.5 text-base font-medium">Appearance settings</h3>
              <p className="text-sm text-muted-foreground">
                Update your account&apos;s appearance settings
              </p>
            </header>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Language</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`flex-1 flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    currentLocale === "en"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>EN</span>
                </button>
                <button
                  onClick={() => handleLanguageChange("ms")}
                  className={`flex-1 flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    currentLocale === "ms"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>🇲🇾</span>
                  <span>MY</span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Theme</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, icon: Icon, title }: { href: string; icon: React.ElementType; title: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-muted" : "hover:bg-muted/50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {title}
    </Link>
  );
}

function Heading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 space-y-0.5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
