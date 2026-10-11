import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiUser, badRequest } from "@/lib/api";
import type { OvertimeDoc } from "@/lib/db";
import { toWibDate } from "@/lib/overtime";
import { buildWorkbook, fetchRows } from "@/lib/recap";
import type { Filter } from "mongodb";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const a = await apiUser();
  if ("error" in a) return a.error;

  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  if ((from && !ISO_DATE.test(from)) || (to && !ISO_DATE.test(to))) {
    return badRequest("Format tanggal harus YYYY-MM-DD");
  }

  const match: Filter<OvertimeDoc> = {};
  // Employee hanya boleh mengekspor miliknya sendiri; approver/admin melihat semua.
  if (a.user.role === "employee") match.userId = new ObjectId(a.user.id);
  if (from || to) {
    match.startTime = {};
    if (from) match.startTime.$gte = toWibDate(from, "00:00");
    if (to) match.startTime.$lt = new Date(toWibDate(to, "00:00").getTime() + 86_400_000);
  }

  const file = await buildWorkbook(await fetchRows(match));
  const name = `rekap-lembur${from ? `-${from}` : ""}${to ? `-sd-${to}` : ""}.xlsx`;
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
    },
  });
}
