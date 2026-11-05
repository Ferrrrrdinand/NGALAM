import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, Battery, Sparkles, UserCheck, Gem, 
  Zap, Cable, Camera, Volume2, Cpu, Microscope, X,
  Search, CheckCircle2, ShieldCheck, ArrowRight, MessageCircle,
  Check, PhoneCall
} from 'lucide-react';

export default function Layanan() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const services = [
    {
      id: 'iphone-lcd',
      cat: ['iphone', 'layar'],
      pill: 'Apple iPhone',
      time: '45–90 Menit',
      icon: <Smartphone className="w-6 h-6 text-amber-500" />,
      title: 'Ganti Layar OLED Super Retina iPhone',
      desc: 'Solusi layar retak, garis hijau/putih (green screen), atau blank sentuh. Pemindahan modul IC TrueTone agar warna layar akurat dan ProMotion 120Hz aktif normal.',
      price: 'Rp 450.000',
      checks: ['Fitur TrueTone Tetap Aktif', 'Panel OLED Presisi High-Grade', 'Garansi Resmi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?type=iphone&problem=lcd'
    },
    {
      id: 'iphone-battery',
      cat: ['iphone', 'baterai'],
      pill: 'Apple iPhone',
      time: '30–60 Menit',
      icon: <Battery className="w-6 h-6 text-emerald-500" />,
      title: 'Ganti Baterai Original iPhone (High Capacity)',
      desc: 'Mengatasi baterai boros, indikator Service Recommended, atau mati saat persentase 20%. Sel baterai bersertifikasi dengan Battery Health 100% terbaca di pengaturan iOS.',
      price: 'Rp 280.000',
      checks: ['Battery Health 100% Aktif', 'Bebas Notifikasi Unknown Part', 'Garansi Resmi 90 Hari (3 Bulan)'],
      bookingUrl: '/pesan-servis?type=iphone&problem=baterai'
    },
    {
      id: 'iphone-backglass',
      cat: ['iphone'],
      pill: 'Apple iPhone',
      time: '2–3 Jam',
      icon: <Sparkles className="w-6 h-6 text-sky-500" />,
      title: 'Ganti Kaca Belakang (Backglass) Laser Machine',
      desc: 'Pembersihan kaca belakang pecah menggunakan mesin laser presisi dingin tanpa risiko merusak kumparan wireless charging MagSafe atau rangka internal.',
      price: 'Rp 250.000',
      checks: ['Teknologi Laser Dingin Presisi', 'MagSafe Tetap Berfungsi 100%', 'Garansi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?type=iphone&problem=backglass'
    },
    {
      id: 'iphone-faceid',
      cat: ['iphone', 'mesin'],
      pill: 'Apple iPhone',
      time: '1–2 Hari Kerja',
      icon: <UserCheck className="w-6 h-6 text-purple-500" />,
      title: 'Perbaikan Face ID & TrueDepth Sensor',
      desc: 'Face ID tidak berfungsi, tidak bisa mendeteksi wajah, atau dinonaktifkan setelah kena air. Perbaikan sensor dot projector dan flood illuminator secara presisi mikro.',
      price: 'Rp 350.000',
      checks: ['Peralatan Kalibrasi FaceID', 'Data Wajah Kembali Normal', 'Garansi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?type=iphone&problem=faceid'
    },
    {
      id: 'android-amoled',
      cat: ['android', 'layar'],
      pill: 'Android Phone',
      time: '1–2 Jam',
      icon: <Smartphone className="w-6 h-6 text-blue-500" />,
      title: 'Ganti Layar AMOLED & Super AMOLED Samsung / Xiaomi',
      desc: 'Penggantian layar panel Dynamic AMOLED & Super AMOLED berkecepatan 120Hz smooth. Mendukung pemindai sidik jari dalam layar (In-Display Fingerprint Scanner).',
      price: 'Rp 380.000',
      checks: ['Support Fingerprint Under-Display', 'Panel 120Hz Smooth Display', 'Garansi Resmi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?type=android&problem=lcd'
    },
    {
      id: 'android-glass-oca',
      cat: ['android', 'layar'],
      pill: 'Android Phone',
      time: '30–60 Menit',
      icon: <Gem className="w-6 h-6 text-rose-500" />,
      title: 'Ganti Kaca Layar Saja (Glass OCA Laminating)',
      desc: 'Layar luar retak seribu tapi sentuhan dan tampilan gambar masih normal? Ganti kaca luar saja menggunakan mesin vacuum OCA. Hemat biaya hingga 50%.',
      price: 'Rp 200.000',
      checks: ['Panel LCD / OLED Asli Tetap Dipakai', 'Hemat Biaya Hingga 50%', 'Garansi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?type=android&problem=glass_oca'
    },
    {
      id: 'android-battery',
      cat: ['android', 'baterai'],
      pill: 'Android Phone',
      time: '30–60 Menit',
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: 'Ganti Baterai Original Fast-Charging Android',
      desc: 'Baterai kembung membahayakan casing melengkung? Ganti baterai original bersertifikasi anti-drop yang mendukung Fast / Turbo / Dart / Flash Charging.',
      price: 'Rp 175.000',
      checks: ['Support Turbo & SuperVOOC Flash Charge', 'Sel Baru 100% Anti Kembung', 'Garansi Resmi 90 Hari (3 Bulan)'],
      bookingUrl: '/pesan-servis?type=android&problem=baterai'
    },
    {
      id: 'charging-port',
      cat: ['iphone', 'android', 'baterai'],
      pill: 'Semua Smartphone',
      time: '1–2 Jam',
      icon: <Cable className="w-6 h-6 text-emerald-500" />,
      title: 'Perbaikan Port Charger Type-C & Lightning',
      desc: 'HP tidak mau mengisi daya, kabel harus digoyang-goyang, konektor kemasukan kotoran atau korsleting air. Pergantian modul sub-board konektor original.',
      price: 'Rp 120.000',
      checks: ['Pengisian Arus Stabil & Aman', 'Jalur Data USB Terhubung PC', 'Garansi 14 Hari (2 Minggu)'],
      bookingUrl: '/pesan-servis?problem=charging'
    },
    {
      id: 'camera-module',
      cat: ['iphone', 'android'],
      pill: 'Semua Smartphone',
      time: '2–4 Jam',
      icon: <Camera className="w-6 h-6 text-indigo-500" />,
      title: 'Perbaikan Modul Kamera & Kaca Lensa Kamera',
      desc: 'Kamera bergetar saat buka aplikasi, gambar buram/blur tidak bisa fokus, hasil foto bintik hitam, atau kaca pelindung luar lensa pecah retak.',
      price: 'Rp 150.000',
      checks: ['Stabilizer OIS Kembali Mulus', 'Kaca Sapphire Anti Gores', 'Garansi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?problem=camera'
    },
    {
      id: 'audio-speaker',
      cat: ['iphone', 'android'],
      pill: 'Semua Smartphone',
      time: '2–3 Jam',
      icon: <Volume2 className="w-6 h-6 text-cyan-500" />,
      title: 'Perbaikan Speaker Suara & Mikrofon Telepon',
      desc: 'Suara telepon kecil, speaker musik kresek-kresek, suara lawan bicara tidak terdengar saat nelpon WhatsApp, atau mic rekaman audio mati total.',
      price: 'Rp 110.000',
      checks: ['Pembersihan Sonic & Grill Mesh', 'Suara Jernih & Bass Bulat', 'Garansi 14 Hari (2 Minggu)'],
      bookingUrl: '/pesan-servis?problem=audio'
    },
    {
      id: 'software-flash',
      cat: ['iphone', 'android', 'mesin'],
      pill: 'Semua Smartphone',
      time: '30–45 Menit',
      icon: <Cpu className="w-6 h-6 text-emerald-500" />,
      title: 'Software, Flash Ulang, Unbrick & Bootloop',
      desc: 'HP mentok di logo merek, gagal update sistem, penyimpanan penuh crash restart berulang, lupa pola/PIN sandi, dan pembersihan malware/iklan pop-up.',
      price: 'Rp 100.000',
      checks: ['Sistem Firmware Resmi Pabrikan', 'Solusi Bootloop Tanpa Ganti Mesin', 'Garansi 7 Hari (1 Minggu)'],
      bookingUrl: '/pesan-servis?problem=software'
    },
    {
      id: 'matot-ic-cpu',
      cat: ['iphone', 'android', 'mesin'],
      pill: 'Lab Mikro-Soldering',
      time: '1–3 Hari Kerja',
      icon: <Microscope className="w-6 h-6 text-rose-500" />,
      title: 'Reparasi Mesin Mati Total (Matot), IC & CPU Reball',
      desc: 'HP mati total korsleting tegangan tinggi, korsleting air (water damage), IC Power panas berlebih, RAM CPU retak solder, sinyal hilang baseband.',
      price: 'Rp 350.000',
      checks: ['Mikroskop Stereoskopis & Thermal Cam', 'Analisa Skematik Jalur PCB Motherboard', 'Garansi Resmi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?problem=matot'
    }
  ];

  const categories = [
    { id: 'all', label: 'Semua Layanan', icon: null },
    { id: 'iphone', label: 'Apple iPhone', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { id: 'android', label: 'Android Phone', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'layar', label: 'Layar & Kaca', icon: <Gem className="w-3.5 h-3.5" /> },
    { id: 'baterai', label: 'Baterai & Daya', icon: <Battery className="w-3.5 h-3.5" /> },
    { id: 'mesin', label: 'Mesin & IC', icon: <Microscope className="w-3.5 h-3.5" /> },
  ];

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return services.length;
    return services.filter(s => s.cat.includes(catId)).length;
  };

  const filtered = services.filter((s) => {
    const matchFilter = filter === 'all' || s.cat.includes(filter);
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="bg-[#fcfbf7] dark:bg-[#0b0f19] min-h-screen text-slate-900 dark:text-slate-100 pb-20">
      {/* ======================================================== */}
      {/* 1. HERO HEADER SECTION (LUXURY BRANDING) */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/12 via-amber-400/5 to-transparent pt-8 pb-8 sm:pt-14 sm:pb-12 border-b border-amber-200/40 dark:border-amber-500/20">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 right-1/4 -mt-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 -ml-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"></div>

        <div className="wrap max-w-5xl mx-auto px-4 text-center relative z-10">
          
          {/* Official Workshop Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-600/20 border border-amber-400/60 text-amber-950 dark:text-amber-300 shadow-2xs mb-3.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Spesialis Servis iPhone &amp; Android Resmi di Malang</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight leading-tight mb-3">
            Katalog Lengkap Layanan Perbaikan
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
            Semua perbaikan smartphone Android &amp; iPhone dikerjakan presisi oleh teknisi bersertifikasi di meja kerja transparan. Pengecekan awal 100% gratis dengan jaminan garansi tertulis.
          </p>

          {/* 4 Feature Highlights Chips */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span>Bisa Ditunggu (30–60 Mnt)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500 shrink-0" />
              <span>Suku Cadang Grade Original</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span>Garansi Baterai 90 Hari</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#131b2e] border border-amber-200/80 dark:border-amber-500/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
              <span>Diagnosa Awal 100% Gratis</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. STICKY TOOLBAR: SWIPEABLE CATEGORIES & LIVE SEARCH */}
      {/* ======================================================== */}
      <section className="sticky top-16 z-30 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-amber-200/60 dark:border-amber-500/20 shadow-xs py-3">
        <div className="wrap max-w-6xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Horizontal Swipeable Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
            {categories.map((t) => {
              const isActive = filter === t.id;
              const count = getCategoryCount(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-md shadow-amber-500/25'
                      : 'bg-white dark:bg-[#131b2e] hover:bg-amber-50/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-300 shadow-2xs'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari layanan (cth: LCD, Baterai)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-[#172138] rounded-xl border border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MAIN CATALOG GRID: MODERN LUXURY SERVICE CARDS */}
      {/* ======================================================== */}
      <main className="wrap max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Status Count Bar */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold mb-6 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Menampilkan <b>{filtered.length}</b> layanan spesialis</span>
          </div>
          <span className="hidden sm:inline-block text-amber-700 dark:text-amber-400 font-bold">
            ✨ Meja Transparan • Bisa Ditunggu • Garansi Tertulis
          </span>
        </div>

        {/* The Grid of Service Cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filtered.map((s) => (
              <div 
                key={s.id} 
                className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/90 dark:border-slate-800 hover:border-amber-400/80 dark:hover:border-amber-500/50 p-5 sm:p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  boxShadow: '0 4px 20px -5px rgba(15, 23, 42, 0.05)'
                }}
              >
                <div>
                  {/* Top Row: Category Tag & Estimated Time */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                      {s.pill}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{s.time}</span>
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3.5 mb-2.5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 via-amber-400/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      {s.icon}
                    </div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {s.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {s.desc}
                  </p>

                  {/* Feature Checklist */}
                  <ul className="space-y-1.5 mb-5 text-xs text-slate-700 dark:text-slate-300 font-medium border-t border-slate-100 dark:border-slate-800 pt-3">
                    {s.checks.map((chk, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Row: Price & Action Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 leading-tight">
                      Mulai Dari
                    </span>
                    <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                      {s.price}
                    </span>
                  </div>

                  <Link
                    to={s.bookingUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Booking Servis ↗</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs max-w-md mx-auto">
            <span className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3 text-2xl">
              🔍
            </span>
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-1">
              Layanan Tidak Ditemukan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tidak ada hasil untuk kata kunci "{search}". Coba kata kunci lain atau konsultasikan langsung via WhatsApp.
            </p>
            <button
              type="button"
              onClick={() => { setSearch(''); setFilter('all'); }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs cursor-pointer transition-colors"
            >
              Reset Filter &amp; Pencarian
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. WORKFLOW PROCESS STEPS: TRANSPARAN & CEPAT */}
        {/* ======================================================== */}
        <section className="mt-14 sm:mt-20 pt-10 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/20">
              Prosedur Servis Resmi
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-950 dark:text-white mt-2">
              4 Langkah Mudah Servis di Ngalam Fix Pro
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pengerjaan transparan di depan Anda tanpa risiko komponen tertukar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                num: '01',
                title: 'Konsultasi & Cek Awal',
                desc: 'Diagnosa kerusakan gratis langsung di depan meja teknisi tanpa biaya bongkar.'
              },
              {
                num: '02',
                title: 'Transparansi Estimasi',
                desc: 'Konfirmasi total biaya dan ketersediaan suku cadang resmi sebelum pengerjaan dimulai.'
              },
              {
                num: '03',
                title: 'Pengerjaan Cepat',
                desc: 'Bisa ditonton langsung di meja transparan, durasi rata-rata hanya 30–60 menit.'
              },
              {
                num: '04',
                title: 'QC 24 Titik & Garansi',
                desc: 'Pengecekan fungsi menyeluruh dan penerbitan nota garansi resmi tertulis.'
              }
            ].map((step, idx) => (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
                <span className="text-2xl font-black text-amber-500/30 block mb-1">
                  {step.num}
                </span>
                <b className="text-sm font-bold text-slate-900 dark:text-white block mb-1">
                  {step.title}
                </b>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. CONSULTATION CALLOUT BANNER (KENDALA KHUSUS) */}
        {/* ======================================================== */}
        <section 
          className="mt-10 sm:mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
          style={{
            boxShadow: '0 20px 50px -15px rgba(212, 175, 55, 0.2)'
          }}
        >
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Punya Kerusakan Khusus Lainnya?</span>
            </span>
            <h3 className="text-lg sm:text-2xl font-black text-white">
              Tidak Menemukan Kendala HP Anda di Daftar?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Kami juga menangani reparasi casing bengkok, pemulihan data memori, ganti housing &amp; frame, bypass kendala software, serta konsultasi suku cadang langka.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <a
              href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20kerusakan%20smartphone%20saya"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Konsultasi WA Teknisi ↗</span>
            </a>

            <Link
              to="/pesan-servis"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 hover:border-amber-400/50 transition-all cursor-pointer"
            >
              <span>Booking Antrean Online</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
