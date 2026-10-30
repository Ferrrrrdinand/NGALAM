/**
 * NGALAM FIX PRO - Dedicated Export Page Controller (export_page.js)
 * Mengontrol halaman mandiri ekspor riwayat transaksi kasir ke format Microsoft Excel (.xlsx).
 * Khusus untuk Role Super Admin / Owner.
 */

(function () {
  'use strict';

  function getActiveSession() {
    try {
      const raw = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (user && user.token && (user.role === 'admin' || user.role === 'owner')) {
        return user;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  function toISODate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatRupiah(num) {
    const val = parseInt(num, 10) || 0;
    return 'Rp ' + val.toLocaleString('id-ID');
  }

  function formatDateTime(isoString) {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch (_) {
      return isoString;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const userSession = getActiveSession();
    if (!userSession) {
      window.location.replace('login.html?reason=required');
      return;
    }

    // Set Admin Name on Top Badge
    const pageAdminName = document.getElementById('pageAdminName');
    if (pageAdminName) {
      pageAdminName.textContent = userSession.name || userSession.username || 'Admin Super User';
    }

    // Elements
    const startDateInput = document.getElementById('exportStartDate');
    const endDateInput = document.getElementById('exportEndDate');
    const methodSelect = document.getElementById('filterPaymentMethod');
    const searchInput = document.getElementById('searchFilterInput');
    const presetBtns = document.querySelectorAll('.preset-chip-btn');

    const kpiCount = document.getElementById('kpiTotalCount');
    const kpiOmset = document.getElementById('kpiTotalOmset');
    const kpiDiscount = document.getElementById('kpiTotalDiscount');
    const kpiAverage = document.getElementById('kpiAverageValue');

    const tableBody = document.getElementById('transactionTableBody');
    const loadingState = document.getElementById('tableLoadingState');
    const emptyState = document.getElementById('tableEmptyState');
    const tableContainer = document.getElementById('tableContainer');
    const summaryText = document.getElementById('tableFilterSummaryText');

    const btnMainDownload = document.getElementById('btnMainDownloadExcel');
    const btnTopDownload = document.getElementById('btnTopDownloadExcel');
    const btnRefresh = document.getElementById('btnPageRefresh');
    const btnPrint = document.getElementById('btnPrintReport');

    let allLoadedTransactions = [];

    // Set Max date to today
    const today = new Date();
    const todayStr = toISODate(today);
    if (startDateInput) startDateInput.max = todayStr;
    if (endDateInput) endDateInput.max = todayStr;

    // Preset Date Filter Handler
    function applyDatePreset(presetKey) {
      const now = new Date();
      const todayStr = toISODate(now);
      let start = new Date(now);

      if (presetKey === '1m') {
        start.setDate(now.getDate() - 30);
      } else if (presetKey === '2m') {
        start.setDate(now.getDate() - 60);
      } else if (presetKey === '3m') {
        start.setDate(now.getDate() - 90);
      } else if (presetKey === 'cur_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (presetKey === 'all') {
        start = new Date(now.getFullYear(), 0, 1); // 1 Januari tahun ini
      }

      if (startDateInput) startDateInput.value = toISODate(start);
      if (endDateInput) endDateInput.value = todayStr;

      presetBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-preset') === presetKey);
      });

      fetchData();
    }

    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        applyDatePreset(preset);
      });
    });

    startDateInput?.addEventListener('change', () => {
      presetBtns.forEach((btn) => btn.classList.remove('active'));
      fetchData();
    });

    endDateInput?.addEventListener('change', () => {
      presetBtns.forEach((btn) => btn.classList.remove('active'));
      fetchData();
    });

    methodSelect?.addEventListener('change', renderTableAndKPIs);
    searchInput?.addEventListener('input', renderTableAndKPIs);

    btnRefresh?.addEventListener('click', fetchData);
    btnPrint?.addEventListener('click', () => window.print());

    // Fetch Data from Server
    async function fetchData() {
      const startDate = startDateInput?.value;
      const endDate = endDateInput?.value;

      if (!startDate || !endDate) return;

      if (new Date(startDate) > new Date(endDate)) {
        alert('Rentang Tanggal Tidak Valid: Tanggal mulai tidak boleh melebihi tanggal akhir.');
        return;
      }

      if (loadingState) loadingState.style.display = 'block';
      if (emptyState) emptyState.style.display = 'none';
      if (tableContainer) tableContainer.style.opacity = '0.5';

      try {
        const apiBase = (typeof window.getNgalamApiBase === 'function')
          ? window.getNgalamApiBase()
          : '';

        const url = `${apiBase}/api/export/transactions/preview?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&token=${encodeURIComponent(userSession.token)}`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${userSession.token}` }
        });

        const data = await res.json();

        if (data && data.success) {
          allLoadedTransactions = Array.isArray(data.transactions) ? data.transactions : [];
          renderTableAndKPIs();
        } else {
          allLoadedTransactions = [];
          renderTableAndKPIs();
        }
      } catch (err) {
        console.error('[ExportPage] Error fetching transactions:', err);
        allLoadedTransactions = [];
        renderTableAndKPIs();
      } finally {
        if (loadingState) loadingState.style.display = 'none';
        if (tableContainer) tableContainer.style.opacity = '1';
      }
    }

    // Filter & Render Table Rows + KPIs
    function renderTableAndKPIs() {
      const selectedMethod = methodSelect?.value || 'all';
      const searchKeyword = (searchInput?.value || '').trim().toLowerCase();

      const filtered = allLoadedTransactions.filter((tx) => {
        // Filter Metode Bayar
        if (selectedMethod !== 'all') {
          const m = (tx.paymentMethod || '').toLowerCase();
          if (selectedMethod === 'qris' && !m.includes('qris') && !m.includes('wallet')) return false;
          if (selectedMethod === 'tunai' && !m.includes('tunai') && !m.includes('cash')) return false;
          if (selectedMethod === 'transfer' && !m.includes('transfer') && !m.includes('bank') && !m.includes('bca') && !m.includes('mandiri') && !m.includes('bri')) return false;
        }

        // Filter Kata Kunci
        if (searchKeyword) {
          const matchInvoice = (tx.invoiceNo || '').toLowerCase().includes(searchKeyword);
          const matchTicket = (tx.orderId || '').toLowerCase().includes(searchKeyword);
          const matchCust = (tx.customerName || '').toLowerCase().includes(searchKeyword);
          const matchPhone = (tx.customerPhone || '').toLowerCase().includes(searchKeyword);
          const matchDevice = (tx.phoneModel || tx.damageType || '').toLowerCase().includes(searchKeyword);
          const matchCashier = (tx.cashierName || '').toLowerCase().includes(searchKeyword);
          if (!matchInvoice && !matchTicket && !matchCust && !matchPhone && !matchDevice && !matchCashier) {
            return false;
          }
        }

        return true;
      });

      // Update KPIs
      let totalOmset = 0;
      let totalDiscount = 0;

      filtered.forEach((tx) => {
        totalOmset += parseInt(tx.totalPaid, 10) || 0;
        totalDiscount += parseInt(tx.discount, 10) || 0;
      });

      const count = filtered.length;
      const averageVal = count > 0 ? Math.round(totalOmset / count) : 0;

      if (kpiCount) kpiCount.textContent = `${count} Faktur`;
      if (kpiOmset) kpiOmset.textContent = formatRupiah(totalOmset);
      if (kpiDiscount) kpiDiscount.textContent = formatRupiah(totalDiscount);
      if (kpiAverage) kpiAverage.textContent = formatRupiah(averageVal) + ' / nota';

      if (summaryText) {
        summaryText.innerHTML = `Menampilkan <b>${count} faktur</b> transaksi dari rentang tanggal <b>${startDateInput?.value || '-'}</b> s/d <b>${endDateInput?.value || '-'}</b>.`;
      }

      // Render Table Rows
      if (!tableBody) return;
      tableBody.innerHTML = '';

      if (filtered.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      if (tableContainer) tableContainer.style.display = 'block';

      filtered.forEach((tx) => {
        const tr = document.createElement('tr');

        // Badge Metode Bayar
        const rawMethod = (tx.paymentMethod || 'TUNAI').toUpperCase();
        let methodBadgeClass = 'badge-method tunai';
        let methodIcon = '💵';
        if (rawMethod.includes('QRIS') || rawMethod.includes('WALLET')) {
          methodBadgeClass = 'badge-method qris';
          methodIcon = '📱';
        } else if (rawMethod.includes('TRANSFER') || rawMethod.includes('BANK')) {
          methodBadgeClass = 'badge-method transfer';
          methodIcon = '🏦';
        }

        const netTotal = parseInt(tx.totalPaid, 10) || 0;

        tr.innerHTML = `
          <td><strong style="color: #0f172a; font-family: 'Outfit', sans-serif;">${tx.invoiceNo || '-'}</strong></td>
          <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 6px; font-weight: 700; color: #475569;">${tx.orderId || '-'}</code></td>
          <td style="font-size: 0.82rem; color: #475569;">${formatDateTime(tx.paymentTime || tx.date)}</td>
          <td>
            <strong style="display: block; color: #0f172a;">${tx.customerName || 'Pelanggan Walk-In'}</strong>
            <small style="color: #64748b; font-size: 0.78rem;">${tx.customerPhone || '-'}</small>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${tx.phoneModel || '-'}</div>
            <div style="font-size: 0.78rem; color: #64748b;">${tx.damageType || '-'}</div>
          </td>
          <td style="text-align: right; font-weight: 800; color: #059669; font-size: 0.95rem;">
            ${formatRupiah(netTotal)}
          </td>
          <td style="text-align: center;">
            <span class="${methodBadgeClass}">
              <span>${methodIcon}</span>
              <span>${rawMethod}</span>
            </span>
          </td>
          <td style="font-size: 0.82rem; color: #475569;">
            ${tx.cashierName || 'Kasir Meja 1'}
          </td>
          <td style="text-align: center;">
            <span class="badge-status-lunas">✓ Lunas</span>
          </td>
        `;

        tableBody.appendChild(tr);
      });
    }

    // Download Excel Action Handler
    async function handleDownloadExcel(buttonElement) {
      const startDate = startDateInput?.value;
      const endDate = endDateInput?.value;

      if (!startDate || !endDate) {
        alert('Silakan tentukan rentang tanggal ekspor terlebih dahulu.');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('Tanggal mulai tidak boleh melebihi tanggal akhir.');
        return;
      }

      const originalText = buttonElement ? buttonElement.innerHTML : '';
      if (btnMainDownload) btnMainDownload.disabled = true;
      if (btnTopDownload) btnTopDownload.disabled = true;

      const loadingHTML = `
        <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>Membuat File Excel...</span>
      `;
      if (btnMainDownload) btnMainDownload.innerHTML = loadingHTML;
      if (btnTopDownload) btnTopDownload.innerHTML = loadingHTML;

      try {
        const apiBase = (typeof window.getNgalamApiBase === 'function')
          ? window.getNgalamApiBase()
          : '';

        const url = `${apiBase}/api/export/transactions/excel?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&token=${encodeURIComponent(userSession.token)}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${userSession.token}` }
        });

        if (!res.ok) {
          let errData;
          try { errData = await res.json(); } catch (_) {}
          throw new Error(errData?.message || `Gagal mengunduh file (HTTP ${res.status})`);
        }

        const blob = await res.blob();
        const startClean = startDate.replace(/-/g, '');
        const endClean = endDate.replace(/-/g, '');
        const filename = `Riwayat_Transaksi_NgalamFixPro_${startClean}_sd_${endClean}.xlsx`;

        // Native Browser Auto-Download
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl);
        }, 1500);

        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 Laporan Excel "${filename}" berhasil diunduh!`, 'success');
        } else {
          alert(`🎉 Berhasil!\nLaporan riwayat transaksi "${filename}" berhasil diekspor dan terunduh ke komputer Anda.`);
        }
      } catch (err) {
        console.error('[ExportPage] Download failed:', err);
        alert('Gagal mengekspor file Excel: ' + err.message);
      } finally {
        if (btnMainDownload) {
          btnMainDownload.disabled = false;
          btnMainDownload.innerHTML = '<span>📥 Unduh Laporan Excel (.xlsx)</span>';
        }
        if (btnTopDownload) {
          btnTopDownload.disabled = false;
          btnTopDownload.innerHTML = '<span>📥 Unduh Excel (.xlsx)</span>';
        }
      }
    }

    btnMainDownload?.addEventListener('click', () => handleDownloadExcel(btnMainDownload));
    btnTopDownload?.addEventListener('click', () => handleDownloadExcel(btnTopDownload));

    // Default Inisialisasi Preset: 1 Bulan Terakhir
    applyDatePreset('1m');
  });
})();
