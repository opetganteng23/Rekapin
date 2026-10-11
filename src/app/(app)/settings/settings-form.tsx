"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, Button, cx } from "@/components/ui";

interface Initial {
  recapFrequency: "monthly" | "weekly";
  recapDayOfMonth: number;
  recapDayOfWeek: number;
  recapHour: number;
}

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const selectCls = "h-11 w-full rounded-input border border-border bg-surface px-3 text-sm";

export function SettingsForm({ initial, nextText, lastText }: { initial: Initial; nextText: string; lastText: string }) {
  const router = useRouter();
  const [s, setS] = useState(initial);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    setSaving(false);
    if (!res.ok) return setMsg({ tone: "error", text: (await res.json().catch(() => null))?.error ?? "Gagal menyimpan" });
    setMsg({ tone: "success", text: "Pengaturan disimpan." });
    router.refresh();
  }

  async function runNow() {
    setRunning(true);
    setMsg(null);
    const res = await fetch("/api/settings/run", { method: "POST" });
    const data = await res.json().catch(() => null);
    setRunning(false);
    if (!res.ok) return setMsg({ tone: "error", text: data?.error ?? "Gagal menjalankan rekap" });
    setMsg({
      tone: "success",
      text:
        data.status === "exists"
          ? "Rekap untuk periode ini sudah pernah dibuat."
          : `Rekap dibuat (${data.rowCount} pengajuan), dikirim ke ${data.emailed} penerima.`,
    });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-5 flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-xs font-medium">Frekuensi</legend>
        <div className="grid grid-cols-2 gap-1 rounded-input bg-bg p-1" role="radiogroup">
          {(["monthly", "weekly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={s.recapFrequency === f}
              onClick={() => setS({ ...s, recapFrequency: f })}
              className={cx(
                "h-10 rounded-input text-sm font-medium transition-colors",
                s.recapFrequency === f ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
              )}
            >
              {f === "monthly" ? "Bulanan" : "Mingguan"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {s.recapFrequency === "monthly" ? (
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Tanggal jalan
            <select className={selectCls} value={s.recapDayOfMonth} onChange={(e) => setS({ ...s, recapDayOfMonth: Number(e.target.value) })}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>Tanggal {d}</option>)}
            </select>
          </label>
        ) : (
          <label className="flex flex-col gap-1.5 text-xs font-medium">
            Hari jalan
            <select className={selectCls} value={s.recapDayOfWeek} onChange={(e) => setS({ ...s, recapDayOfWeek: Number(e.target.value) })}>
              {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-xs font-medium">
          Jam (WIB)
          <select className={selectCls} value={s.recapHour} onChange={(e) => setS({ ...s, recapHour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
          </select>
        </label>
      </div>

      <div>
        <div className="mb-2 text-xs font-medium">Distribusi hasil</div>
        <ul className="flex flex-col gap-1.5 text-sm text-muted">
          <li>✓ Tersedia untuk diunduh dari dashboard</li>
          <li>✓ Dikirim otomatis via email ke admin &amp; approver</li>
        </ul>
      </div>

      <div className="rounded-input bg-bg px-4 py-3 text-sm">
        <div className="text-xs text-muted">Rekap berikutnya</div>
        <div className="font-medium">{nextText}</div>
        <div className="mt-1 text-xs text-muted">{lastText}</div>
      </div>

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="secondary" loading={running} onClick={runNow}>Jalankan rekap periode terakhir</Button>
        <Button type="submit" loading={saving}>Simpan Pengaturan</Button>
      </div>
    </form>
  );
}
