import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Phone, MessageSquare, Clock, ShieldCheck, 
  Zap, Sparkles, Navigation, Send, CheckCircle2, 
  ExternalLink, Calendar, Check, MessageCircle, ArrowRight
} from 'lucide-react';

export default function Kontak() {
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    device: '',
    problem: '',
    message: ''
  });
  const [isCopied, setIsCopied] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Admin Ngalam Fix Pro, saya ingin konsultasi servis HP:\n` +
      `• Nama: ${form.name || '-'}\n` +
      `• WhatsApp: ${form.whatsapp || '-'}\n` +
      `• Tipe HP: ${form.device || '-'}\n` +
      `• Kerusakan: ${form.problem || '-'}\n` +
      `• Keterangan Tambahan: ${form.message || '-'}\n\n` +
      `Apakah suku cadangnya tersedia dan bisa ditunggu hari ini?`;
    
    window.open(`https://wa.me/6281131858858?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyAddress = () => {
    navigator.clipboard?.writeText('Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang, Jawa Timur 65115 (Workshop Ngalam Fix Pro)');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="bg-[#fcfbf7] dark:bg-[#0b0f19] min-h-screen text-slate-900 dark:text-slate-100 pb-20">
      {/* ======================================================== */}
      {/* 1. HERO HEADER SECTION */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/12 via-amber-400/5 to-transparent pt-10 pb-10 sm:pt-16 sm:pb-14 border-b border-amber-200/40 dark:border-amber-500/20">
        <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 -ml-20 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"></div>

        <div className="wrap max-w-5xl mx-auto px-4 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-600/20 border border-amber-400/60 text-amber-950 dark:text-amber-300 shadow-2xs mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Pusat Bantuan &amp; Lokasi Workshop Resmi • Kota Malang</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight mb-3">
            Ada yang Ingin Ditanyakan?<br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent">
              Tim Spesialis Kami Siap Membantu Anda.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
            Konsultasikan kerusakan smartphone Android atau iPhone Anda secara online atau langsung kunjungi meja lab teknisi kami. Pengecekan awal selalu <b>100% Gratis Tanpa Biaya Bongkar</b>.
          </p>

          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 max-w-4xl mx-auto text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-emerald-400/60 dark:border-emerald-500/40 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
              <span className="text-emerald-900 dark:text-emerald-300 font-extrabold">Workshop Buka Sekarang</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Senin – Minggu: 10.00 – 20.00 WIB</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Respon Online &lt; 10 Menit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Garansi s/d 90 Hari</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THREE PRIMARY CONTACT CARDS GRID */}
      {/* ======================================================== */}
      <section className="wrap max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* CARD 1: WHATSAPP CONSULTATION */}
          <div 
            className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131b2e] border-2 border-amber-400/50 hover:border-amber-500 dark:border-amber-500/30 dark:hover:border-amber-500 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            style={{ boxShadow: '0 10px 30px -10px rgba(212, 175, 55, 0.2)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  Konsultasi Online
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
                Konsultasi Kerusakan &amp; Biaya
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Tanyakan estimasi biaya, ketersediaan suku cadang original, dan jadwal pengerjaan langsung pada teknisi workshop kami.
              </p>

              {/* Highlight Chip */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 mb-5">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-300 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Diagnosa 100% Gratis</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Pengecekan awal tanpa biaya bongkar sama sekali jika batal servis.
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/6281131858858?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20kerusakan%20smartphone%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat WhatsApp CS ↗</span>
            </a>
          </div>

          {/* CARD 2: WORKSHOP LOCATION */}
          <div 
            className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131b2e] border-2 border-rose-300/60 hover:border-rose-400 dark:border-rose-500/30 dark:hover:border-rose-500 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            style={{ boxShadow: '0 10px 30px -10px rgba(244, 63, 94, 0.15)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 dark:bg-rose-500/25 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                  Workshop Pusat
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
                Lokasi Workshop Malang
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang (Strategis dekat area kampus UB, UM, &amp; ITN).
              </p>

              {/* Highlight Chip */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 mb-5">
                <div className="text-xs font-black text-rose-900 dark:text-rose-300 mb-0.5">
                  Meja Lab Terbuka &amp; Ber-AC
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Parkir luas, free Wi-Fi, dan ruang tunggu nyaman sambil menonton pengerjaan teknisi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://maps.app.goo.gl/q7oQM5TJbKacRHKj7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-600 hover:to-rose-800 text-white font-black text-xs sm:text-sm shadow-md shadow-rose-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Navigation className="w-4 h-4" />
                <span>Petunjuk Arah Maps ↗</span>
              </a>
              <button
                type="button"
                onClick={copyAddress}
                className="px-3 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Salin Alamat Lengkap"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : 'Salin'}
              </button>
            </div>
          </div>

          {/* CARD 3: WARRANTY & AFTER-SALES */}
          <div 
            className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#131b2e] border-2 border-emerald-300/60 hover:border-emerald-400 dark:border-emerald-500/30 dark:hover:border-emerald-500 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            style={{ boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.15)' }}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                  Layanan Garansi
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-2">
                Klaim Garansi Servis Resmi
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Seluruh pengerjaan hardware dilindungi garansi resmi lab tertulis. Klaim kilat cukup sebutkan nomor tiket servis Anda.
              </p>

              {/* Highlight Chip */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 mb-5">
                <div className="text-xs font-black text-emerald-900 dark:text-emerald-300 mb-0.5">
                  Garansi Baterai 90 Hari (3 Bulan)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Layar &amp; Mesin 30 Hari, Software 7–14 Hari. Ganti unit baru gratis jika kendala kambuh.
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/6281131858858?text=Halo%20Admin%20Ngalam%20Fix%20Pro,%20saya%20ingin%20klaim%20garansi%20servis"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Klaim Garansi via WA ↗</span>
            </a>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. INTERACTIVE SECTION: FORMULIR KONSULTASI & PETA WORKSHOP */}
      {/* ======================================================== */}
      <section className="wrap max-w-6xl mx-auto px-4 mt-12 sm:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: FORMULIR KONSULTASI KILAT (7 COLS) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/20">
                Formulir Cepat
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
                Kirim Pertanyaan ke Teknisi Kami
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Isi data di bawah ini, pesan akan langsung terformat rapi dan terhubung ke WhatsApp CS kami.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172138] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172138] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tipe Smartphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: iPhone 13 / Samsung S23"
                    value={form.device}
                    onChange={(e) => setForm({ ...form, device: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172138] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Kendala Utama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ganti Baterai / LCD Retak"
                    value={form.problem}
                    onChange={(e) => setForm({ ...form, problem: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172138] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Keterangan Tambahan / Gejala Lainnya
                </label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan kronologi singkat kendala smartphone Anda..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#172138] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                ></textarea>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Respon teknisi langsung via WhatsApp resmi</span>
                </span>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Konsultasi ke WhatsApp ↗</span>
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT: INFO LOKASI, FASILITAS & JAM BUKA (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Box Alamat & Jam Kerja */}
            <div className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <b className="block text-sm font-black text-slate-900 dark:text-white mb-1">
                    Alamat Workshop Utama
                  </b>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang, Jawa Timur 65115.
                  </p>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold block mt-1">
                    Patokan: Dekat perempatan Ijen &amp; area kampus UB/UM.
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <b className="block text-sm font-black text-slate-900 dark:text-white mb-1">
                    Jam Operasional Servis
                  </b>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Senin s/d Minggu: <b>10.00 – 20.00 WIB</b> (Buka Setiap Hari).
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Konsultasi chat WhatsApp online aktif 24 jam.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <b className="block text-sm font-black text-slate-900 dark:text-white mb-1">
                    Fasilitas Ruang Tunggu Meja 1
                  </b>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Meja Lab Terbuka', 'Full AC', 'Free Wi-Fi', 'Free Charging', 'Free Diagnosa'].map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Banner Quick Booking Direct */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-600/15 border border-amber-400/60 dark:border-amber-500/30 p-5 sm:p-6 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <b className="text-sm font-black text-slate-950 dark:text-white block">
                  Sudah Tahu Kerusakan HP Anda?
                </b>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Gunakan formulir booking servis untuk dapat antrean Meja 1.
                </p>
              </div>

              <Link
                to="/pesan-servis"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <span>Pesan Servis ↗</span>
              </Link>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
