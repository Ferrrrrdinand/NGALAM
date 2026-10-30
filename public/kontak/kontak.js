/**
 * NGALAM FIX PRO - Kontak & Workshop Location Handler
 * Manages address copy to clipboard, interactive FAQ accordion, and quick WhatsApp inquiry builder.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. COPY ADDRESS WITH ANIMATED TOAST
  const copyAddressBtn = document.getElementById('copyAddressBtn');
  const toastNotification = document.getElementById('copyToastNotification');

  function showToast(message) {
    if (!toastNotification) {
      alert(message);
      return;
    }
    if (message) {
      const msgSpan = toastNotification.querySelector('span:last-child');
      if (msgSpan) msgSpan.textContent = message;
    }
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2800);
  }

  copyAddressBtn?.addEventListener('click', () => {
    const text = document.getElementById('workshopAddressText')?.textContent.trim();
    if (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast('Alamat workshop berhasil disalin ke clipboard! 📋');
        }).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    }
  });

  function fallbackCopy(text) {
    try {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      showToast('Alamat workshop berhasil disalin ke clipboard! 📋');
    } catch (_) {
      alert('Alamat: ' + text);
    }
  }

  // 2. INTERACTIVE FAQ ACCORDION
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    btn?.addEventListener('click', () => {
      const isCurrentlyActive = item.classList.contains('active');
      // Collapse others for clean single-expanded experience
      faqItems.forEach(other => other.classList.remove('active'));
      if (!isCurrentlyActive) {
        item.classList.add('active');
      }
    });
  });

  // 3. TRIGGER CHATBOT FROM CONSULTATION CARD
  const openChatbotCardBtn = document.getElementById('openChatbotCardBtn');
  openChatbotCardBtn?.addEventListener('click', () => {
    const trigger = document.getElementById('chatbotTrigger');
    trigger?.click();
  });

  // 4. QUICK WHATSAPP INQUIRY BUILDER & DYNAMIC BRAND-MODEL SYNC
  const BRAND_MODELS = {
    'Apple iPhone': [
      'iPhone 16 Pro / 16 Pro Max', 'iPhone 16 / 16 Plus',
      'iPhone 15 Pro / 15 Pro Max', 'iPhone 15 / 15 Plus',
      'iPhone 14 Pro / 14 Pro Max', 'iPhone 14 / 14 Plus',
      'iPhone 13 Pro / 13 Pro Max', 'iPhone 13 / 13 Mini',
      'iPhone 12 Pro / 12 Pro Max', 'iPhone 12 / 12 Mini',
      'iPhone 11 Pro / 11 Pro Max', 'iPhone 11',
      'iPhone XS / XS Max / XR', 'iPhone X',
      'iPhone SE (2020 / 2022)', 'iPhone 8 / 8 Plus', 'iPhone 7 / 7 Plus',
      'iPad Pro / Air / Mini Series'
    ],
    'Samsung Galaxy': [
      'Galaxy S24 Ultra / S24+ / S24',
      'Galaxy S23 Ultra / S23+ / S23 / S23 FE',
      'Galaxy S22 Ultra / S22+ / S22',
      'Galaxy Z Fold 6 / Fold 5 / Fold 4',
      'Galaxy Z Flip 6 / Flip 5 / Flip 4',
      'Galaxy A55 5G / A54 5G / A53 5G',
      'Galaxy A35 5G / A34 5G / A33 5G',
      'Galaxy A25 5G / A15 5G / A14 / A13',
      'Galaxy Note 20 Ultra / Note 10+'
    ],
    'Xiaomi / Redmi': [
      'Xiaomi 14 / 14 Ultra / 14 Pro',
      'Xiaomi 13T / 13T Pro',
      'Xiaomi 12 / 12 Pro / 12 Lite',
      'Redmi Note 13 Pro+ 5G / Note 13 Pro / Note 13',
      'Redmi Note 12 Pro / Note 12',
      'Redmi Note 11 Pro / Note 11',
      'Redmi 13 / 13C / 12 / 12C / 10C'
    ],
    'POCO': [
      'POCO F6 / F6 Pro / F5 / F5 Pro',
      'POCO X6 Pro 5G / X6 5G / X5 Pro',
      'POCO X3 Pro / X3 NFC',
      'POCO M6 Pro / M5 / M5s / M4 Pro',
      'POCO C65 / C55 / C51'
    ],
    'OPPO': [
      'Find X7 Ultra / Find X6 / Find X5 Pro',
      'Find N3 / Find N3 Flip / Find N2 Flip',
      'Reno 12 Pro / Reno 12 / Reno 12F',
      'Reno 11 Pro / Reno 11 / Reno 11F',
      'Reno 10 Pro+ / Reno 10 Pro / Reno 10',
      'OPPO A98 5G / A78 5G / A58 / A38 / A18'
    ],
    'Vivo': [
      'Vivo X100 Pro / X100 / X90 Pro / X80 Pro',
      'Vivo X Fold 3 Pro / X Flip',
      'Vivo V40 / V40 Lite / V30 Pro / V30',
      'Vivo V29 / V27 Pro / V25',
      'Vivo Y100 5G / Y28 / Y27s / Y17s'
    ],
    'Realme': [
      'Realme GT 6 / GT 5 / GT Neo 5',
      'Realme 12 Pro+ 5G / 12+ / 12 5G',
      'Realme 11 Pro+ / 11 / 10 Pro',
      'Realme C67 / C55 / C53 / C51'
    ],
    'Infinix': [
      'Infinix GT 20 Pro / GT 10 Pro',
      'Infinix ZERO 30 5G / ZERO Ultra',
      'Infinix NOTE 40 Pro / NOTE 40 / NOTE 30',
      'Infinix HOT 40 Pro / HOT 30 / Smart 8'
    ],
    'iQOO': [
      'iQOO 12 / iQOO 11',
      'iQOO Neo 9 Pro / Neo 7',
      'iQOO Z9 5G / Z9x / Z7 5G / Z7x'
    ],
    'Tecno': [
      'Tecno Camon 30 Premier / Camon 30 Pro',
      'Tecno Pova 6 Pro / Pova 5 Pro',
      'Tecno Spark 20 Pro+ / Spark 20',
      'Tecno Phantom V Fold / Phantom V Flip'
    ],
    'ASUS ROG / Zenfone': [
      'ROG Phone 8 Pro / ROG Phone 8',
      'ROG Phone 7 Ultimate / ROG 7',
      'ROG Phone 6 / ROG 6D / ROG 5',
      'Zenfone 11 Ultra / Zenfone 10 / Zenfone 9'
    ],
    'Google Pixel': [
      'Google Pixel 8 Pro / Pixel 8 / Pixel 8a',
      'Google Pixel 7 Pro / Pixel 7 / Pixel 7a',
      'Google Pixel 6 Pro / Pixel 6 / Pixel 6a',
      'Google Pixel Fold'
    ],
    'Huawei / Honor': [
      'Huawei Pura 70 Ultra / Pura 70 Pro',
      'Huawei Mate 60 Pro / Mate 50 Pro',
      'Huawei Nova 12 / Nova 11',
      'Honor Magic 6 Pro / Magic V2'
    ],
    'Sony Xperia': [
      'Sony Xperia 1 VI / 1 V / 1 IV',
      'Sony Xperia 5 V / 5 IV',
      'Sony Xperia 10 VI / 10 V'
    ],
    'itel Mobile': [
      'itel S23+ / itel S23',
      'itel P55 5G / itel P55 NFC',
      'itel A70 / itel RS4'
    ],
    'Nothing Phone': [
      'Nothing Phone (2) / Nothing Phone (2a)',
      'Nothing Phone (1)',
      'CMF Phone 1'
    ],
    'Black Shark': [
      'Black Shark 5 Pro / Black Shark 5',
      'Black Shark 4 Pro / Black Shark 4'
    ],
    'Tablet & iPad': [
      'iPad Pro M4 / M2 / M1',
      'iPad Air M2 / Gen 5',
      'iPad Mini 6 / iPad Gen 10',
      'Samsung Galaxy Tab S9 / S8',
      'Xiaomi Pad 6 / Pad 5'
    ],
  };

  const quickBrandSelect = document.getElementById('quickBrandSelect');
  const chipButtons = document.querySelectorAll('.quick-brand-chip-btn');
  const datalist = document.getElementById('quickModelDatalist');
  const modelInput = document.getElementById('quickModelInput');

  function updateModelSuggestions(brand) {
    if (!datalist || !modelInput) return;
    datalist.innerHTML = '';
    const models = BRAND_MODELS[brand] || [];
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      datalist.appendChild(opt);
    });

    if (models.length > 0) {
      modelInput.placeholder = `Contoh: ${models[0]} atau ketik tipe lain`;
    } else {
      modelInput.placeholder = 'Ketik tipe / seri smartphone Anda...';
    }
  }

  function syncBrandSelection(brandName) {
    if (quickBrandSelect) {
      quickBrandSelect.value = brandName;
    }
    chipButtons.forEach(btn => {
      if (btn.getAttribute('data-brand') === brandName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    updateModelSuggestions(brandName);
  }

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.getAttribute('data-brand');
      if (brand) syncBrandSelection(brand);
    });
  });

  quickBrandSelect?.addEventListener('change', (e) => {
    syncBrandSelection(e.target.value);
  });

  // Initial load sync
  if (quickBrandSelect) {
    updateModelSuggestions(quickBrandSelect.value || 'Apple iPhone');
  }

  const quickWaForm = document.getElementById('quickWaForm');
  quickWaForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const brand = document.getElementById('quickBrandSelect')?.value || 'Smartphone';
    const model = document.getElementById('quickModelInput')?.value.trim() || 'Unit HP';
    const issue = document.getElementById('quickIssueInput')?.value.trim() || 'Kendala Servis';

    const message = `Halo Ngalam Fix Pro, saya ingin konsultasi servis smartphone:\n\n` +
      `📱 Merek: ${brand}\n` +
      `🔍 Model/Seri: ${model}\n` +
      `⚠️ Kendala/Keluhan: ${issue}\n\n` +
      `Mohon info estimasi biaya dan ketersediaan sparepart. Terima kasih! 🙏`;

    const waUrl = `https://wa.me/6281330304321?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  });
});
