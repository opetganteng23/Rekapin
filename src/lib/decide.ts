import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { apiUser, badRequest } from "@/lib/api";
import { overtimeRecords } from "@/lib/db";

/** Logika bersama approve/reject. Hanya approver; tidak boleh memutuskan pengajuan sendiri. */
export async function decide(
  idParam: string,
  action: "approved" | "rejected",
  note?: string,
) {
  const a = await apiUser(["approver"]);
  if ("error" in a) return a.error;
  if (!ObjectId.isValid(idParam)) return badRequest("ID tidak valid");

  const _id = new ObjectId(idParam);
  const col = await overtimeRecords();
  const rec = await col.findOne({ _id });
  if (!rec) return badRequest("Pengajuan tidak ditemukan", 404);
  if (rec.userId.toString() === a.user.id) {
    return badRequest("Tidak bisa memutuskan pengajuan sendiri", 403);
  }

  const now = new Date();
  // Filter status pending membuat dua approver yang klik bersamaan tidak saling menimpa.
  const updated = await col.findOneAndUpdate(
    { _id, status: "pending" },
    {
      $set: {
        status: action,
        approvedBy: new ObjectId(a.user.id),
        approvedAt: now,
        updatedAt: now,
        rejectNote: action === "rejected" ? note ?? null : null,
      },
    },
  );
  if (!updated) return badRequest("Pengajuan sudah diproses", 409);
  return NextResponse.json({ ok: true, status: action });
}
