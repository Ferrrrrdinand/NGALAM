/**
 * NGALAM FIX PRO - Smart Dynamic API Base Resolver
 * Otomatis mendeteksi port backend server Ngalam Fix Pro (Port 3000).
 * Jika frontend dibuka via VS Code Live Server (port 5500, 5501, 5502, 8080, dll) atau file:///,
 * sistem otomatis mengarahkan panggilan API ke backend Node.js di http://localhost:3000 atau http://127.0.0.1:3000.
 * Jika diakses langsung via port backend (3000) atau domain produksi, menggunakan URL relatif murni ('').
 */
(function (window) {
  'use strict';

  function getNgalamApiBaseSync() {
    if (typeof window === 'undefined' || !window.location) return '';
    const port = String(window.location.port || '');
    const protocol = window.location.protocol || '';
    const hostname = window.location.hostname || 'localhost';

    // Jika dibuka lewat Live Server (port 5500, 5501, 5502, dll) atau protokol file:
    if (
      protocol === 'file:' ||
      port === '5500' ||
      port === '5501' ||
      port === '5502' ||
      port === '8080' ||
      port === '5173' ||
      (port && port !== '3000' && port !== '80' && port !== '443')
    ) {
      const targetHost = hostname === '127.0.0.1' ? '127.0.0.1' : 'localhost';
      return `http://${targetHost}:3000`;
    }

    // Jika diakses langsung via port 3000 atau domain online produksi, gunakan URL relatif murni
    return '';
  }

  async function resolveNgalamApiBase() {
    return getNgalamApiBaseSync();
  }

  window.getNgalamApiBase = getNgalamApiBaseSync;
  window.resolveNgalamApiBase = resolveNgalamApiBase;
})(window);