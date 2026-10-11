"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Button, Field } from "@/components/ui";
import { useToast } from "@/components/toast";

export function ForgotForm() {
  const toast = useToast();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(new FormData(e.currentTarget).get("email")).trim() }),
    });
    setLoading(false);
    if (res.ok) {
      toast.info("Permintaan diterima", "Cek email Anda untuk link reset.");
      setSent(true);
    }
    else setError("Email tidak valid");
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">
          Jika email terdaftar, link reset kata sandi sudah dikirim. Cek kotak masuk (dan folder spam). Link berlaku 1 jam.
        </Alert>
        <Link href="/login" className="text-center text-sm font-medium text-primary hover:underline">Kembali ke halaman masuk</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Lupa kata sandi</h2>
        <p className="text-sm text-muted">Masukkan email akunmu, nanti kami kirim link untuk mengatur ulang.</p>
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading}>Kirim link reset</Button>
      <Link href="/login" className="text-center text-sm text-muted hover:text-text">Kembali ke halaman masuk</Link>
    </form>
  );
}
