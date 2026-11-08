# 🚀 Deployment Checklist - Ngalam Fix Pro

## ✅ Latest Changes Committed & Pushed

**Commit History:**
1. `e957945` - feat: Add 100 pre-created mitra QR codes + landing modal
2. `e1fda47` - perf: Convert logo from JPG to WebP (35% size reduction)

---

## 📋 WHAT NEEDS TO BE DEPLOYED

### 1. Database Migrations (IMPORTANT!)
```bash
npm run db:migrate
```

This will create:
- `unregistered_users` table
- Add Google OAuth fields to `users` table
- Add referral fields to `customers` table

### 2. Seed Pre-Created Mitra Accounts
```bash
node scripts/seed-100-mitra.js
```

This creates 100 mitra with codes: MITRA-001 to MITRA-100

### 3. Generate QR Codes (Already done locally)
Files ready in `public/qr-codes/`:
- 100 PNG files
- 1 PDF print sheet
- 1 ZIP archive

---

## 🔧 VERCEL DEPLOYMENT STEPS

### Option A: Automatic via Git Push (Done ✅)
```bash
git push origin main
```
Vercel will auto-deploy if connected to GitHub repo.

### Option B: Manual Redeploy
1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select project: ngalam1-delta
3. Click "Redeploy" button
4. Wait for build to complete

### Option C: Force Redeploy via CLI
```bash
npm i -g vercel
vercel --prod
```

---

## ⚠️ POST-DEPLOYMENT CHECKS

### 1. Run Migrations on Production Database
```bash
# SSH to production or use Vercel CLI
DATABASE_URL="your-production-db-url" npm run db:migrate
```

### 2. Seed Mitra Accounts (One-time only)
```bash
DATABASE_URL="your-production-db-url" node scripts/seed-100-mitra.js
```

### 3. Verify Website
- [ ] Visit: https://ngalam1-delta.vercel.app/
- [ ] Check if landing modal appears (wait 1.5s)
- [ ] Check if logo is WebP format
- [ ] Test QR code: https://ngalam1-delta.vercel.app/?ref=MITRA-001
- [ ] Verify modal captures name + phone
- [ ] Test Google OAuth customer flow
- [ ] Test Google OAuth mitra claim flow

### 4. Admin Panel Checks
- [ ] GET /api/auth/admin/pre-created-mitra (should return 100 mitra)
- [ ] GET /api/auth/admin/qr-pdf-download (should download PDF)
- [ ] POST /api/auth/register-initial (landing modal endpoint)

---

## 🐛 TROUBLESHOOTING

### Landing Modal Not Appearing?
```javascript
// Check localStorage
localStorage.getItem('ngalam_modal_seen') // Should be null on first visit
localStorage.clear() // Force reset to test again
```

### QR Codes 404?
Make sure `public/qr-codes/` folder is deployed:
```bash
ls -la public/qr-codes/ | wc -l  # Should show 103 files
```

### Database Not Migrated?
Check migration status:
```sql
SELECT * FROM "SequelizeMeta" ORDER BY name;
-- Should include:
-- 20261108000001-create-unregistered-users.js
-- 20261108000002-add-google-auth-fields.js
-- 20261108000003-add-customer-referral-fields.js
```

---

## 📊 PERFORMANCE IMPROVEMENTS

### Logo Optimization
- **Before:** 156KB (JPG) × 2 = 312KB
- **After:** 101KB (WebP) × 2 = 202KB
- **Savings:** 110KB (35% reduction)

### New Features Added
- Landing modal with auto-popup
- 100 pre-created mitra accounts
- QR code generation system
- Unregistered user tracking
- Enhanced Google OAuth flow

---

## 🔗 IMPORTANT URLs

**Production:**
- Website: https://ngalam1-delta.vercel.app/
- QR Test: https://ngalam1-delta.vercel.app/?ref=MITRA-001

**Admin Endpoints:**
- List Mitra: GET /api/auth/admin/pre-created-mitra
- Download QR PDF: GET /api/auth/admin/qr-pdf-download
- Download QR ZIP: GET /api/auth/admin/qr-batch-download

**Documentation:**
- Implementation: IMPLEMENTATION_SUMMARY.md
- QR Guide: QR_CODES_GUIDE.md

---

**Status:** ✅ Code pushed, waiting for Vercel redeploy  
**Last Update:** 2026-11-08 12:18 WIB  
**Commits:** e957945, e1fda47
