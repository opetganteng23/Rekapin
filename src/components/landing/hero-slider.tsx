"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface Slide {
  src: string;
  alt: string;
}

const INTERVAL = 5500;

/** Slider gambar hero: crossfade + zoom pelan, dot, panah, geser (swipe), jeda saat hover. */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), INTERVAL);
    return () => clearInterval(t);
  }, [n, paused, i]);

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[22px] border border-border bg-surface shadow-[0_30px_80px_-20px_rgba(79,124,172,0.35)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Galeri"
      >
        {slides.map((s, idx) => (
          <div
            key={s.src}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}
            aria-hidden={idx !== i}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.src}
              alt={s.alt}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding="async"
              className={`size-full object-cover ${idx === i ? "animate-kenburns" : ""}`}
            />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />

        {n > 1 && (
          <>
            <button onClick={() => go(i - 1)} aria-label="Slide sebelumnya" className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-text opacity-0 shadow backdrop-blur transition-opacity hover:bg-surface focus-visible:opacity-100 sm:opacity-70 sm:hover:opacity-100">‹</button>
            <button onClick={() => go(i + 1)} aria-label="Slide berikutnya" className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-text opacity-0 shadow backdrop-blur transition-opacity hover:bg-surface focus-visible:opacity-100 sm:opacity-70 sm:hover:opacity-100">›</button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => go(idx)}
                  aria-label={`Ke slide ${idx + 1}`}
                  aria-current={idx === i}
                  className={`h-2 rounded-full transition-all duration-300 ${idx === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/90"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chip melayang (dekoratif) */}
      <div className="absolute -right-2 -top-4 animate-float rounded-input border border-border bg-surface px-3 py-2 shadow-lg sm:-right-6" aria-hidden>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="flex size-5 items-center justify-center rounded-full bg-success text-[10px] text-white">✓</span>
          Disetujui
        </div>
      </div>
      <div className="absolute -bottom-5 -left-2 w-44 animate-float-slow rounded-input border border-border bg-surface p-3 shadow-lg sm:-left-8" aria-hidden>
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted">Jam bulan ini</span>
          <span className="font-semibold">26,5 / 30</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-warning" style={{ width: "88%" }} />
        </div>
      </div>
    </div>
  );
}
