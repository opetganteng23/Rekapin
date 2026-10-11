// Aman diimpor dari client component: tanpa dependensi server.
import { z } from "zod";

export const ICON_KEYS = ["clock", "paperclip", "check", "sheet", "calendar", "gauge", "shield", "users", "bolt", "star"] as const;
export type IconKey = (typeof ICON_KEYS)[number];

const str = (max: number) => z.string().trim().max(max);
const list = <T extends z.ZodType>(item: T, max: number) => z.array(item).max(max);

export const siteSchema = z.object({
  brand: z.object({ name: str(40).min(1) }),
  hero: z.object({
    badge: str(80),
    titleBefore: str(120),
    titleHighlight: str(60),
    titleAfter: str(120),
    subtitle: str(400),
    primaryCta: str(30).min(1),
    secondaryCta: str(30).min(1),
    bullets: list(str(60), 6),
  }),
  slides: list(z.object({ id: z.string().regex(/^[a-f0-9]{24}$/), alt: str(120) }), 8),
  marquee: z.object({ enabled: z.boolean(), showLogo: z.boolean(), items: list(str(60).min(1), 12) }),
  problem: z.object({
    enabled: z.boolean(),
    beforeLabel: str(40), beforeTitle: str(160), beforeItems: list(str(120), 8),
    afterLabel: str(40), afterTitle: str(160), afterItems: list(str(120), 8),
  }),
  features: z.object({
    enabled: z.boolean(),
    eyebrow: str(40), title: str(160), subtitle: str(300),
    items: list(z.object({ title: str(60).min(1), text: str(300), icon: z.enum(ICON_KEYS) }), 12),
  }),
  steps: z.object({
    enabled: z.boolean(),
    eyebrow: str(40), title: str(160),
    items: list(z.object({ title: str(60).min(1), text: str(240) }), 6),
  }),
  roles: z.object({
    enabled: z.boolean(),
    eyebrow: str(40), title: str(160),
    items: list(z.object({ name: str(40).min(1), items: list(str(100), 8) }), 6),
  }),
  cta: z.object({
    enabled: z.boolean(),
    title: str(160), text: str(300), primary: str(30).min(1), secondary: str(30).min(1),
  }),
  footer: z.object({
    about: str(300),
    email: z.union([z.literal(""), z.string().trim().email()]),
    links: list(z.object({ label: str(40).min(1), href: str(200).min(1) }), 8),
    copyright: str(160),
  }),
});

export type SiteContent = z.infer<typeof siteSchema>;

