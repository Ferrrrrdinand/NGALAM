import banner1 from '../assets/images/spesialis-hp-banner.jpg';
import banner2 from '../assets/images/promo-banner-1.jpg';
import banner3 from '../assets/images/promo-banner-tempered-glass.jpg';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, ShieldCheck, Smartphone, RefreshCw, Battery, 
  Gem, Cable, Camera, PowerOff, Microscope, PenTool, 
  X, Copy, CheckCircle2, Sparkles, Star, Gift, Flame, Rocket, Search, Check, ChevronDown
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import HomeAdBanner from '../components/HomeAdBanner';
import LandingModal from '../components/LandingModal';

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showLandingModal, setShowLandingModal] = useState(false);

  // Estimator State
  const [selectedBrand, setSelectedBrand] = useState('apple');
  const [selectedModel, setSelectedModel] = useState('iPhone 16 Pro / 16 Pro Max');
  const [selectedDamage, setSelectedDamage] = useState('lcd');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const modelDropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target)) {
        setModelDropdownOpen(false);
      }
    };
    if (modelDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [modelDropdownOpen]);

  // Promo Modal state
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  // Testimonial Modal state
  const [testiModalOpen, setTestiModalOpen] = useState(false);
  const [testiTicket, setTestiTicket] = useState('');
  const [testiName, setTestiName] = useState('');
  const [testiDevice, setTestiDevice] = useState('');
  const [testiRating, setTestiRating] = useState(5);
  const [testiText, setTestiText] = useState('');
  const [testiSuccess, setTestiSuccess] = useState(false);

  // Landing Modal trigger
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('ngalam_modal_seen');
    const hasCustomerSession = localStorage.getItem('ngalam_customer_token');
    const hasMitraSession = localStorage.getItem('ngalam_mitra_token');
    const hasAdminSession = localStorage.getItem('ngalam_token');
    
    if (!hasSeenModal && !hasCustomerSession && !hasMitraSession && !hasAdminSession) {
      const timer = setTimeout(() => {
        setShowLandingModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLandingModalClose = () => {
    setShowLandingModal(false);
    localStorage.setItem('ngalam_modal_seen', 'true');
  };

  // Welcome Promo trigger (coordinated with preloader.js)
  useEffect(() => {
    if (document.getElementById('ngalamInitialPreloader') || document.getElementById('ngalamWelcomePromoOverlay')) {
      return;
    }
    try {
      const dismissed = sessionStorage.getItem('ngalam_welcome_promo_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          if (!document.getElementById('ngalamWelcomePromoOverlay')) {
            window.triggerWelcomePromoOffer?.();
          }
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  const modelsByBrand = {
    apple: [
      'iPhone 16 Pro / 16 Pro Max',
      'iPhone 16 / 16 Plus',
      'iPhone 15 Pro / 15 Pro Max',
      'iPhone 15 / 15 Plus',
      'iPhone 14 Pro / 14 Pro Max',
      'iPhone 14 / 14 Plus',
      'iPhone 13 Pro / 13 Pro Max',
      'iPhone 13 / 13 Mini',
      'iPhone 12 / 12 Pro / 12 Pro Max',
      'iPhone 11 / 11 Pro / 11 Pro Max',
      'iPhone X / XS / XR'
    ],
    samsung: [
      'Samsung Galaxy S24 Ultra / S24+',
      'Samsung Galaxy S23 Ultra / S23',
      'Samsung Galaxy Z Fold 5 / Z Flip 5',
      'Samsung Galaxy Z Fold 4 / Z Flip 4',
      'Samsung Galaxy A55 / A54 5G',
      'Samsung Galaxy Note 20 Ultra'
    ],
    xiaomi: [
      'Xiaomi 14 / 14 Ultra',
      'Xiaomi 13T / 13T Pro',
      'Redmi Note 13 Pro+ / 13 Pro',
      'Redmi Note 12 Pro / 12',
      'Xiaomi 12 / 12 Pro'
    ],
    poco: [
      'POCO F6 / F6 Pro',
      'POCO X6 Pro 5G / X6',
      'POCO F5 / F5 Pro',
      'POCO X5 Pro / X5',
      'POCO M6 Pro'
    ],
    oppo: [
      'OPPO Find X7 Ultra / Find N3',
      'OPPO Reno 11 Pro / 11 5G',
      'OPPO Reno 10 Pro+ / 10',
      'OPPO A79 / A78 5G'
    ],
    vivo: [
      'Vivo X100 Pro / X100',
      'Vivo V30 Pro / V30',
      'Vivo V29 / V29e',
      'Vivo Y100 5G / Y27'
    ],
    realme: [
      'Realme 12 Pro+ 5G / 12+',
      'Realme 11 Pro+ / 11',
      'Realme GT Neo 5 / GT 3',
      'Realme C67 / C55'
    ],
    infinix: [
      'Infinix GT 20 Pro / GT 10 Pro',
      'Infinix Note 40 Pro / 40',
      'Infinix Zero 30 5G',
      'Infinix Hot 40 Pro'
    ],
    iqoo: [
      'iQOO 12 / 12 Pro',
      'iQOO Neo 9 Pro',
      'iQOO Z9 / Z9x',
      'iQOO 11'
    ],
    tecno_itel: [
      'Tecno Camon 30 Pro / 30',
      'Tecno Pova 6 Pro 5G',
      'itel S23+ / P55 5G'
    ],
    asus: [
      'ROG Phone 8 / 8 Pro',
      'ROG Phone 7 / 7 Ultimate',
      'Zenfone 10 / 9'
    ],
    others: [
      'Google Pixel 8 Pro / 8',
      'Google Pixel 7 Pro / 7',
      'Huawei P60 Pro / Mate 50'
    ]
  };

  const currentModels = modelsByBrand[selectedBrand] || modelsByBrand.apple;
  const filteredModels = currentModels.filter((m) =>
    m.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const repairMatrix: Record<string, { title: string; price: string; time: string; warranty: string; warrantyNote: string }> = {
    garis_lightsaber: {
      title: 'Menghilangkan Garis Layar (Light Saber OLED)',
      price: 'Rp 250.000 - Rp 650.000',
      time: '1 - 2 Jam',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Resmi Panel Layar (1 Bulan)'
    },
    flex_fold: {
      title: 'Pergantian Fleksibel Z Flip & Z Fold',
      price: 'Rp 650.000 - Rp 1.650.000',
      time: '2 - 4 Jam',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Resmi Fleksibel Engsel (1 Bulan)'
    },
    baterai: {
      title: 'Pergantian Baterai Original',
      price: 'Rp 180.000 - Rp 550.000',
      time: '30 - 45 Menit',
      warranty: 'Garansi 90 Hari',
      warrantyNote: 'Garansi Spesial Baterai Original (3 Bulan Penuh)'
    },
    software_virus: {
      title: 'Software & Menghilangkan Virus HP',
      price: 'Rp 75.000 - Rp 250.000',
      time: '30 - 60 Menit',
      warranty: 'Garansi 7 Hari',
      warrantyNote: 'Garansi Sistem & Software (1 Minggu)'
    },
    lcd: {
      title: 'Ganti Layar / LCD / OLED Pecah',
      price: 'Rp 350.000 - Rp 1.850.000',
      time: '30 - 60 Menit',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Layar & Sentuhan (1 Bulan)'
    },
    kaca: {
      title: 'Ganti Kaca Saja (Glass OCA Laminating)',
      price: 'Rp 180.000 - Rp 750.000',
      time: '2 - 3 Jam',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Laminating OCA (1 Bulan)'
    },
    charging: {
      title: 'Port Cas / Konektor Charger Rusak',
      price: 'Rp 120.000 - Rp 350.000',
      time: '30 - 45 Menit',
      warranty: 'Garansi 14 Hari',
      warrantyNote: 'Garansi Port Konektor Cas (2 Minggu)'
    },
    kamera: {
      title: 'Kamera Getar (OIS) / Kaca Kamera Pecah',
      price: 'Rp 200.000 - Rp 850.000',
      time: '45 - 60 Menit',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi Modul Lensa Kamera (1 Bulan)'
    },
    mati_total: {
      title: 'Mesin Mati Total / Kena Air',
      price: 'Rp 250.000 - Rp 950.000',
      time: '1 - 2 Hari',
      warranty: 'Garansi 30 Hari',
      warrantyNote: 'Garansi IC & Jalur Motherboard (1 Bulan)'
    }
  };

  const currentDamageInfo = repairMatrix[selectedDamage] || repairMatrix.lcd;

  const defaultSlides = [
    {
      img: banner1, fallbackImg: '/images/spesialis-hp-banner.jpg',
      alt: 'Workshop Spesialis Servis HP - Ngalam Fix Pro',
      badge: 'WORKSHOP MEJA TERBUKA',
      pill: 'BISA DITUNGGU (30–60 MENIT)',
      pillBg: 'linear-gradient(135deg, #10b981, #059669)',
      hint: 'Klik Banner untuk Menonton Video Workshop',
      cta: 'Tonton Video ↗',
      title: 'Peralatan Presisi Micro-Soldering, Thermal Camera & Mesin OCA',
      desc: 'Pengerjaan profesional smartphone Android & iPhone bisa ditonton langsung di depan meja teknisi tanpa ditinggal.',
      code: 'MEJA-TERBUKA',
      link: 'https://youtu.be/M8S2tZtneF0?si=iAEvkmVSLLc7XWu4'
    },
    {
      img: banner2, fallbackImg: '/images/promo-banner-1.jpg',
      alt: 'Tawaran Member VIP Diskon 10% - Ngalam Fix Pro',
      badge: 'TAWARAN MEMBER VIP',
      pill: 'DISKON 10% MEMBER BARU',
      pillBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      hint: 'Klik Banner untuk Daftar Member & Klaim 10%',
      cta: 'Daftar Member ↗',
      title: 'Gabung Member VIP Ngalam Fix Pro: Potongan Diskon 10% Servis HP',
      desc: 'Daftar akun gratis sekarang & nikmati potongan otomatis 10% untuk seluruh perbaikan smartphone, cek riwayat servis, klaim garansi resmi online, dan antrean prioritas Meja 1.',
      code: 'MEMBER10',
      link: '/akun-pelanggan?tab=register&promo=MEMBER10'
    },
    {
      img: banner2, fallbackImg: '/images/promo-banner-1.jpg',
      alt: 'Promo Spesial Servis HP Android & iPhone - Ngalam Fix Pro',
      badge: 'PROMO SPESIAL BULAN INI',
      pill: 'DISKON S/D 30%',
      pillBg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      hint: 'Klik Banner untuk Info Promo & Klaim',
      cta: 'Klaim Promo ↗',
      title: 'Diskon Servis Hingga 30% Ganti Layar OLED & Baterai Original',
      desc: 'Dapatkan gratis pembersihan mesin sinar UV, cek diagnosa awal di meja transparan, dan jaminan garansi resmi (khusus baterai 90 hari, servis lain 7–30 hari).',
      code: 'NGALAMPROMO30',
      link: '/pesan-servis?promo=NGALAMPROMO30'
    },
    {
      img: banner3, fallbackImg: '/images/promo-banner-tempered-glass.jpg',
      alt: 'Paket Bundling Ganti Layar & Tempered Glass',
      badge: 'BONUS TEMPERED GLASS 9H',
      pill: 'FLASH DEAL BULAN INI',
      pillBg: 'linear-gradient(135deg, #7c3aed, #6366f1)',
      hint: 'Klik Banner untuk Bonus Tempered Glass',
      cta: 'Klaim Promo ↗',
      title: 'Paket Komplit Ganti LCD: Gratis Pasang Tempered Glass 9H Presisi',
      desc: 'Khusus reparasi layar Super Retina XDR iPhone, Dynamic AMOLED Samsung, serta panel seri Xiaomi, Vivo, OPPO & Realme.',
      code: 'FREEGLASS9H',
      link: '/pesan-servis?promo=FREEGLASS9H'
    }
  ];

  const [slides, setSlides] = useState(defaultSlides);

  const isExternalLink = (href) => /^https?:\/\//i.test(href || '');

  const loadLivePromos = () => {
    fetchApi('/api/promos')
      .then((res) => {
        if (res.ok && res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const themes = res.data.themes || {};
          const mapped = res.data.data.map((p: any) => {
            const th = themes[p.theme] || { pillGradient: 'linear-gradient(135deg, #f59e0b, #d97706)' };
            const img = p.image?.startsWith('http') || p.image?.startsWith('data:image')
              ? p.image
              : `/${(p.image || 'images/spesialis-hp-banner.jpg').replace(/^\//, '')}`;
            return {
              img,
              fallbackImg: '/images/spesialis-hp-banner.jpg',
              alt: p.title,
              badge: p.badgeTag || 'PROMO SPESIAL',
              pill: p.badgePill || 'DISKON',
              pillBg: th.pillGradient || 'linear-gradient(135deg, #f59e0b, #d97706)',
              hint: isExternalLink(p.buttonLink) ? 'Klik Banner untuk Menonton Video' : 'Klik Banner untuk Info Promo & Klaim',
              cta: p.buttonText || 'Klaim Promo ↗',
              title: p.title,
              desc: p.description || '',
              code: p.promoCode || 'PROMO',
              link: p.buttonLink || '/pesan-servis'
            };
          });
          setSlides(mapped);
          setActiveSlide((prev) => (prev >= mapped.length ? 0 : prev));
        }
      })
      .catch(() => {});
  };

  // Real-time synchronization for banner updates
  useEffect(() => {
    loadLivePromos();

    // 1. Polling interval (jangan polling saat tab tidak aktif)
    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') loadLivePromos();
    }, 30000);

    // 2. Storage event listener for instant cross-tab sync when admin updates banners
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ngalam_banner_updated' || e.key === 'ngalam_promo_updated') {
        loadLivePromos();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Reload saat tab kembali aktif
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadLivePromos();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleBrandSelect = (brandId) => {
    setSelectedBrand(brandId);
    setModelSearchQuery('');
    const list = modelsByBrand[brandId] || [];
    if (list.length > 0) {
      setSelectedModel(list[0]);
    }
  };

  const openPromoModal = (slide) => {
    if (isExternalLink(slide?.link)) {
      window.open(slide.link, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedPromo(slide);
    setPromoModalOpen(true);
  };

  const copyPromoCode = (code) => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleTestiSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/api/testimonials', {
        method: 'POST',
        body: {
          ticketId: testiTicket,
          name: testiName,
          device: testiDevice,
          rating: testiRating,
          comment: testiText
        }
      });
      setTestiSuccess(true);
      setTimeout(() => {
        setTestiSuccess(false);
        setTestiModalOpen(false);
        setTestiTicket('');
        setTestiName('');
        setTestiDevice('');
        setTestiText('');
      }, 2500);
    } catch (_) {
      setTestiSuccess(true);
    }
  };

  return (
    <>
      {showLandingModal && <LandingModal onClose={handleLandingModalClose} referralCode={localStorage.getItem('ngalam_affiliate_ref') || ''} />}
      
      {/* HERO SECTION */}
      <section className="hero">
        {/* TOP PROMOTIONAL BANNER SLIDER (BAGIAN ATAS HERO) */}
        <div className="wrap hero-banner-wrap" id="heroBannerWrap">
          <div className="hero-banner-card">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className={`promo-slide ${activeSlide === idx ? 'active' : ''}`}
                style={{ display: activeSlide === idx ? 'block' : 'none', cursor: 'pointer' }}
                onClick={() => openPromoModal(s)}
              >
                <img 
                  src={s.img} 
                  alt={s.alt} 
                  className="promo-slide-image" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = s.fallbackImg;
                  }} 
                />
                <div className="promo-slide-overlay">
                  <div className="promo-top-row" style={{ justifyContent: 'flex-end' }}>
                    <div className="promo-discount-pill" style={{ background: s.pillBg, color: '#ffffff' }}>
                      <span style={{ color: '#ffffff', fontWeight: 800, textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)' }}>
                        {s.pill}
                      </span>
                    </div>
                  </div>
                  <div className="promo-bottom-hint-row">
                    <div className="promo-click-hint" style={{ background: 'rgba(15, 23, 42, 0.88)', border: '1.5px solid rgba(255, 255, 255, 0.3)', color: '#ffffff' }}>
                      <span className="hint-pulse" style={{ background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></span>
                      <span className="hint-text" style={{ color: '#ffffff', fontWeight: 700, textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)' }}>
                        {s.hint}
                      </span>
                      <span className="hint-cta-badge" style={{ background: '#f59e0b', color: '#0f172a', fontWeight: 800 }}>
                        {s.cta}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* SLIDER NAVIGATION ARROWS */}
            <button
              type="button"
              className="promo-nav-btn prev"
              onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label="Banner Sebelumnya"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              type="button"
              className="promo-nav-btn next"
              onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
              aria-label="Banner Selanjutnya"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* PAGINATION DOTS */}
            <div className="promo-dots">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`promo-dot ${activeSlide === i ? 'active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </div>

        {/* HERO TEXT CONTENT */}
        <div className="wrap hero-centered">
          <div>
            <h1>
              HP Rusak atau Bermasalah?<br />
              <span>Solusi Cepat, Presisi & Bergaransi.</span>
            </h1>

            <p className="lead">
              Pusat reparasi spesialis smartphone Android dan Apple iPhone terpercaya. Pengerjaan transparan bisa ditunggu, suku cadang grade original, teknisi bersertifikasi, dan jaminan garansi resmi tertulis (khusus baterai 90 hari, servis lain 7–30 hari).
            </p>

            <div className="actions">
              <Link className="btn" to="/pesan-servis">
                <span>Pesan Servis HP Sekarang</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>

              <a className="btn outline" href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20kendala%20HP%20saya" target="_blank" rel="noopener noreferrer">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span>Konsultasi WA Cepat</span>
              </a>
            </div>

            <div className="trust">
              <div className="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Gratis Diagnosa Awal</span>
              </div>
              <div className="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Garansi Baterai 90 Hari / Servis 7–30 Hari</span>
              </div>
              <div className="trust-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>Bisa Ditunggu (30–60 Menit)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-STEP TIMELINE */}
        <div className="wrap stats">
          <div className="stats-step">
            <span className="step-num">01</span>
            <div className="step-info">
              <b>Konsultasi & Cek Awal</b>
              <span>Gratis pengecekan langsung di depan Anda</span>
            </div>
          </div>
          <div className="stats-step">
            <span className="step-num">02</span>
            <div className="step-info">
              <b>Transparansi Estimasi</b>
              <span>Konfirmasi biaya sebelum pengerjaan dimulai</span>
            </div>
          </div>
          <div className="stats-step">
            <span className="step-num">03</span>
            <div className="step-info">
              <b>Pengerjaan Cepat</b>
              <span>Bisa ditunggu 30–90 menit untuk servis umum</span>
            </div>
          </div>
          <div className="stats-step">
            <span className="step-num">04</span>
            <div className="step-info">
              <b>Quality Control & Garansi</b>
              <span>Pemeriksaan 24 titik fungsi & garansi resmi tertulis</span>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC ADVERTISEMENT BANNER (TERKONEKSI DATABASE IKLAN POSTGRESQL) */}
      <HomeAdBanner />

      {/* SERVICES SHOWCASE */}
      <section className="section wrap" style={{ paddingTop: '45px' }}>
        <div className="sectionhead">
          <div>
            <div className="eyebrow blue">LAYANAN UNGGULAN HP</div>
            <h2>
              Penanganan Spesialis untuk<br />
              <span>Android & Apple iPhone Anda.</span>
            </h2>
          </div>
          <Link className="textlink" to="/layanan">
            <span>Lihat Semua Layanan HP (12+)</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <div className="services services-dual">
          {/* PILIHAN 1: APPLE iPHONE */}
          <div className="card servicecard card-iphone">
            <div className="service-card-header">
              <div className="service-cat-pill pill-apple">
                 SPESIALIS APPLE iOS
              </div>
              <div className="service-brand-icon icon-apple">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.08.64-2.73 1.4-.56.64-1.06 1.7-1.01 2.74 1.07.08 2.15-.55 2.73-1.27z"/>
                </svg>
              </div>
            </div>

            <h3 className="service-dual-title">Servis Spesialis iPhone</h3>
            <p className="service-dual-desc">
              Pusat reparasi spesialis seluruh seri Apple iPhone (iPhone 7 s/d iPhone 16 Pro Max). Dikerjakan presisi di meja transparan dengan suku cadang grade original bersertifikasi.
            </p>

            <ul className="service-dual-features">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Layar OLED Super Retina XDR</b> (TrueTone & 120Hz ProMotion Aktif Normal)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Baterai Original Grade A+</b> (Health 100%, Bebas Notifikasi Unknown Part)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Perbaikan Face ID & Kamera</b> (TrueDepth Sensor, Dot Projector, & Stabilizer OIS)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Ganti Kaca Belakang Laser</b> (Clean Backglass Machine tanpa bongkar mesin)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Logic Board Micro-Soldering</b> (Mati Total, IC Baseband, WiFi/Audio, Short Circuit)</span>
              </li>
            </ul>

            <div className="service-dual-meta">
              <div>
                <span className="meta-label">Estimasi Mulai</span>
                <span className="price">Rp 250.000</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="speed flex items-center justify-end gap-1"><Zap className="w-3.5 h-3.5 text-amber-500 inline" /> 30–60 Menit</span>
                <span className="warranty flex items-center justify-end gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" /> Garansi Baterai 90 Hari / Servis 7–30 Hari</span>
              </div>
            </div>

            <Link to="/pesan-servis?type=iphone" className="btn-dual-iphone">
              <span>Pilih Servis iPhone Sekarang</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* PILIHAN 2: ANDROID SMARTPHONE */}
          <div className="card servicecard card-android">
            <div className="service-card-header">
              <div className="service-cat-pill pill-android flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> SPESIALIS ANDROID
              </div>
              <div className="service-brand-icon icon-android">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.1 12 8.1s-3.5902.3116-5.1367.8497L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
                </svg>
              </div>
            </div>

            <h3 className="service-dual-title">Servis Spesialis HP Android</h3>
            <p className="service-dual-desc">
              Solusi komprehensif Samsung Galaxy, Xiaomi, POCO, Vivo, OPPO, Realme, Infinix, ASUS ROG, dll. Peralatan thermal camera, mesin laminasi OCA, & unbrick firmware.
            </p>

            <ul className="service-dual-features">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Layar Dynamic AMOLED / Super AMOLED</b> (120Hz Smooth & In-Display Fingerprint)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Ganti Kaca Saja (Glass OCA Vacuum)</b> (Hemat hingga 50% tanpa ganti panel LCD asli)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Port Charging & IC Charger</b> (Support Fast / Turbo / SuperVOOC Flash Charging)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Baterai Original High Capacity</b> (Anti drop, sel baterai stabil, garansi aman)</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><b>Mesin Mati Total & CPU Reballing</b> (Deteksi Jalur Short Circuit & Flash ROM Unbrick)</span>
              </li>
            </ul>

            <div className="service-dual-meta">
              <div>
                <span className="meta-label">Estimasi Mulai</span>
                <span className="price">Rp 150.000</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="speed flex items-center justify-end gap-1"><Zap className="w-3.5 h-3.5 text-amber-500 inline" /> 30–60 Menit</span>
                <span className="warranty flex items-center justify-end gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" /> Garansi Baterai 90 Hari / Servis 7–30 Hari</span>
              </div>
            </div>

            <Link to="/pesan-servis?type=android" className="btn-dual-android">
              <span>Pilih Servis Android Sekarang</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* KALKULATOR ESTIMASI BIAYA SERVIS ASLI */}
      <section className="section wrap" style={{ paddingTop: '20px' }}>
        <div className="estimator-section-wrap">
          <div className="estimator-section-head">
            <div className="eyebrow blue" style={{ justifyContent: 'center', display: 'inline-flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>SIMULASI BIAYA & DURASI SERVIS</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#000000', margin: '10px 0 8px', textAlign: 'center' }}>
              Kalkulator Estimasi Biaya Servis HP
            </h2>
            <p style={{ color: '#000000', fontSize: '1rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
              Pilih merek, model smartphone, dan kendala kerusakan untuk mengetahui estimasi transparan sebelum datang ke workshop.
            </p>
          </div>

          <div className="est-modern-card">
            <div className="est-glow-blob"></div>
            <div className="est-grid-layout">
              {/* LEFT COLUMN */}
              <div className="est-controls-col">
                {/* 1. MEREK SMARTPHONE TABS */}
                <div className="est-field-group">
                  <label className="est-field-label">
                    <span className="est-step-num">1</span>
                    <span>Pilih Merek Smartphone</span>
                  </label>
                  
                  <div className="est-brand-tabs" id="estBrandTabs">
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'apple' ? 'active' : ''}`} onClick={() => handleBrandSelect('apple')}>
                      <svg className="brand-svg-logo" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.08.64-2.73 1.4-.56.64-1.06 1.7-1.01 2.74 1.07.08 2.15-.55 2.73-1.27z"/></svg>
                      <span>Apple iPhone</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'samsung' ? 'active' : ''}`} onClick={() => handleBrandSelect('samsung')}>
                      <svg className="brand-svg-logo" width="22" height="15" viewBox="0 0 44 16" fill="none"><rect width="44" height="16" rx="3.5" fill="#034EA2"/><text x="22" y="11.5" fill="#FFFFFF" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="7" letterSpacing="0.6" textAnchor="middle">SAMSUNG</text></svg>
                      <span>Samsung</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'xiaomi' ? 'active' : ''}`} onClick={() => handleBrandSelect('xiaomi')}>
                      <svg className="brand-svg-logo" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6.5" fill="#FF6900"/><path d="M6 7.5h2.8v4.8c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2V7.5H14v4.8c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2V7.5H18v5.2c0 2.2-1.8 4-4 4-1.3 0-2.4-.6-3.1-1.6-.7 1-1.8 1.6-3.1 1.6-2.2 0-4-1.8-4-4V7.5z" fill="#FFFFFF"/><rect x="15.2" y="10" width="1.4" height="3.8" rx="0.4" fill="#FF6900"/></svg>
                      <span>Xiaomi / Redmi</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'poco' ? 'active' : ''}`} onClick={() => handleBrandSelect('poco')}>
                      <svg className="brand-svg-logo" width="22" height="15" viewBox="0 0 32 16" fill="none"><rect width="32" height="16" rx="3.5" fill="#FFD700"/><text x="16" y="11.5" fill="#000000" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="8" letterSpacing="0.5" textAnchor="middle">POCO</text></svg>
                      <span>POCO</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'oppo' ? 'active' : ''}`} onClick={() => handleBrandSelect('oppo')}>
                      <svg className="brand-svg-logo" width="22" height="15" viewBox="0 0 34 16" fill="none"><rect width="34" height="16" rx="3.5" fill="#00875A"/><text x="17" y="11.2" fill="#FFFFFF" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="-0.2" textAnchor="middle">oppo</text></svg>
                      <span>OPPO</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'vivo' ? 'active' : ''}`} onClick={() => handleBrandSelect('vivo')}>
                      <svg className="brand-svg-logo" width="22" height="15" viewBox="0 0 32 16" fill="none"><rect width="32" height="16" rx="3.5" fill="#0055FF"/><text x="16" y="11.2" fill="#FFFFFF" fontFamily="'Inter', Arial, sans-serif" fontWeight="800" fontSize="8" letterSpacing="0.2" textAnchor="middle">vivo</text></svg>
                      <span>Vivo</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'realme' ? 'active' : ''}`} onClick={() => handleBrandSelect('realme')}>
                      <svg className="brand-svg-logo" width="18" height="18" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#FFC915"/><path d="M7 17V7h4.8c2.2 0 3.7 1.3 3.7 3.2 0 1.5-.9 2.5-2.2 2.9L16 17h-2.8l-2.4-3.5H9.4V17H7zm2.4-5.5h2.2c1 0 1.6-.5 1.6-1.3 0-.8-.6-1.3-1.6-1.3H9.4v2.6z" fill="#000000"/></svg>
                      <span>Realme</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'infinix' ? 'active' : ''}`} onClick={() => handleBrandSelect('infinix')}>
                      <svg className="brand-svg-logo" width="22" height="15" viewBox="0 0 36 16" fill="none"><rect width="36" height="16" rx="3.5" fill="#0B1528" stroke="#15E89B" strokeWidth="1.2"/><text x="18" y="11.2" fill="#15E89B" fontFamily="'Inter', Arial, sans-serif" fontWeight="900" fontSize="6.8" letterSpacing="0.5" textAnchor="middle">infinix</text></svg>
                      <span>Infinix</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'iqoo' ? 'active' : ''}`} onClick={() => handleBrandSelect('iqoo')}>
                      <svg className="brand-svg-logo" width="22" height="15" viewBox="0 0 32 16" fill="none"><rect width="32" height="16" rx="3.5" fill="#FFCC00"/><text x="16" y="11.5" fill="#000000" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="-0.3" textAnchor="middle">iQOO</text></svg>
                      <span>iQOO</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'tecno_itel' ? 'active' : ''}`} onClick={() => handleBrandSelect('tecno_itel')}>
                      <svg className="brand-svg-logo" width="24" height="15" viewBox="0 0 36 16" fill="none"><rect width="18" height="16" rx="3.5" fill="#0066FF"/><rect x="18" width="18" height="16" rx="3.5" fill="#E60012"/><text x="9" y="11" fill="#FFFFFF" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="5.8" textAnchor="middle">TEC</text><text x="27" y="11" fill="#FFFFFF" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="5.8" textAnchor="middle">itel</text></svg>
                      <span>Tecno & itel</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'asus' ? 'active' : ''}`} onClick={() => handleBrandSelect('asus')}>
                      <svg className="brand-svg-logo" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2.5 13.5l4.8 2.2-2.1 1.7 5.5 3.6 4.3-5-3.8-1.5 5.5-2.2 4.1 4.2 2.7-1.5-3.5-3.8 4.7-1.8L12.5 1.5C9.8 1.5 7.6 2.7 6.1 4.7L2.5 13.5z" fill="#FF0033"/><path d="M12.2 8.5l-2.8 1.2 1.8.7-2.2 2.5 2.1-.8 1.1-3.6z" fill="#FFFFFF"/></svg>
                      <span>ASUS ROG</span>
                    </button>
                    <button type="button" className={`est-brand-tab ${selectedBrand === 'others' ? 'active' : ''}`} onClick={() => handleBrandSelect('others')}>
                      <svg className="brand-svg-logo" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
                      <span>Lainnya / Pixel</span>
                    </button>
                  </div>
                </div>

                {/* 2. MODEL / TIPE HP (CUSTOM LUXURY DROPDOWN) */}
                <div className="est-field-group relative" ref={modelDropdownRef}>
                  <label className="est-field-label">
                    <span className="est-step-num">2</span>
                    <span>Pilih Seri &amp; Tipe HP</span>
                  </label>

                  <div className="relative w-full">
                    {/* TRIGGER BUTTON */}
                    <button
                      type="button"
                      id="estModelTrigger"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 sm:py-3.5 rounded-xl border-2 transition-all cursor-pointer text-left bg-white shadow-xs ${
                        modelDropdownOpen 
                          ? 'border-amber-500 ring-3 ring-amber-400/20 shadow-md' 
                          : 'border-amber-300/80 hover:border-amber-500 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                        </span>
                        <div className="truncate">
                          <span className="block text-[10px] sm:text-[11px] font-bold text-amber-600/90 uppercase tracking-wider leading-none mb-0.5">
                            Model Terpilih
                          </span>
                          <span className="block text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                            {selectedModel || 'Pilih Tipe Smartphone'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 hidden sm:inline-block">
                          {currentModels.length} Tipe
                        </span>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-amber-600 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* LUXURY DROPDOWN MENU */}
                    {modelDropdownOpen && (
                      <div 
                        className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white border-2 border-amber-400/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                        style={{
                          boxShadow: '0 20px 40px -10px rgba(212, 175, 55, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.2)'
                        }}
                      >
                        {/* SEARCH INPUT IF > 5 MODELS */}
                        {currentModels.length > 5 && (
                          <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-amber-200/50">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder={`Cari seri ${selectedBrand}...`}
                                value={modelSearchQuery}
                                onChange={(e) => setModelSearchQuery(e.target.value)}
                                className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none text-slate-800 placeholder:text-slate-400"
                                autoFocus
                              />
                            </div>
                          </div>
                        )}

                        {/* LIST ITEMS */}
                        <div className="max-h-56 sm:max-h-72 overflow-y-auto divide-y divide-slate-100">
                          {filteredModels.length > 0 ? (
                            filteredModels.map((m) => {
                              const isSelected = selectedModel === m;
                              return (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(m);
                                    setModelDropdownOpen(false);
                                    setModelSearchQuery('');
                                  }}
                                  className={`w-full flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 text-left transition-colors cursor-pointer text-xs sm:text-sm ${
                                    isSelected 
                                      ? 'bg-amber-50 text-amber-950 font-black border-l-4 border-amber-500' 
                                      : 'text-slate-700 hover:bg-amber-50/50 hover:text-amber-900 font-medium'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <Smartphone className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                                    <span className="truncate">{m}</span>
                                  </div>
                                  {isSelected && (
                                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-xs text-slate-500">
                              Tidak ada tipe model yang sesuai "{modelSearchQuery}"
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. JENIS KERUSAKAN */}
                <div className="est-field-group">
                  <label className="est-field-label">
                    <span className="est-step-num">3</span>
                    <span>Pilih Kendala Kerusakan</span>
                  </label>
                  
                  <div className="est-damage-chips" id="estDamageChips">
                    {[
                      { id: 'garis_lightsaber', icon: <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" />, label: 'Hilangkan Garis (Light Saber)' },
                      { id: 'flex_fold', icon: <RefreshCw className="w-3.5 h-3.5 inline mr-1 text-sky-500" />, label: 'Flexibel Z Flip / Fold' },
                      { id: 'baterai', icon: <Battery className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />, label: 'Pergantian Baterai' },
                      { id: 'software_virus', icon: <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />, label: 'Software & Virus HP' },
                      { id: 'lcd', icon: <Smartphone className="w-3.5 h-3.5 inline mr-1 text-blue-500" />, label: 'Ganti Layar / OLED' },
                      { id: 'kaca', icon: <Gem className="w-3.5 h-3.5 inline mr-1 text-purple-500" />, label: 'Ganti Kaca OCA' },
                      { id: 'charging', icon: <Cable className="w-3.5 h-3.5 inline mr-1 text-amber-500" />, label: 'Port Cas / Charger' },
                      { id: 'kamera', icon: <Camera className="w-3.5 h-3.5 inline mr-1 text-rose-500" />, label: 'Kamera / OIS' },
                      { id: 'mati_total', icon: <PowerOff className="w-3.5 h-3.5 inline mr-1 text-red-500" />, label: 'Mati Total / Air' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`est-damage-chip ${selectedDamage === d.id ? 'active' : ''}`}
                        onClick={() => setSelectedDamage(d.id)}
                      >
                        <span className="inline-flex items-center">{d.icon}</span> {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE ESTIMATE RESULT CARD */}
              <div className="est-result-col">
                <div className="est-result-card">
                  <div>
                    <div className="est-result-top">
                      <div className="est-live-tag">
                        <span className="est-pulse-dot"></span>
                        <span>ESTIMASI LIVE & AKURAT</span>
                      </div>
                      <span className="est-ready-badge">Unit Siap Dikerjakan</span>
                    </div>

                    <div className="est-price-container">
                      <span className="est-price-label">Estimasi Biaya Part + Pasang:</span>
                      <div className="est-price-val" id="estPriceDisplay">{currentDamageInfo.price}</div>
                      <div className="est-price-sub">*Suku cadang Grade Original + Teknisi Berpengalaman</div>
                    </div>

                    <div className="est-perks-list">
                      <div className="est-perk-item">
                        <span className="est-perk-icon"><Zap className="w-4 h-4 text-amber-500" /></span>
                        <div>
                          <strong id="estTimeDisplay">{currentDamageInfo.time}</strong>
                          <small>Bisa Ditunggu di Depan Meja Transparan</small>
                        </div>
                      </div>
                      <div className="est-perk-item">
                        <span className="est-perk-icon"><ShieldCheck className="w-4 h-4 text-emerald-500" /></span>
                        <div>
                          <strong id="estWarrantyDisplay" style={{ color: selectedDamage === 'baterai' ? '#059669' : '#0f172a' }}>
                            {currentDamageInfo.warranty}
                          </strong>
                          <small>{currentDamageInfo.warrantyNote}</small>
                        </div>
                      </div>
                      <div className="est-perk-item">
                        <span className="est-perk-icon"><Microscope className="w-4 h-4 text-sky-500" /></span>
                        <div>
                          <strong>Gratis Cek Diagnosa Meja 1</strong>
                          <small>Tanpa Biaya Apapun Jika Pengerjaan Batal</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="est-actions-box">
                    <a
                      href={`https://wa.me/6281330304321?text=${encodeURIComponent(
                        `Halo Ngalam Fix Pro (Liem Hingky Liman),\nSaya ingin konsultasi servis HP:\n• Merek/Model: ${selectedModel}\n• Kendala: ${currentDamageInfo.title}\n• Estimasi: ${currentDamageInfo.price} (${currentDamageInfo.time})\n• Garansi: ${currentDamageInfo.warranty}\nApakah suku cadangnya tersedia hari ini?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-est-whatsapp"
                      id="estCtaButton"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                      <span>Chat WhatsApp Cek Stok Part ↗</span>
                    </a>
                    <Link
                      to={`/pesan-servis?type=${selectedBrand === 'apple' ? 'iphone' : 'android'}&model=${encodeURIComponent(selectedModel)}&problem=${encodeURIComponent(selectedDamage)}`}
                      className="btn-est-booking"
                      id="estBookingBtn"
                    >
                      <span>Booking Jadwal ke Workshop ↗</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="why">
        <div className="wrap whygrid">
          <div>
            <div className="eyebrow blue">MENGAPA MEMILIH NGALAM FIX PRO?</div>
            <h2>
              Spesialis Servis HP Terpercaya.<br />
              <span>Bisa Ditunggu & Garansi Pasti.</span>
            </h2>
            <p>
              Kami mengutamakan transparansi penuh: tidak ada penggantian komponen tanpa izin Anda, rekam jejak pengerjaan jelas di depan meja pelanggan, dan setiap perbaikan dilindungi garansi resmi tertulis.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link className="btn" to="/pesan-servis">
                <span>Pesan Servis Sekarang</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link className="btn outline darkoutline" to="/kontak">
                <span>Kunjungi Workshop</span>
              </Link>
            </div>
          </div>

          <div className="features">
            <article>
              <i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></i>
              <div>
                <b>Garansi Tertulis Resmi (Baterai 90 Hari, Servis Lain 7–30 Hari)</b>
                <p>Klaim garansi mudah tanpa dipersulit. Garansi spesial 90 hari untuk pergantian baterai original, serta 1 minggu s/d 1 bulan untuk servis hardware lainnya.</p>
              </div>
            </article>

            <article>
              <i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></i>
              <div>
                <b>Bisa Ditunggu (Express 30–60 Menit)</b>
                <p>Ganti baterai, perbaikan LCD/OLED, dan port charging bisa langsung selesai di tempat sambil Anda menunggu santai.</p>
              </div>
            </article>

            <article>
              <i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg></i>
              <div>
                <b>Data & Privasi Aman 100%</b>
                <p>Untuk pergantian sparepart hardware, Anda tidak perlu memberikan sandi/PIN HP Anda. Privasi foto dan chat Anda aman.</p>
              </div>
            </article>

            <article>
              <i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></i>
              <div>
                <b>Layanan Antar-Jemput (Pickup Delivery)</b>
                <p>Sibuk dengan pekerjaan? Manfaatkan kurir khusus antar-jemput HP langsung dari rumah atau kantor Anda.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="section wrap testimonials-section">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 40px' }}>
          <div className="eyebrow blue">ULASAN & KEPUASAN PELANGGAN</div>
          <h2>
            Dipercaya Lebih dari <span>2.400+ Pemilik Smartphone</span>
          </h2>
          <p style={{ color: '#000000', fontSize: '1.02rem', marginTop: '12px', lineHeight: 1.6 }}>
            Lihat pengalaman nyata dari pengguna iPhone dan HP Android yang telah mempercayakan perbaikannya kepada teknisi Ngalam Fix Pro.
          </p>
          <div style={{ marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => setTestiModalOpen(true)}
              className="btn small outline darkoutline flex items-center gap-1.5"
              style={{ borderRadius: '999px', padding: '8px 18px', fontSize: '0.82rem' }}
            >
              <PenTool className="w-3.5 h-3.5 text-amber-500" /> Tulis Testimoni Pelanggan
            </button>
          </div>
        </div>

        <div className="testimonials-grid" id="testimonialsGrid">
          <div className="testimonial-card">
            <div className="testimonial-stars flex gap-1 items-center">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="testimonial-text">"Layar iPhone tiba-tiba green screen blank setelah update iOS, sempat panik karena di tempat resmi divonis ganti whole unit jutaan. Di Ngalam Fix Pro berhasil diperbaiki jalurnya dalam 1,5 jam, TrueTone aktif normal dan data utuh. Luar biasa!"</p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">D</div>
              <div className="testimonial-info">
                <strong>Dimas Prasetyo</strong>
                <small>Pengguna Apple iPhone 14 Pro Max • 23 Okt 2026</small>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars flex gap-1 items-center">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="testimonial-text">"Port cas kendor dan kamera belakang getar OIS saat buka Instagram. Dikerjakan langsung di depan mata dalam 45 menit selesai. Fast charging 45W lancar lagi dan kamera fokus mulus. Tempat servis HP paling jujur."</p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">S</div>
              <div className="testimonial-info">
                <strong>Siti Rahmawati</strong>
                <small>Pengguna Samsung Galaxy S23 Ultra • 22 Okt 2026</small>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars flex gap-1 items-center">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="testimonial-text">"HP Xiaomi anak saya tercebur ke ember air dan mati total. Dibawa ke Ngalam Fix Pro langsung ditangani ultrasonic cleaning dan ganti IC power. Nyala normal kembali tanpa kehilangan foto-foto keluarga. Recommended!"</p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">B</div>
              <div className="testimonial-info">
                <strong>Budi Santoso</strong>
                <small>Pengguna Xiaomi 13T & iPhone 13 • 21 Okt 2026</small>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars flex gap-1 items-center">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="testimonial-text">"Ganti baterai dan servis layar selesai dalam 40 menit di depan saya, hasil sangat presisi dan ada garansi resmi. Suku cadang original dan teknisi transparan. Mantap!"</p>
            <div className="testimonial-user">
              <div className="testimonial-avatar">R</div>
              <div className="testimonial-info">
                <strong>Rian Pratama</strong>
                <small>Pengguna Samsung S22 Ultra • 23 Okt 2026</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POP UP MODAL DETAIL PROMO */}
      {promoModalOpen && selectedPromo && (
        <div className="promo-modal-overlay active" role="dialog" aria-modal="true" style={{ display: 'flex' }}>
          <div className="promo-modal-backdrop" onClick={() => setPromoModalOpen(false)}></div>
          <div className="promo-modal-card">
            <button type="button" className="promo-modal-close" onClick={() => setPromoModalOpen(false)} aria-label="Tutup">
              <X className="w-4 h-4" />
            </button>
            <div className="promo-modal-header">
              <div className="promo-modal-tags">
                <span className="promo-modal-badge">{selectedPromo.badge}</span>
                <span className="promo-modal-pill" style={{ background: selectedPromo.pillBg }}>{selectedPromo.pill}</span>
              </div>
              <h3 className="promo-modal-title">{selectedPromo.title}</h3>
            </div>
            <div className="promo-modal-body">
              <p className="promo-modal-desc">{selectedPromo.desc}</p>
              <div className="promo-modal-code-card">
                <div className="code-card-left">
                  <span className="code-label">KODE VOUCHER PROMO:</span>
                  <div className="code-display">{selectedPromo.code}</div>
                </div>
                <button type="button" className="btn-copy-code" onClick={() => copyPromoCode(selectedPromo.code)}>
                  <span className="copy-icon"><Copy className="w-4 h-4" /></span>
                  <span className="copy-text">Salin Kode</span>
                </button>
              </div>
              {copyToast && (
                <div className="copy-toast" style={{ display: 'block' }}>
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-500" /> Kode promo berhasil disalin ke clipboard!
                </div>
              )}
              <div className="promo-modal-perks">
                <div className="perk-item">
                  <span className="perk-icon"><ShieldCheck className="w-4 h-4 text-emerald-500" /></span>
                  <div>
                    <strong>Garansi Baterai 90 Hari & Servis 7-30 Hari</strong>
                    <small>Perlindungan purna jual resmi</small>
                  </div>
                </div>
                <div className="perk-item">
                  <span className="perk-icon"><Zap className="w-4 h-4 text-amber-500" /></span>
                  <div>
                    <strong>Bisa Ditunggu</strong>
                    <small>30–60 menit di meja lab terbuka</small>
                  </div>
                </div>
                <div className="perk-item">
                  <span className="perk-icon"><Gem className="w-4 h-4 text-sky-500" /></span>
                  <div>
                    <strong>Grade Original</strong>
                    <small>Suku cadang presisi terbaik</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="promo-modal-footer">
              <button type="button" className="btn-modal-cancel" onClick={() => setPromoModalOpen(false)}>Tutup</button>
              <Link to={`/pesan-servis?promo=${encodeURIComponent(selectedPromo.code)}`} className="btn-modal-claim" onClick={() => setPromoModalOpen(false)}>
                <span>Klaim Promo Servis Sekarang ↗</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TESTIMONIAL MODAL POPUP */}
      {testiModalOpen && (
        <div className="receipt-modal-backdrop" style={{ display: 'flex', zIndex: 9999 }}>
          <div className="receipt-modal-container" style={{ maxWidth: '560px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#000000', margin: 0 }} className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> Form Ulasan &amp; Testimoni Pelanggan
              </h3>
              <button type="button" onClick={() => setTestiModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#000000', cursor: 'pointer' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p style={{ color: '#000000', fontSize: '0.88rem', marginBottom: '18px' }}>
              Pengalaman Anda setelah melakukan perbaikan di Ngalam Fix Pro sangat berharga bagi kami.
            </p>

            <form onSubmit={handleTestiSubmit}>
              <div className="b-form-group">
                <label className="b-form-label">
                  <span>Nomor Tiket Servis <span className="req">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="NGF-20261023-XXXX (atau Nomor WhatsApp)"
                  value={testiTicket}
                  onChange={(e) => setTestiTicket(e.target.value)}
                  className="b-input form-control"
                />
              </div>

              <div className="form-row-2 b-form-group">
                <div>
                  <label className="b-form-label">
                    <span>Nama Lengkap <span className="req">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Anda"
                    value={testiName}
                    onChange={(e) => setTestiName(e.target.value)}
                    className="b-input form-control"
                  />
                </div>
                <div>
                  <label className="b-form-label">
                    <span>Tipe Smartphone <span className="req">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="iPhone 14 Pro / Samsung S23"
                    value={testiDevice}
                    onChange={(e) => setTestiDevice(e.target.value)}
                    className="b-input form-control"
                  />
                </div>
              </div>

              <div className="b-form-group">
                <label className="b-form-label">
                  <span>Rating Kepuasan</span>
                </label>
                <div className="interactive-star-rating flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${testiRating >= star ? 'active' : ''}`}
                        onClick={() => setTestiRating(star)}
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      >
                        <Star className={`w-6 h-6 ${testiRating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <span className="rating-label-text">{testiRating}.0 (Sangat Puas &amp; Rekomendasi)</span>
                </div>
              </div>

              <div className="b-form-group">
                <label className="b-form-label">
                  <span>Pengalaman Servis Anda <span className="req">*</span></span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan pengalaman perbaikan di Ngalam Fix Pro..."
                  value={testiText}
                  onChange={(e) => setTestiText(e.target.value)}
                  className="b-textarea form-control"
                />
              </div>

              <button type="submit" className="btn full" style={{ padding: '14px', fontWeight: 700, borderRadius: '12px', marginTop: '10px' }}>
                <span>Kirim Testimoni &amp; Tampilkan di Web ↗</span>
              </button>

              {testiSuccess && (
                <div style={{ marginTop: '14px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '14px', textAlign: 'center', color: '#059669', fontSize: '0.9rem', fontWeight: 700 }} className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Terima kasih banyak! Ulasan dan testimoni servis Anda telah berhasil disimpan.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}