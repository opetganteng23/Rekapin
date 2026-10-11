"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { Alert, Button } from "@/components/ui";
import { useToast } from "@/components/toast";

export interface PendingRow {
  id: string;
  name: string;
  initials: string;
  date: string;
  time: string;
  duration: string;
  evidence: string[];
}

const isPdf = (u: string) => u.split("?")[0].toLowerCase().endsWith(".pdf");

export function ApprovalsTable({ rows }: { rows: PendingRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<PendingRow | null>(null);
  const [rejecting, setRejecting] = useState<PendingRow | null>(null);
  const [note, setNote] = useState("");

  async function act(id: string, action: "approve" | "reject", body?: object) {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/overtime/${id}/${action}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(null);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Gagal memproses pengajuan");
      return false;
    }
    toast.success(action === "approve" ? "Pengajuan disetujui" : "Pengajuan ditolak", action === "approve" ? "Status karyawan diperbarui." : "Alasan penolakan sudah dikirim ke karyawan.");
    router.refresh();
    return true;
  }

  async function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejecting) return;
    if (await act(rejecting.id, "reject", { note })) {
      setRejecting(null);
      setNote("");
    }
  }

  if (rows.length === 0) {
    return <p className="py-12 text-center text-sm text-muted">Tidak ada pengajuan yang menunggu. 🎉</p>;
  }

  return (
    <>
      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">Karyawan</th>
              <th className="py-2 pr-4 font-medium">Tanggal</th>
              <th className="py-2 pr-4 font-medium">Waktu</th>
              <th className="py-2 pr-4 font-medium">Durasi</th>
              <th className="py-2 pr-4 font-medium">Bukti</th>
              <th className="py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{r.initials}</span>
                    {r.name}
                  </div>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">{r.date}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{r.time}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{r.duration}</td>
                <td className="py-3 pr-4">
                  <button onClick={() => setViewing(r)} className="text-primary hover:underline">lihat bukti</button>
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" className="h-9 px-3 text-danger" disabled={busy === r.id} onClick={() => setRejecting(r)}>Tolak</Button>
                    <Button className="h-9 px-3" loading={busy === r.id} onClick={() => act(r.id, "approve")}>Setujui</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-4 flex flex-col gap-3 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="rounded-input border border-border p-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{r.initials}</span>
              <div>
                <div className="font-medium leading-tight">{r.name}</div>
                <div className="text-xs text-muted">{r.date} · {r.time} · {r.duration}</div>
              </div>
            </div>
            <button onClick={() => setViewing(r)} className="mt-2 text-sm text-primary hover:underline">lihat bukti</button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" className="text-danger" disabled={busy === r.id} onClick={() => setRejecting(r)}>Tolak</Button>
              <Button loading={busy === r.id} onClick={() => act(r.id, "approve")}>Setujui</Button>
            </div>
          </li>
        ))}
      </ul>

      {viewing && (
        <Modal title={`Bukti: ${viewing.name}`} onClose={() => setViewing(null)} wide>
          <p className="mb-3 text-sm text-muted">{viewing.date} · {viewing.time} · {viewing.duration}</p>
          <div className="flex flex-col gap-3">
            {viewing.evidence.map((u, i) =>
              isPdf(u) ? (
                <a key={u} href={u} target="_blank" rel="noreferrer" className="rounded-input border border-border px-3 py-3 text-sm text-primary hover:bg-bg">
                  📄 Buka dokumen PDF {i + 1}
                </a>
              ) : (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={`Bukti ${i + 1}`} className="max-h-[60vh] w-full rounded-input border border-border object-contain" />
                </a>
              ),
            )}
          </div>
        </Modal>
      )}

      {rejecting && (
        <Modal title="Tolak pengajuan" onClose={() => { setRejecting(null); setNote(""); }}>
          <form onSubmit={submitReject} className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              {rejecting.name} · {rejecting.date} · {rejecting.duration}
            </p>
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              Alasan penolakan (wajib)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                minLength={3}
                maxLength={500}
                rows={4}
                placeholder="mis. Evidence tidak jelas"
                className="rounded-input border border-border bg-surface p-3 text-sm font-normal focus:border-primary"
              />
            </label>
            {error && <Alert tone="error">{error}</Alert>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => { setRejecting(null); setNote(""); }}>Batal</Button>
              <Button type="submit" variant="danger" loading={busy === rejecting.id}>Tolak pengajuan</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
