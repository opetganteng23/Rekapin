import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiUser, badRequest } from "@/lib/api";
import { users } from "@/lib/db";
import { resetLink, sendEmail } from "@/lib/email";
import { newResetToken } from "@/lib/tokens";

// Admin mengirim link reset password ke user (admin tidak pernah melihat/menentukan password user).
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return badRequest("ID tidak valid");

  const col = await users();
  const user = await col.findOne({ _id: new ObjectId(id) });
  if (!user) return badRequest("User tidak ditemukan", 404);

  const { token, hash, expiresAt } = newResetToken();
  await col.updateOne({ _id: user._id }, { $set: { resetTokenHash: hash, resetTokenExpiresAt: expiresAt } });
  const link = resetLink(token);
  try {
    await sendEmail(
      user.email,
      "Reset kata sandi Rekapin",
      `<p>Admin meminta Anda mengatur ulang kata sandi (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p>`,
    );
  } catch (e) {
    console.error("[admin-reset] gagal kirim email:", e);
    return badRequest("Email gagal terkirim. Periksa konfigurasi SMTP.", 502);
  }
  return NextResponse.json({ ok: true });
}
