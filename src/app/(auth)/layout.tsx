import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-4 inline-flex h-10 items-center gap-2 rounded-input px-3 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <span aria-hidden>←</span> Kembali ke beranda
        </Link>
        <div className="mb-6 text-center">
          <Link href="/" aria-label="Beranda" className="mx-auto mb-3 block w-fit"><LogoMark size={64} /></Link>
          <h1 className="text-2xl font-semibold">Rekapin</h1>
          <p className="text-sm text-muted">Pencatatan &amp; persetujuan lembur</p>
        </div>
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm sm:p-8">{children}</div>
      </div>
    </main>
  );
}
