/**
 * NGALAM FIX PRO - Initial Website Preloader & Welcome Promo Engine
 * 1. Shows a high-tech splash screen only on first entry of the session.
 * 2. Immediately triggers an attractive Welcome Promo Offer Pop-up upon completion:
 *    "Daftarkan akunmu sekarang untuk mendapatkan promo besar-besaran!"
 * 3. Does not load repeatedly on page refresh or navigation ("jangan loading terus-terusan").
 */

(function () {
  'use strict';

  // Do not run consumer preloader on staff administrative portals
  if (window.location.pathname.startsWith('/admin') || 
      window.location.pathname.startsWith('/kasir') || 
      window.location.pathname.startsWith('/teknisi')) {
    return;
  }

  const STORAGE_KEY = 'ngalam_site_entered';
  const PROMO_DISMISSED_KEY = 'ngalam_welcome_promo_dismissed';

  // Config: Set to false so preloader does not annoyingly block on every navigation/refresh
  const REPEAT_PRELOADER = false;

  const urlParams = new URLSearchParams(window.location.search);
  const isPreviewPreloader = urlParams.has('preview_loader') || urlParams.has('test_loader');
  const isPreviewPromo = urlParams.has('preview_promo') || urlParams.has('test_promo');

  // If repeating mode is active, clear any residual suppression flags
  if (REPEAT_PRELOADER) {
    try {
      document.documentElement.classList.remove('splash-already-shown');
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(PROMO_DISMISSED_KEY);
    } catch (_) {}
  }

  // Check if user already saw the splash during this browser session
  const alreadyVisited = !REPEAT_PRELOADER && !isPreviewPreloader && (sessionStorage.getItem(STORAGE_KEY) === 'true');

  if (alreadyVisited && !isPreviewPromo) {
    // Suppress preloader immediately without any visual flash
    document.documentElement.classList.add('splash-already-shown');
    const existingEl = document.getElementById('ngalamInitialPreloader');
    if (existingEl) existingEl.remove();
    return;
  }

  // Ensure CSS is loaded
  function ensurePreloaderStyles() {
    if (document.getElementById('ngalamPreloaderStyles')) return;
    const existing = document.querySelector('link[href*="preloader.css"]');
    if (!existing) {
      const link = document.createElement('link');
      link.id = 'ngalamPreloaderStyles';
      link.rel = 'stylesheet';
      link.href = (window.location.pathname.includes('/layanan/') || 
                   window.location.pathname.includes('/pesan-servis/') || 
                   window.location.pathname.includes('/kontak/') || 
                   window.location.pathname.includes('/lacak/') || 
                   window.location.pathname.includes('/login/') || 
                   window.location.pathname.includes('/admin/') || 
                   window.location.pathname.includes('/mitra/') || 
                   window.location.pathname.includes('/teknisi/'))
        ? '../css/preloader.css?v=2.0'
        : 'css/preloader.css?v=2.0';
      document.head.appendChild(link);
    }
  }

  function getBasePath() {
    return (window.location.pathname.includes('/layanan/') || 
            window.location.pathname.includes('/pesan-servis/') || 
            window.location.pathname.includes('/kontak/') || 
            window.location.pathname.includes('/lacak/') || 
            window.location.pathname.includes('/login/') || 
            window.location.pathname.includes('/admin/') || 
            window.location.pathname.includes('/mitra/') || 
            window.location.pathname.includes('/teknisi/'))
      ? '../'
      : '';
  }

  /**
   * TRIGGER WELCOME PROMO OFFER POP-UP
   * Displays immediately after the initial preloader finishes.
   */
  function triggerWelcomePromoOffer() {
    ensurePreloaderStyles();

    // Do not show if already dismissed in this session (unless in repeating mode or forced via preview)
    if (!REPEAT_PRELOADER && !isPreviewPromo && sessionStorage.getItem(PROMO_DISMISSED_KEY) === 'true') {
      return;
    }

    // Do not show if already logged in as a registered customer
    try {
      const custRaw = localStorage.getItem('ngalam_customer_session');
      if (!isPreviewPromo && custRaw) {
        const cust = JSON.parse(custRaw);
        if (cust && (cust.id || cust.whatsapp)) {
          return; // User already has an account, no need to ask to register
        }
      }
    } catch (_) {}

    // Avoid multiple instances
    let overlay = document.getElementById('ngalamWelcomePromoOverlay');
    if (overlay) overlay.remove();

    const promoCode = 'MEMBERBARU30';
    const registerUrl = `/login?mode=register&promo=${promoCode}`;

    overlay = document.createElement('div');
    overlay.id = 'ngalamWelcomePromoOverlay';
    overlay.className = 'welcome-promo-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'welcomePromoTitle');

    overlay.innerHTML = `
      <div class="welcome-promo-card">
        <button type="button" class="welcome-promo-close" id="welcomePromoCloseBtn" aria-label="Tutup Penawaran">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <!-- Top Badges -->
        <div class="welcome-promo-tags">
          <span class="welcome-promo-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-right:5px;"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            PENAWARAN SPESIAL MEMBER BARU
          </span>
          <span class="welcome-promo-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-right:5px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            DISKON S/D 30%
          </span>
        </div>

        <!-- Headline -->
        <h2 class="welcome-promo-title" id="welcomePromoTitle">
          Daftarkan Akunmu Sekarang & Dapatkan <span>Promo Besar-Besaran!</span>
        </h2>

        <p class="welcome-promo-desc">
          Nikmati potongan biaya servis hingga <b>30%</b>, perlindungan garansi resmi (khusus baterai <b>90 hari</b>, perbaikan lain <b>1 minggu s/d 1 bulan</b>), serta pantau antrean perbaikan unit HP Anda secara real-time langsung dari dashboard pribadi!
        </p>

        <!-- Voucher Code Box -->
        <div class="welcome-promo-code-card">
          <div class="welcome-code-left">
            <span class="welcome-code-label">KODE VOUCHER MEMBER:</span>
            <div class="welcome-code-value" id="welcomePromoCodeDisplay">${promoCode}</div>
          </div>
          <button type="button" class="welcome-btn-copy" id="welcomeCopyBtn" title="Salin Kode Promo">
            <span id="welcomeCopyIcon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </span>
            <span id="welcomeCopyText">Salin Kode</span>
          </button>
        </div>
        <div class="welcome-copy-toast" id="welcomeCopyToast">
          Kode voucher <b>${promoCode}</b> berhasil disalin ke clipboard!
        </div>

        <!-- Perks List -->
        <div class="welcome-promo-perks">
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </span>
            <div class="welcome-perk-text">
              <strong>Garansi Resmi Servis</strong>
              <small>Baterai 90 hari, lainnya 7–30 hari</small>
            </div>
          </div>
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </span>
            <div class="welcome-perk-text">
              <strong>Bisa Ditunggu</strong>
              <small>30–60 menit di meja lab</small>
            </div>
          </div>
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <div class="welcome-perk-text">
              <strong>Lacak Real-Time</strong>
              <small>Pantau progres teknisi</small>
            </div>
          </div>
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>
            </span>
            <div class="welcome-perk-text">
              <strong>Grade Original</strong>
              <small>Suku cadang presisi tinggi</small>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="welcome-promo-actions">
          <a href="${registerUrl}" class="welcome-btn-primary" id="welcomeClaimBtn">
            <span>Daftarkan Akun Member Sekarang</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block;vertical-align:middle;margin-left:6px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
          </a>
          <button type="button" class="welcome-btn-secondary" id="welcomeLaterBtn">
            Nanti Saja, Saya Ingin Melihat Dulu
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger smooth entrance animation
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    function dismissWelcomePromo() {
      overlay.classList.remove('active');
      if (!REPEAT_PRELOADER) {
        try {
          sessionStorage.setItem(PROMO_DISMISSED_KEY, 'true');
        } catch (_) {}
      }
      setTimeout(() => {
        overlay.remove();
      }, 400);
    }

    // Bind Close & Later buttons
    document.getElementById('welcomePromoCloseBtn')?.addEventListener('click', dismissWelcomePromo);
    document.getElementById('welcomeLaterBtn')?.addEventListener('click', dismissWelcomePromo);

    // Backdrop click dismisses
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        dismissWelcomePromo();
      }
    });

    // Copy Voucher Code Handler
    const copyBtn = document.getElementById('welcomeCopyBtn');
    const copyText = document.getElementById('welcomeCopyText');
    const copyIcon = document.getElementById('welcomeCopyIcon');
    const toast = document.getElementById('welcomeCopyToast');

    copyBtn?.addEventListener('click', () => {
      const onSuccess = () => {
        if (copyText) copyText.textContent = 'Tersalin!';
        if (toast) toast.style.display = 'block';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Salin Kode';
          if (toast) toast.style.display = 'none';
        }, 2500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promoCode).then(onSuccess).catch(() => {
          fallbackCopy(promoCode, onSuccess);
        });
      } else {
        fallbackCopy(promoCode, onSuccess);
      }
    });

    function fallbackCopy(text, cb) {
      try {
        const temp = document.createElement('input');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        cb();
      } catch (_) {}
    }
  }

  // Preloader Initializer
  function initPreloader() {
    ensurePreloaderStyles();

    if (isPreviewPromo && !isPreviewPreloader) {
      triggerWelcomePromoOffer();
      return;
    }

    let preloader = document.getElementById('ngalamInitialPreloader');
    const basePath = getBasePath();

    if (!preloader) {
      preloader = document.createElement('div');
      preloader.id = 'ngalamInitialPreloader';
      preloader.innerHTML = `
        <div class="preloader-ambient-glow"></div>
        <div class="preloader-card">
          <!-- Logo with Aura -->
          <div class="preloader-logo-wrapper">
            <div class="preloader-logo-aura"></div>
            <div class="preloader-logo-badge">
              <img src="${basePath}images/logo-ngalam-fix-pro.jpg" alt="Logo Ngalam Fix Pro" class="preloader-logo-img" onerror="this.onerror=null; this.parentElement.innerHTML='<svg width=\'32\' height=\'32\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'><path d=\'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\'/></svg>';">
            </div>
          </div>

          <!-- Brand Title -->
          <h1 class="preloader-brand-title">
            Ngalam <span class="preloader-gold-text">Fix Pro</span>
          </h1>

          <!-- Subtitle Pill -->
          <div class="preloader-subtitle-pill">
            <span class="preloader-pulse-dot"></span>
            <span>Spesialis Smartphone Android & iPhone</span>
          </div>

          <!-- Progress Track -->
          <div class="preloader-progress-box">
            <div class="preloader-progress-track">
              <div class="preloader-progress-fill" id="preloaderFill"></div>
            </div>

            <!-- Status Row -->
            <div class="preloader-status-row">
              <div class="preloader-status-msg">
                <span class="preloader-spinner"></span>
                <span id="preloaderStepText">Menghubungkan ke sistem workshop...</span>
              </div>
              <div class="preloader-counter" id="preloaderCounter">0%</div>
            </div>
          </div>

          <!-- Feature Micro Badges -->
          <div class="preloader-perks">
            <div class="preloader-perk-item">Garansi Resmi Lab</div>
            <div class="preloader-perk-item">Bisa Ditunggu 30 Menit</div>
            <div class="preloader-perk-item">Suku Cadang Original</div>
          </div>
        </div>
      `;
      document.body.prepend(preloader);
    }

    const fillEl = document.getElementById('preloaderFill');
    const stepEl = document.getElementById('preloaderStepText');
    const countEl = document.getElementById('preloaderCounter');

    let currentPercent = 0;
    const targetPercent = 100;
    const duration = 1250; // 1.25s total animation duration
    const intervalTime = 25;
    const stepIncrement = (targetPercent / (duration / intervalTime));

    const animTimer = setInterval(() => {
      currentPercent += stepIncrement;
      if (currentPercent >= targetPercent) {
        currentPercent = targetPercent;
        clearInterval(animTimer);
        finishPreloader();
      }

      const displayVal = Math.floor(currentPercent);
      if (fillEl) fillEl.style.width = `${displayVal}%`;
      if (countEl) countEl.textContent = `${displayVal}%`;

      // Update friendly stage descriptions
      if (stepEl) {
        if (displayVal < 35) {
          stepEl.textContent = 'Menghubungkan ke sistem workshop...';
        } else if (displayVal < 70) {
          stepEl.textContent = 'Memuat modul antrean & estimasi biaya...';
        } else if (displayVal < 95) {
          stepEl.textContent = 'Menyiapkan antarmuka interaktif...';
        } else {
          stepEl.textContent = 'Selamat Datang di Ngalam Fix Pro!';
        }
      }
    }, intervalTime);

    function finishPreloader() {
      // Mark as shown only if not in repeating mode
      if (!REPEAT_PRELOADER) {
        try {
          sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch (_) {}
      }

      setTimeout(() => {
        if (preloader) {
          preloader.classList.add('fade-out');
          if (!REPEAT_PRELOADER) {
            document.documentElement.classList.add('splash-already-shown');
          }
          setTimeout(() => {
            preloader.remove();

            // Trigger Welcome Promo Offer Modal immediately after loading completes!
            setTimeout(() => {
              triggerWelcomePromoOffer();
            }, 250);
          }, 650);
        }
      }, 200);
    }
  }

  // Trigger when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloader);
  } else {
    initPreloader();
  }

  // Global helper functions
  window.triggerWelcomePromoOffer = triggerWelcomePromoOffer;
  window.resetNgalamPreloader = function () {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(PROMO_DISMISSED_KEY);
      location.reload();
    } catch (_) {}
  };
})();
