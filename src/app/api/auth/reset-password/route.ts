import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { users } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const res = await (await users()).updateOne(
    {
      resetTokenHash: hashToken(parsed.data.token),
      resetTokenExpiresAt: { $gt: new Date() },
    },
    {
      $set: { passwordHash: await bcrypt.hash(parsed.data.password, 12) },
      $unset: { resetTokenHash: "", resetTokenExpiresAt: "" },
    },
  );
  if (res.matchedCount === 0) {
    return NextResponse.json({ error: "Link tidak valid atau sudah kedaluwarsa" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
