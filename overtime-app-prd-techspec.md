# Rekapin — PRD & Technical Specification
### (Overtime Submission & Approval App)

## 1. Background & Problem Statement

Proses pengajuan lembur saat ini dilakukan secara manual: karyawan harus mengingat jam mulai-selesai lembur, mengumpulkan evidence (foto/dokumen) secara terpisah, lalu merekapnya manual saat diminta — biasanya mendekati deadline. Hal ini menyebabkan:

- Karyawan sering telat submit karena proses pengumpulan bukti yang merepotkan
- Rekap manual rawan human error dan data tidak akurat
- Tidak ada jejak approval yang terstruktur
- Proses konversi ke format laporan (Excel) dilakukan manual setiap kali dibutuhkan

## 2. Goals

- Memudahkan karyawan mencatat lembur secara real-time (saat mulai/selesai)
- Menyatukan proses submit lembur dengan upload evidence dalam satu alur
- Menyediakan mekanisme approval oleh atasan
- Menyediakan rekap otomatis yang bisa diexport ke Excel

## 3. Non-Goals (Out of Scope — MVP)

- Integrasi langsung dengan sistem payroll
- Notifikasi/reminder otomatis (phase 2)
- Dashboard analitik lembur (phase 2)
- Multi-level approval (lebih dari 1 atasan)

## 4. User Roles

| Role | Deskripsi |
|---|---|
| Employee | Submit lembur, upload evidence, lihat status pengajuan sendiri, set limit jam lembur bulanan sendiri |
| Approver | Review & approve/reject pengajuan, export rekap ke Excel |
| Admin | Mengelola role user lain (assign/ubah role employee ↔ approver), memiliki otoritas penuh atas user management |

> Role assignment: default semua user baru = `employee`. Perubahan role dilakukan oleh `admin` melalui halaman/endpoint user management (lihat §6.5 & §8.2).

## 5. User Flow

1. Employee login via email & password
2. Employee submit lembur:
   - Input/tap waktu mulai
   - Input/tap waktu selesai
   - Sistem auto-calculate total jam
   - Upload evidence (foto/dokumen)
   - Submit → status: `pending`
3. Approver menerima daftar pengajuan `pending`
4. Approver review (lihat durasi + evidence) → approve / reject (dengan catatan jika reject)
5. Employee bisa melihat status terbaru pengajuannya
6. Approver (atau employee) bisa export rekap lembur dalam rentang tanggal tertentu ke file Excel

## 6. Functional Requirements

### 6.1 Authentication
- FR-1: User register & login menggunakan email + password
- FR-2: Password disimpan dalam bentuk hash (bcrypt), tidak pernah plaintext
- FR-2a: *(Phase 2)* Login via Google OAuth 2.0 sebagai opsi tambahan
- FR-2b: Registrasi mandiri ("Daftar sebagai karyawan") selalu membuat user dengan role `employee`
- FR-2c: "Lupa kata sandi" — user meminta link reset via email (token sekali pakai, kedaluwarsa 1 jam), lalu mengisi password baru
- FR-2d: Navigasi ditampilkan sesuai role: employee → Dashboard Saya; approver → + Persetujuan; admin → + Pengguna & Pengaturan. Akses ke halaman/endpoint tetap divalidasi di server, bukan hanya disembunyikan di UI
- FR-2e: Halaman Profil: user dapat mengubah nama, avatar, dan password (wajib password lama)

### 6.2 Overtime Submission
- FR-3: Employee dapat input waktu mulai dan waktu selesai lembur
- FR-4: Sistem menghitung otomatis total durasi (dalam jam/menit)
- FR-5: Employee dapat upload 1 atau lebih file evidence (gambar/dokumen)
- FR-6: Sistem validasi durasi tidak boleh negatif atau nol
- FR-7: Setiap pengajuan memiliki status: `pending`, `approved`, `rejected`

### 6.3 Approval
- FR-8: Approver dapat melihat daftar pengajuan dengan status `pending`
- FR-9: Approver dapat approve atau reject pengajuan
- FR-10: Saat reject, approver wajib mengisi catatan alasan (melalui modal "Tolak pengajuan" dengan textarea wajib diisi)
- FR-10a: Approver dapat membuka evidence ("lihat bukti") dalam preview sebelum memutuskan
- FR-10b: Halaman Persetujuan menampilkan kartu ringkasan (Menunggu, Disetujui bulan ini, Ditolak bulan ini, Total jam bulan ini)
- FR-11: Employee dapat melihat status & catatan dari pengajuan yang sudah direview

