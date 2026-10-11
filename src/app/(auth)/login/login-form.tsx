"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Alert, Button, Field } from "@/components/ui";
import { useToast } from "@/components/toast";

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
      redirect: false,
    });
    if (res?.error || !res?.ok) {
      setError("Email atau kata sandi salah");
      setLoading(false);
      return;
    }
    toast.success("Berhasil masuk", "Selamat datang kembali.");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="nama@perusahaan.com" />
      <Field label="Kata sandi" name="password" type="password" autoComplete="current-password" required />
      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className="text-xs text-primary hover:underline">Lupa kata sandi?</Link>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading}>Masuk</Button>
      <p className="text-center text-sm text-muted">
        Belum punya akun? <Link href="/register" className="font-medium text-primary hover:underline">Daftar sebagai karyawan</Link>
      </p>
    </form>
  );
}
