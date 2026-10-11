import { decide } from "@/lib/decide";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return decide((await ctx.params).id, "approved");
}
