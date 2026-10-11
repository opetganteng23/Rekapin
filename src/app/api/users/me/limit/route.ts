import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { auth } from "@/auth";
import { users } from "@/lib/db";

const schema = z.object({ limit: z.number().min(1, "Limit minimal 1 jam").max(200, "Limit maksimal 200 jam").nullable() });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  await (await users()).updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { monthlyHourLimit: parsed.data.limit } },
  );
  return NextResponse.json({ ok: true, limit: parsed.data.limit });
}
