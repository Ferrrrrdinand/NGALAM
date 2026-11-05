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
    id: 'ad-member-vip-10',
    title: 'Tawaran Member VIP Diskon 10%',
    headline: 'Gabung Member VIP Ngalam Fix Pro — Dapatkan Potongan Diskon 10% Servis HP!',
    description: 'Daftar akun gratis sekarang & nikmati potongan otomatis 10% seluruh perbaikan smartphone (ganti LCD, baterai original, kamera & IC), pantau riwayat servis, klaim garansi online, dan nikmati prioritas pengerjaan di Meja 1.',
    badge: '👑 TAWARAN MEMBER: DISKON 10%',
    ctaText: 'Daftar Member & Klaim 10% ↗',
    targetUrl: '/akun-pelanggan?tab=register&promo=MEMBER10',
    imageUrl: '/images/spesialis-hp-banner.jpg',
    theme: 'gold',
    active: true
  },
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
      {/* TEXT-ONLY LUXURY ADVERTISEMENT CARD (TANPA GAMBAR) */}
      {/* ======================================================== */}
      <div 
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getThemeGradient(currentAd.theme)} p-6 sm:p-8 lg:p-9 border shadow-2xl transition-all duration-500`}
        style={{
          boxShadow: '0 20px 50px -15px rgba(212, 175, 55, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.2)'
        }}
      >
        {/* Subtle background luxury glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 sm:space-y-5">
          {/* TOP BAR: BADGE, LIVE SPONSOR, & SLIDER NAVIGATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs ${getBadgeStyle(currentAd.theme)}`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentAd.badge || 'PROMO SPESIAL'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-300/90 bg-white/5 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>IKLAN RESMI SPONSOR</span>
              </span>
            </div>

            {/* Slider Navigation Controls (Dots & Arrows) */}
            {ads.length > 1 && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
                  {ads.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => setCurrentIndex(dotIdx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        currentIndex === dotIdx ? 'w-6 bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'w-2 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Slide iklan ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                    aria-label="Iklan Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % ads.length)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                    aria-label="Iklan Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HEADLINE */}
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight max-w-4xl">
            {currentAd.headline}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-xs sm:text-sm lg:text-[15px] text-slate-300/90 leading-relaxed font-normal max-w-5xl">
            {currentAd.description}
          </p>

          {/* FEATURE HIGHLIGHTS */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-amber-200/90 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Teknisi Berpengalaman &amp; Bergaransi Resmi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Bisa Ditunggu di Meja Transparan (30–60 Menit)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Suku Cadang Grade Original &amp; QC 24 Titik Fungsi</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {isExternalLink ? (
                <a
                  href={currentAd.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleAdClick(currentAd)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{currentAd.ctaText || 'Lihat Penawaran ↗'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  to={currentAd.targetUrl}
                  onClick={() => handleAdClick(currentAd)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{currentAd.ctaText || 'Klaim Sekarang ↗'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <a
                href={`https://wa.me/6281330304321?text=${encodeURIComponent(
                  `Halo Admin Ngalam Fix Pro, saya tertarik dengan penawaran iklan "${currentAd.title}". Mohon info ketersediaan & jadwalnya hari ini.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 hover:border-amber-400/50 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Konsultasi WA</span>
              </a>
            </div>

            <div className="text-[11px] text-slate-400 hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Diperbarui otomatis dari database iklan Ngalam Fix Pro</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EXCLUSIVE MEMBER OFFER STRIP (DISKON 10% MEMBER BARU) */}
      {/* ======================================================== */}
      <div 
        className="mt-3.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-600/15 border border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md"
        style={{
          boxShadow: '0 6px 20px -5px rgba(212, 175, 55, 0.2)'
        }}
      >
        <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-800">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm border border-amber-300">
            👑
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <b className="text-slate-950 font-black tracking-tight">Tawaran Eksklusif Menjadi Member:</b>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-2xs">
                Diskon 10% Langsung
              </span>
            </div>
            <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">
              Daftar akun gratis hari ini &amp; gunakan kode <b className="font-mono text-amber-900 bg-amber-200/80 px-1.5 py-0.2 rounded border border-amber-300">MEMBER10</b> untuk potongan 10% servis smartphone Anda!
            </p>
          </div>
        </div>

        <Link
          to="/akun-pelanggan?tab=register&promo=MEMBER10"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all whitespace-nowrap shrink-0"
        >
          <span>Daftar Member (Diskon 10%) ↗</span>
        </Link>
      </div>
    </section>
  );
}