### 6.4 Rekap & Export
- FR-12: User dapat filter rekap lembur berdasarkan rentang tanggal (date range picker di dashboard employee maupun halaman Persetujuan approver; tombol Export memakai rentang yang sama)
- FR-13: Sistem dapat generate file Excel (.xlsx) dari hasil filter secara manual (tombol "Export")
- FR-14: Sistem dapat auto-generate rekap Excel secara periodik — frekuensi dapat diatur **mingguan atau bulanan** (configurable)
- FR-15: File Excel memuat kolom: Nama, Tanggal, Jam Mulai, Jam Selesai, Total Jam, Status, Catatan Approval
- FR-16: Hasil rekap (manual maupun auto-generate) dapat **didownload langsung** dari dashboard
- FR-17: Hasil auto-generate periodik juga **dikirim otomatis via email** ke admin/approver terkait

### 6.5 User & Role Management
- FR-18: Admin dapat melihat daftar seluruh user
- FR-19: Admin dapat mengubah role user (employee ↔ approver)
- FR-20: Hanya admin yang bisa mengakses halaman/endpoint user management
- FR-20a: Admin dapat mengundang user baru ("+ Undang Pengguna"): mengisi nama, email, role; sistem mengirim email berisi link set-password (memakai mekanisme token yang sama dengan FR-2c)
- FR-20b: Admin dapat "Hapus akses" user = **nonaktifkan** (`isActive: false`), bukan hapus permanen, agar riwayat lembur & audit approval tetap utuh. User nonaktif tidak bisa login; admin dapat mengaktifkan kembali
- FR-20c: Admin tidak bisa menonaktifkan atau menurunkan role dirinya sendiri (mencegah sistem tanpa admin)

### 6.6 Monthly Hour Limit
- FR-21: Employee dapat mengatur sendiri limit jam lembur per bulan (`monthlyHourLimit`)
- FR-22: Sistem menampilkan warning (bukan blocking) ke employee jika total jam lembur bulan berjalan sudah mendekati/melewati limit yang mereka set

