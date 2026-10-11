import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { Role } from "@/lib/db";

/** Guard untuk route handler. Pakai: `const a = await apiUser([...]); if ("error" in a) return a.error;` */
export async function apiUser(roles?: Role[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Belum login" }, { status: 401 }) } as const;
  }
  if (roles && !roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Tidak punya akses" }, { status: 403 }) } as const;
  }
  return { user: session.user } as const;
}

export const badRequest = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });
