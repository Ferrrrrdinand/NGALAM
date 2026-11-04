/**
 * NGALAM FIX PRO - Kasir Meja 1 Operational & POS Script
 * Mengelola pendaftaran walk-in, pembayaran POS, kalkulasi kembalian, dan cetak struk thermal.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Session & Auth Check
  let currentUser = null;
  try {
    const raw = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    if (raw) currentUser = JSON.parse(raw);
  } catch (_) {}

  if (!currentUser || !currentUser.token) {
    window.location.replace('login.html?reason=required');
    return;
  }

  // Display Cashier Info
  const kasirNameDisplay = document.getElementById('kasirNameDisplay');
  const kasirAvatar = document.getElementById('kasirAvatar');
  if (kasirNameDisplay) kasirNameDisplay.textContent = currentUser.name || currentUser.username || 'Kasir Meja 1';
  if (kasirAvatar) kasirAvatar.textContent = currentUser.avatar || '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><rect width="8" height="6" x="14" y="15" rx="1"/></svg>';

  // Logout Handler
  const btnKasirLogout = document.getElementById('btnKasirLogout');
  if (btnKasirLogout) {
    btnKasirLogout.addEventListener('click', async () => {
      try {
        const apiBase = (typeof window !== 'undefined' && window.getNgalamApiBase) ? window.getNgalamApiBase() : '';
        await fetch(`${apiBase}/api/auth/logout`, { method: 'POST' });
      } catch (_) {}
      try {
        localStorage.removeItem('ngalam_auth_user');
        sessionStorage.removeItem('ngalam_auth_user');
        document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
      } catch (_) {}
      window.location.replace('login.html?reason=logged_out');
    });
  }

  // 2. Open Cash Drawer Simulation
  const btnOpenDrawer = document.getElementById('btnOpenDrawer');
  if (btnOpenDrawer) {
    btnOpenDrawer.addEventListener('click', () => {
      btnOpenDrawer.textContent = '<svg class="svg-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Laci Kas Terbuka!';
      btnOpenDrawer.style.background = '#fef3c7';
      btnOpenDrawer.style.borderColor = '#f59e0b';
      setTimeout(() => {
        btnOpenDrawer.textContent = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/></svg> Buka Laci Kas';
        btnOpenDrawer.style.background = '#ffffff';
        btnOpenDrawer.style.borderColor = '#0284c7';
      }, 2000);
    });
  }

  // 3. Tab Navigation
  const tabBtns = document.querySelectorAll('.kasir-tab-btn');
  const panels = {
    walkinTab: document.getElementById('walkinTab'),
    posPaymentTab: document.getElementById('posPaymentTab'),
    rekapKasTab: document.getElementById('rekapKasTab')
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      Object.keys(panels).forEach(k => {
        if (panels[k]) {
          panels[k].style.display = (k === target) ? 'block' : 'none';
        }
      });
    });
  });

  // 4. Initial Dummy & Stored Orders State
  const STORAGE_KEY = 'ngalam_kasir_orders';
  const CASH_LOG_KEY = 'ngalam_kasir_cash_log';

  let orders = [];
  try {
    const rawOrders = localStorage.getItem(STORAGE_KEY);
    if (rawOrders) orders = JSON.parse(rawOrders);
  } catch (_) {}

  if (!orders || orders.length === 0) {
    orders = [
      {
        ticketId: 'NGM-20261030-001',
        customerName: 'Bpk. Hendra Wijaya',
        customerPhone: '081234567890',
        device: 'iPhone 13 Pro 128GB',
        damage: 'Ganti Baterai Original & Pembersihan Speaker',
        status: 'selesai',
        totalCost: 450000,
        downPayment: 100000,
        paid: 100000,
        remaining: 350000,
        createdAt: '2026-10-30 09:15'
      },
      {
        ticketId: 'NGM-20261030-002',
        customerName: 'Ibu Ratna Sari',
        customerPhone: '085788991122',
        device: 'Samsung Galaxy S22 Ultra',
        damage: 'Layar OLED Bergaris & Touchscreen Macet',
        status: 'pengerjaan',
        totalCost: 1850000,
        downPayment: 500000,
        paid: 500000,
        remaining: 1350000,
        createdAt: '2026-10-30 10:00'
      },
      {
        ticketId: 'NGM-20261030-003',
        customerName: 'Dimas Anggara',
        customerPhone: '082133445566',
        device: 'Xiaomi 12T Pro',
        damage: 'Port Charger Type-C Kendor Tidak Mengisi',
        status: 'menunggu',
        totalCost: 180000,
        downPayment: 0,
        paid: 0,
        remaining: 180000,
        createdAt: '2026-10-30 10:45'
      }
    ];
    saveOrders();
  }

  let cashLogs = [];
  try {
    const rawLogs = localStorage.getItem(CASH_LOG_KEY);
    if (rawLogs) cashLogs = JSON.parse(rawLogs);
  } catch (_) {}

  if (!cashLogs || cashLogs.length === 0) {
    cashLogs = [
      {
        time: '09:16 WIB',
        ticketId: 'NGM-20261030-001',
        desc: 'DP Servis iPhone 13 Pro',
        method: 'Tunai',
        amount: 100000,
        cashier: currentUser.name || 'Kasir Meja 1'
      },
      {
        time: '10:02 WIB',
        ticketId: 'NGM-20261030-002',
        desc: 'DP Servis Samsung S22 Ultra',
        method: 'QRIS',
        amount: 500000,
        cashier: currentUser.name || 'Kasir Meja 1'
      }
    ];
    saveCashLogs();
  }

  function saveOrders() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (_) {}
  }

  function saveCashLogs() {
    try {
      localStorage.setItem(CASH_LOG_KEY, JSON.stringify(cashLogs));
    } catch (_) {}
  }

  function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  }

  // 5. Update Metrics & Render Tables
  function updateMetrics() {
    const metricTotalWalkin = document.getElementById('metricTotalWalkin');
    const metricInLab = document.getElementById('metricInLab');
    const metricKasHariIni = document.getElementById('metricKasHariIni');
    const metricReadyPickup = document.getElementById('metricReadyPickup');

    if (metricTotalWalkin) metricTotalWalkin.textContent = orders.length;
    if (metricInLab) {
      const inLab = orders.filter(o => o.status === 'pengerjaan' || o.status === 'menunggu').length;
      metricInLab.textContent = inLab;
    }
    if (metricReadyPickup) {
      const ready = orders.filter(o => o.status === 'selesai' || o.status === 'lunas').length;
      metricReadyPickup.textContent = ready;
    }

    const totalCash = cashLogs.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    if (metricKasHariIni) metricKasHariIni.textContent = formatRupiah(totalCash);

    // Rekap metrics
    const rekapCashTotal = document.getElementById('rekapCashTotal');
    const rekapQrisTotal = document.getElementById('rekapQrisTotal');
    const rekapDpTotal = document.getElementById('rekapDpTotal');

    const cashSum = cashLogs.filter(c => c.method === 'Tunai').reduce((a, b) => a + Number(b.amount || 0), 0);
    const qrisSum = cashLogs.filter(c => c.method === 'QRIS' || c.method === 'Transfer Bank').reduce((a, b) => a + Number(b.amount || 0), 0);
    const dpSum = orders.reduce((a, b) => a + Number(b.downPayment || 0), 0);

    if (rekapCashTotal) rekapCashTotal.textContent = formatRupiah(cashSum);
    if (rekapQrisTotal) rekapQrisTotal.textContent = formatRupiah(qrisSum);
    if (rekapDpTotal) rekapDpTotal.textContent = formatRupiah(dpSum);
  }

  function renderPosOrders(filterText = '') {
    const tbody = document.getElementById('posOrdersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const cleanFilter = filterText.toLowerCase().trim();
    const filtered = orders.filter(o => {
      if (!cleanFilter) return true;
      return (
        (o.ticketId || '').toLowerCase().includes(cleanFilter) ||
        (o.customerName || '').toLowerCase().includes(cleanFilter) ||
        (o.customerPhone || '').includes(cleanFilter) ||
        (o.device || '').toLowerCase().includes(cleanFilter)
      );
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 24px; color: #64748b;">
            Tidak ditemukan data antrean servis sesuai pencarian.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(o => {
      const tr = document.createElement('tr');
      let statusBadge = '';
      if (o.status === 'menunggu') statusBadge = '<span class="badge-status menunggu">⏳ Menunggu Lab</span>';
      else if (o.status === 'pengerjaan') statusBadge = '<span class="badge-status pengerjaan"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Di Meja Lab</span>';
      else if (o.status === 'selesai') statusBadge = '<span class="badge-status selesai"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Siap Diambil</span>';
      else statusBadge = '<span class="badge-status lunas"><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Lunas / Selesai</span>';

      const isLunas = (Number(o.remaining) <= 0);

      tr.innerHTML = `
        <td><b style="color: #0284c7;">${o.ticketId}</b><br><small style="color: #64748b;">${o.createdAt}</small></td>
        <td><b>${o.customerName}</b><br><small style="color: #64748b;">${o.customerPhone}</small></td>
        <td><b>${o.device}</b><br><small style="color: #64748b;">${o.damage}</small></td>
        <td>${statusBadge}</td>
        <td><b>${formatRupiah(o.totalCost)}</b></td>
        <td><span style="color: #059669;">${formatRupiah(o.downPayment)}</span></td>
        <td><b style="color: ${isLunas ? '#059669' : '#dc2626'};">${isLunas ? 'LUNAS' : formatRupiah(o.remaining)}</b></td>
        <td>
          <div style="display: flex; gap: 6px;">
            ${!isLunas ? `
              <button type="button" class="btn-kasir-primary btn-pay-action" style="padding: 6px 12px; font-size: 0.8rem;" data-id="${o.ticketId}">
                <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> Bayar
              </button>
            ` : `
              <button type="button" class="btn-kasir-outline btn-print-action" style="padding: 6px 12px; font-size: 0.8rem;" data-id="${o.ticketId}">
                <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg> Struk
              </button>
            `}
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach listeners for action buttons
    document.querySelectorAll('.btn-pay-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const tId = btn.getAttribute('data-id');
        openPaymentModal(tId);
      });
    });

    document.querySelectorAll('.btn-print-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const tId = btn.getAttribute('data-id');
        openReceiptModal(tId);
      });
    });
  }

  function renderRekapLogs() {
    const tbody = document.getElementById('rekapLogTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (cashLogs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">
            Belum ada transaksi kas masuk hari ini.
          </td>
        </tr>
      `;
      return;
    }

    cashLogs.slice().reverse().forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><small style="color: #64748b;">${log.time}</small></td>
        <td><b>${log.ticketId}</b></td>
        <td>${log.desc}</td>
        <td><span style="display: inline-block; padding: 3px 8px; border-radius: 6px; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 0.78rem;">${log.method}</span></td>
        <td><b style="color: #059669;">+ ${formatRupiah(log.amount)}</b></td>
        <td>${log.cashier}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 6. Walk-In Form Submission
  const kasirWalkinForm = document.getElementById('kasirWalkinForm');
  const previewTicketId = document.getElementById('previewTicketId');

  function generateNextTicketId() {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(orders.length + 1).padStart(3, '0');
    return `NGM-${dateStr}-${seq}`;
  }

  if (previewTicketId) previewTicketId.textContent = generateNextTicketId();

  if (kasirWalkinForm) {
    kasirWalkinForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const custName = document.getElementById('walkinCustomerName').value.trim();
      const custPhone = document.getElementById('walkinCustomerPhone').value.trim();
      const device = document.getElementById('walkinDeviceModel').value.trim();
      const damage = document.getElementById('walkinDamageIssue').value.trim();
      const completeness = document.getElementById('walkinCompleteness').value;
      const totalCost = Number(document.getElementById('walkinEstimatedCost').value) || 0;
      const dp = Number(document.getElementById('walkinDownPayment').value) || 0;

      const ticketId = generateNextTicketId();
      const now = new Date();
      const timeStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' }) + ' ' +
                      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      const newOrder = {
        ticketId,
        customerName: custName,
        customerPhone: custPhone,
        device,
        damage,
        completeness,
        totalCost,
        downPayment: dp,
        paid: dp,
        remaining: Math.max(0, totalCost - dp),
        status: 'menunggu',
        createdAt: timeStr
      };

      orders.unshift(newOrder);
      saveOrders();

      if (dp > 0) {
        cashLogs.push({
          time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
          ticketId,
          desc: `DP Walk-in Meja 1 (${device})`,
          method: 'Tunai',
          amount: dp,
          cashier: currentUser.name || 'Kasir Meja 1'
        });
        saveCashLogs();
      }

      updateMetrics();
      renderPosOrders();
      renderRekapLogs();

      kasirWalkinForm.reset();
      if (previewTicketId) previewTicketId.textContent = generateNextTicketId();

      // Show receipt modal automatically
      openReceiptModal(ticketId);
    });
  }

  // 7. Payment Modal Logic
  const modalPaymentBackdrop = document.getElementById('modalPaymentBackdrop');
  const btnClosePaymentModal = document.getElementById('btnClosePaymentModal');
  const payModalTicketId = document.getElementById('payModalTicketId');
  const payModalCustName = document.getElementById('payModalCustName');
  const payModalDevice = document.getElementById('payModalDevice');
  const payModalRemaining = document.getElementById('payModalRemaining');
  const payMethodSelect = document.getElementById('payMethodSelect');
  const payAmountReceived = document.getElementById('payAmountReceived');
  const payChangeAmount = document.getElementById('payChangeAmount');
  const btnConfirmPayment = document.getElementById('btnConfirmPayment');

  let activePayOrder = null;

  function openPaymentModal(ticketId) {
    activePayOrder = orders.find(o => o.ticketId === ticketId);
    if (!activePayOrder || !modalPaymentBackdrop) return;

    if (payModalTicketId) payModalTicketId.textContent = activePayOrder.ticketId;
    if (payModalCustName) payModalCustName.textContent = activePayOrder.customerName;
    if (payModalDevice) payModalDevice.textContent = `${activePayOrder.device} • ${activePayOrder.damage}`;
    if (payModalRemaining) payModalRemaining.textContent = formatRupiah(activePayOrder.remaining);

    if (payAmountReceived) {
      payAmountReceived.value = activePayOrder.remaining;
      calculateChange();
    }

    modalPaymentBackdrop.style.display = 'flex';
  }

  function calculateChange() {
    if (!activePayOrder) return;
    const received = Number(payAmountReceived?.value || 0);
    const rem = Number(activePayOrder.remaining || 0);
    const change = Math.max(0, received - rem);
    if (payChangeAmount) payChangeAmount.textContent = formatRupiah(change);
  }

  payAmountReceived?.addEventListener('input', calculateChange);

  btnClosePaymentModal?.addEventListener('click', () => {
    if (modalPaymentBackdrop) modalPaymentBackdrop.style.display = 'none';
  });

  btnConfirmPayment?.addEventListener('click', () => {
    if (!activePayOrder) return;

    const received = Number(payAmountReceived?.value || 0);
    const rem = Number(activePayOrder.remaining || 0);

    if (received < rem) {
      alert(`Nominal pembayaran kurang. Sisa tagihan adalah ${formatRupiah(rem)}.`);
      return;
    }

    const method = payMethodSelect?.value || 'Tunai';
    const now = new Date();

    // Update order
    activePayOrder.paid = (activePayOrder.paid || 0) + rem;
    activePayOrder.remaining = 0;
    activePayOrder.status = 'lunas';
    saveOrders();

    // Record to cash log
    cashLogs.push({
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      ticketId: activePayOrder.ticketId,
      desc: `Pelunasan Servis (${activePayOrder.device})`,
      method,
      amount: rem,
      cashier: currentUser.name || 'Kasir Meja 1'
    });
    saveCashLogs();

    updateMetrics();
    renderPosOrders();
    renderRekapLogs();

    if (modalPaymentBackdrop) modalPaymentBackdrop.style.display = 'none';

    // Show thermal receipt
    openReceiptModal(activePayOrder.ticketId);
  });

  // 8. Receipt Modal Logic
  const modalReceiptBackdrop = document.getElementById('modalReceiptBackdrop');
  const btnCloseReceiptModal = document.getElementById('btnCloseReceiptModal');

  function openReceiptModal(ticketId) {
    const o = orders.find(item => item.ticketId === ticketId);
    if (!o || !modalReceiptBackdrop) return;

    const thTicketNo = document.getElementById('thTicketNo');
    const thDateTime = document.getElementById('thDateTime');
    const thCashierName = document.getElementById('thCashierName');
    const thCustName = document.getElementById('thCustName');
    const thCustPhone = document.getElementById('thCustPhone');
    const thDevice = document.getElementById('thDevice');
    const thIssue = document.getElementById('thIssue');
    const thTotalCost = document.getElementById('thTotalCost');
    const thDp = document.getElementById('thDp');
    const thPaid = document.getElementById('thPaid');
    const thRemaining = document.getElementById('thRemaining');

    if (thTicketNo) thTicketNo.textContent = o.ticketId;
    if (thDateTime) thDateTime.textContent = o.createdAt;
    if (thCashierName) thCashierName.textContent = currentUser.name || 'Kasir Meja 1';
    if (thCustName) thCustName.textContent = o.customerName;
    if (thCustPhone) thCustPhone.textContent = o.customerPhone;
    if (thDevice) thDevice.textContent = o.device;
    if (thIssue) thIssue.textContent = o.damage;
    if (thTotalCost) thTotalCost.textContent = formatRupiah(o.totalCost);
    if (thDp) thDp.textContent = formatRupiah(o.downPayment);
    if (thPaid) thPaid.textContent = formatRupiah(o.paid);
    if (thRemaining) {
      if (o.remaining <= 0) {
        thRemaining.textContent = 'Rp 0 (LUNAS)';
        thRemaining.style.color = '#059669';
      } else {
        thRemaining.textContent = formatRupiah(o.remaining);
        thRemaining.style.color = '#dc2626';
      }
    }

    modalReceiptBackdrop.style.display = 'flex';
  }

  btnCloseReceiptModal?.addEventListener('click', () => {
    if (modalReceiptBackdrop) modalReceiptBackdrop.style.display = 'none';
  });

  // Close modals on click outside
  window.addEventListener('click', (e) => {
    if (e.target === modalPaymentBackdrop) modalPaymentBackdrop.style.display = 'none';
    if (e.target === modalReceiptBackdrop) modalReceiptBackdrop.style.display = 'none';
  });

  // Search POS
  const posSearchInput = document.getElementById('posSearchInput');
  posSearchInput?.addEventListener('input', () => {
    renderPosOrders(posSearchInput.value);
  });

  // Print Daily Report
  const btnPrintDailyReport = document.getElementById('btnPrintDailyReport');
  btnPrintDailyReport?.addEventListener('click', () => {
    window.print();
  });

  // Initial Load
  updateMetrics();
  renderPosOrders();
  renderRekapLogs();
});
