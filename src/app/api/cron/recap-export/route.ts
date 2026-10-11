import { NextResponse } from "next/server";
import { getSettings, isDueToday, previousPeriod, runRecap } from "@/lib/recap";

// Vercel Cron memanggil dengan GET + header Authorization: Bearer $CRON_SECRET.
// POST didukung sesuai spec (pemicu manual/scheduler lain).
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET belum diset" }, { status: 500 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const s = await getSettings();
  // Cron berjalan harian; hanya eksekusi jika hari ini sesuai jadwal di pengaturan.
  if (!isDueToday(s)) return NextResponse.json({ ran: false, reason: "bukan jadwal hari ini" });

  const result = await runRecap(s.recapFrequency, previousPeriod(s.recapFrequency));
  return NextResponse.json({ ran: result.status === "created", status: result.status });
}

export const GET = handle;
export const POST = handle;
