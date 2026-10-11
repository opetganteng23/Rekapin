import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { users, type Role } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
      if (user) token.id = user.id;
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
      return session;
    },
  },
});
