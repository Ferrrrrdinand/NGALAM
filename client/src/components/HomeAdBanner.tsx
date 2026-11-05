import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight, 
  ExternalLink, Zap, CheckCircle2, PhoneCall
} from 'lucide-react';
import { fetchApi } from '../utils/api';

export interface AdItem {
  id: string;
  title: string;
  headline: string;
  description: string;
  badge: string;
  imageUrl: string;
  targetUrl: string;
  ctaText: string;
  theme?: 'gold' | 'emerald' | 'dark' | 'blue';
  active: boolean;
  viewsCount?: number;
  clicksCount?: number;
  location?: string;
  [key: string]: any;
}

const DEFAULT_FALLBACK_ADS: AdItem[] = [
  {
    id: 'ad-workshop-presisi',
    title: 'Workshop Meja Terbuka',
    headline: 'Peralatan Presisi Micro-Soldering, Thermal Camera & Mesin OCA Terbuka',
    description: 'Pengerjaan profesional smartphone Android & iPhone bisa ditonton langsung di depan meja teknisi tanpa ditinggal. Transparan, aman, suku cadang original, dan bisa ditunggu 30–60 menit.',
    badge: '⚡ BISA DITUNGGU (30–60 MENIT)',
    ctaText: 'Konsultasi Teknisi Langsung ↗',
    targetUrl: 'https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20di%20workshop%20bisa%20ditunggu',
    imageUrl: '/images/spesialis-hp-banner.jpg',
    theme: 'gold',
    active: true
  },
  {
    id: 'ad-baterai-90hari',
    title: 'Garansi Baterai 90 Hari',
    headline: 'Ganti Baterai Original iPhone & Android — Garansi Resmi 90 Hari Penuh!',
    description: 'Baterai cepat drop atau kembung? Ganti di tempat dengan sel baterai Grade Original 100% Health, pengerjaan express 30–45 menit di meja transparan, dan jaminan perlindungan 90 hari tertulis resmi.',
    badge: '⚡ GARANSI SPESIAL 90 HARI',
    ctaText: 'Klaim Servis Baterai ↗',
    targetUrl: '/pesan-servis?problem=baterai',
    imageUrl: '/images/promo-banner-1.jpg',
    theme: 'gold',
    active: true
  },
  {
    id: 'ad-lcd-tempered',
    title: 'Paket Komplit Layar OLED + Bonus 9H',
    headline: 'Ganti Layar Super Retina / OLED — Gratis Pasang Tempered Glass 9H Presisi!',
    description: 'Layar retak, blank hitam, atau touch error? Dapatkan diskon suku cadang hingga 30%, warna tajam 120Hz smooth, sensor responsif, plus bonus tempered glass 9H gratis langsung terpasang rapi.',
    badge: '🔥 DISKON S/D 30% + BONUS 9H',
    ctaText: 'Lihat Estimasi LCD ↗',
    targetUrl: '/pesan-servis?problem=lcd&promo=FREEGLASS9H',
    imageUrl: '/images/promo-banner-tempered-glass.jpg',
    theme: 'emerald',
    active: true
  },
  {
    id: 'ad-antar-jemput',
    title: 'Layanan Antar-Jemput Malang',
    headline: 'Sibuk Kerja? Manfaatkan Pickup & Delivery Servis HP Seluruh Area Malang Raya',
    description: 'Unit HP Anda dijemput kurir profesional langsung ke kantor atau rumah. Pengecekan transparan di Meja 1 dan update pengerjaan dilaporkan langsung ke WhatsApp Anda.',
    badge: '🛵 PICKUP & DELIVERY MALANG',
    ctaText: 'Pesan Antar Jemput WA ↗',
    targetUrl: 'https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20mau%20layanan%20antar%20jemput%20servis%20HP',
    imageUrl: '/images/spesialis-hp-banner.jpg',
    theme: 'dark',
    active: true
  }
];

