"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/modal";
import { Alert, Button, Field, cx } from "@/components/ui";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "employee" | "approver" | "admin";
  isActive: boolean;
  joined: string;
}

const roleLabel = { employee: "Karyawan", approver: "Approver", admin: "Admin" } as const;

export function UsersManager({ rows, meId }: { rows: UserRow[]; meId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [confirm, setConfirm] = useState<UserRow | null>(null);

  async function patch(id: string, path: "role" | "active", body: object) {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/users/${id}/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      setError((await res.json().catch(() => null))?.error ?? "Gagal menyimpan perubahan");
      return false;
    }
    router.refresh();
    return true;
  }

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setInviteError("");
    setInviteLoading(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: f.get("name"), email: f.get("email"), role: f.get("role") }),
    });
    const data = await res.json().catch(() => null);
    setInviteLoading(false);
    if (!res.ok) return setInviteError(data?.error ?? "Gagal mengundang");
    setInviting(false);
    setNotice(
      data.emailed
        ? "Undangan terkirim lewat email."
        : "Pengguna dibuat, tetapi email gagal terkirim. Minta pengguna memakai \"Lupa kata sandi\".",
    );
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
          <p className="text-sm text-muted">Kelola peran karyawan dan approver</p>
        </div>
        <Button onClick={() => { setInviting(true); setInviteError(""); }}>+ Undang Pengguna</Button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {error && <Alert tone="error">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 pr-4 font-medium">Nama</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Peran</th>
              <th className="py-2 pr-4 font-medium">Bergabung</th>
              <th className="py-2 text-right font-medium">Akses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((u) => {
              const isMe = u.id === meId;
              return (
                <tr key={u.id} className={cx(!u.isActive && "opacity-60")}>
                  <td className="py-3 pr-4 font-medium">
                    {u.name} {isMe && <span className="ml-1 text-xs font-normal text-muted">(kamu)</span>}
                  </td>
                  <td className="py-3 pr-4 text-muted">{u.email}</td>
                  <td className="py-3 pr-4">
                    {u.role === "admin" || isMe ? (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{roleLabel[u.role]}</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={busy === u.id}
                        onChange={(e) => patch(u.id, "role", { role: e.target.value })}
                        aria-label={`Peran ${u.name}`}
                        className="h-9 rounded-input border border-border bg-surface px-2 text-sm"
                      >
                        <option value="employee">Karyawan</option>
                        <option value="approver">Approver</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-muted">{u.joined}</td>
                  <td className="py-3 text-right">
                    {isMe ? null : u.isActive ? (
                      <button onClick={() => setConfirm(u)} className="text-sm text-danger hover:underline">Hapus akses</button>
                    ) : (
                      <button onClick={() => patch(u.id, "active", { isActive: true })} className="text-sm text-primary hover:underline">Aktifkan</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {inviting && (
        <Modal title="Undang Pengguna" onClose={() => setInviting(false)}>
          <form onSubmit={invite} className="flex flex-col gap-4">
            <Field label="Nama lengkap" name="name" required minLength={2} />
            <Field label="Email" name="email" type="email" required />
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              Peran
              <select name="role" defaultValue="employee" className="h-11 rounded-input border border-border bg-surface px-3 text-sm font-normal">
                <option value="employee">Karyawan</option>
                <option value="approver">Approver</option>
              </select>
            </label>
            <p className="text-xs text-muted">Pengguna menerima email berisi link untuk menetapkan kata sandi (berlaku 72 jam).</p>
            {inviteError && <Alert tone="error">{inviteError}</Alert>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setInviting(false)}>Batal</Button>
              <Button type="submit" loading={inviteLoading}>Kirim undangan</Button>
            </div>
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal title="Hapus akses pengguna?" onClose={() => setConfirm(null)}>
          <p className="text-sm text-muted">
            <b className="text-text">{confirm.name}</b> tidak akan bisa masuk lagi. Riwayat lemburnya tetap tersimpan, dan aksesnya bisa diaktifkan kembali.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)}>Batal</Button>
            <Button
              variant="danger"
              loading={busy === confirm.id}
              onClick={async () => { if (await patch(confirm.id, "active", { isActive: false })) setConfirm(null); }}
            >
              Hapus akses
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
