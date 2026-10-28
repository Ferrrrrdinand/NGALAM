/**
 * NGALAM FIX PRO - Admin & Workshop Manager Authentication Script
 * Handles authentication for front-desk cashier staff and workshop owner.
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminIdentifier = document.getElementById('adminIdentifier');
  const adminPassword = document.getElementById('adminPassword');
  const adminSelectedRole = document.getElementById('adminSelectedRole');
  const kasirRoleBtn = document.getElementById('kasirRoleBtn') || document.querySelector('[data-role="kasir"]');
  const adminRoleBtn = document.getElementById('adminRoleBtn') || document.querySelector('[data-role="admin"]');
  const adminLoginAlert = document.getElementById('adminLoginAlert');
  const adminSubmitBtn = document.getElementById('adminSubmitBtn');
  const toggleAdminPassBtn = document.getElementById('toggleAdminPassBtn');
  const adminRememberCheck = document.getElementById('adminRememberCheck');

  // Keamanan Ketat: Selalu bersihkan sesi login sebelumnya saat halaman login dibuka
  try {
    localStorage.removeItem('ngalam_auth_user');
    sessionStorage.removeItem('ngalam_auth_user');
    document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
  } catch (_) {}
  if (adminIdentifier) adminIdentifier.value = '';
  if (adminPassword) adminPassword.value = '';

  function showAlert(msg, isSuccess = false) {
    if (!adminLoginAlert) return;
    adminLoginAlert.style.display = 'block';
    if (isSuccess) {
      adminLoginAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      adminLoginAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      adminLoginAlert.style.color = '#059669';
      adminLoginAlert.innerHTML = `<b>🎉 Berhasil:</b> ${msg}`;
    } else {
      adminLoginAlert.style.background = 'rgba(239, 68, 68, 0.15)';
      adminLoginAlert.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      adminLoginAlert.style.color = '#dc2626';
      adminLoginAlert.innerHTML = `<b>⚠️ Gagal Masuk:</b> ${msg}`;
    }
  }

  // Check URL parameters for reasons
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reason') === 'required') {
    showAlert('Silakan login dengan akun Kasir atau Admin Super User untuk mengakses dashboard.');
  } else if (urlParams.get('reason') === 'role_mismatch') {
    showAlert('Akses Ditolak: Halaman dashboard ini hanya diperuntukkan bagi akun Kasir dan Admin Super User.');
  }

  const adminReferralCode = document.getElementById('adminReferralCode');
  const referralCodeWrapper = document.getElementById('referralCodeWrapper');

  function selectRole(role) {
    const isKasir = (role === 'kasir');
    if (adminSelectedRole) adminSelectedRole.value = isKasir ? 'kasir' : 'admin';

    kasirRoleBtn?.classList.toggle('active', isKasir);
    adminRoleBtn?.classList.toggle('active', !isKasir);

    if (isKasir) {
      if (referralCodeWrapper) referralCodeWrapper.style.display = 'none';
      if (adminReferralCode) adminReferralCode.removeAttribute('required');
      if (adminSubmitBtn) {
        adminSubmitBtn.innerHTML = '<span>Masuk sebagai Kasir Meja 1 📋</span>';
      }
    } else {
      if (referralCodeWrapper) referralCodeWrapper.style.display = 'block';
      if (adminReferralCode) adminReferralCode.setAttribute('required', 'true');
      if (adminSubmitBtn) {
        adminSubmitBtn.innerHTML = '<span>Buka Akses Penuh Admin Super User 🚀</span>';
      }
    }
  }

  kasirRoleBtn?.addEventListener('click', () => selectRole('kasir'));
  adminRoleBtn?.addEventListener('click', () => selectRole('admin'));

  // Default initialize role button states to Kasir
  selectRole('kasir');

  toggleAdminPassBtn?.addEventListener('click', () => {
    if (!adminPassword) return;
    if (adminPassword.type === 'password') {
      adminPassword.type = 'text';
      toggleAdminPassBtn.textContent = '🔒';
    } else {
      adminPassword.type = 'password';
      toggleAdminPassBtn.textContent = '👁️';
    }
  });

  // Elements for Tabs and Forms
  const tabAdminLoginBtn = document.getElementById('tabAdminLoginBtn');
  const tabAdminRegisterBtn = document.getElementById('tabAdminRegisterBtn');
  const loginRoleGroup = document.getElementById('loginRoleGroup');
  const adminRegisterForm = document.getElementById('adminRegisterForm');
  const firstTimeSetupNotice = document.getElementById('firstTimeSetupNotice');

  const regAdminName = document.getElementById('regAdminName');
  const regAdminUser = document.getElementById('regAdminUser');
  const regAdminEmail = document.getElementById('regAdminEmail');
  const regAdminPhone = document.getElementById('regAdminPhone');
  const regAdminPass = document.getElementById('regAdminPass');
  const regAdminRole = document.getElementById('regAdminRole');
  const regReferralWrapper = document.getElementById('regReferralWrapper');
  const regAdminReferral = document.getElementById('regAdminReferral');
  const regAdminSubmitBtn = document.getElementById('regAdminSubmitBtn');

  function switchTab(mode) {
    if (mode === 'register') {
      if (tabAdminLoginBtn) {
        tabAdminLoginBtn.style.background = 'transparent';
        tabAdminLoginBtn.style.color = '#64748b';
        tabAdminLoginBtn.style.boxShadow = 'none';
      }
      if (tabAdminRegisterBtn) {
        tabAdminRegisterBtn.style.background = '#ffffff';
        tabAdminRegisterBtn.style.color = '#059669';
        tabAdminRegisterBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }
      if (loginRoleGroup) loginRoleGroup.style.display = 'none';
      if (adminLoginForm) adminLoginForm.style.display = 'none';
      if (adminRegisterForm) adminRegisterForm.style.display = 'block';
    } else {
      if (tabAdminLoginBtn) {
        tabAdminLoginBtn.style.background = '#ffffff';
        tabAdminLoginBtn.style.color = '#7c3aed';
        tabAdminLoginBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
      }
      if (tabAdminRegisterBtn) {
        tabAdminRegisterBtn.style.background = 'transparent';
        tabAdminRegisterBtn.style.color = '#64748b';
        tabAdminRegisterBtn.style.boxShadow = 'none';
      }
      if (loginRoleGroup) loginRoleGroup.style.display = 'grid';
      if (adminLoginForm) adminLoginForm.style.display = 'block';
      if (adminRegisterForm) adminRegisterForm.style.display = 'none';
    }
  }

  tabAdminLoginBtn?.addEventListener('click', () => switchTab('login'));
  tabAdminRegisterBtn?.addEventListener('click', () => switchTab('register'));

  regAdminRole?.addEventListener('change', () => {
    if (regReferralWrapper) {
      regReferralWrapper.style.display = (regAdminRole.value === 'admin' || regAdminRole.value === 'owner') ? 'block' : 'none';
    }
  });

  // Check setup status: whether any admin accounts exist
  async function checkSetupStatus() {
    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }
      const res = await fetch(`${apiBase}/api/auth/setup-status`);
      const data = await res.json();
      if (data.success && !data.hasAdmin) {
        if (firstTimeSetupNotice) firstTimeSetupNotice.style.display = 'block';
      } else {
        if (firstTimeSetupNotice) firstTimeSetupNotice.style.display = 'none';
      }
    } catch (_) {}
  }
  checkSetupStatus();

  // Registration Form Submission
  adminRegisterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = regAdminName?.value.trim();
    const username = regAdminUser?.value.trim().toLowerCase();
    const email = regAdminEmail?.value.trim().toLowerCase();
    const phone = regAdminPhone?.value.trim();
    const password = regAdminPass?.value.trim();
    const role = regAdminRole?.value || 'kasir';
    const referralCode = regAdminReferral?.value.trim() || 'NGALAM-SUPER-2026';

    if (!name || !username || !password) {
      showAlert('Nama lengkap, username, dan kata sandi wajib diisi.');
      return;
    }

    if (regAdminSubmitBtn) {
      regAdminSubmitBtn.disabled = true;
      regAdminSubmitBtn.innerHTML = '<span>⏳ Menyimpan ke Database & Google Sheets...</span>';
    }

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/auth/register-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, phone, password, role, referralCode }),
      });
      const data = await res.json();

      if (data.success) {
        showAlert(data.message || 'Pendaftaran akun berhasil! Silakan login.', true);
        if (firstTimeSetupNotice) firstTimeSetupNotice.style.display = 'none';
        switchTab('login');
        if (adminIdentifier) adminIdentifier.value = username;
        if (adminPassword) {
          adminPassword.value = password;
          adminPassword.focus();
        }
        selectRole(role);
      } else {
        showAlert(data.message || data.error || 'Gagal mendaftarkan akun staf.');
      }
    } catch (err) {
      showAlert('Gagal menghubungi server: ' + err.message);
    } finally {
      if (regAdminSubmitBtn) {
        regAdminSubmitBtn.disabled = false;
        regAdminSubmitBtn.innerHTML = '<span>Daftarkan Akun & Sinkronkan ke Sheets 🚀</span>';
      }
    }
  });

  adminLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = adminIdentifier?.value.trim();
    const password = adminPassword?.value.trim();
    const role = adminSelectedRole?.value || 'kasir';
    const referralCode = adminReferralCode?.value.trim() || '';

    if (!identifier || !password) {
      showAlert('Silakan isi username dan kata sandi.');
      return;
    }

    if ((role === 'admin' || role === 'owner') && !referralCode) {
      showAlert('Akses Admin (Super User) membutuhkan Kode Referral Otorisasi. Masukkan kode referral yang valid.');
      adminReferralCode?.focus();
      return;
    }

    // Prevent teknisi/mitra from logging into admin dashboard
    if (identifier.toLowerCase() === 'teknisi' || identifier.toLowerCase() === 'mitra') {
      showAlert('Akun Teknisi dan Mitra memiliki portal pengerjaan tersendiri. Silakan login di: <a href="../teknisi/login.html" style="color: #0284c7; font-weight: 700;">Portal Teknisi & Mitra ↗</a>');
      return;
    }

    if (adminSubmitBtn) {
      adminSubmitBtn.disabled = true;
      adminSubmitBtn.innerHTML = '<span>⏳ Memverifikasi Otoritas Akun...</span>';
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
        body: JSON.stringify({ identifier, password, role, referralCode }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        if (data.user.role !== 'admin' && data.user.role !== 'owner' && data.user.role !== 'kasir') {
          showAlert('Akses Ditolak: Hanya Kasir Meja 1 dan Admin Super User yang diizinkan masuk.');
          return;
        }

        const roleTitle = (data.user.role === 'kasir') ? 'Kasir Meja 1' : 'Admin Super User';
        showAlert(data.message || `Login berhasil sebagai ${roleTitle}! Mengalihkan...`, true);
        const storage = adminRememberCheck?.checked ? localStorage : sessionStorage;
        storage.setItem('ngalam_auth_user', JSON.stringify(data.user));
        localStorage.setItem('ngalam_auth_user', JSON.stringify(data.user));
        document.cookie = `ngalam_token=${data.user.token}; path=/; max-age=86400; SameSite=Lax`;

        const redirectTarget = urlParams.get('redirect') || 'index.html';
        setTimeout(() => {
          window.location.replace(redirectTarget);
        }, 400);
      } else {
        showAlert(data.error || data.message || 'Username atau password salah.');
      }
    } catch (err) {
      showAlert('Gagal menghubungi server: ' + err.message);
    } finally {
      if (adminSubmitBtn) {
        adminSubmitBtn.disabled = false;
        adminSubmitBtn.innerHTML = '<span>Masuk ke Dashboard Operasional 🚀</span>';
      }
    }
  });
});
