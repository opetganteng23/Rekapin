"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export const NAV_START_EVENT = "rekapin:nav-start";

/** Panggil saat navigasi terprogram dimulai (mis. router.push) agar bar progres muncul. */
export const signalNavStart = () => window.dispatchEvent(new Event(NAV_START_EVENT));

/**
 * Bar progres tipis di atas halaman. Mulai saat tautan internal diklik (atau signalNavStart dipanggil),
 * selesai saat URL berubah. Ada batas waktu agar tidak menggantung bila navigasi tidak mengubah URL.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [progress, setProgress] = useState(0); // 0 = tersembunyi
  const [visible, setVisible] = useState(false);
  const timers = useRef<{ tick?: ReturnType<typeof setInterval>; guard?: ReturnType<typeof setTimeout>; hide?: ReturnType<typeof setTimeout> }>({});

  function stopTimers() {
    clearInterval(timers.current.tick);
    clearTimeout(timers.current.guard);
  }

  function start() {
    stopTimers();
    clearTimeout(timers.current.hide);
    setVisible(true);
    setProgress(12);
    // Merayap pelan mendekati 90% — tidak pernah penuh sebelum navigasi benar-benar selesai.
    timers.current.tick = setInterval(() => setProgress((p) => p + (92 - p) * 0.08), 200);
    timers.current.guard = setTimeout(finish, 12_000);
  }

  function finish() {
    stopTimers();
    setProgress(100);
    timers.current.hide = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 350);
  }

  // URL berubah → navigasi selesai.
  useEffect(() => {
    finish();
    return stopTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // sama / hanya #hash
      start();
    }
    window.addEventListener("click", onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] print:hidden"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms" }}
    >
      <div
        className="h-full bg-primary shadow-[0_0_10px_var(--primary)]"
        style={{ width: `${progress}%`, transition: progress === 100 ? "width 200ms ease-out" : "width 400ms ease-out" }}
      />
    </div>
  );
}
