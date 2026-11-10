require('dotenv').config();
const db = require('../services/db');

async function run() {
  try {
    await db.initDb();
    console.log('[Migration] Database initialized.');

    // 1. Update target_url for ad-member-vip-10
    await db.query(`UPDATE ads SET target_url = '/login?tab=register&promo=MEMBER10' WHERE id = 'ad-member-vip-10'`);
    console.log('[Migration] ad-member-vip-10 updated.');

    // 2. Insert or update ad-mitra-afiliasi-10
    await db.query(`
      INSERT INTO ads (id, title, headline, description, badge, image_url, target_url, cta_text, theme, active, location, views_count, clicks_count, created_at, updated_at)
      VALUES (
        'ad-mitra-afiliasi-10',
        'Mitra Afiliasi Komisi 10%',
        'Peluang Cuan Tanpa Modal: Jadi Mitra & Dapatkan Komisi 10% Tiap Rekomendasi Servis!',
        'Punya teman, saudara, atau grup WA yang butuh servis HP? Cukup bagikan QR Code atau link referral Anda. Komisi 10% tunai otomatis cair ke rekening Anda setiap kali servis selesai!',
        '💰 CUAN 10% TANPA MODAL • MITRA RESMI',
        '',
        '/mitra?tab=register',
        'Daftar Mitra Sekarang ↗',
        'emerald',
        true,
        'home_under_steps',
        3820,
        1120,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        headline = EXCLUDED.headline,
        description = EXCLUDED.description,
        badge = EXCLUDED.badge,
        target_url = EXCLUDED.target_url,
        cta_text = EXCLUDED.cta_text,
        theme = EXCLUDED.theme,
        active = EXCLUDED.active,
        updated_at = NOW();
    `);
    console.log('[Migration] ad-mitra-afiliasi-10 upserted.');

    const res = await db.query('SELECT id, title, target_url, active FROM ads ORDER BY created_at DESC');
    console.log('[Migration] Current Ads in DB:', res.rows);
  } catch (err) {
    console.error('[Migration] Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
