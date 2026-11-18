/**
 * NGALAM FIX PRO - QR Asset Service
 * Menyimpan dan mengelola aset QR Code langsung ke tabel `qr_assets` di PostgreSQL.
 * Menggantikan penyimpanan file fisik/lokal agar server tetap ringan, stateless, dan cepat.
 */

const db = require('./db');
const QRCode = require('qrcode');

/**
 * Simpan atau dapatkan aset QR code dari database PostgreSQL
 */
async function getOrSaveQrAsset({ type, code, targetUrl, name = '', metadata = {} }) {
  if (!code || !targetUrl) throw new Error('Code dan targetUrl wajib diisi');

  const assetId = `QR-${String(type || 'general').toUpperCase()}-${String(code).toUpperCase()}`;

  // Coba cari dari PostgreSQL jika terhubung
  try {
    const existing = await db.query(
      'SELECT id, type, code, target_url, svg_content, data_url, metadata, updated_at FROM qr_assets WHERE id = $1',
      [assetId]
    );
    if (existing.rows && existing.rows[0]) {
      return existing.rows[0];
    }
  } catch (_) {}

  // Generate SVG & Data URL di memory
  const svgContent = await QRCode.toString(targetUrl, {
    type: 'svg',
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });

  const dataUrl = await QRCode.toDataURL(targetUrl, {
    width: 500,
    margin: 1.5,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H'
  });

  const row = {
    id: assetId,
    type: String(type || 'general').toLowerCase(),
    code: String(code).toUpperCase(),
    target_url: targetUrl,
    svg_content: svgContent,
    data_url: dataUrl,
    metadata: { ...metadata, name, generatedAt: new Date().toISOString() }
  };

  try {
    await db.query(
      `INSERT INTO qr_assets (id, type, code, target_url, svg_content, data_url, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         target_url = EXCLUDED.target_url,
         svg_content = EXCLUDED.svg_content,
         data_url = EXCLUDED.data_url,
         metadata = EXCLUDED.metadata,
         updated_at = CURRENT_TIMESTAMP`,
      [row.id, row.type, row.code, row.target_url, row.svg_content, row.data_url, JSON.stringify(row.metadata)]
    );
  } catch (err) {
    console.warn('[QR Asset DB Upsert Warning]', err.message);
  }

  return row;
}

/**
 * Bulk save array aset QR ke database PostgreSQL
 */
async function bulkSaveQrAssets(items) {
  if (!Array.isArray(items) || items.length === 0) return 0;
  let savedCount = 0;
  for (const item of items) {
    try {
      await getOrSaveQrAsset(item);
      savedCount++;
    } catch (_) {}
  }
  return savedCount;
}

module.exports = {
  getOrSaveQrAsset,
  bulkSaveQrAssets
};
