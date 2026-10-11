import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { users, type UserDoc } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const col = await users();
  if (await col.findOne({ email })) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
  }
  // FR-2b: registrasi mandiri selalu employee.
  const doc: Omit<UserDoc, "_id"> = {
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: "employee",
    isActive: true,
    createdAt: new Date(),
  };
  await col.insertOne(doc as UserDoc);
  return NextResponse.json({ ok: true }, { status: 201 });
}
