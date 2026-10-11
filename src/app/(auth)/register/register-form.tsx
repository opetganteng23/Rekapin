"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Alert, Button, Field } from "@/components/ui";
import { useToast } from "@/components/toast";

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) {
      setError("Konfirmasi kata sandi tidak sama");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: String(f.get("name")).trim(), email, password }),
    });
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Gagal mendaftar");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    toast.success("Akun berhasil dibuat", "Selamat datang di Rekapin.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Daftar sebagai karyawan</h2>
      <Field label="Nama lengkap" name="name" autoComplete="name" required minLength={2} />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Kata sandi" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Minimal 8 karakter" />
      <Field label="Ulangi kata sandi" name="confirm" type="password" autoComplete="new-password" required />
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading}>Daftar</Button>
      <p className="text-center text-sm text-muted">
        Sudah punya akun? <Link href="/login" className="font-medium text-primary hover:underline">Masuk</Link>
      </p>
    </form>
  );
}
