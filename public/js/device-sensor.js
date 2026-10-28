/**
 * ============================================================================
 * 📱 NGALAM FIX PRO - ADVANCED SCREEN & DEVICE SENSOR (ANTI-LAG & MOBILE OPTIMIZER)
 * ============================================================================
 * Sensor Cerdas & Pendeteksi Perangkat Real-Time:
 * 1. Mendeteksi apakah user membuka website menggunakan HP (Smartphone), Tablet, atau Laptop/Komputer.
 * 2. Mengaktifkan 'Mobile Lite Performance Mode' secara otomatis agar HP tidak terasa berat/lemot.
 * 3. Menghindari layout berantakan, teks tumpang tindih, dan memposisikan tombol melayang (chatbot)
 *    ke sudut yang ergonomis (bottom-right) agar tidak menutupi isi konten & judul penting.
 * 4. Menyediakan API Global: window.NgalamSensor
 * ============================================================================
 */

(function () {
  'use strict';

  // Breakpoints Standar Internasional
  const BREAKPOINTS = {
    MOBILE_MAX: 768,
    TABLET_MAX: 1024
  };

  /**
   * Evaluasi Tipe Perangkat Berdasarkan Dimensi Layar & User Agent
   */
  function detectDeviceType() {
    const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

    let type = 'desktop';
    if (width <= BREAKPOINTS.MOBILE_MAX || (isMobileUA && width < 900)) {
      type = 'mobile';
    } else if (width <= BREAKPOINTS.TABLET_MAX || (hasTouch && width <= 1024)) {
      type = 'tablet';
    }

    const orientation = (window.innerHeight > window.innerWidth) ? 'portrait' : 'landscape';
    const dpr = window.devicePixelRatio || 1;

    // Sensor Kemampuan Hardware & Kapasitas Memori (Mendeteksi apakah perlu mode hemat beban)
    let isLowTierHardware = false;
    if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4) {
      isLowTierHardware = true;
    }
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) {
      isLowTierHardware = true;
    }

    return {
      type: type, // 'mobile' | 'tablet' | 'desktop'
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      isTouch: hasTouch,
      orientation: orientation,
      width: width,
      height: window.innerHeight || document.documentElement.clientHeight,
      dpr: dpr,
      isLowTierHardware: isLowTierHardware,
      // HP otomatis menggunakan mode performa ringan agar tidak panas & baterai awet
      enableLitePerf: type === 'mobile' || isLowTierHardware
    };
  }

  /**
   * Terapkan Kelas CSS Dinamis ke Tag <html> dan <body>
   */
  function applyDeviceClasses(info) {
    const docEl = document.documentElement;
    const body = document.body;

    // Bersihkan kelas perangkat sebelumnya
    const classesToRemove = [
      'is-mobile', 'is-tablet', 'is-desktop',
      'device-touch', 'device-mouse',
      'screen-portrait', 'screen-landscape',
      'mobile-lite-perf', 'high-perf-mode'
    ];

    classesToRemove.forEach(cls => {
      docEl.classList.remove(cls);
      if (body) body.classList.remove(cls);
    });

    // Tambahkan kelas perangkat terkini
    const newClasses = [
      `is-${info.type}`,
      info.isTouch ? 'device-touch' : 'device-mouse',
      `screen-${info.orientation}`,
      info.enableLitePerf ? 'mobile-lite-perf' : 'high-perf-mode'
    ];

    newClasses.forEach(cls => {
      docEl.classList.add(cls);
      if (body) body.classList.add(cls);
    });

    // Pasang atribut data untuk query CSS presisi
    docEl.setAttribute('data-device', info.type);
    docEl.setAttribute('data-orientation', info.orientation);
    docEl.setAttribute('data-touch', info.isTouch ? 'true' : 'false');
    docEl.setAttribute('data-perf', info.enableLitePerf ? 'lite' : 'full');
  }

  // State sensor aktif
  let currentInfo = detectDeviceType();
  applyDeviceClasses(currentInfo);

  // Jalankan lagi saat DOM siap agar body juga terpasangi kelas
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      currentInfo = detectDeviceType();
      applyDeviceClasses(currentInfo);
      initMobileUiOptimizer();
    });
  } else {
    initMobileUiOptimizer();
  }

  /**
   * Optimasi Khusus UI HP Real-Time
   */
  function initMobileUiOptimizer() {
    if (!currentInfo.isMobile) return;

    // 1. Pastikan input pada HP tidak memicu auto-zoom Safari/iOS (font minimal 16px)
    const inputs = document.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
    inputs.forEach(el => {
      const computedFont = window.getComputedStyle(el).fontSize;
      if (parseFloat(computedFont) < 16) {
        el.style.fontSize = '16px';
      }
    });

    // 2. Cegah jitter / scroll lag pada scrolling horizontal
    document.documentElement.style.overflowX = 'hidden';
    if (document.body) document.body.style.overflowX = 'hidden';

    // 3. Log sensor status di console
    console.log(
      `%c[Ngalam Fix Pro Sensor]%c Perangkat Terdeteksi: %c${currentInfo.type.toUpperCase()}%c (Layar: ${currentInfo.width}x${currentInfo.height}px) • %cMode Ringan HP Aktif`,
      'background:#0284c7;color:#fff;font-weight:bold;padding:2px 6px;border-radius:4px;',
      'color:#64748b;font-weight:normal;',
      'color:#0284c7;font-weight:bold;',
      'color:#64748b;',
      'color:#10b981;font-weight:bold;'
    );
  }

  // Listener resize & orientationchange dengan debouncing hemat CPU
  let resizeTimeout = null;
  function handleResize() {
    if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
    resizeTimeout = requestAnimationFrame(() => {
      const prevType = currentInfo.type;
      const prevOrientation = currentInfo.orientation;
      currentInfo = detectDeviceType();
      applyDeviceClasses(currentInfo);

      if (prevType !== currentInfo.type || prevOrientation !== currentInfo.orientation) {
        initMobileUiOptimizer();
        // Dispatch event kustom jika ada modul UI lain yang ingin bereaksi
        window.dispatchEvent(new CustomEvent('ngalam:device-changed', {
          detail: currentInfo
        }));
      }
    });
  }

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });

  /**
   * Expose API Publik Sensor ke Window
   */
  window.NgalamSensor = {
    isMobile: () => currentInfo.isMobile,
    isTablet: () => currentInfo.isTablet,
    isDesktop: () => currentInfo.isDesktop,
    isTouch: () => currentInfo.isTouch,
    isPortrait: () => currentInfo.orientation === 'portrait',
    getOrientation: () => currentInfo.orientation,
    getDeviceType: () => currentInfo.type,
    getScreenWidth: () => currentInfo.width,
    getScreenHeight: () => currentInfo.height,
    getDpr: () => currentInfo.dpr,
    isLitePerfActive: () => currentInfo.enableLitePerf,
    getDeviceInfo: () => Object.assign({}, currentInfo),
    refresh: () => {
      currentInfo = detectDeviceType();
      applyDeviceClasses(currentInfo);
      initMobileUiOptimizer();
      return currentInfo;
    }
  };

})();
