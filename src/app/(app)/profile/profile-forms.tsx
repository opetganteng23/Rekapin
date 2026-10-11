"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";

type Msg = { tone: "error" | "success"; text: string } | null;

async function patchMe(body: object) {
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, error: res.ok ? "" : (await res.json().catch(() => null))?.error ?? "Gagal menyimpan" };
}

export function ProfileForms({ name }: { name: string }) {
  const router = useRouter();
  const [nameMsg, setNameMsg] = useState<Msg>(null);
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [loading, setLoading] = useState<"name" | "pw" | null>(null);

  async function saveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading("name");
    const r = await patchMe({ name: String(new FormData(e.currentTarget).get("name")) });
    setLoading(null);
    setNameMsg(r.ok ? { tone: "success", text: "Nama diperbarui." } : { tone: "error", text: r.error });
    if (r.ok) router.refresh();
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (f.get("newPassword") !== f.get("confirm")) {
      return setPwMsg({ tone: "error", text: "Konfirmasi kata sandi tidak sama" });
    }
    setLoading("pw");
    const r = await patchMe({ currentPassword: f.get("currentPassword"), newPassword: f.get("newPassword") });
    setLoading(null);
    if (r.ok) form.reset();
    setPwMsg(r.ok ? { tone: "success", text: "Kata sandi diganti." } : { tone: "error", text: r.error });
  }

  return (
    <>
      <Card>
        <form onSubmit={saveName} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Data diri</h2>
          <Field label="Nama lengkap" name="name" defaultValue={name} required minLength={2} />
          {nameMsg && <Alert tone={nameMsg.tone}>{nameMsg.text}</Alert>}
          <Button type="submit" loading={loading === "name"} className="self-start">Simpan</Button>
        </form>
      </Card>
      <Card>
        <form onSubmit={savePassword} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Ganti kata sandi</h2>
          <Field label="Kata sandi lama" name="currentPassword" type="password" autoComplete="current-password" required />
          <Field label="Kata sandi baru" name="newPassword" type="password" autoComplete="new-password" required minLength={8} hint="Minimal 8 karakter" />
          <Field label="Ulangi kata sandi baru" name="confirm" type="password" autoComplete="new-password" required />
          {pwMsg && <Alert tone={pwMsg.tone}>{pwMsg.text}</Alert>}
          <Button type="submit" loading={loading === "pw"} className="self-start">Ganti kata sandi</Button>
        </form>
      </Card>
    </>
  );
}
