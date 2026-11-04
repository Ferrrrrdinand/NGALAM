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
   - Mendukung PostgreSQL cloud (Supabase, Railway, Aiven, atau VPS lokal). Seluruh akun admin, kasir, teknisi, dan mitra disimpan di tabel `users`.
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
# Port Server Lokal
PORT=3000

# Koneksi PostgreSQL/Supabase (gunakan Transaction Pooler port 6543 untuk Vercel)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
PG_SSL=true

# JWT Production
JWT_SECRET=<isi-dengan-secret-panjang-acak>

# Google OAuth
APP_URL=https://domain-anda.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://domain-anda.com/api/customer/auth/google/callback
GOOGLE_REDIRECT_URI_MITRA=https://domain-anda.com/api/mitra/auth/google/callback
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
3. Import file `.env` atau tambahkan variabel yang sama (`DATABASE_URL`, `PG_SSL`, `JWT_SECRET`, kredensial Google OAuth).
4. Server hosting akan otomatis menyuntikkan variabel tersebut ke `process.env` saat aplikasi berjalan.

---

## 📄 Lisensi
Hak Cipta © 2026 Ngalam Fix Pro. Seluruh hak cipta dilindungi undang-undang.
