import type { Metadata } from "next";
import { ObjectId } from "mongodb";
import { overtimeRecords, users } from "@/lib/db";
import { fmtDate, fmtDuration, fmtTime, monthRangeWib, todayWib, toWibDate } from "@/lib/overtime";
import { requireUser } from "@/lib/session";
import { Card, StatusBadge } from "@/components/ui";
import { OvertimeForm } from "./overtime-form";
import { LimitCard } from "./limit-card";

export const metadata: Metadata = { title: "Dashboard Saya — Rekapin" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const userId = new ObjectId(user.id);
  const col = await overtimeRecords();

  const from = sp.from && ISO_DATE.test(sp.from) ? sp.from : "";
  const to = sp.to && ISO_DATE.test(sp.to) ? sp.to : "";
  const range: Record<string, Date> = {};
  if (from) range.$gte = toWibDate(from, "00:00");
  if (to) range.$lt = new Date(toWibDate(to, "00:00").getTime() + 86_400_000);

  const month = monthRangeWib();
  const [me, usage, records] = await Promise.all([
    (await users()).findOne({ _id: userId }, { projection: { monthlyHourLimit: 1 } }),
    col
      .aggregate<{ total: number }>([
        { $match: { userId, status: { $ne: "rejected" }, startTime: { $gte: month.start, $lt: month.end } } },
        { $group: { _id: null, total: { $sum: "$totalHours" } } },
      ])
      .toArray(),
    col
      .find({ userId, ...(from || to ? { startTime: range } : {}) })
      .sort({ startTime: -1 })
      .limit(100)
      .toArray(),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <OvertimeForm today={todayWib()} />
        <LimitCard hours={usage[0]?.total ?? 0} limit={me?.monthlyHourLimit ?? null} />
      </div>

      <Card className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-lg font-semibold">Riwayat Pengajuan</h2>
          <form className="flex flex-wrap items-end gap-2" method="get">
            <label className="flex flex-col gap-1 text-xs font-medium">
              Dari
              <input type="date" name="from" defaultValue={from} className="h-10 rounded-input border border-border bg-surface px-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Sampai
              <input type="date" name="to" defaultValue={to} className="h-10 rounded-input border border-border bg-surface px-2 text-sm" />
            </label>
            <button className="h-10 rounded-input border border-border px-4 text-sm font-medium hover:bg-bg">Terapkan</button>
            {(from || to) && (
              <a href="/dashboard" className="flex h-10 items-center px-2 text-sm text-muted hover:text-text">Reset</a>
            )}
          </form>
        </div>

        {records.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            {from || to ? "Tidak ada pengajuan pada rentang ini." : "Belum ada pengajuan. Mulai dengan mengisi form di samping."}
          </p>
        ) : (
          <>
            {/* Tabel di layar lebar */}
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Tanggal</th>
                    <th className="py-2 pr-4 font-medium">Waktu</th>
                    <th className="py-2 pr-4 font-medium">Durasi</th>
                    <th className="py-2 pr-4 font-medium">Bukti</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((r) => (
                    <tr key={r._id.toString()}>
                      <td className="py-3 pr-4 whitespace-nowrap">{fmtDate(r.startTime)}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{fmtTime(r.startTime)}–{fmtTime(r.finishTime)}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{fmtDuration(r.totalHours)}</td>
                      <td className="py-3 pr-4">
                        {r.evidenceUrls.map((u, i) => (
                          <a key={u} href={u} target="_blank" rel="noreferrer" className="mr-2 text-primary hover:underline">
                            lihat{r.evidenceUrls.length > 1 ? ` ${i + 1}` : ""}
                          </a>
                        ))}
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-3 text-muted">{r.rejectNote ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Kartu di layar kecil */}
            <ul className="mt-4 flex flex-col gap-3 md:hidden">
              {records.map((r) => (
                <li key={r._id.toString()} className="rounded-input border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{fmtDate(r.startTime)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {fmtTime(r.startTime)}–{fmtTime(r.finishTime)} · {fmtDuration(r.totalHours)}
                  </div>
                  {r.rejectNote && <p className="mt-2 text-sm text-danger">Catatan: {r.rejectNote}</p>}
                  <div className="mt-2 flex gap-3 text-sm">
                    {r.evidenceUrls.map((u, i) => (
                      <a key={u} href={u} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Bukti{r.evidenceUrls.length > 1 ? ` ${i + 1}` : ""}
                      </a>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  );
}
