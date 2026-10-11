import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";

const primary =
  "inline-flex h-12 items-center justify-center rounded-input bg-primary px-7 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(79,124,172,0.7)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover";
const secondary =
  "inline-flex h-12 items-center justify-center rounded-input border border-border bg-surface px-7 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-bg";
const navPrimary =
  "inline-flex h-10 items-center rounded-input bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover";

interface Labels {
  primary: string;
  secondary: string;
}

function Guest({ size, labels }: { size: "nav" | "hero"; labels: Labels }) {
  if (size === "nav") {
    return (
      <>
        <Link href="/login" className="hidden h-10 items-center rounded-input px-4 text-sm font-medium text-muted hover:text-text sm:inline-flex">
          {labels.secondary}
        </Link>
        <Link href="/register" className={navPrimary}>Daftar</Link>
      </>
    );
  }
  return (
    <>
      <Link href="/register" className={primary}>{labels.primary}</Link>
      <Link href="/login" className={secondary}>{labels.secondary}</Link>
    </>
  );
}

async function Buttons({ size, labels }: { size: "nav" | "hero"; labels: Labels }) {
  const session = await auth();
  if (!session?.user) return <Guest size={size} labels={labels} />;
  const isAdmin = session.user.role === "admin";
  return (
    <Link href={isAdmin ? "/users" : "/dashboard"} className={size === "nav" ? navPrimary : primary}>
      {isAdmin ? "Buka Panel Admin" : "Buka Dashboard"}
    </Link>
  );
}

/** CTA yang menyesuaikan status login. Sesi dibaca di dalam Suspense; fallback = tampilan tamu (tanpa layout shift). */
export function LandingCta({ size, labels }: { size: "nav" | "hero"; labels: Labels }) {
  return (
    <Suspense fallback={<Guest size={size} labels={labels} />}>
      <Buttons size={size} labels={labels} />
    </Suspense>
  );
}
