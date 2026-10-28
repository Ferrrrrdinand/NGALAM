/**
 * NGALAM FIX PRO - Booking & Intake Handler
 * Communicates with Node.js backend -> Google Sheets API & Local Database
 * Includes all Indonesian phone models and customer email support
 */

document.addEventListener('DOMContentLoaded', () => {
  const bookingForm = document.getElementById('bookingForm');
  const custBrandSelect = document.getElementById('custBrandSelect');
  const custModelSelect = document.getElementById('custModelSelect');
  const custModelDetail = document.getElementById('custModelDetail');
  const brandChipButtons = document.querySelectorAll('.brand-chip-btn');
  const methodInputs = document.querySelectorAll('input[name="method"]');
  const addressFieldGroup = document.getElementById('addressFieldGroup');
  const problemTagButtons = document.querySelectorAll('.problem-tag-btn');
  const successModal = document.getElementById('successModal');
  const createdTicketBadge = document.getElementById('createdTicketBadge');
  const waConfirmLink = document.getElementById('waConfirmLink');
  const trackOrderLink = document.getElementById('trackOrderLink');
  const closeModalBtn = document.getElementById('closeModalBtn');

  const selectedProblems = new Set();
  let appliedPromo = null;

  // Promo Code Elements
  const custPromoCode = document.getElementById('custPromoCode');
  const btnApplyPromo = document.getElementById('btnApplyPromo');
  const btnRemovePromo = document.getElementById('btnRemovePromo');
  const quickPromoList = document.getElementById('quickPromoList');
  const promoAlertBox = document.getElementById('promoAlertBox');
  const promoBreakdownCard = document.getElementById('promoBreakdownCard');
  const cardOriginalPrice = document.getElementById('cardOriginalPrice');
  const cardPromoLabel = document.getElementById('cardPromoLabel');
  const cardDiscountAmount = document.getElementById('cardDiscountAmount');
  const cardFinalPrice = document.getElementById('cardFinalPrice');

  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : ((window.location.port === '3000' || window.location.port === '3001' || window.location.port === '3002') ? '' : 'http://localhost:3000');

  // Calculate Base Price based on selected problems / devices
  function calculateCurrentBasePrice() {
    let price = 350000; // Base default
    const problems = Array.from(selectedProblems);
    if (problems.length > 0) {
      const pStr = problems.join(' ').toLowerCase();
      if (pStr.includes('lcd') || pStr.includes('layar') || pStr.includes('oled')) {
        price = 450000;
      } else if (pStr.includes('kaca') || pStr.includes('oca')) {
        price = 350000;
      } else if (pStr.includes('mati total') || pStr.includes('ic') || pStr.includes('sinyal')) {
        price = 350000;
      } else if (pStr.includes('kamera')) {
        price = 300000;
      } else if (pStr.includes('baterai') || pStr.includes('air')) {
        price = 250000;
      } else if (pStr.includes('port') || pStr.includes('speaker') || pStr.includes('bootloop')) {
        price = 175000;
      }
    }
    return price;
  }

  // Load Active Promo Codes from Backend (Auto-excludes expired promos)
  async function loadQuickPromos() {
    if (!quickPromoList) return;
    try {
      if (window.resolveNgalamApiBase) {
        API_BASE = await window.resolveNgalamApiBase();
      }
      const res = await fetch(`${API_BASE}/api/promo-codes`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        quickPromoList.innerHTML = '';
        json.data.forEach((promo) => {
          const discountLabel = promo.discountType === 'percentage'
            ? `Diskon ${promo.discountValue}%`
            : `Potongan Rp ${(promo.discountValue / 1000).toLocaleString('id-ID')}rb`;
          
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'quick-promo-chip';
          chip.setAttribute('data-code', promo.code);
          chip.innerHTML = `<span>🏷️</span> <strong>${promo.code}</strong> <small style="opacity:0.85;">(${discountLabel})</small>`;
          chip.addEventListener('click', () => {
            if (custPromoCode) custPromoCode.value = promo.code;
            applyPromo(promo.code);
          });
          quickPromoList.appendChild(chip);
        });
      } else {
        quickPromoList.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8;">Belum ada voucher publik aktif saat ini.</span>';
      }
    } catch (e) {
      quickPromoList.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8;">Tidak dapat memuat daftar voucher.</span>';
    }
  }

  // Apply & Validate Promo Code with Real-Time Price Cut
  async function applyPromo(rawCode) {
    const code = (rawCode || custPromoCode?.value || '').trim().toUpperCase();
    if (!code) {
      if (promoAlertBox) {
        promoAlertBox.className = 'promo-alert-box error';
        promoAlertBox.style.display = 'flex';
        promoAlertBox.innerHTML = '<span>⚠️</span> Mohon masukkan kode promo terlebih dahulu.';
      }
      return;
    }

    if (custPromoCode) custPromoCode.value = code;
    const basePrice = calculateCurrentBasePrice();

    if (btnApplyPromo) {
      btnApplyPromo.disabled = true;
      btnApplyPromo.innerHTML = '<span>⏳ Memeriksa...</span>';
    }

    try {
      if (window.resolveNgalamApiBase) {
        API_BASE = await window.resolveNgalamApiBase();
      }
      const res = await fetch(`${API_BASE}/api/promo-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: code, basePrice }),
      });
      const data = await res.json();

      if (data.valid && data.promo) {
        appliedPromo = data;

        // Show price deduction in card
        if (cardOriginalPrice) cardOriginalPrice.textContent = 'Rp ' + Number(data.originalPrice).toLocaleString('id-ID');
        if (cardPromoLabel) {
          const discText = data.promo.discountType === 'percentage'
            ? `Diskon Promo (${data.promo.code} -${data.promo.discountValue}%):`
            : `Potongan Promo (${data.promo.code}):`;
          cardPromoLabel.textContent = discText;
        }
        if (cardDiscountAmount) cardDiscountAmount.textContent = '- Rp ' + Number(data.discountAmount).toLocaleString('id-ID');
        if (cardFinalPrice) cardFinalPrice.textContent = 'Rp ' + Number(data.finalPrice).toLocaleString('id-ID');

        if (promoBreakdownCard) promoBreakdownCard.classList.add('active');
        if (btnRemovePromo) btnRemovePromo.style.display = 'inline-flex';

        if (promoAlertBox) {
          promoAlertBox.className = 'promo-alert-box success';
          promoAlertBox.style.display = 'flex';
          promoAlertBox.innerHTML = `<span>🎉</span> <div><strong>Kode Promo ${data.promo.code} Aktif!</strong> Anda berhasil hemat <b>Rp ${Number(data.discountAmount).toLocaleString('id-ID')}</b> untuk pendaftaran servis ini.</div>`;
        }
      } else {
        // Promo Invalid or Expired
        removePromo(false);
        if (promoAlertBox) {
          promoAlertBox.className = 'promo-alert-box error';
          promoAlertBox.style.display = 'flex';
          promoAlertBox.innerHTML = `<span>⚠️</span> <div>${data.message || 'Kode promo tidak valid atau sudah tidak berlaku.'}</div>`;
        }
      }
    } catch (err) {
      if (promoAlertBox) {
        promoAlertBox.className = 'promo-alert-box error';
        promoAlertBox.style.display = 'flex';
        promoAlertBox.innerHTML = '<span>⚠️</span> Gagal memeriksa kode promo: ' + err.message;
      }
    } finally {
      if (btnApplyPromo) {
        btnApplyPromo.disabled = false;
        btnApplyPromo.innerHTML = '<span>Gunakan Promo ✨</span>';
      }
    }
  }

  // Remove Applied Promo
  function removePromo(clearAlert = true) {
    appliedPromo = null;
    if (promoBreakdownCard) promoBreakdownCard.classList.remove('active');
    if (btnRemovePromo) btnRemovePromo.style.display = 'none';
    if (clearAlert && promoAlertBox) {
      promoAlertBox.style.display = 'none';
      promoAlertBox.innerHTML = '';
    }
  }

  btnApplyPromo?.addEventListener('click', () => applyPromo());
  btnRemovePromo?.addEventListener('click', () => {
    if (custPromoCode) custPromoCode.value = '';
    removePromo(true);
  });
  custPromoCode?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyPromo();
    }
  });

  // Complete Indonesian Phone Models Catalog
  const MODELS_BY_BRAND = {
    apple: [
      'iPhone 16 Pro / 16 Pro Max',
      'iPhone 16 / 16 Plus',
      'iPhone 15 Pro / 15 Pro Max',
      'iPhone 15 / 15 Plus',
      'iPhone 14 Pro / 14 Pro Max',
      'iPhone 14 / 14 Plus',
      'iPhone 13 Pro / 13 Pro Max',
      'iPhone 13 / 13 Mini',
      'iPhone 12 Pro / 12 Pro Max',
      'iPhone 12 / 12 Mini',
      'iPhone 11 Pro / 11 Pro Max',
      'iPhone 11',
      'iPhone XS / XS Max / XR',
      'iPhone X',
      'iPhone SE (2020 / 2022)',
      'iPhone 8 / 8 Plus',
      'iPhone 7 / 7 Plus',
      'iPad Pro / Air / Mini / Gen Series',
      'Apple Watch Series / Ultra',
    ],
    samsung: [
      'Galaxy S24 Ultra / S24+ / S24',
      'Galaxy S23 Ultra / S23+ / S23 / S23 FE',
      'Galaxy S22 Ultra / S22+ / S22',
      'Galaxy S21 Ultra / S21+ / S21 / S21 FE',
      'Galaxy S20 Ultra / S20+ / S20 / S20 FE',
      'Galaxy Z Fold 6 / Fold 5 / Fold 4 / Fold 3',
      'Galaxy Z Flip 6 / Flip 5 / Flip 4 / Flip 3',
      'Galaxy Note 20 Ultra / Note 20 / Note 10+',
      'Galaxy A55 5G / A54 5G / A53 5G',
      'Galaxy A35 5G / A34 5G / A33 5G',
      'Galaxy A25 5G / A24 / A23',
      'Galaxy A15 5G / A15 4G / A14 / A13',
      'Galaxy A05s / A05 / A04s / A03',
      'Galaxy M54 5G / M34 5G / M14 5G',
    ],
    xiaomi: [
      'Xiaomi 14 / 14 Ultra / 14 Pro',
      'Xiaomi 13T / 13T Pro / 13 Pro',
      'Xiaomi 12 / 12 Pro / 12 Lite',
      'Xiaomi 11T / 11T Pro / Mi 11',
      'Redmi Note 13 Pro+ 5G / Note 13 Pro / Note 13',
      'Redmi Note 12 Pro 5G / Note 12',
      'Redmi Note 11 Pro / Note 11',
      'Redmi Note 10 Pro / Note 10 / Note 9',
      'Redmi 13 / 13C / 12 / 12C / 10C / 9A',
      'Xiaomi Pad 6 / Pad 5',
    ],
    poco: [
      'POCO F6 / F6 Pro / F5 / F5 Pro',
      'POCO F4 / F4 GT / F3',
      'POCO X6 Pro 5G / X6 5G / X5 Pro / X5',
      'POCO X3 Pro / X3 NFC / X3 GT',
      'POCO M6 Pro / M5 / M5s / M4 Pro',
      'POCO C65 / C55 / C51 / C40',
    ],
    oppo: [
      'Find X7 / Find X6 / Find X5 Pro',
      'Find N3 / Find N3 Flip / Find N2 Flip',
      'Reno 12 Pro / Reno 12 / Reno 12F',
      'Reno 11 Pro / Reno 11 / Reno 11F',
      'Reno 10 Pro+ / Reno 10 Pro / Reno 10',
      'Reno 8 Pro / Reno 8 / Reno 7',
      'OPPO A98 5G / A79 5G / A78 5G',
      'OPPO A58 / A38 / A18 / A17 / A16',
    ],
    vivo: [
      'Vivo X100 Pro / X100 / X90 Pro / X80 Pro',
      'Vivo X Fold 3 Pro / X Flip',
      'Vivo V40 / V40 Lite / V30 Pro / V30',
      'Vivo V29 / V29e / V27 Pro / V27 / V25',
      'Vivo Y100 5G / Y100 4G / Y28 / Y27s',
      'Vivo Y17s / Y03 / Y02 / Y36 / Y35',
    ],
    realme: [
      'Realme GT 6 / GT 5 / GT Neo 5 / GT Neo 3',
      'Realme 13 Pro+ / 13 Pro / 12 Pro+ / 12+',
      'Realme 11 Pro+ / 11 / 10 Pro+ / 10',
      'Realme 9 Pro+ / 9 / 8 Pro / 8',
      'Realme C67 / C65 / C55 / C53 / C51',
      'Realme Narzo 70 / Narzo 60 / Narzo 50',
    ],
    infinix: [
      'Infinix GT 20 Pro / GT 10 Pro',
      'Infinix ZERO 30 5G / ZERO Ultra',
      'Infinix NOTE 40 Pro+ / NOTE 40 Pro / NOTE 40',
      'Infinix NOTE 30 Pro / NOTE 30 / NOTE 12',
      'Infinix HOT 40 Pro / HOT 30 / HOT 20s',
      'Infinix SMART 8 / SMART 7 / SMART 6',
    ],
    iqoo: [
      'iQOO 12 / 12 Pro / 11 / 11 Pro',
      'iQOO Neo 9 Pro / Neo 7 SE',
      'iQOO Z9 5G / Z9x / Z7 5G / Z7x',
    ],
    tecno_itel: [
      'Tecno CAMON 30 Premier / CAMON 30 Pro / CAMON 20',
      'Tecno POVA 6 Pro 5G / POVA 5 Pro / POVA 4',
      'Tecno SPARK 20 Pro+ / SPARK 20 / SPARK 10',
      'itel S23+ (Layar Lengkung) / itel S23',
      'itel P55 5G / itel P55 NFC / itel P40',
      'itel A70 / itel A60s',
    ],
    asus: [
      'ROG Phone 8 Pro / ROG Phone 8 / 8 Edition',
      'ROG Phone 7 Ultimate / ROG Phone 7',
      'ROG Phone 6 / 6D / 5 / 5s',
      'Zenfone 11 Ultra / Zenfone 10 / Zenfone 9',
    ],
    others: [
      'Google Pixel 9 Pro / 8 Pro / 7 Pro / 6 Pro',
      'Huawei Pura 70 / Mate 60 / P60 / Nova Series',
      'Sony Xperia 1 VI / 1 V / 5 V',
      'Motorola Edge / G Series',
      'Seri Lainnya / Tulis Manual',
    ],
  };

  // Populate model dropdown based on selected brand
  function populateModels(brandId) {
    if (!custModelSelect) return;
    custModelSelect.innerHTML = '';

    const models = MODELS_BY_BRAND[brandId] || MODELS_BY_BRAND.others;
    models.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      custModelSelect.appendChild(opt);
    });

    // Add manual entry option at end if not already present
    if (!models.includes('Seri Lainnya / Tulis Manual')) {
      const optManual = document.createElement('option');
      optManual.value = 'Lainnya';
      optManual.textContent = '➕ Seri Lainnya / Tulis Manual';
      custModelSelect.appendChild(optManual);
    }
  }

  // Handle Brand Dropdown Change
  custBrandSelect?.addEventListener('change', () => {
    const brand = custBrandSelect.value;
    populateModels(brand);

    // Sync active brand chip button
    brandChipButtons.forEach((btn) => {
      if (btn.getAttribute('data-brand') === brand) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  });

  // Handle Brand Quick Chips Click
  brandChipButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      brandChipButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const brand = btn.getAttribute('data-brand') || 'apple';
      if (custBrandSelect) custBrandSelect.value = brand;
      populateModels(brand);
    });
  });

  // Initial population (default: apple)
  populateModels(custBrandSelect?.value || 'apple');

  // Pre-select fields from URL parameters (e.g. ?brand=apple&problem=layar&promo=HEMAT)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedBrand = urlParams.get('brand') || urlParams.get('type');
  if (requestedBrand) {
    const brandLower = requestedBrand.toLowerCase();
    const matchedBrand = Object.keys(MODELS_BY_BRAND).find((b) => b.includes(brandLower) || brandLower.includes(b));
    if (matchedBrand) {
      if (custBrandSelect) custBrandSelect.value = matchedBrand;
      populateModels(matchedBrand);
      brandChipButtons.forEach((btn) => {
        if (btn.getAttribute('data-brand') === matchedBrand) btn.classList.add('active');
        else btn.classList.remove('active');
      });
    }
  }

  // Pre-select model from URL if provided
  const requestedModel = urlParams.get('model');
  if (requestedModel && custModelSelect) {
    // Check if matches existing option
    let matched = false;
    for (let i = 0; i < custModelSelect.options.length; i++) {
      if (custModelSelect.options[i].text.toLowerCase().includes(requestedModel.toLowerCase())) {
        custModelSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched && custModelDetail) {
      custModelDetail.value = requestedModel;
    }
  }

  // Pre-select problem tag from URL
  const requestedProblem = urlParams.get('problem');
  if (requestedProblem) {
    const probLower = requestedProblem.toLowerCase();
    problemTagButtons.forEach((btn) => {
      const tagText = (btn.getAttribute('data-tag') || btn.textContent).toLowerCase();
      if (tagText.includes(probLower) || probLower.includes(tagText)) {
        selectedProblems.add(btn.getAttribute('data-tag') || btn.textContent.trim());
        btn.classList.add('selected');
      }
    });
  }

  // Pre-fill promo code and auto-apply if provided in URL (e.g. ?promo=NGALAMPROMO30)
  const requestedPromo = urlParams.get('promo');
  if (requestedPromo) {
    if (custPromoCode) custPromoCode.value = requestedPromo.toUpperCase();
    applyPromo(requestedPromo.toUpperCase());
  }

  // Affiliate Mitra Referral & QR Code Scan Detection (e.g. ?ref=MTR-ANDI-8492)
  let activeAffiliateRef = urlParams.get('ref') || urlParams.get('affiliate') || localStorage.getItem('ngalam_affiliate_ref') || '';
  if (activeAffiliateRef) {
    activeAffiliateRef = activeAffiliateRef.trim().toUpperCase();
    localStorage.setItem('ngalam_affiliate_ref', activeAffiliateRef);

    // Verifikasi kode mitra ke backend
    (async () => {
      try {
        if (window.resolveNgalamApiBase) {
          API_BASE = await window.resolveNgalamApiBase();
        }
        const refRes = await fetch(`${API_BASE}/api/mitra/ref/${encodeURIComponent(activeAffiliateRef)}`);
        const refData = await refRes.json();
        if (refData.success && refData.mitra) {
          const banner = document.getElementById('affiliateBanner');
          const nameEl = document.getElementById('affiliateMitraName');
          const badgeEl = document.getElementById('affiliateBadgeCode');
          const avatarEl = document.getElementById('affiliateMitraAvatar');

          if (banner) banner.style.display = 'block';
          if (nameEl) nameEl.textContent = refData.mitra.name;
          if (badgeEl) badgeEl.textContent = refData.mitra.referralCode;
          if (avatarEl) avatarEl.textContent = refData.mitra.avatar || '🛵';
        }
      } catch (err) {
        console.warn('[Booking] Could not fetch affiliate mitra details:', err.message);
      }
    })();
  }

  // Problem tags toggle with dynamic promo recalculation
  problemTagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tag = btn.getAttribute('data-tag') || btn.textContent.trim();
      if (selectedProblems.has(tag)) {
        selectedProblems.delete(tag);
        btn.classList.remove('selected');
      } else {
        selectedProblems.add(tag);
        btn.classList.add('selected');
      }
      // Dynamically recalculate discount if promo is applied
      if (appliedPromo && appliedPromo.promo) {
        applyPromo(appliedPromo.promo.code);
      }
    });
  });

  // Method toggle (Show/hide address field)
  methodInputs.forEach((input) => {
    input.addEventListener('change', () => {
      if (input.value === 'pickup' && input.checked) {
        addressFieldGroup?.classList.remove('hidden');
      } else if (input.value === 'walkin' && input.checked) {
        addressFieldGroup?.classList.add('hidden');
      }
    });
  });

  // Form submit
  bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('bookingSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Mendaftarkan Antrian & Tiket...</span>';

    const customerName = document.getElementById('custName')?.value.trim();
    const whatsapp = document.getElementById('custPhone')?.value.trim();
    const email = document.getElementById('custEmail')?.value.trim();
    const brandName = custBrandSelect?.options[custBrandSelect.selectedIndex]?.text || 'Smartphone';
    const modelName = custModelSelect?.options[custModelSelect.selectedIndex]?.text || '';
    const detailColor = custModelDetail?.value.trim() || '';
    const address = document.getElementById('custAddress')?.value.trim() || 'Workshop Malang';
    const notes = document.getElementById('custNotes')?.value.trim() || '';

    let method = 'Datang Langsung ke Workshop';
    methodInputs.forEach((r) => {
      if (r.checked) method = r.value === 'pickup' ? 'Layanan Antar-Jemput (Pickup)' : 'Datang Langsung ke Workshop';
    });

    const fullPhoneString = `${brandName} - ${modelName}${detailColor ? ' (' + detailColor + ')' : ''}`;
    const problemsList = Array.from(selectedProblems);
    const problemsText = problemsList.length > 0 ? problemsList.join(', ') : 'Diagnosa & Pengecekan Menyeluruh';

    // Calculate dynamic cost string including promo discount
    let finalCostString = 'Rp 150.000 - Rp 450.000 (Estimasi Awal)';
    if (appliedPromo && appliedPromo.finalPrice !== undefined) {
      finalCostString = `Rp ${Number(appliedPromo.finalPrice).toLocaleString('id-ID')} (Hemat Rp ${Number(appliedPromo.discountAmount).toLocaleString('id-ID')} dgn ${appliedPromo.promo.code})`;
    }

    const payload = {
      customerName,
      whatsapp,
      customerPhone: whatsapp,
      buyerName: customerName,
      buyerPhone: whatsapp,
      name: customerName,
      phone: whatsapp,
      email: email || '',
      address: address,
      district: address,
      phoneType: fullPhoneString || 'Smartphone Android / iPhone',
      deviceType: custBrandSelect?.value || 'smartphone',
      modelColor: detailColor || modelName || 'Standar',
      screenCondition: 'Perlu diperiksa meja teknisi',
      bodyCondition: 'Normal',
      accessories: 'Unit Handphone',
      screenPin: 'Tanpa Sandi / Privasi Aman',
      damageDescription: problemsText + (notes ? ` [Kronologi: ${notes}]` : ''),
      method: method,
      technician: 'Teknisi Standby (Workshop Meja 1)',
      cost: finalCostString,
      promoCode: appliedPromo ? appliedPromo.promo.code : '',
      discountAmount: appliedPromo ? appliedPromo.discountAmount : 0,
      affiliateRef: activeAffiliateRef || localStorage.getItem('ngalam_affiliate_ref') || '',
      duration: '30 - 60 Menit',
      status: 'Registrasi & Masuk',
      step: 1,
      diagnoseNote: appliedPromo 
        ? `Booking online via kode promo ${appliedPromo.promo.code} (Diskon Rp ${Number(appliedPromo.discountAmount).toLocaleString('id-ID')}). Siap diperiksa di meja kerja teknisi.`
        : 'Booking online diterima. Siap diperiksa di meja kerja teknisi.',
    };

    try {
      if (window.resolveNgalamApiBase) {
        API_BASE = await window.resolveNgalamApiBase();
      }
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const order = result.data;
        if (createdTicketBadge) createdTicketBadge.textContent = order.id;

        // WhatsApp Confirmation Message
        let promoWaText = '';
        if (appliedPromo && appliedPromo.promo) {
          promoWaText = `• Promo Diskon: ${appliedPromo.promo.code} (-Rp ${Number(appliedPromo.discountAmount).toLocaleString('id-ID')})\n• Total Estimasi Biaya: Rp ${Number(appliedPromo.finalPrice).toLocaleString('id-ID')}\n`;
        }

        const waMsg = encodeURIComponent(
          `Halo Ngalam Fix Pro (Liem Hingky Liman),\n` +
          `Saya baru saja melakukan booking servis online:\n` +
          `• No. Tiket: ${order.id}\n` +
          `• Nama: ${customerName}\n` +
          `• HP: ${fullPhoneString}\n` +
          `• Email: ${email || '-'}\n` +
          `• Kendala: ${problemsText}\n` +
          (promoWaText ? promoWaText : '') +
          `• Metode: ${method}\n\n` +
          `Mohon informasi jadwal pengerjaan dan ketersediaan teknisi. Terima kasih!`
        );

        if (waConfirmLink) {
          waConfirmLink.href = `https://wa.me/6281330304321?text=${waMsg}`;
        }

        if (trackOrderLink) {
          // Point to login/tracking page with ticket query
          const isSubdir = window.location.pathname.includes('/pesan-servis');
          trackOrderLink.href = `${isSubdir ? '../' : ''}login/index.html?track=${encodeURIComponent(order.id)}`;
        }

        // Show Success Modal
        if (successModal) successModal.classList.add('active');

        // Reset form & promo
        bookingForm.reset();
        selectedProblems.clear();
        problemTagButtons.forEach((b) => b.classList.remove('selected'));
        populateModels(custBrandSelect?.value || 'apple');
        removePromo(true);
      } else {
        alert('Gagal mengirim pendaftaran: ' + (result.message || 'Terjadi kesalahan'));
      }
    } catch (err) {
      alert('Error menghubungi server: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Close modal
  closeModalBtn?.addEventListener('click', () => {
    if (successModal) successModal.classList.remove('active');
  });

  successModal?.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.classList.remove('active');
    }
  });

  // Initial load of active promos
  loadQuickPromos();
});
