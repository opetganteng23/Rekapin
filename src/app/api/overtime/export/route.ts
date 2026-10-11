import { NextResponse } from "next/server";
import { ObjectId, type Filter } from "mongodb";
import { apiUser, badRequest } from "@/lib/api";
import type { OvertimeDoc } from "@/lib/db";
import { fmtDate, isYearMonth, monthBounds, toWibDate } from "@/lib/overtime";
import { buildReportWorkbook, buildWorkbook, fetchRows } from "@/lib/recap";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Query: month=YYYY-MM  |  from=&to=YYYY-MM-DD   (rentang menang jika keduanya diberikan)
 *        status=approved  → hanya yang disetujui
 *        report=1         → format laporan (judul, nomor, penyetuju, ringkasan per karyawan)
 */
export async function GET(req: Request) {
  const a = await apiUser();
  if ("error" in a) return a.error;

  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const month = sp.get("month") ?? "";
  const status = sp.get("status");
  if ((from && !ISO_DATE.test(from)) || (to && !ISO_DATE.test(to))) {
    return badRequest("Format tanggal harus YYYY-MM-DD");
  }
  if (month && !isYearMonth(month)) return badRequest("Format bulan harus YYYY-MM");
  if (status && status !== "approved") return badRequest("Status tidak didukung");

  const match: Filter<OvertimeDoc> = {};
  // Employee hanya boleh mengekspor miliknya sendiri; approver/admin melihat semua.
  if (a.user.role === "employee") match.userId = new ObjectId(a.user.id);
  if (status === "approved") match.status = "approved";

  let periodLabel = "Semua periode";
  let slug = "semua";
  if (from || to) {
    match.startTime = {};
    if (from) match.startTime.$gte = toWibDate(from, "00:00");
    if (to) match.startTime.$lt = new Date(toWibDate(to, "00:00").getTime() + 86_400_000);
    periodLabel = `${from ? fmtDate(toWibDate(from, "00:00")) : "awal"} – ${to ? fmtDate(toWibDate(to, "00:00")) : "sekarang"}`;
    slug = `${from || "awal"}_${to || "akhir"}`;
  } else if (month) {
    const b = monthBounds(month);
    match.startTime = { $gte: b.start, $lt: b.end };
    periodLabel = b.label;
    slug = month;
  }

  const rows = await fetchRows(match);
  const file =
    sp.get("report") === "1"
      ? await buildReportWorkbook(rows, {
          title: "Laporan Rekapitulasi Lembur (Disetujui)",
          periodLabel,
          generatedBy: a.user.name ?? "Pengguna",
        })
      : await buildWorkbook(rows);

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="rekap-lembur-${slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