## 7. Data Model (MongoDB)

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "passwordHash": "string",
  "avatarUrl": "string (nullable)",
  "role": "employee | approver | admin",
  "isActive": "boolean (default: true)",
  "resetTokenHash": "string (nullable)",
  "resetTokenExpiresAt": "datetime (nullable)",
  "monthlyHourLimit": "number (nullable, diset sendiri oleh user)",
  "createdAt": "datetime"
}
```

### Collection: `overtimeRecords`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "startTime": "datetime",
  "finishTime": "datetime",
  "totalHours": "number",
  "evidenceUrls": ["string"],
  "status": "pending | approved | rejected",
  "approvedBy": "ObjectId (ref: users, nullable)",
  "approvedAt": "datetime (nullable)",
  "rejectNote": "string (nullable)",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

### Collection: `settings`
> Dokumen tunggal (singleton) untuk konfigurasi global aplikasi, bisa diubah admin dari dashboard tanpa redeploy.
```json
{
  "_id": "ObjectId",
  "recapFrequency": "monthly | weekly",
  "recapDayOfMonth": "number (default: 1, dipakai jika frequency = monthly)",
  "recapDayOfWeek": "number (dipakai jika frequency = weekly)",
  "recapHour": "number (default: 6, dalam WIB)",
  "updatedBy": "ObjectId (ref: users)",
  "updatedAt": "datetime"
}
```

## 8. Technical Specification

### 8.1 Tech Stack (decided)
- **Frontend + Backend**: Next.js full-stack (App Router + API routes dalam satu project, satu repo)
- **Database**: MongoDB (Atlas untuk hosting)
- **Auth**: Email + password (NextAuth.js dengan Credentials Provider, password di-hash via `bcrypt`). Google OAuth ditambahkan sebagai provider kedua di Phase 2.
- **File Storage**: Cloud storage (Cloudinary/Supabase Storage/S3) — URL disimpan di MongoDB, bukan file-nya langsung
- **Excel Export**: library `exceljs` atau `xlsx` (Node.js)
- **Scheduled Job**: Vercel Cron Jobs (jika deploy di Vercel) atau `node-cron` untuk auto-generate rekap periodik (mingguan/bulanan, configurable)
- **Email Delivery**: service email (mis. Resend/Nodemailer+SMTP) untuk kirim hasil auto-generate rekap ke admin/approver
- **Deployment**: Vercel (disarankan, karena native support Next.js + Cron)

### 8.2 API Endpoints (draft)

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/auth/register` | Register user baru (email + password) | Public |
| POST | `/api/auth/login` | Login dengan email + password | Public |
| GET | `/api/auth/session` | Cek sesi login | All |
| POST | `/api/auth/forgot-password` | Kirim email link reset password | Public |
| POST | `/api/auth/reset-password` | Set password baru dengan token (juga untuk undangan) | Public |
| PATCH | `/api/users/me` | Ubah nama/avatar/password sendiri | All |
| POST | `/api/users` | Undang user baru (kirim email set-password) | Admin |
| PATCH | `/api/users/:id/active` | Nonaktifkan/aktifkan user ("Hapus akses") | Admin |
| GET | `/api/overtime/summary?month=` | Statistik kartu ringkasan approver | Approver |
| POST | `/api/overtime` | Submit pengajuan lembur baru | Employee |
| GET | `/api/overtime?userId=` | List pengajuan milik sendiri | Employee |
| GET | `/api/overtime?status=pending` | List pengajuan pending | Approver |
| PATCH | `/api/overtime/:id/approve` | Approve pengajuan | Approver |
| PATCH | `/api/overtime/:id/reject` | Reject pengajuan (+note) | Approver |
| GET | `/api/overtime/export?from=&to=` | Export rekap ke Excel (manual, on-demand) | Approver (/Employee) |
| POST | `/api/cron/recap-export` | Trigger auto-generate rekap Excel periodik (mingguan/bulanan, dipanggil scheduler) + kirim email | System (Cron) |
| POST | `/api/upload` | Upload file evidence, return URL | Employee |
| GET | `/api/users` | List seluruh user | Admin |
| PATCH | `/api/users/:id/role` | Ubah role user (employee/approver) | Admin |
| PATCH | `/api/users/me/limit` | Set `monthlyHourLimit` milik sendiri | Employee |
| GET | `/api/settings` | Lihat konfigurasi recap saat ini | Admin |
| PATCH | `/api/settings` | Ubah frekuensi/jadwal auto-generate recap | Admin |

### 8.3 Security Considerations
- Validasi role di setiap endpoint approval (hanya `approver` yang bisa approve/reject)
- File upload dibatasi tipe (jpg, png, pdf) dan ukuran maksimum
- Rate limiting pada endpoint submit untuk mencegah spam

### 8.4 Design System & UX
**Tema: Cloud White.** Mockup lama (krem `#F6F3EC`, aksen terakota, font Source Serif 4) **digantikan** oleh aturan di bawah.

- **Font:** Poppins wajib untuk seluruh UI (heading, body, tabel, form, tombol). Weight: 400 (body), 500 (label/nav), 600 (heading). Dimuat via `next/font/google` (self-hosted, tanpa layout shift), fallback `system-ui, sans-serif`
- **Palet (token CSS/Tailwind):**

| Token | Nilai | Pakai untuk |
|---|---|---|
| `--bg` | `#F5F7FA` | Latar halaman (cloud white, putih kebiruan lembut) |
| `--surface` | `#FFFFFF` | Kartu, tabel, modal |
| `--border` | `#E4E8EE` | Garis & divider |
| `--text` | `#1F2937` | Teks utama |
| `--text-muted` | `#6B7280` | Teks sekunder |
| `--primary` | `#4F7CAC` | Tombol utama, link, fokus |
| `--success` / `--warning` / `--danger` | `#3E9B6E` / `#D99A2B` / `#D4574E` | Status Disetujui / Menunggu (& warning limit) / Ditolak |

  Status memakai badge lembut (latar tint 10–12% + teks warna penuh), tidak pernah hanya mengandalkan warna (selalu ada label teks).
