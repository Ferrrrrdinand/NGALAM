# NGALAM - Ngalam Fix Pro

Platform Manajemen Workshop Servis Handphone & Gadget Modern (Kota Malang).

---

## 🌟 Fitur Utama

1. **Website Publik & Portal Booking Servis**
   - Landing page modern, responsif, dan elegan (*Luxury Clean White Theme*).
   - Katalog estimasi harga & garansi suku cadang original.
   - Formulir pesan servis online (*Pickup Delivery & Meja Lab*) dengan validasi nomor tiket unik.
   - Sistem pelacakan status pengerjaan servis (*Tracking Live*).

2. **NgalamBot AI Assistant**
   - Asisten virtual AI pintar 24/7 untuk diagnosa kerusakan dan tanya jawab estimasi biaya.
   - Tampilan maskot 3D AI modern dengan status online real-time.

3. **Multi-Role Portal Terisolasi**
   - **Super Admin & Owner**: Manajemen pengerjaan, kontrol staf, kasir, dan laporan lab.
   - **Kasir Front Desk**: Penerimaan barang, pembayaran tunai/debit/QRIS, dan cetak struk termal.
   - **Teknisi Lab**: Meja kerja pengerjaan perbaikan (*Queue*, *In-Progress*, *Done*, *Quality Control*).
   - **Mitra Driver & Rekanan**: Penjemputan dan pengantaran unit servis pelanggan.
   - **Member Pelanggan**: Riwayat servis, garansi aktif, dan klaim promo.

4. **Integrasi Database Hybrid (PostgreSQL & JSON File Storage)**
   - Mendukung PostgreSQL cloud (Supabase, Neon, Railway, Aiven, atau VPS lokal).
   - Fallback otomatis ke penyimpanan file JSON lokal jika PostgreSQL offline.

---

## ⚙️ Panduan Koneksi ENV (Environment Variables)

Aplikasi membaca konfigurasi sistem dari file `.env` di root folder menggunakan modul `dotenv`.

### 1. Salin File Contoh ENV
```bash
cp .env.example .env
```
*(Atau buat file baru bernama `.env` dan salin isi dari `.env.example`)*.

### 2. Konfigurasi Variabel di `.env`
```env
# Port Server
PORT=3000
ADMIN_PORT=3001

# Kode Referral Master Super Admin
ADMIN_REFERRAL_CODE=NGALAM-SUPER-2026

# Pemisahan File User Data
USERS_ADMIN_FILE=data/users_admin.json
USERS_TEKNISI_FILE=data/users_teknisi.json
USERS_MITRA_FILE=data/users_mitra.json

# Koneksi Database PostgreSQL (Opsional / Recommended)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ngalam_fix_pro
PGDATABASE=ngalam_fix_pro
PGUSER=postgres
PGPASSWORD=password
PGHOST=localhost
PGPORT=5432
```

> **Catatan Keamanan Penting**:
> File `.env` **tidak akan di-upload ke GitHub** karena sudah terdaftar di `.gitignore` demi menjaga keamanan kata sandi database dan kunci rahasia Anda.

---

## 🚀 Cara Menjalankan Project

### 1. Pasang Dependensi
```bash
npm install
```

### 2. Jalankan Server
```bash
npm start
# atau
node server.js
```

### 3. Buka di Browser
- **Portal Publik**: [http://localhost:3000](http://localhost:3000)
- **Portal Login Terpadu**: [http://localhost:3000/login/index.html](http://localhost:3000/login/index.html)
- **Portal Admin & Kasir**: [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)

---

## 🌐 Menghubungkan ENV di Platform Hosting (Production)

Saat men-deploy ke cloud (seperti **Railway**, **Render**, **Heroku**, **Vercel**, atau **VPS**):
1. Buka dashboard layanan hosting Anda.
2. Masuk ke tab **Variables** / **Environment Variables**.
3. Tambahkan variabel yang sama dengan file `.env` Anda (seperti `DATABASE_URL`, `ADMIN_REFERRAL_CODE`, `PORT`).
4. Server hosting akan otomatis menyuntikkan variabel tersebut ke `process.env` saat aplikasi berjalan.

---

## 📄 Lisensi
Hak Cipta © 2026 Ngalam Fix Pro. Seluruh hak cipta dilindungi undang-undang.
