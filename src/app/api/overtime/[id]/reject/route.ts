import { z } from "zod";
import { badRequest } from "@/lib/api";
import { decide } from "@/lib/decide";

const schema = z.object({
  note: z.string("Alasan penolakan wajib diisi").trim().min(3, "Alasan penolakan wajib diisi").max(500),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0].message);
  return decide((await ctx.params).id, "rejected", parsed.data.note);
}
