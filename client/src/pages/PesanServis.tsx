import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Check, Zap, ShieldCheck, Lock, UserCheck, Sparkles, 
  Bike, AlertCircle, Smartphone, Battery, Gem, Camera, 
  PowerOff, CheckCircle2, ChevronDown, Search
} from 'lucide-react';
import { fetchApi, formatRp } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/images/logo-ngalam-fix-pro.jpg';
import { LCD_MODELS_BY_BRAND } from '../data/lcdPrices';

export default function PesanServis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customer } = useAuth();

  const [formData, setFormData] = useState({
    customerName: '',
    whatsapp: '',
    email: '',
    district: '',
    brand: searchParams.get('brand') || 'apple',
    phoneType: searchParams.get('model') || '',
    serviceMethod: 'antar_sendiri',
    complaint: '',
    promoCode: searchParams.get('promo') || ''
  });

  const [selectedProblems, setSelectedProblems] = useState(new Set());
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [availablePromoCodes, setAvailablePromoCodes] = useState([]);
  const [referralMitra, setReferralMitra] = useState<any>(null);
  const [referralInput, setReferralInput] = useState(() => {
    return (searchParams.get('ref') || searchParams.get('referral') || localStorage.getItem('ngalam_affiliate_ref') || '').trim().toUpperCase();
  });
  const [referralStatus, setReferralStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(e.target as Node)) {
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

  const brandsList = [
    {
      id: 'apple',
      name: 'Apple iPhone',
      icon: <img src="/images/brands/apple.svg" alt="Apple" className="brand-svg-logo w-4 h-4 object-contain inline-block" />
    },
    {
      id: 'samsung',
      name: 'Samsung',
      icon: <img src="/images/brands/samsung.svg" alt="Samsung" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'xiaomi',
      name: 'Xiaomi / Redmi',
      icon: <img src="/images/brands/xiaomi.svg" alt="Xiaomi" className="brand-svg-logo w-4 h-4 object-contain inline-block" />
    },
    {
      id: 'poco',
      name: 'POCO',
      icon: <img src="/images/brands/poco.svg" alt="POCO" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'oppo',
      name: 'OPPO',
      icon: <img src="/images/brands/oppo.svg" alt="OPPO" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'vivo',
      name: 'Vivo',
      icon: <img src="/images/brands/vivo.svg" alt="Vivo" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'realme',
      name: 'Realme',
      icon: <img src="/images/brands/realme.svg" alt="Realme" className="brand-svg-logo w-4 h-4 object-contain inline-block" />
    },
    {
      id: 'infinix',
      name: 'Infinix',
      icon: <img src="/images/brands/infinix.svg" alt="Infinix" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'iqoo',
      name: 'iQOO',
      icon: <img src="/images/brands/iqoo.svg" alt="iQOO" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'tecno_itel',
      name: 'Tecno & itel',
      icon: <img src="/images/brands/tecno_itel.svg" alt="Tecno itel" className="brand-svg-logo h-3.5 object-contain inline-block" />
    },
    {
      id: 'asus',
      name: 'ASUS ROG',
      icon: <img src="/images/brands/asus.svg" alt="ASUS" className="brand-svg-logo w-4 h-4 object-contain inline-block" />
    },
    {
      id: 'others',
      name: 'Merek Lainnya',
      icon: <img src="/images/brands/google.svg" alt="Pixel / Lainnya" className="brand-svg-logo w-4 h-4 object-contain inline-block" />
    }
  ];

  const modelsByBrand: Record<string, string[]> = LCD_MODELS_BY_BRAND;

  const currentModels = modelsByBrand[formData.brand] || modelsByBrand.apple || [];
  const filteredModels = currentModels.filter((m: string) =>
    m.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  const selectedPhoneModel = formData.phoneType || currentModels[0] || '';

  useEffect(() => {
    const loadPromos = () => {
      fetchApi('/api/promo-codes').then(({ ok, data }) => {
        if (ok && data && data.success && Array.isArray(data.data)) {
          setAvailablePromoCodes(data.data);
        }
      }).catch(() => {});
    };

    loadPromos();

    // Realtime storage listener for promo updates from admin console
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ngalam_promo_updated') {
        loadPromos();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', loadPromos);

    const scannedRef = (searchParams.get('ref') || searchParams.get('referral') || localStorage.getItem('ngalam_affiliate_ref') || sessionStorage.getItem('ngalam_affiliate_ref') || '').trim().toUpperCase();
    if (scannedRef) {
      setReferralInput(scannedRef);
      localStorage.setItem('ngalam_affiliate_ref', scannedRef);

      // Cek apakah data mitra sudah ada di cache lokal agar instan
      try {
        const cached = localStorage.getItem('ngalam_affiliate_mitra');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.referralCode === scannedRef || parsed.code === scannedRef)) {
            setReferralMitra(parsed);
            setReferralStatus('valid');
          }
        }
      } catch (_) {}

      // Verifikasi ke server untuk data terbaru
      fetchApi(`/api/mitra/ref/${encodeURIComponent(scannedRef)}`).then(({ ok, data }) => {
        if (ok && data && data.success && data.mitra) {
          setReferralMitra(data.mitra);
          setReferralStatus('valid');
          localStorage.setItem('ngalam_affiliate_ref', scannedRef);
          localStorage.setItem('ngalam_affiliate_mitra', JSON.stringify(data.mitra));
        }
      });
    }

    const handleAffiliateEvent = (e: any) => {
      if (e.detail) {
        setReferralMitra(e.detail);
        setReferralInput(e.detail.referralCode || e.detail.code || '');
        setReferralStatus('valid');
      }
    };
    window.addEventListener('ngalam_affiliate_connected', handleAffiliateEvent);

    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerName: customer.name || prev.customerName,
        whatsapp: customer.whatsapp || customer.phone || prev.whatsapp,
        email: customer.email || prev.email,
        district: customer.district || customer.address || prev.district
      }));
    }

    const paramDamage = searchParams.get('problem') || searchParams.get('damage');
    if (paramDamage) {
      setSelectedProblems(new Set([paramDamage]));
    }

    const paramPromo = (searchParams.get('promo') || '').trim().toUpperCase();
    if (paramPromo) {
      handleApplyPromo(paramPromo);
    } else if (customer && !formData.promoCode) {
      handleApplyPromo('MEMBER5');
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', loadPromos);
      window.removeEventListener('ngalam_affiliate_connected', handleAffiliateEvent);
    };
  }, [customer]);

  const handleCheckReferral = async (rawCode?: string) => {
    const code = (rawCode || referralInput).trim().toUpperCase();
    if (!code) {
      setReferralMitra(null);
      setReferralStatus('idle');
      return;
    }
    setReferralStatus('checking');
    try {
      const res = await fetchApi(`/api/mitra/ref/${encodeURIComponent(code)}`);
      if (res.ok && res.data && res.data.success && res.data.mitra) {
        setReferralMitra(res.data.mitra);
        setReferralInput(code);
        setReferralStatus('valid');
        localStorage.setItem('ngalam_affiliate_ref', code);
        localStorage.setItem('ngalam_affiliate_mitra', JSON.stringify(res.data.mitra));
        sessionStorage.setItem('ngalam_affiliate_ref', code);
      } else {
        setReferralMitra(null);
        setReferralStatus('invalid');
      }
    } catch {
      setReferralStatus('invalid');
    }
  };

  const handleClearReferral = () => {
    localStorage.removeItem('ngalam_affiliate_ref');
    localStorage.removeItem('ngalam_affiliate_mitra');
    sessionStorage.removeItem('ngalam_affiliate_ref');
    setReferralMitra(null);
    setReferralInput('');
    setReferralStatus('idle');
  };

  const handlePhoneBlur = async () => {
    const rawVal = (formData.whatsapp || '').trim();
    if (!rawVal || (formData.customerName && formData.district)) return;
    try {
      const res = await fetchApi(`/api/customer/lookup?identifier=${encodeURIComponent(rawVal)}`);
      if (res.ok && res.data.success && res.data.customer) {
        const c = res.data.customer;
        setFormData((prev) => ({
          ...prev,
          customerName: prev.customerName || c.name || '',
          email: prev.email || c.email || '',
          district: prev.district || c.district || ''
        }));
      }
    } catch (_) {}
  };

  const toggleProblem = (id) => {
    setSelectedProblems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApplyPromo = async (codeToUse?: string) => {
    const code = (codeToUse || formData.promoCode || '').trim().toUpperCase();
    if (!code) return;
    setPromoError('');
    try {
      const res = await fetchApi('/api/promo-codes/validate', {
        method: 'POST',
        body: { 
          promoCode: code, 
          basePrice: 0,
          whatsapp: formData.whatsapp || (customer as any)?.whatsapp || '',
          customerId: (customer as any)?.id || ''
        }
      });
      if (res.ok && res.data.valid) {
        setAppliedPromo(res.data);
        setFormData((prev) => ({ ...prev, promoCode: code }));
      } else {
        setPromoError(res.data.message || 'Kode promo tidak valid atau telah kedaluwarsa.');
        setAppliedPromo(null);
      }
    } catch {
      setPromoError('Gagal memvalidasi promo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!formData.customerName.trim() || !formData.whatsapp.trim()) {
      setSubmitError('Nama pelanggan dan nomor WhatsApp wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const problemsArr = Array.from(selectedProblems);
    let fullDamage = problemsArr.join(', ');
    if (formData.complaint.trim()) {
      fullDamage = fullDamage ? `${fullDamage}. Catatan: ${formData.complaint.trim()}` : formData.complaint.trim();
    }
    if (!fullDamage) fullDamage = 'Pemeriksaan Kerusakan Menyeluruh';

    const selectedModelName = (formData.phoneType || currentModels[0] || '').trim();
    const brandNameUpper = formData.brand.toUpperCase();
    const fullPhoneType = selectedModelName.toUpperCase().startsWith(brandNameUpper)
      ? selectedModelName
      : `${brandNameUpper} ${selectedModelName}`;

    const activeRefCode = (referralInput || localStorage.getItem('ngalam_affiliate_ref') || sessionStorage.getItem('ngalam_affiliate_ref') || (customer as any)?.referredByMitra || '').trim().toUpperCase();
    const payload = {
      customerName: formData.customerName.trim(),
      whatsapp: formData.whatsapp.trim(),
      email: formData.email.trim(),
      district: formData.district.trim(),
      phoneType: fullPhoneType,
      serviceMethod: formData.serviceMethod,
      damage: fullDamage,
      promoCode: appliedPromo ? formData.promoCode.trim().toUpperCase() : '',
      promoName: appliedPromo?.promo?.name || appliedPromo?.name || '',
      promoDiscountValue: appliedPromo ? (appliedPromo.discountValue || appliedPromo.promo?.discountValue || 0) : 0,
      promoMinSpend: appliedPromo ? (appliedPromo.minSpend || appliedPromo.promo?.minSpend || 0) : 0,
      promoMaxDiscount: appliedPromo ? (appliedPromo.maxDiscount || appliedPromo.promo?.maxDiscount || 0) : 0,
      discountAmount: appliedPromo ? appliedPromo.discountAmount || 0 : 0,
      referralCode: activeRefCode,
      affiliateRef: activeRefCode
    };

    try {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        body: payload
      });
      if (res.ok && res.data.success) {
        setSuccessOrder(res.data.data);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        // Simpan konfirmasi referral di local storage agar riwayat tetap terkoneksi
        if (activeRefCode) {
          localStorage.setItem('ngalam_affiliate_ref', activeRefCode);
        }
      } else {
        setSubmitError(res.data.error || res.data.message || 'Gagal menyimpan pesanan servis.');
      }
    } catch {
      setSubmitError('Terjadi kesalahan koneksi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="wrap formpage" style={{ marginTop: '40px', marginBottom: '70px' }}>
      {/* Left Column: Trust, Speed & Benefits */}
      <div className="booking-sidebar-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#ffffff', padding: '4px', border: '2.5px solid #d4af37', boxShadow: '0 6px 20px rgba(212, 175, 55, 0.35)', flexShrink: 0 }}>
            <img 
              src={logoImg} 
              alt="Logo Resmi Ngalam Fix Pro" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', display: 'block' }} 
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/logo-ngalam-fix-pro.jpg"; }}
            />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', letterSpacing: '0.5px', display: 'block' }}>WORKSHOP RESMI MALANG</span>
            <strong style={{ fontSize: '1.05rem', color: '#0f172a', display: 'block' }}>Ngalam Fix Pro</strong>
          </div>
        </div>

        <div className="booking-hero-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          <span>FORMULIR BOOKING SERVIS RESMI</span>
        </div>

        <h1 className="booking-title">
          Daftarkan Servis HP Anda.<br />
          <span className="gradient-text">Cepat, Aman &amp; Bergaransi.</span>
        </h1>

        <p className="booking-subtitle">
          Isi data perangkat smartphone Anda untuk mendapatkan <strong>Nomor Tiket Servis Resmi</strong>. Data otomatis terhubung langsung ke antrian teknisi workshop kami dan tersimpan aman di database sistem secara real-time.
        </p>

        <div className="booking-benefit-card">
          <div className="booking-benefit-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Kenapa Booking Langsung di Sini?</span>
          </div>
          <ul className="booking-benefit-list">
            <li className="booking-benefit-item">
              <div className="booking-benefit-icon flex items-center justify-center" style={{ color: '#059669', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' }}>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="booking-benefit-text">
                <strong>Gratis Biaya Cek Awal &amp; Konsultasi</strong>
                <small>Tanpa biaya bongkar sama sekali jika Anda membatalkan perbaikan.</small>
              </div>
            </li>
            <li className="booking-benefit-item">
              <div className="booking-benefit-icon flex items-center justify-center" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.25)' }}>
                <Zap className="w-4 h-4 text-sky-500" />
              </div>
              <div className="booking-benefit-text">
                <strong>Bisa Ditunggu Langsung (Express)</strong>
                <small>Estimasi 30–60 menit pengerjaan selesai langsung di depan meja teknisi kami.</small>
              </div>
            </li>
            <li className="booking-benefit-item">
              <div className="booking-benefit-icon flex items-center justify-center" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.25)' }}>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="booking-benefit-text">
                <strong>Garansi Tertulis (Baterai 90 Hari, Lainnya 7–30 Hari)</strong>
                <small>Jaminan klaim suku cadang mudah dan transparan dengan nota resmi.</small>
              </div>
            </li>
            <li className="booking-benefit-item">
              <div className="booking-benefit-icon flex items-center justify-center" style={{ color: '#c084fc', background: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.25)' }}>
                <Lock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="booking-benefit-text">
                <strong>Data Pelanggan &amp; Privasi Terjaga 100%</strong>
                <small>PIN atau sandi layar tidak wajib dibagikan demi keamanan data Anda.</small>
              </div>
            </li>
          </ul>
        </div>

        <div className="booking-help-box">
          <div className="booking-help-avatar flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-slate-700" />
          </div>
          <div className="booking-help-text">
            <strong>Butuh Bantuan Mendesak?</strong>
            <span>Konsultasi Cepat via WhatsApp</span>
          </div>
          <a href="https://wa.me/628113185858" target="_blank" rel="noreferrer" className="booking-help-btn">
            <span>Chat WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Right Column: Interactive Luxury Form Card */}
      <div className="booking-form-card">
        <div className="form-header-badge">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 8 9" />
            </svg>
            <span>Formulir Masuk Servis</span>
          </h2>
          <span className="form-header-tag">ONLINE INTAKE RESMI</span>
        </div>

        {successOrder ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ marginBottom: '14px' }} className="flex justify-center">
              <Sparkles className="w-12 h-12 text-emerald-500" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#065f46' }}>Pemesanan Servis Berhasil!</h3>
            <p style={{ color: '#000000', fontSize: '0.9rem', marginTop: '6px' }}>
              Tiket resmi Anda telah dibuat. Silakan simpan nomor tiket berikut:
            </p>
            <div style={{ margin: '20px auto', padding: '16px', background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '16px', maxWidth: '320px' }}>
              <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700, display: 'block' }}>NOMOR TIKET:</span>
              <strong style={{ fontSize: '1.6rem', color: '#065f46', fontFamily: 'monospace' }}>{successOrder.id}</strong>
              {(referralMitra || successOrder.affiliateRef) && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #a7f3d0', fontSize: '0.78rem', color: '#065f46', textAlign: 'center' }}>
                  ✨ <b>Terkoneksi Mitra:</b> {referralMitra?.name || successOrder.partnerName || successOrder.affiliateRef} ({referralMitra?.referralCode || successOrder.affiliateRef})
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <a
                href={`https://wa.me/628113185858?text=Halo%20Admin%20Ngalam%20Fix%20Pro,%20saya%20sudah%20booking%20dengan%20nomor%20tiket%20${successOrder.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn"
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Konfirmasi WhatsApp ↗
              </a>
              <Link to={`/lacak?id=${successOrder.id}`} className="btn outline">
                Lacak Tiket ↗
              </Link>
            </div>
          </div>
        ) : (
          <form id="bookingForm" onSubmit={handleSubmit}>
            {referralMitra && (
              <div className="affiliate-banner" style={{ display: 'block', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '2px solid #10b981', borderRadius: '16px', padding: '18px 20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div className="flex items-center justify-center p-2 bg-emerald-100 rounded-xl">
                    <Bike className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ background: '#059669', color: '#ffffff', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '9999px' }}>MITRA RESMI TERVERIFIKASI</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#ffffff', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>{referralMitra.referralCode || referralMitra.code}</span>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#065f46', fontWeight: 700 }}>
                      Rekomendasi Servis dari: {referralMitra.name}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '16px' }} className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Step 1: Merek & Model */}
            <div className="b-form-group">
              <label className="b-form-label">
                <span>
                  <span className="b-form-step-badge">LANGKAH 1</span>
                  <span>Pilih Merek &amp; Model Smartphone <span className="req">*</span></span>
                </span>
                <span className="sub" style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                  Klik logo merek di bawah, lalu pilih tipe model HP Anda
                </span>
              </label>

              {/* Brand Quick Chips Grid dengan Logo Resmi */}
              <div className="brand-chips-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {brandsList.map((b) => {
                  const isSelected = formData.brand === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`brand-chip-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        const nextModels = modelsByBrand[b.id] || modelsByBrand.others;
                        setFormData({
                          ...formData,
                          brand: b.id,
                          phoneType: nextModels[0] || ''
                        });
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 700 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isSelected ? '1px solid #b45309' : '1px solid #cbd5e1',
                        background: isSelected ? 'linear-gradient(135deg, #d4af37, #b45309)' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#000000',
                        boxShadow: isSelected ? '0 4px 14px rgba(212, 175, 55, 0.3)' : '0 1px 3px rgba(15, 23, 42, 0.04)'
                      }}
                    >
                      {b.icon}
                      <span>{b.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM LUXURY DROPDOWN FOR MODEL */}
              <div className="relative w-full mt-3" ref={modelDropdownRef}>
                <button
                  type="button"
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
                        Tipe Seri Terpilih
                      </span>
                      <span className="block text-xs sm:text-sm md:text-base font-extrabold text-slate-900 truncate">
                        {formData.phoneType || currentModels[0] || 'Pilih Tipe Smartphone'}
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

                {modelDropdownOpen && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white border-2 border-amber-400/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    style={{
                      boxShadow: '0 20px 40px -10px rgba(212, 175, 55, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.2)'
                    }}
                  >
                    {currentModels.length > 5 && (
                      <div className="p-2 sm:p-2.5 bg-slate-50 border-b border-amber-200/50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Cari tipe seri smartphone..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white rounded-lg border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none text-slate-800 placeholder:text-slate-400"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}

                    <div className="max-h-56 sm:max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {filteredModels.length > 0 ? (
                        filteredModels.map((m: string) => {
                          const isSelected = (formData.phoneType || currentModels[0]) === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, phoneType: m });
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

            {/* Step 2: Keluhan */}
            <div className="b-form-group">
              <label className="b-form-label">
                <span>
                  <span className="b-form-step-badge">LANGKAH 2</span>
                  <span>Gejala &amp; Kerusakan Smartphone <span className="req">*</span></span>
                </span>
              </label>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {[
                  { id: 'lcd', label: 'Ganti Layar / LCD', icon: <Smartphone className="w-3.5 h-3.5 inline mr-1 text-sky-500" /> },
                  { id: 'baterai', label: 'Baterai Drop', icon: <Battery className="w-3.5 h-3.5 inline mr-1 text-emerald-500" /> },
                  { id: 'kaca', label: 'Kaca Retak OCA', icon: <Gem className="w-3.5 h-3.5 inline mr-1 text-purple-500" /> },
                  { id: 'charging', label: 'Tidak Bisa Cas', icon: <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" /> },
                  { id: 'kamera', label: 'Kamera Blur / Getar', icon: <Camera className="w-3.5 h-3.5 inline mr-1 text-rose-500" /> },
                  { id: 'matot', label: 'Mati Total', icon: <PowerOff className="w-3.5 h-3.5 inline mr-1 text-red-500" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleProblem(item.id)}
                    className="flex items-center"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: selectedProblems.has(item.id) ? '2px solid #b45309' : '1px solid #cbd5e1',
                      background: selectedProblems.has(item.id) ? '#fffdf5' : '#ffffff',
                      color: '#000000',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <textarea
                className="b-textarea form-control"
                rows={3}
                placeholder="Ceritakan kronologi singkat kerusakan (misal: habis jatuh dari motor, mati setelah dicharge semalaman)..."
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
              />

            </div>

            {/* Step 3: Kontak Pemilik */}
            <div className="b-form-group">
              <label className="b-form-label">
                <span>
                  <span className="b-form-step-badge">LANGKAH 3</span>
                  <span>Data Kontak Pemilik HP <span className="req">*</span></span>
                </span>
              </label>

              <div className="form-row-2">
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Nomor WhatsApp (Cth: 08123456789) *"
                    className="b-input form-control"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    onBlur={handlePhoneBlur}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pemilik *"
                    className="b-input form-control"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-2" style={{ marginTop: '10px' }}>
                <div>
                  <input
                    type="email"
                    placeholder="Email (Opsional)"
                    className="b-input form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Kecamatan / Wilayah Malang"
                    className="b-input form-control"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Promo Code & Voucher Catalogue */}
            <div className="b-form-group">
              <label className="b-form-label">
                <span>
                  <span className="b-form-step-badge" style={{ background: '#f59e0b', color: '#0f172a' }}>PROMO</span>
                  <span>Pilih Voucher Promo &amp; Diskon Servis</span>
                </span>
                <span className="sub" style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                  Katalog kode promo eksklusif hanya dapat dilihat &amp; diklaim langsung saat booking servis di bawah ini.
                </span>
              </label>

              {/* LIST VOUCHER PROMO AKTIF */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '10px', marginTop: '10px', marginBottom: '12px', width: '100%', boxSizing: 'border-box' }}>
                {(availablePromoCodes.length > 0 ? availablePromoCodes.filter((p: any) => p.status === 'active' || p.active !== false) : [
                  { code: 'MEMBER5', name: 'Diskon 5% Member Baru (1x Pakai)', discountValue: 5, minSpend: 500000, description: 'Potongan diskon 5% sekali pakai khusus member baru (Min. transaksi Rp 500.000)' },
                  { code: 'NGALAM15', name: 'Promo Servis Bergaransi', discountValue: 15, minSpend: 150000, description: 'Diskon 15% servis smartphone' },
                  { code: 'HEMAT20', name: 'Paket Hemat Mahasiswa & Pelajar', discountValue: 20, minSpend: 200000, description: 'Diskon 20% hemat' },
                  { code: 'SUPER25', name: 'Super Weekend & Gajian', discountValue: 25, minSpend: 300000, description: 'Diskon 25% servis all tipe' },
                  { code: 'VIP30', name: 'Mega Servis Prioritas', discountValue: 30, minSpend: 500000, description: 'Diskon 30% perbaikan spesial' }
                ]).map((p: any) => {
                  const isApplied = formData.promoCode.toUpperCase() === p.code.toUpperCase();
                  return (
                    <div
                      key={p.code}
                      onClick={() => handleApplyPromo(p.code)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isApplied ? '2px solid #10b981' : '1.5px solid #e2e8f0',
                        background: isApplied ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        boxShadow: isApplied ? '0 4px 12px rgba(16,185,129,0.15)' : 'none',
                        boxSizing: 'border-box',
                        minWidth: 0,
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          background: isApplied ? '#10b981' : '#fef3c7',
                          color: isApplied ? '#ffffff' : '#b45309',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          Diskon {p.discountValue || 10}%
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, fontFamily: 'monospace', color: '#64748b' }}>
                          {p.code}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        {p.name}
                      </div>

                      <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.4 }}>
                        <div>🛒 Min. Belanja: <strong>{formatRp(p.minSpend || 100000)}</strong></div>
                        {p.maxDiscount ? <div>🛡️ Maks. Diskon: {formatRp(p.maxDiscount)}</div> : null}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyPromo(p.code);
                        }}
                        style={{
                          marginTop: '8px',
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                          background: isApplied ? '#10b981' : '#0f172a',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                            <span>Voucher Terpasang</span>
                          </>
                        ) : (
                          <span>Gunakan Voucher Ini</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Status Sukses Voucher Terpasang */}
              {appliedPromo && (
                <div style={{
                  padding: '10px 14px',
                  background: '#ecfdf5',
                  border: '1.5px solid #a7f3d0',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  color: '#065f46',
                  fontSize: '0.8rem',
                  lineHeight: 1.5
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '2px' }}>
                    <CheckCircle2 style={{ width: '15px', height: '15px', color: '#10b981' }} />
                    <span>Voucher {formData.promoCode} Berhasil Terpasang!</span>
                  </div>
                  <div>
                    Potongan <strong>{appliedPromo.discountValue || appliedPromo.promo?.discountValue || 10}%</strong> (Syarat Min. Belanja: {formatRp(appliedPromo.minSpend || appliedPromo.promo?.minSpend || 100000)}). Subtotal pengerjaan akan otomatis dipotong langsung by system di kasir saat pembayaran selesai.
                  </div>
                </div>
              )}

              {/* Input Manual Kode Voucher */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Atau ketik kode voucher lain..."
                  className="b-input form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  value={formData.promoCode}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                />
                <button
                  type="button"
                  className="btn small"
                  onClick={() => handleApplyPromo()}
                  style={{ padding: '0 20px', borderRadius: '10px' }}
                >
                  Terapkan
                </button>
              </div>

              {promoError && (
                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px' }}>{promoError}</div>
              )}
            </div>

            {/* Step 5: Kode Referral Mitra Afiliasi */}
            <div className="b-form-group" style={{ marginTop: '16px' }}>
              <label className="b-form-label">
                <span>
                  <span className="b-form-step-badge" style={{ background: '#059669', color: '#ffffff' }}>MITRA</span>
                  <span>Kode Referral Mitra Rekomendasi (Opsional)</span>
                </span>
                <span className="sub" style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                  Otomatis tersimpan &amp; terhubung saat Anda scan QR Code mitra rekanan kami
                </span>
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Kode Referral Mitra (Cth: MTR-FERDI-12)"
                  className="b-input form-control"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                  value={referralInput}
                  onChange={(e) => {
                    setReferralInput(e.target.value.toUpperCase());
                    setReferralStatus('idle');
                  }}
                />
                <button
                  type="button"
                  className="btn small"
                  onClick={() => handleCheckReferral()}
                  style={{ padding: '0 20px', borderRadius: '10px', background: '#059669', borderColor: '#059669' }}
                >
                  {referralStatus === 'checking' ? 'Mengecek...' : 'Hubungkan'}
                </button>
              </div>

              {referralMitra ? (
                <div style={{ color: '#059669', fontSize: '0.82rem', fontWeight: 700, marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #a7f3d0' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Terhubung dengan Mitra: <b>{referralMitra.name}</b> ({referralMitra.referralCode || referralMitra.code})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearReferral}
                    style={{ fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    Lepas
                  </button>
                </div>
              ) : referralStatus === 'invalid' ? (
                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px' }}>
                  Kode referral mitra tidak ditemukan. Pastikan kode sesuai dengan QR Code mitra.
                </div>
              ) : null}
            </div>

            <button type="submit" className="btn full" disabled={isSubmitting} style={{ padding: '16px', fontSize: '1rem', fontWeight: 800, borderRadius: '14px', marginTop: '14px' }}>
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Daftarkan Servis HP Sekarang ↗'}</span>
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
