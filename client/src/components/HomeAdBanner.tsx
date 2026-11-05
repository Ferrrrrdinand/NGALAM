import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowRight, ChevronLeft, ChevronRight, 
  ExternalLink, MessageCircle
} from 'lucide-react';
import { fetchApi } from '../utils/api';

export interface AdItem {
  id: string;
  title: string;
  headline: string;
  description: string;
  badge: string;
  imageUrl?: string;
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
    title: 'Member Diskon 10%',
    headline: 'Daftar Member & Dapatkan Diskon 10% Servis HP',
    description: 'Daftar gratis & klaim voucher kode MEMBER10 untuk potongan 10% perbaikan LCD, baterai, dan mesin.',
    badge: '👑 MEMBER BARU DISKON 10%',
    ctaText: 'Daftar & Klaim 10% ↗',
    targetUrl: '/akun-pelanggan?tab=register&promo=MEMBER10',
    theme: 'gold',
    active: true
  },
  {
    id: 'ad-baterai-90hari',
    title: 'Garansi Baterai 90 Hari',
    headline: 'Ganti Baterai Original iPhone & Android — Garansi 90 Hari',
    description: 'Baterai Grade Original 100% Health, pengerjaan cepat 30–45 menit bergaransi resmi.',
    badge: '⚡ GARANSI 90 HARI',
    ctaText: 'Klaim Servis Baterai ↗',
    targetUrl: '/pesan-servis?problem=baterai',
    theme: 'gold',
    active: true
  },
  {
    id: 'ad-lcd-tempered',
    title: 'Paket Komplit Layar OLED',
    headline: 'Ganti Layar OLED / Retina — Gratis Tempered Glass 9H Presisi',
    description: 'Diskon suku cadang hingga 30% plus bonus pelindung layar 9H langsung terpasang.',
    badge: '🔥 DISKON S/D 30% + BONUS 9H',
    ctaText: 'Lihat Estimasi LCD ↗',
    targetUrl: '/pesan-servis?problem=lcd&promo=FREEGLASS9H',
    theme: 'emerald',
    active: true
  },
  {
    id: 'ad-antar-jemput',
    title: 'Layanan Antar-Jemput Malang',
    headline: 'Layanan Servis HP Antar-Jemput Seluruh Area Malang Raya',
    description: 'Unit dijemput dan diantar ke rumah/kantor dengan laporan pengerjaan real-time via WhatsApp.',
    badge: '🛵 PICKUP & DELIVERY MALANG',
    ctaText: 'Pesan Antar Jemput WA ↗',
    targetUrl: 'https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20mau%20layanan%20antar%20jemput%20servis%20HP',
    theme: 'dark',
    active: true
  },
  {
    id: 'ad-workshop-presisi',
    title: 'Workshop Meja Terbuka',
    headline: 'Servis HP Transparan Bisa Ditunggu (30–60 Menit)',
    description: 'Peralatan micro-soldering & mesin OCA terbuka, tonton langsung pengerjaan di depan Anda.',
    badge: '⏱️ BISA DITUNGGU (30–60 MENIT)',
    ctaText: 'Konsultasi Teknisi ↗',
    targetUrl: 'https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20tanya%20servis%20di%20workshop%20bisa%20ditunggu',
    theme: 'gold',
    active: true
  }
];

export default function HomeAdBanner() {
  const [ads, setAds] = useState<AdItem[]>(DEFAULT_FALLBACK_ADS);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    // Poll every 20 seconds so admin edits show immediately
    const pollInterval = setInterval(fetchAds, 20000);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
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
        return 'from-emerald-950 via-slate-900 to-black border-emerald-500/40';
      case 'dark':
        return 'from-slate-900 via-neutral-900 to-black border-white/15';
      case 'blue':
        return 'from-blue-950 via-slate-900 to-black border-blue-500/40';
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
    <section className="wrap my-4 sm:my-6 transition-all duration-300" id="homeAdSection">
      {/* ======================================================== */}
      {/* RINGKAS, PADAT & TO THE POINT (TIDAK BERTELE-TELE) */}
      {/* ======================================================== */}
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${getThemeGradient(currentAd.theme)} p-4 sm:p-5 border shadow-lg transition-all duration-300`}
        style={{
          boxShadow: '0 10px 30px -10px rgba(212, 175, 55, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.15)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* BAGIAN TEKS INFORMASI (RINGKAS & TO THE POINT) */}
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
            {/* BADGE & DOTS SLIDER */}
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border ${getBadgeStyle(currentAd.theme)}`}>
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{currentAd.badge || 'PROMO SPESIAL'}</span>
              </span>

              {/* Slider Dots & Nav */}
              {ads.length > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1">
                    {ads.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setCurrentIndex(dotIdx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentIndex === dotIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
                        }`}
                        aria-label={`Slide ${dotIdx + 1}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length)}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                      aria-label="Sebelumnya"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % ads.length)}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                      aria-label="Selanjutnya"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* HEADLINE SINGKAT */}
            <h3 className="text-sm sm:text-base md:text-lg font-black text-white leading-snug tracking-tight truncate-2-lines">
              {currentAd.headline}
            </h3>

            {/* DESKRIPSI 1 KALIMAT LANGSUNG */}
            <p className="text-xs sm:text-[13px] text-slate-300/90 leading-snug font-normal line-clamp-2">
              {currentAd.description}
            </p>
          </div>

          {/* BAGIAN TOMBOL AKSI CEPAT (COMPACT CTA) */}
          <div className="flex items-center gap-2 shrink-0 pt-1 md:pt-0">
            {isExternalLink ? (
              <a
                href={currentAd.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAdClick(currentAd)}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{currentAd.ctaText || 'Klaim Promo ↗'}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            ) : (
              <Link
                to={currentAd.targetUrl}
                onClick={() => handleAdClick(currentAd)}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{currentAd.ctaText || 'Klaim Promo ↗'}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            )}

            <a
              href={`https://wa.me/6281330304321?text=${encodeURIComponent(
                `Halo Ngalam Fix Pro, saya ingin info terkait "${currentAd.headline}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Konsultasi WhatsApp"
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-400 border border-white/15 hover:border-emerald-400/50 transition-all cursor-pointer shrink-0"
              title="Konsultasi WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
