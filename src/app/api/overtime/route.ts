import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { auth } from "@/auth";
import { overtimeRecords, type OvertimeDoc } from "@/lib/db";
import { calcHours, toWibDate } from "@/lib/overtime";

const submitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Jam mulai tidak valid"),
  finish: z.string().regex(/^\d{2}:\d{2}$/, "Jam selesai tidak valid"),
  evidenceUrls: z
    .array(z.string().url().startsWith("https://"))
    .min(1, "Lampirkan minimal 1 bukti")
    .max(5, "Maksimal 5 bukti"),
});

const RATE_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const parsed = submitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { date, start, finish, evidenceUrls } = parsed.data;
  const startTime = toWibDate(date, start);
  const finishTime = toWibDate(date, finish);
  if (isNaN(startTime.getTime()) || isNaN(finishTime.getTime())) {
    return NextResponse.json({ error: "Tanggal/jam tidak valid" }, { status: 400 });
  }
  const totalHours = calcHours(startTime, finishTime);
  if (totalHours <= 0) {
    return NextResponse.json({ error: "Jam selesai harus setelah jam mulai" }, { status: 400 });
  }
  if (totalHours > 16) {
    return NextResponse.json({ error: "Durasi lembur maksimal 16 jam" }, { status: 400 });
  }
  if (startTime.getTime() > Date.now()) {
    return NextResponse.json({ error: "Tanggal lembur tidak boleh di masa depan" }, { status: 400 });
  }

  const col = await overtimeRecords();
  const userId = new ObjectId(session.user.id);

  const recent = await col.countDocuments({
    userId,
    createdAt: { $gt: new Date(Date.now() - RATE_LIMIT.windowMs) },
  });
  if (recent >= RATE_LIMIT.max) {
    return NextResponse.json({ error: "Terlalu banyak pengajuan, coba lagi nanti" }, { status: 429 });
  }
  // Cegah pengajuan ganda yang tumpang tindih (selain yang sudah ditolak).
  const overlap = await col.findOne({
    userId,
    status: { $ne: "rejected" },
    startTime: { $lt: finishTime },
    finishTime: { $gt: startTime },
  });
  if (overlap) {
    return NextResponse.json({ error: "Waktu ini tumpang tindih dengan pengajuan lain" }, { status: 409 });
  }

  const now = new Date();
  const doc: Omit<OvertimeDoc, "_id"> = {
    userId, startTime, finishTime, totalHours, evidenceUrls,
    status: "pending", createdAt: now, updatedAt: now,
  };
  const res = await col.insertOne(doc as OvertimeDoc);
  return NextResponse.json({ id: res.insertedId.toString(), totalHours }, { status: 201 });
}
