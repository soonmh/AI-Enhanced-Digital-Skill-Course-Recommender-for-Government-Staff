import { AppShell } from "@/components/layout/AppShell";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <RealtimeProvider>{children}</RealtimeProvider>
    </AppShell>
  );
}
