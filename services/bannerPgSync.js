/**
 * NGALAM FIX PRO - Automatic PostgreSQL Banner Synchronization Service
 * Menghubungkan manajemen banner promo (admin & frontend) ke tabel PostgreSQL `banners`.
 * Saat admin mengganti foto banner di website, sistem otomatis mengeksekusi:
 * UPDATE banners SET image_url = ..., updated_at = CURRENT_TIMESTAMP WHERE id = ...
 */

const fs = require('fs');
const path = require('path');
const postgresService = require('./postgresService');
const db = require('./db');

const PROMOS_FILE = path.join(__dirname, '..', 'data', 'promos.json');

/**
 * Helper to get active query executor (postgresService or db pool)
 */
function getQueryExecutor() {
  if (postgresService && typeof postgresService.isPostgresReady === 'function' && postgresService.isPostgresReady()) {
    return postgresService.query;
  }
  if (db && typeof db.isDbConnected === 'function' && db.isDbConnected()) {
    return db.query;
  }
  // Try postgresService.query anyway if connection string exists
  if (process.env.DATABASE_URL || process.env.PGDATABASE) {
    return postgresService.query;
  }
  return null;
}

/**
 * Check if PostgreSQL connection is currently available
 */
function isConnected() {
  if (postgresService && typeof postgresService.isPostgresReady === 'function' && postgresService.isPostgresReady()) {
    return true;
  }
  if (db && typeof db.isDbConnected === 'function' && db.isDbConnected()) {
    return true;
  }
  return false;
}

/**
 * Get current promo item by ID from promos.json as backup data
 */
