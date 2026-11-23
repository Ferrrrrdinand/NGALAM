# Panduan Upload & Setup cPanel Rumahweb

## 1. Import Database ke phpMyAdmin
1. Buka phpMyAdmin cPanel:
   - URL: `https://kapuas.iixcp.rumahweb.net:2083/cpsess0994606124/3rdparty/phpMyAdmin/index.php?route=/&lang=en`
2. Pilih database `ngad2562_root` di menu sebelah kiri.
3. Klik tab **Import** (atau **Impor**) di bagian atas.
4. Klik **Choose File** / Telusuri file, lalu pilih file:
   `scripts/ngalamfixpro_mysql_full_import.sql` (atau dari dalam zip `ngalamfixpro_mysql_full_import.sql`).
5. Klik **Import** / **Go** di bagian bawah.
   *(Semua 16 tabel beserta seluruh data dari Supabase termasuk 102 user/mitra, iklan promo, voucher, dan banner akan terimpor secara otomatis)*.

---

## 2. Upload File Project ke cPanel File Manager
1. Buka cPanel File Manager.
2. Masuk ke direktori aplikasi Node.js Anda (misal `public_html` atau direktori folder aplikasi Node.js seperti `app` / `nodeapp`).
3. Upload file:
   `cpanel_deploy_package.zip` (ukuran ~15 MB).
4. Klik kanan file `cpanel_deploy_package.zip` -> **Extract**.
5. Ubah nama (Rename) file `.env.deploy` menjadi `.env`.

---

## 3. Konfigurasi "Setup Node.js App" di cPanel
1. Masuk ke menu **Setup Node.js App** di cPanel.
2. Klik **Create Application**:
   - **Node.js version**: Pilih versi **18.x** atau **20.x** (atau yang terbaru).
   - **Application mode**: `Production`
   - **Application root**: Sesuaikan dengan folder tempat extract zip (misal `public_html` atau nama foldernya).
   - **Application startup file**: `server.js`
3. Klik **Create**.
4. Setelah aplikasi terbuat, klik tombol **Run NPM Install** di halaman tersebut.
5. Klik **Restart** aplikasi.
6. Website siap digunakan!

