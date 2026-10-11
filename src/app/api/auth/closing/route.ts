import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CLOSING_COOKIE, makeClosingValue } from "@/lib/closing";

/** Hanya terima permintaan dari situs ini sendiri (mencegah pihak lain memaksa logout korban). */
function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin" || site === "none";
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// Dipanggil lewat navigator.sendBeacon saat tab terakhir ditutup.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Ditolak" }, { status: 403 });
  const session = await auth();
  const sid = session?.sid;
  if (!session?.user || !sid) return new NextResponse(null, { status: 204 });

  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(CLOSING_COOKIE, makeClosingValue(sid), { ...cookieOptions, maxAge: 60 * 60 * 24 });
  return res;
}

// Dibatalkan saat halaman dimuat lagi (refresh atau tab dibuka kembali) dalam masa tenggang.
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Ditolak" }, { status: 403 });
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(CLOSING_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}
