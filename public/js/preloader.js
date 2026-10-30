/**
 * NGALAM FIX PRO - Initial Website Preloader & Welcome Promo Engine
 * 1. Shows a high-tech splash screen only on first entry of the session.
 * 2. Immediately triggers an attractive Welcome Promo Offer Pop-up upon completion:
 *    "Daftarkan akunmu sekarang untuk mendapatkan promo besar-besaran!"
 * 3. Does not load repeatedly on page refresh or navigation ("jangan loading terus-terusan").
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ngalam_site_entered';
  const PROMO_DISMISSED_KEY = 'ngalam_welcome_promo_dismissed';

  // Config: REPEAT_PRELOADER = true ensures loading screen runs on every visit and page reload
  const REPEAT_PRELOADER = true;

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

    const basePath = getBasePath();
    const promoCode = 'MEMBERBARU30';

    overlay = document.createElement('div');
    overlay.id = 'ngalamWelcomePromoOverlay';
    overlay.className = 'welcome-promo-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'welcomePromoTitle');

    overlay.innerHTML = `
      <div class="welcome-promo-card">
        <button type="button" class="welcome-promo-close" id="welcomePromoCloseBtn" aria-label="Tutup Penawaran">✕</button>

        <!-- Top Badges -->
        <div class="welcome-promo-tags">
          <span class="welcome-promo-badge">🎁 PENAWARAN SPESIAL MEMBER BARU</span>
          <span class="welcome-promo-pill">🔥 DISKON S/D 30%</span>
        </div>

        <!-- Headline -->
        <h2 class="welcome-promo-title" id="welcomePromoTitle">
          Daftarkan Akunmu Sekarang & Dapatkan <span>Promo Besar-Besaran!</span>
        </h2>

        <p class="welcome-promo-desc">
          Nikmati potongan biaya servis hingga <b>30%</b>, perlindungan garansi resmi <b>90 hari</b>, serta pantau antrean perbaikan unit HP Anda secara real-time langsung dari dashboard pribadi!
        </p>

        <!-- Voucher Code Box -->
        <div class="welcome-promo-code-card">
          <div class="welcome-code-left">
            <span class="welcome-code-label">KODE VOUCHER MEMBER:</span>
            <div class="welcome-code-value" id="welcomePromoCodeDisplay">${promoCode}</div>
          </div>
          <button type="button" class="welcome-btn-copy" id="welcomeCopyBtn" title="Salin Kode Promo">
            <span id="welcomeCopyIcon">📋</span>
            <span id="welcomeCopyText">Salin Kode</span>
          </button>
        </div>
        <div class="welcome-copy-toast" id="welcomeCopyToast">
          ✅ Kode voucher <b>${promoCode}</b> berhasil disalin ke clipboard!
        </div>

        <!-- Perks List -->
        <div class="welcome-promo-perks">
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">🛡️</span>
            <div class="welcome-perk-text">
              <strong>Garansi s/d 90 Hari</strong>
              <small>Tercatat resmi di akun Anda</small>
            </div>
          </div>
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">⚡</span>
            <div class="welcome-perk-text">
              <strong>Bisa Ditunggu</strong>
              <small>30–60 menit di meja lab</small>
            </div>
          </div>
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">🔍</span>
            <div class="welcome-perk-text">
              <strong>Lacak Real-Time</strong>
              <small>Pantau progres teknisi</small>
            </div>
          </div>
          <div class="welcome-perk-item">
            <span class="welcome-perk-icon">💎</span>
            <div class="welcome-perk-text">
              <strong>Grade Original</strong>
              <small>Suku cadang presisi tinggi</small>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="welcome-promo-actions">
          <a href="${basePath}login/index.html?mode=register&promo=${promoCode}" class="welcome-btn-primary" id="welcomeClaimBtn">
            <span>Daftarkan Akun Member Sekarang 🚀</span>
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
        if (copyIcon) copyIcon.textContent = '✓';
        if (toast) toast.style.display = 'block';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Salin Kode';
          if (copyIcon) copyIcon.textContent = '📋';
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
              <img src="${basePath}images/logo-ngalam-fix-pro.jpg" alt="Logo Ngalam Fix Pro" class="preloader-logo-img" onerror="this.onerror=null; this.parentElement.innerHTML='🛠️';">
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
            <div class="preloader-perk-item">🛡️ Garansi 90 Hari</div>
            <div class="preloader-perk-item">⚡ Bisa Ditunggu 30 Menit</div>
            <div class="preloader-perk-item">💎 Suku Cadang Original</div>
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
