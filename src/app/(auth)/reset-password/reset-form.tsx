"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { useToast } from "@/components/toast";

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) {
      setError("Konfirmasi kata sandi tidak sama");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Kata sandi berhasil diatur");
      setDone(true);
    }
    else setError((await res.json().catch(() => null))?.error ?? "Gagal mengatur kata sandi");
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">Link tidak valid. Minta link reset yang baru.</Alert>
        <Link href="/forgot-password" className="text-center text-sm font-medium text-primary hover:underline">Minta link baru</Link>
      </div>
    );
  }
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">Kata sandi berhasil diatur. Silakan masuk dengan kata sandi baru.</Alert>
        <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-input bg-primary text-sm font-medium text-white hover:bg-primary-hover">Masuk</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Atur kata sandi baru</h2>
      <Field label="Kata sandi baru" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Minimal 8 karakter" />
      <Field label="Ulangi kata sandi" name="confirm" type="password" autoComplete="new-password" required />
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading}>Simpan kata sandi</Button>
    </form>
  );
}
