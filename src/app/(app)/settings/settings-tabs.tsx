"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings", label: "Jadwal Rekap" },
  { href: "/settings/landing", label: "Landing Page" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-border" aria-label="Tab pengaturan">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
