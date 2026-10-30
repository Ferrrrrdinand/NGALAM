/**
 * NGALAM FIX PRO - Layanan & Katalog Reparasi Handler
 * Manages category filtering, live keyword search, and responsive cards interaction.
 */

document.addEventListener('DOMContentLoaded', () => {
  const tabBtns = document.querySelectorAll('.cat-tab-btn');
  const cards = document.querySelectorAll('#servicesContainer .servicecard');
  const searchInput = document.getElementById('serviceSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const countBadge = document.getElementById('servicesCountNotice');
  const emptyState = document.getElementById('servicesEmptyState');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');

  let currentCategory = 'all';
  let currentKeyword = '';

  function applyFilters() {
    let visibleCount = 0;
    const query = currentKeyword.trim().toLowerCase();

    cards.forEach((card) => {
      const cat = (card.getAttribute('data-category') || '').toLowerCase();
      const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('p')?.textContent || '').toLowerCase();
      const pill = (card.querySelector('.service-cat-pill')?.textContent || '').toLowerCase();
      const meta = (card.querySelector('.service-meta')?.textContent || '').toLowerCase();

      const matchesCat = (currentCategory === 'all' || cat.includes(currentCategory));
      const matchesSearch = !query || 
        title.includes(query) || 
        desc.includes(query) || 
        cat.includes(query) || 
        pill.includes(query) || 
        meta.includes(query);

      if (matchesCat && matchesSearch) {
        card.style.display = 'flex';
        card.style.animation = 'cardFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update count display
    if (countBadge) {
      if (visibleCount === 0) {
        countBadge.textContent = 'Tidak ada layanan yang sesuai';
      } else if (visibleCount === cards.length) {
        countBadge.textContent = `Menampilkan semua ${cards.length} layanan spesialis`;
      } else {
        countBadge.textContent = `Menampilkan ${visibleCount} dari ${cards.length} layanan`;
      }
    }

    // Toggle Empty State
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Toggle Clear button visibility
    if (clearSearchBtn) {
      clearSearchBtn.style.display = query ? 'flex' : 'none';
    }
  }

  // Handle Tab Filtering
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  // Handle Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentKeyword = e.target.value;
      applyFilters();
    });
  }

  // Clear Search
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentKeyword = '';
      searchInput.focus();
      applyFilters();
    });
  }

  // Reset Filters button inside empty state
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      currentCategory = 'all';
      currentKeyword = '';
      if (searchInput) searchInput.value = '';
      tabBtns.forEach((b) => {
        if (b.getAttribute('data-filter') === 'all') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      applyFilters();
    });
  }

  // Check URL hash for auto-filtering (e.g. #iphone or #android)
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash) {
    const targetBtn = Array.from(tabBtns).find((b) => b.getAttribute('data-filter') === hash);
    if (targetBtn) {
      targetBtn.click();
    }
  }
});