export const DEFAULT_SITE: SiteContent = {
  brand: { name: "Rekapin" },
  hero: {
    badge: "Pencatatan & persetujuan lembur",
    titleBefore: "Rekap lembur jadi rapi,",
    titleHighlight: "tanpa drama",
    titleAfter: "menjelang deadline.",
    subtitle:
      "Catat jam lembur dan unggah bukti dalam satu alur. Atasan menyetujui dengan sekali klik, dan rekap Excel tersusun otomatis.",
    primaryCta: "Mulai Sekarang",
    secondaryCta: "Masuk",
    bullets: ["Bahasa Indonesia", "Nyaman di HP", "Kata sandi di-hash (bcrypt)"],
  },
  slides: [],
  marquee: {
    enabled: true,
    showLogo: true,
    items: ["Catat lembur real-time", "Bukti dalam satu alur", "Approval sekali klik", "Rekap Excel otomatis"],
  },
  problem: {
    enabled: true,
    beforeLabel: "Sebelumnya",
    beforeTitle: "Mengingat jam, mengumpulkan bukti, merekap manual.",
    beforeItems: [
      "Jam lembur dicatat dari ingatan",
      "Bukti tersebar di galeri dan chat",
      "Rekap Excel dibuat tangan mendekati deadline",
      "Tidak ada jejak persetujuan yang jelas",
    ],
    afterLabel: "Dengan Rekapin",
    afterTitle: "Satu alur dari catat sampai rekap.",
    afterItems: [
      "Catat saat itu juga, durasi terhitung otomatis",
      "Bukti menempel langsung di pengajuan",
      "Rekap Excel terbentuk otomatis",
      "Setiap persetujuan tercatat dan bisa ditelusuri",
    ],
  },
  features: {
    enabled: true,
    eyebrow: "Fitur",
    title: "Semua yang dibutuhkan, tanpa yang berlebihan.",
    subtitle: "Dirancang agar mencatat lembur terasa ringan, dan meninjau serta merekapnya terasa tenang.",
    items: [
      { icon: "clock", title: "Catat real-time", text: "Isi jam mulai dan selesai, durasi terhitung otomatis. Jam terakhirmu diingat supaya input berikutnya lebih cepat." },
      { icon: "paperclip", title: "Bukti dalam satu alur", text: "Unggah foto atau PDF langsung saat mengajukan. Foto dikompres otomatis, jadi cepat bahkan dari HP." },
      { icon: "check", title: "Approval yang jelas", text: "Atasan melihat durasi dan bukti, lalu setujui atau tolak dengan alasan. Semua tercatat rapi dan bisa dilacak." },
      { icon: "sheet", title: "Rekap Excel sekali klik", text: "Pilih rentang tanggal, unduh .xlsx lengkap: nama, jam, total, status, dan catatan approval." },
      { icon: "calendar", title: "Rekap otomatis berkala", text: "Atur jadwal mingguan atau bulanan. Hasilnya dikirim ke email admin dan approver, dan bisa diunduh dari dashboard." },
      { icon: "gauge", title: "Pengingat limit bulanan", text: "Tetapkan batas jam lemburmu sendiri. Kamu diberi peringatan saat mendekati batas, tanpa memblokir pengajuan." },
    ],
  },
  steps: {
    enabled: true,
    eyebrow: "Cara kerja",
    title: "Tiga langkah, selesai.",
    items: [
      { title: "Catat & lampirkan", text: "Karyawan mengisi jam lembur dan mengunggah bukti dalam satu form." },
      { title: "Atasan meninjau", text: "Approver melihat pengajuan menunggu, memeriksa bukti, lalu menyetujui atau menolak." },
      { title: "Rekap tersusun sendiri", text: "Data terkumpul rapi dan siap diekspor ke Excel, manual maupun terjadwal." },
    ],
  },
  roles: {
    enabled: true,
    eyebrow: "Untuk setiap peran",
    title: "Tampilan yang pas untuk tugasmu.",
    items: [
      { name: "Karyawan", items: ["Ajukan lembur dengan bukti", "Pantau status & catatan penolakan", "Atur limit jam bulanan sendiri", "Ekspor rekap milik sendiri"] },
      { name: "Approver", items: ["Tinjau pengajuan yang menunggu", "Setujui atau tolak dengan alasan", "Ekspor rekap seluruh tim", "Unduh rekap otomatis"] },
      { name: "Admin", items: ["Undang & kelola pengguna", "Atur peran employee ↔ approver", "Nonaktifkan akses kapan saja", "Atur jadwal rekap otomatis"] },
    ],
  },
  cta: {
    enabled: true,
    title: "Berhenti merekap lembur secara manual.",
    text: "Mulai catat hari ini, dan biarkan Rekapin menyusun sisanya.",
    primary: "Daftar Gratis",
    secondary: "Masuk",
  },
  footer: {
    about: "Pencatatan & persetujuan lembur yang rapi, dari catat sampai rekap.",
    email: "",
    links: [],
    copyright: "Rekapin. Seluruh hak dilindungi.",
  },
};

/** Gabungkan data tersimpan dengan default per kunci, sehingga field baru/yang hilang tetap aman. */
export function mergeSite(stored: unknown): SiteContent {
  const s = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(DEFAULT_SITE) as (keyof SiteContent)[]) {
    const def = DEFAULT_SITE[k];
    const val = s[k];
    out[k] = Array.isArray(def) ? (Array.isArray(val) ? val : def) : { ...(def as object), ...((val as object) ?? {}) };
  }
  const parsed = siteSchema.safeParse(out);
  return parsed.success ? parsed.data : DEFAULT_SITE;
}
