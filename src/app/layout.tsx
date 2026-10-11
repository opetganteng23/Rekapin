import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { RouteProgress } from "@/components/route-progress";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rekapin",
  description: "Pencatatan & persetujuan lembur",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
