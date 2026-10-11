"use client";

import { useState } from "react";
import { Button } from "./ui";

/** Unduh file lewat fetch agar ada indikator "Menyiapkan…" dan pesan error (bukan klik yang tampak tidak bereaksi). */
export function ExportButton({
  href,
  label = "Export Excel (.xlsx)",
  variant = "primary",
  className,
}: {
  href: string;
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Gagal membuat file");
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "rekap-lembur.xlsx";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunduh");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant={variant} loading={loading} onClick={run} className={className}>
        {loading ? "Menyiapkan file…" : label}
      </Button>
      {error && <span role="alert" className="text-xs text-danger">{error}</span>}
    </span>
  );
}
