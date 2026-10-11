import type { Metadata } from "next";
import { overtimeRecords } from "@/lib/db";
import { fmtDate, fmtDuration, fmtTime, monthRangeWib } from "@/lib/overtime";
import { recaps } from "@/lib/recap";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui";
import { ApprovalsTable, type PendingRow } from "./approvals-table";

export const metadata: Metadata = { title: "Persetujuan — Rekapin" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireUser(["approver"]);
  const sp = await searchParams;
  const from = sp.from && ISO_DATE.test(sp.from) ? sp.from : "";
  const to = sp.to && ISO_DATE.test(sp.to) ? sp.to : "";
  const exportQuery = new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString();

  const col = await overtimeRecords();
  const month = monthRangeWib();
  const inMonth = { $gte: month.start, $lt: month.end };

  const [pending, stats, autoRecaps] = await Promise.all([
    col
      .aggregate<{
        _id: import("mongodb").ObjectId;
        name: string;
        startTime: Date;
        finishTime: Date;
        totalHours: number;
        evidenceUrls: string[];
      }>([
        { $match: { status: "pending" } },
        { $sort: { startTime: 1 } },
        { $limit: 200 },
        { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u" } },
        { $unwind: "$u" },
        { $project: { name: "$u.name", startTime: 1, finishTime: 1, totalHours: 1, evidenceUrls: 1 } },
      ])
      .toArray(),
    col
      .aggregate<{ _id: string; count: number; hours: number }>([
        { $match: { startTime: inMonth } },
        { $group: { _id: "$status", count: { $sum: 1 }, hours: { $sum: "$totalHours" } } },
      ])
      .toArray(),
    (await recaps()).find({ url: { $ne: null } }).sort({ periodStart: -1 }).limit(6).toArray(),
  ]);

  const stat = (s: string) => stats.find((x) => x._id === s);
  const pendingCount = await col.countDocuments({ status: "pending" });

  const rows: PendingRow[] = pending.map((r) => ({
    id: r._id.toString(),
    name: r.name,
    initials: r.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    date: fmtDate(r.startTime),
    time: `${fmtTime(r.startTime)}–${fmtTime(r.finishTime)}`,
    duration: fmtDuration(r.totalHours),
    evidence: r.evidenceUrls,
  }));

  const cards = [
    { label: "Menunggu", value: String(pendingCount) },
    { label: "Disetujui bulan ini", value: String(stat("approved")?.count ?? 0) },
    { label: "Ditolak bulan ini", value: String(stat("rejected")?.count ?? 0) },
    { label: "Total jam bulan ini (disetujui)", value: `${(stat("approved")?.hours ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 })}j` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pengajuan Menunggu Persetujuan</h1>
          <p className="text-sm text-muted">{pendingCount} pengajuan perlu direview</p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Dari
            <input type="date" name="from" defaultValue={from} className="h-10 rounded-input border border-border bg-surface px-2 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Sampai
            <input type="date" name="to" defaultValue={to} className="h-10 rounded-input border border-border bg-surface px-2 text-sm" />
          </label>
          <button className="h-10 rounded-input border border-border px-3 text-sm font-medium hover:bg-bg">Terapkan</button>
          <a
            href={`/api/overtime/export${exportQuery ? `?${exportQuery}` : ""}`}
            className="flex h-10 items-center rounded-input bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Export Rekap .xlsx
          </a>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="!p-4">
            <div className="text-xs text-muted">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <ApprovalsTable rows={rows} />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Rekap Otomatis</h2>
        {autoRecaps.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Belum ada rekap otomatis yang dihasilkan.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {autoRecaps.map((r) => (
              <li key={r._id.toString()} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  {fmtDate(r.periodStart)} – {fmtDate(new Date(r.periodEnd.getTime() - 1))}
                  <span className="ml-2 text-muted">({r.rowCount} pengajuan)</span>
                </span>
                <a href={r.url!} className="font-medium text-primary hover:underline">Unduh .xlsx</a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
