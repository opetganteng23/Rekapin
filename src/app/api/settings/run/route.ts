import { NextResponse } from "next/server";
import { apiUser } from "@/lib/api";
import { getSettings, previousPeriod, runRecap } from "@/lib/recap";

// Admin dapat memicu rekap periode terakhir sekarang (tanpa menunggu cron).
export async function POST() {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const s = await getSettings();
  const result = await runRecap(s.recapFrequency, previousPeriod(s.recapFrequency));
  return NextResponse.json({
    status: result.status,
    rowCount: result.recap.rowCount,
    emailed: result.recap.emailedTo.length,
    url: result.recap.url,
  });
}
