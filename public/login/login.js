/**
 * NGALAM FIX PRO - Modul Khusus Login & Registrasi Pelanggan (Customer Auth Portal)
 * Didedikasikan 100% untuk Autentikasi Member Pelanggan, Profil, dan Daftar Perangkat Pribadi.
 */

document.addEventListener('DOMContentLoaded', () => {
  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

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

  // Keamanan Ketat: Selalu bersihkan sesi & form saat halaman login dibuka dari beranda / mana pun
  try {
    localStorage.removeItem('ngalam_customer_session');
    sessionStorage.removeItem('ngalam_customer_session');
  } catch (_) {}
  if (custIdentifier) custIdentifier.value = '';
  if (custPin) custPin.value = '';

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
  const urlParams = new URLSearchParams(window.location.search);
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
    if (custPin.type === 'password') {
      custPin.type = 'text';
      toggleCustPinBtn.textContent = '🔒';
    } else {
      custPin.type = 'password';
      toggleCustPinBtn.textContent = '👁️';
    }
  });

  toggleRegPinBtn?.addEventListener('click', () => {
    if (!regCustPin) return;
    const isPass = regCustPin.type === 'password';
    regCustPin.type = isPass ? 'text' : 'password';
    if (regCustPinConfirm) regCustPinConfirm.type = isPass ? 'text' : 'password';
    toggleRegPinBtn.textContent = isPass ? '🔒' : '👁️';
  });

  function showCustLoginAlert(msg, isSuccess = false) {
    if (!customerLoginAlert) return;
    customerLoginAlert.style.display = 'block';
    if (isSuccess) {
      customerLoginAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      customerLoginAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      customerLoginAlert.style.color = '#059669';
      customerLoginAlert.innerHTML = `<b>🎉 Berhasil:</b> ${msg}`;
    } else {
      customerLoginAlert.style.background = 'rgba(239, 68, 68, 0.15)';
      customerLoginAlert.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      customerLoginAlert.style.color = '#dc2626';
      customerLoginAlert.innerHTML = `<b>⚠️ Peringatan:</b> ${msg}`;
    }
  }

  function showCustRegisterAlert(msg, isSuccess = false) {
    if (!customerRegisterAlert) return;
    customerRegisterAlert.style.display = 'block';
    if (isSuccess) {
      customerRegisterAlert.style.background = 'rgba(16, 185, 129, 0.15)';
      customerRegisterAlert.style.border = '1px solid rgba(16, 185, 129, 0.4)';
      customerRegisterAlert.style.color = '#059669';
      customerRegisterAlert.innerHTML = `<b>🎉 Berhasil:</b> ${msg}`;
    } else {
      customerRegisterAlert.style.background = 'rgba(239, 68, 68, 0.15)';
      customerRegisterAlert.style.border = '1px solid rgba(239, 68, 68, 0.4)';
      customerRegisterAlert.style.color = '#dc2626';
      customerRegisterAlert.innerHTML = `<b>⚠️ Gagal Registrasi:</b> ${msg}`;
    }
  }

  // Handle Customer Login Submit
  customerLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = custIdentifier?.value.trim();
    const pin = custPin?.value.trim();

    if (!identifier) {
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
        : 'http://localhost:3000';
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
        setTimeout(() => {
          renderCustomerDashboard(data.customer, data.orders || []);
        }, 600);
      } else if (data.needRegister) {
        showCustLoginAlert(data.message || 'Nomor WhatsApp belum terdaftar. Silakan registrasi terlebih dahulu.');
        setTimeout(() => {
          switchToRegisterMode(identifier);
        }, 1200);
      } else {
        showCustLoginAlert(data.message || 'Gagal masuk akun pelanggan.');
      }
    } catch (err) {
      console.warn('[Customer Login] Server fetch error:', err);
      showCustLoginAlert('Gagal terhubung ke server: ' + (err.message || 'Periksa koneksi jaringan Anda.'));
    } finally {
      if (custLoginSubmitBtn) {
        custLoginSubmitBtn.disabled = false;
        custLoginSubmitBtn.innerHTML = '<span>Buka Dashboard Servis Pelanggan 🚀</span>';
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
      showCustRegisterAlert('Nama lengkap dan nomor WhatsApp wajib diisi.');
      return;
    }

    if (district === 'Luar Malang Raya') {
      const customCity = document.getElementById('regCustCustomCity')?.value.trim();
      if (!customCity) {
        showCustRegisterAlert('Silakan tuliskan nama kota / kabupaten domisili Anda.');
        document.getElementById('regCustCustomCity')?.focus();
        return;
      }
      district = `Luar Malang (${customCity})`;
    }

    if (pin && pinConfirm && pin !== pinConfirm) {
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
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try {
          apiBase = await window.resolveNgalamApiBase();
        } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, whatsapp, email, district, pin }),
      });
      const data = await res.json();

      if (data.success && data.customer) {
        showCustRegisterAlert(data.message || 'Registrasi akun member berhasil!', true);
        localStorage.setItem('ngalam_customer_session', JSON.stringify({
          ...data.customer,
          savedOrders: data.orders || []
        }));
        setTimeout(() => {
          renderCustomerDashboard(data.customer, data.orders || []);
        }, 800);
      } else {
        showCustRegisterAlert(data.message || 'Gagal mendaftarkan akun pelanggan.');
      }
    } catch (err) {
      showCustRegisterAlert('Terjadi kesalahan jaringan saat registrasi.');
    } finally {
      if (custRegSubmitBtn) {
        custRegSubmitBtn.disabled = false;
        custRegSubmitBtn.innerHTML = '<span>Daftar & Buat Akun Member Sekarang 🚀</span>';
      }
    }
  });

  // DOM Elements - Warranty & Metrics
  const custWarrantyCount = document.getElementById('custWarrantyCount');
  const btnSyncSpreadsheetManual = document.getElementById('btnSyncSpreadsheetManual');
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
      statusLabel: isDone ? '🛡️ Garansi Resmi Aktif (Sisa 90 Hari)' : '⏳ Garansi Siaga (Lab Workshop)',
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
          <div style="font-size: 2.8rem; margin-bottom: 8px;">📦✨</div>
          <strong style="color: #0f172a; font-size: 1.1rem; display: block;">Belum Ada Riwayat Servis Aktif</strong>
          <p style="color: #64748b; font-size: 0.88rem; max-width: 440px; margin: 6px auto 18px;">
            Akun Anda telah terdaftar dan terhubung ke Google Spreadsheet <b>DataCustomer</b>. Tekan tombol di bawah untuk memesan servis HP baru dengan jaminan garansi 90 hari.
          </p>
          <a href="../pesan-servis/index.html" class="btn small" style="background: #0284c7; text-decoration: none; border-radius: 10px;">
            <span>Booking Servis HP Sekarang 🚀</span>
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
        warrantyBadgeHtml = `<span class="warranty-pill-active">🛡️ GARANSI 90 HARI AKTIF</span>`;
      } else if (w.isPendingCompletion) {
        warrantyBadgeHtml = `<span class="warranty-pill-pending">⏳ GARANSI SIAGA (LAB WORKSHOP)</span>`;
      } else {
        warrantyBadgeHtml = `<span class="warranty-pill-expired">⚠️ GARANSI TELAH BERAKHIR</span>`;
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
                <span style="font-size: 0.75rem; color: #64748b;">📅 ${o.createdAt || 'Hari Ini'}</span>
              </div>
              <h4 style="margin: 8px 0 2px; font-size: 1.25rem; color: #0f172a; font-weight: 800;">${o.phoneType}</h4>
              <p style="margin: 0; font-size: 0.86rem; color: #64748b;">Kerusakan: <strong style="color: #334155;">${o.damageDescription}</strong></p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; color: #64748b; display: block;">Total Biaya Servis</span>
              <strong style="font-size: 1.3rem; color: #0f172a;">${o.cost}</strong>
              <small style="font-size: 0.75rem; color: #059669; display: block; font-weight: 600;">✓ Termasuk Biaya Part & Lab</small>
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
              <span>📄 Kartu Garansi Digital</span>
            </button>
            <a href="${w.claimWaUrl}" target="_blank" rel="noopener noreferrer" class="btn small" style="background: linear-gradient(135deg, #0284c7, #0369a1); border-color: #0284c7; border-radius: 8px; text-decoration: none; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px;" title="Klaim garansi langsung ke teknisi via WhatsApp">
              <span>🛡️ Klaim Garansi via WhatsApp</span>
            </a>
            <a href="../lacak/index.html?track=${encodeURIComponent(o.id)}" class="btn small outline" style="border-radius: 8px; text-decoration: none; font-size: 0.82rem; color: #475569;" title="Lihat timeline pengerjaan unit di lab">
              <span>🔍 Detail Timeline</span>
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
        modalWarrantyStatusBadge.textContent = '✓ RESMI TERPROTEKSI (AKTIF)';
        modalWarrantyStatusBadge.style.color = '#059669';
        modalWarrantyStatusBadge.style.background = '#ecfdf5';
        modalWarrantyStatusBadge.style.borderColor = '#a7f3d0';
      } else if (w.isPendingCompletion) {
        modalWarrantyStatusBadge.textContent = '⏳ UNIT DALAM PENGERJAAN LAB';
        modalWarrantyStatusBadge.style.color = '#b45309';
        modalWarrantyStatusBadge.style.background = '#fef3c7';
        modalWarrantyStatusBadge.style.borderColor = '#fde68a';
      } else {
        modalWarrantyStatusBadge.textContent = '⚠️ MASA GARANSI BERAKHIR';
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

  // Manual Google Spreadsheet Sync Trigger Button
  btnSyncSpreadsheetManual?.addEventListener('click', async () => {
    if (btnSyncSpreadsheetManual) {
      btnSyncSpreadsheetManual.disabled = true;
      btnSyncSpreadsheetManual.innerHTML = '<span>⏳ Menyinkronkan...</span>';
    }

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : 'http://localhost:3000';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/customer/sync-spreadsheet`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        alert('🎉 Berhasil! Seluruh data akun pelanggan dan riwayat servis telah tersinkronkan ke Google Spreadsheet sheet "DataCustomer".');
      } else {
        alert('Info: ' + (data.message || 'Gagal sinkron'));
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk sinkronisasi Google Spreadsheet.');
    } finally {
      if (btnSyncSpreadsheetManual) {
        btnSyncSpreadsheetManual.disabled = false;
        btnSyncSpreadsheetManual.innerHTML = '<span>🔄 Sinkron Sheets</span>';
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
      switchToLoginMode();
    }
  });

  // Tampilkan selalu form login bersih (tanpa auto-login demi mencegah penipuan & pencurian akun)
  switchToLoginMode();
});

