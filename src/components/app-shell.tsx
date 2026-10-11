import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

const roleLabel = { employee: "Karyawan", approver: "Approver", admin: "Admin" } as const;

const NAV: { href: string; label: string; roles: string[] }[] = [
  { href: "/dashboard", label: "Dashboard Saya", roles: ["employee", "approver"] },
  { href: "/approvals", label: "Persetujuan", roles: ["approver"] },
  { href: "/users", label: "Pengguna", roles: ["admin"] },
  { href: "/settings", label: "Pengaturan", roles: ["admin"] },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const initials = (user.name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const links = NAV.filter((n) => n.roles.includes(user.role));
  const home = user.role === "admin" ? "/users" : "/dashboard";

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href={home} className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-input bg-primary text-sm font-semibold text-white">R</span>
              <span className="text-lg font-semibold">Rekapin</span>
            </Link>
            <nav className="hidden gap-1 md:flex" aria-label="Navigasi utama">
              {links.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-input px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-text">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile" className="flex items-center gap-3 rounded-input px-2 py-1 hover:bg-bg" aria-label="Profil saya">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted">{roleLabel[user.role]}</div>
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" aria-hidden>
                {initials}
              </div>
            </Link>
            <SignOutButton />
          </div>
        </div>
        {/* Navigasi mobile: baris yang bisa digeser */}
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-1.5 md:hidden" aria-label="Navigasi utama (mobile)">
          {links.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-input px-3 py-2 text-sm font-medium text-muted hover:bg-bg hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
