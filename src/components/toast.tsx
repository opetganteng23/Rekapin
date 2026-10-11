"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Tone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}
interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const STYLE: Record<Tone, { bar: string; icon: string; glyph: string }> = {
  success: { bar: "bg-success", icon: "bg-success/10 text-success", glyph: "✓" },
  error: { bar: "bg-danger", icon: "bg-danger/10 text-danger", glyph: "!" },
  info: { bar: "bg-primary", icon: "bg-primary/10 text-primary", glyph: "i" },
};

const DURATION = { success: 4000, info: 4000, error: 7000 } as const;

/** Notifikasi singkat untuk hasil aksi (simpan, hapus, setujui, dll). Dipasang di root layout agar bertahan antar halaman. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone: Tone) => (title: string, description?: string) => {
      const id = nextId.current++;
      setItems((p) => [...p.slice(-3), { id, tone, title, description }]);
      setTimeout(() => dismiss(id), DURATION[tone]);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: push("success"), error: push("error"), info: push("info") }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end print:hidden"
      >
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const s = STYLE[item.tone];
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-card border border-border bg-surface py-3 pl-5 pr-3 shadow-[0_12px_32px_-12px_rgba(31,41,55,0.35)] transition-all duration-300 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} aria-hidden />
      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.icon}`} aria-hidden>
        {s.glyph}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs leading-snug text-muted">{item.description}</p>}
      </div>
      <button onClick={onClose} aria-label="Tutup notifikasi" className="-m-1 shrink-0 p-1 text-muted hover:text-text">
        ✕
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider");
  return ctx;
}
