/**
 * Script untuk membuat 100 Desain Kartu QR Code Resmi NGALAM FIX PRO
 * Lengkap dengan nomor urut mitra (MITRA RESMI #001 s/d #100), ID Sistem,
 * Logo NFP, Kode Referral, Diskon 5%, dan link booking aktif.
 */

const QRCode = require('qrcode');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const TARGET_DIR_CLIENT = path.join(__dirname, '..', 'client', 'public', 'qrcodes', 'mitra');
const TARGET_DIR_PUBLIC = path.join(__dirname, '..', 'public', 'qrcodes', 'mitra');

fs.mkdirSync(TARGET_DIR_CLIENT, { recursive: true });
fs.mkdirSync(TARGET_DIR_PUBLIC, { recursive: true });

function getCardSvg({ num, code, id }) {
  const url = `https://ngalam1-delta.vercel.app/pesan-servis?ref=${code}`;
  const width = 720;
  const height = 1000;
  const numStr = String(num).padStart(3, '0');

  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  }).then(qrSvg => {
    const cleanQrSvg = qrSvg.replace(/<\?xml.*?\?>/i, '').replace(/<!DOCTYPE.*?>/i, '');

    return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d97706" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#fbbf24" />
        </linearGradient>
        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#059669" />
          <stop offset="100%" stop-color="#10b981" />
        </linearGradient>
        <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.10" />
        </filter>
      </defs>

      <style>
        .font-black { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 900; }
        .font-bold { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 700; }
        .font-med { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500; }
        .font-mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: 900; }
      </style>

      <!-- Background Card -->
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="32" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#cardShadow)" />

      <!-- Top Header Container -->
      <path d="M 14 46 A 32 32 0 0 1 46 14 L ${width - 46} 14 A 32 32 0 0 1 ${width - 14} 46 L ${width - 14} 175 L 14 175 Z" fill="url(#headerGrad)" />
      
      <!-- Gold Separator Strip -->
      <rect x="14" y="171" width="${width - 28}" height="4" fill="url(#goldGrad)" />

      <!-- Brand Typography -->
      <text x="${width / 2}" y="62" text-anchor="middle" class="font-black" font-size="28" fill="#ffffff" letter-spacing="2.5">NGALAM FIX PRO</text>
      <text x="${width / 2}" y="88" text-anchor="middle" class="font-bold" font-size="12" fill="#fbbf24" letter-spacing="1.5">WORKSHOP &amp; LAB SPESIALIS SERVIS HP MALANG</text>
      
      <!-- Big Prominent Indicator: MITRA RESMI #XXX -->
      <rect x="${width / 2 - 140}" y="108" width="280" height="42" rx="21" fill="url(#goldGrad)" />
      <text x="${width / 2}" y="135" text-anchor="middle" class="font-black" font-size="16" fill="#0f172a" letter-spacing="1.5">MITRA RESMI #${numStr} DARI 100</text>

      <!-- Discount Ribbon -->
      <rect x="44" y="184" width="${width - 88}" height="48" rx="14" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="2" />
      <text x="${width / 2}" y="206" text-anchor="middle" class="font-black" font-size="15" fill="#065f46" letter-spacing="0.8">SCAN UNTUK DISKON SERVIS 5%</text>
      <text x="${width / 2}" y="222" text-anchor="middle" class="font-med" font-size="11.5" fill="#047857">Tunjukkan QR code ini ke kasir atau buka saat pesan servis online</text>

      <!-- PROMINENT HIGH-CONTRAST ID QR BOX (TEPAT DI ATAS KOTAK QR CODE - SANGAT JELAS SAAT DIPRINT) -->
      <rect x="60" y="242" width="${width - 120}" height="54" rx="14" fill="#0f172a" stroke="#d97706" stroke-width="3" />
      <rect x="80" y="233" width="140" height="18" rx="5" fill="#d97706" />
      <text x="150" y="246" text-anchor="middle" class="font-black" font-size="10.5" fill="#ffffff" letter-spacing="1">IDENTITAS RESMI</text>
      <text x="${width / 2}" y="276" text-anchor="middle" class="font-mono" font-size="22" fill="#ffffff" letter-spacing="2">
        ID QR: <tspan fill="#fbbf24">${code}</tspan> • <tspan font-size="16" fill="#cbd5e1">${id}</tspan>
      </text>

      <!-- QR Code Outer Frame -->
      <rect x="${width / 2 - 190}" y="306" width="380" height="380" rx="28" fill="#ffffff" stroke="#0f172a" stroke-width="3.5" stroke-dasharray="10 6" />
      
      <!-- Embedded QR SVG Vector -->
      <g transform="translate(${width / 2 - 165}, 331)">
        <svg width="330" height="330" viewBox="0 0 100 100">
          ${cleanQrSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
        </svg>
      </g>

      <!-- Center Branded Shield over QR -->
      <circle cx="${width / 2}" cy="496" r="28" fill="#ffffff" stroke="#d97706" stroke-width="3.5" />
      <circle cx="${width / 2}" cy="496" r="23" fill="#0f172a" />
      <text x="${width / 2}" y="502" text-anchor="middle" class="font-black" font-size="14" fill="#fbbf24">NFP</text>

      <!-- Referral Code Box -->
      <rect x="70" y="696" width="${width - 140}" height="70" rx="18" fill="#fffbeb" stroke="#fde68a" stroke-width="2.5" />
      <text x="${width / 2}" y="720" text-anchor="middle" class="font-bold" font-size="11" fill="#78350f" letter-spacing="1.5">KODE REFERRAL MITRA (PERMANEN):</text>
      <text x="${width / 2}" y="752" text-anchor="middle" class="font-mono" font-size="28" fill="#b45309" letter-spacing="3">${code}</text>

      <!-- Mitra Info Box (Siap diisi nama pemilik) -->
      <rect x="70" y="776" width="${width - 140}" height="56" rx="16" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="95" y="800" class="font-bold" font-size="11" fill="#64748b">PEMILIK / MITRA:</text>
      <text x="95" y="820" class="font-med" font-size="12" fill="#334155">_______________________________________</text>
      <text x="${width - 95}" y="808" text-anchor="end" class="font-mono" font-size="11" fill="#64748b">ID: ${id}</text>

      <!-- How to Scan -->
      <text x="${width / 2}" y="856" text-anchor="middle" class="font-med" font-size="11.5" fill="#475569">
        Arahkan kamera HP / Google Lens ke QR Code untuk reservasi otomatis
      </text>
      <text x="${width / 2}" y="876" text-anchor="middle" class="font-mono" font-size="11" fill="#64748b">
        https://ngalam1-delta.vercel.app/pesan-servis?ref=${code}
      </text>

      <!-- Bottom Footer -->
      <line x1="44" y1="900" x2="${width - 44}" y2="900" stroke="#e2e8f0" stroke-width="1.5" />
      
      <text x="44" y="928" class="font-bold" font-size="11" fill="#0f172a">NGALAM FIX PRO</text>
      <text x="44" y="946" class="font-med" font-size="10" fill="#64748b">Garansi Resmi Lab Servis • Transparan Bisa Ditunggu</text>

      <text x="${width - 44}" y="928" text-anchor="end" class="font-bold" font-size="11" fill="#0f172a">Hotline WA: 0811-318-5858</text>
      <text x="${width - 44}" y="946" text-anchor="end" class="font-bold" font-size="10.5" fill="#d97706">NOMOR MITRA #${numStr} DARI 100</text>
    </svg>
    `;
  });
}

async function generateAll() {
  console.log('Memulai pembuatan 100 kartu QR Code desain NGALAM FIX PRO...');
  const manifest = [];
  const zip = new JSZip();

  for (let i = 1; i <= 100; i++) {
    const numStr = String(i).padStart(3, '0');
    const code = `MITRA-${numStr}`;
    const id = `USR-MITRA-PRE-${numStr}`;
    const filename = `${code}.png`;

    const svg = await getCardSvg({ num: i, code, id });
    const pngBuffer = await sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer();

    // Simpan ke client/public dan root public
    fs.writeFileSync(path.join(TARGET_DIR_CLIENT, filename), pngBuffer);
    fs.writeFileSync(path.join(TARGET_DIR_PUBLIC, filename), pngBuffer);

    // Tambahkan ke file zip
    zip.file(filename, pngBuffer);

    manifest.push({
      index: i,
      id,
      referralCode: code,
      badge: `MITRA RESMI #${numStr}`,
      bookingUrl: `https://ngalam1-delta.vercel.app/pesan-servis?ref=${code}`,
      filename
    });

    if (i % 20 === 0 || i === 100) {
      console.log(`[${i}/100] Selesai: ${code} (Mitra #${numStr})`);
    }
  }

  // Tulis README ke dalam file ZIP
  const readme = `========================================================================\n` +
    `NGALAM FIX PRO - KOLEKSI 100 STIKER QR CODE REFERRAL MITRA REKANAN\n` +
    `========================================================================\n` +
    `Tanggal Generate : ${new Date().toLocaleString('id-ID')}\n` +
    `Total QR Stiker  : 100 File PNG Berdesain Lengkap (MITRA-001 s/d MITRA-100)\n` +
    `Resolusi         : 720 x 1000 Pixel (High Resolution Siap Cetak Stiker A4)\n` +
    `Komisi Mitra     : 5% Tunai per transaksi servis berhasil\n` +
    `Diskon Pelanggan : 5% Potongan Otomatis saat scan QR\n\n` +
    `PETUNJUK PENGGUNAAN:\n` +
    `1. Cetak gambar kartu QR pada kertas stiker / label untuk ditempel pada motor driver atau meja toko.\n` +
    `2. Bagikan QR ini ke mitra driver atau toko rekanan.\n` +
    `3. Tulis nama mitra pada kolom "PEMILIK / MITRA" atau input namanya melalui menu Mitra & Komisi Driver di admin dashboard.\n` +
    `4. Kode Referral dan ID Mitra terkunci permanen sehingga stiker tidak akan pernah kedaluwarsa.\n\n` +
    `DAFTAR 100 KODE REFERRAL & LINK PEMESANAN:\n` +
    manifest.map(m => `${String(m.index).padStart(3, '0')}. ${m.badge} | ID: ${m.id} | Ref: ${m.referralCode} -> ${m.bookingUrl}`).join('\n');

  zip.file('README_DAFTAR_100_MITRA.txt', readme);

  console.log('Mengompres 100 file ke arsip ZIP...');
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  const zipFilename = '100_QR_Code_Mitra_NgalamFixPro.zip';
  fs.writeFileSync(path.join(TARGET_DIR_CLIENT, zipFilename), zipBuffer);
  fs.writeFileSync(path.join(TARGET_DIR_PUBLIC, zipFilename), zipBuffer);

  const manifestJson = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(path.join(TARGET_DIR_CLIENT, 'manifest.json'), manifestJson);
  fs.writeFileSync(path.join(TARGET_DIR_PUBLIC, 'manifest.json'), manifestJson);

  console.log(`✅ Sukses! Seluruh 100 kartu QR Code desain NGALAM FIX PRO selesai dibuat.`);
  console.log(`Ukuran file ZIP: ${(zipBuffer.length / 1024).toFixed(1)} KB`);
}

generateAll().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

