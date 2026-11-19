import QRCode from 'qrcode';
import JSZip from 'jszip';

export function escapeXml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface CardMitraData {
  index?: number;
  referralCode: string;
  id: string;
  name?: string;
  phone?: string;
}

export interface CardMemberData {
  index?: number;
  id: string;
  name: string;
  whatsapp?: string;
  phone?: string;
  district?: string;
  status?: string;
  code?: string;
  memberCode?: string;
  isRegistered?: boolean;
}

/**
 * Generate in-memory SVG string untuk Kartu QR Code Mitra
 */
export async function generateMitraSvg(mitra: CardMitraData): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
  const url = `${origin}/pesan-servis?ref=${encodeURIComponent(mitra.referralCode)}`;
  const width = 720;
  const height = 1000;
  const numStr = mitra.index 
    ? String(mitra.index).padStart(3, '0') 
    : String(mitra.referralCode || '').replace(/\D/g, '').padStart(3, '0') || '001';

  const cleanName = mitra.name && mitra.name !== '-' ? mitra.name : '';
  const cleanPhone = mitra.phone && mitra.phone !== '-' ? mitra.phone : '';

  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  const vbMatch = qrSvg.match(/viewBox=["']([^"']+)["']/i);
  const qrViewBox = vbMatch ? vbMatch[1] : '0 0 33 33';
  const qrInnerContent = qrSvg
    .replace(/<\?xml.*?\?>/i, '')
    .replace(/<!DOCTYPE.*?>/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="mGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#d97706" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#fbbf24" />
        </linearGradient>
        <filter id="mShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.12" />
        </filter>
      </defs>

      <style>
        .m-black { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 900; }
        .m-bold { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 700; }
        .m-med { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500; }
        .m-mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: 900; }
      </style>

      <!-- Background Card -->
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="32" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#mShadow)" />

      <!-- Top Header Container -->
      <path d="M 14 46 A 32 32 0 0 1 46 14 L ${width - 46} 14 A 32 32 0 0 1 ${width - 14} 46 L ${width - 14} 175 L 14 175 Z" fill="url(#mHeaderGrad)" />
      
      <!-- Gold Separator Strip -->
      <rect x="14" y="171" width="${width - 28}" height="4" fill="url(#mGoldGrad)" />

      <!-- Brand Typography -->
      <text x="${width / 2}" y="78" text-anchor="middle" class="m-black" font-size="28" fill="#ffffff" letter-spacing="2.5">NGALAM FIX PRO</text>
      <text x="${width / 2}" y="108" text-anchor="middle" class="m-bold" font-size="12.5" fill="#fbbf24" letter-spacing="1.5">WORKSHOP &amp; LAB SPESIALIS SERVIS HP MALANG</text>

      <!-- Discount Ribbon -->
      <rect x="44" y="184" width="${width - 88}" height="48" rx="14" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="2" />
      <text x="${width / 2}" y="206" text-anchor="middle" class="m-black" font-size="15" fill="#065f46" letter-spacing="0.8">SCAN UNTUK DISKON SERVIS 5%</text>
      <text x="${width / 2}" y="222" text-anchor="middle" class="m-med" font-size="11.5" fill="#047857">Tunjukkan QR code ini ke kasir atau buka saat pesan servis online</text>

      <!-- PROMINENT HIGH-CONTRAST ID QR BOX - TEPAT DI ATAS QR CODE -->
      <rect x="60" y="242" width="${width - 120}" height="54" rx="14" fill="#0f172a" stroke="#d97706" stroke-width="3" />
      <rect x="80" y="233" width="140" height="18" rx="5" fill="#d97706" />
      <text x="150" y="246" text-anchor="middle" class="m-black" font-size="10.5" fill="#ffffff" letter-spacing="1">IDENTITAS RESMI</text>
      <text x="${width / 2}" y="276" text-anchor="middle" class="m-mono" font-size="22" fill="#ffffff" letter-spacing="2">
        ID QR: <tspan fill="#fbbf24">${escapeXml(mitra.referralCode)}</tspan> &#8226; <tspan font-size="16" fill="#cbd5e1">${escapeXml(mitra.id)}</tspan>
      </text>

      <!-- QR Code Outer Frame (Centering: Frame x=170..550, Center=360, y=306..686, Center=496) -->
      <rect x="${width / 2 - 190}" y="306" width="380" height="380" rx="28" fill="#ffffff" stroke="#0f172a" stroke-width="3.5" stroke-dasharray="10 6" />
      
      <!-- Embedded QR SVG Vector (Perfect 330x330 Box centered at x=195, y=331) -->
      <svg x="${width / 2 - 165}" y="331" width="330" height="330" viewBox="${qrViewBox}">
        ${qrInnerContent}
      </svg>

      <!-- Center Branded Shield over QR (Center exactly at cx=360, cy=496) -->
      <circle cx="${width / 2}" cy="496" r="28" fill="#ffffff" stroke="#d97706" stroke-width="3.5" />
      <circle cx="${width / 2}" cy="496" r="23" fill="#0f172a" />
      <text x="${width / 2}" y="502" text-anchor="middle" class="m-black" font-size="14" fill="#fbbf24">NFP</text>

      <!-- Referral Code Box -->
      <rect x="70" y="716" width="${width - 140}" height="84" rx="20" fill="#fffbeb" stroke="#fde68a" stroke-width="2.5" />
      <text x="${width / 2}" y="746" text-anchor="middle" class="m-bold" font-size="12" fill="#78350f" letter-spacing="1.5">KODE REFERRAL MITRA (PERMANEN):</text>
      <text x="${width / 2}" y="782" text-anchor="middle" class="m-mono" font-size="32" fill="#b45309" letter-spacing="3">${escapeXml(mitra.referralCode)}</text>

      <!-- Tutorial Cara Scan QR Code -->
      <rect x="56" y="806" width="${width - 112}" height="76" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
      
      <!-- Header Tutorial -->
      <text x="${width / 2}" y="826" text-anchor="middle" class="m-black" font-size="11" fill="#0f172a" letter-spacing="1">
        TUTORIAL CARA SCAN &amp; KLAIM DISKON:
      </text>

      <!-- Langkah 1 -->
      <circle cx="82" cy="848" r="9" fill="#0f172a" />
      <text x="82" y="852" text-anchor="middle" class="m-black" font-size="10" fill="#fbbf24">1</text>
      <text x="98" y="852" class="m-bold" font-size="11" fill="#1e293b">Buka Kamera HP / Google Lens</text>

      <!-- Panah Pemisah -->
      <text x="282" y="852" text-anchor="middle" class="m-black" font-size="12" fill="#94a3b8">&#10140;</text>

      <!-- Langkah 2 -->
      <circle cx="310" cy="848" r="9" fill="#0f172a" />
      <text x="310" y="852" text-anchor="middle" class="m-black" font-size="10" fill="#fbbf24">2</text>
      <text x="326" y="852" class="m-bold" font-size="11" fill="#1e293b">Arahkan ke QR Code</text>

      <!-- Panah Pemisah -->
      <text x="472" y="852" text-anchor="middle" class="m-black" font-size="12" fill="#94a3b8">&#10140;</text>

      <!-- Langkah 3 -->
      <circle cx="500" cy="848" r="9" fill="#0f172a" />
      <text x="500" y="852" text-anchor="middle" class="m-black" font-size="10" fill="#fbbf24">3</text>
      <text x="516" y="852" class="m-bold" font-size="11" fill="#047857">Klik Link &amp; Diskon 5% Aktif</text>

      <text x="${width / 2}" y="871" text-anchor="middle" class="m-med" font-size="10.5" fill="#64748b">
        Atau tunjukkan kartu ini langsung ke kasir workshop saat intake servis
      </text>

      <!-- Bottom Footer -->
      <line x1="44" y1="900" x2="${width - 44}" y2="900" stroke="#e2e8f0" stroke-width="1.5" />
      
      <text x="44" y="936" class="m-bold" font-size="11.5" fill="#0f172a">NGALAM FIX PRO</text>
      <text x="44" y="954" class="m-med" font-size="10.5" fill="#64748b">Garansi Resmi Lab Servis &#8226; Transparan Bisa Ditunggu</text>

      <text x="${width - 44}" y="942" text-anchor="end" class="m-bold" font-size="12" fill="#0f172a">Hotline WA: 0811-318-5858</text>
    </svg>
  `;
}

/**
 * Generate in-memory SVG string untuk Kartu QR Code Member / Pelanggan
 */
export async function generateMemberSvg(member: CardMemberData): Promise<string> {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ngalamfixpro.com';
  const phone = member.whatsapp || member.phone || '';
  const numStr = member.index 
    ? String(member.index).padStart(3, '0') 
    : String(member.id || '').replace(/\D/g, '').slice(-3).padStart(3, '0') || '001';
  const memberCode = member.code || member.memberCode || `MBR-${numStr}`;
  const url = `${origin}/lacak?search=${encodeURIComponent(phone || member.id || memberCode)}&member=${encodeURIComponent(member.id || memberCode)}`;
  const width = 720;
  const height = 1000;
  const cleanName = member.name && !member.name.toLowerCase().includes('belum') && member.name !== '-' ? member.name : '';

  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });

  const vbMatch = qrSvg.match(/viewBox=["']([^"']+)["']/i);
  const qrViewBox = vbMatch ? vbMatch[1] : '0 0 33 33';
  const qrInnerContent = qrSvg
    .replace(/<\?xml.*?\?>/i, '')
    .replace(/<!DOCTYPE.*?>/i, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .trim();

  return `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="mbrHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="50%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="mbrGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="50%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
        <filter id="mbrShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.12" />
        </filter>
      </defs>

      <style>
        .mbr-black { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 900; }
        .mbr-bold { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 700; }
        .mbr-med { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 500; }
        .mbr-mono { font-family: 'Consolas', 'Courier New', monospace; font-weight: 900; }
      </style>

      <!-- Background Card -->
      <rect x="14" y="14" width="${width - 28}" height="${height - 28}" rx="32" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#mbrShadow)" />

      <!-- Top Header Container -->
      <path d="M 14 46 A 32 32 0 0 1 46 14 L ${width - 46} 14 A 32 32 0 0 1 ${width - 14} 46 L ${width - 14} 175 L 14 175 Z" fill="url(#mbrHeaderGrad)" />
      
      <!-- Gold Separator Strip -->
      <rect x="14" y="171" width="${width - 28}" height="4" fill="url(#mbrGoldGrad)" />

      <!-- Brand Typography -->
      <text x="${width / 2}" y="62" text-anchor="middle" class="mbr-black" font-size="28" fill="#ffffff" letter-spacing="2.5">NGALAM FIX PRO</text>
      <text x="${width / 2}" y="88" text-anchor="middle" class="mbr-bold" font-size="12" fill="#fbbf24" letter-spacing="1.5">KARTU MEMBER PRIORITAS LAB &amp; SERVIS</text>
      
      <!-- Prominent Member Badge -->
      <rect x="${width / 2 - 150}" y="108" width="300" height="42" rx="21" fill="url(#mbrGoldGrad)" />
      <text x="${width / 2}" y="135" text-anchor="middle" class="mbr-black" font-size="16" fill="#0f172a" letter-spacing="1.5">MEMBER PRIORITAS #${escapeXml(numStr)}</text>

      <!-- Benefit Ribbon -->
      <rect x="44" y="184" width="${width - 88}" height="48" rx="14" fill="#eff6ff" stroke="#bfdbfe" stroke-width="2" />
      <text x="${width / 2}" y="206" text-anchor="middle" class="mbr-black" font-size="15" fill="#1e3a8a" letter-spacing="0.8">PRIVILEGE MEMBER: DISKON SERVIS 5%</text>
      <text x="${width / 2}" y="222" text-anchor="middle" class="mbr-med" font-size="11.5" fill="#2563eb">Tunjukkan kartu ini saat pembayaran di kasir atau klaim garansi online</text>

      <!-- PROMINENT HIGH-CONTRAST ID QR BOX - TEPAT DI ATAS QR CODE (TERBACA JELAS SAAT DIPRINT) -->
      <rect x="60" y="242" width="${width - 120}" height="54" rx="14" fill="#000000" stroke="#f59e0b" stroke-width="3" />
      <rect x="80" y="233" width="160" height="18" rx="5" fill="#f59e0b" />
      <text x="160" y="246" text-anchor="middle" class="mbr-black" font-size="10.5" fill="#000000" letter-spacing="1">IDENTITAS RESMI MEMBER</text>
      <text x="${width / 2}" y="276" text-anchor="middle" class="mbr-mono" font-size="22" fill="#ffffff" letter-spacing="2">
        ID QR: <tspan fill="#fbbf24">${escapeXml(memberCode)}</tspan> &#8226; <tspan font-size="16" fill="#cbd5e1">${escapeXml(member.id)}</tspan>
      </text>

      <!-- QR Code Outer Frame (Centering: Frame x=170..550, Center=360, y=306..686, Center=496) -->
      <rect x="${width / 2 - 190}" y="306" width="380" height="380" rx="28" fill="#ffffff" stroke="#000000" stroke-width="3.5" stroke-dasharray="10 6" />
      
      <!-- Embedded QR SVG Vector (Perfect 330x330 Box centered at x=195, y=331) -->
      <svg x="${width / 2 - 165}" y="331" width="330" height="330" viewBox="${qrViewBox}">
        ${qrInnerContent}
      </svg>

      <!-- Center Branded Shield over QR (Center exactly at cx=360, cy=496) -->
      <circle cx="${width / 2}" cy="496" r="28" fill="#ffffff" stroke="#f59e0b" stroke-width="3.5" />
      <circle cx="${width / 2}" cy="496" r="23" fill="#000000" />
      <text x="${width / 2}" y="502" text-anchor="middle" class="mbr-black" font-size="14" fill="#fbbf24">NFP</text>

      <!-- Member Profile Box -->
      <rect x="70" y="696" width="${width - 140}" height="70" rx="18" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      <text x="95" y="722" class="mbr-bold" font-size="12" fill="#64748b">NAMA MEMBER :</text>
      <text x="210" y="722" class="mbr-black" font-size="15" fill="#0f172a">${cleanName ? escapeXml(cleanName) : '_______________________________________'}</text>
      <text x="95" y="748" class="mbr-bold" font-size="12" fill="#64748b">NO. WHATSAPP :</text>
      <text x="210" y="748" class="mbr-mono" font-size="14" fill="#047857">${phone ? escapeXml(phone) : '_______________________'}</text>
      <text x="${width - 95}" y="736" text-anchor="end" class="mbr-bold" font-size="11" fill="#475569">${escapeXml(member.district || 'Kota Malang')}</text>

      <!-- System ID Box -->
      <rect x="70" y="776" width="${width - 140}" height="56" rx="16" fill="#fffbeb" stroke="#fde68a" stroke-width="1.5" />
      <text x="${width / 2}" y="800" text-anchor="middle" class="mbr-bold" font-size="11" fill="#78350f" letter-spacing="1">KODE QR MEMBER RESMI:</text>
      <text x="${width / 2}" y="822" text-anchor="middle" class="mbr-mono" font-size="18" fill="#b45309" letter-spacing="2">${escapeXml(memberCode)}</text>

      <!-- How to Scan -->
      <text x="${width / 2}" y="856" text-anchor="middle" class="mbr-med" font-size="11.5" fill="#475569">
        Arahkan kamera HP ke QR Code untuk cek riwayat servis &amp; klaim garansi otomatis
      </text>
      <text x="${width / 2}" y="876" text-anchor="middle" class="mbr-mono" font-size="11" fill="#64748b">
        ${escapeXml(url)}
      </text>

      <!-- Bottom Footer -->
      <line x1="44" y1="900" x2="${width - 44}" y2="900" stroke="#e2e8f0" stroke-width="1.5" />
      
      <text x="44" y="928" class="mbr-bold" font-size="11" fill="#0f172a">NGALAM FIX PRO</text>
      <text x="44" y="946" class="mbr-med" font-size="10" fill="#64748b">Garansi Resmi Lab Servis &#8226; Transparan Bisa Ditunggu</text>

      <text x="${width - 44}" y="928" text-anchor="end" class="mbr-bold" font-size="11" fill="#0f172a">Hotline WA: 0811-318-5858</text>
      <text x="${width - 44}" y="946" text-anchor="end" class="mbr-bold" font-size="10.5" fill="#b45309">MEMBER RESMI #${escapeXml(numStr)}</text>
    </svg>
  `;
}

/**
 * Konversi SVG string ke PNG Blob di browser canvas secara in-memory (tanpa menyimpan file di disk/projek)
 */
export function svgToPngBlob(svgString: string, width = 720, height = 1000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not defined'));
    }

    const img = new Image();
    const cleanSvg = svgString.includes('<?xml') 
      ? svgString.trim() 
      : '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString.trim();
    
    // Gunakan data URI utf-8 agar 100% aman dan tidak bergantung pada ObjectURL browser quirks
    const encodedUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvg);

    const timer = setTimeout(() => {
      reject(new Error('Timeout render canvas SVG'));
    }, 5000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context not available'));
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Gagal menghasilkan PNG blob'));
          }
        }, 'image/png', 0.95);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      clearTimeout(timer);
      reject(new Error('Gagal memuat gambar SVG ke canvas'));
    };

    img.src = encodedUri;
  });
}

/**
 * Trigger download file blob di browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Download single QR card secara in-memory
 */
export async function downloadSingleMitraCard(mitra: CardMitraData) {
  const svg = await generateMitraSvg(mitra);
  const blob = await svgToPngBlob(svg);
  downloadBlob(blob, `QR_MITRA_${mitra.referralCode}.png`);
}

export async function downloadSingleMemberCard(member: CardMemberData) {
  const svg = await generateMemberSvg(member);
  const blob = await svgToPngBlob(svg);
  const numStr = member.index ? String(member.index).padStart(3, '0') : '001';
  const code = member.code || member.memberCode || `MBR-${numStr}`;
  const safeName = (member.name && !member.name.toLowerCase().includes('belum') ? member.name : 'Member')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadBlob(blob, `QR_${code}_${safeName}.png`);
}

/**
 * Download Bulk ZIP secara in-memory menggunakan JSZip di browser
 * (100% diproses di memory browser, 0 file disimpan di disk lokal proyek!)
 */
export async function downloadBulkMitraZip(
  mitras: CardMitraData[],
  zipFilename = '100_QR_Code_Mitra_NgalamFixPro.zip',
  onProgress?: (current: number, total: number) => void
) {
  const zip = new JSZip();
  const folder = zip.folder('QR_Mitra_NgalamFixPro') || zip;

  for (let i = 0; i < mitras.length; i++) {
    const m = mitras[i];
    const numStr = m.index 
      ? String(m.index).padStart(3, '0') 
      : String(m.referralCode || '').replace(/\D/g, '').padStart(3, '0') || String(i + 1).padStart(3, '0');
    try {
      const svg = await generateMitraSvg(m);
      const blob = await svgToPngBlob(svg);
      folder.file(`${m.referralCode || `MITRA-${numStr}`}.png`, blob);
    } catch (e) {
      // Fallback: Jika canvas browser lambat/timeout, simpan vector SVG
      const svg = await generateMitraSvg(m);
      folder.file(`${m.referralCode || `MITRA-${numStr}`}.svg`, svg);
    }
    if (onProgress) onProgress(i + 1, mitras.length);
  }

  const manifest = mitras.map((m, idx) => {
    const numStr = m.index ? String(m.index).padStart(3, '0') : String(idx + 1).padStart(3, '0');
    return `${numStr}. ${m.referralCode} | Pemilik: ${m.name || '(Belum Terisi)'} | WA: ${m.phone || '-'} | ID: ${m.id}`;
  }).join('\n');

  const readme = `========================================================================\n` +
    `NGALAM FIX PRO - KOLEKSI STIKER QR CODE REFERRAL MITRA REKANAN\n` +
    `========================================================================\n` +
    `Total QR Stiker  : ${mitras.length} File PNG Desain Lengkap Siap Cetak\n` +
    `Resolusi         : 720 x 1000 Pixel (High Resolution Siap Cetak Stiker A4 / Meja Kasir)\n` +
    `Komisi Mitra     : 5% Tunai per transaksi servis berhasil\n` +
    `Diskon Pelanggan : 5% Potongan Otomatis saat scan QR\n\n` +
    `PETUNJUK PENGGUNAAN:\n` +
    `1. Cetak gambar kartu QR pada kertas stiker / label untuk ditempel pada motor driver atau meja toko.\n` +
    `2. Bagikan QR ini ke mitra driver atau toko rekanan.\n` +
    `3. Tulis nama pemilik pada kartu atau perbarui namanya di Admin Dashboard menu Mitra & Komisi Driver.\n\n` +
    `DAFTAR KODE MITRA:\n` + manifest;

  folder.file('README_DAFTAR_MITRA.txt', readme);

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE'
  });
  downloadBlob(content, zipFilename);
}

export async function downloadBulkMemberZip(
  members: CardMemberData[],
  zipFilename = '100_QR_Code_Member_NgalamFixPro.zip',
  onProgress?: (current: number, total: number) => void
) {
  const zip = new JSZip();
  const folder = zip.folder('QR_Member_NgalamFixPro') || zip;

  for (let i = 0; i < members.length; i++) {
    const m = members[i];
    const numStr = m.index 
      ? String(m.index).padStart(3, '0') 
      : String(i + 1).padStart(3, '0');
    const code = m.code || m.memberCode || `MBR-${numStr}`;
    const safeName = (m.name && !m.name.toLowerCase().includes('belum') ? m.name : 'SiapPakai')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      const svg = await generateMemberSvg(m);
      const blob = await svgToPngBlob(svg);
      folder.file(`QR_${code}_${safeName}.png`, blob);
    } catch (e) {
      // Fallback: Jika canvas browser lambat/timeout, simpan vector SVG
      const svg = await generateMemberSvg(m);
      folder.file(`QR_${code}_${safeName}.svg`, svg);
    }
    if (onProgress) onProgress(i + 1, members.length);
  }

  const manifest = members.map((m, idx) => {
    const numStr = m.index ? String(m.index).padStart(3, '0') : String(idx + 1).padStart(3, '0');
    const code = m.code || m.memberCode || `MBR-${numStr}`;
    return `${numStr}. Kode: ${code} | Nama: ${m.name || '(Belum Terisi)'} | WA: ${m.whatsapp || m.phone || '-'} | ID: ${m.id}`;
  }).join('\n');

  const readme = `========================================================================\n` +
    `NGALAM FIX PRO - KOLEKSI 100 KARTU QR CODE MEMBER PRIORITAS RESMI\n` +
    `========================================================================\n` +
    `Total Kartu    : ${members.length} File PNG High-Resolution Siap Cetak\n` +
    `Resolusi         : 720 x 1000 Pixel (Format Stiker / Kartu Member VIP)\n` +
    `Hak Member     : Diskon Servis 5% & Integrasi Garansi Otomatis\n\n` +
    `PETUNJUK PENGGUNAAN:\n` +
    `1. Cetak gambar kartu QR pada kertas tebal / stiker laminasi untuk kartu member pelanggan.\n` +
    `2. Bagikan kartu member ini ke pelanggan walk-in atau pembeli unit servis.\n` +
    `3. Pelanggan cukup scan QR Code untuk langsung melihat status servis dan garansi aktif tanpa repot ketik link.\n\n` +
    `DAFTAR KODE MEMBER:\n` + manifest;

  folder.file('README_DAFTAR_MEMBER.txt', readme);

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE'
  });
  downloadBlob(content, zipFilename);
}
