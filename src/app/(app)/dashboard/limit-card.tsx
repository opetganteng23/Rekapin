"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";

export function LimitCard({ hours, limit }: { hours: number; limit: number | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pct = limit ? Math.min(100, (hours / limit) * 100) : 0;
  const over = !!limit && hours >= limit;
  const near = !!limit && !over && hours >= limit * 0.8;
  const bar = over ? "bg-danger" : near ? "bg-warning" : "bg-primary";

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const raw = String(new FormData(e.currentTarget).get("limit")).trim();
    const value = raw === "" ? null : Number(raw.replace(",", "."));
    if (value !== null && Number.isNaN(value)) return setError("Masukkan angka yang valid");
    setLoading(true);
    const res = await fetch("/api/users/me/limit", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: value }),
    });
    setLoading(false);
    if (!res.ok) return setError((await res.json().catch(() => null))?.error ?? "Gagal menyimpan");
    setEditing(false);
    router.refresh();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold">Jam Lembur Bulan Ini</h2>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-sm font-medium text-primary hover:underline">
            {limit ? "Atur limit" : "Set limit"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="mt-3 flex flex-col gap-3">
          <Field
            label="Limit jam per bulan"
            name="limit"
            inputMode="decimal"
            defaultValue={limit ?? ""}
            placeholder="mis. 30 (kosongkan untuk menghapus)"
            hint="Hanya sebagai pengingat, tidak memblokir pengajuan."
          />
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex gap-2">
            <Button type="submit" loading={loading} className="flex-1">Simpan</Button>
            <Button type="button" variant="secondary" onClick={() => { setEditing(false); setError(""); }}>Batal</Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-semibold">{hours.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</span>
            <span className="text-sm text-muted">{limit ? `/ ${limit} jam` : "jam"}</span>
          </div>
          {limit ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
              </div>
              {(over || near) && (
                <div className="mt-3">
                  <Alert tone={over ? "error" : "warning"}>
                    {over ? "Sudah melewati limit bulanan yang kamu atur" : "Mendekati limit bulanan yang kamu atur"}
                  </Alert>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">Atur limit bulanan untuk mendapat pengingat saat jam lemburmu mendekati batas.</p>
          )}
          <p className="mt-3 text-xs text-muted">Termasuk pengajuan yang masih menunggu persetujuan.</p>
        </>
      )}
    </Card>
  );
}
