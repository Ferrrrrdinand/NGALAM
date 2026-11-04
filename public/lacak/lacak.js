/**
 * NGALAM FIX PRO - Modul Khusus Lacak Unit Servis (Pure Tracking)
 * Didedikasikan 100% untuk pelacakan tiket servis tanpa tercampur dengan formulir login.
 */

document.addEventListener('DOMContentLoaded', () => {
  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  const trackForm = document.getElementById('trackForm');
  const ticketInput = document.getElementById('ticketInput');
  const trackSubmitBtn = document.getElementById('trackSubmitBtn');
  const resultContainer = document.getElementById('trackingResult');
  const emptyPlaceholder = document.getElementById('trackingEmpty');
  const notFoundAlert = document.getElementById('trackingNotFound');
  const loadingIndicator = document.getElementById('trackingLoading');



  // Check URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const initialTicket = urlParams.get('track') || urlParams.get('ticket') || urlParams.get('id');

  if (initialTicket) {
    if (ticketInput) ticketInput.value = initialTicket;
    performTrack(initialTicket);
  }

  trackForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = ticketInput?.value.trim();
    if (!query) return;
    performTrack(query);
  });

  // Handle Quick Chip Example Clicks
  document.querySelectorAll('.quick-chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ticket = btn.getAttribute('data-ticket');
      if (ticket && ticketInput) {
        ticketInput.value = ticket;
        performTrack(ticket);
      }
    });
  });

  // Core tracking request
  async function performTrack(query) {
    if (!query) return;

    if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
    if (notFoundAlert) notFoundAlert.classList.add('hidden');
    if (resultContainer) resultContainer.classList.add('hidden');
    if (loadingIndicator) loadingIndicator.classList.remove('hidden');

    if (trackSubmitBtn) {
      trackSubmitBtn.disabled = true;
      trackSubmitBtn.innerHTML = '<span>⏳ Melacak...</span>';
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (trackSubmitBtn) {
        trackSubmitBtn.disabled = false;
        trackSubmitBtn.innerHTML = '<span>Lacak Unit <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>';
      }

      if (data.success && data.data) {
        renderTrackingResult(data.data);
      } else {
        if (notFoundAlert) notFoundAlert.classList.remove('hidden');
      }
    } catch (err) {
      if (loadingIndicator) loadingIndicator.classList.add('hidden');
      if (trackSubmitBtn) {
        trackSubmitBtn.disabled = false;
        trackSubmitBtn.innerHTML = '<span>Lacak Unit <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>';
      }
      if (notFoundAlert) notFoundAlert.classList.remove('hidden');
    }
  }

  // Render order timeline and detail
  function renderTrackingResult(order) {
    if (!resultContainer) return;

    const step = parseInt(order.step || 1, 10);
    const stepsData = [
      { num: 1, label: 'HP Diterima', desc: 'Unit diterima di workshop & antrian aktif', time: order.createdAt || 'Selesai' },
      { num: 2, label: 'HP Dalam Pengecekan', desc: 'Pemeriksaan fisik & diagnosa lab teknisi', time: step >= 2 ? 'Sedang Diperiksa' : 'Menunggu' },
      { num: 3, label: 'HP Dikerjakan', desc: 'Perbaikan komponen & pergantian part', time: step >= 3 ? (order.technician || 'Teknisi Sedang Mengerjakan') : 'Antrian' },
      { num: 4, label: 'HP Dicek Kualitas Pekerjaan', desc: 'Quality control & uji fungsi 24 titik', time: step >= 4 ? 'Pengujian Kualitas' : 'Menunggu' },
      { num: 5, label: 'HP Selesai / Siap Diambil', desc: 'Pengerjaan tuntas & siap diambil pelanggan', time: step >= 5 ? 'Siap Diambil' : 'Estimasi Selesai' }
    ];

    const timelineHtml = stepsData.map((s) => {
      let statusClass = 'pending';
      let icon = s.num;
      if (s.num < step) {
        statusClass = 'completed';
        icon = '<svg class="svg-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      } else if (s.num === step) {
        statusClass = 'active';
        icon = '<svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
      }

      return `
        <div class="tracking-step ${statusClass}">
          <div class="tracking-step-node">${icon}</div>
          <div class="tracking-step-content">
            <strong>${s.label}</strong>
            <small>${s.desc}</small>
            <div class="tracking-step-meta">${s.time}</div>
          </div>
        </div>
      `;
    }).join('');

    resultContainer.innerHTML = `
      <div class="tracking-card">
        <div class="tracking-card-header">
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span class="tracking-ticket-badge">${order.id}</span>
              <span class="tracking-status-badge step-${step}">${order.status}</span>
            </div>
            <h3 style="margin:8px 0 2px;font-size:1.35rem;color:#0f172a;">${order.phoneType}</h3>
            <p style="margin:0;color:#64748b;font-size:0.86rem;">Pemilik: <b>${order.customerName}</b> • Wilayah: ${order.district || 'Malang'}</p>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.82rem;color:#64748b;">Estimasi Biaya</div>
            <div style="font-size:1.4rem;font-weight:800;color:#0284c7;">${order.cost || 'Rp 250.000'}</div>
          </div>
        </div>

        <div class="tracking-timeline-box">
          <div style="font-weight:700;color:#0f172a;margin-bottom:14px;font-size:0.95rem;">
            <svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> Progres Pengerjaan di Meja Lab:
          </div>
          <div class="tracking-timeline">
            ${timelineHtml}
          </div>
        </div>

        <div class="tracking-details-grid">
          <div class="tracking-detail-item">
            <span>Keluhan & Kerusakan:</span>
            <strong>${order.damageDescription || 'Perbaikan Komponen'}</strong>
          </div>
          <div class="tracking-detail-item">
            <span>Teknisi Penanggung Jawab:</span>
            <strong><svg class="svg-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> ${order.technician || 'Rian Workshop (Meja 1)'}</strong>
          </div>
          <div class="tracking-detail-item">
            <span>Metode Servis:</span>
            <strong><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg> ${order.method || 'Antar-Jemput Mitra / Walk-in'}</strong>
          </div>
          <div class="tracking-detail-item">
            <span>Catatan Diagnosa Lab:</span>
            <strong style="color:#0284c7;">${order.diagnoseNote || 'Unit sedang dalam penanganan teknisi.'}</strong>
          </div>
        </div>

        <div class="tracking-card-actions">
          <a href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20status%20tiket%20${encodeURIComponent(order.id)}" target="_blank" rel="noopener noreferrer" class="btn small" style="background:#25d366;border-color:#25d366;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            <span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Hubungi Customer Care</span>
          </a>
          <a href="../login/index.html" class="btn small outline" style="border-radius:10px;text-decoration:none;">
            <span><svg class="svg-ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Masuk ke Akun Member Pelanggan ↗</span>
          </a>
        </div>
      </div>
    `;

    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
