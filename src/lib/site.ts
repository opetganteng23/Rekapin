import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import { mergeSite, type SiteContent, DEFAULT_SITE } from "@/lib/site-shared";

export * from "@/lib/site-shared";

export const SITE_TAG = "site-content";

export async function siteContentCol() {
  return (await getDb()).collection<{ _id: string; content: unknown; updatedAt: Date }>("siteContent");
}

/** Dipakai admin (tanpa cache) agar form selalu menampilkan data terbaru. */
export async function readSiteFresh(): Promise<SiteContent> {
  const doc = await (await siteContentCol()).findOne({ _id: "main" });
  return mergeSite(doc?.content);
}

/** Dipakai landing page. Di-cache; di-invalidasi oleh tag saat admin menyimpan. */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheTag(SITE_TAG);
  cacheLife({ stale: 60, revalidate: 300, expire: 86_400 });
  try {
    return await readSiteFresh();
  } catch (e) {
    console.error("[site] gagal membaca konten, memakai default:", e);
    return DEFAULT_SITE;
  }
}

// ---------- Gambar slide (disimpan sebagai base64 di MongoDB) ----------

export interface SiteImageDoc {
  _id: import("mongodb").ObjectId;
  mime: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
  bytes: number;
  createdAt: Date;
}

export async function siteImages() {
  return (await getDb()).collection<SiteImageDoc>("siteImages");
}
