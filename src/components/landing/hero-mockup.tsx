"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Menunggu", cls: "bg-warning/15 text-[#8a5f0a]" },
  { label: "Disetujui", cls: "bg-success/10 text-success" },
] as const;

/** Mockup produk beranimasi: pengajuan berganti dari Menunggu → Disetujui secara berulang. */
export function HeroMockup() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase(1);
      return;
    }
    const t = setInterval(() => setPhase((p) => (p + 1) % 2), 3200);
    return () => clearInterval(t);
  }, []);

  const approved = phase === 1;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Kartu utama */}
      <div className="relative rounded-[20px] border border-border bg-surface p-5 shadow-[0_30px_80px_-20px_rgba(79,124,172,0.35)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">Ajukan Lembur</div>
            <div className="text-xs text-muted">Catat waktu kerja dan lampirkan bukti</div>
          </div>
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-danger/50" />
            <span className="size-2.5 rounded-full bg-warning/60" />
            <span className="size-2.5 rounded-full bg-success/60" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[["Mulai", "18:00"], ["Selesai", "21:30"]].map(([l, v]) => (
            <div key={l} className="rounded-input border border-border bg-bg/60 px-3 py-2">
              <div className="text-[11px] text-muted">{l}</div>
              <div className="text-sm font-medium">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-input bg-primary/8 px-4 py-3" style={{ background: "color-mix(in srgb, var(--primary) 9%, transparent)" }}>
          <span className="text-sm text-muted">Total durasi</span>
          <span className="text-lg font-semibold text-primary">3j 30m</span>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-input border border-dashed border-border px-3 py-2.5 text-xs text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21.4 11.6 12.5 20.5a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2" />
          </svg>
          bukti_lembur.jpg
          <span className="ml-auto text-success">✓ terunggah</span>
        </div>

        {/* Status berganti */}
        <div className="mt-4 flex items-center justify-between rounded-input border border-border px-4 py-3">
          <div>
            <div className="text-sm font-medium">11 Okt 2026</div>
            <div className="text-xs text-muted">18:00–21:30 · 3j 30m</div>
          </div>
          <span
            key={phase}
            className={`animate-pop rounded-full px-3 py-1 text-xs font-medium ${PHASES[phase].cls}`}
          >
            {PHASES[phase].label}
          </span>
        </div>
      </div>

      {/* Badge melayang: approval */}
      <div
        className={`absolute -right-2 -top-5 animate-float rounded-input border border-border bg-surface px-3 py-2 shadow-lg transition-opacity duration-500 sm:-right-8 ${approved ? "opacity-100" : "opacity-0"}`}
        aria-hidden
      >
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="flex size-5 items-center justify-center rounded-full bg-success text-[10px] text-white">✓</span>
          Disetujui oleh Dina
        </div>
      </div>

      {/* Badge melayang: limit */}
      <div className="absolute -bottom-6 -left-2 w-52 animate-float-slow rounded-input border border-border bg-surface p-3 shadow-lg sm:-left-10" aria-hidden>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted">Jam bulan ini</span>
          <span className="font-semibold">26,5 / 30</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-warning" style={{ width: "88%" }} />
        </div>
        <div className="mt-1.5 text-[11px] text-[#8a5f0a]">Mendekati limit</div>
      </div>
    </div>
  );
}
