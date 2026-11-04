/**
 * NGALAM FIX PRO - Modul Khusus Login Teknisi Lab Workshop
 * Didedikasikan 100% untuk Otentikasi Staf Teknisi Lab Meja Pengerjaan Servis.
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  const techLoginForm = document.getElementById('techLoginForm');
  const loginIdentifier = document.getElementById('loginIdentifier');
  const loginPassword = document.getElementById('loginPassword');
  const loginAlertBox = document.getElementById('loginAlertBox');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  function resolveSafeRedirect(raw) {
    if (!raw) return 'index.html';
    const decoded = decodeURIComponent(raw).trim();
    if (
      decoded === '/teknisi' ||
      decoded === '/teknisi/' ||
      decoded === '/teknisi/index.html' ||
      decoded === '/public/teknisi' ||
      decoded === '/public/teknisi/' ||
      decoded === '/public/teknisi/index.html' ||
      decoded.endsWith('/teknisi/index.html') ||
      decoded.endsWith('/teknisi')
    ) {
      return 'index.html';
    }
    return decoded;
  }

  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isLoggedOut = urlParams.get('logged_out') === '1' || urlParams.get('action') === 'logout';

  if (isLoggedOut) {
    try {
      localStorage.removeItem('ngalam_tech_session');
      sessionStorage.clear();
      document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
    } catch (_) {}
    showAlert('Anda telah berhasil keluar (logout). Silakan isi kembali username dan kata sandi untuk masuk ke meja kerja.', true);
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } else {
    // Cek apakah ada sesi meja kerja teknisi aktif
    try {
      const raw = localStorage.getItem('ngalam_tech_session');
      if (raw) {
        const savedUser = JSON.parse(raw);
        if (savedUser && (savedUser.role === 'teknisi' || savedUser.role === 'admin' || savedUser.role === 'owner')) {
          showAlert(`Sesi meja kerja teknisi aktif (${savedUser.name}). Mengalihkan ke meja lab...`, true);
          const target = resolveSafeRedirect(urlParams.get('redirect'));
          setTimeout(() => {
            window.location.href = target;
          }, 350);
        }
      }
    } catch (_) {}
  }

  // Toggle Password
  togglePasswordBtn?.addEventListener('click', () => {
    if (!loginPassword) return;
    const isPass = loginPassword.type === 'password';
    loginPassword.type = isPass ? 'text' : 'password';
    const eyeOpen = togglePasswordBtn.querySelector('.eye-icon-open');
    const eyeClosed = togglePasswordBtn.querySelector('.eye-icon-closed');
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPass ? 'none' : 'block';
      eyeClosed.style.display = isPass ? 'block' : 'none';
    } else {
      togglePasswordBtn.textContent = isPass ? '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  });

  // Check Database Connection Status
  async function checkDbStatus() {
    const pill = document.getElementById('techDbSyncPill');
    const pillText = document.getElementById('techDbSyncPillText');
    const dot = document.getElementById('techDbSyncDot');
    if (!pill || !pillText) return;

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : '';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/technicians/database-status`);
      const data = await res.json();

      if (data && data.success) {
        pill.style.background = '#f0fdf4';
        pill.style.borderColor = '#bbf7d0';
        pill.style.color = '#15803d';
        if (dot) dot.style.background = '#22c55e';
        pillText.innerHTML = `Terhubung: Database Lab Workshop (<b>Siap PostgreSQL</b>)`;
      } else {
        pill.style.background = '#fef2f2';
        pill.style.borderColor = '#fecaca';
        pill.style.color = '#b91c1c';
        if (dot) dot.style.background = '#ef4444';
        pillText.innerHTML = `Database: Mode Penyimpanan Lokal`;
      }
    } catch (_) {
      pill.style.background = '#f8fafc';
      pill.style.borderColor = '#e2e8f0';
      pill.style.color = '#64748b';
      if (dot) dot.style.background = '#94a3b8';
      pillText.textContent = 'Database: Penyimpanan Akun Lokal Lab';
    }
  }
  checkDbStatus();

  function showAlert(message, isSuccess = false) {
    if (!loginAlertBox) return;
    loginAlertBox.style.display = 'block';
    loginAlertBox.style.animation = 'bannerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    if (isSuccess) {
      loginAlertBox.style.background = 'rgba(16, 185, 129, 0.15)';
      loginAlertBox.style.border = '1.5px solid #10b981';
      loginAlertBox.style.color = '#047857';
      loginAlertBox.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Berhasil:</b> ${message}`;
    } else {
      loginAlertBox.style.background = 'rgba(239, 68, 68, 0.15)';
      loginAlertBox.style.border = '1.5px solid #ef4444';
      loginAlertBox.style.color = '#dc2626';
      loginAlertBox.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Gagal:</b> ${message}`;
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
    const eyeOpen = toggleRegPasswordBtn.querySelector('.eye-icon-open');
    const eyeClosed = toggleRegPasswordBtn.querySelector('.eye-icon-closed');
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPass ? 'none' : 'block';
      eyeClosed.style.display = isPass ? 'block' : 'none';
    } else {
      toggleRegPasswordBtn.textContent = isPass ? '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
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
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Kode Workshop Wajib Diisi',
          message: 'Kode otorisasi workshop wajib diisi untuk mendaftar sebagai teknisi lab.',
          targetInputId: 'regAccessCode'
        });
      }
      showAlert('Kode otorisasi workshop wajib diisi.');
      return;
    }
    if (!name || !username || !password || !phone) {
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Lengkapi Data Registrasi',
          message: 'Harap lengkapi semua kolom wajib bertanda bintang (*) sebelum mendaftar.',
          targetInputId: !name ? 'regFullName' : (!username ? 'regTechUsername' : (!phone ? 'regTechPhone' : 'regPassword'))
        });
      }
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
        : '';
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
        showAlert(`Registrasi teknisi "${name}" berhasil! Akun Anda telah aktif di database sistem lab. Silakan login.`, true);
        techRegisterForm.reset();
        switchToLoginTab();
        if (loginIdentifier) loginIdentifier.value = username;
        if (loginPassword) {
          loginPassword.value = '';
        }

        if (window.showAuthSuccessModal) {
          window.showAuthSuccessModal({
            title: 'Pendaftaran Teknisi Berhasil!',
            subtitle: `Akun teknisi "${name}" telah terdaftar resmi di lab. Silakan masukkan kata sandi untuk masuk ke meja kerja.`,
            user: {
              name,
              role: 'teknisi',
              roleText: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 4-4 3 3-4 4"/></svg> Teknisi Meja Kerja Lab',
              avatar: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 4-4 3 3-4 4"/></svg>'
            },
            duration: 1600,
            onComplete: () => {
              if (loginPassword) loginPassword.focus();
            }
          });
          return;
        }

        if (loginPassword) loginPassword.focus();
      } else {
        const errMsg = data.error || data.message || 'Pendaftaran teknisi gagal. Periksa kembali kode workshop Anda.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Registrasi Teknisi Ditolak',
            message: errMsg,
            targetInputId: 'regAccessCode'
          });
        }
        showAlert(errMsg);
      }
    } catch (err) {
      const errMsg = 'Terjadi kesalahan jaringan saat mendaftarkan teknisi: ' + err.message;
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Koneksi Server Gagal',
          message: errMsg
        });
      }
      showAlert(errMsg);
    } finally {
      if (regSubmitBtn) {
        regSubmitBtn.disabled = false;
        regSubmitBtn.innerHTML = '<span>Daftarkan Akun Teknisi Lab <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>';
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
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Kolom Wajib Diisi',
          message: 'Silakan isi username akun teknisi dan kata sandi Anda untuk mengakses meja kerja lab.',
          targetInputId: !identifier ? 'loginIdentifier' : 'loginPassword'
        });
      }
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
        : '';
      if (window.resolveNgalamApiBase) {
        try {
          apiBase = await window.resolveNgalamApiBase();
        } catch (_) {}
      }

      const rememberCheck = document.getElementById('rememberMeCheck');
      const isRemember = Boolean(rememberCheck ? rememberCheck.checked : true);

      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, role: 'teknisi', rememberMe: isRemember }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        // Enforce authorized workshop technical role
        if (data.user.role !== 'teknisi' && data.user.role !== 'admin' && data.user.role !== 'owner') {
          const rejectMsg = 'Akun ini tidak memiliki hak akses meja kerja lab teknisi. Silakan hubungi Super Admin.';
          if (window.showAuthErrorModal) {
            window.showAuthErrorModal({
              title: 'Akses Meja Lab Ditolak',
              message: rejectMsg,
              targetInputId: 'loginIdentifier'
            });
          }
          showAlert(rejectMsg);
          if (loginSubmitBtn) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = '<span>Masuk ke Meja Kerja Lab <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>';
            loginSubmitBtn.style.opacity = '1';
            loginSubmitBtn.style.transform = 'scale(1)';
          }
          return;
        }

        // Save session
        const storage = isRemember ? localStorage : sessionStorage;
        const otherStorage = isRemember ? sessionStorage : localStorage;
        storage.setItem('ngalam_tech_session', JSON.stringify(data.user));
        otherStorage.removeItem('ngalam_tech_session');
        const maxAge = data.user.maxAge || (isRemember ? 2592000 : 86400);
        document.cookie = `ngalam_token=${data.user.token}; path=/; max-age=${maxAge}; SameSite=Lax`;

        const redirectUrl = resolveSafeRedirect(urlParams.get('redirect'));

        if (window.showAuthSuccessModal) {
          window.showAuthSuccessModal({
            title: 'Otentikasi Berhasil!',
            subtitle: `Selamat datang di Meja Kerja Lab, ${data.user.name}!`,
            user: {
              name: data.user.name,
              role: 'teknisi',
              roleText: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 4-4 3 3-4 4"/></svg> Teknisi Meja Kerja Lab Workshop',
              avatar: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 4-4 3 3-4 4"/></svg>'
            },
            redirectUrl: redirectUrl,
            duration: 1350
          });
          return;
        }

        // Fallback Trigger Futuristic Login Animation Overlay if present
        const overlay = document.getElementById('loginAnimationOverlay');
        const fill = document.getElementById('animProgressFill');
        const icon = document.getElementById('animCircleIcon');
        const subtitle = document.getElementById('animSubtitle');
        const stepText = document.getElementById('animStatusStepText');

        if (overlay) {
          overlay.style.display = 'flex';
          if (subtitle) subtitle.textContent = `Selamat datang, ${data.user.name}!`;

          setTimeout(() => {
            if (fill) fill.style.width = '35%';
            if (icon) icon.textContent = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
            if (stepText) stepText.textContent = 'Memverifikasi kredensial di database lab workshop...';
          }, 250);

          setTimeout(() => {
            if (fill) fill.style.width = '80%';
            if (icon) icon.textContent = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18h8"/><path d="M3 22h18"/><path d="m14 22 3-3-3-3"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="m12 6 4-4 3 3-4 4"/></svg>';
            if (stepText) stepText.textContent = 'Akun terverifikasi! Menyiapkan antrean unit HP servis...';
          }, 650);

          setTimeout(() => {
            if (fill) fill.style.width = '100%';
            if (icon) icon.textContent = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>';
            if (stepText) stepText.textContent = 'Meja lab siap! Membuka workbench...';
          }, 1050);

          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1450);
        } else {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 400);
        }
      } else {
        const errMsg = data.error || data.message || 'Username atau kata sandi teknisi tidak cocok.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Login Teknisi Gagal!',
            message: errMsg,
            hints: [
              'Periksa apakah tombol <b>Caps Lock</b> sedang aktif pada keyboard.',
              'Pastikan username akun teknisi lab Anda sudah didaftarkan.',
              'Jika lupa kata sandi, hubungi Admin / Super User untuk mereset kredensial Anda.'
            ],
            targetInputId: 'loginPassword'
          });
        }
        showAlert(errMsg);
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = '<span>Masuk ke Meja Kerja Lab <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>';
          loginSubmitBtn.style.opacity = '1';
          loginSubmitBtn.style.transform = 'scale(1)';
        }
      }
    } catch (err) {
      const errMsg = 'Terjadi gangguan koneksi ke server database: ' + err.message;
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Koneksi Database Terputus',
          message: errMsg
        });
      }
      showAlert(errMsg);
      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = '<span>Masuk ke Meja Kerja Lab <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>';
        loginSubmitBtn.style.opacity = '1';
        loginSubmitBtn.style.transform = 'scale(1)';
      }
    }
  });

  // Keamanan: Jangan langsung bisa masuk tanpa memasukkan kredensial autentikasi
});
