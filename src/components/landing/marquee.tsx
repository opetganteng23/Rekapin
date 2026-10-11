import { LogoMark } from "@/components/logo";

/** Pembatas antar-section berupa running text (dan logo). Dua salinan berjalan agar loop mulus. */
export function Marquee({
  items,
  showLogo,
  reverse = false,
}: {
  items: string[];
  showLogo: boolean;
  reverse?: boolean;
}) {
  if (items.length === 0) return null;
  // Ulangi item agar satu "setengah" selalu lebih lebar dari layar.
  const half = Array.from({ length: Math.max(2, Math.ceil(10 / items.length)) }, () => items).flat();

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {half.map((t, i) => (
        <li key={i} className="flex items-center gap-4 pr-4 sm:gap-6 sm:pr-6">
          {showLogo ? <LogoMark size={26} className="opacity-90" /> : <span className="size-1.5 rounded-full bg-primary/60" />}
          <span className="whitespace-nowrap text-sm font-medium tracking-wide text-muted sm:text-base">{t}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="group relative overflow-hidden border-y border-border bg-surface/70 py-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div
        className={`flex w-max animate-marquee motion-reduce:animate-none group-hover:[animation-play-state:paused] ${reverse ? "[animation-direction:reverse]" : ""}`}
      >
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
