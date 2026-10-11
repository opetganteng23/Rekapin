import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { users } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter").max(72).optional(),
});

export async function PATCH(req: Request) {
  const a = await apiUser();
  if ("error" in a) return a.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { name, currentPassword, newPassword } = parsed.data;

  const col = await users();
  const _id = new ObjectId(a.user.id);
  const set: Record<string, string> = {};
  if (name) set.name = name;

  if (newPassword) {
    const me = await col.findOne({ _id }, { projection: { passwordHash: 1 } });
    if (!me || !currentPassword || !(await bcrypt.compare(currentPassword, me.passwordHash))) {
      return badRequest("Kata sandi lama salah", 403);
    }
    set.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  if (Object.keys(set).length === 0) return badRequest("Tidak ada perubahan");

  await col.updateOne({ _id }, { $set: set });
  return NextResponse.json({ ok: true });
}
