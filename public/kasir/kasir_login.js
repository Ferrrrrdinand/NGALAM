/**
 * NGALAM FIX PRO - Modul Login Khusus Kasir Meja 1
 * Mengatur otentikasi mandiri staf Kasir & Front Desk.
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  const kasirLoginForm = document.getElementById('kasirLoginForm');
  const kasirIdentifier = document.getElementById('kasirIdentifier');
  const kasirPassword = document.getElementById('kasirPassword');
  const kasirLoginAlert = document.getElementById('kasirLoginAlert');
  const kasirSubmitBtn = document.getElementById('kasirSubmitBtn');
  const toggleKasirPassBtn = document.getElementById('toggleKasirPassBtn');
  const kasirRememberCheck = document.getElementById('kasirRememberCheck');

  // Quick Chips
  const chipKasirDemo = document.getElementById('chipKasirDemo');
  const chipKasir1Demo = document.getElementById('chipKasir1Demo');

  // Fullscreen elements
  const btnFullscreenToggle = document.getElementById('btnFullscreenToggle');
  const fsIconEnter = document.getElementById('fsIconEnter');
  const fsIconExit = document.getElementById('fsIconExit');
  const fsToggleText = document.getElementById('fsToggleText');

  // Live Clock
  const liveClockDisplay = document.getElementById('liveClockDisplay');
  function updateLiveClock() {
    if (!liveClockDisplay) return;
    const now = new Date();
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    liveClockDisplay.textContent = now.toLocaleDateString('id-ID', options) + ' WIB';
  }
  updateLiveClock();
  setInterval(updateLiveClock, 1000);

  // Fullscreen Handler
  if (btnFullscreenToggle) {
    btnFullscreenToggle.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          if (fsIconEnter) fsIconEnter.style.display = 'none';
          if (fsIconExit) fsIconExit.style.display = 'inline-block';
          if (fsToggleText) fsToggleText.textContent = 'Keluar Layar Penuh';
        }).catch(() => {});
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            if (fsIconEnter) fsIconEnter.style.display = 'inline-block';
            if (fsIconExit) fsIconExit.style.display = 'none';
            if (fsToggleText) fsToggleText.textContent = 'Mode Layar Penuh';
          }).catch(() => {});
        }
      }
    });
  }

  function resolveSafeRedirect(raw) {
    if (!raw) return 'index.html';
    const decoded = decodeURIComponent(raw).trim();
    if (
      decoded === '/kasir' ||
      decoded === '/kasir/' ||
      decoded === '/kasir/index.html' ||
      decoded === '/public/kasir' ||
      decoded === '/public/kasir/' ||
      decoded === '/public/kasir/index.html' ||
      decoded.endsWith('/kasir/index.html') ||
      decoded.endsWith('/kasir')
    ) {
      return 'index.html';
    }
    return decoded;
  }

  function showAlert(msg, isSuccess = false) {
    if (!kasirLoginAlert) return;
    kasirLoginAlert.style.display = 'block';
    if (isSuccess) {
      kasirLoginAlert.style.background = 'rgba(16, 185, 129, 0.12)';
      kasirLoginAlert.style.border = '1px solid rgba(16, 185, 129, 0.35)';
      kasirLoginAlert.style.color = '#059669';
      kasirLoginAlert.innerHTML = `<b>🎉 Berhasil:</b> ${msg}`;
    } else {
      kasirLoginAlert.style.background = 'rgba(239, 68, 68, 0.12)';
      kasirLoginAlert.style.border = '1px solid rgba(239, 68, 68, 0.35)';
      kasirLoginAlert.style.color = '#dc2626';
      kasirLoginAlert.innerHTML = `<b>⚠️ Gagal Masuk:</b> ${msg}`;
    }
  }

  // URL Query Parameters check
  const urlParams = new URLSearchParams(window.location.search);
  const isLoggedOutParam = urlParams.get('reason') === 'logged_out' || urlParams.get('action') === 'logout';
  const isExpiredParam = urlParams.get('reason') === 'expired';

  if (isLoggedOutParam) {
    try {
      localStorage.removeItem('ngalam_auth_user');
      sessionStorage.removeItem('ngalam_auth_user');
      document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
    } catch (_) {}
    showAlert('Anda telah berhasil keluar dari sistem kasir meja 1.', true);
  } else if (isExpiredParam) {
    try {
      localStorage.removeItem('ngalam_auth_user');
      sessionStorage.removeItem('ngalam_auth_user');
      document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
    } catch (_) {}
    showAlert('Sesi kasir telah berakhir demi keamanan. Silakan login kembali.');
  } else if (urlParams.get('reason') === 'required') {
    showAlert('Silakan login dengan akun Kasir Meja 1 untuk mengakses dashboard front desk.');
  } else if (urlParams.get('reason') === 'role_mismatch') {
    showAlert('Akses Ditolak: Halaman dashboard ini khusus untuk staf Kasir Front Desk.');
  } else {
    // Check if session already active
    try {
      const savedRaw = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
      if (savedRaw) {
        const savedUser = JSON.parse(savedRaw);
        if (savedUser && savedUser.token && (savedUser.role === 'kasir' || savedUser.role === 'admin' || savedUser.role === 'owner')) {
          showAlert(`Sesi kasir aktif (${savedUser.name || savedUser.username}). Mengalihkan ke dashboard...`, true);
          const target = resolveSafeRedirect(urlParams.get('redirect'));
          setTimeout(() => {
            window.location.replace(target);
          }, 350);
        }
      }
    } catch (_) {}
  }

  // Password Visibility Toggle
  if (toggleKasirPassBtn && kasirPassword) {
    toggleKasirPassBtn.addEventListener('click', () => {
      const isPass = kasirPassword.type === 'password';
      kasirPassword.type = isPass ? 'text' : 'password';
      const eyeOpen = toggleKasirPassBtn.querySelector('.eye-icon-open');
      const eyeClosed = toggleKasirPassBtn.querySelector('.eye-icon-closed');
      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPass ? 'none' : 'block';
        eyeClosed.style.display = isPass ? 'block' : 'none';
      }
    });
  }

  // Quick Demo Chips
  chipKasirDemo?.addEventListener('click', () => {
    if (kasirIdentifier) kasirIdentifier.value = 'kasir';
    if (kasirPassword) kasirPassword.value = 'password123';
    kasirIdentifier?.focus();
  });

  chipKasir1Demo?.addEventListener('click', () => {
    if (kasirIdentifier) kasirIdentifier.value = 'kasir1';
    if (kasirPassword) kasirPassword.value = 'password123';
    kasirIdentifier?.focus();
  });

  // Handle Form Submission
  if (kasirLoginForm) {
    kasirLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const identifier = (kasirIdentifier?.value || '').trim();
      const password = (kasirPassword?.value || '').trim();

      if (!identifier) {
        showAlert('Silakan masukkan username atau email kasir.');
        kasirIdentifier?.focus();
        return;
      }
      if (!password) {
        showAlert('Silakan masukkan kata sandi kasir.');
        kasirPassword?.focus();
        return;
      }

      // UI Loading state
      if (kasirSubmitBtn) {
        kasirSubmitBtn.disabled = true;
        kasirSubmitBtn.innerHTML = `
          <svg style="animation: spin 1s linear infinite;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg>
          <span>Memverifikasi Akun Kasir...</span>
        `;
      }

      try {
        let apiBase = API_BASE;
        if (window.resolveNgalamApiBase) {
          try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
        }

        const response = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier,
            password,
            role: 'kasir'
          })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          const authData = {
            id: data.user.id,
            username: data.user.username,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role,
            avatar: data.user.avatar || '👩‍💼',
            token: data.user.token,
            accessLevel: data.user.accessLevel || 'kasir_frontdesk',
            loginTime: new Date().toISOString()
          };

          const isRemember = kasirRememberCheck ? kasirRememberCheck.checked : true;
          if (isRemember) {
            localStorage.setItem('ngalam_auth_user', JSON.stringify(authData));
          } else {
            sessionStorage.setItem('ngalam_auth_user', JSON.stringify(authData));
          }

          document.cookie = `ngalam_token=${data.user.token}; path=/; max-age=86400; SameSite=Lax`;

          const targetUrl = resolveSafeRedirect(urlParams.get('redirect'));

          if (typeof window.showAuthSuccessModal === 'function') {
            window.showAuthSuccessModal({
              title: 'Login Kasir Berhasil!',
              message: `Selamat bertugas di Meja 1, <b>${data.user.name || data.user.username}</b>. Menyiapkan sistem kasir POS...`,
              role: 'Kasir Meja 1 (Front Desk)',
              targetUrl,
              countdown: 2
            });
          } else {
            showAlert(`Login berhasil! Selamat bertugas di Meja 1, ${data.user.name}. Mengalihkan...`, true);
            setTimeout(() => {
              window.location.replace(targetUrl);
            }, 500);
          }
        } else {
          const errMsg = data.error || data.message || 'Kredensial kasir tidak sesuai atau akun tidak terdaftar.';
          if (typeof window.showAuthErrorModal === 'function') {
            window.showAuthErrorModal({
              title: 'Gagal Masuk Kasir',
              message: errMsg,
              role: 'Kasir Meja 1'
            });
          } else {
            showAlert(errMsg);
          }
          if (kasirSubmitBtn) {
            kasirSubmitBtn.disabled = false;
            kasirSubmitBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              <span>Masuk sebagai Kasir Meja 1</span>
            `;
          }
        }
      } catch (err) {
        console.error('Kasir login error:', err);
        const netErr = 'Gagal terhubung ke server kasir. Periksa koneksi jaringan Anda.';
        if (typeof window.showAuthErrorModal === 'function') {
          window.showAuthErrorModal({
            title: 'Koneksi Terputus',
            message: netErr,
            role: 'Kasir Meja 1'
          });
        } else {
          showAlert(netErr);
        }
        if (kasirSubmitBtn) {
          kasirSubmitBtn.disabled = false;
          kasirSubmitBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
            <span>Masuk sebagai Kasir Meja 1</span>
          `;
        }
      }
    });
  }
});
