/**
 * NGALAM FIX PRO - Admin Route Guard
 * Immediately blocks unauthenticated access and verifies admin/manager role.
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
    if (!user || !user.token || (user.role !== 'admin' && user.role !== 'owner' && user.role !== 'kasir')) {
      localStorage.removeItem('ngalam_auth_user');
      sessionStorage.removeItem('ngalam_auth_user');
      window.location.replace('login.html?reason=role_mismatch&redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    // Sync session cookie
    document.cookie = 'ngalam_token=' + user.token + '; path=/; max-age=86400; SameSite=Lax';
  } catch (e) {
    window.location.replace('login.html?reason=required');
  }
})();
