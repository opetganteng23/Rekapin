import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { CLOSE_GRACE_MS, CLOSING_COOKIE, parseClosingValue } from "@/lib/closing";
import { users, type Role } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** True bila tab/browser terakhir sesi ini sudah ditutup lebih lama dari masa tenggang. */
async function sessionWasClosed(sid: unknown) {
  if (typeof sid !== "string") return false;
  try {
    const marker = parseClosingValue((await cookies()).get(CLOSING_COOKIE)?.value);
    return !!marker && marker.sid === sid && Date.now() - marker.ts > CLOSE_GRACE_MS;
  } catch {
    return false; // di luar konteks request (mis. pembangunan statis)
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await (await users()).findOne({ email: parsed.data.email.toLowerCase() });
        if (!user || !user.isActive) return null;
        if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sid = randomUUID(); // id unik per login, dipakai untuk penanda penutupan tab
      }
      if (await sessionWasClosed(token.sid)) return null;
      // Sinkronkan role/status dari DB agar perubahan admin langsung berlaku.
      if (token.id) {
        const u = await (await users()).findOne(
          { _id: new ObjectId(token.id as string) },
          { projection: { role: 1, isActive: 1, name: 1 } },
        );
        if (!u || !u.isActive) return null;
        token.role = u.role;
        token.name = u.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.sid = token.sid as string;
      return session;
    },
  },
});
