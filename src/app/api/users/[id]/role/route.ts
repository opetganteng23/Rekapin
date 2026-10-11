import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { users } from "@/lib/db";

const schema = z.object({ role: z.enum(["employee", "approver"]) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return badRequest("ID tidak valid");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Role harus employee atau approver");

  // FR-20c: admin tidak bisa menurunkan role dirinya sendiri.
  if (id === a.user.id) return badRequest("Tidak bisa mengubah role sendiri", 403);

  const res = await (await users()).updateOne(
    { _id: new ObjectId(id), role: { $ne: "admin" } },
    { $set: { role: parsed.data.role } },
  );
  if (res.matchedCount === 0) return badRequest("User tidak ditemukan atau berstatus admin", 404);
  return NextResponse.json({ ok: true });
}