- **Kenyamanan visual:** tanpa putih murni sebagai latar halaman (kurangi silau); radius 12px kartu / 8px input; bayangan tipis; spasi lega (grid 8px); body 14–15px dengan line-height 1.6; kontras teks minimal WCAG AA
- **Kenyamanan penggunaan:**
  - Responsif mobile-first (karyawan lembur biasanya input dari HP): target sentuh ≥ 44px, tabel riwayat berubah jadi kartu di layar kecil
  - Form lembur: default jam dari input terakhir, durasi terhitung langsung, upload drag & drop + kamera di mobile, kompres foto sebelum upload
  - Feedback jelas: skeleton loading, toast sukses/gagal, pesan error inline berbahasa Indonesia, konfirmasi sebelum aksi destruktif
  - Aksesibilitas: fokus ring terlihat, navigasi keyboard, label pada semua input, `prefers-reduced-motion` dihormati
  - Dark mode: tidak termasuk MVP (token disiapkan agar mudah ditambah di Phase 2)

## 9. Decisions Log

| Pertanyaan | Keputusan |
|---|---|
| Role assignment approver | Dikelola oleh role `admin` melalui user management page |
| Arsitektur backend | Full-stack Next.js (frontend + backend satu project) |
| Export Excel | Mendukung keduanya — auto-generate periodik (cron) & tombol manual on-demand |
| Limit kuota lembur | Di-set sendiri oleh masing-masing employee, sifatnya warning bukan blocking |
| Frekuensi auto-generate | **Global, default bulanan** — jalan tanggal 1 jam 06:00 WIB, cakup periode bulan sebelumnya penuh. Opsi ubah ke mingguan tersedia sebagai setting admin (bukan per-user), untuk MVP cukup satu setting global |
| Distribusi hasil auto-generate | Dua-duanya — tersedia untuk didownload dari dashboard **dan** dikirim otomatis via email |
| Metode autentikasi | Email + password (bcrypt hash) untuk MVP. Google OAuth jadi provider tambahan di Phase 2 |
| Admin pertama (seeding) | Akun `rizkyfadhillahx@gmail.com` di-seed sebagai admin pertama via env variable `INITIAL_ADMIN_EMAIL` + script seed (password diset langsung saat seeding, **bukan** disimpan plaintext di dokumen ini — lihat §9a) |
| Nama aplikasi | **Rekapin** |
| Tema & font | Cloud White (`#F5F7FA` latar, kartu putih) dan **Poppins** wajib di seluruh UI; menggantikan tema krem + Source Serif 4 di mockup lama (lihat §8.4) |
| Hapus akses user | Soft-deactivate (`isActive`), bukan hard delete — riwayat lembur tetap terjaga |
| Undang pengguna | Admin input nama/email/role → email link set-password; registrasi mandiri tetap ada dan selalu `employee` |
| Lupa password | Reset via email, token sekali pakai 1 jam |
| Visibilitas menu | Menu disesuaikan role di UI, enforcement tetap di server |
| Gap desain (Rekapin.html) | Perlu ditambah mockup: modal tolak, preview bukti, date range filter, halaman profil, modal undang pengguna, halaman lupa/reset password |

### 9a. Catatan Keamanan Seeding Admin
Password untuk akun admin pertama sebaiknya **tidak ditulis di dokumen/spec ini maupun di repo** (meski ini project pribadi, ini kebiasaan baik untuk dibawa terus). Alur yang disarankan:
- Buat script `seed-admin.ts` yang baca `INITIAL_ADMIN_EMAIL` & `INITIAL_ADMIN_PASSWORD` dari `.env` (file `.env` masuk `.gitignore`, tidak di-commit)
- Script hash password dengan bcrypt sebelum insert ke MongoDB
- Setelah seeding berhasil, disarankan ganti password dari halaman profil

## 10. Open Questions

Tidak ada open question tersisa — seluruh keputusan arsitektur & scope MVP sudah final (lihat §9 Decisions Log). Siap lanjut ke scaffolding project.

## 11. Future Enhancements (Phase 2)

- Reminder/nudge otomatis jika lembur belum disubmit evidence-nya
- Dashboard personal: total jam lembur per bulan vs kebijakan kantor
- Integrasi dengan sistem absensi (auto-prefill draft dari jam login/logout)
- Multi-level approval
