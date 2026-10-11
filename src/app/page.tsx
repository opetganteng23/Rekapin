import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

async function Redirector() {
  const session = await auth();
  return redirect(session?.user ? "/dashboard" : "/login");
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-muted">Memuat…</div>}>
      <Redirector />
    </Suspense>
  );
}
