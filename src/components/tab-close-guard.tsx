"use client";

import { useEffect, useState } from "react";

const AUTH_CHANGED = "rekapin:auth-changed";
const TABS_KEY = "rk_tabs";
const BEAT_MS = 5_000;
const ALIVE_MS = 15_000;

/** Beri tahu penjaga bahwa status login berubah (setelah login, daftar, atau logout). */
export const notifyAuthChanged = () => window.dispatchEvent(new Event(AUTH_CHANGED));

type TabMap = Record<string, number>;
const readTabs = (): TabMap => {
  try {
    return JSON.parse(localStorage.getItem(TABS_KEY) ?? "{}");
  } catch {
    return {};
  }
};
const writeTabs = (m: TabMap) => {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(m));
  } catch {}
};

/**
 * Saat user login:
 *  1. Menutup/refresh tab memunculkan dialog konfirmasi bawaan browser (teks dialog tidak bisa diubah situs).
 *  2. Bila tab TERAKHIR benar-benar ditutup, server diberi tahu lewat beacon; sesi berakhir setelah masa tenggang.
 *     Refresh, atau menutup satu dari beberapa tab, tidak mengakhiri sesi.
 */
export function TabCloseGuard() {
  const [active, setActive] = useState(false);

  // Cek status login saat pertama kali dan setiap kali ada perubahan.
  useEffect(() => {
    let cancelled = false;
    const probe = () =>
      fetch("/api/auth/session", { cache: "no-store" })
        .then((r) => r.json())
        .then((s) => !cancelled && setActive(!!s?.user))
        .catch(() => {});
    probe();
    window.addEventListener(AUTH_CHANGED, probe);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED, probe);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const id = crypto.randomUUID();

    const beat = () => {
      const now = Date.now();
      const m = readTabs();
      for (const k of Object.keys(m)) if (now - m[k] > ALIVE_MS) delete m[k];
      m[id] = now;
      writeTabs(m);
    };
    beat();
    const timer = setInterval(beat, BEAT_MS);

    // Halaman dimuat lagi (refresh dll): batalkan penanda penutupan dari halaman sebelumnya.
    fetch("/api/auth/closing", { method: "DELETE", keepalive: true }).catch(() => {});

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // dibutuhkan sebagian browser agar dialog tampil
    };

    const onPageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return; // masuk bfcache, bukan ditutup
      const m = readTabs();
      delete m[id];
      writeTabs(m);
      const now = Date.now();
      const othersOpen = Object.values(m).some((t) => now - t < ALIVE_MS);
      if (!othersOpen) navigator.sendBeacon("/api/auth/closing");
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      const m = readTabs();
      delete m[id];
      writeTabs(m);
    };
  }, [active]);

  return null;
}
