import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/db";

declare module "next-auth" {
  interface User {
    role?: Role;
  }
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
    /** id unik login ini; dipakai untuk penanda penutupan tab. */
    sid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    sid?: string;
  }
}
