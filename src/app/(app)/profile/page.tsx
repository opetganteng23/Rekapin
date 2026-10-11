import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "Profil — Rekapin" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </div>
      <ProfileForms name={user.name ?? ""} />
    </div>
  );
}