function getPromoById(id) {
  try {
    if (fs.existsSync(PROMOS_FILE)) {
      const list = JSON.parse(fs.readFileSync(PROMOS_FILE, 'utf-8'));
      if (Array.isArray(list)) {
        return list.find((p) => p.id === id) || null;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Synchronize banner updates (specifically photo/image_url) to PostgreSQL `banners` table
 * @param {string} id - Banner Promo ID (e.g., 'PROMO-001')
 * @param {object} updates - Fields to update (image/imageUrl, title, description, active, etc.)
 */
async function syncBannerToPostgres(id, updates = {}) {
  const execQuery = getQueryExecutor();
  if (!execQuery) {
    // Mode fallback: Database offline, log status and gracefully proceed
    return { synced: false, reason: 'database_not_connected' };
  }

  try {
    const sets = [];
    const vals = [];
    let i = 1;

    // Detect image URL from possible property keys
    const imageUrl = updates.image || updates.imageUrl || updates.image_url;
    if (imageUrl) {
      sets.push(`image_url = $${i++}`);
      vals.push(imageUrl);
    }

    if (updates.title) {
      sets.push(`title = $${i++}`);
      vals.push(updates.title);
    }

    if (updates.description !== undefined) {
      sets.push(`description = $${i++}`);
      vals.push(updates.description);
    }

    if (updates.badgeTag || updates.badge_tag) {
      sets.push(`badge_tag = $${i++}`);
      vals.push(updates.badgeTag || updates.badge_tag);
    }

    if (updates.badgePill || updates.badge_pill) {
      sets.push(`badge_pill = $${i++}`);
      vals.push(updates.badgePill || updates.badge_pill);
    }

    if (updates.promoCode || updates.promo_code) {
      sets.push(`promo_code = $${i++}`);
      vals.push(updates.promoCode || updates.promo_code);
    }

    if (updates.buttonText || updates.button_text) {
      sets.push(`button_text = $${i++}`);
      vals.push(updates.buttonText || updates.button_text);
    }

    if (updates.buttonLink || updates.button_link) {
      sets.push(`button_link = $${i++}`);
      vals.push(updates.buttonLink || updates.button_link);
    }

    if (updates.active !== undefined) {
      sets.push(`active = $${i++}`);
      vals.push(Boolean(updates.active));
    }

    if (sets.length === 0) {
      return { synced: false, reason: 'no_fields_to_update' };
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');
    vals.push(id);

    const updateSql = `UPDATE banners SET ${sets.join(', ')} WHERE id = $${i}`;
    const result = await execQuery(updateSql, vals);

    // If row wasn't present in PostgreSQL table yet, insert it automatically (upsert resilience)
    if (result && result.rowCount === 0) {
      const fullBanner = getPromoById(id) || updates;
      await execQuery(
        `INSERT INTO banners (id, title, description, image_url, badge_tag, badge_pill, promo_code, button_text, button_link, active, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           image_url = EXCLUDED.image_url,
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          fullBanner.title || 'Promo Banner',
          fullBanner.description || '',
          imageUrl || fullBanner.image || 'images/promo-banner-1.jpg',
          fullBanner.badgeTag || fullBanner.badge_tag || '🔥 PROMO SPESIAL',
          fullBanner.badgePill || fullBanner.badge_pill || '✨ FLASH DEAL',
          fullBanner.promoCode || fullBanner.promo_code || '',
          fullBanner.buttonText || fullBanner.button_text || 'Klaim Promo ↗',
          fullBanner.buttonLink || fullBanner.button_link || '#',
          fullBanner.active !== false,
        ]
      );
      console.log(`✅ [PostgreSQL] Banner ${id} otomatis dibuat & disimpan ke tabel banners!`);
    } else {
      console.log(`✅ [PostgreSQL] UPDATE banners SET ${imageUrl ? `image_url='${imageUrl}', ` : ''}updated_at=NOW() WHERE id='${id}' berhasil dieksekusi!`);
    }

    return { synced: true, id, updatedFields: sets };
  } catch (err) {
    console.warn(`[PostgreSQL] Gagal sinkronisasi banner ${id} ke tabel banners:`, err.message);
    return { synced: false, error: err.message };
  }
}

/**
 * Synchronize all promos from local storage into PostgreSQL `banners` table
 */
async function syncAllBannersToPostgres() {
  const execQuery = getQueryExecutor();
  if (!execQuery) return false;

  try {
    if (!fs.existsSync(PROMOS_FILE)) return false;
    const list = JSON.parse(fs.readFileSync(PROMOS_FILE, 'utf-8'));
    if (!Array.isArray(list) || list.length === 0) return false;

    for (const promo of list) {
      await execQuery(
        `INSERT INTO banners (id, title, description, image_url, badge_tag, badge_pill, promo_code, button_text, button_link, active, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url,
           badge_tag = EXCLUDED.badge_tag,
           badge_pill = EXCLUDED.badge_pill,
           promo_code = EXCLUDED.promo_code,
           button_text = EXCLUDED.button_text,
           button_link = EXCLUDED.button_link,
           active = EXCLUDED.active,
           updated_at = CURRENT_TIMESTAMP`,
        [
          promo.id,
          promo.title || 'Promo Banner',
          promo.description || '',
          promo.image || 'images/promo-banner-1.jpg',
          promo.badgeTag || '🔥 PROMO SPESIAL',
          promo.badgePill || '✨ FLASH DEAL',
          promo.promoCode || '',
          promo.buttonText || 'Klaim Promo ↗',
          promo.buttonLink || '#',
          promo.active !== false,
        ]
      );
    }
    console.log(`✅ [PostgreSQL] Sinkronisasi ${list.length} banner ke tabel banners selesai.`);
    return true;
  } catch (err) {
    console.warn('[PostgreSQL] syncAllBannersToPostgres error:', err.message);
    return false;
  }
}

/**
 * Remove banner from PostgreSQL `banners` table
 */
async function deleteBannerFromPostgres(id) {
  const execQuery = getQueryExecutor();
  if (!execQuery) return false;

  try {
    await execQuery('DELETE FROM banners WHERE id = $1', [id]);
    console.log(`✅ [PostgreSQL] Banner ${id} berhasil dihapus dari tabel banners.`);
    return true;
  } catch (err) {
    console.warn(`[PostgreSQL] Gagal menghapus banner ${id} dari tabel banners:`, err.message);
    return false;
  }
}

module.exports = {
  syncBannerToPostgres,
  syncAllBannersToPostgres,
  deleteBannerFromPostgres,
  isConnected,
};