import { NextResponse } from "next/server";
import { z } from "zod";
import { apiUser, badRequest } from "@/lib/api";
import { siteImages, type SiteImageDoc } from "@/lib/site";

const MAX_BYTES = 800 * 1024; // setelah kompresi di browser; body Vercel dibatasi 4,5 MB
const MAX_STORED = 40;

const schema = z.object({ dataUrl: z.string().max(1_200_000) });

/** Cek tanda tangan file agar yang disimpan benar-benar JPEG/PNG/WebP (bukan sekadar mime yang diklaim). */
function sniff(buf: Buffer): SiteImageDoc["mime"] | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

// Unggah satu gambar slide dalam bentuk data URL base64; tersimpan sebagai base64 di MongoDB.
export async function POST(req: Request) {
  const a = await apiUser(["admin"]);
  if ("error" in a) return a.error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest("Gambar tidak valid atau terlalu besar");
  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(parsed.data.dataUrl);
  if (!m) return badRequest("Format harus JPG, PNG, atau WebP", 415);

  const buf = Buffer.from(m[1], "base64");
  if (buf.length > MAX_BYTES) return badRequest("Ukuran gambar maksimal 800 KB setelah kompresi", 413);
  const mime = sniff(buf);
  if (!mime) return badRequest("Isi file bukan gambar yang valid", 415);

  const col = await siteImages();
  if ((await col.estimatedDocumentCount()) >= MAX_STORED) {
    return badRequest("Terlalu banyak gambar tersimpan. Hapus slide yang tidak dipakai lalu simpan dulu.", 409);
  }
  const res = await col.insertOne({ mime, base64: m[1], bytes: buf.length, createdAt: new Date() } as SiteImageDoc);
  return NextResponse.json({ id: res.insertedId.toString(), bytes: buf.length }, { status: 201 });
}
