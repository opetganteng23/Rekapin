import type { Metadata } from "next";
import { users } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { UsersManager, type UserRow } from "./users-manager";

export const metadata: Metadata = { title: "Pengguna — Rekapin" };

const joinedFmt = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function UsersPage() {
  const me = await requireUser(["admin"]);
  const list = await (await users())
    .find({}, { projection: { name: 1, email: 1, role: 1, isActive: 1, createdAt: 1 } })
    .sort({ createdAt: 1 })
    .toArray();

  const rows: UserRow[] = list.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    joined: joinedFmt.format(u.createdAt),
  }));

  return <UsersManager rows={rows} meId={me.id} />;
}
