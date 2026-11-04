/**
 * NGALAM FIX PRO - Modul Khusus Login & Registrasi Pelanggan (Customer Auth Portal)
 * Didedikasikan 100% untuk Autentikasi Member Pelanggan, Profil, dan Daftar Perangkat Pribadi.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  // DOM Elements - Mode Toggle
  const btnCustModeLogin = document.getElementById('btnCustModeLogin');
  const btnCustModeRegister = document.getElementById('btnCustModeRegister');
  const customerLoginSubView = document.getElementById('customerLoginSubView');
  const customerRegisterSubView = document.getElementById('customerRegisterSubView');
  const linkSwitchToRegister = document.getElementById('linkSwitchToRegister');
  const linkSwitchToLogin = document.getElementById('linkSwitchToLogin');

  // DOM Elements - Login
  const customerLoginForm = document.getElementById('customerLoginForm');
  const custIdentifier = document.getElementById('custIdentifier');
  const custPin = document.getElementById('custPin');
  const toggleCustPinBtn = document.getElementById('toggleCustPinBtn');
  const custLoginSubmitBtn = document.getElementById('custLoginSubmitBtn');
  const customerLoginAlert = document.getElementById('customerLoginAlert');

  // Periksa apakah pelanggan sudah memiliki sesi tersimpan
  const urlParams = new URLSearchParams(window.location.search);
  const isCustLoggedOut = urlParams.get('action') === 'logout';
  if (isCustLoggedOut) {
    try {
      localStorage.removeItem('ngalam_customer_session');
      sessionStorage.removeItem('ngalam_customer_session');
    } catch (_) {}
  }

  // DOM Elements - Register
  const customerRegisterForm = document.getElementById('customerRegisterForm');
  const regCustName = document.getElementById('regCustName');
  const regCustWa = document.getElementById('regCustWa');
  const regCustEmail = document.getElementById('regCustEmail');
  const regCustDistrict = document.getElementById('regCustDistrict');
  const regCustPin = document.getElementById('regCustPin');
  const regCustPinConfirm = document.getElementById('regCustPinConfirm');
  const toggleRegPinBtn = document.getElementById('toggleRegPinBtn');
  const custRegSubmitBtn = document.getElementById('custRegSubmitBtn');
  const customerRegisterAlert = document.getElementById('customerRegisterAlert');

  // DOM Elements - Logged-in Customer Area
  const unloggedCustomerView = document.getElementById('unloggedCustomerView');
  const loggedInCustomerView = document.getElementById('loggedInCustomerView');
  const custProfileName = document.getElementById('custProfileName');
  const custProfileWa = document.getElementById('custProfileWa');
  const custProfileDistrict = document.getElementById('custProfileDistrict');
  const custTotalOrdersCount = document.getElementById('custTotalOrdersCount');
  const custActiveOrdersCount = document.getElementById('custActiveOrdersCount');
  const custOrdersList = document.getElementById('custOrdersList');
  const custLogoutBtn = document.getElementById('custLogoutBtn');

  // Mode switching between Login & Register
  function switchToLoginMode() {
    btnCustModeLogin?.classList.add('active');
    btnCustModeRegister?.classList.remove('active');
    if (btnCustModeLogin) {
      btnCustModeLogin.style.background = '#ffffff';
      btnCustModeLogin.style.color = '#0284c7';
      btnCustModeLogin.style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)';
    }
    if (btnCustModeRegister) {
      btnCustModeRegister.style.background = 'transparent';
      btnCustModeRegister.style.color = '#64748b';
      btnCustModeRegister.style.boxShadow = 'none';
    }
    if (customerLoginSubView) customerLoginSubView.style.display = 'block';
    if (customerRegisterSubView) customerRegisterSubView.style.display = 'none';
    if (customerLoginAlert) customerLoginAlert.style.display = 'none';
  }

  function switchToRegisterMode(presetWa = '') {
    btnCustModeRegister?.classList.add('active');
    btnCustModeLogin?.classList.remove('active');
    if (btnCustModeRegister) {
      btnCustModeRegister.style.background = '#ffffff';
      btnCustModeRegister.style.color = '#059669';
      btnCustModeRegister.style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)';
    }
    if (btnCustModeLogin) {
      btnCustModeLogin.style.background = 'transparent';
      btnCustModeLogin.style.color = '#64748b';
      btnCustModeLogin.style.boxShadow = 'none';
    }
    if (customerLoginSubView) customerLoginSubView.style.display = 'none';
    if (customerRegisterSubView) customerRegisterSubView.style.display = 'block';
    if (customerRegisterAlert) customerRegisterAlert.style.display = 'none';

    if (presetWa && regCustWa) {
      regCustWa.value = presetWa;
      regCustName?.focus();
    }
  }

  btnCustModeLogin?.addEventListener('click', switchToLoginMode);
  btnCustModeRegister?.addEventListener('click', () => switchToRegisterMode());
  linkSwitchToRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    switchToRegisterMode(custIdentifier?.value.trim());
  });
  linkSwitchToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    switchToLoginMode();
    custIdentifier?.focus();
  });

  // Check URL parameters for tab
  if (urlParams.get('mode') === 'register') {
    switchToRegisterMode();
  }

  // Dynamic custom city input when "Luar Malang Raya" is selected
  const regCustomCityWrapper = document.getElementById('regCustomCityWrapper');
  const regCustCustomCity = document.getElementById('regCustCustomCity');

  regCustDistrict?.addEventListener('change', () => {
    const isLuar = regCustDistrict.value === 'Luar Malang Raya';
    if (regCustomCityWrapper) {
      regCustomCityWrapper.style.display = isLuar ? 'block' : 'none';
    }
    if (regCustCustomCity) {
      if (isLuar) {
        regCustCustomCity.setAttribute('required', 'true');
        setTimeout(() => regCustCustomCity.focus(), 50);
      } else {
        regCustCustomCity.removeAttribute('required');
        regCustCustomCity.value = '';
      }
    }
  });


  // Toggle PIN visibility
  toggleCustPinBtn?.addEventListener('click', () => {
    if (!custPin) return;
    const isPass = (custPin.type === 'password');
    custPin.type = isPass ? 'text' : 'password';
    const eyeOpen = toggleCustPinBtn.querySelector('.eye-icon-open');
    const eyeClosed = toggleCustPinBtn.querySelector('.eye-icon-closed');
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPass ? 'none' : 'block';
      eyeClosed.style.display = isPass ? 'block' : 'none';
    } else {
      toggleCustPinBtn.textContent = isPass ? '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  });

  toggleRegPinBtn?.addEventListener('click', () => {
    if (!regCustPin) return;
    const isPass = (regCustPin.type === 'password');
    regCustPin.type = isPass ? 'text' : 'password';
    if (regCustPinConfirm) regCustPinConfirm.type = isPass ? 'text' : 'password';
    const eyeOpen = toggleRegPinBtn.querySelector('.eye-icon-open');
    const eyeClosed = toggleRegPinBtn.querySelector('.eye-icon-closed');
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPass ? 'none' : 'block';
      eyeClosed.style.display = isPass ? 'block' : 'none';
    } else {
      toggleRegPinBtn.textContent = isPass ? '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' : '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  });

  function showCustLoginAlert(msg, isSuccess = false) {
    if (!customerLoginAlert) return;
    customerLoginAlert.style.display = 'block';
    if (isSuccess) {
      customerLoginAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      customerLoginAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      customerLoginAlert.style.color = '#059669';
      customerLoginAlert.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Berhasil:</b> ${msg}`;
    } else {
      customerLoginAlert.style.background = 'rgba(239, 68, 68, 0.15)';
      customerLoginAlert.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      customerLoginAlert.style.color = '#dc2626';
      customerLoginAlert.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Peringatan:</b> ${msg}`;
    }
  }

  function showCustRegisterAlert(msg, isSuccess = false) {
    if (!customerRegisterAlert) return;
    customerRegisterAlert.style.display = 'block';
    if (isSuccess) {
      customerRegisterAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      customerRegisterAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      customerRegisterAlert.style.color = '#059669';
      customerRegisterAlert.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Berhasil:</b> ${msg}`;
    } else {
      customerRegisterAlert.style.background = 'rgba(239, 68, 68, 0.15)';
      customerRegisterAlert.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      customerRegisterAlert.style.color = '#dc2626';
      customerRegisterAlert.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Gagal Registrasi:</b> ${msg}`;
    }
  }

  // Handle Customer Login Submit
  customerLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = custIdentifier?.value.trim();
    const pin = custPin?.value.trim();

    if (!identifier) {
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Nomor WhatsApp / Identitas Wajib Diisi',
          message: 'Silakan masukkan nomor WhatsApp atau email Anda untuk membuka riwayat servis.',
          targetInputId: 'custIdentifier'
        });
      }
      showCustLoginAlert('Silakan masukkan nomor WhatsApp atau nomor tiket Anda.');
      return;
    }

    if (custLoginSubmitBtn) {
      custLoginSubmitBtn.disabled = true;
      custLoginSubmitBtn.innerHTML = '<span>⏳ Memeriksa Data Pelanggan...</span>';
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

      const res = await fetch(`${apiBase}/api/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin }),
      });
      const data = await res.json();

      if (data.success && data.customer) {
        showCustLoginAlert(data.message || 'Login berhasil!', true);
        localStorage.setItem('ngalam_customer_session', JSON.stringify({
          ...data.customer,
          savedOrders: data.orders || []
        }));

        if (window.showAuthSuccessModal) {
          window.showAuthSuccessModal({
            title: 'Login Berhasil!',
            subtitle: `Selamat datang kembali, ${data.customer.name}!`,
            user: {
              name: data.customer.name,
              role: 'customer',
              roleText: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> Pelanggan Member Terdaftar',
              avatar: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>'
            },
            duration: 1300,
            onComplete: () => {
              renderCustomerDashboard(data.customer, data.orders || []);
            }
          });
          return;
        }

        setTimeout(() => {
          renderCustomerDashboard(data.customer, data.orders || []);
        }, 600);
      } else if (data.needRegister) {
        const needMsg = data.message || 'Nomor WhatsApp belum terdaftar di database pelanggan kami.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Nomor Belum Terdaftar',
            message: needMsg,
            hints: [
              'Pastikan nomor WhatsApp yang Anda ketik sesuai saat menyerahkan unit HP.',
              'Jika ini servis pertama Anda, silakan tekan tombol di bawah untuk mendaftar baru.'
            ],
            targetInputId: 'custIdentifier',
            onRetry: () => {
              switchToRegisterMode(identifier);
            }
          });
        }
        showCustLoginAlert(needMsg);
        setTimeout(() => {
          switchToRegisterMode(identifier);
        }, 1200);
      } else {
        const errMsg = data.message || 'Nomor WhatsApp atau PIN Anda tidak cocok.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Login Pelanggan Gagal!',
            message: errMsg,
            hints: [
              'PIN standar akun pelanggan baru adalah <b>123456</b> jika belum pernah diubah.',
              'Periksa kembali nomor WhatsApp dan ketelitian penulisan angka.',
              'Jika lupa PIN, hubungi CS Workshop melalui WhatsApp untuk verifikasi tiket.'
            ],
            targetInputId: 'custPin'
          });
        }
        showCustLoginAlert(errMsg);
      }
    } catch (err) {
      console.warn('[Customer Login] Server fetch error:', err);
      const errMsg = 'Gagal terhubung ke server: ' + (err.message || 'Periksa koneksi jaringan Anda.');
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Koneksi Server Gagal',
          message: errMsg
        });
      }
      showCustLoginAlert(errMsg);
    } finally {
      if (custLoginSubmitBtn) {
        custLoginSubmitBtn.disabled = false;
        custLoginSubmitBtn.innerHTML = '<span>Buka Dashboard Servis Pelanggan <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>';
      }
    }
  });

  // Handle Customer Registration Submit
  customerRegisterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = regCustName?.value.trim();
    const whatsapp = regCustWa?.value.trim();
    const email = regCustEmail?.value.trim();
    let district = regCustDistrict?.value || 'Klojen, Kota Malang';
    const pin = regCustPin?.value.trim();
    const pinConfirm = regCustPinConfirm?.value.trim();

    if (!name || !whatsapp) {
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Kolom Wajib Diisi',
          message: 'Nama lengkap dan nomor WhatsApp aktif wajib diisi untuk pendaftaran member.',
          targetInputId: !name ? 'regCustName' : 'regCustWa'
        });
      }
      showCustRegisterAlert('Nama lengkap dan nomor WhatsApp wajib diisi.');
      return;
    }

    if (district === 'Luar Malang Raya') {
      const customCity = document.getElementById('regCustCustomCity')?.value.trim();
      if (!customCity) {
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Kota Domisili Diperlukan',
            message: 'Silakan tuliskan nama kota atau kabupaten domisili Anda.',
            targetInputId: 'regCustCustomCity'
          });
        }
        showCustRegisterAlert('Silakan tuliskan nama kota / kabupaten domisili Anda.');
        document.getElementById('regCustCustomCity')?.focus();
        return;
      }
      district = `Luar Malang (${customCity})`;
    }

    if (pin && pinConfirm && pin !== pinConfirm) {
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Konfirmasi PIN Tidak Cocok',
          message: 'Konfirmasi PIN yang Anda masukkan tidak sama dengan PIN yang dibuat.',
          targetInputId: 'regCustPinConfirm'
        });
      }
      showCustRegisterAlert('Konfirmasi PIN tidak cocok dengan PIN yang dibuat.');
      return;
    }

    if (custRegSubmitBtn) {
      custRegSubmitBtn.disabled = true;
      custRegSubmitBtn.innerHTML = '<span>⏳ Mendaftarkan Akun...</span>';
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

      const referredByMitra = localStorage.getItem('ngalam_affiliate_ref') || '';
      const res = await fetch(`${apiBase}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, email, district, pin, referredByMitra }),
      });
      const data = await res.json();

      if (data.success && data.customer) {
        showCustRegisterAlert(data.message || 'Registrasi akun member berhasil!', true);
        localStorage.setItem('ngalam_customer_session', JSON.stringify({
          ...data.customer,
          savedOrders: data.orders || []
        }));

        if (window.showAuthSuccessModal) {
          window.showAuthSuccessModal({
            title: 'Registrasi Member Berhasil!',
            subtitle: `Selamat datang di keluarga Ngalam Fix Pro, ${data.customer.name}!`,
            user: {
              name: data.customer.name,
              role: 'customer',
              roleText: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> Pelanggan Member Terdaftar (Garansi 90 Hari)',
              avatar: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>'
            },
            duration: 1350,
            onComplete: () => {
              renderCustomerDashboard(data.customer, data.orders || []);
            }
          });
          return;
        }

        setTimeout(() => {
          renderCustomerDashboard(data.customer, data.orders || []);
        }, 800);
      } else {
        const errMsg = data.message || 'Gagal mendaftarkan akun pelanggan.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Pendaftaran Gagal!',
            message: errMsg,
            targetInputId: 'regCustWa'
          });
        }
        showCustRegisterAlert(errMsg);
      }
    } catch (err) {
      const errMsg = 'Terjadi kesalahan jaringan saat registrasi: ' + err.message;
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Koneksi Server Gagal',
          message: errMsg
        });
      }
      showCustRegisterAlert(errMsg);
    } finally {
      if (custRegSubmitBtn) {
        custRegSubmitBtn.disabled = false;
        custRegSubmitBtn.innerHTML = '<span>Daftar & Buat Akun Member Sekarang <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>';
      }
    }
  });

  // DOM Elements - Warranty & Metrics
  const custWarrantyCount = document.getElementById('custWarrantyCount');
  const btnSyncDatabaseManual = document.getElementById('btnSyncDatabaseManual');
  const warrantyModal = document.getElementById('warrantyModal');
  const closeWarrantyModalBtn = document.getElementById('closeWarrantyModalBtn');
  const printWarrantyBtn = document.getElementById('printWarrantyBtn');
  const claimModalWaBtn = document.getElementById('claimModalWaBtn');

  // Modal Fields
  const modalWarrantyCode = document.getElementById('modalWarrantyCode');
  const modalWarrantyStatusBadge = document.getElementById('modalWarrantyStatusBadge');
  const modalCustomerName = document.getElementById('modalCustomerName');
  const modalCustomerWa = document.getElementById('modalCustomerWa');
  const modalPhoneType = document.getElementById('modalPhoneType');
  const modalTicketId = document.getElementById('modalTicketId');
  const modalRepairScope = document.getElementById('modalRepairScope');
  const modalStartDate = document.getElementById('modalStartDate');
  const modalEndDate = document.getElementById('modalEndDate');
  const modalDaysRemaining = document.getElementById('modalDaysRemaining');
  const modalTechName = document.getElementById('modalTechName');

  // Client-side warranty calculator fallback jika order belum memiliki objek warranty dari server
  function ensureOrderWarranty(o, custName = '') {
    if (o.warranty && o.warranty.warrantyCode) return o.warranty;

    const step = parseInt(o.step || 1, 10);
    const durationDays = 90;
    const now = new Date();
    const endDate = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
    const formatDate = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const isDone = step >= 5;
    const cleanNum = String(o.id || '90D').replace(/[^0-9]/g, '').slice(-8) || '90D';
    const warrantyCode = `GAR-90D-${cleanNum}`;

    const waText = encodeURIComponent(
      `Halo Admin & CS Ngalam Fix Pro,\n\nSaya ingin klaim garansi resmi 90 hari untuk unit servis saya:\n` +
      `• Nomor Tiket: ${o.id || '-'}\n` +
      `• Tipe Smartphone: ${o.phoneType || '-'}\n` +
      `• Nama Pemilik: ${custName || '-'}\n` +
      `• Kode Sertifikat: ${warrantyCode}\n\n` +
      `Mohon dibantu jadwal pengecekan unit di workshop. Terima kasih!`
    );

    return {
      warrantyCode,
      durationDays: 90,
      startDate: formatDate(now),
      endDate: formatDate(endDate),
      daysRemaining: 90,
      isExpired: false,
      isActive: isDone,
      isPendingCompletion: !isDone,
      statusLabel: isDone ? '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Garansi Resmi Aktif (Sisa 90 Hari)' : '⏳ Garansi Siaga (Lab Workshop)',
      statusBadgeClass: isDone ? 'active' : 'pending',
      coverage: 'Garansi Komponen/Sparepart Asli, Kalibrasi Hardware & Bebas Biaya Jasa Pemasangan Ulang',
      claimWaUrl: `https://wa.me/6281330304321?text=${waText}`
    };
  }

  // Render Logged-In Customer Personal Dashboard
  function renderCustomerDashboard(customer, orders = []) {
    if (!loggedInCustomerView || !unloggedCustomerView) return;

    unloggedCustomerView.style.display = 'none';
    loggedInCustomerView.style.display = 'block';

    const customerPortalContainer = document.getElementById('customerPortalContainer');
    if (customerPortalContainer) {
      customerPortalContainer.classList.add('is-dashboard');
      customerPortalContainer.classList.add('expanded');
    }

    const customerHeroTitle = document.getElementById('customerHeroTitle');
    const customerHeroDesc = document.getElementById('customerHeroDesc');
    if (customerHeroTitle) customerHeroTitle.textContent = 'Dashboard Layanan & Garansi Pelanggan';
    if (customerHeroDesc) customerHeroDesc.textContent = `Selamat datang kembali, ${customer.name || 'Pelanggan'}! Pantau status unit servis dan sertifikat garansi resmi 90 hari Anda.`;

    if (custProfileName) custProfileName.textContent = customer.name || 'Pelanggan Setia';
    if (custProfileWa) custProfileWa.textContent = customer.whatsapp || '-';
    if (custProfileDistrict) custProfileDistrict.textContent = customer.district || 'Malang';

    // Pastikan setiap order memiliki warranty
    const processedOrders = orders.map(o => {
      o.warranty = ensureOrderWarranty(o, customer.name);
      return o;
    });

    const activeCount = processedOrders.filter((o) => parseInt(o.step || 1, 10) < 5).length;
    const activeWarrantiesCount = processedOrders.filter((o) => o.warranty && o.warranty.isActive).length;

    if (custTotalOrdersCount) custTotalOrdersCount.textContent = `${processedOrders.length} Unit`;
    if (custActiveOrdersCount) custActiveOrdersCount.textContent = `${activeCount} Unit`;
    if (custWarrantyCount) custWarrantyCount.textContent = `${activeWarrantiesCount} Unit Aktif`;

    if (!custOrdersList) return;

    if (processedOrders.length === 0) {
      custOrdersList.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 16px;">
          <div style="font-size: 2.8rem; margin-bottom: 8px;"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg></div>
          <strong style="color: #0f172a; font-size: 1.1rem; display: block;">Belum Ada Riwayat Servis Aktif</strong>
          <p style="color: #64748b; font-size: 0.88rem; max-width: 440px; margin: 6px auto 18px;">
            Akun Anda telah terdaftar aktif di database sistem workshop. Tekan tombol di bawah untuk memesan servis HP baru dengan jaminan garansi 90 hari.
          </p>
          <a href="../pesan-servis/index.html" class="btn small" style="background: #0284c7; text-decoration: none; border-radius: 10px;">
            <span>Booking Servis HP Sekarang <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>
          </a>
        </div>
      `;
      return;
    }

    custOrdersList.innerHTML = processedOrders.map((o) => {
      const step = parseInt(o.step || 1, 10);
      const isDone = step >= 5;
      const statusColor = isDone ? '#059669' : '#0284c7';
      const statusBg = isDone ? '#ecfdf5' : '#eff6ff';
      const w = o.warranty;

      let warrantyBadgeHtml = '';
      if (w.isActive) {
        warrantyBadgeHtml = `<span class="warranty-pill-active"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> GARANSI 90 HARI AKTIF</span>`;
      } else if (w.isPendingCompletion) {
        warrantyBadgeHtml = `<span class="warranty-pill-pending">⏳ GARANSI SIAGA (LAB WORKSHOP)</span>`;
      } else {
        warrantyBadgeHtml = `<span class="warranty-pill-expired"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> GARANSI TELAH BERAKHIR</span>`;
      }

      const progressPercent = w.isActive ? Math.max(8, Math.round(((90 - w.daysRemaining) / 90) * 100)) : (w.isPendingCompletion ? 15 : 100);
      const progressColor = w.isExpired ? '#94a3b8' : (w.isPendingCompletion ? '#f59e0b' : 'linear-gradient(90deg, #10b981, #0284c7)');

      const safeOrderJson = encodeURIComponent(JSON.stringify(o));

      return `
        <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 22px; margin-bottom: 18px; box-shadow: 0 4px 12px rgba(15,23,42,0.04); transition: transform 0.2s ease;">
          <!-- Top Row: Ticket ID, Status Badge & Cost -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span style="font-weight: 800; color: #0284c7; background: #eff6ff; padding: 4px 10px; border-radius: 8px; font-size: 0.85rem; border: 1px solid #bae6fd; font-family: monospace;">${o.id}</span>
                <span style="font-size: 0.78rem; font-weight: 700; color: ${statusColor}; background: ${statusBg}; padding: 3px 10px; border-radius: 999px;">
                  Tahap ${step}/5: ${o.status}
                </span>
                <span style="font-size: 0.75rem; color: #64748b;"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ${o.createdAt || 'Hari Ini'}</span>
              </div>
              <h4 style="margin: 8px 0 2px; font-size: 1.25rem; color: #0f172a; font-weight: 800;">${o.phoneType}</h4>
              <p style="margin: 0; font-size: 0.86rem; color: #64748b;">Kerusakan: <strong style="color: #334155;">${o.damageDescription}</strong></p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; color: #64748b; display: block;">Total Biaya Servis</span>
              <strong style="font-size: 1.3rem; color: #0f172a;">${o.cost}</strong>
              <small style="font-size: 0.75rem; color: #059669; display: block; font-weight: 600;"><svg class="svg-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Termasuk Biaya Part & Lab</small>
            </div>
          </div>

          <!-- Diagnosa & Tindakan Lab Workshop -->
          <div style="background: #f8fafc; border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; margin-bottom: 14px; border: 1px solid #f1f5f9;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="color: #64748b; font-size: 0.76rem; font-weight: 700;">DIAGNOSA & TINDAKAN LAB WORKSHOP:</span>
              <span style="font-size: 0.75rem; color: #0284c7; font-weight: 600;">Teknisi: ${o.technician || 'Workshop Lab'}</span>
            </div>
            <strong style="color: #334155; display: block; line-height: 1.45;">${o.diagnoseNote}</strong>
          </div>

          <!-- DEDICATED 90-DAY LAB WARRANTY CARD -->
          <div class="warranty-card-box ${w.statusBadgeClass}">
            <div class="warranty-header-row">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                ${warrantyBadgeHtml}
                <span style="font-size: 0.76rem; color: #64748b; font-family: monospace; font-weight: 700; background: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">${w.warrantyCode}</span>
              </div>
              <div class="warranty-countdown-badge">
                ${w.isActive 
                  ? `<span>⏳ Sisa Masa Garansi: <b style="color: #059669; font-size: 0.92rem;">${w.daysRemaining} Hari</b></span>` 
                  : (w.isPendingCompletion 
                    ? `<span style="color: #d97706;">Siap Aktif Pasca Pengambilan Unit</span>` 
                    : `<span style="color: #dc2626;">Berakhir: ${w.endDate}</span>`)}
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="warranty-progress-bar-bg" title="Masa pemakaian garansi 90 hari">
              <div class="warranty-progress-bar-fill" style="width: ${progressPercent}%; background: ${progressColor};"></div>
            </div>

            <!-- Warranty Metadata Grid -->
            <div class="warranty-meta-grid">
              <div>
                <span style="color: #64748b; font-size: 0.73rem; display: block;">Masa Berlaku Garansi:</span>
                <strong style="font-size: 0.84rem; color: #0f172a;">${w.startDate} s/d ${w.endDate}</strong>
              </div>
              <div>
                <span style="color: #64748b; font-size: 0.73rem; display: block;">Cakupan Jaminan Lab:</span>
                <strong style="font-size: 0.84rem; color: #0369a1;">Sparepart Asli & Jasa Lab Bebas Biaya</strong>
              </div>
            </div>
          </div>

          <!-- Card Action Buttons -->
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 14px;">
            <button type="button" class="btn small outline btn-open-warranty-cert" data-order="${safeOrderJson}" style="border-radius: 8px; font-size: 0.82rem; background: #ffffff; border-color: #cbd5e1;" title="Buka Kartu Sertifikat Garansi Resmi">
              <span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> Kartu Garansi Digital</span>
            </button>
            <a href="${w.claimWaUrl}" target="_blank" rel="noopener noreferrer" class="btn small" style="background: linear-gradient(135deg, #0284c7, #0369a1); border-color: #0284c7; border-radius: 8px; text-decoration: none; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;" title="Klaim garansi langsung ke teknisi via WhatsApp">
              <span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Klaim Garansi via WhatsApp</span>
            </a>
            <a href="../lacak/index.html?track=${encodeURIComponent(o.id)}" class="btn small outline" style="border-radius: 8px; text-decoration: none; font-size: 0.82rem; color: #475569;" title="Lihat timeline pengerjaan unit di lab">
              <span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Detail Timeline</span>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to all "Kartu Garansi Digital" buttons
    document.querySelectorAll('.btn-open-warranty-cert').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rawJson = btn.getAttribute('data-order');
        if (!rawJson) return;
        try {
          const order = JSON.parse(decodeURIComponent(rawJson));
          openWarrantyModal(order, customer);
        } catch (err) {
          console.error('Error opening warranty cert:', err);
        }
      });
    });
  }

  // Open Luxury Digital Warranty Modal
  function openWarrantyModal(order, customer) {
    if (!warrantyModal) return;
    const w = order.warranty || ensureOrderWarranty(order, customer.name);

    if (modalWarrantyCode) modalWarrantyCode.textContent = w.warrantyCode;
    if (modalCustomerName) modalCustomerName.textContent = order.customerName || customer.name || 'Pelanggan Setia';
    if (modalCustomerWa) modalCustomerWa.textContent = order.whatsapp || customer.whatsapp || '-';
    if (modalPhoneType) modalPhoneType.textContent = order.phoneType || 'Smartphone';
    if (modalTicketId) modalTicketId.textContent = order.id || 'NGF-TICKET';
    if (modalRepairScope) modalRepairScope.textContent = order.diagnoseNote || order.damageDescription || 'Servis Komponen & Hardware';
    if (modalStartDate) modalStartDate.textContent = w.startDate;
    if (modalEndDate) modalEndDate.textContent = w.endDate;
    if (modalTechName) modalTechName.textContent = order.technician || 'Liem Hingky Liman (Master Tech)';

    if (modalDaysRemaining) {
      if (w.isActive) {
        modalDaysRemaining.textContent = `${w.daysRemaining} Hari Tersisa (Aktif)`;
        modalDaysRemaining.style.color = '#059669';
      } else if (w.isPendingCompletion) {
        modalDaysRemaining.textContent = 'Siaga 90 Hari (Aktif Pasca Pengambilan)';
        modalDaysRemaining.style.color = '#d97706';
      } else {
        modalDaysRemaining.textContent = 'Masa Garansi Berakhir';
        modalDaysRemaining.style.color = '#dc2626';
      }
    }

    if (modalWarrantyStatusBadge) {
      if (w.isActive) {
        modalWarrantyStatusBadge.textContent = '<svg class="svg-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> RESMI TERPROTEKSI (AKTIF)';
        modalWarrantyStatusBadge.style.color = '#059669';
        modalWarrantyStatusBadge.style.background = '#ecfdf5';
        modalWarrantyStatusBadge.style.borderColor = '#a7f3d0';
      } else if (w.isPendingCompletion) {
        modalWarrantyStatusBadge.textContent = '⏳ UNIT DALAM PENGERJAAN LAB';
        modalWarrantyStatusBadge.style.color = '#b45309';
        modalWarrantyStatusBadge.style.background = '#fef3c7';
        modalWarrantyStatusBadge.style.borderColor = '#fde68a';
      } else {
        modalWarrantyStatusBadge.textContent = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> MASA GARANSI BERAKHIR';
        modalWarrantyStatusBadge.style.color = '#64748b';
        modalWarrantyStatusBadge.style.background = '#f1f5f9';
        modalWarrantyStatusBadge.style.borderColor = '#cbd5e1';
      }
    }

    if (claimModalWaBtn) {
      claimModalWaBtn.href = w.claimWaUrl;
    }

    warrantyModal.style.display = 'flex';
  }

  // Close Warranty Modal
  closeWarrantyModalBtn?.addEventListener('click', () => {
    if (warrantyModal) warrantyModal.style.display = 'none';
  });

  warrantyModal?.addEventListener('click', (e) => {
    if (e.target === warrantyModal) {
      warrantyModal.style.display = 'none';
    }
  });

  // Print / Save PDF Warranty Card
  printWarrantyBtn?.addEventListener('click', () => {
    window.print();
  });

  // Refresh Customer Status & Data
  btnSyncDatabaseManual?.addEventListener('click', async () => {
    if (btnSyncDatabaseManual) {
      btnSyncDatabaseManual.disabled = true;
      btnSyncDatabaseManual.innerHTML = '<span>⏳ Memuat...</span>';
    }

    try {
      await loadCustomerOrders();
      alert('<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Status akun dan riwayat servis berhasil diperbarui dari database sistem.');
    } catch (err) {
      alert('Gagal memperbarui data: ' + err.message);
    } finally {
      if (btnSyncDatabaseManual) {
        btnSyncDatabaseManual.disabled = false;
        btnSyncDatabaseManual.innerHTML = '<span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg> Perbarui Status</span>';
      }
    }
  });

  // Handle Logout
  custLogoutBtn?.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin keluar dari akun member pelanggan?')) {
      localStorage.removeItem('ngalam_customer_session');
      sessionStorage.removeItem('ngalam_customer_session');
      if (loggedInCustomerView) loggedInCustomerView.style.display = 'none';
      if (unloggedCustomerView) unloggedCustomerView.style.display = 'block';

      const customerPortalContainer = document.getElementById('customerPortalContainer');
      if (customerPortalContainer) {
        customerPortalContainer.classList.remove('is-dashboard');
        customerPortalContainer.classList.remove('expanded');
      }

      const customerHeroTitle = document.getElementById('customerHeroTitle');
      const customerHeroDesc = document.getElementById('customerHeroDesc');
      if (customerHeroTitle) customerHeroTitle.textContent = 'Masuk Akun Member Pelanggan';
      if (customerHeroDesc) customerHeroDesc.textContent = 'Pantau progres unit smartphone, catatan diagnosa teknisi, dan invoice garansi resmi 90 hari dalam satu dashboard.';

      switchToLoginMode();
    }
  });

  // Tangani redirect balik dari Google OAuth (halaman statis / Vercel)
  const oauthProvider = urlParams.get('auth');
  if (oauthProvider === 'google') {
    const oauthError = urlParams.get('error');
    if (oauthError) {
      const oauthMessages = {
        access_denied: 'Login Google dibatalkan.',
        invalid_state: 'Sesi login Google tidak valid. Silakan coba lagi.',
        google_not_configured: 'Login Google belum dikonfigurasi di server.',
        token_exchange_failed: 'Gagal menukar kode otorisasi Google.',
        profile_fetch_failed: 'Gagal mengambil profil Google.',
        server_error: 'Terjadi kesalahan server saat login Google.'
      };
      showCustLoginAlert(oauthMessages[oauthError] || `Login Google gagal: ${oauthError}`);
    } else {
      try {
        const meRes = await fetch(`${API_BASE}/api/customer/me`, { credentials: 'include' });
        const meData = await meRes.json();
        if (meData.success && meData.customer) {
          let googleCust = meData.customer;
          if (!googleCust.whatsapp) {
            const wa = window.prompt('Nomor WhatsApp wajib diisi untuk menyelesaikan pendaftaran:', '');
            if (!wa) {
              showCustLoginAlert('Nomor WhatsApp wajib diisi agar akun dapat digunakan.');
              switchToLoginMode();
              return;
            }
            const completeRes = await fetch(`${API_BASE}/api/customer/complete-profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ whatsapp: wa })
            });
            const completeData = await completeRes.json();
            if (!completeData.success) {
              showCustLoginAlert(completeData.message || 'Gagal menyimpan nomor WhatsApp.');
              switchToLoginMode();
              return;
            }
            googleCust = completeData.customer;
          }
          localStorage.setItem('ngalam_customer_session', JSON.stringify(googleCust));
          renderCustomerDashboard(googleCust, googleCust.savedOrders || []);
          return;
        }
        showCustLoginAlert(meData.message || 'Sesi Google tidak valid. Silakan login ulang.');
      } catch (_) {
        showCustLoginAlert('Gagal memuat sesi Google.');
      }
    }
  }

  // Restore customer session automatically jika sesi valid tersedia
  try {
    const rawSaved = localStorage.getItem('ngalam_customer_session') || sessionStorage.getItem('ngalam_customer_session');
    if (rawSaved && !isCustLoggedOut) {
      const savedCust = JSON.parse(rawSaved);
      if (savedCust && (savedCust.phone || savedCust.whatsapp || savedCust.name)) {
        renderCustomerDashboard(savedCust, savedCust.savedOrders || []);
        return;
      }
    }
  } catch (_) {}

  // Tampilkan form login jika belum login
  switchToLoginMode();
});

