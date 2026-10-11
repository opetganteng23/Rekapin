import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Lupa kata sandi — Rekapin" };

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
