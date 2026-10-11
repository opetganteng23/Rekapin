import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { settings } from "@/lib/db";
import { getSettings } from "@/lib/recap";

export async function GET() {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = await getSettings();
  return NextResponse.json(rest);
}

const schema = z.object({
  recapFrequency: z.enum(["monthly", "weekly"]),
  // Maks 28 agar jadwal selalu ada di setiap bulan.
  recapDayOfMonth: z.number().int().min(1).max(28),
  recapDayOfWeek: z.number().int().min(1).max(7), // 1=Senin .. 7=Minggu
  recapHour: z.number().int().min(0).max(23),
});

export async function PATCH(req: Request) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Pengaturan tidak valid");

  await (await settings()).updateOne(
    {},
    { $set: { ...parsed.data, updatedBy: new ObjectId(a.user.id), updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json({ ok: true });
}
