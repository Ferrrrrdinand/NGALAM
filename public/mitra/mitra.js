/**
 * NGALAM FIX PRO - Mitra Driver & QR Code Affiliate Portal Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  // DOM Elements - Navigation & Sub-views
  const mitraAuthSection = document.getElementById('mitraAuthSection');
  const mitraDashboardSection = document.getElementById('mitraDashboardSection');
  const tabBtnLogin = document.getElementById('tabBtnLogin');
  const tabBtnRegister = document.getElementById('tabBtnRegister');
  const formLoginContainer = document.getElementById('formLoginContainer');
  const formRegisterContainer = document.getElementById('formRegisterContainer');
  const mitraAlertBox = document.getElementById('mitraAlertBox');

  // Forms
  const formMitraLogin = document.getElementById('formMitraLogin');
  const loginMitraId = document.getElementById('loginMitraId');
  const loginMitraPassword = document.getElementById('loginMitraPassword');
  const btnSubmitLogin = document.getElementById('btnSubmitLogin');
  const btnGoogleMitra = document.getElementById('btnGoogleMitra');

  // Periksa apakah sudah ada sesi login mitra aktif
  const urlParams = new URLSearchParams(window.location.search);
  const isMitraLoggedOut = urlParams.get('action') === 'logout';

  const isGoogleAuth = urlParams.get('auth') === 'google';

  if (isMitraLoggedOut) {
    try {
      localStorage.removeItem('ngalam_mitra_session');
      sessionStorage.removeItem('ngalam_mitra_session');
    } catch (_) {}
  } else {
    try {
      const raw = localStorage.getItem('ngalam_mitra_session') || sessionStorage.getItem('ngalam_mitra_session');
      if (raw) {
        const savedMitra = JSON.parse(raw);
        if (savedMitra && (savedMitra.referralCode || savedMitra.username)) {
          renderDashboard(savedMitra);
        }
      }
    } catch (_) {}
  }

  if (isGoogleAuth) {
    restoreGoogleSession();
  }

  const formMitraRegister = document.getElementById('formMitraRegister');
  const regMitraName = document.getElementById('regMitraName');
  const regMitraCategory = document.getElementById('regMitraCategory');
  const regMitraPhone = document.getElementById('regMitraPhone');
  const regMitraUsername = document.getElementById('regMitraUsername');
  const regMitraPassword = document.getElementById('regMitraPassword');
  const regMitraEmail = document.getElementById('regMitraEmail');
  const btnSubmitRegister = document.getElementById('btnSubmitRegister');

  // Dashboard DOM
  const dashAvatar = document.getElementById('dashAvatar');
  const dashMitraName = document.getElementById('dashMitraName');
  const dashCategory = document.getElementById('dashCategory');
  const dashQrImage = document.getElementById('dashQrImage');
  const dashRefCode = document.getElementById('dashRefCode');
  const dashAffiliateUrl = document.getElementById('dashAffiliateUrl');
  const btnCopyAffiliateLink = document.getElementById('btnCopyAffiliateLink');
  const btnDownloadQr = document.getElementById('btnDownloadQr');
  const dashTotalComm = document.getElementById('dashTotalComm');
  const dashTotalOrders = document.getElementById('dashTotalOrders');
  const dashCommRate = document.getElementById('dashCommRate');
  const orderCountBadge = document.getElementById('orderCountBadge');
  const dashOrdersBody = document.getElementById('dashOrdersBody');
  const btnMitraLogout = document.getElementById('btnMitraLogout');

  // Tab switching
  tabBtnLogin?.addEventListener('click', () => {
    tabBtnLogin.classList.add('active');
    tabBtnRegister.classList.remove('active');
    formLoginContainer.style.display = 'block';
    formRegisterContainer.style.display = 'none';
    hideAlert();
  });

  tabBtnRegister?.addEventListener('click', () => {
    tabBtnRegister.classList.add('active');
    tabBtnLogin.classList.remove('active');
    formRegisterContainer.style.display = 'block';
    formLoginContainer.style.display = 'none';
    hideAlert();
  });

  function showAlert(msg, isSuccess = false) {
    if (!mitraAlertBox) return;
    mitraAlertBox.style.display = 'block';
    if (isSuccess) {
      mitraAlertBox.style.background = '#ecfdf5';
      mitraAlertBox.style.border = '1px solid #a7f3d0';
      mitraAlertBox.style.color = '#065f46';
      mitraAlertBox.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Berhasil:</b> ${msg}`;
    } else {
      mitraAlertBox.style.background = '#fef2f2';
      mitraAlertBox.style.border = '1px solid #fecaca';
      mitraAlertBox.style.color = '#991b1b';
      mitraAlertBox.innerHTML = `<b><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Peringatan:</b> ${msg}`;
    }
  }

  function hideAlert() {
    if (mitraAlertBox) mitraAlertBox.style.display = 'none';
  }

  async function resolveApiBase() {
    let base = (typeof window !== 'undefined' && window.getNgalamApiBase)
      ? window.getNgalamApiBase()
      : '';
    if (window.resolveNgalamApiBase) {
      try { base = await window.resolveNgalamApiBase(); } catch (_) {}
    }
    return base;
  }

  async function completeGooglePhone(apiBase) {
    let phone = window.prompt('Lengkapi nomor WhatsApp aktif Anda untuk mengaktifkan komisi mitra:', '');
    if (phone === null) {
      showAlert('Nomor WhatsApp wajib dilengkapi agar komisi dapat dicairkan.');
      return null;
    }
    phone = phone.trim();
    if (!phone) {
      showAlert('Nomor WhatsApp tidak boleh kosong.');
      return completeGooglePhone(apiBase);
    }
    const res = await fetch(`${apiBase}/api/mitra/auth/complete-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      showAlert(data.message || 'Gagal menyimpan nomor WhatsApp.');
      return completeGooglePhone(apiBase);
    }
    return data.driver;
  }

  async function restoreGoogleSession() {
    hideAlert();
    try {
      const apiBase = await resolveApiBase();
      const res = await fetch(`${apiBase}/api/mitra/auth/session`, { headers: { Accept: 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.driver) {
        showAlert(data.message || 'Sesi Google tidak valid. Silakan coba lagi.');
        return;
      }

      let driver = data.driver;
      if (driver.needsPhone) {
        showAlert('Akun Google terhubung. Lengkapi nomor WhatsApp untuk mengaktifkan komisi.', true);
        driver = await completeGooglePhone(apiBase);
        if (!driver) return;
      }

      localStorage.setItem('ngalam_mitra_session', JSON.stringify(driver));
      showAlert('Login Google berhasil. Selamat datang, ' + (driver.name || 'Mitra') + '!', true);
      renderDashboard(driver);
    } catch (err) {
      showAlert('Gagal memulihkan sesi Google: ' + err.message);
    } finally {
      try { window.history.replaceState({}, '', window.location.pathname); } catch (_) {}
    }
  }

  btnGoogleMitra?.addEventListener('click', async () => {
    btnGoogleMitra.disabled = true;
    btnGoogleMitra.innerHTML = '<span>Menghubungkan ke Google...</span>';
    const apiBase = await resolveApiBase();
    window.location.href = `${apiBase}/api/mitra/auth/google`;
  });

  // Handle Login Submit
  formMitraLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = loginMitraId?.value.trim();
    const password = loginMitraPassword?.value.trim();

    if (!identifier || !password) {
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Kolom Wajib Diisi',
          message: 'Mohon isi identifier (username / WhatsApp / kode afiliasi) dan kata sandi akun mitra.',
          targetInputId: !identifier ? 'loginMitraId' : 'loginMitraPassword'
        });
      }
      showAlert('Mohon isi identifier dan kata sandi akun mitra.');
      return;
    }

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.innerHTML = '<span>⏳ Memeriksa ke Database Sistem...</span>';
    hideAlert();

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : '';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/mitra/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();

      if (data.success && data.driver) {
        showAlert(data.message, true);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(data.driver));

        if (window.showAuthSuccessModal) {
          window.showAuthSuccessModal({
            title: 'Login Mitra Berhasil!',
            subtitle: `Selamat datang kembali, ${data.driver.name}!`,
            user: {
              name: data.driver.name,
              role: 'mitra',
              roleText: `<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4L16 11"/><path d="m18 11 3-3a1 1 0 0 0 0-1.4L18.7 4.3a1 1 0 0 0-1.4 0L14 7"/></svg> Mitra Afiliasi (${data.driver.referralCode || 'Partner'})`,
              avatar: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4L16 11"/><path d="m18 11 3-3a1 1 0 0 0 0-1.4L18.7 4.3a1 1 0 0 0-1.4 0L14 7"/></svg>'
            },
            duration: 1300,
            onComplete: () => {
              renderDashboard(data.driver);
            }
          });
          return;
        }

        setTimeout(() => {
          renderDashboard(data.driver);
        }, 600);
      } else {
        const errMsg = data.message || 'Identifier atau kata sandi akun mitra tidak cocok.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Login Mitra Gagal!',
            message: errMsg,
            hints: [
              'Periksa apakah tombol <b>Caps Lock</b> sedang aktif pada keyboard.',
              'Pastikan username atau nomor WhatsApp Anda sudah terdaftar.',
              'Anda dapat menggunakan username, no. WhatsApp, atau kode afiliasi Anda.'
            ],
            targetInputId: 'loginMitraPassword'
          });
        }
        showAlert(errMsg);
      }
    } catch (err) {
      const errMsg = 'Gagal terhubung ke server: ' + err.message;
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Koneksi Server Gagal',
          message: errMsg
        });
      }
      showAlert(errMsg);
    } finally {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.innerHTML = '<span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> Masuk ke Dashboard Mitra</span>';
    }
  });

  // Handle Register Submit
  formMitraRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = regMitraName?.value.trim();
    const category = regMitraCategory?.value;
    const phone = regMitraPhone?.value.trim();
    const username = regMitraUsername?.value.trim();
    const password = regMitraPassword?.value.trim();
    const email = regMitraEmail?.value.trim();

    if (!name || !username || !password || !phone) {
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Kolom Wajib Diisi',
          message: 'Nama, Kategori, No. WhatsApp, Username, dan Password wajib diisi untuk pendaftaran mitra.',
          targetInputId: !name ? 'regMitraName' : (!phone ? 'regMitraPhone' : (!username ? 'regMitraUsername' : 'regMitraPassword'))
        });
      }
      showAlert('Nama, Kategori, No. WhatsApp, Username, dan Password wajib diisi.');
      return;
    }

    btnSubmitRegister.disabled = true;
    btnSubmitRegister.innerHTML = '<span>⏳ Mendaftarkan Akun Mitra ke Database...</span>';
    hideAlert();

    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : '';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }

      const res = await fetch(`${apiBase}/api/mitra/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, phone, username, password, email })
      });
      const data = await res.json();

      if (data.success && data.mitra) {
        showAlert(data.message, true);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(data.mitra));

        if (window.showAuthSuccessModal) {
          window.showAuthSuccessModal({
            title: 'Akun Mitra Berhasil Dibuat!',
            subtitle: `Selamat bergabung, ${data.mitra.name}! Kode afiliasi unik & QR Code Anda telah aktif.`,
            user: {
              name: data.mitra.name,
              role: 'mitra',
              roleText: `<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4L16 11"/><path d="m18 11 3-3a1 1 0 0 0 0-1.4L18.7 4.3a1 1 0 0 0-1.4 0L14 7"/></svg> Mitra Afiliasi (${data.mitra.referralCode})`,
              avatar: '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4L16 11"/><path d="m18 11 3-3a1 1 0 0 0 0-1.4L18.7 4.3a1 1 0 0 0-1.4 0L14 7"/></svg>'
            },
            duration: 1400,
            onComplete: () => {
              renderDashboard(data.mitra);
            }
          });
          return;
        }

        setTimeout(() => {
          renderDashboard(data.mitra);
        }, 1000);
      } else {
        const errMsg = data.message || 'Pendaftaran mitra gagal.';
        if (window.showAuthErrorModal) {
          window.showAuthErrorModal({
            title: 'Pendaftaran Mitra Gagal!',
            message: errMsg,
            targetInputId: 'regMitraUsername'
          });
        }
        showAlert(errMsg);
      }
    } catch (err) {
      const errMsg = 'Gagal menghubungi server: ' + err.message;
      if (window.showAuthErrorModal) {
        window.showAuthErrorModal({
          title: 'Koneksi Server Gagal',
          message: errMsg
        });
      }
      showAlert(errMsg);
    } finally {
      btnSubmitRegister.disabled = false;
      btnSubmitRegister.innerHTML = '<span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Buat Akun & Dapatkan QR Code</span>';
    }
  });

  // Render Dashboard
  async function renderDashboard(mitra) {
    if (!mitra) return;

    mitraAuthSection.style.display = 'none';
    mitraDashboardSection.style.display = 'block';

    dashAvatar.textContent = mitra.avatar || (mitra.role === 'ojol' ? '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>' : '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>');
    dashMitraName.textContent = mitra.name;
    dashMitraName.style.color = '#ffffff';
    dashCategory.textContent = `${mitra.category || 'Mitra Resmi'} • WA: ${mitra.phone || '-'}`;
    dashCategory.style.color = '#ecfdf5';
    dashRefCode.textContent = mitra.referralCode;

    // Build URL & QR Code (Scan barcode masuk ke web utama Ngalam Fix Pro dengan referral mitra)
    const host = window.location.host;
    const protocol = window.location.protocol;
    const affiliateUrl = `${protocol}//${host}/?ref=${encodeURIComponent(mitra.referralCode)}`;

    dashAffiliateUrl.value = affiliateUrl;

    // Render QR Code (Prioritas: Pure Client-side QRCode.js agar 100% tahan banting & tidak pernah broken)
    const qrCanvasBox = document.getElementById('dashQrCanvas');
    if (qrCanvasBox && typeof QRCode !== 'undefined') {
      qrCanvasBox.innerHTML = '';
      qrCanvasBox.style.display = 'block';
      if (dashQrImage) dashQrImage.style.display = 'none';

      try {
        new QRCode(qrCanvasBox, {
          text: affiliateUrl,
          width: 220,
          height: 220,
          colorDark: '#0f172a',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
          const canvas = qrCanvasBox.querySelector('canvas');
          if (canvas && btnDownloadQr) {
            btnDownloadQr.href = canvas.toDataURL('image/png');
            btnDownloadQr.download = `QR_Mitra_${mitra.referralCode}.png`;
          }
        }, 300);
      } catch (err) {
        console.warn('QRCode.js render error, using fallback image:', err);
        renderQrImageFallback(affiliateUrl);
      }
    } else {
      renderQrImageFallback(affiliateUrl);
    }

    function renderQrImageFallback(url) {
      if (!dashQrImage) return;
      if (qrCanvasBox) qrCanvasBox.style.display = 'none';
      dashQrImage.style.display = 'block';

      const primaryQr = `https://quickchart.io/qr?size=350&margin=2&text=${encodeURIComponent(url)}`;
      dashQrImage.src = primaryQr;
      if (btnDownloadQr) {
        btnDownloadQr.href = primaryQr;
        btnDownloadQr.download = `QR_Mitra_${mitra.referralCode}.png`;
      }

      dashQrImage.onerror = function () {
        if (!this.dataset.fallback1) {
          this.dataset.fallback1 = 'true';
          this.src = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(url)}`;
        } else if (!this.dataset.fallback2) {
          this.dataset.fallback2 = 'true';
          this.src = `https://chart.googleapis.com/chart?cht=qr&chs=350x350&chl=${encodeURIComponent(url)}`;
        }
      };
    }

    dashTotalComm.textContent = 'Rp ' + Number(mitra.totalCommission || 0).toLocaleString('id-ID');
    dashCommRate.textContent = (mitra.commissionRate || 10) + '%';

    // Fetch live dashboard orders and update stats
    try {
      let apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase)
        ? window.getNgalamApiBase()
        : '';
      if (window.resolveNgalamApiBase) {
        try { apiBase = await window.resolveNgalamApiBase(); } catch (_) {}
      }
      const res = await fetch(`${apiBase}/api/mitra/dashboard?ref=${encodeURIComponent(mitra.referralCode)}`);
      const json = await res.json();
      if (json.success) {
        if (json.stats) {
          dashTotalOrders.textContent = json.stats.totalOrders || 0;
          dashTotalComm.textContent = 'Rp ' + Number(json.stats.totalCommission || mitra.totalCommission || 0).toLocaleString('id-ID');
          if (orderCountBadge) orderCountBadge.textContent = `${json.stats.totalOrders || 0} Unit`;
        }

        renderOrdersTable(json.orders || []);
      }
    } catch (e) {
      console.warn('[Mitra] Error loading live dashboard stats:', e);
      renderOrdersTable(mitra.referredOrders || []);
    }
  }

  function renderOrdersTable(orders) {
    if (!dashOrdersBody) return;
    if (!Array.isArray(orders) || orders.length === 0) {
      dashOrdersBody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 30px; text-align: center; color: #475569; font-weight: 600;">
            Belum ada servis yang menggunakan kode afiliasi Anda. Bagikan QR Code Anda untuk mulai mendapatkan komisi!
          </td>
        </tr>
      `;
      return;
    }

    dashOrdersBody.innerHTML = orders.map(o => {
      const ticketId = o.id || '-';
      const custName = o.customerName || o.buyerName || 'Pelanggan';
      const phoneModel = o.phoneType || o.deviceType || 'Smartphone';
      const statusText = o.status || 'Diproses';
      const costStr = typeof o.cost === 'string' && o.cost ? o.cost : (o.estimatedCost ? `Rp ${Number(o.estimatedCost).toLocaleString('id-ID')}` : 'Rp 250.000');
      const commAmt = o.affiliateCommission ? `Rp ${Number(o.affiliateCommission).toLocaleString('id-ID')}` : 'Rp 25.000';

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px; font-family: monospace; font-weight: 700; color: #0284c7;">${ticketId}</td>
          <td style="padding: 12px; font-weight: 600; color: #0f172a;">${custName}</td>
          <td style="padding: 12px; color: #475569;">${phoneModel}</td>
          <td style="padding: 12px;"><span style="background: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">${statusText}</span></td>
          <td style="padding: 12px; font-weight: 600;">${costStr}</td>
          <td style="padding: 12px; font-weight: 800; color: #059669;">+ ${commAmt}</td>
        </tr>
      `;
    }).join('');
  }

  // Copy Affiliate Link
  btnCopyAffiliateLink?.addEventListener('click', () => {
    if (!dashAffiliateUrl) return;
    dashAffiliateUrl.select();
    navigator.clipboard.writeText(dashAffiliateUrl.value).then(() => {
      const orig = btnCopyAffiliateLink.textContent;
      btnCopyAffiliateLink.textContent = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Disalin!';
      btnCopyAffiliateLink.style.background = '#10b981';
      setTimeout(() => {
        btnCopyAffiliateLink.textContent = orig;
        btnCopyAffiliateLink.style.background = '#059669';
      }, 2000);
    });
  });

  // Logout
  btnMitraLogout?.addEventListener('click', () => {
    localStorage.removeItem('ngalam_mitra_session');
    sessionStorage.removeItem('ngalam_mitra_session');
    mitraDashboardSection.style.display = 'none';
    mitraAuthSection.style.display = 'block';
    formLoginContainer.style.display = 'block';
    formRegisterContainer.style.display = 'none';
    tabBtnLogin?.classList.add('active');
    tabBtnRegister?.classList.remove('active');
    showAlert('Anda telah keluar dari akun mitra.', true);
  });

  // Tampilkan selalu form login mitra bersih tanpa auto-login demi mencegah penyalahgunaan akun
});
