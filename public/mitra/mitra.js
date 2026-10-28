/**
 * NGALAM FIX PRO - Mitra Driver & QR Code Affiliate Portal Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002')
    ? ''
    : 'http://localhost:3000';

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

  // Keamanan Ketat: Selalu bersihkan sesi login & input saat halaman portal mitra dibuka
  try {
    localStorage.removeItem('ngalam_mitra_session');
    sessionStorage.removeItem('ngalam_mitra_session');
  } catch (_) {}
  if (loginMitraId) loginMitraId.value = '';
  if (loginMitraPassword) loginMitraPassword.value = '';
  if (mitraAuthSection) mitraAuthSection.style.display = 'block';
  if (mitraDashboardSection) mitraDashboardSection.style.display = 'none';

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
      mitraAlertBox.innerHTML = `<b>🎉 Berhasil:</b> ${msg}`;
    } else {
      mitraAlertBox.style.background = '#fef2f2';
      mitraAlertBox.style.border = '1px solid #fecaca';
      mitraAlertBox.style.color = '#991b1b';
      mitraAlertBox.innerHTML = `<b>⚠️ Peringatan:</b> ${msg}`;
    }
  }

  function hideAlert() {
    if (mitraAlertBox) mitraAlertBox.style.display = 'none';
  }

  // Handle Login Submit
  formMitraLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = loginMitraId?.value.trim();
    const password = loginMitraPassword?.value.trim();

    if (!identifier || !password) {
      showAlert('Mohon isi identifier dan kata sandi akun mitra.');
      return;
    }

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.innerHTML = '<span>⏳ Memeriksa ke Google Spreadsheet...</span>';
    hideAlert();

    try {
      const res = await fetch(`${API_BASE}/api/mitra/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();

      if (data.success && data.driver) {
        showAlert(data.message, true);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(data.driver));
        setTimeout(() => {
          renderDashboard(data.driver);
        }, 600);
      } else {
        showAlert(data.message || 'Gagal masuk akun mitra.');
      }
    } catch (err) {
      showAlert('Gagal terhubung ke server: ' + err.message);
    } finally {
      btnSubmitLogin.disabled = false;
      btnSubmitLogin.innerHTML = '<span>🚀 Masuk ke Dashboard Mitra</span>';
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
      showAlert('Nama, Kategori, No. WhatsApp, Username, dan Password wajib diisi.');
      return;
    }

    btnSubmitRegister.disabled = true;
    btnSubmitRegister.innerHTML = '<span>⏳ Mendaftarkan & Menyinkronkan ke Spreadsheet...</span>';
    hideAlert();

    try {
      const res = await fetch(`${API_BASE}/api/mitra/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, phone, username, password, email })
      });
      const data = await res.json();

      if (data.success && data.mitra) {
        showAlert(data.message, true);
        localStorage.setItem('ngalam_mitra_session', JSON.stringify(data.mitra));
        setTimeout(() => {
          renderDashboard(data.mitra);
        }, 1000);
      } else {
        showAlert(data.message || 'Pendaftaran mitra gagal.');
      }
    } catch (err) {
      showAlert('Gagal menghubungi server: ' + err.message);
    } finally {
      btnSubmitRegister.disabled = false;
      btnSubmitRegister.innerHTML = '<span>✨ Buat Akun & Dapatkan QR Code</span>';
    }
  });

  // Render Dashboard
  async function renderDashboard(mitra) {
    if (!mitra) return;

    mitraAuthSection.style.display = 'none';
    mitraDashboardSection.style.display = 'block';

    dashAvatar.textContent = mitra.avatar || (mitra.role === 'ojol' ? '🛵' : '🏪');
    dashMitraName.textContent = mitra.name;
    dashCategory.textContent = `${mitra.category || 'Mitra Resmi'} • WA: ${mitra.phone || '-'}`;
    dashRefCode.textContent = mitra.referralCode;

    // Build URL & QR Image
    const host = window.location.host;
    const protocol = window.location.protocol;
    const affiliateUrl = `${protocol}//${host}/pesan-servis/index.html?ref=${encodeURIComponent(mitra.referralCode)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(affiliateUrl)}`;

    dashAffiliateUrl.value = affiliateUrl;
    dashQrImage.src = qrUrl;
    btnDownloadQr.href = qrUrl;

    dashTotalComm.textContent = 'Rp ' + Number(mitra.totalCommission || 0).toLocaleString('id-ID');
    dashCommRate.textContent = (mitra.commissionRate || 10) + '%';

    // Fetch live dashboard orders and update stats
    try {
      const res = await fetch(`${API_BASE}/api/mitra/dashboard?ref=${encodeURIComponent(mitra.referralCode)}`);
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
          <td colspan="6" style="padding: 30px; text-align: center; color: #94a3b8;">
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
      btnCopyAffiliateLink.textContent = '✅ Disalin!';
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
