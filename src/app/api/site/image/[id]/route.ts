import { ObjectId } from "mongodb";
import { siteImages } from "@/lib/site";

// Publik: dipakai landing page. Base64 di DB didekode menjadi biner, di-cache lama (id unik per unggahan).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!ObjectId.isValid(id)) return new Response("Not found", { status: 404 });
  const img = await (await siteImages()).findOne({ _id: new ObjectId(id) });
  if (!img) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(Buffer.from(img.base64, "base64")), {
    headers: {
      "Content-Type": img.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
