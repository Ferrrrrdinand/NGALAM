import React, { useState } from 'react';
import { Zap, ShieldCheck, MessageSquare, MapPin } from 'lucide-react';

export default function Kontak() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* PAGE HERO SECTION */}
      <section className="kontak-hero">
        <div className="wrap">
          <div className="kontak-hero-badge">
            <span className="kontak-badge-dot"></span>
            <span>PUSAT BANTUAN &amp; LOKASI WORKSHOP RESMI</span>
            <span className="kontak-badge-city">KOTA MALANG</span>
          </div>

          <h1 className="kontak-hero-title">
            Ada yang Ingin Ditanyakan?<br />
            <span className="kontak-gradient-title">Tim Ahli Kami Siap Membantu.</span>
          </h1>

          <p className="kontak-hero-desc">
            Konsultasikan kendala HP Android atau iPhone Anda secara online atau datang langsung ke workshop kami. Pengecekan awal selalu <b>100% Gratis Tanpa Biaya Bongkar</b>.
          </p>

          <div className="kontak-status-bar">
            <div className="kontak-status-pill highlight-open flex items-center gap-1.5">
              <span style={{ display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
              <span>Workshop Buka Sekarang</span>
            </div>
            <div className="kontak-status-pill">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Senin – Minggu: 10.00 – 20.00 WIB</span>
            </div>
            <div className="kontak-status-pill flex items-center gap-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Respon Cepat Online &lt; 10 Menit</span>
            </div>
            <div className="kontak-status-pill flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Garansi Servis s/d 90 Hari</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 MAIN CONTACT CHANNELS */}
      <section className="kontak-cards-section wrap">
        <div className="kontak-grid">
          {/* CARD 1 */}
          <article className="kontak-card">
            <div>
              <div className="kontak-card-top">
                <div className="kontak-icon-box icon-box-map flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                </div>
                <span className="kontak-card-tag tag-map">Konsultasi Online</span>
              </div>
              <h2 className="kontak-card-title">Konsultasi Kerusakan &amp; Biaya</h2>
              <p className="kontak-card-desc">
                Ingin mengetahui estimasi biaya perbaikan atau ketersediaan suku cadang HP? Gunakan formulir konsultasi kilat online atau tanyakan langsung pada AI Asisten kami.
              </p>
              <div className="kontak-info-box">
                <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.98rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                  <span>Diagnosa 100% Gratis</span>
                </div>
                <div style={{ fontSize: '0.83rem', color: '#000000' }}>
                  Pengecekan awal tanpa biaya bongkar oleh teknisi lab tersertifikasi.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href="https://wa.me/6281330304321?text=Halo%20Ngalam%20Fix%20Pro,%20saya%20ingin%20konsultasi%20servis%20HP" target="_blank" rel="noopener noreferrer" className="btn-wa-action" style={{ padding: '12px 18px', fontSize: '0.92rem', flex: '1.2' }}>
                <span>Hubungi WhatsApp Kami ↗</span>
              </a>
            </div>
          </article>

          {/* CARD 2 */}
          <article className="kontak-card">
            <div>
              <div className="kontak-card-top">
                <div className="kontak-icon-box icon-box-map flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-rose-600" />
                </div>
                <span className="kontak-card-tag tag-map">Workshop Pusat</span>
              </div>
              <h2 className="kontak-card-title">Lokasi Workshop Malang</h2>
              <p className="kontak-card-desc">
                Jl. Galunggung, Gadingkasri, Kec. Klojen, Kota Malang, Jawa Timur (Dekat Area Kampus UB &amp; UM).
              </p>
              <div className="kontak-info-box">
                <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.98rem', marginBottom: '4px' }}>
                  Meja Lab Terbuka &amp; Ber-AC
                </div>
                <div style={{ fontSize: '0.83rem', color: '#000000' }}>
                  Parkir luas, free Wi-Fi, dan ruang tunggu nyaman sambil menonton pengerjaan unit HP Anda.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="https://maps.app.goo.gl/q7oQM5TJbKacRHKj7" target="_blank" rel="noopener noreferrer" className="btn small full" style={{ borderRadius: '12px', padding: '12px' }}>
                <span>Buka Google Maps ↗</span>
              </a>
            </div>
          </article>

          {/* CARD 3 */}
          <article className="kontak-card">
            <div>
              <div className="kontak-card-top">
                <div className="kontak-icon-box icon-box-map flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="kontak-card-tag tag-map">Layanan Garansi</span>
              </div>
              <h2 className="kontak-card-title">Klaim Garansi Servis</h2>
              <p className="kontak-card-desc">
                Seluruh pengerjaan perbaikan hardware dilindungi jaminan garansi resmi lab hingga 90 hari. Klaim mudah dengan nomor tiket servis Anda.
              </p>
              <div className="kontak-info-box">
                <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.98rem', marginBottom: '4px' }}>
                  Garansi s/d 90 Hari Tanpa Ribet
                </div>
                <div style={{ fontSize: '0.83rem', color: '#000000' }}>
                  Penggantian part ulang gratis jika kendala yang sama kambuh dalam masa garansi.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a href="https://wa.me/6281330304321?text=Halo%20Admin,%20saya%20ingin%20klaim%20garansi%20servis" target="_blank" rel="noopener noreferrer" className="btn small full outline" style={{ borderRadius: '12px', padding: '12px' }}>
                <span>Klaim Garansi via WA ↗</span>
              </a>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}