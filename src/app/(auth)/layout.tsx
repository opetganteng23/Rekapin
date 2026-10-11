import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-card bg-primary text-xl font-semibold text-white">R</div>
          <h1 className="text-2xl font-semibold">Rekapin</h1>
          <p className="text-sm text-muted">Pencatatan &amp; persetujuan lembur</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
