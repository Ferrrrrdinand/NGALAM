import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, Battery, Sparkles, UserCheck, Gem, 
  Zap, Cable, Camera, Volume2, Cpu, Microscope, X 
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
      icon: <Smartphone className="w-7 h-7 text-amber-500" />,
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
      icon: <Battery className="w-7 h-7 text-emerald-500" />,
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
      icon: <Sparkles className="w-7 h-7 text-sky-500" />,
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
      icon: <UserCheck className="w-7 h-7 text-purple-500" />,
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
      icon: <Smartphone className="w-7 h-7 text-blue-500" />,
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
      icon: <Gem className="w-7 h-7 text-rose-500" />,
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
      icon: <Zap className="w-7 h-7 text-amber-500" />,
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
      icon: <Cable className="w-7 h-7 text-emerald-500" />,
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
      icon: <Camera className="w-7 h-7 text-indigo-500" />,
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
      icon: <Volume2 className="w-7 h-7 text-cyan-500" />,
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
      icon: <Cpu className="w-7 h-7 text-emerald-500" />,
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
      icon: <Microscope className="w-7 h-7 text-rose-500" />,
      title: 'Reparasi Mesin Mati Total (Matot), IC & CPU Reball',
      desc: 'HP mati total korsleting tegangan tinggi, korsleting air (water damage), IC Power panas berlebih, RAM CPU retak solder, sinyal hilang baseband.',
      price: 'Rp 350.000',
      checks: ['Mikroskop Stereoskopis & Thermal Cam', 'Analisa Skematik Jalur PCB Motherboard', 'Garansi Resmi 30 Hari (1 Bulan)'],
      bookingUrl: '/pesan-servis?problem=matot'
    }
  ];

  const filtered = services.filter((s) => {
    const matchFilter = filter === 'all' || s.cat.includes(filter);
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      {/* HEADER SECTION LAYANAN */}
      <section className="services-hero-section">
        <div className="wrap">
          <div className="services-hero-badge">
            <span className="pulse-dot"></span>
            <span>SPESIALIS SMARTPHONE ANDROID &amp; APPLE IPHONE</span>
          </div>
          <h1>Katalog Lengkap Layanan Perbaikan</h1>
          <p>
            Semua perbaikan smartphone Android dan Apple iPhone dikerjakan oleh teknisi spesialis bersertifikasi di meja kerja transparan. Pengecekan awal 100% gratis, suku cadang original, dan garansi tertulis (khusus baterai 90 hari, servis lain 7–30 hari).
          </p>

          <div className="services-hero-highlights">
            <div className="highlight-item">
              <span className="h-icon"><Zap className="w-4 h-4 text-amber-500" /></span>
              <span>Bisa Ditunggu (30–60 Menit)</span>
            </div>
            <div className="highlight-item">
              <span className="h-icon"><Gem className="w-4 h-4 text-sky-500" /></span>
              <span>Suku Cadang Grade Original</span>
            </div>
            <div className="highlight-item">
              <span className="h-icon"><Sparkles className="w-4 h-4 text-emerald-500" /></span>
              <span>Garansi Baterai 90 Hari / Servis 7–30 Hari</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER & PENCARIAN LAYANAN */}
      <section className="services-filter-sticky">
        <div className="wrap">
          <div className="catalog-toolbar">
            <div className="category-tabs-bar" id="categoryTabs">
              {[
                { id: 'all', label: 'Semua Layanan (12)' },
                { id: 'iphone', label: 'Apple iPhone', icon: <Smartphone className="w-3.5 h-3.5 inline mr-1" /> },
                { id: 'android', label: 'Android Phone', icon: <Cpu className="w-3.5 h-3.5 inline mr-1" /> },
                { id: 'layar', label: 'Layar & Kaca', icon: <Gem className="w-3.5 h-3.5 inline mr-1" /> },
                { id: 'baterai', label: 'Baterai & Daya', icon: <Battery className="w-3.5 h-3.5 inline mr-1" /> },
                { id: 'mesin', label: 'Mesin & IC', icon: <Microscope className="w-3.5 h-3.5 inline mr-1" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilter(t.id)}
                  className={`cat-tab-btn flex items-center gap-1 ${filter === t.id ? 'active' : ''}`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="catalog-search-wrapper">
              <div className="search-icon-left">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input
                type="text"
                className="catalog-search-input"
                placeholder="Cari layanan (cth: LCD, Baterai, Face ID)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SERVICES CATALOG SECTION */}
      <main className="services-main-section wrap">
        <div className="catalog-status-bar">
          <div className="catalog-status-badge">
            <span className="catalog-status-dot"></span>
            <span>Menampilkan {filtered.length} dari 12 layanan spesialis</span>
          </div>
          <div>
            <span>Pengerjaan transparan &amp; bergaransi</span>
          </div>
        </div>

        <div className="services-grid-wrapper" id="servicesContainer">
          {filtered.map((s) => (
            <div key={s.id} className="servicecard">
              <div className="servicecard-header">
                <span className="service-cat-pill">{s.pill}</span>
                <span className="service-time-badge flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 inline" /> {s.time}
                </span>
              </div>
              <div className="service-icon-box flex items-center justify-center">{s.icon}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <div className="service-meta-box">
                <span className="price-label">Estimasi Biaya Mulai</span>
                <span className="price-amount">{s.price}</span>
              </div>
              <ul className="service-checklist">
                {s.checks.map((chk, idx) => (
                  <li key={idx}>
                    <span className="check-icon-svg">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span>{chk}</span>
                  </li>
                ))}
              </ul>
              <Link to={s.bookingUrl} className="btn small full">
                <span>Booking Servis Ini ↗</span>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}