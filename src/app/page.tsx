import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { LandingCta } from "@/components/landing/landing-cta";
import { Reveal } from "@/components/landing/reveal";

export const metadata: Metadata = {
  title: "Rekapin — Rekap lembur tanpa ribet",
  description:
    "Catat jam lembur, unggah bukti, dapatkan persetujuan atasan, dan rekap ke Excel otomatis — dalam satu alur yang rapi.",
};

const icon = (d: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

const FEATURES = [
  {
    title: "Catat real-time",
    text: "Isi jam mulai dan selesai, durasi terhitung otomatis. Jam terakhirmu diingat supaya input berikutnya lebih cepat.",
    icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  },
  {
    title: "Bukti dalam satu alur",
    text: "Unggah foto atau PDF langsung saat mengajukan. Foto dikompres otomatis, jadi cepat bahkan dari HP.",
    icon: icon(<><path d="M21.4 11.6 12.5 20.5a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2" /></>),
  },
  {
    title: "Approval yang jelas",
    text: "Atasan melihat durasi dan bukti, lalu setujui atau tolak dengan alasan. Semua tercatat rapi dan bisa dilacak.",
    icon: icon(<><path d="M20 6 9 17l-5-5" /></>),
  },
  {
    title: "Rekap Excel sekali klik",
    text: "Pilih rentang tanggal, unduh .xlsx lengkap: nama, jam, total, status, dan catatan approval.",
    icon: icon(<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13l4 5M13 13l-4 5" /></>),
  },
  {
    title: "Rekap otomatis berkala",
    text: "Atur jadwal mingguan atau bulanan. Hasilnya dikirim ke email admin dan approver, dan bisa diunduh dari dashboard.",
    icon: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  },
  {
    title: "Pengingat limit bulanan",
    text: "Tetapkan batas jam lemburmu sendiri. Kamu diberi peringatan saat mendekati batas, tanpa memblokir pengajuan.",
    icon: icon(<><path d="M3 12a9 9 0 0 1 18 0" /><path d="M12 12l4-4" /><circle cx="12" cy="12" r="1.2" /></>),
  },
];

const STEPS = [
  { n: "01", title: "Catat & lampirkan", text: "Karyawan mengisi jam lembur dan mengunggah bukti dalam satu form." },
  { n: "02", title: "Atasan meninjau", text: "Approver melihat pengajuan menunggu, memeriksa bukti, lalu menyetujui atau menolak." },
  { n: "03", title: "Rekap tersusun sendiri", text: "Data terkumpul rapi dan siap diekspor ke Excel, manual maupun terjadwal." },
];

const ROLES = [
  {
    name: "Karyawan",
    items: ["Ajukan lembur dengan bukti", "Pantau status & catatan penolakan", "Atur limit jam bulanan sendiri", "Ekspor rekap milik sendiri"],
  },
  {
    name: "Approver",
    items: ["Tinjau pengajuan yang menunggu", "Setujui atau tolak dengan alasan", "Ekspor rekap seluruh tim", "Unduh rekap otomatis"],
  },
  {
    name: "Admin",
    items: ["Undang & kelola pengguna", "Atur peran employee ↔ approver", "Nonaktifkan akses kapan saja", "Atur jadwal rekap otomatis"],
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-input bg-primary text-base font-semibold text-white">R</span>
      <span className="text-lg font-semibold tracking-tight">Rekapin</span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="relative flex-1 overflow-x-clip">
      {/* Navigasi */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi">
            {[["#fitur", "Fitur"], ["#cara-kerja", "Cara kerja"], ["#peran", "Peran"]].map(([href, label]) => (
              <a key={href} href={href} className="rounded-input px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-text">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LandingCta size="nav" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
          <div className="absolute -left-32 -top-24 size-[28rem] animate-blob rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-24 top-24 size-[24rem] animate-blob rounded-full bg-success/15 blur-3xl [animation-delay:-5s]" />
          <div className="absolute bottom-0 left-1/3 size-80 animate-blob rounded-full bg-warning/10 blur-3xl [animation-delay:-9s]" />
          <div
            className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            style={{
              backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-24">
          <div>
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              Pencatatan &amp; persetujuan lembur
            </span>

            <h1 className="animate-fade-up mt-6 text-4xl font-semibold leading-[1.15] tracking-tight [animation-delay:100ms] sm:text-5xl lg:text-[3.4rem]">
              Rekap lembur jadi rapi,{" "}
              <span className="bg-gradient-to-r from-primary to-[#6fa3cf] bg-clip-text text-transparent">tanpa drama</span>{" "}
              menjelang deadline.
            </h1>

            <p className="animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-muted [animation-delay:220ms] sm:text-lg">
              Catat jam lembur dan unggah bukti dalam satu alur. Atasan menyetujui dengan sekali klik, dan rekap Excel tersusun otomatis.
            </p>

            <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:340ms]">
              <LandingCta size="hero" />
            </div>

            <ul className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted [animation-delay:460ms]">
              {["Bahasa Indonesia", "Nyaman di HP", "Kata sandi di-hash (bcrypt)"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="text-success">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-up [animation-delay:300ms]">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* Masalah → solusi */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:py-20">
          <Reveal>
            <p className="text-sm font-medium text-danger">Sebelumnya</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Mengingat jam, mengumpulkan bukti, merekap manual.</h2>
            <ul className="mt-5 space-y-3 text-muted">
              {["Jam lembur dicatat dari ingatan", "Bukti tersebar di galeri dan chat", "Rekap Excel dibuat tangan mendekati deadline", "Tidak ada jejak persetujuan yang jelas"].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-0.5 text-danger/70">✕</span>{t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-sm font-medium text-success">Dengan Rekapin</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Satu alur dari catat sampai rekap.</h2>
            <ul className="mt-5 space-y-3 text-muted">
              {["Catat saat itu juga, durasi terhitung otomatis", "Bukti menempel langsung di pengajuan", "Rekap Excel terbentuk otomatis", "Setiap persetujuan tercatat dan bisa ditelusuri"].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-0.5 text-success">✓</span>{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Fitur */}
      <section id="fitur" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Fitur</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Semua yang dibutuhkan, tanpa yang berlebihan.</h2>
            <p className="mt-4 text-muted">Dirancang agar mencatat lembur terasa ringan, dan meninjau serta merekapnya terasa tenang.</p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 100}>
                <article className="group h-full rounded-card border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(79,124,172,0.35)]">
                  <div className="flex size-11 items-center justify-center rounded-input bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                    {f.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="scroll-mt-20 border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Cara kerja</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tiga langkah, selesai.</h2>
          </Reveal>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" aria-hidden />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 140}>
                <div className="relative text-center">
                  <div className="relative mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-bg text-base font-semibold text-primary shadow-sm">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Peran */}
      <section id="peran" className="scroll-mt-20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Untuk setiap peran</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tampilan yang pas untuk tugasmu.</h2>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {ROLES.map((r, i) => (
              <Reveal key={r.name} delay={i * 120}>
                <div className="h-full rounded-card border border-border bg-surface p-6 transition-shadow duration-300 hover:shadow-[0_20px_50px_-24px_rgba(31,41,55,0.25)]">
                  <h3 className="text-xl font-semibold">{r.name}</h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-muted">
                    {r.items.map((t) => (
                      <li key={t} className="flex gap-2.5"><span className="text-success">✓</span>{t}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="px-4 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-text px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -left-20 -top-20 size-72 animate-blob rounded-full bg-primary/40 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 animate-blob rounded-full bg-success/25 blur-3xl [animation-delay:-6s]" aria-hidden />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                Berhenti merekap lembur secara manual.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">Mulai catat hari ini, dan biarkan Rekapin menyusun sisanya.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/register" className="inline-flex h-12 items-center rounded-input bg-white px-7 text-sm font-medium text-text transition-all hover:-translate-y-0.5 hover:bg-white/90">
                  Daftar Gratis
                </Link>
                <Link href="/login" className="inline-flex h-12 items-center rounded-input border border-white/25 px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-8">
          <Logo />
          <p>© Rekapin. Pencatatan &amp; persetujuan lembur.</p>
        </div>
      </footer>
    </div>
  );
}
