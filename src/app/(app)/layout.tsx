import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

// Layout statis; sesi & data dibaca di dalam Suspense (Cache Components).
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="h-16 border-b border-border bg-surface" />
      <div className="mx-auto w-full max-w-6xl flex-1 animate-pulse space-y-4 p-4 sm:p-8">
        <div className="h-8 w-48 rounded-input bg-border/60" />
        <div className="h-64 rounded-card bg-border/40" />
      </div>
    </div>
  );
}
