"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { signalNavStart } from "./route-progress";

/**
 * Form filter (GET) tanpa reload penuh: navigasi lewat router sehingga halaman tidak "membeku",
 * bar progres tampil, dan kontrol dinonaktifkan sementara. Tanpa JS tetap berfungsi sebagai form GET biasa.
 */
export function NavForm({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget)) {
      if (typeof v === "string" && v !== "") params.set(k, v);
    }
    const qs = params.toString();
    signalNavStart();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <form method="get" onSubmit={onSubmit} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
