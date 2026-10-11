import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { users } from "@/lib/db";

const schema = z.object({ isActive: z.boolean() });

// FR-20b: "Hapus akses" = nonaktifkan, riwayat lembur tetap utuh.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return badRequest("ID tidak valid");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("isActive harus boolean");
  if (id === a.user.id) return badRequest("Tidak bisa menonaktifkan akun sendiri", 403);

  const res = await (await users()).updateOne(
    { _id: new ObjectId(id) },
    { $set: { isActive: parsed.data.isActive } },
  );
  if (res.matchedCount === 0) return badRequest("User tidak ditemukan", 404);
  return NextResponse.json({ ok: true });
}
