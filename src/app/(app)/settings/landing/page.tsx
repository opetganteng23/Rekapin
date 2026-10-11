import type { Metadata } from "next";
import { readSiteFresh } from "@/lib/site";
import { requireUser } from "@/lib/session";
import { SiteEditor } from "./site-editor";

export const metadata: Metadata = { title: "Landing Page | Rekapin" };

export default async function LandingSettingsPage() {
  await requireUser(["admin"]);
  return <SiteEditor initial={await readSiteFresh()} />;
}
