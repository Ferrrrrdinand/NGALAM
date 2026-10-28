/**
 * NGALAM FIX PRO - Smart Dynamic API Base Resolver
 * Otomatis mendeteksi port backend server Ngalam Fix Pro (Port 3001, 3000, 3002, dll).
 * Menghilangkan konflik jika pengguna membuka website via VS Code Live Server (Port 5500)
 * atau jika terdapat project web lain yang sedang berjalan di port 3000.
 */
(function (window) {
  'use strict';

  let cachedApiBase = null;

  function getNgalamApiBaseSync() {
    if (cachedApiBase !== null) return cachedApiBase;

    const currentPort = window.location.port;
    // Jika halaman dibuka langsung via server node Ngalam Fix Pro (3000, 3001, 3002)
    if (currentPort === '3000' || currentPort === '3001' || currentPort === '3002') {
      cachedApiBase = '';
      return cachedApiBase;
    }

    const host = window.location.hostname || 'localhost';
    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
    // Standar Live Server (5500, dll): utamakan port 3000 (port utama server.js)
    cachedApiBase = `${proto}//${host}:3000`;
    return cachedApiBase;
  }

  async function resolveNgalamApiBase() {
    const currentPort = window.location.port;
    if (currentPort === '3000' || currentPort === '3001' || currentPort === '3002') {
      cachedApiBase = '';
      return cachedApiBase;
    }

    const host = window.location.hostname || 'localhost';
    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
    // Daftar port kandidat: 3000 dicek pertama, lalu 3001, lalu 3002
    const candidatePorts = [3000, 3001, 3002];

    for (const p of candidatePorts) {
      try {
        const testUrl = `${proto}//${host}:${p}/api/promo-codes`;
        const res = await fetch(testUrl, {
          method: 'GET',
          signal: AbortSignal.timeout ? AbortSignal.timeout(500) : undefined
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = await res.json();
          // Pastikan respons adalah endpoint resmi Ngalam Fix Pro
          if (json && json.success && Array.isArray(json.data)) {
            cachedApiBase = `${proto}//${host}:${p}`;
            console.log(`[Ngalam Fix Pro] Backend server resmi terdeteksi di: ${cachedApiBase}`);
            return cachedApiBase;
          }
        }
      } catch (_) {
        // Port tidak aktif atau menolak koneksi, lanjutkan cek kandidat berikutnya
      }
    }

    // Fallback jika tidak ada yang merespons cepat
    if (!cachedApiBase) {
      cachedApiBase = `${proto}//${host}:3000`;
    }
    return cachedApiBase;
  }

  window.getNgalamApiBase = getNgalamApiBaseSync;
  window.resolveNgalamApiBase = resolveNgalamApiBase;

  // Auto pre-resolve backend port in background as soon as script is evaluated
  if (typeof window !== 'undefined') {
    resolveNgalamApiBase().catch(() => {});
  }
})(window);
