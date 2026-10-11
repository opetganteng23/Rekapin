import type { Metadata } from "next";
import Link from "next/link";
import { ObjectId, type Filter } from "mongodb";
import { LogoMark } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { Card } from "@/components/ui";
import type { OvertimeDoc } from "@/lib/db";
import {
  currentYearMonth, fmtDate, fmtDuration, fmtTime, isYearMonth, monthBounds, toWibDate,
} from "@/lib/overtime";
import { fetchRows, summarize } from "@/lib/recap";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Rekap Lembur — Rekapin" };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const MAX_ROWS = 2000;

export default async function RecapPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const from = sp.from && ISO_DATE.test(sp.from) ? sp.from : "";
  const to = sp.to && ISO_DATE.test(sp.to) ? sp.to : "";
  const rangeMode = !!(from || to);
  const month = sp.month && isYearMonth(sp.month) ? sp.month : currentYearMonth();
  const mb = monthBounds(month);

  const match: Filter<OvertimeDoc> = { status: "approved" };
  if (user.role === "employee") match.userId = new ObjectId(user.id);
  let periodLabel: string;
  if (rangeMode) {
    match.startTime = {};
    if (from) match.startTime.$gte = toWibDate(from, "00:00");
    if (to) match.startTime.$lt = new Date(toWibDate(to, "00:00").getTime() + DAY);
    periodLabel = `${from ? fmtDate(toWibDate(from, "00:00")) : "awal"} – ${to ? fmtDate(toWibDate(to, "00:00")) : "sekarang"}`;
  } else {
    match.startTime = { $gte: mb.start, $lt: mb.end };
    periodLabel = mb.label;
  }

  const all = await fetchRows(match);
  const truncated = all.length > MAX_ROWS;
  const rows = truncated ? all.slice(0, MAX_ROWS) : all;
  const per = summarize(rows);
  const totalHours = rows.reduce((s, r) => s + r.totalHours, 0);

  const q = new URLSearchParams(rangeMode ? { ...(from && { from }), ...(to && { to }) } : { month });
  const exportHref = `/api/overtime/export?${new URLSearchParams({ status: "approved", report: "1" })}&${q}`;
  const scope = user.role === "employee" ? `Karyawan: ${user.name}` : "Seluruh karyawan";
  const printedAt = fmtDate(new Date());

  const stat = [
    ["Pengajuan disetujui", String(rows.length)],
    ["Karyawan", String(per.length)],
    ["Total jam lembur", fmtDuration(totalHours)],
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 print:max-w-none print:gap-4">
      {/* Kop laporan (hanya saat dicetak) */}
      <div className="hidden items-center gap-4 border-b-2 border-text pb-3 print:flex">
        <LogoMark size={56} />
        <div>
          <div className="text-lg font-semibold leading-tight">Laporan Rekapitulasi Lembur</div>
          <div className="text-sm">Pengajuan lembur yang telah disetujui</div>
          <div className="text-sm">Periode: <b>{periodLabel}</b> · {scope}</div>
        </div>
      </div>

      {/* Header + kontrol (disembunyikan saat dicetak) */}
      <div className="flex flex-col gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Rekap Lembur</h1>
          <p className="text-sm text-muted">
            Hanya pengajuan yang <b className="text-text">sudah disetujui atasan</b>. Periode: <b className="text-text">{periodLabel}</b> · {scope}
          </p>
        </div>

        <Card className="!p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex items-end gap-1">
              <Link
                href={`/recap?month=${mb.prev}`}
                aria-label="Bulan sebelumnya"
                className="flex size-10 items-center justify-center rounded-input border border-border hover:bg-bg"
              >
                ‹
              </Link>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Bulan
                <input
                  type="month"
                  name="month"
                  defaultValue={month}
                  className="h-10 rounded-input border border-border bg-surface px-2 text-sm"
                />
              </label>
              <Link
                href={`/recap?month=${mb.next}`}
                aria-label="Bulan berikutnya"
                className="flex size-10 items-center justify-center rounded-input border border-border hover:bg-bg"
              >
                ›
              </Link>
            </div>

            <span className="pb-2.5 text-xs text-muted">atau rentang</span>

            <label className="flex flex-col gap-1 text-xs font-medium">
              Dari
              <input type="date" name="from" defaultValue={from} className="h-10 rounded-input border border-border bg-surface px-2 text-sm" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">
              Sampai
              <input type="date" name="to" defaultValue={to} className="h-10 rounded-input border border-border bg-surface px-2 text-sm" />
            </label>
            <button className="h-10 rounded-input bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover">Terapkan</button>
            {rangeMode && (
              <Link href="/recap" className="flex h-10 items-center px-2 text-sm text-muted hover:text-text">Reset ke bulan ini</Link>
            )}
          </form>
          <p className="mt-2 text-xs text-muted">Jika rentang tanggal diisi, rentang dipakai menggantikan pilihan bulan.</p>
        </Card>

        <div className="flex flex-wrap gap-2">
          <a
            href={exportHref}
            className="inline-flex h-11 items-center gap-2 rounded-input bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Export Excel (.xlsx)
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3 print:gap-2">
        {stat.map(([label, value]) => (
          <div key={label} className="rounded-card border border-border bg-surface p-4 shadow-sm print:rounded-none print:p-2 print:shadow-none">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 text-xl font-semibold sm:text-2xl print:text-base">{value}</div>
          </div>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-sm text-muted">Belum ada pengajuan yang disetujui pada periode ini.</p>
        </Card>
      ) : (
        <>
          {truncated && (
            <p className="rounded-input bg-warning/15 px-3 py-2 text-sm text-[#8a5f0a] print:hidden">
              Menampilkan {MAX_ROWS} dari {all.length} pengajuan. Persempit periode, atau gunakan Export Excel untuk data lengkap.
            </p>
          )}

          {/* Ringkasan per karyawan */}
          <Card className="print:break-inside-avoid print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <h2 className="text-base font-semibold">Ringkasan per Karyawan</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm print:text-xs">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="w-10 py-2 pr-3 font-medium">No</th>
                    <th className="py-2 pr-3 font-medium">Nama</th>
                    <th className="py-2 pr-3 text-right font-medium">Pengajuan</th>
                    <th className="py-2 text-right font-medium">Total Jam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {per.map((p, i) => (
                    <tr key={p.name}>
                      <td className="py-2 pr-3 text-muted">{i + 1}</td>
                      <td className="py-2 pr-3">{p.name}</td>
                      <td className="py-2 pr-3 text-right">{p.count}</td>
                      <td className="py-2 text-right">{fmtDuration(p.hours)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-text font-semibold">
                  <tr>
                    <td colSpan={2} className="py-2">Total</td>
                    <td className="py-2 pr-3 text-right">{rows.length}</td>
                    <td className="py-2 text-right">{fmtDuration(totalHours)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Detail */}
          <Card className="print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <h2 className="text-base font-semibold">Rincian Pengajuan</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm print:min-w-0 print:text-xs">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="w-10 py-2 pr-3 font-medium">No</th>
                    <th className="py-2 pr-3 font-medium">Nama</th>
                    <th className="py-2 pr-3 font-medium">Tanggal</th>
                    <th className="py-2 pr-3 font-medium">Waktu</th>
                    <th className="py-2 pr-3 text-right font-medium">Durasi</th>
                    <th className="py-2 font-medium">Disetujui oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r, i) => (
                    <tr key={i} className="print:break-inside-avoid">
                      <td className="py-2 pr-3 text-muted">{i + 1}</td>
                      <td className="py-2 pr-3">{r.name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(r.startTime)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{fmtTime(r.startTime)}–{fmtTime(r.finishTime)}</td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">{fmtDuration(r.totalHours)}</td>
                      <td className="py-2">{r.approvedByName ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-text font-semibold">
                  <tr>
                    <td colSpan={4} className="py-2">Total</td>
                    <td className="py-2 pr-3 text-right">{fmtDuration(totalHours)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Tanda tangan (hanya saat dicetak) */}
      <div className="mt-6 hidden break-inside-avoid grid-cols-2 gap-10 text-sm print:grid">
        <div>
          <div>Dicetak pada {printedAt}</div>
          <div className="mt-1">Dibuat oleh,</div>
          <div className="mt-16 border-t border-text pt-1 font-medium">{user.name}</div>
        </div>
        <div>
          <div>&nbsp;</div>
          <div className="mt-1">Mengetahui,</div>
          <div className="mt-16 border-t border-text pt-1">(………………………………)</div>
        </div>
      </div>
    </div>
  );
}
