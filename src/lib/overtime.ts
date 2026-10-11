// Semua jam dianggap WIB (UTC+7, tanpa DST).
const WIB = "+07:00";
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export function toWibDate(date: string, time: string) {
  return new Date(`${date}T${time}:00${WIB}`);
}

export function calcHours(start: Date, finish: Date) {
  return Math.round(((finish.getTime() - start.getTime()) / 3_600_000) * 100) / 100;
}

/** Awal & akhir (eksklusif) bulan berjalan menurut WIB. */
export function monthRangeWib(now = new Date()) {
  const w = new Date(now.getTime() + WIB_OFFSET_MS);
  const y = w.getUTCFullYear();
  const m = w.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1) - WIB_OFFSET_MS),
    end: new Date(Date.UTC(y, m + 1, 1) - WIB_OFFSET_MS),
  };
}

export function todayWib(now = new Date()) {
  return new Date(now.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

export function fmtDuration(hours: number) {
  const totalMin = Math.round(hours * 60);
  return `${Math.floor(totalMin / 60)}j ${String(totalMin % 60).padStart(2, "0")}m`;
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta",
});
const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta",
});
export const fmtDate = (d: Date) => dateFmt.format(d);
export const fmtTime = (d: Date) => timeFmt.format(d).replace(".", ":");
