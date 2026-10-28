/**
 * NGALAM FIX PRO - Modul Khusus Lacak Unit Servis (Pure Tracking)
 * Didedikasikan 100% untuk pelacakan tiket servis tanpa tercampur dengan formulir login.
 */

document.addEventListener('DOMContentLoaded', () => {
  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

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
        trackSubmitBtn.innerHTML = '<span>Lacak Unit 🔍</span>';
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
        trackSubmitBtn.innerHTML = '<span>Lacak Unit 🔍</span>';
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
        icon = '✓';
      } else if (s.num === step) {
        statusClass = 'active';
        icon = '⚡';
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
            📍 Progres Pengerjaan di Meja Lab:
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
            <strong>👨‍🔧 ${order.technician || 'Rian Workshop (Meja 1)'}</strong>
          </div>
          <div class="tracking-detail-item">
            <span>Metode Servis:</span>
            <strong>🛵 ${order.method || 'Antar-Jemput Mitra / Walk-in'}</strong>
          </div>
          <div class="tracking-detail-item">
            <span>Catatan Diagnosa Lab:</span>
            <strong style="color:#0284c7;">${order.diagnoseNote || 'Unit sedang dalam penanganan teknisi.'}</strong>
          </div>
        </div>

        <div class="tracking-card-actions">
          <a href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20status%20tiket%20${encodeURIComponent(order.id)}" target="_blank" rel="noopener noreferrer" class="btn small" style="background:#25d366;border-color:#25d366;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            <span>💬 Hubungi Customer Care</span>
          </a>
          <a href="../login/index.html" class="btn small outline" style="border-radius:10px;text-decoration:none;">
            <span>👤 Masuk ke Akun Member Pelanggan ↗</span>
          </a>
        </div>
      </div>
    `;

    resultContainer.classList.remove('hidden');
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
