import type { Metadata } from "next";
import { users } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui";
import { UsersManager, type UserRow } from "./users-manager";

export const metadata: Metadata = { title: "Pengguna — Rekapin" };

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
    joined: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(u.createdAt),
  }));

  return (
    <Card>
      <UsersManager rows={rows} meId={me.id} />
    </Card>
  );
}
