import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Atur kata sandi | Rekapin" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-input bg-bg" />}>
      <ResetForm />
    </Suspense>
  );
}
