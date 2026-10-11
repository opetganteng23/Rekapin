"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Field } from "@/components/ui";
import { useToast } from "@/components/toast";

interface Evidence {
  name: string;
  url: string;
}

const STORAGE_KEY = "rekapin:last-times";
const MAX_FILES = 5;

function minutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fmt(totalMin: number) {
  return `${Math.floor(totalMin / 60)}j ${String(totalMin % 60).padStart(2, "0")}m`;
}

/** Perkecil foto (maks 1600px, JPEG 0,8) agar muat batas upload & hemat kuota. PDF dibiarkan. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function OvertimeForm({ today }: { today: string }) {
  const router = useRouter();
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState("17:00");
  const [finish, setFinish] = useState("20:00");
  const [files, setFiles] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pulihkan jam terakhir yang dipakai. Harus di effect (localStorage tidak ada saat SSR);
  // abaikan jika storage tidak tersedia.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (saved?.start && saved?.finish) {
        /* eslint-disable react-hooks/set-state-in-effect */
        setStart(saved.start);
        setFinish(saved.finish);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {}
  }, []);

  const diff = start && finish ? minutes(finish) - minutes(start) : 0;
  const durationOk = diff > 0;

  async function upload(list: FileList | File[]) {
    setError("");
    const incoming = Array.from(list);
    if (files.length + incoming.length > MAX_FILES) {
      setError(`Maksimal ${MAX_FILES} file bukti`);
      return;
    }
    setUploading(true);
    for (const original of incoming) {
      const file = await compress(original);
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(`${original.name}: ${data?.error ?? "gagal diunggah"}`);
        continue;
      }
      setFiles((prev) => [...prev, { name: original.name, url: data.url }]);
    }
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!durationOk) return setError("Jam selesai harus setelah jam mulai");
    if (files.length === 0) return setError("Lampirkan minimal 1 bukti");
    setLoading(true);
    const res = await fetch("/api/overtime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, start, finish, evidenceUrls: files.map((f) => f.url) }),
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) return setError(data?.error ?? "Gagal mengirim pengajuan");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ start, finish }));
    } catch {}
    setFiles([]);
    toast.success("Pengajuan lembur terkirim", "Menunggu persetujuan atasan.");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Ajukan Lembur</h2>
          <p className="text-sm text-muted">Catat waktu kerja dan lampirkan bukti</p>
        </div>

        <Field label="Tanggal" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mulai" type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
          <Field label="Selesai" type="time" value={finish} onChange={(e) => setFinish(e.target.value)} required />
        </div>

        <div className="flex items-center justify-between rounded-input bg-bg px-4 py-3">
          <span className="text-sm text-muted">Total durasi</span>
          <span className={`text-lg font-semibold ${durationOk ? "text-text" : "text-danger"}`}>
            {durationOk ? fmt(diff) : "-"}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium">Bukti (foto / dokumen)</span>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
            className={`flex flex-col items-center gap-1 rounded-input border-2 border-dashed px-4 py-6 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <p className="text-sm text-muted">
              Tarik file ke sini atau{" "}
              <button type="button" onClick={() => fileInput.current?.click()} className="font-medium text-primary hover:underline">
                pilih file
              </button>
            </p>
            <p className="text-xs text-muted">JPG, PNG, atau PDF, maks 4MB (foto dikompres otomatis)</p>
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              multiple
              hidden
              onChange={(e) => { if (e.target.files) upload(e.target.files); e.target.value = ""; }}
            />
          </div>
          {uploading && <p className="text-xs text-muted" role="status">Mengunggah…</p>}
          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {files.map((f) => (
                <li key={f.url} className="flex items-center justify-between gap-2 rounded-input border border-border px-3 py-2 text-sm">
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((x) => x.url !== f.url))}
                    className="shrink-0 text-xs text-muted hover:text-danger"
                    aria-label={`Hapus ${f.name}`}
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={loading} disabled={uploading || !durationOk}>
          Kirim Pengajuan
        </Button>
      </form>
    </Card>
  );
}
