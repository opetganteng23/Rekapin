import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

// Body function Vercel dibatasi 4,5 MB; foto dikompres di klien sebelum dikirim.
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Penyimpanan file belum dikonfigurasi" }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Hanya JPG, PNG, atau PDF" }, { status: 415 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 4 MB" }, { status: 413 });
  }

  const blob = await put(`evidence/${session.user.id}/${Date.now()}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return NextResponse.json({ url: blob.url, name: file.name });
}
