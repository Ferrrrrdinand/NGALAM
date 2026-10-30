/**
 * NGALAM FIX PRO - Main Frontend JavaScript
 * Controls navbar dropdown, scroll effects, and interactive repair cost estimator widget.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header on Scroll
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 2. Navigation Dropdown Toggle
  const toggleBtn = document.getElementById('menuToggleBtn');
  const dropdownMenu = document.getElementById('navDropdownMenu');
  const backdrop = document.getElementById('navBackdrop');
  const closeBtn = document.getElementById('navDropdownClose');

  function openMenu() {
    dropdownMenu?.classList.add('show');
    backdrop?.classList.add('show');
    toggleBtn?.classList.add('active');
    document.body.classList.add('nav-menu-open');
  }

  function closeMenu() {
    dropdownMenu?.classList.remove('show');
    backdrop?.classList.remove('show');
    toggleBtn?.classList.remove('active');
    document.body.classList.remove('nav-menu-open');
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (dropdownMenu?.classList.contains('show')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // 2b. Keamanan Ketat: Bersihkan data sesi saat membuka login dari beranda / menu mana pun
  function clearAllAuthSessions() {
    try {
      localStorage.removeItem('ngalam_customer_session');
      localStorage.removeItem('ngalam_auth_user');
      localStorage.removeItem('ngalam_tech_session');
      localStorage.removeItem('ngalam_mitra_session');
      sessionStorage.clear();
      document.cookie = 'ngalam_token=; path=/; max-age=0; SameSite=Lax';
    } catch (_) {}
  }

  // Intersep seluruh tombol / link login agar kredensial selalu bersih & wajib input ulang
  const loginLinkTargets = document.querySelectorAll(
    'a[href*="login"], a[href*="admin/login"], a[href*="teknisi/login"], #navLoginBtn'
  );
  loginLinkTargets.forEach((link) => {
    link.addEventListener('click', () => {
      clearAllAuthSessions();
    });
  });

  function updateNavAuthBadges() {
    const adminLinks = document.querySelectorAll('a[href*="admin/login.html"], a[href*="admin/index.html"], a[href$="/admin"]');
    const techLinks = document.querySelectorAll('a[href*="teknisi/login.html"], a[href*="teknisi/index.html"], a[href$="/teknisi"]');
    adminLinks.forEach((a) => {
      const small = a.querySelector('small');
      if (small) small.textContent = 'Walk-in counter Meja 1 & kasir';
    });
    techLinks.forEach((a) => {
      const small = a.querySelector('small');
      if (small) small.textContent = 'Teknisi meja lab workshop';
    });
  }
  updateNavAuthBadges();

  let API_BASE = (typeof window !== 'undefined' && window.getNgalamApiBase)
    ? window.getNgalamApiBase()
    : '';

  const estimatorBrand = document.getElementById('estBrand');
  const estimatorModel = document.getElementById('estModel');
  const estimatorDamage = document.getElementById('estDamage');
  const estPriceDisplay = document.getElementById('estPriceDisplay');
  const estTimeDisplay = document.getElementById('estTimeDisplay');
  const estWarrantyDisplay = document.getElementById('estWarrantyDisplay');
  const estCtaButton = document.getElementById('estCtaButton');
  const estBookingBtn = document.getElementById('estBookingBtn');

  let cachedModelsByBrand = null;

  // Fetch smartphone catalog from Node.js Backend API
  async function loadCatalogFromNode() {
    try {
      const res = await fetch(`${API_BASE}/api/estimator/data`);
      const json = await res.json();
      if (json.success && json.modelsByBrand) {
        cachedModelsByBrand = json.modelsByBrand;
        updateModels();
      }
    } catch (err) {
      console.warn('Using local fallback for models catalog:', err);
      updateModels();
    }
  }

  function updateModels() {
    if (!estimatorBrand || !estimatorModel) return;
    const selectedBrand = estimatorBrand.value || 'apple';

    // Default fallback list with all Indonesian phone brands & models
    const defaultModels = {
      apple: [
        { name: 'iPhone 16 Pro / 16 Pro Max' },
        { name: 'iPhone 16 / 16 Plus' },
        { name: 'iPhone 15 Pro / 15 Pro Max' },
        { name: 'iPhone 15 / 15 Plus' },
        { name: 'iPhone 14 Pro / 14 Pro Max' },
        { name: 'iPhone 14 / 14 Plus' },
        { name: 'iPhone 13 Pro / 13 Pro Max' },
        { name: 'iPhone 13 / 13 Mini' },
        { name: 'iPhone 12 Pro / 12 Pro Max' },
        { name: 'iPhone 12 / 12 Mini' },
        { name: 'iPhone 11 Pro / 11 Pro Max' },
        { name: 'iPhone 11' },
        { name: 'iPhone XS / XS Max / XR' },
        { name: 'iPhone X' },
        { name: 'iPhone SE (2020 / 2022)' },
        { name: 'iPhone 8 / 8 Plus' },
        { name: 'iPhone 7 / 7 Plus' },
      ],
      samsung: [
        { name: 'Samsung Galaxy S24 Ultra / S24+ / S24' },
        { name: 'Samsung Galaxy S23 Ultra / S23+ / S23 / S23 FE' },
        { name: 'Samsung Galaxy S22 Ultra / S22+ / S22' },
        { name: 'Samsung Galaxy S21 Ultra / S21+ / S21 / S21 FE' },
        { name: 'Samsung Galaxy S20 Ultra / S20+ / S20 / S20 FE' },
        { name: 'Samsung Galaxy Z Fold 6 / Fold 5 / Fold 4 / Fold 3' },
        { name: 'Samsung Galaxy Z Flip 6 / Flip 5 / Flip 4 / Flip 3' },
        { name: 'Samsung Galaxy Note 20 Ultra / Note 20 / Note 10+' },
        { name: 'Samsung Galaxy A55 5G / A54 5G / A53 5G' },
        { name: 'Samsung Galaxy A35 5G / A34 5G / A33 5G' },
        { name: 'Samsung Galaxy A25 5G / A24 / A23' },
        { name: 'Samsung Galaxy A15 5G / A15 4G / A14 / A13' },
        { name: 'Samsung Galaxy A05s / A05 / A04s / A03' },
        { name: 'Samsung Galaxy M54 5G / M34 5G / M14 5G' },
      ],
      xiaomi: [
        { name: 'Xiaomi 14 / 14 Ultra / 14 Pro' },
        { name: 'Xiaomi 13T / 13T Pro / 13 Pro' },
        { name: 'Xiaomi 12 Pro / 12 / 12 Lite / 12T' },
        { name: 'Xiaomi 11T Pro / 11T / Mi 11 Ultra' },
        { name: 'Redmi Note 13 Pro+ 5G / 13 Pro / 13 5G' },
        { name: 'Redmi Note 13 4G' },
        { name: 'Redmi Note 12 Pro+ / 12 Pro 5G / 12 4G' },
        { name: 'Redmi Note 11 Pro 5G / 11 Pro / 11' },
        { name: 'Redmi Note 10 Pro / 10 / 10S' },
        { name: 'Redmi 13 / 13C / 12 / 12C' },
        { name: 'Redmi 10 / 10C / 10A / 9 / 9A / 9C' },
        { name: 'Redmi A3 / A2 / A1' },
      ],
      poco: [
        { name: 'POCO F6 Pro / POCO F6' },
        { name: 'POCO F5 Pro / POCO F5' },
        { name: 'POCO F4 GT / POCO F4 / POCO F3' },
        { name: 'POCO X6 Pro 5G / POCO X6 5G' },
        { name: 'POCO X5 Pro 5G / POCO X5 5G' },
        { name: 'POCO X4 Pro / POCO X3 Pro / X3 NFC' },
        { name: 'POCO M6 Pro / POCO M5s / M5' },
        { name: 'POCO C65 / POCO C55 / C40' },
      ],
      oppo: [
        { name: 'OPPO Find N3 / Find N3 Flip / N2 Flip' },
        { name: 'OPPO Find X6 Pro / Find X5 Pro / Find X3 Pro' },
        { name: 'OPPO Reno 12 Pro 5G / Reno 12 5G / Reno 12 F' },
        { name: 'OPPO Reno 11 Pro 5G / Reno 11 5G / Reno 11 F' },
        { name: 'OPPO Reno 10 Pro+ 5G / Reno 10 Pro / Reno 10' },
        { name: 'OPPO Reno 8 Pro / Reno 8 5G / Reno 8T / Reno 8' },
        { name: 'OPPO Reno 7 / Reno 6 / Reno 5 Series' },
        { name: 'OPPO A98 5G / A79 5G / A78 5G / A78 4G' },
        { name: 'OPPO A58 / A38 / A18 / A57 / A77s' },
        { name: 'OPPO A17 / A17k / A16 / A15 / A54 / A53' },
      ],
      vivo: [
        { name: 'Vivo X100 Pro / Vivo X100 / X100s' },
        { name: 'Vivo X90 Pro / Vivo X90 / Vivo X80 Pro / X80' },
        { name: 'Vivo V40 5G / Vivo V40 Lite 5G / 4G' },
        { name: 'Vivo V30 Pro 5G / Vivo V30 5G / Vivo V30e' },
        { name: 'Vivo V29 5G / Vivo V29e / Vivo V27 5G / V27e' },
        { name: 'Vivo V25 Pro / Vivo V25 / Vivo V23 5G' },
        { name: 'Vivo Y100 5G / Vivo Y100 4G / Vivo Y28' },
        { name: 'Vivo Y27 5G / Vivo Y27 4G / Vivo Y36 5G / Y36' },
        { name: 'Vivo Y17s / Vivo Y03 / Vivo Y02 / Y02t' },
        { name: 'Vivo Y22 / Vivo Y21 / Vivo Y20 / Vivo Y16' },
      ],
      realme: [
        { name: 'Realme GT 6 / Realme GT 6T' },
        { name: 'Realme GT 5 / GT Neo 5 / GT Neo 3 / 3T' },
        { name: 'Realme GT 2 Pro / GT Master Edition' },
        { name: 'Realme 13 Pro+ 5G / 13+ 5G / 13 4G' },
        { name: 'Realme 12 Pro+ 5G / 12+ 5G / 12 5G / 12 Lite' },
        { name: 'Realme 11 Pro+ 5G / 11 Pro / 11' },
        { name: 'Realme 10 Pro+ / Realme 10 Pro / 10' },
        { name: 'Realme 9 Pro+ / 9 Pro / 9 / 8 Pro / 8' },
        { name: 'Realme C67 / Realme C65 / Realme C63' },
        { name: 'Realme C55 / Realme C53 / Realme C51' },
        { name: 'Realme C35 / Realme C33 / Realme C31 / C30' },
        { name: 'Realme Narzo 60 / 50 / 30 Series' },
      ],
      infinix: [
        { name: 'Infinix ZERO 40 5G / 40 4G / ZERO 30 5G' },
        { name: 'Infinix ZERO Ultra / ZERO 20' },
        { name: 'Infinix GT 20 Pro 5G / GT 10 Pro' },
        { name: 'Infinix NOTE 40 Pro+ 5G / NOTE 40 Pro / NOTE 40' },
        { name: 'Infinix NOTE 30 Pro / NOTE 30 / NOTE 12 / 11' },
        { name: 'Infinix HOT 40 Pro / HOT 40i / HOT 30 / 30i' },
        { name: 'Infinix HOT 20 / 20s / HOT 12 / 11' },
        { name: 'Infinix SMART 8 Pro / SMART 8 / SMART 7 / 6' },
      ],
      iqoo: [
        { name: 'iQOO 12 5G / iQOO 11 5G' },
        { name: 'iQOO Neo 9 Pro / Neo 7 Pro' },
        { name: 'iQOO Z9 5G / iQOO Z9x 5G' },
        { name: 'iQOO Z7 5G / iQOO Z7x 5G' },
      ],
      tecno_itel: [
        { name: 'Tecno Camon 30 Premier / 30 Pro / 30 / 20 Pro' },
        { name: 'Tecno Pova 6 Pro 5G / Pova 6 / Pova 5 Pro' },
        { name: 'Tecno Spark 20 Pro+ / Spark 20 Pro / Spark 20' },
        { name: 'itel S23+ / itel S23 4G / itel RS4' },
        { name: 'itel P55 5G / P55 NFC / P40' },
        { name: 'itel A70 / itel A60s' },
      ],
      asus: [
        { name: 'ASUS ROG Phone 8 Pro / ROG Phone 8' },
        { name: 'ASUS ROG Phone 7 Ultimate / ROG Phone 7' },
        { name: 'ASUS ROG Phone 6 / 6D / 5 / 5s' },
        { name: 'ASUS Zenfone 11 Ultra / Zenfone 10 / 9 / 8' },
      ],
      others: [
        { name: 'Huawei Pura 70 Ultra / Pura 70 Pro / P60 Pro' },
        { name: 'Huawei Mate 60 Pro / Mate 50 Pro / Nova Series' },
        { name: 'Google Pixel 9 Pro / 9 / Pixel 8 Pro / 8 / 8a' },
        { name: 'Google Pixel 7 Pro / 7 / 7a / Pixel 6 Pro / 6' },
        { name: 'Sony Xperia 1 VI / 1 V / 1 IV / Xperia 5 Series' },
        { name: 'Honor Magic 6 Pro / Honor 90 / 70' },
        { name: 'Merek Lainnya (Tipe Khusus / Custom)' },
      ],
    };

    const models = (cachedModelsByBrand && cachedModelsByBrand[selectedBrand])
      || defaultModels[selectedBrand]
      || defaultModels.apple;

    estimatorModel.innerHTML = '';
    models.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.name;
      opt.textContent = m.name;
      estimatorModel.appendChild(opt);
    });

    calculateEstimate();
    syncBrandSelectIcon(selectedBrand);
  }

  function syncBrandSelectIcon(brandVal) {
    const iconContainer = document.getElementById('estSelectBrandIcon');
    if (!iconContainer) return;
    const activeTab = document.querySelector(`#estBrandTabs .est-brand-tab[data-brand="${brandVal}"]`);
    if (activeTab) {
      const svg = activeTab.querySelector('.brand-svg-logo');
      if (svg) {
        iconContainer.innerHTML = svg.outerHTML;
      }
    }
  }

  // Request calculation directly from Node.js backend (/api/estimator/calculate)
  async function calculateEstimate() {
    if (!estimatorDamage) return;
    const brand = estimatorBrand ? estimatorBrand.value : 'apple';
    const model = estimatorModel ? estimatorModel.value : '';
    const damage = estimatorDamage.value;

    try {
      const res = await fetch(`${API_BASE}/api/estimator/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, model, damage }),
      });
      const data = await res.json();

      if (data.success) {
        if (estPriceDisplay) estPriceDisplay.textContent = data.price;
        if (estTimeDisplay) estTimeDisplay.textContent = '⚡ ' + data.time;
        if (estWarrantyDisplay) estWarrantyDisplay.textContent = '🛡️ Garansi ' + data.warranty;
        if (estCtaButton) estCtaButton.href = data.waUrl;
        if (estBookingBtn) {
          const isSubdir = window.location.pathname.includes('/layanan') ||
                           window.location.pathname.includes('/pesan-servis') ||
                           window.location.pathname.includes('/kontak') ||
                           window.location.pathname.includes('/login') ||
                           window.location.pathname.includes('/admin') ||
                           window.location.pathname.includes('/teknisi');
          const prefix = isSubdir ? '../' : '';
          estBookingBtn.href = `${prefix}${data.bookingUrl}`;
        }
      }
    } catch (err) {
      console.error('Estimator API error:', err);
    }
  }

  // Brand Tabs Sync
  const brandTabs = document.querySelectorAll('#estBrandTabs .est-brand-tab');
  brandTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      brandTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const brandVal = tab.getAttribute('data-brand');
      if (estimatorBrand) {
        estimatorBrand.value = brandVal;
        updateModels();
      }
    });
  });

  // Damage Chips Sync
  const damageChips = document.querySelectorAll('#estDamageChips .est-damage-chip');
  damageChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      damageChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const dmgVal = chip.getAttribute('data-damage');
      if (estimatorDamage) {
        estimatorDamage.value = dmgVal;
        calculateEstimate();
      }
    });
  });

  if (estimatorBrand) {
    estimatorBrand.addEventListener('change', () => {
      const val = estimatorBrand.value;
      brandTabs.forEach((t) => {
        t.classList.toggle('active', t.getAttribute('data-brand') === val);
      });
      updateModels();
    });
  }

  if (estimatorModel) {
    estimatorModel.addEventListener('change', calculateEstimate);
  }

  if (estimatorDamage) {
    estimatorDamage.addEventListener('change', () => {
      const val = estimatorDamage.value;
      damageChips.forEach((c) => {
        c.classList.toggle('active', c.getAttribute('data-damage') === val);
      });
      calculateEstimate();
    });
  }

  // Load from Node on startup
  loadCatalogFromNode();

  // ==========================================
  // 4. HERO PROMOTIONAL BANNER CAROUSEL (DYNAMIC & NODE CONNECTED)
  // ==========================================
  let promoTimer = null;
  let currentPromoSlide = 0;

  function getPromoThemeInlineStyles(theme = 'purple') {
    switch (theme) {
      case 'red':
        return {
          pillStyle: 'background: linear-gradient(135deg, #ef4444, #dc2626);',
          codeStyle: 'color: #f87171; border-color: #ef4444;',
          btnStyle: 'background: linear-gradient(135deg, #ef4444, #b91c1c);',
        };
      case 'green':
        return {
          pillStyle: 'background: linear-gradient(135deg, #10b981, #059669);',
          codeStyle: 'color: #34d399; border-color: #10b981;',
          btnStyle: 'background: linear-gradient(135deg, #059669, #10b981);',
        };
      case 'amber':
        return {
          pillStyle: 'background: linear-gradient(135deg, #f59e0b, #d97706);',
          codeStyle: 'color: #fbbf24; border-color: #f59e0b;',
          btnStyle: 'background: linear-gradient(135deg, #d97706, #b45309);',
        };
      case 'blue':
      case 'cyan':
      case 'gold':
        return {
          pillStyle: 'background: linear-gradient(135deg, #d4af37, #b45309);',
          codeStyle: 'color: #b45309; border-color: #d4af37;',
          btnStyle: 'background: linear-gradient(135deg, #d4af37, #b45309);',
        };
      case 'purple':
      default:
        return {
          pillStyle: 'background: linear-gradient(135deg, #7c3aed, #6366f1);',
          codeStyle: 'color: #c084fc; border-color: #a855f7;',
          btnStyle: 'background: linear-gradient(135deg, #7c3aed, #4f46e5);',
        };
    }
  }

  // ==========================================
  // PROMO POP UP MODAL HANDLER
  // ==========================================
  const promoModal = document.getElementById('promoDetailModal');
  const promoModalBackdrop = document.getElementById('promoModalBackdrop');
  const promoModalCloseBtn = document.getElementById('promoModalCloseBtn');
  const modalCloseActionBtn = document.getElementById('modalCloseActionBtn');
  const modalPromoBadge = document.getElementById('modalPromoBadge');
  const modalPromoPill = document.getElementById('modalPromoPill');
  const modalPromoTitle = document.getElementById('modalPromoTitle');
  const modalPromoDesc = document.getElementById('modalPromoDesc');
  const modalPromoCode = document.getElementById('modalPromoCode');
  const modalPromoCodeCard = document.getElementById('modalPromoCodeCard');
  const modalCopyCodeBtn = document.getElementById('modalCopyCodeBtn');
  const modalCopyCodeText = document.getElementById('modalCopyCodeText');
  const copyToast = document.getElementById('copyToast');
  const modalClaimBtn = document.getElementById('modalClaimBtn');
  const modalClaimBtnText = document.getElementById('modalClaimBtnText');

  function openPromoModal(promo) {
    if (!promoModal) return;

    // Set Tag & Pill
    if (modalPromoBadge) modalPromoBadge.textContent = promo.badgeTag || '🔥 PROMO SPESIAL BULAN INI';
    if (modalPromoPill) {
      if (promo.badgePill) {
        modalPromoPill.style.display = 'inline-flex';
        modalPromoPill.textContent = promo.badgePill;
      } else {
        modalPromoPill.style.display = 'none';
      }
    }

    // Set Title & Description
    if (modalPromoTitle) modalPromoTitle.textContent = promo.title || 'Promo Servis Spesial Ngalam Fix Pro';
    if (modalPromoDesc) modalPromoDesc.textContent = promo.description || 'Dapatkan penawaran harga terbaik dan jaminan pengerjaan bergaransi resmi di Ngalam Fix Pro.';

    // Format and handle Promo Code
    const rawCode = (promo.promoCode || '').trim();
    let cleanCode = '';
    if (rawCode && !rawCode.startsWith('🛡️')) {
      cleanCode = rawCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    }

    if (rawCode) {
      if (modalPromoCodeCard) modalPromoCodeCard.style.display = 'flex';
      if (modalPromoCode) modalPromoCode.textContent = rawCode;

      if (modalCopyCodeBtn) {
        modalCopyCodeBtn.onclick = (e) => {
          e.preventDefault();
          const codeToCopy = cleanCode || rawCode;
          const onSuccess = () => {
            if (modalCopyCodeText) modalCopyCodeText.textContent = '✓ Disalin!';
            if (copyToast) {
              copyToast.style.display = 'block';
              copyToast.textContent = `✅ Kode voucher "${codeToCopy}" berhasil disalin!`;
            }
            setTimeout(() => {
              if (modalCopyCodeText) modalCopyCodeText.textContent = 'Salin Kode';
              if (copyToast) copyToast.style.display = 'none';
            }, 2500);
          };

          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(codeToCopy).then(onSuccess).catch(() => {
              const temp = document.createElement('input');
              temp.value = codeToCopy;
              document.body.appendChild(temp);
              temp.select();
              document.execCommand('copy');
              document.body.removeChild(temp);
              onSuccess();
            });
          } else {
            const temp = document.createElement('input');
            temp.value = codeToCopy;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            onSuccess();
          }
        };
      }
    } else {
      if (modalPromoCodeCard) modalPromoCodeCard.style.display = 'none';
    }

    // Set Claim CTA Button
    let btnLink = promo.buttonLink || '';
    if (!btnLink || btnLink === '#') {
      btnLink = cleanCode
        ? `pesan-servis/index.html?promo=${encodeURIComponent(cleanCode)}`
        : 'pesan-servis/index.html';
    }

    if (modalClaimBtn) {
      modalClaimBtn.href = btnLink;
      if (btnLink.startsWith('http')) {
        modalClaimBtn.target = '_blank';
        modalClaimBtn.rel = 'noopener noreferrer';
      } else {
        modalClaimBtn.removeAttribute('target');
        modalClaimBtn.removeAttribute('rel');
      }
    }

    if (modalClaimBtnText) {
      modalClaimBtnText.textContent = promo.buttonText || 'Klaim Promo Servis Sekarang ↗';
    }

    // Reset copy state
    if (copyToast) copyToast.style.display = 'none';
    if (modalCopyCodeText) modalCopyCodeText.textContent = 'Salin Kode';

    // Show Modal with smooth pop-in
    promoModal.style.display = 'flex';
    requestAnimationFrame(() => {
      promoModal.classList.add('active');
    });
    document.body.style.overflow = 'hidden';
  }

  function closePromoModal() {
    if (!promoModal) return;
    promoModal.classList.remove('active');
    setTimeout(() => {
      promoModal.style.display = 'none';
      document.body.style.overflow = '';
    }, 250);
  }

  if (promoModalCloseBtn) promoModalCloseBtn.onclick = closePromoModal;
  if (modalCloseActionBtn) modalCloseActionBtn.onclick = closePromoModal;
  if (promoModalBackdrop) promoModalBackdrop.onclick = closePromoModal;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && promoModal && promoModal.classList.contains('active')) {
      closePromoModal();
    }
  });

  function initPromoSlider() {
    const promoSlides = document.querySelectorAll('.promo-slide');
    const promoDots = document.querySelectorAll('.promo-dot');
    const prevBtn = document.getElementById('promoPrevBtn');
    const nextBtn = document.getElementById('promoNextBtn');
    const promoContainer = document.querySelector('.hero-banner-wrap');

    if (promoSlides.length === 0) return;

    if (promoTimer) clearInterval(promoTimer);
    currentPromoSlide = 0;

    function showSlide(index) {
      if (index >= promoSlides.length) index = 0;
      if (index < 0) index = promoSlides.length - 1;
      currentPromoSlide = index;

      promoSlides.forEach((slide, i) => {
        if (i === currentPromoSlide) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      promoDots.forEach((dot, i) => {
        if (i === currentPromoSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    function nextSlide() {
      showSlide(currentPromoSlide + 1);
    }

    function prevSlide() {
      showSlide(currentPromoSlide - 1);
    }

    function startAutoSlide() {
      stopAutoSlide();
      promoTimer = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
      if (promoTimer) clearInterval(promoTimer);
    }

    // Attach click on each slide to open Pop Up modal
    promoSlides.forEach((slide) => {
      slide.style.cursor = 'pointer';
      slide.onclick = (e) => {
        // Jangan buka modal jika klik pada tombol navigasi panah atau titik pagination
        if (e.target.closest('.promo-nav-btn') || e.target.closest('.promo-dots')) return;

        const promoData = slide._promoData || {
          title: slide.getAttribute('data-title'),
          description: slide.getAttribute('data-desc'),
          promoCode: slide.getAttribute('data-code'),
          badgeTag: slide.getAttribute('data-badge'),
          badgePill: slide.getAttribute('data-pill'),
          buttonLink: slide.getAttribute('data-link'),
          buttonText: slide.getAttribute('data-btn-text'),
          theme: slide.getAttribute('data-theme')
        };

        if (promoData.title) {
          openPromoModal(promoData);
        }
      };
    });

    // Clone buttons to clear previous event listeners
    if (prevBtn) {
      const newPrev = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      newPrev.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevSlide();
        startAutoSlide();
      });
    }

    if (nextBtn) {
      const newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);
      newNext.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextSlide();
        startAutoSlide();
      });
    }

    promoDots.forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slideIdx = parseInt(dot.getAttribute('data-slide'), 10) || 0;
        showSlide(slideIdx);
        startAutoSlide();
      });
    });

    if (promoContainer) {
      promoContainer.onmouseenter = stopAutoSlide;
      promoContainer.onmouseleave = startAutoSlide;
    }

    startAutoSlide();
  }
  // Initialize slider for static fallback slides immediately on page load
  initPromoSlider();

  function renderHeroPromos(promos) {
    const bannerWrap = document.querySelector('.hero-banner-wrap');
    const card = document.querySelector('.hero-banner-card');
    const dotsContainer = document.querySelector('.promo-dots');
    const prevBtn = document.getElementById('promoPrevBtn');
    const nextBtn = document.getElementById('promoNextBtn');
    if (!bannerWrap || !card) return;

    // Filter strictly to active banners
    const activePromos = Array.isArray(promos) ? promos.filter((p) => p.active !== false) : [];

    // Jika seluruh banner nonaktif (0 aktif), sembunyikan banner di halaman utama
    if (activePromos.length === 0) {
      bannerWrap.style.display = 'none';
      if (promoTimer) clearInterval(promoTimer);
      return;
    }

    // Jika ada banner aktif, tampilkan banner di halaman utama
    bannerWrap.style.display = 'block';

    // Remove existing slides
    const existingSlides = card.querySelectorAll('.promo-slide');
    existingSlides.forEach((s) => s.remove());

    // Render each active promo slide (Bersih tanpa teks yang menutupi gambar)
    activePromos.forEach((promo, idx) => {
      const slide = document.createElement('div');
      slide.className = 'promo-slide' + (idx === 0 ? ' active' : '');
      slide._promoData = promo;
      slide.setAttribute('data-title', promo.title || '');
      slide.setAttribute('data-desc', promo.description || '');
      slide.setAttribute('data-code', promo.promoCode || '');
      slide.setAttribute('data-badge', promo.badgeTag || '');
      slide.setAttribute('data-pill', promo.badgePill || '');
      slide.setAttribute('data-theme', promo.theme || '');
      slide.setAttribute('title', 'Klik gambar untuk melihat detail promo & klaim');

      const themeStyles = getPromoThemeInlineStyles(promo.theme);
      const imgSrc = promo.image.startsWith('http') || promo.image.startsWith('data:')
        ? promo.image
        : promo.image;

      // Extract clean promo code if available for linking
      const rawCode = (promo.promoCode || '').trim();
      let cleanCode = '';
      if (rawCode && !rawCode.startsWith('🛡️')) {
        cleanCode = rawCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
      }

      // If buttonLink is not custom or empty, point to promo booking
      let btnLink = promo.buttonLink || '#';
      if (cleanCode && (!btnLink || btnLink === '#' || btnLink.includes('pesan-servis'))) {
        btnLink = `pesan-servis/index.html?promo=${encodeURIComponent(cleanCode)}`;
      }
      slide.setAttribute('data-link', btnLink);
      slide.setAttribute('data-btn-text', promo.buttonText || 'Klaim Promo Servis Sekarang ↗');

      const hintText = promo.theme === 'green'
        ? '✨ Klik Banner untuk Fasilitas &amp; Garansi'
        : (promo.theme === 'purple' ? '✨ Klik Banner untuk Bonus Tempered Glass' : '✨ Klik Banner untuk Info Promo &amp; Klaim');
      const ctaText = promo.theme === 'green' ? 'Konsultasi ↗' : 'Klaim Promo ↗';
      const pulseColor = promo.theme === 'green' ? '#10b981' : (promo.theme === 'purple' ? '#c084fc' : '#ef4444');

      slide.innerHTML = `
        <img
          src="${imgSrc}"
          alt="${promo.title}"
          class="promo-slide-image"
          loading="${idx === 0 ? 'eager' : 'lazy'}"
        >
        <div class="promo-slide-overlay">
          <div class="promo-top-row">
            <div class="promo-badge-tag" style="color: #ffffff !important;">
              <span class="pulse-indicator"></span>
              <span style="color: #ffffff !important; font-weight: 800; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">${promo.badgeTag || '🔥 PROMO SPESIAL BULAN INI'}</span>
            </div>
            ${promo.badgePill ? `<div class="promo-discount-pill" style="${themeStyles.pillStyle}; color: #ffffff !important;"><span style="color: #ffffff !important; font-weight: 800; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">${promo.badgePill}</span></div>` : ''}
          </div>
          <div class="promo-bottom-hint-row">
            <div class="promo-click-hint" style="color: #ffffff !important;">
              <span class="hint-pulse" style="background: ${pulseColor}; box-shadow: 0 0 10px ${pulseColor};"></span>
              <span class="hint-text" style="color: #ffffff !important; font-weight: 700; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);">${hintText}</span>
              <span class="hint-cta-badge" style="color: #ffffff !important; font-weight: 800; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);">${ctaText}</span>
            </div>
          </div>
        </div>
      `;

      // Click to open modal
      slide.onclick = (e) => {
        if (e.target.closest('.promo-nav-btn') || e.target.closest('.promo-dots')) return;
        openPromoModal(promo);
      };

      if (prevBtn) {
        card.insertBefore(slide, prevBtn);
      } else {
        card.appendChild(slide);
      }
    });

    // Handle single slide vs multiple slides UI controls
    if (activePromos.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (dotsContainer) dotsContainer.style.display = 'none';
      if (promoTimer) clearInterval(promoTimer);
    } else {
      if (prevBtn) prevBtn.style.display = 'flex';
      if (nextBtn) nextBtn.style.display = 'flex';
      if (dotsContainer) {
        dotsContainer.style.display = 'flex';
        dotsContainer.innerHTML = '';
        activePromos.forEach((_, idx) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'promo-dot' + (idx === 0 ? ' active' : '');
          dot.setAttribute('data-slide', idx);
          dot.setAttribute('aria-label', `Slide ${idx + 1}`);
          dotsContainer.appendChild(dot);
        });
      }
      // Initialize carousel listeners & auto-rotation
      initPromoSlider();
    }
  }

  // Fetch promos dynamically from Node backend & sync visibility
  async function loadPromoBanners() {
    const bannerWrap = document.querySelector('.hero-banner-wrap');
    try {
      const res = await fetch(`${API_BASE}/api/promos`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const activePromos = json.data.filter((p) => p.active !== false);
        if (activePromos.length > 0) {
          renderHeroPromos(activePromos);
        } else {
          // Seluruh banner nonaktif di admin -> sembunyikan section banner di halaman utama
          if (bannerWrap) bannerWrap.style.display = 'none';
          if (promoTimer) clearInterval(promoTimer);
        }
      }
    } catch (err) {
      console.warn('Could not fetch promos from backend:', err);
    }
  }

  // Load promos on startup
  loadPromoBanners();

  // ==========================================
  // 5. CUSTOMER TESTIMONIALS & POST-REPAIR REVIEW SYSTEM
  // ==========================================
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  const openTestiModalBtn = document.getElementById('openTestimonialModalBtn');
  const closeTestiModalBtn = document.getElementById('closeTestimonialModalBtn');
  const testiModal = document.getElementById('testimonialModal');
  const pubTestiForm = document.getElementById('publicTestimonialForm');

  // Load and render testimonials dynamically
  async function loadTestimonials() {
    if (!testimonialsGrid) return;
    try {
      const res = await fetch(`${API_BASE}/api/testimonials`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        renderTestimonialCards(json.data);
      }
    } catch (err) {
      console.warn('Could not fetch testimonials, keeping fallback list:', err);
    }
  }

  function renderTestimonialCards(items) {
    if (!testimonialsGrid) return;
    testimonialsGrid.innerHTML = '';

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'testimonial-card';
      if (item.isNew) card.classList.add('testi-new-highlight');

      const starCount = Math.min(5, Math.max(1, parseInt(item.rating, 10) || 5));
      const starsString = '⭐'.repeat(starCount);
      const initial = (item.name || 'P').trim().charAt(0).toUpperCase();

      card.innerHTML = `
        <div class="testimonial-stars" style="margin-bottom:14px;">${starsString}</div>
        <p class="testimonial-text">"${item.text}"</p>
        <div class="testimonial-user">
          <div class="testimonial-avatar">${initial}</div>
          <div>
            <strong>${item.name}</strong>
            <small>Pengguna ${item.device || 'Smartphone'} • ${item.date || 'Baru'}</small>
          </div>
        </div>
      `;

      testimonialsGrid.appendChild(card);
    });
  }

  // Modal open & close
  if (openTestiModalBtn && testiModal) {
    openTestiModalBtn.addEventListener('click', () => {
      testiModal.classList.add('active');
    });
  }

  if (closeTestiModalBtn && testiModal) {
    closeTestiModalBtn.addEventListener('click', () => {
      testiModal.classList.remove('active');
    });
  }

  testiModal?.addEventListener('click', (e) => {
    if (e.target === testiModal) {
      testiModal.classList.remove('active');
    }
  });

  // Modal Interactive Star Rating
  const modalStars = document.querySelectorAll('#modalStarRating .star-btn');
  const modalRatingInput = document.getElementById('modalRatingVal');
  const modalRatingLabel = document.getElementById('modalRatingLabel');
  const modalStarTexts = {
    1: '1.0 (Kurang Puas)',
    2: '2.0 (Cukup)',
    3: '3.0 (Baik)',
    4: '4.0 (Puas)',
    5: '5.0 (Sangat Puas & Rekomendasi)',
  };

  modalStars.forEach((star) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-rating'), 10);
      if (modalRatingInput) modalRatingInput.value = val;
      if (modalRatingLabel) modalRatingLabel.textContent = modalStarTexts[val] || `${val}.0`;
      modalStars.forEach((s) => {
        const sVal = parseInt(s.getAttribute('data-rating'), 10);
        s.classList.toggle('active', sVal <= val);
      });
    });
  });

  // Public Testimonial Submit
  pubTestiForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('pubTestiSubmitBtn');
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Memverifikasi & Menerbitkan...</span>';

    const payload = {
      ticketId: document.getElementById('pubTestiTicket')?.value.trim(),
      name: document.getElementById('pubTestiName')?.value.trim(),
      device: document.getElementById('pubTestiDevice')?.value.trim(),
      rating: modalRatingInput?.value || 5,
      text: document.getElementById('pubTestiText')?.value.trim(),
    };

    try {
      const res = await fetch(`${API_BASE}/api/testimonials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success && json.data) {
        pubTestiForm.reset();
        const successBox = document.getElementById('modalTestiSuccess');
        if (successBox) successBox.classList.remove('hidden');

        // Reload and highlight new testimonial
        await loadTestimonials();

        setTimeout(() => {
          if (testiModal) testiModal.classList.remove('active');
          if (successBox) successBox.classList.add('hidden');
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;

          // Scroll smoothly to testimonials section so customer sees their review published!
          const testiSection = document.querySelector('.testimonials-section');
          testiSection?.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
      } else {
        alert('Gagal mengirim testimoni: ' + (json.error || 'Terjadi kesalahan'));
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    } catch (err) {
      alert('Gagal menghubungi server: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;
    }
  });

  // Load testimonials on homepage start
  loadTestimonials();

  // 6. Navigation Auth Status
  function checkNavAuth() {
    const rawStaff = localStorage.getItem('ngalam_auth_user') || sessionStorage.getItem('ngalam_auth_user');
    const rawTech = localStorage.getItem('ngalam_tech_session') || sessionStorage.getItem('ngalam_tech_session');
    const rawMitra = localStorage.getItem('ngalam_mitra_session') || sessionStorage.getItem('ngalam_mitra_session');
    const rawCust = localStorage.getItem('ngalam_customer_session') || sessionStorage.getItem('ngalam_customer_session');

    const loginLink = document.getElementById('navLoginBtn') || 
                      document.querySelector('a.navend-login[href*="login"]') || 
                      document.querySelectorAll('.navend-login')[document.querySelectorAll('.navend-login').length - 1];
    if (!loginLink) return;

    const path = window.location.pathname.toLowerCase();
    const isSubdir = path.includes('/layanan') ||
                     path.includes('/pesan-servis') ||
                     path.includes('/kontak') ||
                     path.includes('/login') ||
                     path.includes('/admin') ||
                     path.includes('/teknisi') ||
                     path.includes('/mitra') ||
                     path.includes('/lacak');
    const prefix = isSubdir ? '../' : '';

    try {
      // 1. Staff Priority (Admin / Kasir / Owner)
      if (rawStaff) {
        const user = JSON.parse(rawStaff);
        if (user && (user.name || user.username)) {
          const shortName = (user.name || user.username).split('(')[0].trim().split(' ')[0];
          let dest = 'admin/index.html';
          let roleDisplay = 'KASIR';
          let avatar = user.avatar || '👩‍💼';

          if (user.role === 'admin' || user.role === 'owner') {
            roleDisplay = user.isSuperAdmin ? 'SUPER ADMIN' : 'OWNER';
            avatar = '👑';
          } else if (user.role === 'teknisi') {
            dest = 'teknisi/index.html';
            roleDisplay = 'TEKNISI';
            avatar = user.avatar || '🔬';
          }

          loginLink.href = `${prefix}${dest}`;
          loginLink.innerHTML = `<span>${avatar} ${shortName} (${roleDisplay})</span>`;
          loginLink.title = `Buka Dashboard: ${user.name || user.username}`;
          return;
        }
      }

      // 2. Teknisi Session Priority
      if (rawTech) {
        const tech = JSON.parse(rawTech);
        if (tech && (tech.name || tech.username)) {
          const shortName = (tech.name || tech.username).split('(')[0].trim().split(' ')[0];
          loginLink.href = `${prefix}teknisi/index.html`;
          loginLink.innerHTML = `<span>${tech.avatar || '🔬'} ${shortName} (TEKNISI)</span>`;
          loginLink.title = `Meja Kerja Teknisi: ${tech.name || tech.username}`;
          return;
        }
      }

      // 3. Mitra Session Priority
      if (rawMitra) {
        const mitra = JSON.parse(rawMitra);
        if (mitra && (mitra.name || mitra.username)) {
          const shortName = (mitra.name || mitra.username).split('(')[0].trim().split(' ')[0];
          loginLink.href = `${prefix}mitra/index.html`;
          loginLink.innerHTML = `<span>${mitra.avatar || '🛵'} ${shortName} (MITRA)</span>`;
          loginLink.title = `Portal Afiliasi Mitra: ${mitra.name || mitra.username}`;
          return;
        }
      }

      // 4. Customer Member Priority
      if (rawCust) {
        const cust = JSON.parse(rawCust);
        if (cust && (cust.name || cust.whatsapp)) {
          const shortName = (cust.name || 'Pelanggan').split('(')[0].trim().split(' ')[0];
          loginLink.href = `${prefix}login/index.html`;
          loginLink.innerHTML = `<span>👤 ${shortName} (MEMBER)</span>`;
          loginLink.title = `Portal Servis Member: ${cust.name || cust.whatsapp}`;
          return;
        }
      }
    } catch (_) {}
  }
  checkNavAuth();
});

