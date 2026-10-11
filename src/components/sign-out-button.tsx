"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Modal } from "./modal";
import { notifyAuthChanged } from "./tab-close-guard";
import { useToast } from "./toast";
import { Button } from "./ui";

export function SignOutButton() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      // redirect:false agar toast (di root layout) tetap hidup setelah pindah ke halaman login.
      await signOut({ redirect: false });
      notifyAuthChanged(); // matikan peringatan tutup tab
      toast.success("Anda telah keluar", "Sampai jumpa lagi.");
      router.replace("/"); // kembali ke landing page
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Gagal keluar", "Periksa koneksi internet lalu coba lagi.");
    }
  }

  return (
    <>
      <Button variant="ghost" className="h-9 px-3" onClick={() => setOpen(true)}>
        Keluar
      </Button>
      {open && (
        <Modal title="Keluar dari Rekapin?" onClose={() => !loading && setOpen(false)}>
          <p className="text-sm text-muted">Sesi Anda akan diakhiri dan Anda perlu masuk lagi untuk melanjutkan.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" disabled={loading} onClick={() => setOpen(false)}>Batal</Button>
            <Button variant="danger" loading={loading} onClick={confirm}>Ya, keluar</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