export default function HomeAdBanner() {
  const [ads, setAds] = useState<AdItem[]>(DEFAULT_FALLBACK_ADS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch active ads from database API
  useEffect(() => {
    let isMounted = true;
    const fetchAds = async () => {
      try {
        const res = await fetchApi('/api/ads?location=home_under_steps');
        if (res.ok && res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          if (isMounted) {
            setAds(res.data.data);
          }
        }
      } catch (err) {
        console.warn('Error loading dynamic ads, using fallback:', err);
      }
    };

    fetchAds();
    // Poll every 15 seconds so admin edits show immediately without page refresh
    const pollInterval = setInterval(fetchAds, 15000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Auto-slide every 7 seconds
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (!ads || ads.length === 0) return null;

  const currentAd = ads[currentIndex] || ads[0];

  const handleAdClick = (ad: AdItem) => {
    try {
      fetchApi(`/api/ads/${ad.id}/click`, { method: 'POST' });
    } catch (_) {}
  };

  const getThemeGradient = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return 'from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/30';
      case 'dark':
        return 'from-slate-900 via-neutral-900 to-slate-950 border-amber-500/20';
      case 'blue':
        return 'from-blue-950 via-slate-900 to-slate-950 border-blue-500/30';
      case 'gold':
      default:
        return 'from-amber-950/90 via-slate-900 to-black border-amber-500/40';
    }
  };

  const getBadgeStyle = (theme?: string) => {
    switch (theme) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'gold':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  const isExternalLink = currentAd.targetUrl?.startsWith('http') || currentAd.targetUrl?.startsWith('https');

  return (
    <section className="wrap my-8 sm:my-12 transition-all duration-300" id="homeAdSection">
      {/* ======================================================== */}
      {/* 1. CINEMATIC VISUAL PROMO & AD BANNER (UNIFIED HERO BANNER) */}
      {/* ======================================================== */}
      <div 
        className="relative overflow-hidden rounded-3xl border-2 border-amber-400/40 shadow-2xl bg-slate-950 group cursor-pointer"
        style={{
          boxShadow: '0 25px 60px -15px rgba(212, 175, 55, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.25)',
          aspectRatio: '16 / 7.2',
          minHeight: '320px'
        }}
        onClick={() => {
          handleAdClick(currentAd);
          if (isExternalLink) {
            window.open(currentAd.targetUrl, '_blank', 'noopener,noreferrer');
          } else {
            window.location.href = currentAd.targetUrl || '/pesan-servis';
          }
        }}
      >
        {/* Full-Bleed Banner Image with Zoom on Hover */}
        <img
          src={currentAd.imageUrl?.startsWith('http') || currentAd.imageUrl?.startsWith('/') ? currentAd.imageUrl : `/${currentAd.imageUrl}`}
          alt={currentAd.title}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/spesialis-hp-banner.jpg';
          }}
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 pointer-events-none"></div>

        {/* Top-Right Badge (e.g. BISA DITUNGGU (30–60 MENIT)) */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10 pointer-events-none">
          <div 
            className="px-3 sm:px-4 py-1.5 rounded-full font-black text-xs sm:text-sm uppercase tracking-wide shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)'
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{currentAd.badge || 'PROMO RESMI BERGARANSI'}</span>
          </div>
        </div>

        {/* Left & Right Round Arrow Navigation Buttons */}
        {ads.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
              }}
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-black/55 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg active:scale-95"
              aria-label="Banner Sebelumnya"
            >
              <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev + 1) % ads.length);
              }}
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-black/55 hover:bg-black/85 text-white/90 hover:text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all z-20 cursor-pointer shadow-lg active:scale-95"
              aria-label="Banner Selanjutnya"
            >
              <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6" />
            </button>
          </>
        )}

        {/* Bottom Interactive Bar (Click Hint Pill + Dots) */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-10 flex flex-wrap items-center justify-between gap-3">
          {/* Bottom-Left Interactive Pill */}
          <div 
            className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-xl border border-white/30 backdrop-blur-md transition-transform group-hover:scale-102"
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              color: '#ffffff'
            }}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse"></span>
            <span className="text-white font-medium text-xs sm:text-sm drop-shadow-sm">
              Klik Banner untuk Info Promo &amp; Klaim
            </span>
            <span 
              className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1"
              style={{
                background: '#f59e0b',
                color: '#0f172a'
              }}
            >
              <span>{currentAd.ctaText || 'Konsultasi Teknisi Langsung ↗'}</span>
            </span>
          </div>

          {/* Bottom-Right Pagination Dots */}
          {ads.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
              {ads.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(dotIdx);
                  }}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === dotIdx 
                      ? 'w-7 bg-amber-400 shadow-[0_0_8px_#f59e0b]' 
                      : 'w-2.5 bg-white/40 hover:bg-white/80'
                  }`}
                  aria-label={`Slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DYNAMIC AD & PROMO DETAILS BAR (CONNECTED TO DATABASE) */}
      {/* ======================================================== */}
      <div 
        className="mt-4 p-5 sm:p-6 lg:p-7 rounded-2xl bg-white border border-amber-200/80 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5"
        style={{
          boxShadow: '0 10px 30px -5px rgba(212, 175, 55, 0.15)'
        }}
      >
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>IKLAN &amp; PROMO RESMI WORKSHOP</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Diperbarui secara live dari Admin Dashboard
            </span>
          </div>

          <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-snug">
            {currentAd.headline}
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {currentAd.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-amber-900 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Teknisi Berpengalaman Meja Terbuka</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bisa Ditunggu 30–60 Menit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Garansi Resmi Tertulis Hingga 90 Hari</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
          {isExternalLink ? (
            <a
              href={currentAd.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAdClick(currentAd)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentAd.ctaText || 'Lihat Penawaran ↗'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : (
            <Link
              to={currentAd.targetUrl}
              onClick={() => handleAdClick(currentAd)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>{currentAd.ctaText || 'Klaim Sekarang ↗'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <a
            href={`https://wa.me/6281330304321?text=${encodeURIComponent(
              `Halo Admin Ngalam Fix Pro, saya tertarik dengan promo/iklan "${currentAd.title}". Mohon info pengerjaan & garansinya hari ini.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm border border-slate-300 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Konsultasi WA</span>
          </a>
        </div>
      </div>
    </section>
  );
}

