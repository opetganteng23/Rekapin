import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { users, type UserDoc } from "@/lib/db";
import { resetLink, sendEmail } from "@/lib/email";
import { newResetToken } from "@/lib/tokens";

export async function GET() {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const list = await (await users())
    .find({}, { projection: { name: 1, email: 1, role: 1, isActive: 1, createdAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json(list.map((u) => ({ ...u, _id: u._id.toString() })));
}

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  role: z.enum(["employee", "approver"]),
});

// FR-20a: undang user baru, kirim link set-password (berlaku 72 jam).
export async function POST(req: Request) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  const { name, email, role } = parsed.data;

  const col = await users();
  if (await col.findOne({ email })) return badRequest("Email sudah terdaftar", 409);

  const { token, hash, expiresAt } = newResetToken(72);
  const doc: Omit<UserDoc, "_id"> = {
    name,
    email,
    // Password acak yang tidak diketahui siapa pun; user menetapkan sendiri lewat link.
    passwordHash: await bcrypt.hash(randomBytes(24).toString("hex"), 12),
    role,
    isActive: true,
    resetTokenHash: hash,
    resetTokenExpiresAt: expiresAt,
    createdAt: new Date(),
  };
  await col.insertOne(doc as UserDoc);

  const link = resetLink(token);
  let emailed = true;
  try {
    await sendEmail(
      email,
      "Undangan bergabung di Rekapin",
      `<p>Halo ${name}, kamu diundang ke Rekapin sebagai <b>${role}</b>.</p><p>Atur kata sandi (berlaku 72 jam): <a href="${link}">${link}</a></p>`,
    );
  } catch (e) {
    console.error("[invite] gagal kirim email:", e);
    emailed = false;
  }
  return NextResponse.json({ ok: true, emailed }, { status: 201 });
}
