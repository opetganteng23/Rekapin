// Penanda "halaman terakhir ditutup". Dipasang lewat beacon saat tab terakhir ditutup,
// dibatalkan bila halaman dimuat lagi dalam masa tenggang (mis. refresh).
export const CLOSING_COOKIE = "rk_closing";

/** Masa tenggang sebelum sesi dianggap berakhir. Bisa diubah lewat env (mis. untuk pengujian). */
export const CLOSE_GRACE_MS = Number(process.env.CLOSE_GRACE_MS ?? 30_000);

export function makeClosingValue(sid: string, now = Date.now()) {
  return `${sid}.${now}`;
}

export function parseClosingValue(value: string | undefined) {
  if (!value) return null;
  const i = value.lastIndexOf(".");
  if (i < 1) return null;
  const ts = Number(value.slice(i + 1));
  return Number.isFinite(ts) ? { sid: value.slice(0, i), ts } : null;
}
