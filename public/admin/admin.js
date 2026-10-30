/**
 * NGALAM FIX PRO - Admin Staff & Cashier Dashboard
 * Connected to Node.js backend & PostgreSQL Database
 */

document.addEventListener('DOMContentLoaded', () => {
  let allOrders = [];
  let currentFilter = 'all';
  let cachedTechnicians = [];
  let cachedTechLogs = [];
  let cachedTransactions = [];

  // DOM Elements
  const dbStatusBadge = document.getElementById('dbStatusBadge') || document.getElementById('sheetsStatusBadge');
  const queueTableBody = document.getElementById('queueTableBody');
  const queueCountBadge = document.getElementById('queueCountBadge');
  const quickCountQueue = document.getElementById('quickCountQueue');
  const quickCountTodayTx = document.getElementById('quickCountTodayTx');
  const searchInput = document.getElementById('adminSearchInput');
  const filterTabs = document.querySelectorAll('.filter-tab-btn');
  const clearDataBtn = document.getElementById('clearDataBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // Helper: Retrieve all available technicians with lead technician fallback
  function getAvailableLabTechnicians() {
    const defaultLeadTech = {
      username: 'ferdinand',
      name: 'Ferdinand (Teknisi Lab Workshop)',
      avatar: '🔬',
      desk: 'Meja Lab Workshop - Teknisi Utama',
      specialty: 'Spesialis Servis Smartphone & Hardware Lab',
      onlineStatus: 'online',
      workStatus: 'standby'
    };

    if (!cachedTechnicians || cachedTechnicians.length === 0) {
      return [defaultLeadTech];
    }

    const list = [...cachedTechnicians];
    if (!list.some(t => (t.username || '').toLowerCase() === 'ferdinand')) {
      list.unshift(defaultLeadTech);
    }
    return list;
  }

  // Populate walk-in form technician dropdown dynamically
  function populateWalkinTechniciansDropdown() {
    const walkinTech = document.getElementById('walkinTech');
    if (!walkinTech) return;
    const currentVal = walkinTech.value;
    const techs = getAvailableLabTechnicians();
    walkinTech.innerHTML = techs.map(t => {
      const val = `${t.username}|${t.name}`;
      const statusLabel = t.onlineStatus === 'online' ? '🟢 Online (Siaga)' : '⚪ Siaga Lab';
      return `<option value="${val}" ${t.username.toLowerCase() === 'ferdinand' ? 'selected' : ''}>${t.avatar || '🔬'} ${t.name} - ${statusLabel}</option>`;
    }).join('');
    if (currentVal && walkinTech.querySelector(`option[value="${currentVal}"]`)) {
      walkinTech.value = currentVal;
    }
  }

  // Tab switching (Registrasi Walk-in vs Antrian vs Kasir)
  const navTabs = document.querySelectorAll('.admin-nav-tab');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');

  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      navTabs.forEach((t) => t.classList.remove('active'));
      tabPanels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${target}`)?.classList.add('active');
      if (target === 'queue') {
        fetchOrders();
      } else if (target === 'cashier') {
        fetchOrders();
        fetchFinanceStatus();
        fetchFinanceRecords();
        fetchTransactions();
      } else if (target === 'promos') {
        fetchPromos();
      } else if (target === 'promocodes') {
        fetchPromoCodes();
      } else if (target === 'technicians') {
        fetchTechnicians();
      } else if (target === 'mitras') {
        fetchMitras();
      }
    });
  });


  // Filter tabs (All, Step 1, Step 2-3, Step 4, Step 5)
  filterTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterTabs.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderQueue();
    });
  });

  searchInput?.addEventListener('input', () => {
    renderQueue();
  });

  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  // Check Database / System Status
  async function checkDatabaseStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/database/status`);
      const data = await res.json();
      if (!dbStatusBadge) return;

      dbStatusBadge.className = 'status-tag tag-connected';
      dbStatusBadge.innerHTML = `🟢 <b>Database Sistem Aktif</b> (Siap PostgreSQL)`;
      dbStatusBadge.title = data.message || 'Sistem siap dihubungkan ke PostgreSQL';
    } catch (err) {
      if (dbStatusBadge) {
        dbStatusBadge.className = 'status-tag tag-error';
        dbStatusBadge.innerHTML = `🔴 Server Offline`;
      }
    }
  }

  // Fetch all orders from backend
  async function fetchOrders() {
    try {
      const res = await fetch(`${API_BASE}/api/orders`);
      const json = await res.json();
      if (json.success) {
        allOrders = json.data || [];
        renderQueue();
        updateCashierSummary();
        populateCheckoutTickets();
        if (quickCountQueue) {
          quickCountQueue.textContent = `${allOrders.length} Unit`;
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  }

  // Render Queue Table
  function renderQueue() {
    if (!queueTableBody) return;

    const query = searchInput?.value.trim().toLowerCase() || '';

    const filtered = allOrders.filter((item) => {
      // Status filter
      if (currentFilter === 'step1' && item.step !== 1) return false;
      if (currentFilter === 'step23' && item.step !== 2 && item.step !== 3) return false;
      if (currentFilter === 'step4' && item.step !== 4) return false;
      if (currentFilter === 'step5' && item.step !== 5) return false;

      // Text search
      if (query) {
        const text = `${item.id} ${item.customerName} ${item.whatsapp} ${item.phoneType} ${item.damageDescription}`.toLowerCase();
        return text.includes(query);
      }
      return true;
    });

    if (queueCountBadge) {
      queueCountBadge.textContent = `${filtered.length} Antrian`;
    }

    if (filtered.length === 0) {
      queueTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;padding:48px 20px;color:#64748b;">
            <div style="font-size:2.2rem;margin-bottom:8px;">📭</div>
            <strong style="color:#0f172a;font-size:1.1rem;display:block;">Belum Ada Data Antrian Servis</strong>
            <p style="margin:4px 0 16px;font-size:0.88rem;color:#475569;">Data masih kosong. Anda dapat mendaftarkan unit walk-in pelanggan baru atau menunggu pesanan masuk.</p>
            <div style="display:flex;justify-content:center;gap:10px;">
              <button class="btn small" onclick="document.querySelector('[data-tab=register]').click()">
                + Daftarkan Unit Walk-in Meja 1
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    const availableTechs = getAvailableLabTechnicians();

    filtered.forEach((order) => {
      const step = parseInt(order.step, 10) || 1;
      const stepLabel = 
        step === 1 ? '1. HP Diterima' :
        step === 2 ? '2. HP Dalam Pengecekan' :
        step === 3 ? '3. HP Dikerjakan' :
        step === 4 ? '4. HP Dicek Kualitas Pekerjaan' :
        '5. HP Selesai / Siap Diambil';

      const badgeClass = step === 5 ? 'pill-ready' : step >= 3 ? 'pill-work' : 'pill-queue';

      const assignedUname = (order.assignedTechnicianUsername || '').toLowerCase();
      const techStr = (order.technician || '').toLowerCase();

      let techOptionsHtml = `<option value="">-- Belum Ditugaskan --</option>`;
      availableTechs.forEach((t) => {
        const isSelected = (assignedUname === t.username.toLowerCase()) || (techStr.includes(t.username.toLowerCase()));
        techOptionsHtml += `<option value="${t.username}|${t.name}" ${isSelected ? 'selected' : ''}>${t.avatar || '🔬'} ${t.name}</option>`;
      });

      rowsHtml += `
        <tr>
          <td>
            <strong class="ticket-id-link" onclick="openReceiptModal('${order.id}')">${order.id}</strong>
            <small class="text-muted block">${order.createdAt || '-'}</small>
            <span class="badge-walkin">${order.method || 'Walk-in'}</span>
          </td>
          <td>
            <div style="font-weight:700;color:#0f172a;">${order.customerName}</div>
            <div style="font-size:0.82rem;color:#0284c7;">${order.whatsapp || '-'}</div>
            ${order.email ? `<div style="font-size:0.78rem;color:#2563eb;">✉️ ${order.email}</div>` : ''}
            <small class="text-muted">${order.district || '-'}</small>
          </td>
          <td>
            <div style="font-weight:700;color:#0f172a;">${order.phoneType}</div>
            <div style="font-size:0.82rem;color:#dc2626;">⚠️ ${order.damageDescription}</div>
            <small class="text-muted">Kunci PIN: ${order.screenPin || 'Tidak Ada'}</small>
          </td>
          <td>
            <span class="status-pill-small ${badgeClass}">${stepLabel}</span>
            <div style="margin-top:6px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:6px 8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label style="font-size:0.7rem;color:#475569;font-weight:700;">Teknisi PJ (Handle s/d Akhir):</label>
                <button type="button" onclick="openAssignTechModal('${order.id}')" style="background:#eff6ff; border:1px solid #bae6fd; color:#0284c7; font-size:0.68rem; font-weight:700; padding:2px 6px; border-radius:4px; cursor:pointer;" title="Bagi Antrean ke Teknisi Lab">
                  🔄 Bagi
                </button>
              </div>
              <select onchange="assignTechnicianFromAdmin('${order.id}', this.value)" style="font-size:0.75rem;font-weight:600;padding:4px 6px;border-radius:6px;border:1.5px solid #cbd5e1;background:#ffffff;color:#0f172a;cursor:pointer;width:100%;">
                ${techOptionsHtml}
              </select>
            </div>
          </td>
          <td>
            <div style="font-weight:700;color:#34d399;">${order.cost || 'Rp 0'}</div>
            <small class="text-muted">${order.duration || '45 Menit'}</small>
          </td>
          <td>
            <div class="table-actions">
              ${step < 5 ? `
                <button class="action-btn action-step" onclick="advanceStep('${order.id}', ${step + 1})" title="Naikkan Langkah Pengerjaan">
                  Lanjut Langkah ${step + 1} ↗
                </button>
              ` : `
                <span style="font-size:0.75rem;color:#34d399;font-weight:700;">✅ Siap Diambil</span>
              `}
              <button class="action-btn action-assign" onclick="openAssignTechModal('${order.id}')" title="Bagi Antrean ke Teknisi Lab" style="background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; font-size:0.78rem;">
                👨‍🔧 Bagi Teknisi
              </button>
              <button class="action-btn action-receipt" onclick="openReceiptModal('${order.id}')" title="Cetak Nota Fisik Struk Thermal">
                🖨️ Struk
              </button>
              <a href="https://wa.me/${formatWaNumber(order.whatsapp)}?text=Halo%20kak%20${encodeURIComponent(order.customerName)},%20update%20servis%20HP%20${encodeURIComponent(order.phoneType)}%20(Tiket:%20${encodeURIComponent(order.id)})" target="_blank" class="action-btn action-wa" title="Hubungi Pelanggan via WA">
                💬 WA
              </a>
            </div>
          </td>
        </tr>
      `;
    });

    queueTableBody.innerHTML = rowsHtml;
  }

  function formatWaNumber(phone) {
    if (!phone) return '6281330304321';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  }

  // Admin / Kasir Direct Assign Technician to Order
  window.assignTechnicianFromAdmin = async function (id, rawValue) {
    let techUsername = '';
    let techName = 'Belum Ditugaskan';

    if (rawValue && rawValue.includes('|')) {
      const parts = rawValue.split('|');
      techUsername = parts[0].trim();
      techName = parts[1].trim();
    } else if (rawValue) {
      techUsername = rawValue.trim();
      const match = getAvailableLabTechnicians().find((t) => t.username.toLowerCase() === techUsername.toLowerCase());
      techName = match ? match.name : (techUsername === 'ferdinand' ? 'Ferdinand (Teknisi Lab Workshop)' : techUsername);
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTechnicianUsername: techUsername,
          technician: techName
        })
      });
      const json = await res.json();
      if (json.success) {
        await fetchOrders();
        // Update presence / status
        if (techUsername) {
          try {
            await fetch(`${API_BASE}/api/technicians/status`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: techUsername,
                workStatus: 'handled phone',
                currentJob: {
                  orderId: id,
                  phoneType: (allOrders.find((o) => o.id === id) || {}).phoneType || 'Smartphone'
                }
              })
            });
          } catch (_) {}
        }
      } else {
        alert('Gagal menugaskan teknisi: ' + json.message);
      }
    } catch (err) {
      alert('Error koneksi saat menugaskan teknisi: ' + err.message);
    }
  };

  // Assign Technician Modal bindings
  const assignTechnicianModal = document.getElementById('assignTechnicianModal');
  const assignModalTicketId = document.getElementById('assignModalTicketId');
  const assignModalCustName = document.getElementById('assignModalCustName');
  const assignModalPhoneType = document.getElementById('assignModalPhoneType');
  const assignModalDamage = document.getElementById('assignModalDamage');
  const assignModalTargetTicketId = document.getElementById('assignModalTargetTicketId');
  const assignTechSelect = document.getElementById('assignTechSelect');
  const assignTechnicianForm = document.getElementById('assignTechnicianForm');
  const closeAssignTechModalBtn = document.getElementById('closeAssignTechModalBtn');
  const cancelAssignTechModalBtn = document.getElementById('cancelAssignTechModalBtn');

  window.openAssignTechModal = function (orderId) {
    const order = allOrders.find((o) => o.id === orderId);
    if (!order || !assignTechnicianModal) return;

    if (assignModalTicketId) assignModalTicketId.textContent = order.id;
    if (assignModalCustName) assignModalCustName.textContent = order.customerName;
    if (assignModalPhoneType) assignModalPhoneType.textContent = order.phoneType;
    if (assignModalDamage) assignModalDamage.textContent = order.damageDescription || '-';
    if (assignModalTargetTicketId) assignModalTargetTicketId.value = order.id;

    if (assignTechSelect) {
      const availableTechs = getAvailableLabTechnicians();
      assignTechSelect.innerHTML = availableTechs.map((t) => {
        const isSel = (order.assignedTechnicianUsername || '').toLowerCase() === t.username.toLowerCase();
        const statusText = t.onlineStatus === 'online' ? '🟢 Online (Siaga)' : '⚪ Siaga Lab';
        return `<option value="${t.username}|${t.name}" ${isSel ? 'selected' : ''}>${t.avatar || '🔬'} ${t.name} - ${statusText}</option>`;
      }).join('');
    }

    assignTechnicianModal.style.display = 'flex';
    assignTechnicianModal.classList.add('active');
  };

  function closeAssignTechModal() {
    if (assignTechnicianModal) {
      assignTechnicianModal.style.display = 'none';
      assignTechnicianModal.classList.remove('active');
    }
  }

  closeAssignTechModalBtn?.addEventListener('click', closeAssignTechModal);
  cancelAssignTechModalBtn?.addEventListener('click', closeAssignTechModal);

  assignTechnicianForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticketId = assignModalTargetTicketId?.value;
    const rawVal = assignTechSelect?.value;
    if (!ticketId || !rawVal) return;

    await window.assignTechnicianFromAdmin(ticketId, rawVal);
    closeAssignTechModal();
    const order = allOrders.find((o) => o.id === ticketId);
    const techName = rawVal.includes('|') ? rawVal.split('|')[1] : rawVal;
    alert(`✅ Berhasil!\n\nAntrean unit HP ${(order && order.customerName) || 'Pelanggan'} telah berhasil dimasukkan ke teknisi ${techName} untuk dihandle dari awal hingga akhir.`);
  });

  // Advance Order Step (1 to 5) - Official 5 Statuses
  window.advanceStep = async function (id, nextStep) {
    const statusMap = {
      1: 'HP Diterima',
      2: 'HP Dalam Pengecekan',
      3: 'HP Dikerjakan',
      4: 'HP Dicek Kualitas Pekerjaan',
      5: 'HP Selesai / Siap Diambil',
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: nextStep,
          status: statusMap[nextStep] || 'HP Dalam Pengecekan',
        }),
      });

      const json = await res.json();
      if (json.success) {
        await fetchOrders();
      } else {
        alert('Gagal mengupdate tiket: ' + json.message);
      }
    } catch (err) {
      alert('Error mengupdate: ' + err.message);
    }
  };

  // Walk-in Form Submit (Admin Register Meja 1)
  const walkinForm = document.getElementById('walkinForm');
  walkinForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('walkinSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Menyimpan ke Database & Sistem...</span>';

    const customerName = document.getElementById('walkinCustName')?.value.trim();
    const whatsapp = document.getElementById('walkinCustWa')?.value.trim();
    const district = document.getElementById('walkinCustAddress')?.value.trim() || 'Malang';
    const phoneType = document.getElementById('walkinPhoneType')?.value.trim();
    const modelColor = document.getElementById('walkinModelColor')?.value.trim() || 'Standar';
    const screenCondition = document.getElementById('walkinScreenCond')?.value || 'Normal';
    const bodyCondition = document.getElementById('walkinBodyCond')?.value || 'Mulus 95%';
    const accessories = document.getElementById('walkinAccessories')?.value || 'Unit saja';
    const screenPin = document.getElementById('walkinPin')?.value.trim() || 'Tanpa Sandi';
    const damageDescription = document.getElementById('walkinDamage')?.value.trim();
    const rawTech = document.getElementById('walkinTech')?.value || 'ferdinand|Ferdinand (Teknisi Lab Workshop)';
    let assignedTechnicianUsername = 'ferdinand';
    let technician = 'Ferdinand (Teknisi Lab Workshop)';
    if (rawTech.includes('|')) {
      const parts = rawTech.split('|');
      assignedTechnicianUsername = parts[0].trim();
      technician = parts[1].trim();
    } else if (rawTech) {
      technician = rawTech;
      assignedTechnicianUsername = rawTech.toLowerCase().includes('ferdinand') ? 'ferdinand' : 'teknisi';
    }

    const cost = document.getElementById('walkinCost')?.value.trim() || 'Rp 350.000';
    const duration = document.getElementById('walkinDuration')?.value.trim() || '45 Menit';
    const diagnoseNote = document.getElementById('walkinNotes')?.value.trim() || 'Unit masuk counter Meja 1. Pengecekan visual awal selesai.';

    const payload = {
      customerName,
      whatsapp,
      district,
      phoneType,
      modelColor,
      screenCondition,
      bodyCondition,
      accessories,
      screenPin,
      damageDescription,
      method: 'Walk-in Counter Meja 1',
      technician,
      assignedTechnicianUsername,
      cost,
      duration,
      status: 'HP Diterima',
      step: 1,
      diagnoseNote,
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        walkinForm.reset();
        populateWalkinTechniciansDropdown();
        await fetchOrders();
        // Buka struk thermal otomatis
        openReceiptModal(json.data.id);
      } else {
        alert('Gagal menyimpan: ' + (json.message || 'Error'));
      }
    } catch (err) {
      alert('Error jaringan: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Daftarkan Unit & Terbitkan Nota Struk 🖨️</span>';
    }
  });

  // Thermal Receipt Modal
  const receiptModal = document.getElementById('receiptModal');
  const receiptContent = document.getElementById('receiptContent');
  const closeReceiptBtn = document.getElementById('closeReceiptBtn');
  const printReceiptBtn = document.getElementById('printReceiptBtn');

  window.openReceiptModal = function (ticketId) {
    const order = allOrders.find((o) => o.id === ticketId);
    if (!order || !receiptContent) return;

    receiptContent.innerHTML = `
      <div class="thermal-receipt">
        <div class="receipt-header">
          <h2>NGALAM FIX PRO</h2>
          <p>SPESIALIS SERVIS SMARTPHONE ANDROID & IPHONE</p>
          <p>Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang</p>
          <p>WhatsApp: +62 813-3030-4321 (Liem Hingky Liman)</p>
          <div class="receipt-divider">================================</div>
          <div class="receipt-title">TANDA TERIMA REPARASI MEJA 1</div>
          <div class="receipt-divider">================================</div>
        </div>

        <div class="receipt-meta">
          <div><b>NO. TIKET   :</b> ${order.id}</div>
          <div><b>TANGGAL     :</b> ${order.createdAt || '-'}</div>
          <div><b>PELANGGAN   :</b> ${order.customerName}</div>
          <div><b>NO. WHATSAPP:</b> ${order.whatsapp}</div>
          ${order.email ? `<div><b>EMAIL       :</b> ${order.email}</div>` : ''}
          <div><b>DOMISILI    :</b> ${order.district || 'Malang'}</div>
        </div>

        <div class="receipt-divider">--------------------------------</div>
        <div class="receipt-section-title">DATA PERANGKAT & FISIK</div>
        <div class="receipt-item"><span>Tipe HP       :</span> <b>${order.phoneType}</b></div>
        <div class="receipt-item"><span>Warna/Storage :</span> <span>${order.modelColor || '-'}</span></div>
        <div class="receipt-item"><span>Kondisi Layar :</span> <span>${order.screenCondition || 'Normal'}</span></div>
        <div class="receipt-item"><span>Kondisi Bodi  :</span> <span>${order.bodyCondition || 'Mulus'}</span></div>
        <div class="receipt-item"><span>Kelengkapan   :</span> <span>${order.accessories || 'Unit HP'}</span></div>
        <div class="receipt-item"><span>Kunci PIN     :</span> <b>${order.screenPin || 'Tidak Ada'}</b></div>

        <div class="receipt-divider">--------------------------------</div>
        <div class="receipt-section-title">KERUSAKAN & ESTIMASI</div>
        <div class="receipt-item"><span>Kendala      :</span> <b>${order.damageDescription}</b></div>
        <div class="receipt-item"><span>Teknisi PJ   :</span> <span>${order.technician}</span></div>
        <div class="receipt-item"><span>Estimasi Wkt :</span> <span>${order.duration}</span></div>
        <div class="receipt-item total"><span>ESTIMASI BIAYA:</span> <b>${order.cost}</b></div>

        <div class="receipt-divider">================================</div>
        <div class="receipt-footer">
          <p><b>SYARAT & KETENTUAN GARANSI:</b></p>
          <p>1. Tanda terima ini wajib dibawa saat pengambilan unit.</p>
          <p>2. Garansi berlaku s/d 90 hari untuk part yang diganti.</p>
          <p>3. Garansi gugur jika terkena cairan, jatuh, atau segel rusak.</p>
          <p>4. Lacak status online: http://ngalamfix.com/login</p>
          <br/>
          <p style="text-align:center;">Terima kasih atas kepercayaan Anda!</p>
        </div>
      </div>
    `;

    receiptModal?.classList.add('active');
  };

  closeReceiptBtn?.addEventListener('click', () => {
    receiptModal?.classList.remove('active');
  });

  receiptModal?.addEventListener('click', (e) => {
    if (e.target === receiptModal) {
      receiptModal.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && receiptModal?.classList.contains('active')) {
      receiptModal.classList.remove('active');
    }
  });

  printReceiptBtn?.addEventListener('click', () => {
    window.print();
  });

  // Kosongkan Semua Data Button
  clearDataBtn?.addEventListener('click', async () => {
    const confirmClear = confirm(
      '⚠️ PERINGATAN:\nApakah Anda yakin ingin MENGOSONGKAN SEMUA DATA antrian tiket servis?\nData di database sistem akan di-reset menjadi kosong.'
    );

    if (!confirmClear) return;

    try {
      const res = await fetch(`${API_BASE}/api/orders/clear`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('✅ Semua data antrian berhasil dikosongkan!');
        await fetchOrders();
      } else {
        alert('Gagal: ' + json.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  refreshBtn?.addEventListener('click', fetchOrders);

  // Cashier Summary Calculation
  function updateCashierSummary() {
    const totalOrdersEl = document.getElementById('cashierTotalOrders');
    const totalCompletedEl = document.getElementById('cashierTotalCompleted');
    const totalRevenueEl = document.getElementById('cashierTotalRevenue');

    if (!totalOrdersEl || !totalCompletedEl || !totalRevenueEl) return;

    let completedCount = 0;
    let totalRevenue = 0;

    allOrders.forEach((o) => {
      const step = parseInt(o.step, 10) || 1;
      if (step === 5) {
        completedCount++;
      }
      // Parse cost
      if (o.cost) {
        const num = parseInt(o.cost.replace(/[^0-9]/g, ''), 10) || 0;
        totalRevenue += num;
      }
    });

    totalOrdersEl.textContent = `${allOrders.length} Unit`;
    totalCompletedEl.textContent = `${completedCount} Unit Selesai`;
    totalRevenueEl.textContent = 'Rp ' + totalRevenue.toLocaleString('id-ID');
  }

  // ==============================================
  // 5. BANNER PROMOSI BERANDA (UPLOAD & MANAGEMENT)
  // ==============================================
  let allPromos = [];
  let selectedPromoImage = '';

  const promosListContainer = document.getElementById('promosListContainer');
  const promoCountBadge = document.getElementById('promoCountBadge');
  const activePromoCounter = document.getElementById('activePromoCounter');
  const promoUploadForm = document.getElementById('promoUploadForm');
  const reloadPromosBtn = document.getElementById('reloadPromosBtn');
  const resetPromosBtn = document.getElementById('resetPromosBtn');

  // Input elements for live simulator
  const promoTitleInput = document.getElementById('promoTitleInput');
  const promoDescInput = document.getElementById('promoDescInput');
  const promoBadgeTagInput = document.getElementById('promoBadgeTagInput');
  const promoBadgePillInput = document.getElementById('promoBadgePillInput');
  const promoCodeInput = document.getElementById('promoCodeInput');
  const promoThemeInput = document.getElementById('promoThemeInput');
  const promoBtnTextInput = document.getElementById('promoBtnTextInput');
  const promoBtnLinkInput = document.getElementById('promoBtnLinkInput');

  // File and Preset elements
  const promoSrcFileRadio = document.getElementById('promoSrcFileRadio');
  const promoSrcPresetRadio = document.getElementById('promoSrcPresetRadio');
  const promoFileInputBox = document.getElementById('promoFileInputBox');
  const promoPresetSelectBox = document.getElementById('promoPresetSelectBox');
  const promoDropArea = document.getElementById('promoDropArea');
  const promoFileInput = document.getElementById('promoFileInput');
  const promoPresetSelect = document.getElementById('promoPresetSelect');
  const promoImagePreviewWrap = document.getElementById('promoImagePreviewWrap');
  const promoImagePreviewImg = document.getElementById('promoImagePreviewImg');
  const promoImageInfoTag = document.getElementById('promoImageInfoTag');
  const promoRemoveImageBtn = document.getElementById('promoRemoveImageBtn');

  // Live Simulator elements
  const simBannerImg = document.getElementById('simBannerImg');
  const simBadgeTag = document.getElementById('simBadgeTag');
  const simBadgePill = document.getElementById('simBadgePill');
  const simTitle = document.getElementById('simTitle');
  const simDesc = document.getElementById('simDesc');
  const simCode = document.getElementById('simCode');
  const simBtn = document.getElementById('simBtn');

  // Switch upload mode (File vs Preset)
  promoSrcFileRadio?.addEventListener('change', () => {
    if (promoSrcFileRadio.checked) {
      if (promoFileInputBox) promoFileInputBox.style.display = 'block';
      if (promoPresetSelectBox) promoPresetSelectBox.style.display = 'none';
      if (selectedPromoImage && !selectedPromoImage.startsWith('images/')) {
        if (promoImagePreviewWrap) promoImagePreviewWrap.style.display = 'block';
      } else {
        if (promoImagePreviewWrap) promoImagePreviewWrap.style.display = 'none';
        selectedPromoImage = '';
      }
      updateLiveSimulator();
    }
  });

  promoSrcPresetRadio?.addEventListener('change', () => {
    if (promoSrcPresetRadio.checked) {
      if (promoFileInputBox) promoFileInputBox.style.display = 'none';
      if (promoPresetSelectBox) promoPresetSelectBox.style.display = 'block';
      if (promoPresetSelect) {
        selectedPromoImage = promoPresetSelect.value;
        if (promoImagePreviewWrap) {
          promoImagePreviewWrap.style.display = 'block';
          if (promoImagePreviewImg) promoImagePreviewImg.src = `../${selectedPromoImage}`;
          if (promoImageInfoTag) promoImageInfoTag.textContent = 'Preset: ' + selectedPromoImage;
        }
      }
      updateLiveSimulator();
    }
  });

  promoPresetSelect?.addEventListener('change', () => {
    selectedPromoImage = promoPresetSelect.value;
    if (promoImagePreviewWrap) {
      promoImagePreviewWrap.style.display = 'block';
      if (promoImagePreviewImg) promoImagePreviewImg.src = `../${selectedPromoImage}`;
      if (promoImageInfoTag) promoImageInfoTag.textContent = 'Preset: ' + selectedPromoImage;
    }
    updateLiveSimulator();
  });

  // Handle Drag & Drop / Click on file drop area
  promoDropArea?.addEventListener('click', () => {
    promoFileInput?.click();
  });

  promoDropArea?.addEventListener('dragover', (e) => {
    e.preventDefault();
    promoDropArea.style.borderColor = '#38bdf8';
    promoDropArea.style.background = 'rgba(56, 189, 248, 0.12)';
  });

  promoDropArea?.addEventListener('dragleave', () => {
    promoDropArea.style.borderColor = 'rgba(56, 189, 248, 0.4)';
    promoDropArea.style.background = 'rgba(56, 189, 248, 0.03)';
  });

  promoDropArea?.addEventListener('drop', (e) => {
    e.preventDefault();
    promoDropArea.style.borderColor = 'rgba(56, 189, 248, 0.4)';
    promoDropArea.style.background = 'rgba(56, 189, 248, 0.03)';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  promoFileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, atau WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      selectedPromoImage = evt.target.result;
      if (promoImagePreviewWrap) promoImagePreviewWrap.style.display = 'block';
      if (promoImagePreviewImg) promoImagePreviewImg.src = selectedPromoImage;
      if (promoImageInfoTag) {
        const sizeKb = Math.round(file.size / 1024);
        promoImageInfoTag.textContent = `${file.name} (${sizeKb} KB)`;
      }
      updateLiveSimulator();
    };
    reader.readAsDataURL(file);
  }

  promoRemoveImageBtn?.addEventListener('click', () => {
    selectedPromoImage = '';
    if (promoFileInput) promoFileInput.value = '';
    if (promoImagePreviewWrap) promoImagePreviewWrap.style.display = 'none';
    updateLiveSimulator();
  });

  // Live Simulator updater
  function updateLiveSimulator() {
    if (simTitle && promoTitleInput) {
      simTitle.textContent = promoTitleInput.value.trim() || 'Judul Banner Promosi';
    }
    if (simDesc && promoDescInput) {
      simDesc.textContent = promoDescInput.value.trim() || 'Deskripsi detail promo layanan workshop...';
    }
    if (simBadgeTag && promoBadgeTagInput) {
      simBadgeTag.textContent = promoBadgeTagInput.value.trim() || '🔥 PROMO SPESIAL';
    }
    if (simBadgePill && promoBadgePillInput) {
      simBadgePill.textContent = promoBadgePillInput.value.trim() || '✨ FLASH DEAL';
    }
    if (simCode && promoCodeInput) {
      simCode.textContent = promoCodeInput.value.trim() ? `KODE: ${promoCodeInput.value.trim().toUpperCase()}` : 'PROMO WORKSHOP';
    }
    if (simBtn && promoBtnTextInput) {
      simBtn.textContent = promoBtnTextInput.value.trim() || 'Klaim Promo ↗';
    }

    // Image simulator
    if (simBannerImg) {
      if (selectedPromoImage) {
        if (selectedPromoImage.startsWith('data:') || selectedPromoImage.startsWith('http')) {
          simBannerImg.src = selectedPromoImage;
        } else {
          simBannerImg.src = `../${selectedPromoImage}`;
        }
      } else {
        simBannerImg.src = '../images/promo-banner-1.jpg';
      }
    }

    // Theme color adjustments
    const theme = promoThemeInput?.value || 'purple';
    applySimulatorTheme(theme);
  }

  function applySimulatorTheme(theme) {
    if (!simBadgePill || !simBtn || !simCode) return;

    switch (theme) {
      case 'red':
        simBadgePill.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        simBtn.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
        simCode.style.color = '#f87171';
        simCode.style.borderColor = '#ef4444';
        simCode.style.background = 'rgba(239, 68, 68, 0.2)';
        break;
      case 'green':
        simBadgePill.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        simBtn.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        simCode.style.color = '#34d399';
        simCode.style.borderColor = '#10b981';
        simCode.style.background = 'rgba(16, 185, 129, 0.2)';
        break;
      case 'amber':
        simBadgePill.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        simBtn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
        simCode.style.color = '#fbbf24';
        simCode.style.borderColor = '#f59e0b';
        simCode.style.background = 'rgba(245, 158, 11, 0.2)';
        break;
      case 'blue':
        simBadgePill.style.background = 'linear-gradient(135deg, #2563eb, #3b82f6)';
        simBtn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
        simCode.style.color = '#60a5fa';
        simCode.style.borderColor = '#2563eb';
        simCode.style.background = 'rgba(37, 99, 235, 0.2)';
        break;
      case 'cyan':
        simBadgePill.style.background = 'linear-gradient(135deg, #06b6d4, #0284c7)';
        simBtn.style.background = 'linear-gradient(135deg, #0284c7, #2563eb)';
        simCode.style.color = '#38bdf8';
        simCode.style.borderColor = '#0284c7';
        simCode.style.background = 'rgba(6, 182, 212, 0.2)';
        break;
      case 'purple':
      default:
        simBadgePill.style.background = 'linear-gradient(135deg, #7c3aed, #6366f1)';
        simBtn.style.background = 'linear-gradient(135deg, #7c3aed, #4f46e5)';
        simCode.style.color = '#c084fc';
        simCode.style.borderColor = '#a855f7';
        simCode.style.background = 'rgba(124, 58, 237, 0.2)';
        break;
    }
  }

  // Attach input listeners for instant live simulation
  [
    promoTitleInput,
    promoDescInput,
    promoBadgeTagInput,
    promoBadgePillInput,
    promoCodeInput,
    promoThemeInput,
    promoBtnTextInput,
    promoBtnLinkInput,
  ].forEach((input) => {
    input?.addEventListener('input', updateLiveSimulator);
    input?.addEventListener('change', updateLiveSimulator);
  });

  // Fetch all promos from server
  async function fetchPromos() {
    if (!promosListContainer) return;
    try {
      const res = await fetch(`${API_BASE}/api/promos?all=true`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        allPromos = json.data;
        renderPromosList(allPromos);
      }
    } catch (err) {
      console.error('Error fetching promos:', err);
      promosListContainer.innerHTML = `
        <div style="text-align: center; color: #f87171; padding: 24px; background: rgba(239,68,68,0.1); border-radius: 10px;">
          ⚠️ Gagal mengambil data banner promosi. Pastikan server Node berjalan.
        </div>
      `;
    }
  }

  function renderPromosList(list) {
    if (!promosListContainer) return;

    if (promoCountBadge) {
      promoCountBadge.textContent = `${list.length} Banner`;
    }
    if (activePromoCounter) {
      const activeCount = list.filter((p) => p.active !== false).length;
      activePromoCounter.textContent = `${activeCount} Aktif / ${list.length} Total`;
    }

    if (list.length === 0) {
      promosListContainer.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 30px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 2rem; margin-bottom: 8px;">📭</div>
          <p style="margin: 0;">Belum ada banner promosi. Gunakan formulir di sebelah kiri untuk mengunggah banner pertama.</p>
        </div>
      `;
      return;
    }

    promosListContainer.innerHTML = '';

    list.forEach((promo, idx) => {
      const card = document.createElement('div');
      card.style.background = '#ffffff';
      card.style.border = promo.active !== false ? '1.5px solid #bae6fd' : '1px solid #e2e8f0';
      card.style.borderRadius = '14px';
      card.style.padding = '16px';
      card.style.display = 'grid';
      card.style.gridTemplateColumns = '120px 1fr auto';
      card.style.gap = '16px';
      card.style.alignItems = 'center';
      card.style.boxShadow = '0 2px 10px rgba(15,23,42,0.04)';
      card.style.transition = 'all 0.2s ease';

      const imgSrc = promo.image.startsWith('http') || promo.image.startsWith('data:') 
        ? promo.image 
        : `../${promo.image}`;

      const isActive = promo.active !== false;

      card.innerHTML = `
        <div style="position: relative; width: 120px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc;">
          <img src="${imgSrc}" alt="${promo.title}" style="width: 100%; height: 100%; object-fit: cover; opacity: ${isActive ? '1' : '0.45'};">
          <span style="position: absolute; top: 4px; left: 4px; background: rgba(15,23,42,0.75); color: #fff; font-size: 0.68rem; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
            #${idx + 1}
          </span>
        </div>

        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
            <span style="background: #eff6ff; border: 1px solid #bae6fd; color: #0284c7; font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
              ${promo.badgeTag || 'PROMO'}
            </span>
            <span style="font-size: 0.68rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
              ${promo.badgePill || ''}
            </span>
            ${isActive 
              ? '<span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">● AKTIF DI BERANDA</span>'
              : '<span style="background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">○ NONAKTIF</span>'
            }
          </div>

          <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 4px; line-height: 1.3;">
            ${promo.title}
          </strong>

          <p style="color: #475569; font-size: 0.78rem; margin: 0 0 6px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${promo.description || ''}
          </p>

          <div style="display: flex; gap: 8px; align-items: center; font-size: 0.72rem;">
            ${promo.promoCode ? `<span style="font-family: monospace; color: #0284c7; background: #eff6ff; padding: 1px 6px; border-radius: 4px; border: 1px dashed #38bdf8;">KODE: ${promo.promoCode}</span>` : ''}
            <span style="color: #64748b;">Tombol: <b>${promo.buttonText}</b></span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; min-width: 105px;">
          <button type="button" class="btn small change-photo-btn" data-id="${promo.id}" style="font-size: 0.78rem; padding: 6px 10px; background: #f0fdf4; border: 1.5px solid #86efac; color: #16a34a; font-weight: 700; cursor: pointer; border-radius: 8px;">
            📷 Ganti Foto
          </button>
          <input type="file" class="hidden-promo-file-input" data-id="${promo.id}" accept="image/png, image/jpeg, image/webp" style="display: none;">
          <button type="button" class="btn small toggle-promo-btn" data-id="${promo.id}" style="font-size: 0.78rem; padding: 6px 10px; background: ${isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; border: 1px solid ${isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; color: ${isActive ? '#dc2626' : '#059669'}; font-weight: 700;">
            ${isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <button type="button" class="btn small delete-promo-btn" data-id="${promo.id}" data-title="${promo.title}" style="font-size: 0.78rem; padding: 6px 10px; background: #ffffff; border: 1px solid #cbd5e1; color: #64748b;">
            🗑️ Hapus
          </button>
        </div>
      `;

      promosListContainer.appendChild(card);
    });

    // Attach event listeners for Ganti Foto (Instant PostgreSQL Sync)
    promosListContainer.querySelectorAll('.change-photo-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const fileInput = promosListContainer.querySelector(`.hidden-promo-file-input[data-id="${id}"]`);
        if (fileInput) fileInput.click();
      });
    });

    promosListContainer.querySelectorAll('.hidden-promo-file-input').forEach((input) => {
      input.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
          alert('Ukuran gambar terlalu besar. Maksimal 15 MB.');
          return;
        }

        const id = input.getAttribute('data-id');
        const btn = promosListContainer.querySelector(`.change-photo-btn[data-id="${id}"]`);
        const originalText = btn ? btn.innerHTML : '📷 Ganti Foto';
        if (btn) {
          btn.innerHTML = '⏳ Menyimpan...';
          btn.disabled = true;
        }

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            const res = await fetch(`${API_BASE}/api/promos/${id}/image`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64Data })
            });
            const json = await res.json();
            if (json.success) {
              alert(`✅ Berhasil! Foto banner #${id} telah diganti dan sistem langsung mengeksekusi UPDATE banners SET image_url = ... di PostgreSQL!`);
              fetchPromos();
            } else {
              alert('Gagal mengganti foto banner: ' + (json.error || 'Terjadi kesalahan'));
            }
          } catch (err) {
            alert('Error saat mengganti foto banner: ' + err.message);
          } finally {
            if (btn) {
              btn.innerHTML = originalText;
              btn.disabled = false;
            }
          }
        };
        reader.readAsDataURL(file);
      });
    });

    // Attach event listeners for Toggle & Delete buttons
    promosListContainer.querySelectorAll('.toggle-promo-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        btn.textContent = 'Memproses...';
        btn.disabled = true;
        try {
          const res = await fetch(`${API_BASE}/api/promos/${id}/toggle`, { method: 'PATCH' });
          const json = await res.json();
          if (json.success) {
            fetchPromos();
          } else {
            alert('Gagal mengubah status: ' + json.error);
          }
        } catch (e) {
          alert('Error: ' + e.message);
        }
      });
    });

    promosListContainer.querySelectorAll('.delete-promo-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        if (confirm(`Apakah Anda yakin ingin menghapus banner "${title}"?`)) {
          btn.textContent = 'Menghapus...';
          btn.disabled = true;
          try {
            const res = await fetch(`${API_BASE}/api/promos/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
              fetchPromos();
            } else {
              alert('Gagal menghapus: ' + json.error);
            }
          } catch (e) {
            alert('Error: ' + e.message);
          }
        }
      });
    });
  }

  // Handle Form Submission (Upload / Add Banner)
  promoUploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = promoTitleInput?.value.trim();
    const desc = promoDescInput?.value.trim();
    const badgeTag = promoBadgeTagInput?.value.trim() || '🔥 PROMO SPESIAL';
    const badgePill = promoBadgePillInput?.value.trim() || '✨ FLASH DEAL';
    const promoCode = promoCodeInput?.value.trim() || '';
    const theme = promoThemeInput?.value || 'purple';
    const btnText = promoBtnTextInput?.value.trim() || 'Klaim Promo ↗';
    const btnLink = promoBtnLinkInput?.value.trim() || '#';
    const promoActiveInput = document.getElementById('promoActiveInput');
    const isBannerActive = promoActiveInput ? promoActiveInput.value === 'true' : true;

    if (!title) {
      alert('Mohon isi Judul Utama Banner.');
      promoTitleInput?.focus();
      return;
    }

    if (!selectedPromoImage) {
      if (promoSrcPresetRadio?.checked) {
        selectedPromoImage = promoPresetSelect?.value || 'images/promo-banner-1.jpg';
      } else {
        alert('Mohon pilih atau unggah gambar banner terlebih dahulu.');
        return;
      }
    }

    const saveBtn = document.getElementById('savePromoBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Mengunggah & Mempublikasikan Banner...</span>';

    try {
      const payload = {
        title,
        description: desc,
        badgeTag,
        badgePill,
        theme,
        promoCode,
        buttonText: btnText,
        buttonLink: btnLink,
        image: selectedPromoImage,
        active: isBannerActive,
      };

      const res = await fetch(`${API_BASE}/api/promos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(isBannerActive 
          ? '🎉 Berhasil! Banner promosi telah disimpan dan langsung aktif di beranda.' 
          : '📁 Berhasil! Banner disimpan sebagai draft (nonaktif di beranda).');
        // Reset form
        promoUploadForm.reset();
        selectedPromoImage = '';
        if (promoImagePreviewWrap) promoImagePreviewWrap.style.display = 'none';
        updateLiveSimulator();
        fetchPromos();
      } else {
        alert('Gagal menyimpan banner: ' + json.error);
      }
    } catch (err) {
      alert('Error mengunggah banner: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  });

  // Reload & Reset Buttons
  reloadPromosBtn?.addEventListener('click', fetchPromos);

  resetPromosBtn?.addEventListener('click', async () => {
    if (confirm('Kembalikan 3 banner promosi bawaan standar workshop Ngalam Fix Pro?')) {
      try {
        const res = await fetch(`${API_BASE}/api/promos/reset`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          alert('Banner berhasil di-reset ke standar.');
          fetchPromos();
        }
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  });

  // ==========================================================
  // 🎟️ PROMO CODE MANAGEMENT PORTAL (REAL-TIME & AUTO-EXPIRING)
  // ==========================================================
  let allPromoCodes = [];
  let promoCodeFilter = 'all';

  const promoCodeForm = document.getElementById('promoCodeForm');
  const promoCodesListContainer = document.getElementById('promoCodesListContainer');
  const statTotalPromos = document.getElementById('statTotalPromos');
  const statActivePromos = document.getElementById('statActivePromos');
  const statExpiredPromos = document.getElementById('statExpiredPromos');
  const promoCodeCountBadge = document.getElementById('promoCodeCountBadge');
  const promoInpValidUntil = document.getElementById('promoInpValidUntil');
  const promoInpType = document.getElementById('promoInpType');
  const promoValueLabel = document.getElementById('promoValueLabel');
  const promoInpValue = document.getElementById('promoInpValue');
  const refreshPromoCodesBtn = document.getElementById('refreshPromoCodesBtn');
  const promoCodeFilterBtns = document.querySelectorAll('.promo-code-filter-btn');

  // Set default expiry date to 30 days from now
  if (promoInpValidUntil && !promoInpValidUntil.value) {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    promoInpValidUntil.value = d.toISOString().split('T')[0];
  }

  // Handle discount type dropdown change
  promoInpType?.addEventListener('change', () => {
    if (promoInpType.value === 'percentage') {
      if (promoValueLabel) promoValueLabel.textContent = 'Nilai Diskon (%) *';
      if (promoInpValue) {
        promoInpValue.placeholder = '30';
        promoInpValue.max = '100';
      }
    } else {
      if (promoValueLabel) promoValueLabel.textContent = 'Nilai Potongan (Rp) *';
      if (promoInpValue) {
        promoInpValue.placeholder = '50000';
        promoInpValue.removeAttribute('max');
      }
    }
  });

  // Filter tabs (All, Active, Expired)
  promoCodeFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      promoCodeFilterBtns.forEach((b) => {
        b.style.background = 'rgba(255, 255, 255, 0.05)';
        b.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        b.style.color = '#cbd5e1';
      });
      btn.style.background = 'rgba(56, 189, 248, 0.2)';
      btn.style.borderColor = '#38bdf8';
      btn.style.color = '#ffffff';

      promoCodeFilter = btn.getAttribute('data-filter') || 'all';
      renderPromoCodes();
    });
  });

  // Fetch all promo codes from backend
  async function fetchPromoCodes() {
    if (!promoCodesListContainer) return;
    try {
      const res = await fetch(`${API_BASE}/api/promo-codes/admin`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        allPromoCodes = json.data;

        // Calculate and update stats
        const activeCount = allPromoCodes.filter((p) => p.status === 'ACTIVE').length;
        const expiredCount = allPromoCodes.filter((p) => p.status === 'EXPIRED').length;

        if (statTotalPromos) statTotalPromos.textContent = allPromoCodes.length;
        if (statActivePromos) statActivePromos.textContent = activeCount;
        if (statExpiredPromos) statExpiredPromos.textContent = expiredCount;
        if (promoCodeCountBadge) promoCodeCountBadge.textContent = `${activeCount} Aktif`;

        // Populate active promo codes datalist for banner creation form
        const promoDatalist = document.getElementById('activePromoCodesDatalist');
        if (promoDatalist) {
          promoDatalist.innerHTML = '';
          allPromoCodes.filter((p) => p.status === 'ACTIVE').forEach((p) => {
            const opt = document.createElement('option');
            opt.value = p.code;
            opt.label = `${p.name} (${p.discountType === 'percentage' ? p.discountValue + '%' : 'Rp ' + Number(p.discountValue).toLocaleString('id-ID')})`;
            promoDatalist.appendChild(opt);
          });
        }

        renderPromoCodes();
      }
    } catch (err) {
      promoCodesListContainer.innerHTML = `<div style="text-align: center; color: #fca5a5; padding: 24px;">Gagal memuat kode promo: ${err.message}</div>`;
    }
  }

  // Auto-fill button link when admin types or selects a promo code in banner form
  promoCodeInput?.addEventListener('input', () => {
    const raw = (promoCodeInput.value || '').trim();
    if (raw && !raw.startsWith('🛡️') && !raw.startsWith('⚡')) {
      const clean = raw.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
      if (promoBtnLinkInput && clean) {
        promoBtnLinkInput.value = `pesan-servis/index.html?promo=${clean}`;
      }
      if (promoBtnTextInput && clean) {
        promoBtnTextInput.value = `Klaim Promo ${clean} ↗`;
      }
    }
  });

  // Render Promo Codes List
  function renderPromoCodes() {
    if (!promoCodesListContainer) return;

    let list = allPromoCodes;
    if (promoCodeFilter === 'ACTIVE') {
      list = allPromoCodes.filter((p) => p.status === 'ACTIVE');
    } else if (promoCodeFilter === 'EXPIRED') {
      list = allPromoCodes.filter((p) => p.status === 'EXPIRED');
    }

    if (list.length === 0) {
      promoCodesListContainer.innerHTML = `
        <div style="text-align: center; color: #64748b; padding: 36px; background: #ffffff; border-radius: 12px; border: 1.5px dashed #cbd5e1; box-shadow: 0 2px 10px rgba(15,23,42,0.04);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🎟️</div>
          <strong style="color: #0f172a; display: block;">Tidak Ada Kode Promo Ditemukan</strong>
          <span style="font-size: 0.82rem; color: #475569;">Gunakan formulir di sebelah kiri untuk membuat kode promo baru.</span>
        </div>
      `;
      return;
    }

    promoCodesListContainer.innerHTML = '';

    list.forEach((promo) => {
      const card = document.createElement('div');
      card.style.background = '#ffffff';
      card.style.borderRadius = '14px';
      card.style.padding = '18px 20px';
      card.style.boxShadow = '0 2px 10px rgba(15,23,42,0.04)';
      card.style.transition = 'all 0.2s ease';

      // Status pill badge styling
      let statusBadgeHtml = '';
      if (promo.status === 'ACTIVE') {
        card.style.border = '1px solid #86efac';
        statusBadgeHtml = '<span class="status-pill-badge active" style="background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;">● AKTIF</span>';
      } else if (promo.status === 'EXPIRED') {
        card.style.border = '1px solid #fca5a5';
        statusBadgeHtml = '<span class="status-pill-badge expired" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;">⚠️ KEDALUWARSA</span>';
      } else if (promo.status === 'QUOTA_FULL') {
        card.style.border = '1px solid #fde047';
        statusBadgeHtml = '<span class="status-pill-badge quota-full" style="background:#fefce8;color:#a16207;border:1px solid #fef08a;">⚡ KUOTA HABIS</span>';
      } else {
        card.style.border = '1px solid #e2e8f0';
        statusBadgeHtml = '<span class="status-pill-badge inactive" style="background:#f1f5f9;color:#64748b;border:1px solid #e2e8f0;">○ NONAKTIF</span>';
      }

      // Format Discount Label
      const discountLabel = promo.discountType === 'percentage'
        ? `${promo.discountValue}% OFF`
        : `Rp ${Number(promo.discountValue).toLocaleString('id-ID')} OFF`;

      // Calculate days remaining / elapsed
      const today = new Date();
      const expiryDate = new Date(promo.validUntil + 'T23:59:59.999Z');
      const diffMs = expiryDate - today;
      const daysDiff = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let expiryNote = '';
      if (daysDiff > 0) {
        expiryNote = `<span style="color: #0284c7; font-weight: 600;">⏱️ Sisa ${daysDiff} hari lagi</span>`;
      } else if (daysDiff === 0) {
        expiryNote = `<span style="color: #d97706; font-weight: 700;">⏱️ Berakhir Hari Ini!</span>`;
      } else {
        expiryNote = `<span style="color: #dc2626; font-weight: 700;">🚫 Kedaluwarsa ${Math.abs(daysDiff)} hari lalu (Otomatis Hilang dari Pelanggan)</span>`;
      }

      // Quota percent
      const used = promo.usedCount || 0;
      const limit = promo.usageLimit || 100;
      const pct = Math.min(100, Math.round((used / limit) * 100));

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; flex-wrap: wrap;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap;">
              <span style="font-family: 'JetBrains Mono', monospace; font-size: 1.15rem; font-weight: 900; color: #0284c7; background: #eff6ff; border: 1px dashed #38bdf8; padding: 3px 10px; border-radius: 8px; letter-spacing: 1.5px;">
                ${promo.code}
              </span>
              <span style="background: linear-gradient(135deg, #059669, #10b981); color: #ffffff; font-weight: 800; font-size: 0.76rem; padding: 3px 10px; border-radius: 999px;">
                ${discountLabel}
              </span>
              ${statusBadgeHtml}
            </div>
            <strong style="color: #0f172a; font-size: 1rem; display: block; margin-bottom: 4px;">
              ${promo.name}
            </strong>
            <p style="color: #475569; font-size: 0.82rem; margin: 0 0 10px; line-height: 1.4;">
              ${promo.description || 'Tidak ada catatan tambahan.'}
            </p>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" class="btn small copy-promo-link-btn" data-code="${promo.code}" style="font-size: 0.78rem; padding: 6px 12px; background: #eff6ff; border: 1px solid #bae6fd; color: #0284c7; font-weight: 600;" title="Salin tautan langsung booking promo">
              🔗 Salin Link
            </button>
            <button type="button" class="btn small toggle-promo-code-btn" data-id="${promo.id}" data-active="${promo.active}" style="font-size: 0.78rem; padding: 6px 12px; background: ${promo.active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; border: 1px solid ${promo.active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; color: ${promo.active ? '#dc2626' : '#059669'}; font-weight: 700;">
              ${promo.active ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
            <button type="button" class="btn small delete-promo-code-btn" data-id="${promo.id}" data-code="${promo.code}" style="font-size: 0.78rem; padding: 6px 10px; background: #ffffff; border: 1px solid #cbd5e1; color: #64748b;" title="Hapus promo">
              🗑️
            </button>
          </div>
        </div>

        <!-- Details Bar -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 0.78rem;">
          <div>
            <span style="color: #64748b; display: block;">Masa Berlaku (Valid Until):</span>
            <strong style="color: #0f172a;">📅 ${promo.validUntil}</strong>
            <div style="margin-top: 2px;">${expiryNote}</div>
          </div>
          <div>
            <span style="color: #64748b; display: block;">Pemakaian Kuota:</span>
            <strong style="color: #0f172a;">📊 ${used} / ${limit} Pelanggan (${pct}%)</strong>
            <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 999px; margin-top: 5px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${pct >= 100 ? '#ef4444' : '#0284c7'};"></div>
            </div>
          </div>
          <div>
            <span style="color: #64748b; display: block;">Ketentuan Belanja:</span>
            <span style="color: #334155;">Min: Rp ${Number(promo.minSpend || 0).toLocaleString('id-ID')}${promo.maxDiscount ? ` | Maks: Rp ${Number(promo.maxDiscount).toLocaleString('id-ID')}` : ''}</span>
          </div>
        </div>
      `;

      promoCodesListContainer.appendChild(card);
    });

    // Attach Event Listeners for Copy, Toggle, Delete
    promoCodesListContainer.querySelectorAll('.copy-promo-link-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        const url = `${window.location.origin}/pesan-servis/index.html?promo=${encodeURIComponent(code)}`;
        navigator.clipboard.writeText(url).then(() => {
          const original = btn.innerHTML;
          btn.innerHTML = '✅ Tersalin!';
          setTimeout(() => { btn.innerHTML = original; }, 2000);
        }).catch(() => {
          prompt('Salin tautan ini:', url);
        });
      });
    });

    promoCodesListContainer.querySelectorAll('.toggle-promo-code-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const currentActive = btn.getAttribute('data-active') === 'true';
        btn.textContent = 'Memproses...';
        btn.disabled = true;

        try {
          const res = await fetch(`${API_BASE}/api/promo-codes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !currentActive }),
          });
          const json = await res.json();
          if (json.success) {
            fetchPromoCodes();
          } else {
            alert('Gagal mengubah status: ' + (json.error || 'Terjadi kesalahan'));
          }
        } catch (e) {
          alert('Error: ' + e.message);
        }
      });
    });

    promoCodesListContainer.querySelectorAll('.delete-promo-code-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const code = btn.getAttribute('data-code');
        if (confirm(`Apakah Anda yakin ingin menghapus kode promo "${code}"?`)) {
          btn.textContent = '...';
          btn.disabled = true;
          try {
            const res = await fetch(`${API_BASE}/api/promo-codes/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
              fetchPromoCodes();
            } else {
              alert('Gagal menghapus: ' + (json.error || 'Terjadi kesalahan'));
            }
          } catch (e) {
            alert('Error: ' + e.message);
          }
        }
      });
    });
  }

  // Handle Promo Form Submit
  promoCodeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('promoInpCode')?.value.trim().toUpperCase();
    const name = document.getElementById('promoInpName')?.value.trim();
    const discountType = document.getElementById('promoInpType')?.value || 'percentage';
    const discountValue = Number(document.getElementById('promoInpValue')?.value) || 0;
    const minSpend = Number(document.getElementById('promoInpMinSpend')?.value) || 0;
    const maxDiscountRaw = document.getElementById('promoInpMaxDiscount')?.value;
    const maxDiscount = maxDiscountRaw ? Number(maxDiscountRaw) : null;
    const validUntil = document.getElementById('promoInpValidUntil')?.value;
    const usageLimit = Number(document.getElementById('promoInpUsageLimit')?.value) || 100;
    const description = document.getElementById('promoInpDesc')?.value.trim() || '';
    const active = document.getElementById('promoInpActive')?.value === 'true';

    if (!code || !name || !validUntil || discountValue <= 0) {
      alert('Mohon lengkapi Kode, Nama, Tanggal Masa Berlaku, dan Nilai Diskon.');
      return;
    }

    const saveBtn = document.getElementById('btnSavePromoCode');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>⏳ Menyimpan Kode Promo...</span>';

    try {
      const payload = {
        code,
        name,
        discountType,
        discountValue,
        minSpend,
        maxDiscount,
        validUntil,
        usageLimit,
        description,
        active,
      };

      const res = await fetch(`${API_BASE}/api/promo-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(`🎉 Berhasil! Kode promo "${code}" berhasil diterbitkan dan siap memotong harga transaksi pelanggan.`);
        promoCodeForm.reset();
        // Reset default date
        if (promoInpValidUntil) {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          promoInpValidUntil.value = d.toISOString().split('T')[0];
        }
        fetchPromoCodes();
      } else {
        alert('Gagal menyimpan kode promo: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  });

  refreshPromoCodesBtn?.addEventListener('click', fetchPromoCodes);

  // Auth Session & Profile Handling
  async function initAdminAuth() {
    const rawUser = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    let user = null;
    try {
      if (rawUser) user = JSON.parse(rawUser);
    } catch (e) {}

    if (!user || !user.token) {
      window.location.replace('login.html?reason=required');
      return;
    }

    const adminUserName = document.getElementById('adminUserName');
    const adminUserAvatar = document.getElementById('adminUserAvatar');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserAvatar = document.getElementById('dropdownUserAvatar');
    const dropdownUserRole = document.getElementById('dropdownUserRole');

    if (user && user.name) {
      const displayName = user.name.split('(')[0].trim();
      if (adminUserName) adminUserName.textContent = displayName;
      if (adminUserAvatar && user.avatar) adminUserAvatar.textContent = user.avatar;
      if (dropdownUserName) dropdownUserName.textContent = displayName;
      if (dropdownUserAvatar && user.avatar) dropdownUserAvatar.textContent = user.avatar;
    }

    // Role & Tier UI Enforcement: Kasir (Limited) vs Super Admin (Full)
    const isKasir = (user.role === 'kasir');
    const isFullAccess = !isKasir && (user.isSuperAdmin === true || user.role === 'owner' || user.role === 'admin' || user.accessLevel === 'full');

    const headerPill = document.querySelector('.logo-pill');
    const roleBannerAvatar = document.getElementById('roleBannerAvatar');
    const roleBannerTitle = document.getElementById('roleBannerTitle');
    const roleBannerBadge = document.getElementById('roleBannerBadge');
    const roleBannerDesc = document.getElementById('roleBannerDesc');

    if (dropdownUserRole) {
      dropdownUserRole.textContent = isKasir ? 'FRONT DESK KASIR' : 'SUPER ADMIN (AKSES PENUH)';
    }

    if (isKasir) {
      if (headerPill) {
        headerPill.textContent = 'KASIR MEJA 1';
        headerPill.style.background = '#7c3aed';
        headerPill.style.color = '#ffffff';
      }
      if (roleBannerAvatar) roleBannerAvatar.textContent = '👩‍💼';
      if (roleBannerTitle) roleBannerTitle.textContent = `Peran Kerja: ${user.name || 'Kasir Meja 1'} (Kasir Front Desk)`;
      if (roleBannerBadge) {
        roleBannerBadge.textContent = 'FRONT DESK KASIR';
        roleBannerBadge.style.background = '#f5f3ff';
        roleBannerBadge.style.color = '#7c3aed';
        roleBannerBadge.style.borderColor = '#ddd6fe';
      }
      if (roleBannerDesc) {
        roleBannerDesc.textContent = 'Hak akses aktif: (1) Mendaftarkan kerusakan HP offline, (2) Membagi antrean HP ke teknisi lab PJ, (3) Transaksi kasir & cetak struk harian.';
      }

      // Hide tabs not meant for cashier
      const restrictedTabs = document.querySelectorAll('[data-tab="promos"], [data-tab="promocodes"], [data-tab="technicians"], [data-tab="mitras"], a[href="../teknisi/index.html"]');
      restrictedTabs.forEach((el) => el.style.display = 'none');

      const clearBtn = document.getElementById('clearDataBtn');
      if (clearBtn) clearBtn.style.display = 'none';

      // In cashier panel: hide Buku Kas Besar and database config button
      const subtabBtnFinances = document.getElementById('subtabBtnFinances');
      if (subtabBtnFinances) subtabBtnFinances.style.display = 'none';
      const subpanelFinances = document.getElementById('subpanelFinances');
      if (subpanelFinances) subpanelFinances.style.display = 'none';
      const openDbConfigModalBtn = document.getElementById('openDbConfigModalBtn') || document.getElementById('openSheetsConfigModalBtn');
      if (openDbConfigModalBtn) openDbConfigModalBtn.style.display = 'none';

      // Auto activate subpanel transactions for cashier
      if (typeof switchCashierSubtab === 'function') {
        switchCashierSubtab('transactions');
      }
    } else {
      if (headerPill) {
        headerPill.textContent = 'SUPER ADMIN (AKSES PENUH)';
        headerPill.style.background = '#d97706';
        headerPill.style.color = '#ffffff';
      }
      if (roleBannerAvatar) roleBannerAvatar.textContent = '👑';
      if (roleBannerTitle) roleBannerTitle.textContent = `Peran Kerja: ${user.name || 'Super Admin'} (Owner / Manager)`;
      if (roleBannerBadge) {
        roleBannerBadge.textContent = 'SUPER USER / KONTROL PENUH';
        roleBannerBadge.style.background = '#fef3c7';
        roleBannerBadge.style.color = '#b45309';
        roleBannerBadge.style.borderColor = '#fde68a';
      }
      if (roleBannerDesc) {
        roleBannerDesc.textContent = 'Kendali penuh seluruh sistem: Walk-in counter, pembagian antrean teknisi, kasir, buku kas besar, banner promosi, kode voucher, dan manajemen database.';
      }

      // Show all tabs for super admin
      const allTabs = document.querySelectorAll('.admin-nav-tab');
      allTabs.forEach((el) => el.style.display = '');

      const clearBtn = document.getElementById('clearDataBtn');
      if (clearBtn) clearBtn.style.display = '';

      const subtabBtnFinances = document.getElementById('subtabBtnFinances');
      if (subtabBtnFinances) subtabBtnFinances.style.display = '';
      const openSheetsConfigModalBtn = document.getElementById('openSheetsConfigModalBtn');
      if (openSheetsConfigModalBtn) openSheetsConfigModalBtn.style.display = '';
    }

    // Verify session with backend asynchronously (skip for local/offline tokens)
    try {
      if (user.token && !user.token.startsWith('NGF-TOKEN-LOCAL-')) {
        const verifyRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        if (!verifyRes.ok && verifyRes.status === 401) {
          console.warn('[AdminAuth] Server reported expired token.');
          localStorage.removeItem('ngalam_auth_user');
          sessionStorage.removeItem('ngalam_auth_user');
          document.cookie = "ngalam_token=; path=/; max-age=0";
          window.location.replace('login.html?reason=expired');
          return;
        }
      }
    } catch (err) {
      console.warn('[AdminAuth] Server verification check skipped (offline/local mode):', err.message);
    }

    adminLogoutBtn?.addEventListener('click', async () => {
      if (confirm('Apakah Anda yakin ingin keluar dari akun admin?')) {
        try {
          if (user && user.token) {
            await fetch(`${API_BASE}/api/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: user.token }),
            });
          }
        } catch (e) {}
        localStorage.removeItem('ngalam_auth_user');
        sessionStorage.removeItem('ngalam_auth_user');
        document.cookie = "ngalam_token=; path=/; max-age=0";
        window.location.href = 'login.html?reason=logged_out';
      }
    });
  }

  // =========================================================================
  // MONITORING TIM TEKNISI LAB LIVE (ADMIN VIEW)
  // (cachedTechnicians and cachedTechLogs are declared at closure level)

  const techOnlineBadge = document.getElementById('techOnlineBadge');
  const kpiTechTotal = document.getElementById('kpiTechTotal');
  const kpiTechOnline = document.getElementById('kpiTechOnline');
  const kpiTechHandled = document.getElementById('kpiTechHandled');
  const kpiTechStandby = document.getElementById('kpiTechStandby');
  const kpiTechOffline = document.getElementById('kpiTechOffline');
  const techniciansCardsList = document.getElementById('techniciansCardsList');
  const technicianLogsTableBody = document.getElementById('technicianLogsTableBody');
  const refreshTechRosterBtn = document.getElementById('refreshTechRosterBtn');
  const techLogSearchInput = document.getElementById('techLogSearchInput');

  async function fetchTechnicians(isSilent = false) {
    try {
      if (!isSilent && refreshTechRosterBtn) {
        refreshTechRosterBtn.textContent = '⏳ Memuat...';
      }
      const res = await fetch(`${API_BASE}/api/technicians`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        cachedTechnicians = json.data;
        cachedTechLogs = json.logs || [];

        // Calculate KPIs
        const total = cachedTechnicians.length;
        const onlineCount = cachedTechnicians.filter((t) => t.onlineStatus === 'online').length;
        const handledCount = cachedTechnicians.filter((t) => t.workStatus === 'handled phone').length;
        const standbyCount = cachedTechnicians.filter((t) => t.onlineStatus === 'online' && t.workStatus === 'standby').length;
        const offlineCount = cachedTechnicians.filter((t) => t.onlineStatus === 'offline').length;

        if (kpiTechTotal) kpiTechTotal.textContent = total;
        if (kpiTechOnline) kpiTechOnline.textContent = onlineCount;
        if (kpiTechHandled) kpiTechHandled.textContent = handledCount;
        if (kpiTechStandby) kpiTechStandby.textContent = standbyCount;
        if (kpiTechOffline) kpiTechOffline.textContent = offlineCount;

        if (techOnlineBadge) {
          techOnlineBadge.textContent = `${onlineCount} Online`;
          techOnlineBadge.style.color = onlineCount > 0 ? '#34d399' : '#94a3b8';
          techOnlineBadge.style.borderColor = onlineCount > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(148,163,184,0.3)';
        }

        populateWalkinTechniciansDropdown();
        renderTechniciansList(cachedTechnicians);
        renderTechnicianLogs(cachedTechLogs);
      }
    } catch (err) {
      console.warn('[Admin] Gagal memuat data teknisi:', err.message);
    } finally {
      if (!isSilent && refreshTechRosterBtn) {
        refreshTechRosterBtn.textContent = '🔄 Refresh Status Teknisi';
      }
    }
  }

  function renderTechniciansList(techs) {
    if (!techniciansCardsList) return;
    if (!techs || techs.length === 0) {
      techniciansCardsList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 30px; background: #ffffff; border-radius: 14px; border: 1.5px dashed #cbd5e1; box-shadow: 0 2px 10px rgba(15,23,42,0.04);">
          Tidak ada data staf teknisi lab terdaftar.
        </div>
      `;
      return;
    }

    techniciansCardsList.innerHTML = techs.map((tech) => {
      const isOnline = tech.onlineStatus === 'online';
      const isHandled = isOnline && tech.workStatus === 'handled phone';
      const isStandby = isOnline && tech.workStatus === 'standby';

      let statusBadgeHtml = '';
      let borderStyle = '1px solid #e2e8f0';
      let glowBoxShadow = '0 4px 18px rgba(15,23,42,0.05)';

      if (isHandled) {
        borderStyle = '1.5px solid #facc15';
        glowBoxShadow = '0 8px 24px rgba(234, 179, 8, 0.12)';
        statusBadgeHtml = `
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: #fefce8; border: 1px solid #fde047; color: #a16207; font-size: 0.78rem; font-weight: 800;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #eab308; box-shadow: 0 0 8px #eab308;"></span>
            <span>ONLINE • HANDLED PHONE</span>
          </div>
        `;
      } else if (isStandby) {
        borderStyle = '1.5px solid #86efac';
        glowBoxShadow = '0 8px 24px rgba(16, 185, 129, 0.12)';
        statusBadgeHtml = `
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-size: 0.78rem; font-weight: 800;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981;"></span>
            <span>ONLINE • STANDBY SIAP TERIMA UNIT</span>
          </div>
        `;
      } else {
        borderStyle = '1px solid #e2e8f0';
        statusBadgeHtml = `
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; font-size: 0.78rem; font-weight: 700;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #94a3b8;"></span>
            <span>OFFLINE (DI LUAR SHIFT)</span>
          </div>
        `;
      }

      // Work status details box
      let workDetailsBox = '';
      if (isHandled && tech.currentJob) {
        workDetailsBox = `
          <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 12px; margin: 14px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 0.75rem; color: #a16207; font-weight: 800; text-transform: uppercase;">📱 Sedang Dikerjakan:</span>
              <span style="font-size: 0.72rem; color: #713f12; background: #fef9c3; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid #fef08a;">${tech.currentJob.orderId}</span>
            </div>
            <strong style="color: #0f172a; font-size: 0.95rem; display: block; margin-bottom: 2px;">${tech.currentJob.phoneType}</strong>
            <small style="color: #64748b; display: block;">Pemilik: <b style="color: #0f172a;">${tech.currentJob.customerName}</b></small>
            <div style="margin-top: 6px; font-size: 0.76rem; color: #a16207; font-weight: 600;">
              Tahap: Step ${tech.currentJob.step || 3} (Sedang di Meja Lab)
            </div>
          </div>
        `;
      } else if (isStandby) {
        workDetailsBox = `
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px; margin: 14px 0; font-size: 0.84rem;">
            <div style="color: #059669; font-weight: 700; margin-bottom: 2px;">🟢 Meja Bersih & Siap Terima Unit</div>
            <span style="color: #64748b; font-size: 0.78rem;">Teknisi standby di meja lab, siap mengerjakan tiket walk-in baru atau unit kurir ojol.</span>
          </div>
        `;
      } else {
        workDetailsBox = `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; margin: 14px 0; font-size: 0.82rem; color: #64748b;">
            <span>Teknisi belum login ke portal workshop atau sudah menyelesaikan shift kerja.</span>
          </div>
        `;
      }

      // Quick admin action buttons
      let adminActionButtons = '';
      if (!isOnline) {
        adminActionButtons = `
          <button type="button" class="btn small" onclick="adminSetTechStatus('${tech.username}', 'online')" style="flex: 1; padding: 8px; font-size: 0.8rem; border-radius: 8px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; font-weight: 700;">
            <span>🟢 Set Online</span>
          </button>
        `;
      } else if (isHandled) {
        adminActionButtons = `
          <button type="button" class="btn small" onclick="adminSetTechStatus('${tech.username}', 'standby')" style="flex: 1; padding: 8px; font-size: 0.8rem; border-radius: 8px; background: #eff6ff; border: 1px solid #bae6fd; color: #0284c7; font-weight: 700;">
            <span>✅ Selesai (Set Standby)</span>
          </button>
          <button type="button" class="btn small" onclick="adminSetTechStatus('${tech.username}', 'offline')" style="padding: 8px 12px; font-size: 0.8rem; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239,68,68,0.3); color: #dc2626; font-weight: 600;">
            <span>⚪ Logout</span>
          </button>
        `;
      } else {
        adminActionButtons = `
          <button type="button" class="btn small" onclick="adminAssignSampleJob('${tech.username}')" style="flex: 1; padding: 8px; font-size: 0.8rem; border-radius: 8px; background: #fefce8; border: 1px solid #facc15; color: #a16207; font-weight: 700;">
            <span>🟡 Set Handled Phone</span>
          </button>
          <button type="button" class="btn small" onclick="adminSetTechStatus('${tech.username}', 'offline')" style="padding: 8px 12px; font-size: 0.8rem; border-radius: 8px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239,68,68,0.3); color: #dc2626; font-weight: 600;">
            <span>⚪ Logout</span>
          </button>
        `;
      }

      return `
        <div class="card" style="background: #ffffff; border: ${borderStyle}; border-radius: 18px; padding: 22px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: ${glowBoxShadow};">
          <div>
            <!-- Top Tech Header -->
            <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 14px;">
              <div style="font-size: 2.4rem; line-height: 1; background: #f1f5f9; padding: 10px; border-radius: 14px; border: 1px solid #e2e8f0;">
                ${tech.avatar || '🛠️'}
              </div>
              <div style="flex: 1;">
                <h4 style="font-size: 1.15rem; color: #0f172a; margin: 0 0 2px;">${tech.name}</h4>
                <div style="color: #0284c7; font-size: 0.82rem; font-weight: 700; margin-bottom: 3px;">${tech.desk}</div>
                <div style="color: #64748b; font-size: 0.78rem;">${tech.specialty}</div>
              </div>
            </div>

            <!-- Status Pill -->
            <div style="margin-bottom: 8px;">
              ${statusBadgeHtml}
            </div>

            <!-- Job / Standby Box -->
            ${workDetailsBox}

            <!-- Metrics: Handled Today -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.82rem; margin-bottom: 16px;">
              <span style="color: #64748b;">Unit Selesai Hari Ini:</span>
              <strong style="color: #059669; font-size: 0.95rem;">${tech.handledToday || 0} Unit</strong>
            </div>
          </div>

          <!-- Admin Quick Action Controls -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${adminActionButtons}
          </div>

          <!-- Admin Account Edit / Delete Controls -->
          <div style="display: flex; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0;">
            <button type="button" class="btn small outline" onclick="adminOpenEditTechModal('${tech.id || tech.username}')" style="flex: 1; padding: 7px 10px; font-size: 0.78rem; border-radius: 8px; border: 1.5px solid #cbd5e1; color: #1e293b; font-weight: 700; background: #ffffff;">
              <span>✏️ Edit Akun Teknisi</span>
            </button>
            <button type="button" class="btn small outline" onclick="adminDeleteTech('${tech.id || tech.username}', '${tech.name}')" style="padding: 7px 12px; font-size: 0.78rem; border-radius: 8px; border: 1.5px solid rgba(239, 68, 68, 0.3); color: #dc2626; background: rgba(239, 68, 68, 0.05); font-weight: 700;">
              <span>🗑️ Hapus</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTechnicianLogs(logs) {
    if (!technicianLogsTableBody) return;
    const query = (techLogSearchInput?.value || '').toLowerCase().trim();

    const filtered = (logs || []).filter((l) => {
      if (!query) return true;
      return (
        (l.technicianName || '').toLowerCase().includes(query) ||
        (l.action || '').toLowerCase().includes(query) ||
        (l.details || '').toLowerCase().includes(query) ||
        (l.statusBadge || '').toLowerCase().includes(query)
      );
    });

    if (filtered.length === 0) {
      technicianLogsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 24px; color: #94a3b8;">
            Tidak ada riwayat aktivitas teknisi yang cocok dengan pencarian.
          </td>
        </tr>
      `;
      return;
    }

    technicianLogsTableBody.innerHTML = filtered.map((entry) => {
      let badgeHtml = '';
      if (entry.statusBadge === 'online') {
        badgeHtml = `<span style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">ONLINE</span>`;
      } else if (entry.statusBadge === 'handled') {
        badgeHtml = `<span style="background: rgba(234,179,8,0.2); color: #facc15; border: 1px solid rgba(234,179,8,0.4); padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">HANDLED PHONE</span>`;
      } else if (entry.statusBadge === 'standby') {
        badgeHtml = `<span style="background: rgba(56,189,248,0.2); color: #38bdf8; border: 1px solid rgba(56,189,248,0.4); padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">STANDBY</span>`;
      } else {
        badgeHtml = `<span style="background: rgba(148,163,184,0.15); color: #94a3b8; border: 1px solid rgba(148,163,184,0.3); padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">OFFLINE</span>`;
      }

      return `
        <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; color: #64748b; font-family: monospace; font-size: 0.78rem;">
            ${entry.displayDate || ''} <span style="color: #0284c7;">${entry.displayTime || ''}</span>
          </td>
          <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">
            ${entry.technicianName || entry.username}
          </td>
          <td style="padding: 10px 14px; color: #334155;">
            ${entry.action}
          </td>
          <td style="padding: 10px 14px; color: #64748b; font-size: 0.82rem;">
            ${entry.details}
          </td>
          <td style="padding: 10px 14px; text-align: right;">
            ${badgeHtml}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Admin interactive triggers
  window.adminSetTechStatus = async function (username, action) {
    try {
      const res = await fetch(`${API_BASE}/api/technicians/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTechnicians();
      } else {
        alert('Gagal update status: ' + data.message);
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  window.adminAssignSampleJob = async function (username) {
    const pType = prompt('Masukkan tipe HP yang dikerjakan:', 'iPhone 13 Pro');
    if (!pType) return;
    const cust = prompt('Nama Pelanggan:', 'Ahmad Faiz');
    const orderId = 'NGF-TICKET-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch(`${API_BASE}/api/technicians/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          action: 'handled phone',
          orderDetails: {
            id: orderId,
            phoneType: pType,
            customerName: cust || 'Pelanggan',
            step: 3
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTechnicians();
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  refreshTechRosterBtn?.addEventListener('click', () => fetchTechnicians(false));
  techLogSearchInput?.addEventListener('input', () => renderTechnicianLogs(cachedTechLogs));

  // =========================================================================
  // 👨‍🔧 ADMIN TECHNICIAN MANAGEMENT (ADD, EDIT, DELETE & DATABASE SYNC)
  // =========================================================================
  const openAddTechModalBtn = document.getElementById('openAddTechModalBtn');
  const addEditTechnicianModal = document.getElementById('addEditTechnicianModal');
  const closeTechModalBtn = document.getElementById('closeTechModalBtn');
  const addEditTechnicianForm = document.getElementById('addEditTechnicianForm');
  const techModalMode = document.getElementById('techModalMode');
  const techModalTargetId = document.getElementById('techModalTargetId');
  const techModalTitle = document.getElementById('techModalTitle');
  const techModalHeaderIcon = document.getElementById('techModalHeaderIcon');
  const techModalName = document.getElementById('techModalName');
  const techModalUsername = document.getElementById('techModalUsername');
  const techModalPassword = document.getElementById('techModalPassword');
  const techModalPasswordLabel = document.getElementById('techModalPasswordLabel');
  const techModalPasswordHelp = document.getElementById('techModalPasswordHelp');
  const techModalPhone = document.getElementById('techModalPhone');
  const techModalEmail = document.getElementById('techModalEmail');
  const techModalDesk = document.getElementById('techModalDesk');
  const techModalSpecialty = document.getElementById('techModalSpecialty');
  const saveTechModalBtn = document.getElementById('saveTechModalBtn');

  function openAddTechModal() {
    if (!addEditTechnicianModal) return;
    techModalMode.value = 'add';
    techModalTargetId.value = '';
    techModalTitle.textContent = 'Tambah Teknisi Lab Baru';
    techModalHeaderIcon.textContent = '➕';
    techModalName.value = '';
    techModalUsername.value = '';
    techModalUsername.disabled = false;
    techModalUsername.style.background = '#ffffff';
    techModalPassword.value = '';
    techModalPassword.required = true;
    techModalPasswordLabel.textContent = 'Kata Sandi Akun *';
    techModalPasswordHelp.textContent = 'Disimpan aman ke database';
    techModalPhone.value = '';
    techModalEmail.value = '';
    techModalDesk.value = 'Meja Lab Workshop - Teknisi Utama';
    techModalSpecialty.value = 'Spesialis Servis Smartphone & Hardware Lab';
    addEditTechnicianModal.style.display = 'flex';
    techModalName.focus();
  }

  window.adminOpenEditTechModal = function (techIdOrUsername) {
    if (!addEditTechnicianModal) return;
    const tech = cachedTechnicians.find(
      t => (t.id && String(t.id).toLowerCase() === String(techIdOrUsername).toLowerCase()) ||
           (t.username && String(t.username).toLowerCase() === String(techIdOrUsername).toLowerCase())
    );
    if (!tech) {
      alert('Data teknisi tidak ditemukan dalam cache.');
      return;
    }

    techModalMode.value = 'edit';
    techModalTargetId.value = tech.id || tech.username;
    techModalTitle.textContent = `Edit Data Teknisi: ${tech.name}`;
    techModalHeaderIcon.textContent = '✏️';
    techModalName.value = tech.name || '';
    techModalUsername.value = tech.username || '';
    techModalUsername.disabled = true;
    techModalUsername.style.background = '#f1f5f9';
    techModalPassword.value = '';
    techModalPassword.required = false;
    techModalPasswordLabel.textContent = 'Kata Sandi Baru (Opsional)';
    techModalPasswordHelp.textContent = 'Kosongkan jika tidak ingin mengubah sandi';
    techModalPhone.value = tech.phone || '';
    techModalEmail.value = tech.email || '';
    techModalDesk.value = tech.desk || 'Meja Lab Workshop - Teknisi Utama';
    techModalSpecialty.value = tech.specialty || 'Spesialis Servis Smartphone & Hardware Lab';
    addEditTechnicianModal.style.display = 'flex';
    techModalName.focus();
  };

  function closeTechModal() {
    if (addEditTechnicianModal) addEditTechnicianModal.style.display = 'none';
  }

  openAddTechModalBtn?.addEventListener('click', openAddTechModal);
  closeTechModalBtn?.addEventListener('click', closeTechModal);
  addEditTechnicianModal?.addEventListener('click', (e) => {
    if (e.target === addEditTechnicianModal) closeTechModal();
  });

  // Handle Form Submit (Tambah / Edit Teknisi oleh Admin)
  addEditTechnicianForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mode = techModalMode.value;
    const targetId = techModalTargetId.value;
    const name = techModalName.value.trim();
    const username = techModalUsername.value.trim();
    const password = techModalPassword.value.trim();
    const phone = techModalPhone.value.trim();
    const email = techModalEmail.value.trim();
    const desk = techModalDesk.value.trim();
    const specialty = techModalSpecialty.value.trim();

    if (!name || (!username && mode === 'add') || !phone) {
      alert('Harap lengkapi semua kolom wajib.');
      return;
    }

    if (mode === 'add' && (!password || password.length < 4)) {
      alert('Kata sandi untuk teknisi baru minimal 4 karakter.');
      return;
    }

    if (saveTechModalBtn) {
      saveTechModalBtn.disabled = true;
      saveTechModalBtn.innerHTML = '<span>⏳ Menyimpan ke Database...</span>';
    }

    try {
      const url = mode === 'add'
        ? `${API_BASE}/api/technicians`
        : `${API_BASE}/api/technicians/${encodeURIComponent(targetId)}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      const bodyPayload = {
        name,
        phone,
        email,
        desk,
        specialty
      };
      if (mode === 'add') {
        bodyPayload.username = username;
        bodyPayload.password = password;
      } else if (password) {
        bodyPayload.password = password;
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();

      if (data.success) {
        alert(data.message || 'Data teknisi berhasil disimpan ke database!');
        closeTechModal();
        await fetchTechnicians(false);
      } else {
        alert('Gagal: ' + (data.error || data.message));
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    } finally {
      if (saveTechModalBtn) {
        saveTechModalBtn.disabled = false;
        saveTechModalBtn.innerHTML = '<span>💾 Simpan ke Database</span>';
      }
    }
  });

  // Handle Delete Technician (Hapus Teknisi oleh Admin)
  window.adminDeleteTech = async function (techIdOrUsername, techName) {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun teknisi "${techName}" (@${techIdOrUsername}) dari sistem lab?\n\nData akun di database server juga akan dihapus secara permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/technicians/${encodeURIComponent(techIdOrUsername)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Akun teknisi berhasil dihapus.');
        await fetchTechnicians(false);
      } else {
        alert('Gagal menghapus: ' + (data.error || data.message));
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan: ' + err.message);
    }
  };

  // =========================================================================
  // 💰 DATABASE FINANCE & TRANSACTIONS MANAGEMENT (ADMIN STAFF)
  // =========================================================================
  let cachedFinanceRecords = [];
  cachedTransactions = [];

  // Sub-tabs in Cashier / Finance
  const subtabBtnFinances = document.getElementById('subtabBtnFinances');
  const subtabBtnTransactions = document.getElementById('subtabBtnTransactions');
  const subtabBtnCheckout = document.getElementById('subtabBtnCheckout');
  const subpanelFinances = document.getElementById('subpanelFinances');
  const subpanelTransactions = document.getElementById('subpanelTransactions');
  const subpanelCheckout = document.getElementById('subpanelCheckout');

  // Database 1 & 2 Cards & Badges
  const badgeDbFinance = document.getElementById('badgeDbFinance') || document.getElementById('badgeSheetFinance');
  const displayFinanceDbStatus = document.getElementById('displayFinanceDbStatus') || document.getElementById('displayFinanceSheetId');
  const countFinanceEntries = document.getElementById('countFinanceEntries');
  const quickSyncFinanceBtn = document.getElementById('quickSyncFinanceBtn');

  const badgeDbTransactions = document.getElementById('badgeDbTransactions') || document.getElementById('badgeSheetTransactions');
  const displayTransactionsDbStatus = document.getElementById('displayTransactionsDbStatus') || document.getElementById('displayTransactionsSheetId');
  const countTransactionEntries = document.getElementById('countTransactionEntries');
  const quickSyncTransactionsBtn = document.getElementById('quickSyncTransactionsBtn');

  const syncDatabaseBtn = document.getElementById('syncDatabaseBtn') || document.getElementById('syncBothSheetsBtn');
  const openDbConfigModalBtn = document.getElementById('openDbConfigModalBtn') || document.getElementById('openSheetsConfigModalBtn');

  // Executive Metric Cards
  const financeTotalIncome = document.getElementById('financeTotalIncome');
  const financeTotalExpense = document.getElementById('financeTotalExpense');
  const financeNetProfit = document.getElementById('financeNetProfit');
  const financeCurrentBalance = document.getElementById('financeCurrentBalance');

  // Table 1: Catatan Keuangan
  const filterFinanceType = document.getElementById('filterFinanceType');
  const financeTableBody = document.getElementById('financeTableBody');
  const openAddFinanceModalBtn = document.getElementById('openAddFinanceModalBtn');

  // Table 2: Riwayat Seluruh Transaksi
  const filterTxMethod = document.getElementById('filterTxMethod');
  const searchTxInput = document.getElementById('searchTxInput');
  const transactionsTableBody = document.getElementById('transactionsTableBody');

  // Panel 3: Checkout Kasir Cepat
  const cashierCheckoutForm = document.getElementById('cashierCheckoutForm');
  const checkoutTicketSelect = document.getElementById('checkoutTicketSelect');
  const checkoutCustName = document.getElementById('checkoutCustName');
  const checkoutPhoneType = document.getElementById('checkoutPhoneType');
  const checkoutBaseCost = document.getElementById('checkoutBaseCost');
  const checkoutDiscount = document.getElementById('checkoutDiscount');
  const checkoutTotalDisplay = document.getElementById('checkoutTotalDisplay');
  const checkoutAmountReceived = document.getElementById('checkoutAmountReceived');
  const checkoutChangeDisplay = document.getElementById('checkoutChangeDisplay');

  // Modals
  const dbConfigModal = document.getElementById('dbConfigModal') || document.getElementById('sheetsConfigModal');
  const closeDbConfigBtn = document.getElementById('closeDbConfigBtn') || document.getElementById('closeSheetsConfigBtn');
  const dbConfigForm = document.getElementById('dbConfigForm') || document.getElementById('sheetsConfigForm');

  const addFinanceModal = document.getElementById('addFinanceModal');
  const closeAddFinanceBtn = document.getElementById('closeAddFinanceBtn');
  const addFinanceForm = document.getElementById('addFinanceForm');

  // Helper Rupiah Formatter
  function formatRupiah(num) {
    const val = Number(num) || 0;
    return 'Rp ' + val.toLocaleString('id-ID');
  }

  // Switch between Cashier Sub-tabs
  function switchCashierSubtab(activeTab) {
    const subtabs = [
      { btn: subtabBtnFinances, panel: subpanelFinances, key: 'finances' },
      { btn: subtabBtnTransactions, panel: subpanelTransactions, key: 'transactions' },
      { btn: subtabBtnCheckout, panel: subpanelCheckout, key: 'checkout' }
    ];

    subtabs.forEach((item) => {
      if (!item.btn || !item.panel) return;
      if (item.key === activeTab) {
        item.panel.style.display = item.key === 'checkout' ? 'grid' : 'block';
        item.btn.className = 'btn small';
        if (item.key === 'finances') {
          item.btn.style.background = 'linear-gradient(135deg, #0284c7, #2563eb)';
          item.btn.style.borderColor = 'transparent';
          item.btn.style.color = '#ffffff';
        } else if (item.key === 'transactions') {
          item.btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          item.btn.style.borderColor = 'transparent';
          item.btn.style.color = '#ffffff';
        } else {
          item.btn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
          item.btn.style.borderColor = 'transparent';
          item.btn.style.color = '#ffffff';
        }
      } else {
        item.panel.style.display = 'none';
        item.btn.className = 'btn small outline darkoutline';
        if (item.key === 'finances') {
          item.btn.style.borderColor = 'rgba(56,189,248,0.4)';
          item.btn.style.color = '#38bdf8';
          item.btn.style.background = 'transparent';
        } else if (item.key === 'transactions') {
          item.btn.style.borderColor = 'rgba(16,185,129,0.4)';
          item.btn.style.color = '#34d399';
          item.btn.style.background = 'transparent';
        } else {
          item.btn.style.borderColor = 'rgba(234,179,8,0.4)';
          item.btn.style.color = '#facc15';
          item.btn.style.background = 'transparent';
        }
      }
    });
  }

  subtabBtnFinances?.addEventListener('click', () => switchCashierSubtab('finances'));
  subtabBtnTransactions?.addEventListener('click', () => switchCashierSubtab('transactions'));
  subtabBtnCheckout?.addEventListener('click', () => switchCashierSubtab('checkout'));

  // Fetch Status for Database & KPIs
  async function fetchFinanceStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/finance/status`);
      const json = await res.json();
      if (!json.success) return;

      const { summary } = json;

      // Ledger / Finance Database Status
      if (badgeDbFinance) {
        badgeDbFinance.style.background = 'rgba(16,185,129,0.2)';
        badgeDbFinance.style.borderColor = 'rgba(16,185,129,0.5)';
        badgeDbFinance.style.color = '#34d399';
        badgeDbFinance.innerHTML = '🟢 Database Kas Workshop Aktif (Siap PostgreSQL)';
      }
      if (displayFinanceDbStatus) {
        displayFinanceDbStatus.textContent = 'PostgreSQL Ready (data/finances.json)';
      }

      // Transactions Database Status
      if (badgeDbTransactions) {
        badgeDbTransactions.style.background = 'rgba(16,185,129,0.2)';
        badgeDbTransactions.style.borderColor = 'rgba(16,185,129,0.5)';
        badgeDbTransactions.style.color = '#34d399';
        badgeDbTransactions.innerHTML = '🟢 Database Transaksi Kasir Aktif (Siap PostgreSQL)';
      }
      if (displayTransactionsDbStatus) {
        displayTransactionsDbStatus.textContent = 'PostgreSQL Ready (data/transactions.json)';
      }

      // Executive Metrics
      if (summary) {
        if (financeTotalIncome) financeTotalIncome.textContent = formatRupiah(summary.totalIncome);
        if (financeTotalExpense) financeTotalExpense.textContent = formatRupiah(summary.totalExpense);
        if (financeNetProfit) financeNetProfit.textContent = formatRupiah(summary.netProfit);
        if (financeCurrentBalance) financeCurrentBalance.textContent = formatRupiah(summary.currentBalance);
      }
    } catch (err) {
      console.warn('[Finance] Status check error:', err.message);
    }
  }

  // Fetch Catatan Keuangan (Ledger / Bookkeeping)
  async function fetchFinanceRecords() {
    try {
      const res = await fetch(`${API_BASE}/api/finance/records`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        cachedFinanceRecords = json.data;
        if (countFinanceEntries) {
          countFinanceEntries.textContent = `${cachedFinanceRecords.length} Baris`;
        }
        renderFinanceTable();
      }
    } catch (err) {
      console.warn('[Finance] Fetch records error:', err.message);
    }
  }

  function renderFinanceTable() {
    if (!financeTableBody) return;
    const filterType = filterFinanceType?.value || 'all';

    const filtered = cachedFinanceRecords.filter((rec) => {
      if (filterType === 'pemasukan' && rec.type !== 'pemasukan') return false;
      if (filterType === 'pengeluaran' && rec.type !== 'pengeluaran') return false;
      return true;
    });

    if (filtered.length === 0) {
      financeTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 36px; color: #94a3b8;">
            Belum ada catatan keuangan yang sesuai filter.
          </td>
        </tr>
      `;
      return;
    }

    financeTableBody.innerHTML = filtered.map((rec) => {
      const isIncome = rec.type === 'pemasukan';
      const typeBadge = isIncome
        ? '<span style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">🟢 PEMASUKAN</span>'
        : '<span style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.4); padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">🔴 PENGELUARAN</span>';

      const debitStr = rec.debit > 0 ? `<span style="color: #34d399; font-weight: 700;">+${formatRupiah(rec.debit)}</span>` : '<span style="color: #64748b;">-</span>';
      const creditStr = rec.credit > 0 ? `<span style="color: #f87171; font-weight: 700;">-${formatRupiah(rec.credit)}</span>` : '<span style="color: #64748b;">-</span>';

      return `
        <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; font-family: monospace; font-size: 0.78rem; color: #64748b;">
            ${rec.date || '-'} <span style="color: #0284c7;">${rec.time || ''}</span>
          </td>
          <td style="padding: 10px 14px; font-family: monospace; color: #334155; font-size: 0.8rem;">
            ${rec.ref || '-'}
          </td>
          <td style="padding: 10px 14px;">
            ${typeBadge}
          </td>
          <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">
            ${rec.category || '-'}
          </td>
          <td style="padding: 10px 14px; color: #475569; font-size: 0.82rem;">
            ${rec.description || '-'}
          </td>
          <td style="padding: 10px 14px; text-align: right;">
            ${debitStr}
          </td>
          <td style="padding: 10px 14px; text-align: right;">
            ${creditStr}
          </td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #0284c7;">
            ${formatRupiah(rec.balance)}
          </td>
          <td style="padding: 10px 14px; text-align: center; color: #64748b; font-size: 0.78rem;">
            ${rec.cashier || 'Kasir'}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Fetch Riwayat Seluruh Transaksi (Full Invoices)
  async function fetchTransactions() {
    try {
      const res = await fetch(`${API_BASE}/api/finance/transactions`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        cachedTransactions = json.data;
        if (countTransactionEntries) {
          countTransactionEntries.textContent = `${cachedTransactions.length} Faktur`;
        }
        updateTodayTransactionsCount();
        renderTransactionsTable();
      }
    } catch (err) {
      console.warn('[Finance] Fetch transactions error:', err.message);
    }
  }

  function renderTransactionsTable() {
    if (!transactionsTableBody) return;
    const methodFilter = filterTxMethod?.value || 'all';
    const query = (searchTxInput?.value || '').toLowerCase().trim();

    const filtered = cachedTransactions.filter((tx) => {
      // Method filter
      if (methodFilter === 'qris' && !tx.paymentMethod.toLowerCase().includes('qris')) return false;
      if (methodFilter === 'tunai' && !tx.paymentMethod.toLowerCase().includes('tunai') && !tx.paymentMethod.toLowerCase().includes('cash')) return false;
      if (methodFilter === 'transfer' && !tx.paymentMethod.toLowerCase().includes('transfer')) return false;

      // Search query
      if (query) {
        const match = (
          (tx.invoiceNumber || '').toLowerCase().includes(query) ||
          (tx.ticketId || '').toLowerCase().includes(query) ||
          (tx.customerName || '').toLowerCase().includes(query) ||
          (tx.phoneType || '').toLowerCase().includes(query) ||
          (tx.serviceType || '').toLowerCase().includes(query)
        );
        if (!match) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      transactionsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 36px; color: #64748b;">
            Belum ada riwayat transaksi yang cocok dengan filter atau pencarian.
          </td>
        </tr>
      `;
      return;
    }

    transactionsTableBody.innerHTML = filtered.map((tx) => {
      let methodBadge = '';
      const m = (tx.paymentMethod || '').toLowerCase();
      if (m.includes('qris')) {
        methodBadge = '<span style="background: #eff6ff; color: #0284c7; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">📱 QRIS BCA</span>';
      } else if (m.includes('tunai') || m.includes('cash')) {
        methodBadge = '<span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">💵 TUNAI</span>';
      } else if (m.includes('transfer')) {
        methodBadge = '<span style="background: #faf5ff; color: #9333ea; border: 1px solid #e9d5ff; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">🏦 TRANSFER</span>';
      } else {
        methodBadge = `<span style="background: #fefce8; color: #a16207; border: 1px solid #fef08a; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;">💳 ${tx.paymentMethod}</span>`;
      }

      return `
        <tr style="background: #ffffff; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px; font-family: monospace; font-weight: 700; color: #0284c7;">
            ${tx.invoiceNumber}
          </td>
          <td style="padding: 10px 14px; font-family: monospace; color: #334155;">
            <a href="javascript:void(0)" onclick="openReceiptModal('${tx.ticketId}')" style="color: #0284c7; text-decoration: underline;">${tx.ticketId}</a>
          </td>
          <td style="padding: 10px 14px; font-family: monospace; font-size: 0.78rem; color: #64748b;">
            ${tx.date || '-'} <span style="color: #334155;">${tx.time || ''}</span>
          </td>
          <td style="padding: 10px 14px; font-weight: 700; color: #0f172a;">
            ${tx.customerName}
            ${tx.customerPhone ? `<div style="font-size: 0.75rem; color: #0284c7; font-weight: normal;">${tx.customerPhone}</div>` : ''}
          </td>
          <td style="padding: 10px 14px; color: #475569; font-size: 0.82rem;">
            <strong style="color: #0f172a; display: block;">${tx.phoneType}</strong>
            <span>${tx.serviceType}</span>
          </td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #059669; font-size: 0.95rem;">
            ${formatRupiah(tx.totalPaid)}
          </td>
          <td style="padding: 10px 14px; text-align: center;">
            ${methodBadge}
          </td>
          <td style="padding: 10px 14px; text-align: center;">
            <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 800;">
              ✓ LUNAS
            </span>
          </td>
          <td style="padding: 10px 14px; text-align: center;">
            <button type="button" class="action-btn action-receipt" onclick="openReceiptModal('${tx.ticketId}')" title="Cetak Nota Faktur Thermal">
              🖨️ Faktur
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Filter Listeners
  filterFinanceType?.addEventListener('change', renderFinanceTable);
  filterTxMethod?.addEventListener('change', renderTransactionsTable);
  searchTxInput?.addEventListener('input', renderTransactionsTable);

  // Update Count of Today's Transactions
  function updateTodayTransactionsCount() {
    if (!quickCountTodayTx) return;
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    const todayCount = cachedTransactions.filter((tx) => {
      if (tx.paidAt && tx.paidAt.startsWith(todayIso)) return true;
      if (tx.date) {
        if (tx.date.includes(`${dd}/${mm}/${yyyy}`) || tx.date.includes(`${yyyy}-${mm}-${dd}`)) return true;
      }
      return false;
    }).length;

    quickCountTodayTx.textContent = `${todayCount} Faktur`;
  }

  // Daily Cashier Summary Receipt Modal Elements
  const dailyReceiptModal = document.getElementById('dailyReceiptModal');
  const dailyReceiptContent = document.getElementById('dailyReceiptContent');
  const printDailyReportBtn = document.getElementById('printDailyReportBtn');
  const closeDailyReceiptBtn = document.getElementById('closeDailyReceiptBtn');
  const closeDailyReceiptFooterBtn = document.getElementById('closeDailyReceiptFooterBtn');
  const printDailyReceiptBtn = document.getElementById('printDailyReceiptBtn');

  // Open Daily Transaction Receipt Modal
  function openDailyReceiptModal() {
    if (!dailyReceiptModal || !dailyReceiptContent) return;

    const rawUser = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    let cashierName = 'Kasir Meja 1';
    let roleTitle = 'Kasir Front Desk';
    try {
      if (rawUser) {
        const u = JSON.parse(rawUser);
        cashierName = u.name || 'Kasir Meja 1';
        roleTitle = u.role === 'admin' ? 'Super Admin / Owner' : 'Kasir Front Desk';
      }
    } catch (e) {}

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const dateFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Filter today's transactions (or all cached transactions as fallback)
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    const todayTransactions = cachedTransactions.filter((tx) => {
      if (tx.paidAt && tx.paidAt.startsWith(todayIso)) return true;
      if (tx.date) {
        if (tx.date.includes(`${dd}/${mm}/${yyyy}`) || tx.date.includes(`${yyyy}-${mm}-${dd}`)) return true;
      }
      return false;
    });

    const listToReport = todayTransactions.length > 0 ? todayTransactions : cachedTransactions;

    let totalGross = 0;
    let totalDiscount = 0;
    let totalNett = 0;
    let qrisCount = 0;
    let qrisTotal = 0;
    let cashCount = 0;
    let cashTotal = 0;
    let transferCount = 0;
    let transferTotal = 0;

    listToReport.forEach((tx) => {
      const amount = Number(tx.totalPaid) || 0;
      totalNett += amount;
      totalDiscount += Number(tx.discount) || 0;
      totalGross += (amount + (Number(tx.discount) || 0));

      const m = (tx.paymentMethod || '').toLowerCase();
      if (m.includes('qris')) {
        qrisCount++;
        qrisTotal += amount;
      } else if (m.includes('tunai') || m.includes('cash')) {
        cashCount++;
        cashTotal += amount;
      } else {
        transferCount++;
        transferTotal += amount;
      }
    });

    dailyReceiptContent.innerHTML = `
      <div class="thermal-receipt" style="width: 100%; max-width: 440px; margin: 0 auto; font-family: 'Courier New', Courier, monospace; color: #000000; font-size: 13px; line-height: 1.35;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h2 style="font-size: 18px; margin: 0 0 2px; font-weight: 800; letter-spacing: 1px;">NGALAM FIX PRO</h2>
          <div style="font-size: 11px; font-weight: 700;">WORKSHOP REPARASI & SERVIS SMARTPHONE</div>
          <div style="font-size: 11px;">Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang</div>
          <div style="font-size: 11px;">WhatsApp CS: +62 813-3030-4321</div>
          <div style="margin: 6px 0; letter-spacing: -1px;">========================================</div>
          <div style="font-size: 14px; font-weight: 800; letter-spacing: 0.5px;">STRUK REKAP TRANSAKSI HARIAN KASIR</div>
          <div style="font-size: 11px; margin-top: 2px;">COUNTER MEJA 1 & KASIR FRONT DESK</div>
          <div style="margin: 6px 0; letter-spacing: -1px;">========================================</div>
        </div>

        <div style="font-size: 11px; margin-bottom: 8px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between;"><span>TANGGAL CETAK</span><b>: ${dateFormatted}</b></div>
          <div style="display: flex; justify-content: space-between;"><span>WAKTU CETAK</span><b>: ${timeFormatted} WIB</b></div>
          <div style="display: flex; justify-content: space-between;"><span>KASIR BERTUGAS</span><b>: ${cashierName}</b></div>
          <div style="display: flex; justify-content: space-between;"><span>JABATAN OPERASIONAL</span><b>: ${roleTitle}</b></div>
          <div style="display: flex; justify-content: space-between;"><span>STATUS PEMBUKUAN</span><b>: TERSINKRONISASI</b></div>
        </div>

        <div style="margin: 6px 0; letter-spacing: -1px;">----------------------------------------</div>
        <div style="font-weight: 800; font-size: 12px; margin-bottom: 6px;">RINGKASAN OMSET KASIR HARIAN</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>TOTAL TRANSAKSI :</span>
          <b>${listToReport.length} Faktur Nota</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>TOTAL DISKON PROMO:</span>
          <b>${formatRupiah(totalDiscount)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; font-weight: 800; border-top: 1px dashed #000; padding-top: 4px;">
          <span>TOTAL OMSET NETT :</span>
          <span>${formatRupiah(totalNett)}</span>
        </div>

        <div style="margin: 6px 0; letter-spacing: -1px;">----------------------------------------</div>
        <div style="font-weight: 800; font-size: 12px; margin-bottom: 6px;">RINCIAN PER METODE PEMBAYARAN</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>1. QRIS BCA (${qrisCount}x) :</span>
          <b>${formatRupiah(qrisTotal)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>2. TUNAI / CASH (${cashCount}x):</span>
          <b>${formatRupiah(cashTotal)}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span>3. TRANSFER BANK (${transferCount}x):</span>
          <b>${formatRupiah(transferTotal)}</b>
        </div>

        <div style="margin: 6px 0; letter-spacing: -1px;">----------------------------------------</div>
        <div style="font-weight: 800; font-size: 12px; margin-bottom: 6px;">DAFTAR FAKTUR TRANSAKSI</div>
        <div style="font-size: 11px;">
          ${
            listToReport.length === 0
              ? '<div style="text-align: center; color: #555; padding: 10px 0;">Belum ada transaksi tercatat.</div>'
              : listToReport.map((tx, idx) => `
                <div style="margin-bottom: 6px; border-bottom: 1px dotted #ccc; padding-bottom: 4px;">
                  <div style="display: flex; justify-content: space-between; font-weight: 700;">
                    <span>${idx + 1}. ${tx.invoiceNumber || tx.ticketId}</span>
                    <span>${formatRupiah(tx.totalPaid)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: #333;">
                    <span>${tx.customerName} - ${tx.phoneType || 'HP'}</span>
                    <span>[${(tx.paymentMethod || 'TUNAI').toUpperCase()}]</span>
                  </div>
                  <div style="font-size: 10px; color: #555;">
                    Servis: ${tx.serviceItem || tx.serviceType || 'Perbaikan Hardware'} • Teknisi: ${tx.technician || '-'}
                  </div>
                </div>
              `).join('')
          }
        </div>

        <div style="margin: 10px 0 6px; letter-spacing: -1px;">========================================</div>
        <div style="display: flex; justify-content: space-between; text-align: center; font-size: 11px; margin-top: 14px;">
          <div style="width: 45%;">
            <div>Kasir Pelaksana,</div>
            <div style="height: 40px;"></div>
            <div style="border-top: 1px solid #000; font-weight: 700;">( ${cashierName} )</div>
          </div>
          <div style="width: 45%;">
            <div>Supervisor / Owner,</div>
            <div style="height: 40px;"></div>
            <div style="border-top: 1px solid #000; font-weight: 700;">( Super Admin )</div>
          </div>
        </div>

        <div style="margin-top: 14px; text-align: center; font-size: 10px; color: #444;">
          <div>Struk rekapitulasi resmi Ngalam Fix Pro.</div>
          <div>Dokumen sah tanda tutup shift kasir counter meja 1.</div>
          <div>Dicetak pada sistem Ngalam Fix Pro v6.0</div>
        </div>
      </div>
    `;

    dailyReceiptModal.style.display = 'flex';
    dailyReceiptModal.classList.add('active');
  }

  printDailyReportBtn?.addEventListener('click', openDailyReceiptModal);

  closeDailyReceiptBtn?.addEventListener('click', () => {
    dailyReceiptModal?.classList.remove('active');
    if (dailyReceiptModal) dailyReceiptModal.style.display = 'none';
  });

  closeDailyReceiptFooterBtn?.addEventListener('click', () => {
    dailyReceiptModal?.classList.remove('active');
    if (dailyReceiptModal) dailyReceiptModal.style.display = 'none';
  });

  dailyReceiptModal?.addEventListener('click', (e) => {
    if (e.target === dailyReceiptModal) {
      dailyReceiptModal.classList.remove('active');
      dailyReceiptModal.style.display = 'none';
    }
  });

  printDailyReceiptBtn?.addEventListener('click', () => {
    window.print();
  });

  // Cashier Checkout Calculations
  function updateCheckoutCalculations() {
    const base = Number(checkoutBaseCost?.value) || 0;
    const disc = Number(checkoutDiscount?.value) || 0;
    const total = Math.max(0, base - disc);
    if (checkoutTotalDisplay) {
      checkoutTotalDisplay.value = formatRupiah(total);
    }

    const received = Number(checkoutAmountReceived?.value) || 0;
    const change = Math.max(0, received - total);
    if (checkoutChangeDisplay) {
      checkoutChangeDisplay.value = formatRupiah(change);
    }
  }

  [checkoutBaseCost, checkoutDiscount, checkoutAmountReceived].forEach((inp) => {
    inp?.addEventListener('input', updateCheckoutCalculations);
  });

  // Populate Active Tickets in Checkout Select
  function populateCheckoutTickets() {
    if (!checkoutTicketSelect) return;
    const currentVal = checkoutTicketSelect.value;
    checkoutTicketSelect.innerHTML = '<option value="">-- Pilih Tiket Antrean --</option>';

    allOrders.forEach((o) => {
      const opt = document.createElement('option');
      opt.value = o.id;
      const stepLabel = o.step === 5 ? '✅ Selesai' : `Langkah ${o.step}`;
      opt.textContent = `${o.id} - ${o.customerName} (${o.phoneType}) [${stepLabel}]`;
      checkoutTicketSelect.appendChild(opt);
    });

    if (currentVal) checkoutTicketSelect.value = currentVal;
  }

  checkoutTicketSelect?.addEventListener('change', () => {
    const selectedId = checkoutTicketSelect.value;
    if (!selectedId) return;
    const order = allOrders.find((o) => o.id === selectedId);
    if (order) {
      if (checkoutCustName) checkoutCustName.value = order.customerName || '';
      if (checkoutPhoneType) checkoutPhoneType.value = order.phoneType || '';
      if (checkoutBaseCost) {
        const numCost = parseInt((order.cost || '0').replace(/[^0-9]/g, ''), 10) || 0;
        checkoutBaseCost.value = numCost;
      }
      updateCheckoutCalculations();
    }
  });

  // Handle Cashier Checkout Form Submission
  cashierCheckoutForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ticketId = checkoutTicketSelect?.value || ('NGF-TICKET-' + Math.floor(1000 + Math.random() * 9000));
    const customerName = checkoutCustName?.value.trim();
    const phoneType = checkoutPhoneType?.value.trim();
    const baseAmount = Number(checkoutBaseCost?.value) || 0;
    const discount = Number(checkoutDiscount?.value) || 0;
    const totalPaid = Math.max(0, baseAmount - discount);
    const methodRadio = document.querySelector('input[name="checkoutPaymentMethod"]:checked');
    const paymentMethod = methodRadio ? methodRadio.value : 'QRIS BCA';
    const amountPaid = Number(checkoutAmountReceived?.value) || totalPaid;
    const change = Math.max(0, amountPaid - totalPaid);

    if (!customerName || !phoneType || totalPaid <= 0) {
      alert('Mohon lengkapi nama pelanggan, tipe smartphone, dan nominal biaya servis.');
      return;
    }

    const rawUser = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    let cashierName = 'Ibu Sarah (Meja 1)';
    try {
      if (rawUser) {
        const u = JSON.parse(rawUser);
        cashierName = u.name || 'Ibu Sarah (Meja 1)';
      }
    } catch (err) {}

    const payload = {
      ticketId,
      customerName,
      phoneType,
      serviceType: 'Jasa Servis Smartphone & Penggantian Komponen',
      baseAmount,
      discount,
      totalPaid,
      paymentMethod,
      amountPaid,
      change,
      cashier: cashierName
    };

    try {
      const res = await fetch(`${API_BASE}/api/finance/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        alert(`🎉 Pembayaran Berhasil!\n\nNo. Faktur: ${json.data.invoiceNumber}\nTotal Tagihan: ${formatRupiah(totalPaid)}\nMetode: ${paymentMethod}\n\nData otomatis tercatat di database sistem (Catatan Keuangan & Riwayat Transaksi).`);

        // Automatically advance order step to step 5 if order exists
        const existing = allOrders.find((o) => o.id === ticketId);
        if (existing && existing.step < 5) {
          await advanceStep(ticketId, 5);
        }

        cashierCheckoutForm.reset();
        updateCheckoutCalculations();
        await fetchFinanceStatus();
        await fetchFinanceRecords();
        await fetchTransactions();

        // Open thermal receipt modal
        openReceiptModal(ticketId);
      } else {
        alert('Gagal mencatat transaksi: ' + (json.message || 'Error'));
      }
    } catch (err) {
      alert('Error koneksi: ' + err.message);
    }
  });

  // Handle Manual Income/Expense Form Submission
  addFinanceForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const typeRadio = document.querySelector('input[name="financeType"]:checked');
    const type = typeRadio ? typeRadio.value : 'pemasukan';
    const category = document.getElementById('financeCategoryInput')?.value;
    const amount = Number(document.getElementById('financeAmountInput')?.value) || 0;
    const ref = document.getElementById('financeRefInput')?.value.trim() || '';
    const description = document.getElementById('financeDescInput')?.value.trim();

    if (!description || amount <= 0) {
      alert('Mohon isi nominal transaksi dan keterangan dengan lengkap.');
      return;
    }

    const rawUser = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    let cashierName = 'Kasir Meja 1';
    try {
      if (rawUser) {
        const u = JSON.parse(rawUser);
        cashierName = u.name || 'Kasir Meja 1';
      }
    } catch (err) {}

    try {
      const res = await fetch(`${API_BASE}/api/finance/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          category,
          amount,
          ref,
          description,
          cashier: cashierName
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(`✅ Berhasil mencatat ${type} sebesar ${formatRupiah(amount)}!`);
        addFinanceForm.reset();
        if (addFinanceModal) addFinanceModal.style.display = 'none';
        await fetchFinanceStatus();
        await fetchFinanceRecords();
      } else {
        alert('Gagal: ' + (json.message || 'Error'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // Handle Database Config Form Submit
  dbConfigForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (dbConfigModal) dbConfigModal.style.display = 'none';
    await fetchFinanceStatus();
  });

  // Trigger On-Demand Database Sync & Validation
  async function triggerDatabaseSync(target, btn) {
    const original = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Menyelaraskan...';
    }
    try {
      const res = await fetch(`${API_BASE}/api/finance/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      const json = await res.json();
      if (json.success) {
        alert(`✅ ${json.message}`);
      } else {
        alert(`ℹ️ Info Sinkronisasi:\n${json.message}`);
      }
      await fetchFinanceStatus();
    } catch (err) {
      alert('Error sinkronisasi: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  }

  syncDatabaseBtn?.addEventListener('click', () => triggerDatabaseSync('both', syncDatabaseBtn));
  quickSyncFinanceBtn?.addEventListener('click', () => triggerDatabaseSync('finance', quickSyncFinanceBtn));
  quickSyncTransactionsBtn?.addEventListener('click', () => triggerDatabaseSync('transactions', quickSyncTransactionsBtn));
  document.getElementById('modalSyncAllBtn')?.addEventListener('click', () => triggerDatabaseSync('all', document.getElementById('modalSyncAllBtn')));

  // Modal Open & Close Listeners
  openDbConfigModalBtn?.addEventListener('click', () => {
    if (dbConfigModal) dbConfigModal.style.display = 'flex';
    fetchFinanceStatus();
  });
  closeDbConfigBtn?.addEventListener('click', () => {
    if (dbConfigModal) dbConfigModal.style.display = 'none';
  });
  dbConfigModal?.addEventListener('click', (e) => {
    if (e.target === dbConfigModal) dbConfigModal.style.display = 'none';
  });

  openAddFinanceModalBtn?.addEventListener('click', () => {
    if (addFinanceModal) addFinanceModal.style.display = 'flex';
  });
  closeAddFinanceBtn?.addEventListener('click', () => {
    if (addFinanceModal) addFinanceModal.style.display = 'none';
  });
  addFinanceModal?.addEventListener('click', (e) => {
    if (e.target === addFinanceModal) addFinanceModal.style.display = 'none';
  });

  // Fetch and Render Mitras with QR Codes and Commissions
  async function fetchMitras() {
    const tableBody = document.getElementById('adminMitraTableBody');
    const badge = document.getElementById('mitraCountBadge');
    const kpiTotal = document.getElementById('kpiMitraTotal');
    const kpiTotalComm = document.getElementById('kpiMitraTotalComm');

    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="8" style="padding: 24px; text-align: center; color: #94a3b8;">⏳ Memuat data mitra dan QR Code...</td></tr>`;
    }

    try {
      const res = await fetch(`${API_BASE}/api/mitra/list`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const drivers = json.data;
        if (badge) badge.textContent = `${drivers.length} Mitra`;
        if (kpiTotal) kpiTotal.textContent = drivers.length;

        const totalCommissionSum = drivers.reduce((acc, d) => acc + (d.totalCommission || 0), 0);
        if (kpiTotalComm) kpiTotalComm.textContent = 'Rp ' + Number(totalCommissionSum).toLocaleString('id-ID');

        if (tableBody) {
          if (drivers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="padding: 24px; text-align: center; color: #94a3b8;">Belum ada mitra driver terdaftar.</td></tr>`;
            return;
          }

          tableBody.innerHTML = drivers.map(d => {
            const avatar = d.avatar || (d.role === 'ojol' ? '🛵' : '🏪');
            const totalCommStr = 'Rp ' + Number(d.totalCommission || 0).toLocaleString('id-ID');

            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px 14px;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-size: 1.6rem;">${avatar}</div>
                    <div>
                      <strong style="color: #0f172a; display: block;">${d.name}</strong>
                      <small style="color: #64748b; font-family: monospace;">@${d.username}</small>
                    </div>
                  </div>
                </td>
                <td style="padding: 12px 14px; color: #475569;">${d.category || '-'}</td>
                <td style="padding: 12px 14px;">
                  <a href="https://wa.me/62${(d.phone || '').replace(/^0/, '')}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 600;">
                    ${d.phone || '-'}
                  </a>
                </td>
                <td style="padding: 12px 14px;">
                  <span style="font-family: monospace; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px;">
                    ${d.referralCode}
                  </span>
                </td>
                <td style="padding: 12px 14px; text-align: center;">
                  <a href="${d.qrCodeUrl}" target="_blank" title="Klik untuk memperbesar QR Code">
                    <img src="${d.qrCodeUrl}" alt="QR Code" style="width: 44px; height: 44px; border-radius: 8px; border: 1px solid #cbd5e1; vertical-align: middle;">
                  </a>
                </td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 700; color: #d97706;">${d.commissionRate}%</td>
                <td style="padding: 12px 14px; text-align: right; font-weight: 800; color: #059669;">${totalCommStr}</td>
                <td style="padding: 12px 14px; text-align: center;">
                  <span style="background: #f0fdf4; color: #166534; font-size: 0.76rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                    ${d.status || 'Siaga / Aktif'}
                  </span>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    } catch (err) {
      console.warn('[Admin] Error loading mitras list:', err.message);
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="8" style="padding: 24px; text-align: center; color: #ef4444;">Gagal memuat data mitra: ${err.message}</td></tr>`;
      }
    }
  }

  document.getElementById('refreshMitraBtn')?.addEventListener('click', fetchMitras);

  // Initial Load
  initAdminAuth();
  checkDatabaseStatus();
  fetchOrders();
  fetchPromos();
  fetchPromoCodes();
  fetchTechnicians();
  fetchMitras();
  fetchFinanceStatus();
  fetchFinanceRecords();
  fetchTransactions();
});


