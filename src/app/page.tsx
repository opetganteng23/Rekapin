import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingView } from "@/components/landing/landing-view";
import { getSiteContent } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getSiteContent();
  return {
    title: `${c.brand.name} | ${c.hero.badge || "Rekap lembur tanpa ribet"}`,
    description: c.hero.subtitle,
  };
}

async function Landing() {
  return <LandingView content={await getSiteContent()} />;
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-muted">Memuat…</div>}>
      <Landing />
    </Suspense>
  );
}
