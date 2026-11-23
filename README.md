# Ngalam Fix Pro — Website & Sistem Servis HP

Platform manajemen servis HP, garansi digital, kemitraan (mitra/agen), komisi, dan tracking transaksi untuk Ngalam Fix Pro (Malang).

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express.js, Sequelize ORM (MySQL / PostgreSQL / SQLite), JWT Auth, ExcelJS & PDFKit untuk reporting/invoice, QR Code generation.
- **Frontend / Client**: React 18, Vite, Tailwind CSS (terletak di folder `client/`).
- **Deployment**: Mendukung cPanel (Node.js Application Manager) & Vercel.

---

## 🚀 Quick Start

### 1. Instalasi & Konfigurasi

```bash
# Install dependency server
npm install

# Install dependency client
npm --prefix client install

# Setup environment
cp .env.example .env # Sesuaikan database & secret key JWT
```

### 2. Database Sync & Migrations

```bash
# Sinkronisasi model database
npm run db:sync

# Atau menggunakan Sequelize CLI
npm run db:migrate
npm run db:seed
```

### 3. Menjalankan Aplikasi

```bash
# Mode development server (Node.js)
npm run dev:server

# Mode development client (Vite)
npm run dev:client
```

---

## 📱 Fitur Utama

- **Digital Warranty System**: Cek status garansi servis menggunakan kode unik / nomor HP, klaim garansi online, dan QR code garansi.
- **Mitra & Commission Engine**: Pendaftaran agen/mitra perbaikan, komisi referral otomatis, penarikan saldo komisi, dan dashboard mitra.
- **Order & Service Tracking**: Alur status servis transparan (Diterima -> Pengecekan -> Pengerjaan -> Selesai/Diambil).
- **Finances & Reporting**: Ekspor rekapan transaksi servis dan keuangan ke format Excel (.xlsx) dan invoice PDF.
- **Customer Database & Chatbot Integration**: Log riwayat perbaikan pelanggan dan endpoint otomatisasi chatbot.

---

## 📦 Deployment cPanel

Panduan lengkap deployment ke hosting cPanel tersedia di [`CPANEL_DEPLOY_GUIDE.md`](./CPANEL_DEPLOY_GUIDE.md).

