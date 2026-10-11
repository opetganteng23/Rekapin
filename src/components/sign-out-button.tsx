"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui";

export function SignOutButton() {
  return (
    <Button variant="ghost" className="h-9 px-3" onClick={() => signOut({ callbackUrl: "/login" })}>
      Keluar
    </Button>
  );
}
