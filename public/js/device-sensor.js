/**
 * ============================================================================
 * 📱 NGALAM FIX PRO - ADVANCED SCREEN SENSOR & RESPONSIVE ENGINE
 * ============================================================================
 * Sistem Sensor Layar Cerdas Real-Time (Otomatis Deteksi Layar HP vs Komputer):
 * 1. Mendeteksi ukuran layar secara real-time (Resize, Orientation Change, Touch).
 * 2. Mengaktifkan 'Mode Tampilan Mobile' jika layar seukuran HP (<= 768px),
 *    menjadikan seluruh tampilan rapi, proporsional, bebas horizontal overflow,
 *    dan tombol-tombol tidak saling bertabrakan atau menutupi konten.
 * 3. Mengaktifkan 'Mode Tampilan Komputer' jika layar seukuran Laptop/PC (> 768px).
 * 4. Touch swipe gesture support untuk banner slider di layar HP.
 * 5. Anti-collision floating chatbot: memposisikan chatbot di titik aman pada HP
 *    agar tidak menutupi tombol Booking Jadwal atau formulir penting.
 * 6. Global API: window.NgalamSensor
 * ============================================================================
 */

(function () {
  'use strict';

  // Breakpoints Standar Layar HP & Laptop
  const BREAKPOINTS = {
    MOBILE_MAX: 768,
    TABLET_MAX: 1024
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

    let screenMode = 'desktop'; // 'mobile' | 'tablet' | 'desktop'
    if (width <= BREAKPOINTS.MOBILE_MAX || (isMobileUA && width < 900)) {
      screenMode = 'mobile';
    } else if (width <= BREAKPOINTS.TABLET_MAX) {
      screenMode = 'tablet';
    } else {
      screenMode = 'desktop';
    }

    const isMobile = screenMode === 'mobile';
    const isDesktop = screenMode === 'desktop';
    const isTablet = screenMode === 'tablet';
    const orientation = height > width ? 'portrait' : 'landscape';
    const dpr = window.devicePixelRatio || 1;

    return {
      mode: screenMode, // 'mobile' | 'tablet' | 'desktop'
      isMobile: isMobile,
      isDesktop: isDesktop,
      isTablet: isTablet,
      isTouch: hasTouch,
      orientation: orientation,
      width: width,
      height: height,
      dpr: dpr
    };
  }

  /**
   * Terapkan Atribut & Kelas Sensor ke DOM (HTML & Body)
   */
  function applyScreenSensor(info) {
    const docEl = document.documentElement;
    const body = document.body;

    // Bersihkan kelas lama
    const staleClasses = [
      'screen-mobile', 'screen-desktop', 'screen-tablet',
      'mode-mobile', 'mode-desktop', 'mode-tablet',
      'is-mobile', 'is-desktop', 'is-tablet',
      'device-mobile', 'device-desktop',
      'screen-portrait', 'screen-landscape',
      'mobile-screen-detected', 'computer-screen-detected'
    ];

    staleClasses.forEach(cls => {
      docEl.classList.remove(cls);
      if (body) body.classList.remove(cls);
    });

    // Pasang atribut data untuk selector CSS presisi
    docEl.setAttribute('data-screen-mode', info.mode);
    docEl.setAttribute('data-device', info.mode);
    docEl.setAttribute('data-orientation', info.orientation);
    docEl.setAttribute('data-touch', info.isTouch ? 'true' : 'false');

    // Variabel CSS dinamis
    docEl.style.setProperty('--viewport-w', `${info.width}px`);
    docEl.style.setProperty('--viewport-h', `${info.height}px`);
    docEl.style.setProperty('--is-mobile-ui', info.isMobile ? '1' : '0');

    // Tambahkan kelas baru
    const activeClasses = [
      `screen-${info.mode}`,
      `mode-${info.mode}`,
      `is-${info.mode}`,
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
   * Optimasi Khusus Mode Mobile (Phone UI Optimizer)
   */
  function optimizeMobileUI(info) {
    // 1. Pastikan meta viewport fit=cover untuk notch iPhone & HP modern
    const vpMeta = document.querySelector('meta[name="viewport"]');
    if (vpMeta) {
      let content = vpMeta.getAttribute('content') || '';
      if (!content.includes('viewport-fit')) {
        vpMeta.setAttribute('content', `${content}, viewport-fit=cover`);
      }
    }

    // 2. Mencegah auto-zoom Safari/iOS dengan memastikan input minimal 16px di HP
    if (info.isMobile) {
      const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
      inputs.forEach(el => {
        const computed = window.getComputedStyle(el).fontSize;
        if (parseFloat(computed) < 16) {
          el.style.fontSize = '16px';
        }
      });
    }

    // 3. Sensor Banner Slider Swipe Touch Gesture (Khusus Layar HP)
    initBannerTouchSwipe();

    // 4. Sensor Anti-Collision Chatbot (Pindahkan dari tombol utama di HP)
    repositionMobileChatbot(info);

    // 5. Wrap tabel yang belum responsive
    wrapUnresponsiveTables();
  }

  /**
   * Touch Gesture Swipe untuk Banner Slider di HP
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

      // Pastikan gerakan horizontal lebih dominan daripada vertikal (bukan scrolling)
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          // Geser ke kiri -> Slide selanjutnya
          const nextBtn = document.getElementById('promoNextBtn');
          if (nextBtn) nextBtn.click();
        } else {
          // Geser ke kanan -> Slide sebelumnya
          const prevBtn = document.getElementById('promoPrevBtn');
          if (prevBtn) prevBtn.click();
        }
      }
    }

    bannerCard._hasSwipeListener = true;
  }

  /**
   * Reposisi Chatbot Cerdas di HP agar Tidak Menutupi Tombol
   */
  function repositionMobileChatbot(info) {
    const chatbot = document.querySelector('.chatbot-container');
    if (!chatbot) return;

    if (info.isMobile) {
      // Di layar HP: Posisikan di kanan bawah secara ergonomis, tidak menutupi tombol sebelah kiri
      chatbot.classList.add('mobile-docked');
      chatbot.style.left = 'auto';
      chatbot.style.right = '16px';
      chatbot.style.bottom = '20px';
    } else {
      chatbot.classList.remove('mobile-docked');
      chatbot.style.left = '24px';
      chatbot.style.right = 'auto';
      chatbot.style.bottom = '24px';
    }
  }

  /**
   * Bungkus Tabel agar Memiliki Horizontal Scroll yang Rapi di HP
   */
  function wrapUnresponsiveTables() {
    const tables = document.querySelectorAll('table:not(.wrapped-mobile)');
    tables.forEach(table => {
      // Jika parent-nya belum memiliki overflow-x
      const parent = table.parentElement;
      if (parent && !parent.classList.contains('table-responsive') && !parent.classList.contains('kasir-table-wrapper') && !parent.classList.contains('admin-table-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-table-scroll-wrap';
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        table.classList.add('wrapped-mobile');
      }
    });
  }

  // Inisialisasi Sensor Seketika
  let currentInfo = detectScreenInfo();
  applyScreenSensor(currentInfo);

  // Jalankan lagi saat DOM siap
  function onDOMLoaded() {
    currentInfo = detectScreenInfo();
    applyScreenSensor(currentInfo);
    optimizeMobileUI(currentInfo);

    // Sensor monitor dropdown navigasi
    const menuToggle = document.getElementById('menuToggleBtn') || document.getElementById('adminMenuToggleBtn');
    const dropdownMenu = document.getElementById('navDropdownMenu') || document.getElementById('adminNavDropdownMenu');
    const backdrop = document.getElementById('navBackdrop') || document.getElementById('adminNavBackdrop');

    if (dropdownMenu) {
      const observer = new MutationObserver(() => {
        const isOpen = dropdownMenu.classList.contains('show');
        if (isOpen) {
          document.body.classList.add('nav-menu-open');
        } else {
          document.body.classList.remove('nav-menu-open');
        }
      });
      observer.observe(dropdownMenu, { attributes: true, attributeFilter: ['class'] });
    }

    // Log sensor aktif di console
    console.log(
      `%c[Ngalam Fix Pro Sensor Layar]%c Mode Aktif: %c${currentInfo.mode.toUpperCase()}%c (${currentInfo.width}x${currentInfo.height}px, ${currentInfo.orientation}) • Tampilan ${currentInfo.isMobile ? 'HP Siap & Rapi' : 'Komputer Aktif'}`,
      'background:#b45309;color:#fff;font-weight:bold;padding:2px 8px;border-radius:4px;',
      'color:#64748b;',
      'color:#0284c7;font-weight:bold;',
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
      const prevOrient = currentInfo.orientation;
      currentInfo = detectScreenInfo();
      applyScreenSensor(currentInfo);

      if (prevMode !== currentInfo.mode || prevOrient !== currentInfo.orientation) {
        optimizeMobileUI(currentInfo);

        // Dispatch Custom Event agar modul lain dapat merespons perubahan mode layar
        window.dispatchEvent(new CustomEvent('ngalam:screen-mode', {
          detail: currentInfo
        }));
      }
    });
  }

  window.addEventListener('resize', handleScreenResize, { passive: true });
  window.addEventListener('orientationchange', handleScreenResize, { passive: true });

  // Expose Global Sensor API
  window.NgalamSensor = {
    isMobile: () => currentInfo.isMobile,
    isDesktop: () => currentInfo.isDesktop,
    isTablet: () => currentInfo.isTablet,
    getMode: () => currentInfo.mode,
    getWidth: () => currentInfo.width,
    getHeight: () => currentInfo.height,
    getOrientation: () => currentInfo.orientation,
    getInfo: () => Object.assign({}, currentInfo),
    refresh: () => {
      currentInfo = detectScreenInfo();
      applyScreenSensor(currentInfo);
      optimizeMobileUI(currentInfo);
      return currentInfo;
    }
  };

})();
