/**
 * ============================================================================
 * NGALAM FIX PRO - ADVANCED SCREEN DETECTOR & IMAGE UI ENGINE
 * ============================================================================
 * Sensor Detektor Ukuran Layar Cerdas Real-Time:
 * 1. Mendeteksi secara instan ukuran layar (lebar & tinggi viewport, orientasi, DPI).
 * 2. Mengidentifikasi apakah tampilan mengecil seperti layar HP (phone-xs, phone, phablet, tablet, desktop).
 * 3. Mengaktifkan Mode Tampilan Mobile (data-screen-mode="mobile", data-is-phone="true").
 * 4. Merespons dan memperbaiki seluruh UI gambar (banner promo slider, logo, modal pop-up,
 *    avatar maskot chatbot, icon keunggulan) agar proporsional, tajam, tidak gepeng, dan pas di layar.
 * 5. Menjaga 100% fungsi tetap sama (touch swipe geser slider, klik banner klaim promo,
 *    tombol salin kode voucher, CTA pesan servis, dll).
 * 6. Global API: window.ScreenDetector & window.NgalamSensor
 * ============================================================================
 */

(function () {
  'use strict';

  // Breakpoints Detektor Ukuran Layar
  const SCREEN_TIERS = {
    PHONE_XS: 360,    // HP Layar Kecil (iPhone SE, Galaxy A series lama)
    PHONE_SM: 480,    // HP Standar (iPhone 12/13/14/15/16, Galaxy S series)
    PHONE_LG: 768,    // HP Layar Besar / Phablet / Mini Tablet
    TABLET: 1024      // Tablet / iPad
  };

  /**
   * Evaluasi Sensor Layar Terkini
   */
  function detectScreenInfo() {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 360;
    const height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 640;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

    let tier = 'desktop';
    let screenMode = 'desktop'; // 'mobile' | 'tablet' | 'desktop'

    if (width <= SCREEN_TIERS.PHONE_XS) {
      tier = 'phone-xs';
      screenMode = 'mobile';
    } else if (width <= SCREEN_TIERS.PHONE_SM) {
      tier = 'phone-sm';
      screenMode = 'mobile';
    } else if (width <= SCREEN_TIERS.PHONE_LG) {
      tier = 'phone-lg';
      screenMode = 'mobile';
    } else if (width <= SCREEN_TIERS.TABLET) {
      tier = 'tablet';
      screenMode = isMobileUA ? 'mobile' : 'tablet';
    } else {
      tier = 'desktop';
      screenMode = 'desktop';
    }

    // Jika user-agent mendeteksi mobile dan layar di bawah 900px, jadikan mobile
    if (isMobileUA && width < 900) {
      screenMode = 'mobile';
    }

    const isMobile = screenMode === 'mobile';
    const isPhone = width <= SCREEN_TIERS.PHONE_LG;
    const orientation = height > width ? 'portrait' : 'landscape';
    const dpr = window.devicePixelRatio || 1;

    return {
      tier: tier,               // 'phone-xs' | 'phone-sm' | 'phone-lg' | 'tablet' | 'desktop'
      mode: screenMode,         // 'mobile' | 'tablet' | 'desktop'
      isMobile: isMobile,
      isPhone: isPhone,
      isDesktop: screenMode === 'desktop',
      isTablet: screenMode === 'tablet',
      isTouch: hasTouch,
      orientation: orientation,
      width: width,
      height: height,
      dpr: dpr
    };
  }

  /**
   * Terapkan Atribut & Kelas Sensor ke Elemen Root Dokumen
   */
  function applyScreenSensor(info) {
    const docEl = document.documentElement;
    const body = document.body;

    // Pasang atribut data untuk selector CSS presisi
    docEl.setAttribute('data-screen-mode', info.mode);
    docEl.setAttribute('data-screen-tier', info.tier);
    docEl.setAttribute('data-device', info.isMobile ? 'mobile' : 'desktop');
    docEl.setAttribute('data-is-phone', info.isPhone ? 'true' : 'false');
    docEl.setAttribute('data-orientation', info.orientation);
    docEl.setAttribute('data-touch', info.isTouch ? 'true' : 'false');

    // Variabel CSS dinamis untuk ukuran gambar & viewport
    docEl.style.setProperty('--viewport-w', `${info.width}px`);
    docEl.style.setProperty('--viewport-h', `${info.height}px`);
    docEl.style.setProperty('--is-mobile-ui', info.isMobile ? '1' : '0');
    docEl.style.setProperty('--banner-aspect-ratio', info.isPhone ? '16 / 8.5' : '16 / 8.2');

    // Bersihkan kelas lama
    const staleClasses = [
      'screen-mobile', 'screen-desktop', 'screen-tablet',
      'mode-mobile', 'mode-desktop', 'mode-tablet',
      'is-mobile', 'is-desktop', 'is-tablet',
      'device-mobile', 'device-desktop',
      'tier-phone-xs', 'tier-phone-sm', 'tier-phone-lg', 'tier-tablet', 'tier-desktop',
      'screen-portrait', 'screen-landscape',
      'mobile-screen-detected', 'computer-screen-detected'
    ];

    staleClasses.forEach(cls => {
      docEl.classList.remove(cls);
      if (body) body.classList.remove(cls);
    });

    // Tambahkan kelas baru
    const activeClasses = [
      `screen-${info.mode}`,
      `mode-${info.mode}`,
      `tier-${info.tier}`,
      info.isMobile ? 'mobile-screen-detected' : 'computer-screen-detected',
      info.isMobile ? 'device-mobile' : 'device-desktop',
      `screen-${info.orientation}`,
      info.isTouch ? 'has-touch' : 'no-touch'
    ];

    activeClasses.forEach(cls => {
      docEl.classList.add(cls);
      if (body) body.classList.add(cls);
    });
  }

  /**
   * Perbaiki Seluruh UI Gambar Saat Terdeteksi Layar HP
   * (Menjamin gambar tidak gepeng, pas, responsif, dan fungsi 100% sama)
   */
  function optimizeImagesForScreen(info) {
    // 1. Optimasi Gambar Banner Slider (.promo-slide-image)
    const bannerImgs = document.querySelectorAll('.promo-slide-image, .hero-banner-card img');
    bannerImgs.forEach(img => {
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.display = 'block';
      img.style.imageRendering = '-webkit-optimize-contrast';
      img.setAttribute('data-sensor-optimized', 'true');
    });

    // 2. Optimasi Wadah Banner Hero (.hero-banner-card)
    const bannerCards = document.querySelectorAll('.hero-banner-card');
    bannerCards.forEach(card => {
      if (info.isPhone) {
        card.style.aspectRatio = '16 / 7.2';
        card.style.minHeight = '125px';
        card.style.maxHeight = '175px';
        card.style.overflow = 'hidden';
        card.style.borderRadius = '14px';
      } else {
        card.style.aspectRatio = '16 / 8.2';
        card.style.minHeight = '320px';
        card.style.maxHeight = '480px';
        card.style.borderRadius = '24px';
      }
    });

    // 3. Optimasi Gambar Logo Brand (.brand-logo-img)
    const logos = document.querySelectorAll('.brand-logo-img');
    logos.forEach(logo => {
      logo.style.objectFit = 'contain';
      logo.style.width = '100%';
      logo.style.height = '100%';
      logo.style.display = 'block';
      logo.style.borderRadius = info.isPhone ? '10px' : '14px';
    });

    // 4. Optimasi Avatar Maskot Chatbot (.chatbot-avatar-img, .ai-avatar-btn)
    const avatars = document.querySelectorAll('.chatbot-avatar-img, .ai-avatar-img');
    avatars.forEach(av => {
      av.style.objectFit = 'cover';
      av.style.objectPosition = 'center top';
      av.style.borderRadius = '50%';
      av.style.display = 'block';
    });

    // 5. Optimasi Pop-up Modal Promo & Welcome Modal (.welcome-promo-card)
    const welcomeCard = document.querySelector('.welcome-promo-card');
    if (welcomeCard) {
      if (info.isPhone) {
        welcomeCard.style.padding = info.tier === 'phone-xs' ? '20px 14px 18px' : '24px 18px 20px';
        welcomeCard.style.borderRadius = '22px';
        welcomeCard.style.maxWidth = '92vw';
      } else {
        welcomeCard.style.padding = '32px 28px 26px';
        welcomeCard.style.borderRadius = '28px';
        welcomeCard.style.maxWidth = '500px';
      }
    }

    // 6. Optimasi Seluruh Gambar Kartu Layanan (.service-card img, .card img)
    const cardImgs = document.querySelectorAll('.service-card img, .catalog-card img, .order-item img');
    cardImgs.forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '12px';
    });
  }

  /**
   * Touch Gesture Swipe untuk Banner Slider di HP (Fungsi Sama 100%)
   */
  let touchSwipeInitialized = false;
  function initBannerTouchSwipe() {
    const bannerCard = document.querySelector('.hero-banner-card');
    if (!bannerCard || bannerCard._hasSwipeListener) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    bannerCard.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    bannerCard.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        handleSwipeGesture();
      }
    }, { passive: true });

    function handleSwipeGesture() {
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Geser horizontal lebih dominan daripada vertikal
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          // Swipe kiri -> Slide berikutnya
          const nextBtn = document.getElementById('promoNextBtn');
          if (nextBtn) nextBtn.click();
        } else {
          // Swipe kanan -> Slide sebelumnya
          const prevBtn = document.getElementById('promoPrevBtn');
          if (prevBtn) prevBtn.click();
        }
      }
    }

    bannerCard._hasSwipeListener = true;
  }

  /**
   * Posisi Cerdas Chatbot di Layar HP agar Ergonomis & Tidak Menutupi Tombol
   */
  function repositionMobileChatbot(info) {
    const chatbot = document.querySelector('.chatbot-container');
    if (!chatbot) return;

    if (info.isMobile) {
      chatbot.classList.add('mobile-docked');
      chatbot.style.left = 'auto';
      chatbot.style.right = '16px';
      chatbot.style.bottom = '20px';
    } else {
      chatbot.classList.remove('mobile-docked');
      chatbot.style.left = 'auto';
      chatbot.style.right = '24px';
      chatbot.style.bottom = '24px';
    }
  }

  /**
   * Bungkus Tabel agar Memiliki Horizontal Scroll yang Rapi di HP
   */
  function wrapUnresponsiveTables() {
    const tables = document.querySelectorAll('table:not(.wrapped-mobile)');
    tables.forEach(table => {
      const parent = table.parentElement;
      if (parent && !parent.classList.contains('table-responsive') && !parent.classList.contains('kasir-table-wrapper') && !parent.classList.contains('admin-table-wrapper') && !parent.classList.contains('mobile-table-scroll-wrap')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-table-scroll-wrap';
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        table.classList.add('wrapped-mobile');
      }
    });
  }

  /**
   * Optimasi Lengkap saat Mode Layar Berubah
   */
  function runScreenOptimizations(info) {
    // 1. Meta viewport check
    const vpMeta = document.querySelector('meta[name="viewport"]');
    if (vpMeta) {
      let content = vpMeta.getAttribute('content') || '';
      if (!content.includes('viewport-fit')) {
        vpMeta.setAttribute('content', `${content}, viewport-fit=cover`);
      }
    }

    // 2. Cegah auto-zoom iOS
    if (info.isMobile) {
      const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
      inputs.forEach(el => {
        const computed = window.getComputedStyle(el).fontSize;
        if (parseFloat(computed) < 16) {
          el.style.fontSize = '16px';
        }
      });
    }

    // 3. Perbaiki UI Gambar
    optimizeImagesForScreen(info);

    // 4. Touch swipe gesture banner
    initBannerTouchSwipe();

    // 5. Reposisi chatbot
    repositionMobileChatbot(info);

    // 6. Wrap tabel
    wrapUnresponsiveTables();
  }

  // Evaluasi Sensor Seketika saat script dimuat (mencegah FOUC)
  let currentInfo = detectScreenInfo();
  applyScreenSensor(currentInfo);

  // Jalankan lagi saat DOM siap
  function onDOMLoaded() {
    currentInfo = detectScreenInfo();
    applyScreenSensor(currentInfo);
    runScreenOptimizations(currentInfo);

    // Observer untuk modal / elemen yang dimuat dinamis
    if (typeof MutationObserver !== 'undefined' && document.body) {
      const bodyObserver = new MutationObserver((mutations) => {
        let shouldRecheck = false;
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length > 0) {
            shouldRecheck = true;
            break;
          }
        }
        if (shouldRecheck) {
          optimizeImagesForScreen(currentInfo);
        }
      });
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Log status sensor di console browser
    console.log(
      `%c[Ngalam Fix Pro Sensor Layar]%c Mode: %c${currentInfo.mode.toUpperCase()}%c (${currentInfo.width}x${currentInfo.height}px, ${currentInfo.tier}) • UI Gambar: %cDIOPTIMASI${currentInfo.isMobile ? ' (HP Mode)' : ' (PC Mode)'}`,
      'background:#b45309;color:#fff;font-weight:bold;padding:2px 8px;border-radius:4px;',
      'color:#64748b;',
      'color:#0284c7;font-weight:bold;',
      'color:#64748b;',
      'color:#10b981;font-weight:bold;'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMLoaded);
  } else {
    onDOMLoaded();
  }

  // Listener Resize & Orientasi Dinamis Real-Time
  let resizeTimer = null;
  function handleScreenResize() {
    if (resizeTimer) cancelAnimationFrame(resizeTimer);
    resizeTimer = requestAnimationFrame(() => {
      const prevMode = currentInfo.mode;
      const prevTier = currentInfo.tier;
      const prevOrient = currentInfo.orientation;

      currentInfo = detectScreenInfo();
      applyScreenSensor(currentInfo);

      if (prevMode !== currentInfo.mode || prevTier !== currentInfo.tier || prevOrient !== currentInfo.orientation) {
        runScreenOptimizations(currentInfo);

        // Dispatch Custom Event
        window.dispatchEvent(new CustomEvent('screen-sensor:change', {
          detail: currentInfo
        }));
      }
    });
  }

  window.addEventListener('resize', handleScreenResize, { passive: true });
  window.addEventListener('orientationchange', handleScreenResize, { passive: true });

  // Expose Global Sensor API
  const api = {
    isMobile: () => currentInfo.isMobile,
    isPhone: () => currentInfo.isPhone,
    isDesktop: () => currentInfo.isDesktop,
    isTablet: () => currentInfo.isTablet,
    getMode: () => currentInfo.mode,
    getTier: () => currentInfo.tier,
    getWidth: () => currentInfo.width,
    getHeight: () => currentInfo.height,
    getOrientation: () => currentInfo.orientation,
    getInfo: () => Object.assign({}, currentInfo),
    optimizeImages: () => optimizeImagesForScreen(currentInfo),
    refresh: () => {
      currentInfo = detectScreenInfo();
      applyScreenSensor(currentInfo);
      runScreenOptimizations(currentInfo);
      return currentInfo;
    }
  };

  window.ScreenDetector = api;
  window.NgalamSensor = api;

})();
