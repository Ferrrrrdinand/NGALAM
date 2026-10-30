/**
 * NGALAM FIX PRO - Admin Transaction Excel Export Script
 * File terpisah khusus untuk fitur export riwayat transaksi kasir ke Microsoft Excel (.xlsx).
 * DIBATASI: Hanya aktif dan dapat digunakan untuk akun dengan Role Admin (Super User / Owner).
 */

(function () {
  'use strict';

  // Helper untuk mendapatkan token dan user sesi aktif
  function getActiveAdminSession() {
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

  // Format tanggal YYYY-MM-DD
  function toISODateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format Rupiah
  function formatRupiah(num) {
    const val = parseInt(num, 10) || 0;
    return 'Rp ' + val.toLocaleString('id-ID');
  }

  // Inisialisasi modul setelah DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    const userSession = getActiveAdminSession();

    const openBtn = document.getElementById('openExportTxModalBtn');
    const modal = document.getElementById('modalExportTransactions');
    const closeBtn = document.getElementById('closeExportTxModalBtn');
    const cancelBtn = document.getElementById('cancelExportTxModalBtn');
    const submitExportBtn = document.getElementById('btnDoExportExcel');

    const startDateInput = document.getElementById('exportStartDate');
    const endDateInput = document.getElementById('exportEndDate');
    const presetBtns = document.querySelectorAll('.export-preset-chip');

    const previewContainer = document.getElementById('exportPreviewStats');
    const previewCount = document.getElementById('exportPreviewCount');
    const previewOmset = document.getElementById('exportPreviewOmset');
    const previewDiscount = document.getElementById('exportPreviewDiscount');
    const exportNoticeBox = document.getElementById('exportNoticeBox');

    const linkToExportPage = document.getElementById('linkToExportPage');

    // 1. ROLE CHECK & PERMISSION RESTRICTION
    if (!userSession) {
      // Jika bukan Admin (misal: Kasir), sembunyikan tombol & link Export
      if (openBtn) openBtn.style.display = 'none';
      if (linkToExportPage) linkToExportPage.style.display = 'none';
      return;
    }

    // Pastikan terlihat jika user adalah Admin Super User
    if (openBtn) openBtn.style.display = 'inline-flex';
    if (linkToExportPage) linkToExportPage.style.display = 'inline-flex';

    // 2. MODAL TOGGLE HANDLERS
    function openExportModal() {
      if (!modal) return;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Set batas maksimal tanggal ke hari ini
      const today = new Date();
      const todayStr = toISODateString(today);
      if (endDateInput) endDateInput.max = todayStr;
      if (startDateInput) startDateInput.max = todayStr;

      // Default aktifkan preset 1 Bulan Terakhir jika belum terisi
      if (!startDateInput.value || !endDateInput.value) {
        applyDatePreset('1m');
      } else {
        fetchPreviewStats();
      }
    }

    function closeExportModal() {
      if (!modal) return;
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    openBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openExportModal();
    });

    closeBtn?.addEventListener('click', closeExportModal);
    cancelBtn?.addEventListener('click', closeExportModal);

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeExportModal();
      }
    });

    // 3. DATE PRESETS HANDLER (1 Bulan, 2 Bulan, 3 Bulan, Bulan Berjalan)
    function applyDatePreset(presetKey) {
      const now = new Date();
      const todayStr = toISODateString(now);
      let start = new Date(now);

      if (presetKey === '1m') {
        // 1 Bulan Terakhir (30 hari yang lalu)
        start.setDate(now.getDate() - 30);
      } else if (presetKey === '2m') {
        // 2 Bulan Terakhir (60 hari yang lalu)
        start.setDate(now.getDate() - 60);
      } else if (presetKey === '3m') {
        // 3 Bulan Terakhir (90 hari yang lalu)
        start.setDate(now.getDate() - 90);
      } else if (presetKey === 'cur_month') {
        // Awal bulan ini (Tanggal 1 bulan berjalan)
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (startDateInput) startDateInput.value = toISODateString(start);
      if (endDateInput) endDateInput.value = todayStr;

      // Update styling active chip
      presetBtns.forEach((btn) => {
        const isCurrent = btn.getAttribute('data-preset') === presetKey;
        btn.classList.toggle('active', isCurrent);
      });

      fetchPreviewStats();
    }

    presetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        applyDatePreset(preset);
      });
    });

    startDateInput?.addEventListener('change', () => {
      presetBtns.forEach((btn) => btn.classList.remove('active'));
      fetchPreviewStats();
    });

    endDateInput?.addEventListener('change', () => {
      presetBtns.forEach((btn) => btn.classList.remove('active'));
      fetchPreviewStats();
    });

    // 4. FETCH PREVIEW STATS (Pratinjau Data Sebelum Download)
    let previewDebounce = null;
    async function fetchPreviewStats() {
      clearTimeout(previewDebounce);
      previewDebounce = setTimeout(async () => {
        const startDate = startDateInput?.value;
        const endDate = endDateInput?.value;

        if (!startDate || !endDate) return;

        if (new Date(startDate) > new Date(endDate)) {
          if (exportNoticeBox) {
            exportNoticeBox.style.display = 'block';
            exportNoticeBox.innerHTML = '⚠️ <b>Rentang Tanggal Tidak Valid:</b> Tanggal mulai tidak boleh melebihi tanggal akhir.';
          }
          if (submitExportBtn) submitExportBtn.disabled = true;
          return;
        }

        if (exportNoticeBox) exportNoticeBox.style.display = 'none';
        if (submitExportBtn) submitExportBtn.disabled = false;

        try {
          const apiBase = (typeof window.getNgalamApiBase === 'function')
            ? window.getNgalamApiBase()
            : '';

          const res = await fetch(`${apiBase}/api/export/transactions/preview?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&token=${encodeURIComponent(userSession.token)}`, {
            headers: {
              'Authorization': `Bearer ${userSession.token}`
            }
          });

          const data = await res.json();
          if (data && data.success) {
            if (previewCount) previewCount.textContent = `${data.count} Faktur`;
            if (previewOmset) previewOmset.textContent = data.totalOmsetFormatted || formatRupiah(data.totalOmset);
            if (previewDiscount) previewDiscount.textContent = data.totalDiscountFormatted || formatRupiah(data.totalDiscount);

            if (data.count === 0 && exportNoticeBox) {
              exportNoticeBox.style.display = 'block';
              exportNoticeBox.innerHTML = `ℹ️ Tidak ada transaksi tercatat pada rentang tanggal <b>${startDate}</b> s/d <b>${endDate}</b>. File Excel yang diunduh akan tetap memiliki template header dan rekapitulasi kosong.`;
            }
          }
        } catch (err) {
          console.warn('[AdminExport] Preview fetch error:', err.message);
        }
      }, 250);
    }

    // 5. DOWNLOAD EXCEL FILE (.xlsx)
    submitExportBtn?.addEventListener('click', async () => {
      const startDate = startDateInput?.value;
      const endDate = endDateInput?.value;

      if (!startDate || !endDate) {
        alert('Silakan tentukan tanggal mulai dan tanggal akhir ekspor.');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('Tanggal mulai tidak boleh melebihi tanggal akhir.');
        return;
      }

      const originalBtnHTML = submitExportBtn.innerHTML;
      submitExportBtn.disabled = true;
      submitExportBtn.innerHTML = `
        <svg class="auth-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>Menyiapkan File Excel...</span>
      `;

      try {
        const apiBase = (typeof window.getNgalamApiBase === 'function')
          ? window.getNgalamApiBase()
          : '';

        const url = `${apiBase}/api/export/transactions/excel?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&token=${encodeURIComponent(userSession.token)}`;

        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userSession.token}`
          }
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

        // Trigger native browser download
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

        closeExportModal();

        // Notifikasi Toast
        if (typeof window.showToast === 'function') {
          window.showToast(`🎉 File Excel "${filename}" berhasil diunduh!`, 'success');
        } else {
          alert(`🎉 Berhasil!\nFile riwayat transaksi "${filename}" berhasil diekspor dan terunduh ke perangkat Anda.`);
        }

      } catch (err) {
        console.error('[AdminExport] Download failed:', err);
        alert('Gagal mengekspor file Excel: ' + err.message);
      } finally {
        submitExportBtn.disabled = false;
        submitExportBtn.innerHTML = originalBtnHTML;
      }
    });

  });
})();
