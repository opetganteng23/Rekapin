"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Modal } from "@/components/modal";
import { Alert, Button, Field, cx } from "@/components/ui";
import { useToast } from "@/components/toast";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "employee" | "approver" | "admin";
  isActive: boolean;
  joined: string;
}

const roleLabel = { employee: "Karyawan", approver: "Approver", admin: "Admin" } as const;
type Dialog =
  | { kind: "invite" }
  | { kind: "edit"; user: UserRow }
  | { kind: "deactivate" | "delete" | "reset"; user: UserRow }
  | null;

export function UsersManager({ rows, meId }: { rows: UserRow[]; meId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [error, setError] = useState(""); // error tabel
  const [dialogError, setDialogError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.isActive).length,
      approver: rows.filter((r) => r.role === "approver").length,
      employee: rows.filter((r) => r.role === "employee").length,
    }),
    [rows],
  );

  const shown = rows.filter(
    (r) =>
      (roleFilter === "all" || r.role === roleFilter) &&
      (query === "" || `${r.name} ${r.email}`.toLowerCase().includes(query.toLowerCase())),
  );

  function open(d: Dialog) {
    setDialogError("");
    setDialog(d);
  }

  /** Jalankan request; sukses → refresh & tutup dialog, gagal → tampilkan error di dialog/tabel. */
  async function call(id: string, url: string, method: string, body?: object, success?: string) {
    setBusy(id);
    setError("");
    setDialogError("");
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) {
      const msg = data?.error ?? "Gagal menyimpan perubahan";
      if (dialog) setDialogError(msg);
      else setError(msg);
      return null;
    }
    setDialog(null);
    if (success) toast.success(success);
    router.refresh();
    return data;
  }

  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = await call("invite", "/api/users", "POST", { name: f.get("name"), email: f.get("email"), role: f.get("role") });
    if (data) {
      if (data.emailed) toast.success("Undangan terkirim", "Pengguna menerima email untuk menetapkan kata sandi.");
      else toast.info("Pengguna dibuat, email belum terkirim", "Gunakan Kirim reset setelah SMTP dikonfigurasi.");
    }
  }

  async function edit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (dialog?.kind !== "edit") return;
    const f = new FormData(e.currentTarget);
    await call(dialog.user.id, `/api/users/${dialog.user.id}`, "PATCH", { name: f.get("name"), email: f.get("email") }, "Data pengguna diperbarui.");
  }

  const cards = [
    ["Total pengguna", stats.total],
    ["Aktif", stats.active],
    ["Approver", stats.approver],
    ["Karyawan", stats.employee],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Pengguna</h1>
          <p className="text-sm text-muted">Tambah, ubah, dan kelola akses seluruh pengguna</p>
        </div>
        <Button onClick={() => open({ kind: "invite" })}>+ Undang Pengguna</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-card border border-border bg-surface p-4 shadow-sm">
            <div className="text-xs text-muted">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Cari nama atau email…"
            aria-label="Cari pengguna"
            className="h-10 flex-1 rounded-input border border-border bg-surface px-3 text-sm focus:border-primary"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter peran"
            className="h-10 rounded-input border border-border bg-surface px-3 text-sm"
          >
            <option value="all">Semua peran</option>
            <option value="employee">Karyawan</option>
            <option value="approver">Approver</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {error && <Alert tone="error">{error}</Alert>}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">Nama</th>
                <th className="py-2 pr-4 font-medium">Email</th>
                <th className="py-2 pr-4 font-medium">Peran</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Bergabung</th>
                <th className="py-2 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-muted">Tidak ada pengguna yang cocok.</td></tr>
              )}
              {shown.map((u) => {
                const isMe = u.id === meId;
                const locked = isMe || u.role === "admin"; // role admin & diri sendiri tidak bisa diubah/dihapus
                return (
                  <tr key={u.id} className={cx(!u.isActive && "bg-bg/50")}>
                    <td className="py-3 pr-4 font-medium">
                      {u.name} {isMe && <span className="ml-1 text-xs font-normal text-muted">(kamu)</span>}
                    </td>
                    <td className="py-3 pr-4 text-muted">{u.email}</td>
                    <td className="py-3 pr-4">
                      {locked ? (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{roleLabel[u.role]}</span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={busy === u.id}
                          onChange={(e) => call(u.id, `/api/users/${u.id}/role`, "PATCH", { role: e.target.value }, `Peran ${u.name} diubah menjadi ${e.target.value === "approver" ? "Approver" : "Karyawan"}`)}
                          aria-label={`Peran ${u.name}`}
                          className="h-9 rounded-input border border-border bg-surface px-2 text-sm"
                        >
                          <option value="employee">Karyawan</option>
                          <option value="approver">Approver</option>
                        </select>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-medium", u.isActive ? "bg-success/10 text-success" : "bg-border text-muted")}>
                        {u.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-muted">{u.joined}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-3 text-sm whitespace-nowrap">
                        <button onClick={() => open({ kind: "edit", user: u })} className="text-primary hover:underline">Edit</button>
                        <button onClick={() => open({ kind: "reset", user: u })} className="text-primary hover:underline">Kirim reset</button>
                        {!locked && (
                          u.isActive ? (
                            <button onClick={() => open({ kind: "deactivate", user: u })} className="text-warning hover:underline brightness-75">Hapus akses</button>
                          ) : (
                            <button onClick={() => call(u.id, `/api/users/${u.id}/active`, "PATCH", { isActive: true }, `${u.name} diaktifkan kembali.`)} className="text-success hover:underline">Aktifkan</button>
                          )
                        )}
                        {!locked && <button onClick={() => open({ kind: "delete", user: u })} className="text-danger hover:underline">Hapus</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {dialog?.kind === "invite" && (
        <Modal title="Undang Pengguna" onClose={() => setDialog(null)}>
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
            {dialogError && <Alert tone="error">{dialogError}</Alert>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDialog(null)}>Batal</Button>
              <Button type="submit" loading={busy === "invite"}>Kirim undangan</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.kind === "edit" && (
        <Modal title="Edit Pengguna" onClose={() => setDialog(null)}>
          <form onSubmit={edit} className="flex flex-col gap-4">
            <Field label="Nama lengkap" name="name" defaultValue={dialog.user.name} required minLength={2} />
            <Field label="Email" name="email" type="email" defaultValue={dialog.user.email} required />
            <p className="text-xs text-muted">Untuk mengubah peran, gunakan pilihan peran di tabel. Kata sandi hanya bisa diatur ulang lewat Kirim reset.</p>
            {dialogError && <Alert tone="error">{dialogError}</Alert>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDialog(null)}>Batal</Button>
              <Button type="submit" loading={busy === dialog.user.id}>Simpan</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.kind === "reset" && (
        <Modal title="Kirim link reset kata sandi?" onClose={() => setDialog(null)}>
          <p className="text-sm text-muted">
            Link untuk mengatur kata sandi baru dikirim ke <b className="text-text">{dialog.user.email}</b> (berlaku 1 jam). Kata sandi lama tetap berlaku sampai pengguna menggantinya.
          </p>
          {dialogError && <div className="mt-4"><Alert tone="error">{dialogError}</Alert></div>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialog(null)}>Batal</Button>
            <Button loading={busy === dialog.user.id} onClick={() => call(dialog.user.id, `/api/users/${dialog.user.id}/reset`, "POST", undefined, "Link reset terkirim.")}>
              Kirim link
            </Button>
          </div>
        </Modal>
      )}

      {dialog?.kind === "deactivate" && (
        <Modal title="Hapus akses pengguna?" onClose={() => setDialog(null)}>
          <p className="text-sm text-muted">
            <b className="text-text">{dialog.user.name}</b> tidak akan bisa masuk lagi. Riwayat lemburnya tetap tersimpan, dan aksesnya bisa diaktifkan kembali kapan saja.
          </p>
          {dialogError && <div className="mt-4"><Alert tone="error">{dialogError}</Alert></div>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialog(null)}>Batal</Button>
            <Button variant="danger" loading={busy === dialog.user.id} onClick={() => call(dialog.user.id, `/api/users/${dialog.user.id}/active`, "PATCH", { isActive: false }, `Akses ${dialog.user.name} dicabut.`)}>
              Hapus akses
            </Button>
          </div>
        </Modal>
      )}

      {dialog?.kind === "delete" && (
        <Modal title="Hapus pengguna permanen?" onClose={() => setDialog(null)}>
          <p className="text-sm text-muted">
            Akun <b className="text-text">{dialog.user.name}</b> ({dialog.user.email}) dihapus selamanya dan tidak bisa dikembalikan.
            Hanya bisa untuk pengguna yang belum punya riwayat lembur; jika sudah ada, gunakan Hapus akses.
          </p>
          {dialogError && <div className="mt-4"><Alert tone="error">{dialogError}</Alert></div>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialog(null)}>Batal</Button>
            <Button variant="danger" loading={busy === dialog.user.id} onClick={() => call(dialog.user.id, `/api/users/${dialog.user.id}`, "DELETE", undefined, `${dialog.user.name} dihapus.`)}>
              Hapus permanen
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
