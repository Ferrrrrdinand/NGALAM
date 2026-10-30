/**
 * NGALAM FIX PRO - Admin Route Guard
 * Memastikan hanya Super Admin & Owner yang dapat mengakses dashboard manajemen utama.
 * Jika staf kasir membuka halaman ini, otomatis dialihkan ke dashboard kasir.
 */
(function () {
  'use strict';
  try {
    const raw = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    if (!raw) {
      window.location.replace('login.html?reason=required&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    const user = JSON.parse(raw);
    if (!user || !user.token) {
      localStorage.removeItem('ngalam_auth_user');
      sessionStorage.removeItem('ngalam_auth_user');
      window.location.replace('login.html?reason=required');
      return;
    }
    // Jika akun kasir, alihkan langsung ke portal kasir meja 1
    if (user.role === 'kasir') {
      window.location.replace('../kasir/index.html');
      return;
    }
    // Hanya perbolehkan admin dan owner di area admin
    if (user.role !== 'admin' && user.role !== 'owner') {
      localStorage.removeItem('ngalam_auth_user');
      sessionStorage.removeItem('ngalam_auth_user');
      window.location.replace('login.html?reason=role_mismatch&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    // Sinkronisasi session cookie
    document.cookie = 'ngalam_token=' + user.token + '; path=/; max-age=86400; SameSite=Lax';
  } catch (e) {
    window.location.replace('login.html?reason=required');
  }
})();
