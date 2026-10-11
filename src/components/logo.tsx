import Image from "next/image";
import Link from "next/link";

/** Logo AILO (ikon). Dipakai di navbar, footer, dan halaman auth. */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

export function Brand({ name = "Rekapin", href = "/", size = 36 }: { name?: string; href?: string; size?: number }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={`${name} — beranda`}>
      <LogoMark size={size} />
      <span className="text-lg font-semibold tracking-tight">{name}</span>
    </Link>
  );
}
