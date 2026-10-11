import type { Metadata } from "next";
import { fmtDate } from "@/lib/overtime";
import { getSettings, nextRun, recaps } from "@/lib/recap";
import { requireUser } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Pengaturan | Rekapin" };

const dt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jakarta" });

export default async function SettingsPage() {
  await requireUser(["admin"]);
  const s = await getSettings();
  const next = nextRun(s);
  const last = await (await recaps()).find({}).sort({ createdAt: -1 }).limit(1).toArray();

  return (
    <SettingsForm
      initial={{
        recapFrequency: s.recapFrequency,
        recapDayOfMonth: s.recapDayOfMonth,
        recapDayOfWeek: s.recapDayOfWeek,
        recapHour: s.recapHour,
      }}
      nextText={
        next
          ? `${dt.format(next.at)} WIB, mencakup periode ${fmtDate(next.period.start)} – ${fmtDate(new Date(next.period.end.getTime() - 1))}`
          : "Belum terjadwal"
      }
      lastText={last[0] ? `Terakhir dibuat ${dt.format(last[0].createdAt)} (${last[0].rowCount} pengajuan)` : "Belum pernah dibuat"}
    />
  );
}
