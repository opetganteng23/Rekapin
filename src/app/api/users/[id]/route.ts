import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { overtimeRecords, users } from "@/lib/db";

const editSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
});

// Update: admin mengubah nama & email user lain.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return badRequest("ID tidak valid");
  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);

  const col = await users();
  const _id = new ObjectId(id);
  const clash = await col.findOne({ email: parsed.data.email, _id: { $ne: _id } });
  if (clash) return badRequest("Email sudah dipakai pengguna lain", 409);

  const res = await col.updateOne({ _id }, { $set: parsed.data });
  if (res.matchedCount === 0) return badRequest("User tidak ditemukan", 404);
  return NextResponse.json({ ok: true });
}

// Delete: hanya untuk user yang belum punya riwayat lembur. Selain itu, gunakan "Hapus akses" (nonaktifkan).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return badRequest("ID tidak valid");
  if (id === a.user.id) return badRequest("Tidak bisa menghapus akun sendiri", 403);

  const _id = new ObjectId(id);
  const col = await users();
  const target = await col.findOne({ _id }, { projection: { role: 1 } });
  if (!target) return badRequest("User tidak ditemukan", 404);
  if (target.role === "admin") return badRequest("Akun admin tidak bisa dihapus", 403);

  const history = await (await overtimeRecords()).countDocuments({ userId: _id }, { limit: 1 });
  if (history > 0) {
    return badRequest("User ini punya riwayat lembur. Gunakan \"Hapus akses\" agar riwayat tetap utuh.", 409);
  }
  await col.deleteOne({ _id });
  return NextResponse.json({ ok: true });
}
