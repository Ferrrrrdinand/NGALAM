import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, Coins, TrendingUp, ShieldCheck, ArrowRight, X, 
  Gift, CheckCircle2, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SESSION_STORAGE_KEY = 'ngalam_affiliate_popup_dismissed';

export default function AffiliateInviteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { customer } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Jangan munculkan jika sudah pernah ditutup dalam sesi ini
    const isDismissed = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    if (isDismissed) return;

    // Jangan munculkan jika user sudah login sebagai pelanggan atau sedang di halaman khusus
    if (customer) return;

    const currentPath = location.pathname.toLowerCase();
    const excludedPaths = ['/pesan-servis', '/login', '/mitra', '/admin'];
    if (excludedPaths.some(path => currentPath.startsWith(path))) {
      return;
    }

    // Deteksi jika user mengklik tombol/link "Pesan Servis" atau "Daftar Member" / Login di halaman
    let timerId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const handleUserInteraction = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a') || target.closest('button');
      if (anchor) {
        const href = anchor.getAttribute('href') || '';
        const text = (anchor.textContent || '').toLowerCase();

        // Jika user klik tombol servis atau login/member
        if (
          href.includes('pesan-servis') || 
          href.includes('login') || 
          href.includes('mitra') ||
          text.includes('pesan servis') || 
          text.includes('daftar') || 
          text.includes('member')
        ) {
          isCancelled = true;
          if (timerId) clearTimeout(timerId);
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, true);

    // Hitungan mundur 10 detik tepat
    timerId = setTimeout(() => {
      if (!isCancelled && !sessionStorage.getItem(SESSION_STORAGE_KEY)) {
        // Cek lagi path saat timer selesai
        const pathNow = window.location.pathname.toLowerCase();
        if (!excludedPaths.some(path => pathNow.startsWith(path))) {
          setIsOpen(true);
        }
      }
    }, 10000);

    return () => {
      if (timerId) clearTimeout(timerId);
      document.removeEventListener('click', handleUserInteraction, true);
    };
  }, [customer, location.pathname]);

  const handleClose = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const handleGoToMitra = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setIsOpen(false);
    navigate('/mitra');
  };

  const handleGoToMember = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setIsOpen(false);
    navigate('/login?tab=register&promo=MEMBER10');
  };

  const handleGoToServis = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setIsOpen(false);
    navigate('/pesan-servis');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200/80 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 p-6 text-white relative overflow-hidden">
          {/* Background Decorative Rings */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-emerald-400/20 rounded-full blur-lg pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Tutup penawaran"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-bold uppercase tracking-wider border border-white/25 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              Peluang Cuan Tanpa Modal
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/30 text-emerald-100 text-xs font-semibold">
              <Zap className="w-3 h-3 text-emerald-300" /> Komisi 10% Tunai
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white leading-tight drop-shadow-sm">
            Mau Dapat Penghasilan Tambahan Jutaan Rupiah dari HP Anda?
          </h3>
          <p className="text-amber-100/95 text-xs md:text-sm mt-1.5 font-medium leading-relaxed">
            Tanpa perlu stok barang &amp; tanpa keahlian servis! Cukup rekomendasikan teman atau keluarga yang butuh servis HP di Ngalam Fix Pro.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-4">
          {/* Main Value Proposition Callout */}
          <div className="bg-gradient-to-br from-amber-50 via-emerald-50/40 to-slate-50 p-4 rounded-2xl border border-amber-200/60 shadow-sm flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
              <Coins className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-amber-700 tracking-wide">
                  Bagikan Link &bull; Dapat 10% Cash
                </span>
              </div>
              <p className="text-slate-700 text-xs md:text-sm font-semibold mt-0.5 leading-snug">
                Setiap 1 unit servis selesai (misal ganti LCD Rp 600.000), Anda otomatis kantongi komisi <span className="text-emerald-700 font-extrabold">Rp 60.000 tunai</span> langsung masuk ke saldo Anda!
              </p>
            </div>
          </div>

          {/* 3 Keuntungan Nyata */}
          <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>100% Gratis &amp; Bebas Resiko:</strong> Tidak dipungut biaya pendaftaran apapun seumur hidup.</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Dashboard Transparan:</strong> Pantau klik, referral, dan pencairan komisi secara real-time.</span>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Dukungan Garansi Resmi:</strong> Pelanggan senang karena bergaransi s/d 90 hari &amp; teknisi lab bersertifikat.</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleGoToMitra}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-extrabold text-sm md:text-base rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Daftar Jadi Mitra Afiliasi Sekarang (Gratis)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Secondary Options */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleGoToMember}
                className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>Daftar Member VIP (Diskon 10%)</span>
              </button>

              <button
                onClick={handleGoToServis}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Pesan Servis HP Dulu &rarr;</span>
              </button>
            </div>
          </div>

          {/* Subtle Dismiss Link */}
          <div className="text-center pt-1">
            <button
              onClick={handleClose}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors"
            >
              Nanti saja, saya ingin menjelajahi website dulu &times;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
