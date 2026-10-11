import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/lib/db";
import { newResetToken } from "@/lib/tokens";
import { resetLink, sendEmail } from "@/lib/email";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  const col = await users();
  const user = await col.findOne({ email: parsed.data.email, isActive: true });
  if (user) {
    const { token, hash, expiresAt } = newResetToken();
    await col.updateOne(
      { _id: user._id },
      { $set: { resetTokenHash: hash, resetTokenExpiresAt: expiresAt } },
    );
    const link = resetLink(token);
    try {
      await sendEmail(
        user.email,
        "Reset kata sandi Rekapin",
        `<p>Klik link berikut untuk mengatur kata sandi baru (berlaku 1 jam):</p><p><a href="${link}">${link}</a></p>`,
      );
    } catch (e) {
      // Jangan bocorkan status akun lewat error; cukup catat di server.
      console.error("[forgot-password] gagal kirim email:", e);
    }
  }
  // Respons sama baik email ada maupun tidak, agar tidak membocorkan akun terdaftar.
  return NextResponse.json({ ok: true });
}
