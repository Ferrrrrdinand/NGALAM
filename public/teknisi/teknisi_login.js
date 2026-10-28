/**
 * NGALAM FIX PRO - Modul Khusus Login Teknisi Lab Workshop
 * Didedikasikan 100% untuk Otentikasi Staf Teknisi Lab Meja Pengerjaan Servis.
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

  const techLoginForm = document.getElementById('techLoginForm');
  const loginIdentifier = document.getElementById('loginIdentifier');
  const loginPassword = document.getElementById('loginPassword');
  const loginAlertBox = document.getElementById('loginAlertBox');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  // Keamanan Ketat: Selalu bersihkan sesi login & input saat halaman login dibuka dari beranda / mana pun
  try {
    localStorage.removeItem('ngalam_tech_session');
    sessionStorage.clear();
    document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
  } catch (_) {}

  if (loginIdentifier) loginIdentifier.value = '';
  if (loginPassword) loginPassword.value = '';

  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isLoggedOut = urlParams.get('logged_out') === '1' || urlParams.get('action') === 'logout';

  if (isLoggedOut) {
    showAlert('Anda telah berhasil keluar (logout). Silakan isi kembali username dan kata sandi untuk masuk ke meja kerja.', true);
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // Toggle Password
  togglePasswordBtn?.addEventListener('click', () => {
    if (!loginPassword) return;
    const isPass = loginPassword.type === 'password';
    loginPassword.type = isPass ? 'text' : 'password';
    togglePasswordBtn.textContent = isPass ? '🔒' : '👁️';
  });

  // Check Spreadsheet Connection Status
  async function checkSpreadsheetStatus() {
    const pill = document.getElementById('spreadsheetSyncPill');
    const pillText = document.getElementById('spreadsheetSyncPillText');
    const dot = document.getElementById('spreadsheetSyncDot');
    if (!pill || !pillText) return;

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/technicians/spreadsheet-status`);
      const data = await res.json();

      if (data.success && data.connected) {
        pill.style.background = '#f0fdf4';
        pill.style.borderColor = '#bbf7d0';
        pill.style.color = '#15803d';
        if (dot) dot.style.background = '#22c55e';
        pillText.innerHTML = `Terhubung: Google Spreadsheet (Tab: <b>${data.sheetName || 'AkunTeknisi'}</b>)`;
      } else {
        pill.style.background = '#f8fafc';
        pill.style.borderColor = '#e2e8f0';
        pill.style.color = '#64748b';
        if (dot) dot.style.background = '#94a3b8';
        pillText.textContent = 'Database: Penyimpanan Akun Lokal Lab';
      }
    } catch (_) {
      pill.style.background = '#f8fafc';
      pill.style.borderColor = '#e2e8f0';
      pill.style.color = '#64748b';
      if (dot) dot.style.background = '#94a3b8';
      pillText.textContent = 'Database: Penyimpanan Akun Lokal Lab';
    }
  }
  checkSpreadsheetStatus();

  function showAlert(message, isSuccess = false) {
    if (!loginAlertBox) return;
    loginAlertBox.style.display = 'block';
    loginAlertBox.style.animation = 'bannerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    if (isSuccess) {
      loginAlertBox.style.background = 'rgba(16, 185, 129, 0.15)';
      loginAlertBox.style.border = '1.5px solid #10b981';
      loginAlertBox.style.color = '#047857';
      loginAlertBox.innerHTML = `<b>🎉 Berhasil:</b> ${message}`;
    } else {
      loginAlertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      loginAlertBox.style.border = '1.5px solid #ef4444';
      loginAlertBox.style.color = '#dc2626';
      loginAlertBox.innerHTML = `<b>⚠️ Gagal:</b> ${message}`;
    }
  }

  // Tab switching: Login vs Registrasi
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const techRegisterForm = document.getElementById('techRegisterForm');
  const toggleRegPasswordBtn = document.getElementById('toggleRegPasswordBtn');
  const regPassword = document.getElementById('regPassword');

  function switchToLoginTab() {
    if (techLoginForm) techLoginForm.style.display = 'block';
    if (techRegisterForm) techRegisterForm.style.display = 'none';
    if (tabLoginBtn) {
      tabLoginBtn.style.background = '#ffffff';
      tabLoginBtn.style.color = '#0284c7';
      tabLoginBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    }
    if (tabRegisterBtn) {
      tabRegisterBtn.style.background = 'transparent';
      tabRegisterBtn.style.color = '#64748b';
      tabRegisterBtn.style.boxShadow = 'none';
    }
  }

  function switchToRegisterTab() {
    if (techLoginForm) techLoginForm.style.display = 'none';
    if (techRegisterForm) techRegisterForm.style.display = 'block';
    if (tabRegisterBtn) {
      tabRegisterBtn.style.background = '#ffffff';
      tabRegisterBtn.style.color = '#059669';
      tabRegisterBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    }
    if (tabLoginBtn) {
      tabLoginBtn.style.background = 'transparent';
      tabLoginBtn.style.color = '#64748b';
      tabLoginBtn.style.boxShadow = 'none';
    }
  }

  tabLoginBtn?.addEventListener('click', switchToLoginTab);
  tabRegisterBtn?.addEventListener('click', switchToRegisterTab);

  // Toggle Password for Registration
  toggleRegPasswordBtn?.addEventListener('click', () => {
    if (!regPassword) return;
    const isPass = regPassword.type === 'password';
    regPassword.type = isPass ? 'text' : 'password';
    toggleRegPasswordBtn.textContent = isPass ? '🔒' : '👁️';
  });

  // Handle Technician Registration Submit
  techRegisterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const registrationCode = document.getElementById('regAccessCode')?.value.trim();
    const name = document.getElementById('regFullName')?.value.trim();
    const username = document.getElementById('regUsername')?.value.trim();
    const password = document.getElementById('regPassword')?.value.trim();
    const phone = document.getElementById('regPhone')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const desk = document.getElementById('regDesk')?.value;
    const specialty = document.getElementById('regSpecialty')?.value;
    const regSubmitBtn = document.getElementById('regSubmitBtn');

    if (!registrationCode) {
      showAlert('Kode otorisasi workshop wajib diisi.');
      return;
    }
    if (!name || !username || !password || !phone) {
      showAlert('Harap lengkapi semua kolom wajib bertanda bintang (*).');
      return;
    }

    if (regSubmitBtn) {
      regSubmitBtn.disabled = true;
      regSubmitBtn.innerHTML = '<span>⏳ Memvalidasi Kode Workshop & Mendaftarkan Akun...</span>';
      regSubmitBtn.style.opacity = '0.85';
    }

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/technicians/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationCode,
          name,
          username,
          password,
          phone,
          email,
          desk,
          specialty
        })
      });
      const data = await res.json();

      if (data.success) {
        showAlert(`Registrasi teknisi "${name}" berhasil! Akun Anda telah aktif dan tersinkronisasi ke Google Spreadsheet. Silakan login.`, true);
        techRegisterForm.reset();
        switchToLoginTab();
        if (loginIdentifier) loginIdentifier.value = username;
        if (loginPassword) {
          loginPassword.value = '';
          loginPassword.focus();
        }
      } else {
        showAlert(data.error || data.message || 'Pendaftaran teknisi gagal. Periksa kembali kode workshop Anda.');
      }
    } catch (err) {
      showAlert('Terjadi kesalahan jaringan saat mendaftarkan teknisi: ' + err.message);
    } finally {
      if (regSubmitBtn) {
        regSubmitBtn.disabled = false;
        regSubmitBtn.innerHTML = '<span>Daftarkan Akun & Sinkronkan ke Spreadsheet 🚀</span>';
        regSubmitBtn.style.opacity = '1';
      }
    }
  });

  // Handle Login Submit
  techLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = loginIdentifier?.value.trim();
    const password = loginPassword?.value.trim();

    if (!identifier || !password) {
      showAlert('Username teknisi dan kata sandi wajib diisi.');
      return;
    }

    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = '<span>⏳ Memvalidasi Kredensial Lab...</span>';
      loginSubmitBtn.style.opacity = '0.85';
      loginSubmitBtn.style.transform = 'scale(0.99)';
    }

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try {
          apiBase = await window.resolveNgalamApiBase();
        } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role: 'teknisi' }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        // Enforce technician role only
        if (data.user.role !== 'teknisi') {
          showAlert('Akun ini bukan akun teknisi workshop lab.');
          if (loginSubmitBtn) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = '<span>Masuk ke Meja Kerja Lab 🚀</span>';
            loginSubmitBtn.style.opacity = '1';
            loginSubmitBtn.style.transform = 'scale(1)';
          }
          return;
        }

        // Save session
        localStorage.setItem('ngalam_tech_session', JSON.stringify(data.user));
        document.cookie = `ngalam_token=${data.user.token}; path=/; max-age=86400; SameSite=Lax`;

        // Trigger Futuristic Login Animation Overlay
        const overlay = document.getElementById('loginAnimationOverlay');
        const fill = document.getElementById('animProgressFill');
        const icon = document.getElementById('animCircleIcon');
        const subtitle = document.getElementById('animSubtitle');
        const stepText = document.getElementById('animStatusStepText');

        if (overlay) {
          overlay.style.display = 'flex';
          if (subtitle) subtitle.textContent = `Selamat datang, ${data.user.name}!`;

          // Step 1: 20%
          setTimeout(() => {
            if (fill) fill.style.width = '35%';
            if (icon) icon.textContent = '⚡';
            if (stepText) {
              stepText.textContent = data.user.source === 'google_spreadsheet'
                ? 'Memverifikasi kredensial di Google Spreadsheet (AkunTeknisi)...'
                : 'Menghubungkan meja kerja lab real-time...';
            }
          }, 250);

          // Step 2: 70%
          setTimeout(() => {
            if (fill) fill.style.width = '80%';
            if (icon) icon.textContent = '🔬';
            if (stepText) {
              stepText.textContent = data.user.source === 'google_spreadsheet'
                ? 'Akun terverifikasi dari Spreadsheet! Menyiapkan antrean unit HP...'
                : 'Menyiapkan antrean unit HP servis lab...';
            }
          }, 650);

          // Step 3: 100% and Launch
          setTimeout(() => {
            if (fill) fill.style.width = '100%';
            if (icon) icon.textContent = '🚀';
            if (stepText) stepText.textContent = 'Meja lab siap! Membuka workbench...';
          }, 1050);

          // Redirect
          const redirectUrl = urlParams.get('redirect') || 'index.html';
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1450);
        } else {
          const redirectUrl = urlParams.get('redirect') || 'index.html';
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 400);
        }
      } else {
        showAlert(data.error || data.message || 'Username atau kata sandi teknisi tidak cocok.');
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = '<span>Masuk ke Meja Kerja Lab 🚀</span>';
          loginSubmitBtn.style.opacity = '1';
          loginSubmitBtn.style.transform = 'scale(1)';
        }
      }
    } catch (err) {
      showAlert('Terjadi gangguan koneksi ke server database: ' + err.message);
      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = '<span>Masuk ke Meja Kerja Lab 🚀</span>';
        loginSubmitBtn.style.opacity = '1';
        loginSubmitBtn.style.transform = 'scale(1)';
      }
    }
  });

  // Keamanan: Jangan langsung bisa masuk tanpa memasukkan kredensial autentikasi
});
