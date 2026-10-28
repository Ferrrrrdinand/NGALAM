# Ngalam Fix Pro 🔧🚀

> Platform Layanan Servis Gadget, Laptop & Elektronik On-Demand di Malang Raya terintegrasi dengan Google Sheets & WhatsApp Auto-Gateway.

---

## 📋 Fitur Utama

- **Pemesanan Servis Online**: Form interaktif dengan deteksi lokasi, pilihan jenis penjemputan (Kurir Mitra / Antar Sendiri / Servis di Tempat).
- **Lacak Servis Real-Time**: Tracking status pengerjaan tiket servis menggunakan ID Tiket, nomor WhatsApp, atau email pelanggan.
- **Portal Teknisi**: Dashboard lab workshop untuk update progres perbaikan, upload foto bukti pengerjaan, dan diagnosis hardware/software.
- **Portal Mitra Ojol**: Sistem referral dan komisi kurir jemput-antar unit servis.
- **Dashboard Admin & Keuangan**: Manajemen tiket, invoice otomatis, catatan kas/pembukuan, dan kontrol kupon diskon.
- **Sinkronisasi Google Sheets & Apps Script**: Backup database dua arah langsung ke spreadsheet Google Cloud.

---

## 🛠️ Persyaratan Sistem

- **Node.js** (v18.0.0 atau lebih baru)
- **NPM** (v9.0.0 atau lebih baru)
- **Git**

---

## 🚀 Panduan Instalasi & Menjalankan

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/Ferrrrrdinand/test.git
   cd test
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Salin file template `.env.example` menjadi `.env`:
   ```bash
   copy .env.example .env
   ```
   Lalu sesuaikan variabel di dalam file `.env` (Port, URL Apps Script, Spreadsheet ID, dll).

4. **Konfigurasi Kredensial Google Cloud (Opsional)**:
   Salin `credentials.json.example` menjadi `credentials.json` jika menggunakan Google Sheets API service account.

5. **Jalankan Aplikasi**:
   ```bash
   # Menjalankan server aplikasi
   npm start
   ```
   Buka peramban di: `http://localhost:3000`

---

## 📁 Struktur Direktori

```text
Ngalam Fix Pro/
├── data/                  # Penyimpanan data lokal (JSON fallback & konfigurasi)
├── public/                # Antarmuka frontend (HTML, CSS, JS, Assets)
│   ├── admin/             # Panel admin & keuangan
│   ├── css/               # Stylesheet
│   ├── js/                # Script client-side & sensor device
│   ├── lacak/             # Halaman tracking tiket servis
│   ├── login/             # Autentikasi teknisi, mitra & admin
│   ├── mitra/             # Portal mitra kurir
│   ├── pesan-servis/      # Form booking order pelanggan
│   └── teknisi/           # Dashboard teknisi lab
├── routes/                # Endpoint API modular (Express Router)
├── scripts/               # Script utilitas & kode Google Apps Script
├── services/              # Logika bisnis (Auth, Sheets, Notifikasi)
├── server.js              # Server utama Express.js
├── .env.example           # Template environment variable
├── credentials.json.example # Template service account Google
└── package.json           # Dependensi project
```

---

## 📄 Lisensi
Hak Cipta © 2026 Ngalam Fix Pro. All Rights Reserved.
