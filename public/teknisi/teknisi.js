/**
 * NGALAM FIX PRO - Meja Kerja Pengerjaan Khusus Teknisi Lab Workshop
 * Terfokus 100% pada penanganan 5 status unit HP yang ditugaskan oleh Admin.
 */

document.addEventListener('DOMContentLoaded', () => {
  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

  // 5 Tahapan Resmi Sesuai Permintaan
  const STAGES = [
    { step: 1, label: 'HP Diterima', desc: 'Unit diterima di workshop & antrian aktif' },
    { step: 2, label: 'HP Dalam Pengecekan', desc: 'Pemeriksaan fisik & diagnosa teknisi' },
    { step: 3, label: 'HP Dikerjakan', desc: 'Proses perbaikan lab & penggantian part' },
    { step: 4, label: 'HP Dicek Kualitas Pekerjaan', desc: 'Quality control & uji fungsi pengerjaan' },
    { step: 5, label: 'HP Selesai / Siap Diambil', desc: 'Pengerjaan selesai & siap diambil' }
  ];

  // State
  let currentUser = null;
  let allOrders = [];
  let editingOrderId = null;

  // DOM Elements
  const deskAvatarBig = document.getElementById('deskAvatarBig');
  const deskTechName = document.getElementById('deskTechName');
  const deskLocationBadge = document.getElementById('deskLocationBadge');
  const deskSpecialtyText = document.getElementById('deskSpecialtyText');
  const deskStatusBadge = document.getElementById('deskStatusBadge');
  const techUserBadge = document.getElementById('techUserBadge');
  const techUserAvatar = document.getElementById('techUserAvatar');
  const techUserName = document.getElementById('techUserName');
  const techLogoutBtn = document.getElementById('techLogoutBtn');
  const refreshTechBtn = document.getElementById('refreshTechBtn');
  const myAssignedCount = document.getElementById('myAssignedCount');
  const myCompletedTodayCount = document.getElementById('myCompletedTodayCount');
  const techSearchInput = document.getElementById('techSearchInput');
  const technicianCardsContainer = document.getElementById('technicianCardsContainer');
  const techNotificationBox = document.getElementById('techNotificationBox');

  // Modal Note Elements
  const noteModal = document.getElementById('noteModal');
  const noteModalTitle = document.getElementById('noteModalTitle');
  const noteModalInput = document.getElementById('noteModalInput');
  const cancelNoteModalBtn = document.getElementById('cancelNoteModalBtn');
  const saveNoteModalBtn = document.getElementById('saveNoteModalBtn');

  // =========================================================================
  // 1. AUTHENTICATION & SESSION GUARD
  // =========================================================================
  function initSession() {
    try {
      const raw = localStorage.getItem('ngalam_tech_session');
      if (!raw) {
        window.location.href = 'login.html';
        return false;
      }
      currentUser = JSON.parse(raw);
      if (!currentUser || currentUser.role !== 'teknisi' || currentUser.username !== 'ferdinand') {
        localStorage.removeItem('ngalam_tech_session');
        window.location.href = 'login.html';
        return false;
      }
    } catch (err) {
      localStorage.removeItem('ngalam_tech_session');
      window.location.href = 'login.html';
      return false;
    }

    // Populate header & desk profile
    if (techUserName) techUserName.textContent = currentUser.name || 'Ferdinand (Teknisi Lab)';
    if (techUserAvatar) techUserAvatar.textContent = currentUser.avatar || '🔬';

    if (deskTechName) deskTechName.textContent = currentUser.name || 'Ferdinand (Teknisi Lab)';
    if (deskAvatarBig) deskAvatarBig.textContent = currentUser.avatar || '🔬';
    if (deskLocationBadge) deskLocationBadge.textContent = currentUser.desk || 'Meja Lab Workshop - Teknisi Utama';
    if (deskSpecialtyText) deskSpecialtyText.textContent = `Spesialisasi: ${currentUser.specialty || 'Spesialis Servis Smartphone & Hardware Lab'}`;

    return true;
  }

  // Logout Elements & Animated Handler (Desktop & Mobile)
  const techLogoutBtnMobile = document.getElementById('techLogoutBtnMobile');
  const logoutConfirmModal = document.getElementById('logoutConfirmModal');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  const confirmLogoutActionBtn = document.getElementById('confirmLogoutActionBtn');
  const logoutAnimationOverlay = document.getElementById('logoutAnimationOverlay');
  const logoutProgressFill = document.getElementById('logoutProgressFill');
  const logoutCircleIcon = document.getElementById('logoutCircleIcon');
  const logoutSubtitle = document.getElementById('logoutSubtitle');
  const logoutStatusStepText = document.getElementById('logoutStatusStepText');

  function openLogoutConfirm() {
    if (logoutConfirmModal) {
      logoutConfirmModal.style.display = 'flex';
    } else {
      executeLogoutSequence();
    }
  }

  cancelLogoutBtn?.addEventListener('click', () => {
    if (logoutConfirmModal) logoutConfirmModal.style.display = 'none';
  });

  confirmLogoutActionBtn?.addEventListener('click', () => {
    if (logoutConfirmModal) logoutConfirmModal.style.display = 'none';
    executeLogoutSequence();
  });

  async function executeLogoutSequence() {
    // Show Futuristic Animated Logout Overlay
    if (logoutAnimationOverlay) {
      logoutAnimationOverlay.style.display = 'flex';
      if (logoutSubtitle) {
        logoutSubtitle.textContent = `Menutup sesi ${currentUser?.name || 'Ferdinand'}...`;
      }

      // Step 1: 30%
      setTimeout(() => {
        if (logoutProgressFill) logoutProgressFill.style.width = '35%';
        if (logoutCircleIcon) logoutCircleIcon.textContent = '🔒';
        if (logoutStatusStepText) logoutStatusStepText.textContent = 'Menyimpan log audit aktivitas meja lab...';
      }, 200);

      // Step 2: 75%
      setTimeout(() => {
        if (logoutProgressFill) logoutProgressFill.style.width = '80%';
        if (logoutCircleIcon) logoutCircleIcon.textContent = '🚪';
        if (logoutStatusStepText) logoutStatusStepText.textContent = 'Menonaktifkan kehadiran status meja menjadi Offline...';
      }, 600);

      // Step 3: 100%
      setTimeout(() => {
        if (logoutProgressFill) logoutProgressFill.style.width = '100%';
        if (logoutCircleIcon) logoutCircleIcon.textContent = '👋';
        if (logoutStatusStepText) logoutStatusStepText.textContent = 'Sampai jumpa! Mengalihkan ke halaman login...';
      }, 1000);
    }

    // Call server to update offline presence
    if (currentUser) {
      try {
        await fetch(`${API_BASE}/api/technicians/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: currentUser.username,
            action: 'offline'
          })
        });
      } catch (_) {}
    }

    // Clear local authentication storage
    localStorage.removeItem('ngalam_tech_session');
    sessionStorage.clear();
    document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';

    setTimeout(() => {
      window.location.href = 'login.html?logged_out=1';
    }, logoutAnimationOverlay ? 1350 : 300);
  }

  techLogoutBtn?.addEventListener('click', openLogoutConfirm);
  techLogoutBtnMobile?.addEventListener('click', openLogoutConfirm);

  // =========================================================================
  // 2. DATA LOADING & FILTERING
  // =========================================================================
  async function loadData() {
    try {
      if (window.resolveNgalamApiBase) {
        try {
          API_BASE = await window.resolveNgalamApiBase();
        } catch (_) {}
      }

      const res = await fetch(`${API_BASE}/api/orders`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        allOrders = data.data;
        renderWorkbench();
      }
    } catch (err) {
      showNotification('Gagal memuat antrean tiket dari server: ' + err.message, false);
    }
  }

  function showNotification(msg, isSuccess = true) {
    if (!techNotificationBox) return;
    techNotificationBox.style.display = 'block';
    if (isSuccess) {
      techNotificationBox.style.background = 'rgba(16, 185, 129, 0.15)';
      techNotificationBox.style.border = '1.5px solid #10b981';
      techNotificationBox.style.color = '#047857';
      techNotificationBox.innerHTML = `<b>🎉 Berhasil:</b> ${msg}`;
    } else {
      techNotificationBox.style.background = 'rgba(239, 68, 68, 0.15)';
      techNotificationBox.style.border = '1.5px solid #ef4444';
      techNotificationBox.style.color = '#dc2626';
      techNotificationBox.innerHTML = `<b>⚠️ Pemberitahuan:</b> ${msg}`;
    }
    setTimeout(() => {
      techNotificationBox.style.display = 'none';
    }, 4500);
  }

  /**
   * Filter orders assigned by Admin to the currently logged in technician.
   * If not assigned to this technician, it will NOT appear.
   */
  function isOrderAssignedToMe(order) {
    if (!order || !currentUser) return false;
    const uName = (currentUser.username || 'ferdinand').toLowerCase();

    // 1. Exact match on assignedTechnicianUsername
    if (order.assignedTechnicianUsername && order.assignedTechnicianUsername.toLowerCase() === uName) {
      return true;
    }

    // 2. Match on technician string name / username
    if (order.technician) {
      const tStr = order.technician.toLowerCase();
      if (tStr.includes(uName) || tStr.includes('ferdinand')) return true;
    }

    return false;
  }

  // =========================================================================
  // 3. RENDER WORKBENCH (EMPTY STATE VS ASSIGNED JOBS)
  // =========================================================================
  function renderWorkbench() {
    if (!technicianCardsContainer) return;

    // Filter to this technician's orders
    const myOrders = allOrders.filter(isOrderAssignedToMe);

    // Apply search query
    const searchQuery = (techSearchInput?.value || '').toLowerCase().trim();
    const visibleOrders = myOrders.filter((order) => {
      if (!searchQuery) return true;
      const text = `${order.id} ${order.customerName} ${order.phoneType} ${order.damageDescription}`.toLowerCase();
      return text.includes(searchQuery);
    });

    // Update Header Counter Stats
    if (myAssignedCount) {
      const activeCount = myOrders.filter((o) => (parseInt(o.step, 10) || 1) < 5).length;
      myAssignedCount.textContent = `${activeCount} Aktif`;
    }
    if (myCompletedTodayCount) {
      const doneCount = myOrders.filter((o) => (parseInt(o.step, 10) || 1) >= 5).length;
      myCompletedTodayCount.textContent = `${doneCount} Selesai`;
    }

    // Update Shift Status Text
    const activeHandling = myOrders.find((o) => {
      const s = parseInt(o.step, 10) || 1;
      return s >= 2 && s <= 4;
    });

    if (deskStatusBadge) {
      if (activeHandling) {
        deskStatusBadge.innerHTML = `<span style="color: #b45309; font-weight: 800;">🟡 Sedang Menangani: ${activeHandling.phoneType} (Tiket: ${activeHandling.id})</span>`;
      } else if (myOrders.length > 0) {
        deskStatusBadge.innerHTML = `<span style="color: #047857; font-weight: 800;">🟢 Standby: Ada ${myOrders.length} Unit Menunggu Tindakan Anda</span>`;
      } else {
        deskStatusBadge.innerHTML = `<span style="color: #475569; font-weight: 700;">⚪ Meja Standby (Status Kosong - Belum Ada Tugas dari Admin)</span>`;
      }
    }

    // -----------------------------------------------------------------------
    // EMPTY STATE: IF NO ORDERS ARE ASSIGNED BY ADMIN TO THIS TECHNICIAN
    // -----------------------------------------------------------------------
    if (myOrders.length === 0) {
      technicianCardsContainer.innerHTML = `
        <div class="workbench-empty-card">
          <div class="workbench-empty-icon">🔬✨</div>
          <h3 style="font-size: 1.45rem; font-weight: 800; color: #0f172a; margin: 0 0 8px;">
            Meja Kerja Bersih & Standby
          </h3>
          <p style="color: #475569; font-size: 0.95rem; margin: 0 auto 20px; max-width: 580px; line-height: 1.6;">
            Halo <b>${currentUser.name}</b>, saat ini meja kerja lab Anda dalam status standby (kosong). Belum ada unit HP yang dialokasikan oleh Admin counter ke akun meja Anda.
          </p>
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 999px; background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #047857; font-size: 0.88rem; font-weight: 800;">
            🟢 Status Meja: Standby & Siap Menerima Pengerjaan Unit dari Admin
          </div>
          <div class="workbench-empty-grid">
            <div class="workbench-empty-hint">
              <strong style="color: #0284c7; font-size: 0.9rem; display: block; margin-bottom: 4px;">📋 Alokasi Unit dari Admin:</strong>
              <span style="font-size: 0.84rem; color: #64748b; line-height: 1.4; display: block;">Ketika Admin counter walk-in menugaskan unit HP ke meja Anda, tiket pengerjaan akan otomatis muncul di sini secara real-time.</span>
            </div>
            <div class="workbench-empty-hint">
              <strong style="color: #059669; font-size: 0.9rem; display: block; margin-bottom: 4px;">🔄 Pemantauan 5 Tahapan:</strong>
              <span style="font-size: 0.84rem; color: #64748b; line-height: 1.4; display: block;">Anda dapat memperbarui 5 tahapan pengerjaan (HP Diterima s/d HP Selesai / Siap Diambil) dan menambahkan catatan lab langsung.</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // If search returns 0 results
    if (visibleOrders.length === 0) {
      technicianCardsContainer.innerHTML = `
        <div class="workbench-empty-card" style="padding: 48px 24px;">
          <div class="workbench-empty-icon" style="font-size: 2.2rem; width: 64px; height: 64px; margin-bottom: 14px;">🔍</div>
          <h3 style="color: #0f172a; font-size: 1.25rem; font-weight: 800; margin: 0 0 6px;">Tidak Ada Unit yang Cocok</h3>
          <p style="margin: 0 auto; font-size: 0.9rem; color: #64748b; max-width: 480px;">
            Tidak ditemukan unit yang sesuai dengan kata kunci pencarian. Silakan coba cari berdasarkan nomor tiket, tipe HP, atau nama pemilik lainnya.
          </p>
        </div>
      `;
      return;
    }

    // -----------------------------------------------------------------------
    // RENDER ASSIGNED UNIT CARDS WITH 5 OFFICIAL STATUSES
    // -----------------------------------------------------------------------
    technicianCardsContainer.innerHTML = visibleOrders.map((order) => {
      const step = parseInt(order.step, 10) || 1;
      const isFinished = step >= 5;
      const currentStageObj = STAGES[step - 1] || STAGES[0];
      const nextStageObj = step < 5 ? STAGES[step] : null;

      // 5-Step visual stepper nodes
      const stepperNodesHtml = STAGES.map((s) => {
        let nodeClass = '';
        let iconContent = s.step;
        if (s.step < step) {
          nodeClass = 'completed';
          iconContent = '✓';
        } else if (s.step === step) {
          nodeClass = 'active';
          iconContent = '⚡';
        }

        return `
          <div class="step-pipeline-item ${nodeClass}" title="${s.label} (${s.desc})">
            <div class="step-pipeline-circle">${iconContent}</div>
            <div class="step-pipeline-text">${s.label}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="tech-job-card ${isFinished ? 'finished' : ''}">
          <div>
            <!-- Card Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="background: #eff6ff; color: #0284c7; font-size: 0.76rem; font-weight: 800; padding: 4px 10px; border-radius: 8px; letter-spacing: 0.5px; border: 1px solid #bae6fd;">
                    ${order.id}
                  </span>
                  <span style="font-size: 0.74rem; color: #64748b;">${order.createdAt || '-'}</span>
                </div>
                <h3 style="font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 8px 0 2px;">
                  ${order.phoneType}
                </h3>
                <div style="color: #475569; font-size: 0.84rem;">
                  Pemilik: <b style="color: #0f172a;">${order.customerName}</b> (${order.whatsapp || '-'})
                </div>
              </div>

              <!-- Current Stage Badge -->
              <div style="text-align: right;">
                <span style="display: inline-block; font-size: 0.8rem; font-weight: 800; padding: 5px 12px; border-radius: 999px; background: ${isFinished ? '#ecfdf5' : '#eff6ff'}; color: ${isFinished ? '#047857' : '#0284c7'}; border: 1.5px solid ${isFinished ? '#a7f3d0' : '#bae6fd'};">
                  ${isFinished ? '✅ ' : '⚡ '}Status: ${currentStageObj.label}
                </span>
                <div style="font-size: 0.72rem; color: #64748b; margin-top: 4px;">Langkah ${step} dari 5</div>
              </div>
            </div>

            <!-- Visual 5-Stage Stepper -->
            <div class="stepper-pipeline">
              ${stepperNodesHtml}
            </div>

            <!-- Unit Details Box -->
            <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 14px; font-size: 0.86rem;">
              <div style="margin-bottom: 6px;">
                <span style="color: #64748b;">Gejala Kerusakan:</span>
                <strong style="color: #dc2626; display: block; margin-top: 2px;">⚠️ ${order.damageDescription || '-'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; flex-wrap: wrap; gap: 8px;">
                <div><span style="color: #64748b;">Estimasi Biaya:</span> <strong style="color: #047857;">${order.cost || 'Rp 250.000'}</strong></div>
                <div><span style="color: #64748b;">PIN/Kunci:</span> <strong style="color: #0f172a;">${order.screenPin || 'Tidak Ada'}</strong></div>
                <div><span style="color: #64748b;">Penanggung Jawab:</span> <strong style="color: #0284c7;">${order.technician || currentUser.name}</strong></div>
              </div>
            </div>

            <!-- Diagnosa Note Box -->
            <div style="background: #fefce8; border: 1.5px solid #fef08a; border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; font-size: 0.84rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="color: #a16207; font-weight: 800;">📋 Catatan Lab Teknisi:</span>
                <button type="button" onclick="openNoteModal('${order.id}')" style="background: none; border: none; color: #0284c7; font-size: 0.78rem; font-weight: 700; cursor: pointer; text-decoration: underline;">
                  ✏️ Edit Catatan
                </button>
              </div>
              <div style="color: #713f12; line-height: 1.4;">
                ${order.diagnoseNote || 'Belum ada catatan diagnosa tambahan dari meja kerja.'}
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons: Advance 5 Stages -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              ${!isFinished ? `
                <button type="button" class="btn small" onclick="advanceToNextStage('${order.id}', ${step})" style="flex: 1; padding: 12px; font-size: 0.9rem; font-weight: 800; border-radius: 10px; background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.2);">
                  <span>Naik ke: ${nextStageObj ? nextStageObj.label : 'Tahap Berikutnya'} ➔</span>
                </button>
              ` : `
                <div style="flex: 1; padding: 12px; font-size: 0.88rem; font-weight: 800; border-radius: 10px; background: #ecfdf5; border: 1.5px solid #a7f3d0; color: #047857; text-align: center;">
                  ✅ Pengerjaan Telah Selesai (Unit Siap Diambil / Diserahkan)
                </div>
              `}
              <button type="button" class="btn small outline" onclick="openNoteModal('${order.id}')" style="padding: 12px 16px; font-size: 0.86rem; font-weight: 700; border-radius: 10px; border: 1.5px solid #cbd5e1; color: #334155; background: #ffffff;">
                <span>📝 Catatan</span>
              </button>
            </div>

            <!-- Direct Stage Quick Select (Jump to any of the 5 statuses) -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 0.74rem; color: #64748b; background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span>Ubah Status Langsung:</span>
              <div style="display: flex; gap: 4px;">
                ${STAGES.map((s) => `
                  <button type="button" onclick="setSpecificStage('${order.id}', ${s.step})" style="padding: 3px 8px; border-radius: 6px; font-size: 0.74rem; font-weight: 700; border: 1px solid ${s.step === step ? '#0284c7' : '#cbd5e1'}; background: ${s.step === step ? '#eff6ff' : '#ffffff'}; color: ${s.step === step ? '#0284c7' : '#475569'}; cursor: pointer;" title="${s.label}">
                    ${s.step}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 4. STEP TRANSITION LOGIC (5 STATUSES REALTIME)
  // =========================================================================
  window.advanceToNextStage = async function (id, currentStep) {
    if (currentStep >= 5) {
      alert('Unit ini sudah berada di tahapan akhir (HP Selesai / Siap Diambil).');
      return;
    }
    const nextStep = currentStep + 1;
    await updateStageOnServer(id, nextStep);
  };

  window.setSpecificStage = async function (id, targetStep) {
    if (targetStep < 1 || targetStep > 5) return;
    const targetObj = STAGES[targetStep - 1];
    if (confirm(`Ubah status tiket ${id} menjadi "${targetObj.label}"?`)) {
      await updateStageOnServer(id, targetStep);
    }
  };

  async function updateStageOnServer(id, targetStep) {
    const targetStage = STAGES[targetStep - 1];
    if (!targetStage) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: targetStep,
          status: targetStage.label,
          technician: currentUser ? currentUser.name : 'Teknisi Lab Workshop',
          assignedTechnicianUsername: currentUser ? currentUser.username : 'rian'
        })
      });
      const data = await res.json();

      if (data.success) {
        showNotification(`Status tiket ${id} diperbarui menjadi: "${targetStage.label}"! Transparan ke Admin & Pelanggan.`);

        // Synchronize presence
        if (currentUser) {
          if (targetStep >= 2 && targetStep <= 4) {
            await fetch(`${API_BASE}/api/technicians/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: currentUser.username,
                action: 'handled phone',
                orderDetails: {
                  id,
                  phoneType: data.data?.phoneType || 'Smartphone',
                  customerName: data.data?.customerName || 'Pelanggan',
                  step: targetStep
                }
              })
            });
          } else if (targetStep === 5) {
            await fetch(`${API_BASE}/api/technicians/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: currentUser.username,
                action: 'standby',
                orderId: id
              })
            });
          }
        }

        await loadData();
      } else {
        alert('Gagal memperbarui status: ' + (data.message || 'Error'));
      }
    } catch (err) {
      alert('Koneksi server gagal: ' + err.message);
    }
  }

  // =========================================================================
  // 5. DIAGNOSE NOTE MODAL
  // =========================================================================
  window.openNoteModal = function (orderId) {
    const order = allOrders.find((o) => o.id === orderId);
    if (!order) return;
    editingOrderId = orderId;
    if (noteModalTitle) noteModalTitle.textContent = `Catatan Lab: ${order.phoneType} (${order.id})`;
    if (noteModalInput) noteModalInput.value = order.diagnoseNote || '';
    if (noteModal) noteModal.style.display = 'flex';
  };

  cancelNoteModalBtn?.addEventListener('click', () => {
    if (noteModal) noteModal.style.display = 'none';
    editingOrderId = null;
  });

  saveNoteModalBtn?.addEventListener('click', async () => {
    if (!editingOrderId) return;
    const noteText = noteModalInput?.value.trim() || 'Unit dalam proses pengerjaan lab teknisi.';

    try {
      const res = await fetch(`${API_BASE}/api/orders/${editingOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnoseNote: noteText })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Catatan lab untuk tiket ${editingOrderId} berhasil disimpan.`);
        if (noteModal) noteModal.style.display = 'none';
        editingOrderId = null;
        await loadData();
      } else {
        alert('Gagal menyimpan catatan: ' + data.message);
      }
    } catch (err) {
      alert('Error koneksi saat menyimpan catatan: ' + err.message);
    }
  });

  // Search input live trigger
  techSearchInput?.addEventListener('input', () => {
    renderWorkbench();
  });

  // Refresh button
  refreshTechBtn?.addEventListener('click', async () => {
    refreshTechBtn.innerHTML = '🔄 Memuat...';
    await loadData();
    refreshTechBtn.innerHTML = '🔄 Refresh Tugas';
    showNotification('Data antrean unit HP diperbarui dari server.');
  });

  // Initialize
  if (initSession()) {
    loadData();
    // Auto sync every 15s
    setInterval(loadData, 15000);
  }
});
