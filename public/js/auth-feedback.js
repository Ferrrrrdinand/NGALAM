/**
 * NGALAM FIX PRO - Modern Auth Feedback UI Component
 * Provides rich, glassmorphic modal feedback for Login Success and Login Failure,
 * replacing default Chrome alerts and browser tooltips.
 */

(function () {
  'use strict';

  // Ensure CSS stylesheet is present in the DOM
  function ensureStylesLoaded() {
    if (document.getElementById('ngalamAuthFeedbackStyles')) return;
    
    // Check if link tag exists
    const existingLink = document.querySelector('link[href*="auth-feedback.css"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'ngalamAuthFeedbackStyles';
      link.rel = 'stylesheet';
      link.href = (window.location.pathname.includes('/admin/') || 
                   window.location.pathname.includes('/teknisi/') || 
                   window.location.pathname.includes('/login/') || 
                   window.location.pathname.includes('/mitra/')) 
        ? '../css/auth-feedback.css' 
        : 'css/auth-feedback.css';
      document.head.appendChild(link);
    }
  }

  // Get or create overlay root
  function getOverlayRoot() {
    let overlay = document.getElementById('ngalamAuthOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ngalamAuthOverlay';
      overlay.className = 'ngalam-auth-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  // Close active modal
  function closeAuthModal() {
    const overlay = document.getElementById('ngalamAuthOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.innerHTML = '';
      }, 300);
    }
  }

  /**
   * SHOW AUTH SUCCESS MODAL
   * @param {Object} options
   * @param {string} options.title - e.g. "Login Berhasil!"
   * @param {string} options.subtitle - e.g. "Selamat datang kembali di sistem!"
   * @param {Object} options.user - User details { name, role, badge, avatar }
   * @param {string} options.redirectUrl - Safe redirection destination
   * @param {number} options.duration - Duration in ms before auto redirect (default: 1350ms)
   * @param {Function} options.onComplete - Callback executed after progress finishes
   */
  function showAuthSuccessModal(options = {}) {
    ensureStylesLoaded();
    const overlay = getOverlayRoot();

    const title = options.title || 'Login Berhasil!';
    const subtitle = options.subtitle || 'Otentikasi akun berhasil diverifikasi oleh sistem.';
    const user = options.user || {};
    const name = user.name || user.username || 'Pengguna Terverifikasi';
    
    // Determine friendly role name & avatar
    let roleText = 'Akses Terverifikasi';
    let avatarIcon = '✨';

    const r = (user.role || '').toLowerCase();
    if (r === 'admin' || r === 'owner') {
      roleText = '👑 Admin Super User (Akses Penuh)';
      avatarIcon = '👑';
    } else if (r === 'kasir') {
      roleText = '👩‍💼 Kasir Meja 1 Workshop';
      avatarIcon = '👩‍💼';
    } else if (r === 'teknisi') {
      roleText = '🔬 Teknisi Meja Kerja Lab';
      avatarIcon = '🔬';
    } else if (r === 'mitra') {
      roleText = '🤝 Mitra Ekosistem Workshop';
      avatarIcon = '🤝';
    } else if (r === 'customer' || r === 'pelanggan') {
      roleText = '📱 Pelanggan Member Terdaftar';
      avatarIcon = '📱';
    }

    if (user.avatar) avatarIcon = user.avatar;
    if (user.roleText) roleText = user.roleText;

    const modalHtml = `
      <div class="ngalam-auth-modal modal-success" role="dialog" aria-modal="true" aria-labelledby="authSuccessTitle">
        <!-- Success Animated Badge -->
        <div class="auth-icon-badge-success">
          <svg class="auth-check-svg" viewBox="0 0 24 24">
            <polyline class="auth-check-path" points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h3 class="auth-modal-title" id="authSuccessTitle">${title}</h3>
        <p class="auth-modal-subtitle">${subtitle}</p>

        <!-- User Profile Card -->
        <div class="auth-user-badge-card">
          <div class="auth-user-avatar">${avatarIcon}</div>
          <div class="auth-user-meta">
            <div class="auth-user-name">${name}</div>
            <div class="auth-user-role-tag">
              <span class="auth-user-role-dot"></span>
              <span>${roleText}</span>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="auth-progress-track">
          <div class="auth-progress-fill" id="authSuccessProgressFill"></div>
        </div>

        <!-- Dynamic Status Step -->
        <div class="auth-status-step">
          <span class="auth-step-spinner"></span>
          <span id="authSuccessStepText">Memverifikasi otorisasi sesi akun...</span>
        </div>
      </div>
    `;

    overlay.innerHTML = modalHtml;
    // Trigger transition
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const fillEl = document.getElementById('authSuccessProgressFill');
    const stepTextEl = document.getElementById('authSuccessStepText');

    const totalDuration = options.duration || 1350;

    // Stage 1: 35%
    setTimeout(() => {
      if (fillEl) fillEl.style.width = '40%';
      if (stepTextEl) stepTextEl.textContent = 'Menyiapkan sesi & meja dashboard...';
    }, totalDuration * 0.25);

    // Stage 2: 80%
    setTimeout(() => {
      if (fillEl) fillEl.style.width = '85%';
      if (stepTextEl) stepTextEl.textContent = 'Sinkronisasi database workshop selesai!';
    }, totalDuration * 0.65);

    // Stage 3: 100% & Redirect
    setTimeout(() => {
      if (fillEl) fillEl.style.width = '100%';
      if (stepTextEl) stepTextEl.textContent = 'Membuka halaman kerja...';

      setTimeout(() => {
        if (typeof options.onComplete === 'function') {
          options.onComplete();
          closeAuthModal();
        } else if (options.redirectUrl) {
          window.location.replace(options.redirectUrl);
        } else {
          closeAuthModal();
        }
      }, 250);
    }, totalDuration);
  }

  /**
   * SHOW AUTH ERROR MODAL
   * @param {Object} options
   * @param {string} options.title - e.g. "Login Gagal!"
   * @param {string} options.message - Human-friendly error description
   * @param {Array<string>} options.hints - Array of helpful tips
   * @param {string} options.targetInputId - ID of input element to focus and shake on retry
   * @param {Function} options.onRetry - Callback when "Coba Lagi" is clicked
   */
  function showAuthErrorModal(options = {}) {
    ensureStylesLoaded();
    const overlay = getOverlayRoot();

    const title = options.title || 'Login Gagal!';
    const message = options.message || 'Username atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.';
    const hints = options.hints || [
      'Periksa apakah tombol <b>Caps Lock</b> sedang aktif pada keyboard Anda.',
      'Pastikan Anda tidak sengaja menyisipkan spasi di awal atau akhir kata sandi.',
      'Pastikan Anda memilih portal atau peran yang sesuai dengan akun Anda.'
    ];

    const hintsHtml = hints.map(h => `<li>${h}</li>`).join('');

    const modalHtml = `
      <div class="ngalam-auth-modal modal-error modal-shake" role="dialog" aria-modal="true" aria-labelledby="authErrorTitle">
        <button type="button" class="ngalam-auth-close-btn" id="authErrorCloseBtn" aria-label="Tutup Dialog">✕</button>

        <!-- Error Icon Badge -->
        <div class="auth-icon-badge-error">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h3 class="auth-modal-title" id="authErrorTitle">${title}</h3>
        <p class="auth-modal-subtitle">Akses akun ditolak atau data otentikasi tidak cocok.</p>

        <!-- Error Message Card -->
        <div class="auth-error-msg-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>${message}</div>
        </div>

        <!-- Tips Box -->
        <div class="auth-tips-box">
          <div class="auth-tips-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
            <span>Panduan Mengatasi Masalah:</span>
          </div>
          <ul class="auth-tips-list">
            ${hintsHtml}
          </ul>
        </div>

        <!-- Action Button -->
        <button type="button" class="auth-modal-action-btn auth-btn-retry" id="authErrorRetryBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>Coba Masuk Lagi</span>
        </button>
      </div>
    `;

    overlay.innerHTML = modalHtml;

    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    function handleDismiss() {
      closeAuthModal();
      if (options.targetInputId) {
        const inputEl = document.getElementById(options.targetInputId);
        if (inputEl) {
          inputEl.classList.add('auth-input-error-glow');
          inputEl.focus();
          if (inputEl.select) inputEl.select();
          setTimeout(() => {
            inputEl.classList.remove('auth-input-error-glow');
          }, 2500);
        }
      }
      if (typeof options.onRetry === 'function') {
        options.onRetry();
      }
    }

    const retryBtn = document.getElementById('authErrorRetryBtn');
    const closeBtn = document.getElementById('authErrorCloseBtn');
    retryBtn?.addEventListener('click', handleDismiss);
    closeBtn?.addEventListener('click', handleDismiss);

    // ESC key closes error modal
    function onKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        window.removeEventListener('keydown', onKeyDown);
        handleDismiss();
      }
    }
    window.addEventListener('keydown', onKeyDown, { once: true });
  }

  // Export globally
  window.showAuthSuccessModal = showAuthSuccessModal;
  window.showAuthErrorModal = showAuthErrorModal;
  window.closeAuthModal = closeAuthModal;
})();
