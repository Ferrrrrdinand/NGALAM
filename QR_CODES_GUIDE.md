# 📱 GUIDE: 100 QR Codes Mitra - Ngalam Fix Pro

## 🎯 UNTUK CLIENT/ADMIN

### Download QR Codes untuk Print:

**Pilihan 1: PDF Print Sheet (Recommended)**
- File: `public/qr-codes/qr-codes-print-sheet.pdf`
- Format: 5 kolom x 4 baris per halaman (20 QR per halaman, total 5 halaman)
- Ukuran: 664 KB
- Langsung print → potong → bagikan ke mitra

**Pilihan 2: ZIP Batch Download**
- File: `public/qr-codes/qr-codes-batch.zip`
- Isi: 100 PNG files (MITRA-001.png s/d MITRA-100.png)
- Ukuran: 115 KB
- Extract → pilih yang mau di-print

**Pilihan 3: Individual PNG**
- Folder: `public/qr-codes/`
- Format: PNG 400x400px
- File: MITRA-001.png, MITRA-002.png, ... MITRA-100.png

---

## 📋 CARA BAGIKAN QR KE MITRA

### Step 1: Print QR Codes
```bash
# Download PDF
curl http://localhost:3000/api/auth/admin/qr-pdf-download -o print-qr.pdf

# Atau akses langsung di server
cd public/qr-codes/
ls qr-codes-print-sheet.pdf
```

### Step 2: Potong & Beri Label
- Setiap QR sudah ada label `MITRA-XXX` di bawahnya
- Print di kertas sticker atau kartu
- Potong per QR code

### Step 3: Bagikan ke Mitra
**Cara 1: Fisik**
- Berikan kartu QR ke mitra
- Mitra promosikan ke pelanggan mereka

**Cara 2: Digital**
- Kirim PNG file via WhatsApp
- Mitra save & share ke story/status

---

## 🔗 URL QR CODE

Setiap QR berisi:
```
https://ngalamfixpro.com/?ref=MITRA-XXX
```

Contoh:
- MITRA-001 → `https://ngalamfixpro.com/?ref=MITRA-001`
- MITRA-050 → `https://ngalamfixpro.com/?ref=MITRA-050`
- MITRA-100 → `https://ngalamfixpro.com/?ref=MITRA-100`

---

## 💡 CARA KERJA SISTEM

### Untuk Pelanggan (Yang Scan QR):
1. ✅ Scan QR → Otomatis masuk website dengan ref code
2. ✅ Modal popup → Isi nama + nomor telpon
3. ✅ Login dengan Google → Akun tersimpan
4. ✅ Booking servis → Mitra dapat komisi otomatis

### Untuk Mitra (Yang Dapat QR):
1. ✅ Terima kartu QR dari admin
2. ✅ Promosikan ke teman/pelanggan (share QR)
3. ✅ (Opsional) Aktivasi akun mitra:
   - Buka website → Daftar Sebagai Mitra
   - Login Google
   - Auto-claim code yang di QR card
4. ✅ Tracking komisi di dashboard `/mitra`

---

## 🎨 CUSTOMIZE QR (Optional)

Kalau mau regenerate dengan URL berbeda:

```bash
# Edit scripts/generate-qr-batch.js
# Ubah baris:
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

# Jadi:
const BASE_URL = 'https://ngalamfixpro.com';

# Lalu run ulang:
node scripts/generate-qr-batch.js
```

---

## 📊 MONITORING MITRA

### Check Mitra yang Sudah Claimed:
```bash
curl http://localhost:3000/api/auth/admin/pre-created-mitra | jq '.data[] | select(.claimed == true)'
```

### Check Mitra yang Belum Claimed:
```bash
curl http://localhost:3000/api/auth/admin/pre-created-mitra | jq '.data[] | select(.claimed == false)'
```

### Via Database:
```sql
-- Mitra yang sudah aktivasi
SELECT referral_code, name, email, claimed_at 
FROM users 
WHERE is_pre_created = false AND role = 'mitra'
ORDER BY claimed_at DESC;

-- Mitra yang belum aktivasi
SELECT referral_code, status 
FROM users 
WHERE is_pre_created = true 
ORDER BY referral_code;
```

---

## 🚀 QUICK START

1. **Print QR codes:**
   ```bash
   open public/qr-codes/qr-codes-print-sheet.pdf
   ```

2. **Bagikan ke 100 mitra** (potong & beri ke mitra)

3. **Tracking:** Admin bisa pantau di:
   - Database: `users` table
   - API: `GET /api/auth/admin/pre-created-mitra`

4. **Pelanggan scan QR** → otomatis tercatat dengan `referred_by_mitra`

5. **Komisi otomatis** dihitung dari order yang pakai ref code

---

## ⚠️ PENTING!

1. **Referral code FIXED** - Tidak bisa diubah setelah print
2. **FCFS** - Siapa duluan login Google sebagai mitra, dia dapat slot pertama
3. **1 QR = 1 Mitra** - Jangan kasih 1 QR ke banyak orang
4. **Backup PDF** - Simpan file PDF untuk reprint kalau hilang

---

**Generated:** 2026-11-08 12:08 WIB
**Total QR Codes:** 100 (MITRA-001 to MITRA-100)
**Status:** ✅ Ready to Print & Distribute
