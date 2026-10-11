import ExcelJS from "exceljs";
import { put } from "@vercel/blob";
import type { Filter, ObjectId } from "mongodb";
import {
  getDb,
  overtimeRecords,
  settings as settingsCol,
  users,
  type OvertimeDoc,
  type SettingsDoc,
} from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { fmtDate, fmtTime } from "@/lib/overtime";

const WIB_MS = 7 * 3_600_000;
const DAY_MS = 86_400_000;

export interface RecapRow {
  name: string;
  startTime: Date;
  finishTime: Date;
  totalHours: number;
  status: OvertimeDoc["status"];
  rejectNote?: string | null;
}

export interface RecapDoc {
  _id: ObjectId;
  frequency: "monthly" | "weekly";
  periodStart: Date;
  periodEnd: Date; // eksklusif
  url: string | null;
  rowCount: number;
  emailedTo: string[];
  createdAt: Date;
}

export async function recaps() {
  return (await getDb()).collection<RecapDoc>("recaps");
}

const STATUS_LABEL = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" } as const;

/** Ambil baris rekap (digabung dengan nama user), urut waktu. */
export async function fetchRows(match: Filter<OvertimeDoc>): Promise<RecapRow[]> {
  const col = await overtimeRecords();
  return col
    .aggregate<RecapRow>([
      { $match: match },
      { $sort: { startTime: 1 } },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u" } },
      { $unwind: "$u" },
      { $project: { _id: 0, name: "$u.name", startTime: 1, finishTime: 1, totalHours: 1, status: 1, rejectNote: 1 } },
    ])
    .toArray();
}

/** Kolom sesuai FR-15. */
export async function buildWorkbook(rows: RecapRow[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Rekap Lembur");
  ws.columns = [
    { header: "Nama", key: "name", width: 26 },
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Jam Mulai", key: "start", width: 11 },
    { header: "Jam Selesai", key: "finish", width: 12 },
    { header: "Total Jam", key: "hours", width: 11, style: { numFmt: "0.00" } },
    { header: "Status", key: "status", width: 13 },
    { header: "Catatan Approval", key: "note", width: 36 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE4E8EE" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) {
    ws.addRow({
      name: r.name,
      date: fmtDate(r.startTime),
      start: fmtTime(r.startTime),
      finish: fmtTime(r.finishTime),
      hours: r.totalHours,
      status: STATUS_LABEL[r.status],
      note: r.rejectNote ?? "",
    });
  }
  const total = ws.addRow({ name: "Total", hours: rows.reduce((s, r) => s + r.totalHours, 0) });
  total.font = { bold: true };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ---------- Jadwal ----------

const wibParts = (d: Date) => {
  const w = new Date(d.getTime() + WIB_MS);
  return { y: w.getUTCFullYear(), m: w.getUTCMonth(), day: w.getUTCDate(), dow: w.getUTCDay() || 7 }; // 1=Senin..7=Minggu
};
const wibMidnight = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d) - WIB_MS);

/** Periode yang direkap: bulan lalu penuh (bulanan) atau 7 hari terakhir (mingguan). */
export function previousPeriod(frequency: "monthly" | "weekly", now = new Date()) {
  const p = wibParts(now);
  if (frequency === "monthly") {
    return { start: wibMidnight(p.y, p.m - 1, 1), end: wibMidnight(p.y, p.m, 1) };
  }
  const end = wibMidnight(p.y, p.m, p.day);
  return { start: new Date(end.getTime() - 7 * DAY_MS), end };
}

export function isDueToday(s: Pick<SettingsDoc, "recapFrequency" | "recapDayOfMonth" | "recapDayOfWeek">, now = new Date()) {
  const p = wibParts(now);
  return s.recapFrequency === "monthly" ? p.day === s.recapDayOfMonth : p.dow === s.recapDayOfWeek;
}

export async function getSettings(): Promise<SettingsDoc> {
  const doc = await (await settingsCol()).findOne({});
  return (
    doc ?? {
      _id: undefined as never,
      recapFrequency: "monthly",
      recapDayOfMonth: 1,
      recapDayOfWeek: 1,
      recapHour: 6,
      updatedAt: new Date(0),
    }
  );
}

/** Tanggal jalan berikutnya (WIB) untuk pratinjau di halaman pengaturan. */
export function nextRun(s: SettingsDoc, now = new Date()) {
  for (let i = 0; i < 400; i++) {
    const d = new Date(now.getTime() + i * DAY_MS);
    if (isDueToday(s, d)) {
      const p = wibParts(d);
      const at = new Date(wibMidnight(p.y, p.m, p.day).getTime() + s.recapHour * 3_600_000);
      if (at > now) return { at, period: previousPeriod(s.recapFrequency, at) };
    }
  }
  return null;
}

// ---------- Eksekusi ----------

/** Generate rekap periode tertentu, simpan, dan email ke admin & approver. Idempoten per periode. */
export async function runRecap(frequency: "monthly" | "weekly", period: { start: Date; end: Date }) {
  const col = await recaps();
  const existing = await col.findOne({ frequency, periodStart: period.start });
  if (existing) return { status: "exists" as const, recap: existing };

  const rows = await fetchRows({ startTime: { $gte: period.start, $lt: period.end } });
  const file = await buildWorkbook(rows);
  const label = `${fmtDate(period.start)} – ${fmtDate(new Date(period.end.getTime() - 1))}`;
  const filename = `rekap-lembur-${new Date(period.start.getTime() + WIB_MS).toISOString().slice(0, 10)}.xlsx`;

  let url: string | null = null;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    url = (await put(`recaps/${filename}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })).url;
  }

  const recipients = (
    await (await users()).find({ role: { $in: ["admin", "approver"] }, isActive: true }, { projection: { email: 1 } }).toArray()
  ).map((u) => u.email);

  let emailedTo: string[] = [];
  if (recipients.length > 0) {
    try {
      await sendEmail(
        recipients,
        `Rekap lembur ${label}`,
        `<p>Rekap lembur periode <b>${label}</b> terlampir (${rows.length} pengajuan).</p>`,
        [{ filename, content: file }],
      );
      emailedTo = recipients;
    } catch (e) {
      console.error("[recap] gagal kirim email:", e);
    }
  }

  const doc = { frequency, periodStart: period.start, periodEnd: period.end, url, rowCount: rows.length, emailedTo, createdAt: new Date() };
  const res = await col.insertOne(doc as RecapDoc);
  return { status: "created" as const, recap: { ...doc, _id: res.insertedId } as RecapDoc };
}
