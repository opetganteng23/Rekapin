"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Button, Card } from "@/components/ui";
import { ICON_KEYS, type IconKey, type SiteContent } from "@/lib/site-shared";

// ---------- Kompres gambar → base64 (data URL) ----------

const MAX_BYTES = 700 * 1024;

async function toBase64Image(file: File): Promise<{ dataUrl: string; bytes: number }> {
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.76, 0.66, 0.55]) {
      // WebP jika didukung browser; jika tidak, otomatis JPEG.
      let blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
      if (!blob || blob.type !== "image/webp") blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
      if (blob && blob.size <= MAX_BYTES) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = reject;
          fr.readAsDataURL(blob!);
        });
        return { dataUrl, bytes: blob.size };
      }
    }
    scale *= 0.8;
  }
  throw new Error("Gambar terlalu besar untuk dikompres");
}

// ---------- Komponen form kecil ----------

const inputCls = "w-full rounded-input border border-border bg-surface px-3 text-sm focus:border-primary";

function Text({ label, value, onChange, hint, max, multiline }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; max?: number; multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium">
      {label}
      {multiline ? (
        <textarea value={value} maxLength={max} rows={3} onChange={(e) => onChange(e.target.value)} className={`${inputCls} py-2 font-normal`} />
      ) : (
        <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className={`${inputCls} h-10 font-normal`} />
      )}
      {hint && <span className="font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"}`}
      >
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
      {label}
    </label>
  );
}

function Section({ title, desc, children, open }: { title: string; desc?: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-card border border-border bg-surface shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div>
          <div className="font-semibold">{title}</div>
          {desc && <div className="text-xs text-muted">{desc}</div>}
        </div>
        <span className="text-muted transition-transform group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="flex flex-col gap-4 border-t border-border px-5 py-5 sm:px-6">{children}</div>
    </details>
  );
}

function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function RowTools({ i, len, onMove, onRemove }: { i: number; len: number; onMove: (d: -1 | 1) => void; onRemove: () => void }) {
  const b = "flex size-8 items-center justify-center rounded-input border border-border text-sm hover:bg-bg disabled:opacity-30";
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={b} disabled={i === 0} onClick={() => onMove(-1)} aria-label="Naik">↑</button>
      <button type="button" className={b} disabled={i === len - 1} onClick={() => onMove(1)} aria-label="Turun">↓</button>
      <button type="button" className={`${b} text-danger`} onClick={onRemove} aria-label="Hapus">✕</button>
    </div>
  );
}

/** Daftar teks sederhana (tambah, ubah, urutkan, hapus). */
function StringList({ label, items, onChange, max, placeholder }: {
  label: string; items: string[]; onChange: (v: string[]) => void; max: number; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium">{label}</div>
      {items.map((t, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={t}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((x, k) => (k === i ? e.target.value : x)))}
            className={`${inputCls} h-10`}
          />
          <RowTools i={i} len={items.length} onMove={(d) => onChange(move(items, i, d))} onRemove={() => onChange(items.filter((_, k) => k !== i))} />
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, ""])} className="self-start text-sm font-medium text-primary hover:underline">
          + Tambah
        </button>
      )}
    </div>
  );
}

const ICON_LABEL: Record<IconKey, string> = {
  clock: "Jam", paperclip: "Lampiran", check: "Centang", sheet: "Dokumen/Excel", calendar: "Kalender",
  gauge: "Meteran", shield: "Perisai", users: "Pengguna", bolt: "Petir", star: "Bintang",
};

// ---------- Editor ----------

export function SiteEditor({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(fn: (draft: SiteContent) => SiteContent) {
    setC((prev) => fn(structuredClone(prev)));
    setDirty(true);
    setMsg(null);
  }

  async function addSlides(files: FileList) {
    setMsg(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      if (c.slides.length >= 8) {
        setMsg({ tone: "error", text: "Maksimal 8 slide." });
        break;
      }
      try {
        const { dataUrl } = await toBase64Image(file);
        const res = await fetch("/api/site/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Gagal mengunggah");
        update((d) => ({ ...d, slides: [...d.slides, { id: data.id, alt: file.name.replace(/\.\w+$/, "") }] }));
      } catch (e) {
        setMsg({ tone: "error", text: `${file.name}: ${e instanceof Error ? e.message : "gagal diproses"}` });
      }
    }
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return setMsg({ tone: "error", text: data?.error ?? "Gagal menyimpan" });
    setDirty(false);
    setMsg({ tone: "success", text: "Tersimpan. Landing page sudah diperbarui." });
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <Card className="flex flex-wrap items-center justify-between gap-3 !p-4">
        <p className="text-sm text-muted">Semua teks, gambar slide, running text, dan footer pada landing page diatur dari sini.</p>
        <a href="/" target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">Lihat landing page ↗</a>
      </Card>

      <Section title="Umum & Hero" desc="Nama brand, judul besar, dan tombol di bagian atas" open>
        <Text label="Nama brand" value={c.brand.name} max={40} onChange={(v) => update((d) => ({ ...d, brand: { name: v } }))} />
        <Text label="Badge kecil di atas judul" value={c.hero.badge} max={80} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, badge: v } }))} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Text label="Judul — awal" value={c.hero.titleBefore} max={120} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, titleBefore: v } }))} />
          <Text label="Judul — kata berwarna" value={c.hero.titleHighlight} max={60} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, titleHighlight: v } }))} />
          <Text label="Judul — akhir" value={c.hero.titleAfter} max={120} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, titleAfter: v } }))} />
        </div>
        <Text label="Sub-judul" multiline value={c.hero.subtitle} max={400} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, subtitle: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Tombol utama" value={c.hero.primaryCta} max={30} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, primaryCta: v } }))} />
          <Text label="Tombol sekunder" value={c.hero.secondaryCta} max={30} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, secondaryCta: v } }))} />
        </div>
        <StringList label="Poin singkat di bawah tombol" items={c.hero.bullets} max={6} onChange={(v) => update((d) => ({ ...d, hero: { ...d.hero, bullets: v } }))} />
      </Section>

      <Section title="Slide gambar hero" desc={`${c.slides.length}/8 gambar. Tanpa gambar, hero menampilkan mockup aplikasi.`} open>
        <p className="text-xs text-muted">
          Gambar dikompres otomatis di browser (maks 1600px, ≤700 KB), dikonversi ke base64, dan disimpan di database. Rasio tampil 4:3.
        </p>
        {c.slides.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {c.slides.map((s, i) => (
              <li key={s.id} className="flex gap-3 rounded-input border border-border p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/site/image/${s.id}`} alt="" className="h-20 w-28 shrink-0 rounded-input border border-border object-cover" />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <input
                    value={s.alt}
                    maxLength={120}
                    placeholder="Deskripsi gambar (alt)"
                    aria-label={`Deskripsi slide ${i + 1}`}
                    onChange={(e) => update((d) => ({ ...d, slides: d.slides.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)) }))}
                    className={`${inputCls} h-9`}
                  />
                  <RowTools i={i} len={c.slides.length} onMove={(dir) => update((d) => ({ ...d, slides: move(d.slides, i, dir) }))} onRemove={() => update((d) => ({ ...d, slides: d.slides.filter((_, k) => k !== i) }))} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { if (e.target.files) addSlides(e.target.files); e.target.value = ""; }} />
          <Button type="button" variant="secondary" loading={uploading} disabled={c.slides.length >= 8} onClick={() => fileRef.current?.click()}>
            + Unggah gambar
          </Button>
        </div>
      </Section>

      <Section title="Running text (pembatas section)" desc="Teks berjalan di antara section, bisa disertai logo">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Toggle label="Tampilkan" checked={c.marquee.enabled} onChange={(v) => update((d) => ({ ...d, marquee: { ...d.marquee, enabled: v } }))} />
          <Toggle label="Sertakan logo" checked={c.marquee.showLogo} onChange={(v) => update((d) => ({ ...d, marquee: { ...d.marquee, showLogo: v } }))} />
        </div>
        <StringList label="Teks yang berjalan" items={c.marquee.items} max={12} onChange={(v) => update((d) => ({ ...d, marquee: { ...d.marquee, items: v } }))} />
      </Section>

      <Section title="Sebelum vs Sesudah" desc="Perbandingan masalah dan solusi">
        <Toggle label="Tampilkan section" checked={c.problem.enabled} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, enabled: v } }))} />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Text label="Label (sebelum)" value={c.problem.beforeLabel} max={40} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, beforeLabel: v } }))} />
            <Text label="Judul (sebelum)" value={c.problem.beforeTitle} max={160} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, beforeTitle: v } }))} />
            <StringList label="Poin" items={c.problem.beforeItems} max={8} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, beforeItems: v } }))} />
          </div>
          <div className="flex flex-col gap-4">
            <Text label="Label (sesudah)" value={c.problem.afterLabel} max={40} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, afterLabel: v } }))} />
            <Text label="Judul (sesudah)" value={c.problem.afterTitle} max={160} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, afterTitle: v } }))} />
            <StringList label="Poin" items={c.problem.afterItems} max={8} onChange={(v) => update((d) => ({ ...d, problem: { ...d.problem, afterItems: v } }))} />
          </div>
        </div>
      </Section>

      <Section title="Fitur" desc={`${c.features.items.length} kartu fitur`}>
        <Toggle label="Tampilkan section" checked={c.features.enabled} onChange={(v) => update((d) => ({ ...d, features: { ...d.features, enabled: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Label kecil" value={c.features.eyebrow} max={40} onChange={(v) => update((d) => ({ ...d, features: { ...d.features, eyebrow: v } }))} />
          <Text label="Judul" value={c.features.title} max={160} onChange={(v) => update((d) => ({ ...d, features: { ...d.features, title: v } }))} />
        </div>
        <Text label="Sub-judul" multiline value={c.features.subtitle} max={300} onChange={(v) => update((d) => ({ ...d, features: { ...d.features, subtitle: v } }))} />
        {c.features.items.map((f, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-input border border-border p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1"><Text label={`Fitur ${i + 1} — judul`} value={f.title} max={60} onChange={(v) => update((d) => { d.features.items[i].title = v; return d; })} /></div>
              <label className="flex flex-col gap-1.5 text-xs font-medium">
                Ikon
                <select value={f.icon} onChange={(e) => update((d) => { d.features.items[i].icon = e.target.value as IconKey; return d; })} className={`${inputCls} h-10 w-auto`}>
                  {ICON_KEYS.map((k) => <option key={k} value={k}>{ICON_LABEL[k]}</option>)}
                </select>
              </label>
              <RowTools i={i} len={c.features.items.length} onMove={(dir) => update((d) => ({ ...d, features: { ...d.features, items: move(d.features.items, i, dir) } }))} onRemove={() => update((d) => ({ ...d, features: { ...d.features, items: d.features.items.filter((_, k) => k !== i) } }))} />
            </div>
            <Text label="Deskripsi" multiline value={f.text} max={300} onChange={(v) => update((d) => { d.features.items[i].text = v; return d; })} />
          </div>
        ))}
        {c.features.items.length < 12 && (
          <button type="button" onClick={() => update((d) => ({ ...d, features: { ...d.features, items: [...d.features.items, { title: "Fitur baru", text: "", icon: "star" }] } }))} className="self-start text-sm font-medium text-primary hover:underline">+ Tambah fitur</button>
        )}
      </Section>

      <Section title="Cara kerja" desc={`${c.steps.items.length} langkah`}>
        <Toggle label="Tampilkan section" checked={c.steps.enabled} onChange={(v) => update((d) => ({ ...d, steps: { ...d.steps, enabled: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Label kecil" value={c.steps.eyebrow} max={40} onChange={(v) => update((d) => ({ ...d, steps: { ...d.steps, eyebrow: v } }))} />
          <Text label="Judul" value={c.steps.title} max={160} onChange={(v) => update((d) => ({ ...d, steps: { ...d.steps, title: v } }))} />
        </div>
        {c.steps.items.map((s, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-input border border-border p-3">
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1"><Text label={`Langkah ${i + 1} — judul`} value={s.title} max={60} onChange={(v) => update((d) => { d.steps.items[i].title = v; return d; })} /></div>
              <RowTools i={i} len={c.steps.items.length} onMove={(dir) => update((d) => ({ ...d, steps: { ...d.steps, items: move(d.steps.items, i, dir) } }))} onRemove={() => update((d) => ({ ...d, steps: { ...d.steps, items: d.steps.items.filter((_, k) => k !== i) } }))} />
            </div>
            <Text label="Deskripsi" multiline value={s.text} max={240} onChange={(v) => update((d) => { d.steps.items[i].text = v; return d; })} />
          </div>
        ))}
        {c.steps.items.length < 6 && (
          <button type="button" onClick={() => update((d) => ({ ...d, steps: { ...d.steps, items: [...d.steps.items, { title: "Langkah baru", text: "" }] } }))} className="self-start text-sm font-medium text-primary hover:underline">+ Tambah langkah</button>
        )}
      </Section>

      <Section title="Peran pengguna" desc={`${c.roles.items.length} kartu peran`}>
        <Toggle label="Tampilkan section" checked={c.roles.enabled} onChange={(v) => update((d) => ({ ...d, roles: { ...d.roles, enabled: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Label kecil" value={c.roles.eyebrow} max={40} onChange={(v) => update((d) => ({ ...d, roles: { ...d.roles, eyebrow: v } }))} />
          <Text label="Judul" value={c.roles.title} max={160} onChange={(v) => update((d) => ({ ...d, roles: { ...d.roles, title: v } }))} />
        </div>
        {c.roles.items.map((r, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-input border border-border p-3">
            <div className="flex items-end gap-3">
              <div className="min-w-0 flex-1"><Text label={`Peran ${i + 1} — nama`} value={r.name} max={40} onChange={(v) => update((d) => { d.roles.items[i].name = v; return d; })} /></div>
              <RowTools i={i} len={c.roles.items.length} onMove={(dir) => update((d) => ({ ...d, roles: { ...d.roles, items: move(d.roles.items, i, dir) } }))} onRemove={() => update((d) => ({ ...d, roles: { ...d.roles, items: d.roles.items.filter((_, k) => k !== i) } }))} />
            </div>
            <StringList label="Poin" items={r.items} max={8} onChange={(v) => update((d) => { d.roles.items[i].items = v; return d; })} />
          </div>
        ))}
        {c.roles.items.length < 6 && (
          <button type="button" onClick={() => update((d) => ({ ...d, roles: { ...d.roles, items: [...d.roles.items, { name: "Peran baru", items: [] }] } }))} className="self-start text-sm font-medium text-primary hover:underline">+ Tambah peran</button>
        )}
      </Section>

      <Section title="Ajakan akhir (CTA)" desc="Kotak gelap di bagian bawah">
        <Toggle label="Tampilkan section" checked={c.cta.enabled} onChange={(v) => update((d) => ({ ...d, cta: { ...d.cta, enabled: v } }))} />
        <Text label="Judul" value={c.cta.title} max={160} onChange={(v) => update((d) => ({ ...d, cta: { ...d.cta, title: v } }))} />
        <Text label="Teks" multiline value={c.cta.text} max={300} onChange={(v) => update((d) => ({ ...d, cta: { ...d.cta, text: v } }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Text label="Tombol utama" value={c.cta.primary} max={30} onChange={(v) => update((d) => ({ ...d, cta: { ...d.cta, primary: v } }))} />
          <Text label="Tombol sekunder" value={c.cta.secondary} max={30} onChange={(v) => update((d) => ({ ...d, cta: { ...d.cta, secondary: v } }))} />
        </div>
      </Section>

      <Section title="Footer" desc="Deskripsi, kontak, tautan, dan hak cipta">
        <Text label="Deskripsi singkat" multiline value={c.footer.about} max={300} onChange={(v) => update((d) => ({ ...d, footer: { ...d.footer, about: v } }))} />
        <Text label="Email kontak" value={c.footer.email} max={120} hint="Kosongkan untuk menyembunyikan." onChange={(v) => update((d) => ({ ...d, footer: { ...d.footer, email: v } }))} />
        <Text label="Hak cipta" value={c.footer.copyright} max={160} hint="Tampil setelah simbol ©." onChange={(v) => update((d) => ({ ...d, footer: { ...d.footer, copyright: v } }))} />
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium">Tautan tambahan</div>
          {c.footer.links.map((l, i) => (
            <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
              <input value={l.label} placeholder="Label" aria-label="Label tautan" maxLength={40} onChange={(e) => update((d) => { d.footer.links[i].label = e.target.value; return d; })} className={`${inputCls} h-10 sm:w-1/3`} />
              <input value={l.href} placeholder="https://… atau /halaman" aria-label="URL tautan" maxLength={200} onChange={(e) => update((d) => { d.footer.links[i].href = e.target.value; return d; })} className={`${inputCls} h-10 flex-1`} />
              <RowTools i={i} len={c.footer.links.length} onMove={(dir) => update((d) => ({ ...d, footer: { ...d.footer, links: move(d.footer.links, i, dir) } }))} onRemove={() => update((d) => ({ ...d, footer: { ...d.footer, links: d.footer.links.filter((_, k) => k !== i) } }))} />
            </div>
          ))}
          {c.footer.links.length < 8 && (
            <button type="button" onClick={() => update((d) => ({ ...d, footer: { ...d.footer, links: [...d.footer.links, { label: "", href: "" }] } }))} className="self-start text-sm font-medium text-primary hover:underline">+ Tambah tautan</button>
          )}
        </div>
      </Section>

      {/* Bilah simpan */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <div className="min-w-0 flex-1 text-sm">
            {msg ? <Alert tone={msg.tone}>{msg.text}</Alert> : <span className="text-muted">{dirty ? "Ada perubahan yang belum disimpan" : "Semua perubahan tersimpan"}</span>}
          </div>
          <Button onClick={save} loading={saving} disabled={!dirty || uploading}>Simpan perubahan</Button>
        </div>
      </div>
    </div>
  );
}
