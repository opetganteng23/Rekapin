import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/lib/db";

/** Untuk server component/page: wajib login (dan opsional role tertentu). */
export async function requireUser(roles?: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (roles && !roles.includes(session.user.role)) redirect("/dashboard");
  return session.user;
}
