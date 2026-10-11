import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ObjectId } from "mongodb";
import { apiUser, badRequest } from "@/lib/api";
import { SITE_TAG, readSiteFresh, siteContentCol, siteImages, siteSchema } from "@/lib/site";

export async function GET() {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;
  return NextResponse.json(await readSiteFresh());
}

export async function PUT(req: Request) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;

  const parsed = siteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return badRequest(`Kolom "${issue.path.join(".")}" kosong atau melebihi batas karakter`);
  }
  const content = parsed.data;

  const images = await siteImages();
  const ids = content.slides.map((s) => new ObjectId(s.id));
  if (ids.length > 0 && (await images.countDocuments({ _id: { $in: ids } })) !== ids.length) {
    return badRequest("Ada gambar slide yang tidak ditemukan. Unggah ulang gambarnya.");
  }

  await (await siteContentCol()).updateOne(
    { _id: "main" },
    { $set: { content, updatedAt: new Date() } },
    { upsert: true },
  );

  // Bersihkan gambar yatim (tidak dipakai & sudah lebih dari 1 jam, agar unggahan yang belum disimpan aman).
  await images.deleteMany({ _id: { $nin: ids }, createdAt: { $lt: new Date(Date.now() - 3_600_000) } });

  // Landing page langsung memakai konten baru.
  revalidateTag(SITE_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
