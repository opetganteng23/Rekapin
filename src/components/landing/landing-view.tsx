import Link from "next/link";
import { Brand, LogoMark } from "@/components/logo";
import type { SiteContent } from "@/lib/site";
import { HeroMockup } from "./hero-mockup";
import { HeroSlider } from "./hero-slider";
import { Icon } from "./icons";
import { LandingCta } from "./landing-cta";
import { Marquee } from "./marquee";
import { Reveal } from "./reveal";

export function LandingView({ content: c }: { content: SiteContent }) {
  const name = c.brand.name;
  const labels = { primary: c.hero.primaryCta, secondary: c.hero.secondaryCta };
  const marquee = (reverse = false) =>
    c.marquee.enabled ? <Marquee items={c.marquee.items} showLogo={c.marquee.showLogo} reverse={reverse} /> : null;

  const navLinks = [
    c.features.enabled && ["#fitur", c.features.eyebrow],
    c.steps.enabled && ["#cara-kerja", c.steps.eyebrow],
    c.roles.enabled && ["#peran", "Peran"],
  ].filter(Boolean) as string[][];

  return (
    <div className="relative flex-1 overflow-x-clip">
      {/* Navigasi */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <Brand name={name} />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href} className="rounded-input px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-text">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LandingCta size="nav" labels={labels} />
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
            style={{ backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
          />
        </div>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-16 px-4 pb-24 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-24">
          <div>
            {c.hero.badge && (
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-muted shadow-sm backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                {c.hero.badge}
              </span>
            )}

            <h1 className="animate-fade-up mt-6 text-4xl font-semibold leading-[1.15] tracking-tight [animation-delay:100ms] sm:text-5xl lg:text-[3.4rem]">
              {c.hero.titleBefore}{" "}
              {c.hero.titleHighlight && (
                <span className="bg-gradient-to-r from-primary to-[#6fa3cf] bg-clip-text text-transparent">{c.hero.titleHighlight}</span>
              )}{" "}
              {c.hero.titleAfter}
            </h1>

            <p className="animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-muted [animation-delay:220ms] sm:text-lg">{c.hero.subtitle}</p>

            <div className="animate-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:340ms]">
              <LandingCta size="hero" labels={labels} />
            </div>

            {c.hero.bullets.length > 0 && (
              <ul className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted [animation-delay:460ms]">
                {c.hero.bullets.map((t) => (
                  <li key={t} className="flex items-center gap-2"><span className="text-success">✓</span> {t}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="animate-fade-up [animation-delay:300ms]">
            {c.slides.length > 0 ? (
              <HeroSlider slides={c.slides.map((s) => ({ src: `/api/site/image/${s.id}`, alt: s.alt || name }))} />
            ) : (
              <HeroMockup />
            )}
          </div>
        </div>
      </section>

      {marquee()}

      {/* Masalah → solusi */}
      {c.problem.enabled && (
        <>
          <section className="bg-surface">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:py-20">
              <Reveal>
                <p className="text-sm font-medium text-danger">{c.problem.beforeLabel}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{c.problem.beforeTitle}</h2>
                <ul className="mt-5 space-y-3 text-muted">
                  {c.problem.beforeItems.map((t) => (
                    <li key={t} className="flex gap-3"><span className="mt-0.5 text-danger/70">✕</span>{t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={150}>
                <p className="text-sm font-medium text-success">{c.problem.afterLabel}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{c.problem.afterTitle}</h2>
                <ul className="mt-5 space-y-3 text-muted">
                  {c.problem.afterItems.map((t) => (
                    <li key={t} className="flex gap-3"><span className="mt-0.5 text-success">✓</span>{t}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>
          {marquee(true)}
        </>
      )}

      {/* Fitur */}
      {c.features.enabled && (
        <>
          <section id="fitur" className="scroll-mt-20">
            <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-medium text-primary">{c.features.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{c.features.title}</h2>
                {c.features.subtitle && <p className="mt-4 text-muted">{c.features.subtitle}</p>}
              </Reveal>

              <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {c.features.items.map((f, i) => (
                  <Reveal key={f.title} delay={(i % 3) * 100}>
                    <article className="group h-full rounded-card border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-20px_rgba(79,124,172,0.35)]">
                      <div className="flex size-11 items-center justify-center rounded-input bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                        <Icon name={f.icon} />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
          {marquee()}
        </>
      )}

      {/* Cara kerja */}
      {c.steps.enabled && (
        <>
          <section id="cara-kerja" className="scroll-mt-20 bg-surface">
            <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-medium text-primary">{c.steps.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{c.steps.title}</h2>
              </Reveal>

              <div className="relative mt-14 grid gap-8 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
                <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" aria-hidden />
                {c.steps.items.map((s, i) => (
                  <Reveal key={s.title} delay={i * 140}>
                    <div className="relative text-center">
                      <div className="relative mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-bg text-base font-semibold text-primary shadow-sm">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">{s.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
          {marquee(true)}
        </>
      )}

      {/* Peran */}
      {c.roles.enabled && (
        <>
          <section id="peran" className="scroll-mt-20">
            <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-8 sm:py-28">
              <Reveal className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-medium text-primary">{c.roles.eyebrow}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{c.roles.title}</h2>
              </Reveal>

              <div className="mt-14 grid gap-5 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
                {c.roles.items.map((r, i) => (
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
          {marquee()}
        </>
      )}

      {/* CTA akhir */}
      {c.cta.enabled && (
        <section className="px-4 py-20 sm:px-8 sm:py-28">
          <Reveal>
            <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-text px-6 py-14 text-center sm:px-12 sm:py-20">
              <div className="pointer-events-none absolute -left-20 -top-20 size-72 animate-blob rounded-full bg-primary/40 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 animate-blob rounded-full bg-success/25 blur-3xl [animation-delay:-6s]" aria-hidden />
              <div className="relative">
                <LogoMark size={56} className="mx-auto mb-5 rounded-2xl bg-white p-2" />
                <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">{c.cta.title}</h2>
                {c.cta.text && <p className="mx-auto mt-4 max-w-xl text-white/70">{c.cta.text}</p>}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link href="/register" className="inline-flex h-12 items-center rounded-input bg-white px-7 text-sm font-medium text-text transition-all hover:-translate-y-0.5 hover:bg-white/90">
                    {c.cta.primary}
                  </Link>
                  <Link href="/login" className="inline-flex h-12 items-center rounded-input border border-white/25 px-7 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">
                    {c.cta.secondary}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-full.png" alt={name} width={120} height={115} className="h-auto w-28" />
            {c.footer.about && <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{c.footer.about}</p>}
          </div>

          <nav aria-label="Navigasi footer">
            <h3 className="text-sm font-semibold">Jelajahi</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {navLinks.map(([href, label]) => (
                <li key={href}><a href={href} className="transition-colors hover:text-text">{label}</a></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Akun">
            <h3 className="text-sm font-semibold">Akun</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link href="/login" className="transition-colors hover:text-text">Masuk</Link></li>
              <li><Link href="/register" className="transition-colors hover:text-text">Daftar</Link></li>
              <li><Link href="/forgot-password" className="transition-colors hover:text-text">Lupa kata sandi</Link></li>
            </ul>
          </nav>

          {(c.footer.links.length > 0 || c.footer.email) && (
            <div>
              <h3 className="text-sm font-semibold">Tautan</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {c.footer.links.map((l) => (
                  <li key={l.label + l.href}>
                    <a href={l.href} className="transition-colors hover:text-text" {...(/^https?:/.test(l.href) ? { target: "_blank", rel: "noreferrer" } : {})}>
                      {l.label}
                    </a>
                  </li>
                ))}
                {c.footer.email && (
                  <li><a href={`mailto:${c.footer.email}`} className="transition-colors hover:text-text">{c.footer.email}</a></li>
                )}
              </ul>
            </div>
          )}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-8">
            <p>© {c.footer.copyright}</p>
            <p className="flex items-center gap-2"><LogoMark size={18} /> Didukung AILO</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
